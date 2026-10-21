# Nir-ikshan — secure cloud setup (Supabase + Vercel)

Without Supabase env vars the app runs in **demo mode**: sample data, simulated OTP, everything stored only in the visitor's browser, and an amber "Demo mode" banner. Use the steps below before any real citizen or officer uses it.

## 1. Supabase project (one-time, ~20 min)

1. Create a **dedicated** project (region `ap-south-1`, Mumbai). Do not share it with other products: it will hold citizens' personal data (DPDP Act 2023).
2. SQL editor → run `supabase/migrations/20261021000001_nirikshan_init.sql`.
3. Authentication → Sign In / Providers:
   - Enable **Anonymous sign-ins** (citizens).
   - Email: enable, keep "Confirm email" on, **disable "Allow new users to sign up"** (officers are created by the admin only).
4. Authentication → URL configuration: set Site URL to the production domain.

## 2. Create officer accounts

Authentication → Users → *Add user* (email, auto-confirm). Then assign role and district in the SQL editor:

```sql
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
  where email = 'state.admin@example.gov.in';

update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"nodal","district":"Vizianagaram"}'::jsonb
  where email = 'nodal.vzm@example.gov.in';
-- roles: admin | nodal | inspector | engineer
-- district must match exactly: Vizianagaram | Parvathipuram Manyam | Visakhapatnam
```

Officers sign in at `/console` with an emailed 6-digit code. A user without a role is signed out automatically.

## 3. Vercel environment variables

| Variable | Scope | Value |
|---|---|---|
| `VITE_SUPABASE_URL` | Production + Preview | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Production + Preview | anon / publishable key (never the service-role key) |
| `VITE_DEMO_MODE` | Preview only (optional) | `true` for sales demos |
| `BHUVAN_API_TOKEN` | Production | Bhuvan token (server-side) |
| `ALLOWED_ORIGIN` | Production | `https://<your-domain>` |

Remove any old `VITE_BHUVAN_API_TOKEN` variable — `VITE_` values are visible to every visitor.

## What the database enforces

| Rule | Where |
|---|---|
| Anyone can read complaint status; no personal data in that table | `citizen_complaints` RLS |
| Name/phone/age/gender readable only by the reporter and officers of that district | `complaint_pii` RLS |
| Citizens can only create their own complaint, status `SUBMITTED` | insert policy |
| Only officers of the complaint's district (or admin) can update it | update policy |
| Status can only move along the workflow; identity/location fields are read-only | `guard_complaint_update` trigger |
| Every status change is recorded, append-only | `complaint_events` + trigger |
| Photos ≤ 2 MB, images only, uploaded to the reporter's own folder | `complaint-photos` bucket |

## Known gaps (next)

- Citizen mobile numbers are **not verified** yet. Switch to Supabase phone OTP once a DLT-registered SMS sender (MSG91 / Twilio / Textlocal) is approved.
- Rate limiting of anonymous sign-ins: enable Supabase CAPTCHA (hCaptcha / Turnstile) before a public launch.
