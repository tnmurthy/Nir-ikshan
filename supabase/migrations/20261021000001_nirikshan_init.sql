-- =============================================================================
-- Nir-ikshan: hardened complaint schema (replaces supabase_schema.sql)
--
-- Security model
--   * citizen_complaints  : public-readable, contains NO personal data
--   * complaint_pii       : name/phone/age/gender, readable only by the reporter
--                           and by officials of that district
--   * complaint_events    : append-only status history (the accountability ledger)
--   * Writes              : citizens insert their own complaint (status SUBMITTED);
--                           only officials update, scoped to their district, and
--                           only along allowed status transitions
--
-- Roles live in auth.users.raw_app_meta_data (set server-side, never by clients):
--   { "role": "admin" | "nodal" | "inspector" | "engineer", "district": "Vizianagaram" }
-- Citizens use Supabase anonymous sign-in (no role) until SMS OTP is set up.
-- =============================================================================

-- ---------- helpers -----------------------------------------------------------
create or replace function public.app_role() returns text
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'citizen')
$$;

create or replace function public.app_district() returns text
language sql stable as $$
  select auth.jwt() -> 'app_metadata' ->> 'district'
$$;

create or replace function public.is_official() returns boolean
language sql stable as $$
  select public.app_role() in ('admin', 'nodal', 'inspector', 'engineer')
$$;

-- An official may act on a district if they are admin or assigned to that district
create or replace function public.can_act_on(d text) returns boolean
language sql stable as $$
  select public.app_role() = 'admin'
      or (public.is_official() and public.app_district() = d)
$$;

