/**
 * Supabase data access for complaints.
 *
 * Two modes:
 *  - Cloud mode: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set and VITE_DEMO_MODE != "true".
 *    Data is protected by RLS (see supabase/migrations). Personal data lives in complaint_pii.
 *  - Demo mode: no Supabase config (or VITE_DEMO_MODE=true). Everything stays in this browser.
 *
 * Config comes only from build-time env vars. Keys are never read from localStorage or window.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CitizenComplaint } from '../types/nirikshan';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

export const isSupabaseConfigured = (): boolean =>
  SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;

/** Demo mode keeps the old simulated OTP and local-only data. Never enable on a public pilot. */
export const isDemoMode = (): boolean =>
  !isSupabaseConfigured() || import.meta.env.VITE_DEMO_MODE === 'true';

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

const COMPLAINT_COLUMNS =
  'id, reporter_uid, state, district, mandal, village, location_landmark, coordinates, waste_type, short_description, photo_url, submitted_at, status, assigned_nodal_officer, assigned_inspector, assigned_inspector_phone, assigned_engineer, assigned_engineer_phone, inspection_report, work_execution';

interface PiiRow {
  complaint_id: string;
  citizen_name: string;
  citizen_phone: string | null;
  citizen_age: number | null;
  citizen_gender: 'Male' | 'Female' | 'Other' | null;
}

/** Maps a public complaint row (+ optional PII row) to the app model. Missing PII stays empty. */
export function mapRowToComplaint(row: any, pii?: PiiRow): CitizenComplaint {
  return {
    id: row.id,
    reporterUid: row.reporter_uid || undefined,
    citizenName: pii?.citizen_name || '',
    citizenAge: pii?.citizen_age ?? 0,
    citizenGender: pii?.citizen_gender || 'Other',
    citizenPhone: pii?.citizen_phone || '',
    state: row.state || 'Andhra Pradesh',
    district: row.district,
    mandal: row.mandal || '',
    village: row.village || '',
    locationLandmark: row.location_landmark || '',
    coordinates: row.coordinates && typeof row.coordinates === 'object' ? row.coordinates : undefined,
    wasteType: row.waste_type || undefined,
    shortDescription: row.short_description || '',
    photoUrl: row.photo_url || undefined,
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString().replace('T', ' ').slice(0, 19) : '',
    status: row.status || 'SUBMITTED',
    assignedNodalOfficer: row.assigned_nodal_officer || 'District Nodal Officer',
    assignedInspector: row.assigned_inspector || undefined,
    assignedInspectorPhone: row.assigned_inspector_phone || undefined,
    assignedEngineer: row.assigned_engineer || undefined,
    assignedEngineerPhone: row.assigned_engineer_phone || undefined,
    inspectionReport: row.inspection_report || undefined,
    workExecution: row.work_execution || undefined,
  } as CitizenComplaint;
}

/** Keep personal fields we already have when a public-only row (e.g. realtime event) arrives. */
export function mergeKeepingPii(prev: CitizenComplaint | undefined, next: CitizenComplaint): CitizenComplaint {
  if (!prev) return next;
  return {
    ...next,
    citizenName: next.citizenName || prev.citizenName,
    citizenPhone: next.citizenPhone || prev.citizenPhone,
    citizenAge: next.citizenAge || prev.citizenAge,
    citizenGender: next.citizenName ? next.citizenGender : prev.citizenGender,
  };
}

/** Columns an official may change. Identity, location and reporter are immutable (also enforced in SQL). */
function workflowColumns(c: CitizenComplaint) {
  return {
    status: c.status,
    assigned_nodal_officer: c.assignedNodalOfficer || null,
    assigned_inspector: c.assignedInspector || null,
    assigned_inspector_phone: c.assignedInspectorPhone || null,
    assigned_engineer: c.assignedEngineer || null,
    assigned_engineer_phone: c.assignedEngineerPhone || null,
    inspection_report: c.inspectionReport || null,
    work_execution: c.workExecution || null,
  };
}

