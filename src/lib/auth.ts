/**
 * Authentication helpers (cloud mode).
 *  - Officials: email one-time code. Accounts are pre-created by an admin; role and district
 *    are set in app_metadata server-side (see migration footer). Clients can never change them.
 *  - Citizens: Supabase anonymous sign-in, so every complaint has an owner uid for RLS.
 *    Upgrade to phone OTP once a DLT-registered SMS sender is configured.
 */
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type OfficialRole = 'admin' | 'nodal' | 'inspector' | 'engineer';

export interface OfficialSession {
  uid: string;
  email: string;
  role: OfficialRole;
  district: string | null;
}

const OFFICIAL_ROLES: OfficialRole[] = ['admin', 'nodal', 'inspector', 'engineer'];

export function officialFromSession(session: Session | null): OfficialSession | null {
  const user = session?.user;
  if (!user || user.is_anonymous) return null;
  const role = (user.app_metadata?.role as OfficialRole | undefined) ?? undefined;
  if (!role || !OFFICIAL_ROLES.includes(role)) return null;
  return {
    uid: user.id,
    email: user.email ?? '',
    role,
    district: (user.app_metadata?.district as string | undefined) ?? null,
  };
}

export async function sendOfficialCode(email: string): Promise<void> {
  if (!supabase) throw new Error('Sign-in is not configured');
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: false },
  });
  if (error) throw new Error(error.message);
}

export async function verifyOfficialCode(email: string, code: string): Promise<OfficialSession> {
  if (!supabase) throw new Error('Sign-in is not configured');
  const { data, error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
  if (error) throw new Error(error.message);
  const official = officialFromSession(data.session);
  if (!official) {
    await supabase.auth.signOut();
    throw new Error('This account has no officer role. Contact the state admin.');
  }
  return official;
}

/** Ensure the citizen has a session (anonymous) so their complaint can be owned and tracked. */
export async function ensureCitizenSession(): Promise<string> {
  if (!supabase) throw new Error('Sign-in is not configured');
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error || !anon.user) throw new Error(error?.message || 'Could not start a session');
  return anon.user.id;
}

export async function signOutEverywhere(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}