-- ---------- tables -------------------------------------------------------------
create table if not exists public.citizen_complaints (
  id                        text primary key,
  reporter_uid              uuid not null default auth.uid(),
  state                     text not null default 'Andhra Pradesh',
  district                  text not null,
  mandal                    text not null default '',
  village                   text not null default '',
  location_landmark         text not null default '',
  coordinates               jsonb,
  waste_type                text,
  short_description         text not null default '' check (char_length(short_description) <= 2000),
  photo_url                 text check (photo_url is null or char_length(photo_url) <= 2048),
  submitted_at              timestamptz not null default now(),
  status                    text not null default 'SUBMITTED' check (status in (
                              'SUBMITTED','INSPECTOR_ASSIGNED','INSPECTION_COMPLETED','ACTION_ASSIGNED',
                              'WORKER_IN_PROGRESS','VERIFICATION_PENDING','RESOLVED','REJECTED')),
  assigned_nodal_officer    text,
  assigned_inspector        text,
  assigned_inspector_phone  text,
  assigned_engineer         text,
  assigned_engineer_phone   text,
  inspection_report         jsonb,
  work_execution            jsonb,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists idx_cc_district   on public.citizen_complaints (district);
create index if not exists idx_cc_status     on public.citizen_complaints (status);
create index if not exists idx_cc_submitted  on public.citizen_complaints (submitted_at desc);
create index if not exists idx_cc_reporter   on public.citizen_complaints (reporter_uid);

create table if not exists public.complaint_pii (
  complaint_id    text primary key references public.citizen_complaints (id) on delete cascade,
  reporter_uid    uuid not null default auth.uid(),
  citizen_name    text not null check (char_length(citizen_name) <= 120),
  citizen_phone   text check (citizen_phone is null or citizen_phone ~ '^[0-9+ ]{10,15}$'),
  citizen_age     int  check (citizen_age is null or citizen_age between 5 and 120),
  citizen_gender  text check (citizen_gender is null or citizen_gender in ('Male','Female','Other')),
  created_at      timestamptz not null default now()
);

create table if not exists public.complaint_events (
  id            bigserial primary key,
  complaint_id  text not null references public.citizen_complaints (id) on delete cascade,
  actor_uid     uuid default auth.uid(),
  actor_role    text default public.app_role(),
  from_status   text,
  to_status     text not null,
  at            timestamptz not null default now()
);
create index if not exists idx_ce_complaint on public.complaint_events (complaint_id, at);

-- ---------- status workflow guard + audit ---------------------------------------
create or replace function public.guard_complaint_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  allowed text[];
begin
  -- identity and location are immutable after submission
  if new.id <> old.id or new.reporter_uid <> old.reporter_uid or new.district <> old.district
     or new.submitted_at <> old.submitted_at then
    raise exception 'complaint identity/location fields are read-only';
  end if;

  if new.status is distinct from old.status and public.app_role() <> 'admin' then
    allowed := case old.status
      when 'SUBMITTED'            then array['INSPECTOR_ASSIGNED','REJECTED']
      when 'INSPECTOR_ASSIGNED'   then array['INSPECTION_COMPLETED']
      when 'INSPECTION_COMPLETED' then array['ACTION_ASSIGNED','WORKER_IN_PROGRESS','REJECTED']
      when 'ACTION_ASSIGNED'      then array['WORKER_IN_PROGRESS']
      when 'WORKER_IN_PROGRESS'   then array['VERIFICATION_PENDING']
      when 'VERIFICATION_PENDING' then array['RESOLVED','WORKER_IN_PROGRESS']
      else array[]::text[]
    end;
    if not (new.status = any (allowed)) then
      raise exception 'status change % -> % not allowed', old.status, new.status;
    end if;
  end if;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_guard_complaint_update on public.citizen_complaints;
create trigger trg_guard_complaint_update before update on public.citizen_complaints
  for each row execute function public.guard_complaint_update();

create or replace function public.log_complaint_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.complaint_events (complaint_id, from_status, to_status) values (new.id, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.complaint_events (complaint_id, from_status, to_status) values (new.id, old.status, new.status);
  end if;
  return new;
end $$;

drop trigger if exists trg_log_complaint_event on public.citizen_complaints;
create trigger trg_log_complaint_event after insert or update on public.citizen_complaints
  for each row execute function public.log_complaint_event();

-- ---------- row level security ---------------------------------------------------
alter table public.citizen_complaints enable row level security;
alter table public.complaint_pii      enable row level security;
alter table public.complaint_events   enable row level security;

-- complaints: public read (no personal data in this table)
drop policy if exists cc_public_read on public.citizen_complaints;
create policy cc_public_read on public.citizen_complaints for select using (true);

-- complaints: any signed-in user (including anonymous citizens) may file their own
drop policy if exists cc_citizen_insert on public.citizen_complaints;
create policy cc_citizen_insert on public.citizen_complaints for insert to authenticated
  with check (reporter_uid = auth.uid() and status = 'SUBMITTED'
              and assigned_inspector is null and assigned_engineer is null
              and inspection_report is null and work_execution is null);

-- complaints: only officials of that district update
drop policy if exists cc_official_update on public.citizen_complaints;
create policy cc_official_update on public.citizen_complaints for update to authenticated
  using (public.can_act_on(district)) with check (public.can_act_on(district));

-- no deletes from clients (no policy = denied)

-- PII: reporter inserts and reads own; officials of the district read
drop policy if exists pii_insert_own on public.complaint_pii;
create policy pii_insert_own on public.complaint_pii for insert to authenticated
  with check (reporter_uid = auth.uid()
              and exists (select 1 from public.citizen_complaints c
                          where c.id = complaint_id and c.reporter_uid = auth.uid()));

drop policy if exists pii_read on public.complaint_pii;
create policy pii_read on public.complaint_pii for select to authenticated
  using (reporter_uid = auth.uid()
         or exists (select 1 from public.citizen_complaints c
                    where c.id = complaint_id and public.can_act_on(c.district)));

-- events: public, read-only (written only by the trigger)
drop policy if exists ce_public_read on public.complaint_events;
create policy ce_public_read on public.complaint_events for select using (true);

-- ---------- realtime (public table only; PII never broadcast) ----------------------
do $$ begin
  alter publication supabase_realtime add table public.citizen_complaints;
exception when duplicate_object then null; end $$;

-- ---------- storage for complaint photos ------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('complaint-photos', 'complaint-photos', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists photos_upload_own on storage.objects;
create policy photos_upload_own on storage.objects for insert to authenticated
  with check (bucket_id = 'complaint-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- assigning official roles (run manually, server-side) --------------------
-- update auth.users
--   set raw_app_meta_data = raw_app_meta_data || '{"role":"nodal","district":"Vizianagaram"}'::jsonb
--   where email = 'nodal.vzm@example.gov.in';
