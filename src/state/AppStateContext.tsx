/**
 * Global application state: complaints, water bodies, officers, citizen session
 * and the complaint workflow handlers. Moved out of App.tsx so that every route
 * reads the same state without prop-drilling through a role switch.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  WaterBody,
  CitizenComplaint,
  OfficerContact,
  InspectorReport,
  EngineerWorkExecution,
} from '../types/nirikshan';
import {
  INITIAL_WATER_BODIES,
  INITIAL_OFFICER_CONTACTS,
  SAMPLE_CITIZEN_COMPLAINTS,
} from '../data/nirikshanData';
import {
  isSupabaseConfigured,
  fetchComplaintsFromSupabase,
  saveComplaintToSupabase,
  subscribeToComplaints,
} from '../lib/supabase';

export interface CitizenSession {
  name: string;
  phone: string;
}

interface AppState {
  waterBodies: WaterBody[];
  complaints: CitizenComplaint[];
  officers: OfficerContact[];
  currentUser: CitizenSession | null;
  isLoggedIn: boolean;
  lastSubmittedId: string | null;

  // global overlays
  isOtpModalOpen: boolean;
  openOtpModal: () => void;
  closeOtpModal: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;

  // session
  login: (user: CitizenSession) => void;
  logout: () => void;

  // workflow
  submitComplaint: (c: CitizenComplaint) => void;
  assignInspector: (id: string, name: string, phone: string) => void;
  submitInspectionReport: (id: string, report: InspectorReport) => void;
  assignEngineer: (id: string, name: string, phone: string, deadline: string) => void;
  acceptTask: (id: string, beforePhotoUrl: string) => void;
  blockTask: (id: string, reason: string) => void;
  completeTask: (id: string, afterPhotoUrl: string, workSummary: string) => void;
  submitPostWorkVerification: (id: string, ok: boolean, photoUrl: string, remarks: string) => void;
  updateComplaint: (c: CitizenComplaint) => void;
  refreshFromCloud: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const dedupe = (list: CitizenComplaint[]) => {
  const map = new Map<string, CitizenComplaint>();
  for (const c of list) if (c?.id && !map.has(c.id)) map.set(c.id, c);
  return Array.from(map.values());
};

const loadInitialComplaints = (): CitizenComplaint[] => {
  const saved = readJson<CitizenComplaint[]>('nir_complaints', []);
  if (!Array.isArray(saved) || saved.length === 0) return SAMPLE_CITIZEN_COMPLAINTS;
  const map = new Map<string, CitizenComplaint>();
  for (const s of SAMPLE_CITIZEN_COMPLAINTS) map.set(s.id, s);
  for (const c of saved) if (c?.id && !c.id.startsWith('CMP-AP-2026-10')) map.set(c.id, c);
  return Array.from(map.values());
};

const today = () => new Date().toISOString().slice(0, 10);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [waterBodies] = useState<WaterBody[]>(() => readJson('nir_water_bodies', INITIAL_WATER_BODIES));
  const [complaints, setComplaints] = useState<CitizenComplaint[]>(loadInitialComplaints);
  const [officers] = useState<OfficerContact[]>(INITIAL_OFFICER_CONTACTS);
  const [currentUser, setCurrentUser] = useState<CitizenSession | null>(() => readJson('nir_user', null));
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
  const [isOtpModalOpen, setOtpOpen] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // Persist the local cache in one place instead of inside every handler
  useEffect(() => {
    try {
      localStorage.setItem('nir_complaints', JSON.stringify(complaints));
    } catch {
      /* quota exceeded or private mode */
    }
  }, [complaints]);

  useEffect(() => {
    try {
      localStorage.setItem('nir_water_bodies', JSON.stringify(waterBodies));
    } catch {
      /* ignore */
    }
  }, [waterBodies]);

  const refreshFromCloud = useCallback(() => {
    if (!isSupabaseConfigured()) return;
    fetchComplaintsFromSupabase().then((remote) => {
      if (remote && remote.length > 0) setComplaints(dedupe(remote));
    });
  }, []);

  // Supabase initial load + realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    refreshFromCloud();
    const unsubscribe = subscribeToComplaints(
      (inserted) => setComplaints((prev) => (prev.some((c) => c.id === inserted.id) ? prev : [inserted, ...prev])),
      (updated) => setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    );
    return () => unsubscribe();
  }, [refreshFromCloud]);

  /** Apply an update to one complaint and persist it to Supabase. */
  const mutate = useCallback((id: string, fn: (c: CitizenComplaint) => CitizenComplaint | null) => {
    setComplaints((prev) => {
      let changed: CitizenComplaint | null = null;
      const next = prev.map((c) => {
        if (c.id !== id) return c;
        const updated = fn(c);
        if (!updated) return c;
        changed = updated;
        return updated;
      });
      if (changed) saveComplaintToSupabase(changed);
      return next;
    });
  }, []);

  const value: AppState = {
    waterBodies,
    complaints,
    officers,
    currentUser,
    isLoggedIn: Boolean(currentUser),
    lastSubmittedId,

    isOtpModalOpen,
    openOtpModal: () => setOtpOpen(true),
    closeOtpModal: () => setOtpOpen(false),
    isDrawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),

    login: (user) => {
      setCurrentUser(user);
      try {
        localStorage.setItem('nir_user', JSON.stringify(user));
      } catch {
        /* ignore */
      }
    },
    logout: () => {
      setCurrentUser(null);
      try {
        localStorage.removeItem('nir_user');
      } catch {
        /* ignore */
      }
    },

    submitComplaint: (nc) => {
      setComplaints((prev) => {
        if (prev.some((c) => c.id === nc.id)) return prev;
        const isRapidDuplicate = prev.some((c) => {
          const sameUser = c.citizenPhone === nc.citizenPhone;
          const sameDesc = c.shortDescription?.trim().toLowerCase() === nc.shortDescription?.trim().toLowerCase();
          const sameLandmark = c.locationLandmark?.trim().toLowerCase() === nc.locationLandmark?.trim().toLowerCase();
          const diff = Math.abs(new Date(c.submittedAt).getTime() - new Date(nc.submittedAt).getTime());
          return sameUser && (sameDesc || sameLandmark) && (isNaN(diff) || diff < 120000);
        });
        if (isRapidDuplicate) return prev;
        saveComplaintToSupabase(nc);
        return [nc, ...prev];
      });
      setLastSubmittedId(nc.id);
    },

    assignInspector: (id, name, phone) =>
      mutate(id, (c) => ({ ...c, status: 'INSPECTOR_ASSIGNED', assignedInspector: name, assignedInspectorPhone: phone })),

    submitInspectionReport: (id, report) =>
      mutate(id, (c) => ({ ...c, status: 'INSPECTION_COMPLETED', inspectionReport: report })),

    assignEngineer: (id, name, phone, deadline) =>
      mutate(id, (c) => {
        const workExecution: EngineerWorkExecution = {
          id: `WRK-${Date.now().toString(36).toUpperCase()}`,
          engineerName: name,
          engineerPhone: phone,
          assignedAt: today(),
          deadline,
          status: 'PENDING_ACCEPTANCE',
          beforePhotoUrl: c.photoUrl,
        };
        return { ...c, status: 'WORKER_IN_PROGRESS', assignedEngineer: name, assignedEngineerPhone: phone, workExecution };
      }),

    acceptTask: (id, beforePhotoUrl) =>
      mutate(id, (c) =>
        c.workExecution
          ? {
              ...c,
              status: 'WORKER_IN_PROGRESS',
              workExecution: { ...c.workExecution, status: 'ACCEPTED', beforePhotoUrl, startedAt: today() },
            }
          : null
      ),

    blockTask: (id, reason) =>
      mutate(id, (c) =>
        c.workExecution ? { ...c, workExecution: { ...c.workExecution, status: 'BLOCKED', blockReason: reason } } : null
      ),

    completeTask: (id, afterPhotoUrl, workSummary) =>
      mutate(id, (c) =>
        c.workExecution
          ? {
              ...c,
              status: 'VERIFICATION_PENDING',
              workExecution: { ...c.workExecution, status: 'COMPLETED', afterPhotoUrl, workSummary, completedAt: today() },
            }
          : null
      ),

    submitPostWorkVerification: (id, ok, photoUrl, remarks) =>
      mutate(id, (c) => ({
        ...c,
        status: ok ? 'RESOLVED' : 'WORKER_IN_PROGRESS',
        inspectionReport: c.inspectionReport
          ? {
              ...c.inspectionReport,
              postWorkVerification: { verifiedAt: today(), isSatisfactory: ok, verificationPhotoUrl: photoUrl, remarks },
            }
          : undefined,
      })),

    updateComplaint: (updated) => mutate(updated.id, () => updated),
    refreshFromCloud,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = (): AppState => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
};