export async function fetchComplaints(): Promise<CitizenComplaint[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('citizen_complaints')
    .select(COMPLAINT_COLUMNS)
    .order('submitted_at', { ascending: false })
    .limit(1000);
  if (error) {
    console.error('[supabase] fetch complaints failed:', error.message);
    return null;
  }

  // RLS returns only the PII rows this user may see (own complaints, or their district if official)
  const piiById = new Map<string, PiiRow>();
  const { data: session } = await supabase.auth.getSession();
  if (session.session) {
    const { data: pii } = await supabase
      .from('complaint_pii')
      .select('complaint_id, citizen_name, citizen_phone, citizen_age, citizen_gender');
    for (const p of (pii as PiiRow[] | null) ?? []) piiById.set(p.complaint_id, p);
  }
  return (data ?? []).map((row) => mapRowToComplaint(row, piiById.get((row as any).id)));
}

/** Upload a data-URL photo to Storage; returns a public URL (or the input if it is already a URL). */
async function uploadPhotoIfNeeded(uid: string, complaintId: string, photoUrl?: string): Promise<string | null> {
  if (!supabase || !photoUrl) return null;
  if (!photoUrl.startsWith('data:')) return photoUrl;
  const match = photoUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) return null;
  const [, mime, b64] = match;
  const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
  if (bytes.byteLength > 2 * 1024 * 1024) throw new Error('Photo is larger than 2 MB');
  const ext = mime.split('/')[1];
  const path = `${uid}/${complaintId}.${ext}`;
  const { error } = await supabase.storage.from('complaint-photos').upload(path, bytes, { contentType: mime, upsert: false });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return supabase.storage.from('complaint-photos').getPublicUrl(path).data.publicUrl;
}

/** Citizen files a new complaint: public row first, then the PII row. */
export async function createComplaint(c: CitizenComplaint): Promise<CitizenComplaint> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) throw new Error('Not signed in');

  const photoUrl = await uploadPhotoIfNeeded(uid, c.id, c.photoUrl);
  const { error } = await supabase.from('citizen_complaints').insert({
    id: c.id,
    reporter_uid: uid,
    state: c.state || 'Andhra Pradesh',
    district: c.district,
    mandal: c.mandal,
    village: c.village,
    location_landmark: c.locationLandmark,
    coordinates: c.coordinates ?? null,
    waste_type: c.wasteType ?? null,
    short_description: c.shortDescription,
    photo_url: photoUrl,
    status: 'SUBMITTED',
    assigned_nodal_officer: c.assignedNodalOfficer || null,
  });
  if (error) throw new Error(`Could not submit complaint: ${error.message}`);

  const { error: piiError } = await supabase.from('complaint_pii').insert({
    complaint_id: c.id,
    reporter_uid: uid,
    citizen_name: c.citizenName,
    citizen_phone: c.citizenPhone ? c.citizenPhone.replace(/[^0-9+ ]/g, '') : null,
    citizen_age: c.citizenAge || null,
    citizen_gender: c.citizenGender || null,
  });
  if (piiError) console.error('[supabase] contact details not saved:', piiError.message);

  return { ...c, reporterUid: uid, photoUrl: photoUrl ?? undefined };
}

/** Official updates workflow fields. RLS + trigger reject out-of-district or invalid transitions. */
export async function updateComplaintWorkflow(c: CitizenComplaint): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('citizen_complaints').update(workflowColumns(c)).eq('id', c.id);
  if (error) throw new Error(error.message);
}

export function subscribeToComplaints(
  onInsert: (complaint: CitizenComplaint) => void,
  onUpdate: (complaint: CitizenComplaint) => void
) {
  const client = supabase;
  if (!client) return () => {};
  const channel = client
    .channel('complaints-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'citizen_complaints' }, (payload) => {
      if (payload.new) onInsert(mapRowToComplaint(payload.new));
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'citizen_complaints' }, (payload) => {
      if (payload.new) onUpdate(mapRowToComplaint(payload.new));
    })
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
