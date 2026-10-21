import React from 'react';
import { Link, Navigate } from 'react-router';
import { canOpen, homeFor, Workspace } from './access';
import { Building2, MapPinned, ClipboardCheck, HardHat, ArrowRight } from 'lucide-react';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../context/LanguageContext';
import { NODAL_DISTRICTS, PATHS } from '../../navigation/paths';

/** Workspace picker with live counts, so each card tells the officer where work is waiting. */
export default function ConsoleHome() {
  const { complaints, isDemo, official } = useAppState();
  const { t } = useLanguage();
  const count = (pred: (s: string) => boolean, district?: string) =>
    complaints.filter((c) => pred(c.status) && (!district || c.district === district)).length;

  if (!isDemo && official && official.role !== 'admin') return <Navigate to={homeFor(official)} replace />;

  const cards: { to: string; ws: Workspace; icon: typeof Building2; title: string; sub: string }[] = [
    { to: PATHS.admin, ws: { kind: 'admin' }, icon: Building2, title: t('wsAdmin', 'State admin'), sub: `${count((s) => s !== 'RESOLVED' && s !== 'REJECTED')} open complaints statewide` },
    ...NODAL_DISTRICTS.map((d) => ({
      to: PATHS.nodal(d.slug),
      ws: { kind: 'nodal', slug: d.slug } as Workspace,
      icon: MapPinned,
      title: `${t('wsNodal', 'Nodal')} · ${d.name}`,
      sub: `${count((s) => s === 'SUBMITTED' || s === 'INSPECTION_COMPLETED', d.name)} awaiting assignment`,
    })),
    { to: PATHS.inspector, ws: { kind: 'inspector' }, icon: ClipboardCheck, title: t('wsInspector', 'Inspector'), sub: `${count((s) => s === 'INSPECTOR_ASSIGNED' || s === 'VERIFICATION_PENDING')} site visits due` },
    { to: PATHS.engineer, ws: { kind: 'engineer' }, icon: HardHat, title: t('wsEngineer', 'Engineer'), sub: `${count((s) => s === 'WORKER_IN_PROGRESS')} works in progress` },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-[#03045E]">{t('consoleTitle', 'Choose your workspace')}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.filter((c) => canOpen(official, isDemo, c.ws)).map(({ to, icon: Icon, title, sub }) => (
          <Link key={to} to={to} className="group bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:border-[#00B4D8] hover:shadow-sm transition">
            <span className="w-10 h-10 rounded-2xl bg-[#CAF0F8] flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-[#0077B6]" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-bold text-sm text-[#03045E]">{title}</span>
              <span className="block text-xs text-slate-500">{sub}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0077B6]" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
