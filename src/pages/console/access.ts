import type { OfficialSession } from '../../lib/auth';
import { NODAL_DISTRICTS, PATHS } from '../../navigation/paths';

export type Workspace = { kind: 'admin' } | { kind: 'nodal'; slug: string } | { kind: 'inspector' } | { kind: 'engineer' };

/** In cloud mode the officer's role decides which workspaces exist for them. Demo mode allows all. */
export function canOpen(official: OfficialSession | null, isDemo: boolean, ws: Workspace): boolean {
  if (isDemo) return true;
  if (!official) return false;
  if (official.role === 'admin') return true;
  if (ws.kind === 'nodal') {
    const d = NODAL_DISTRICTS.find((x) => x.slug === ws.slug);
    return official.role === 'nodal' && !!d && d.name === official.district;
  }
  return official.role === ws.kind;
}

export function homeFor(official: OfficialSession | null): string {
  if (!official) return PATHS.console;
  switch (official.role) {
    case 'admin':
      return PATHS.admin;
    case 'inspector':
      return PATHS.inspector;
    case 'engineer':
      return PATHS.engineer;
    case 'nodal': {
      const d = NODAL_DISTRICTS.find((x) => x.name === official.district);
      return d ? PATHS.nodal(d.slug) : PATHS.console;
    }
  }
}
