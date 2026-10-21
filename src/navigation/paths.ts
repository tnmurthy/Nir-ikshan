/**
 * Single source of truth for URLs. Legacy components still speak in
 * "roles" (UserRoleType); these helpers translate roles <-> routes so those
 * components keep working unchanged.
 */
import { UserRoleType } from '../types/nirikshan';

export const PATHS = {
  home: '/',
  citizen: '/citizen',
  report: '/report',
  track: '/track',
  trackOne: (id: string) => `/track/${encodeURIComponent(id)}`,
  officers: '/officers',
  console: '/console',
  admin: '/console/admin',
  nodal: (slug: string) => `/console/nodal/${slug}`,
  inspector: '/console/inspector',
  engineer: '/console/engineer',
} as const;

export interface NodalDistrict {
  slug: string;
  name: string;
  role: UserRoleType;
}

export const NODAL_DISTRICTS: NodalDistrict[] = [
  { slug: 'vizianagaram', name: 'Vizianagaram', role: 'nodal_vizianagaram' },
  { slug: 'parvathipuram-manyam', name: 'Parvathipuram Manyam', role: 'nodal_parvathipuram' },
  { slug: 'visakhapatnam', name: 'Visakhapatnam', role: 'nodal_visakhapatnam' },
];

export const nodalBySlug = (slug?: string) => NODAL_DISTRICTS.find((d) => d.slug === slug);
export const nodalByName = (name: string) => NODAL_DISTRICTS.find((d) => d.name === name);

export function roleToPath(role: UserRoleType): string {
  switch (role) {
    case 'overview':
      return PATHS.home;
    case 'user':
      return PATHS.citizen;
    case 'admin':
      return PATHS.admin;
    case 'inspector':
      return PATHS.inspector;
    case 'engineer':
      return PATHS.engineer;
    default: {
      const d = NODAL_DISTRICTS.find((x) => x.role === role);
      return d ? PATHS.nodal(d.slug) : PATHS.home;
    }
  }
}

export function pathToRole(pathname: string): UserRoleType {
  if (pathname.startsWith(PATHS.citizen) || pathname.startsWith(PATHS.report) || pathname.startsWith(PATHS.track)) {
    return 'user';
  }
  if (pathname.startsWith(PATHS.admin)) return 'admin';
  if (pathname.startsWith(PATHS.inspector)) return 'inspector';
  if (pathname.startsWith(PATHS.engineer)) return 'engineer';
  const m = pathname.match(/^\/console\/nodal\/([^/]+)/);
  if (m) return nodalBySlug(m[1])?.role ?? 'overview';
  return 'overview';
}
