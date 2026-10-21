import React from 'react';
import { Link, useNavigate } from 'react-router';
import { FilePlus2, Search, Map } from 'lucide-react';
import { MainPortalDashboard } from '../components/MainPortalDashboard';
import { useAppState } from '../state/AppStateContext';
import { useLanguage } from '../context/LanguageContext';
import { PATHS, roleToPath } from '../navigation/paths';

/** Landing page: three clear citizen actions above the existing hero + national map. */
export default function HomePage() {
  const { waterBodies, complaints } = useAppState();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const actions = [
    { to: PATHS.report, icon: FilePlus2, title: t('ctaReportTitle', 'Report a water body issue'), desc: t('ctaReportDesc', 'Dumping, effluent, encroachment or siltation — with photo and location.') },
    { to: PATHS.track, icon: Search, title: t('ctaTrackTitle', 'Track your complaint'), desc: t('ctaTrackDesc', 'Enter your complaint ID to see who is handling it and its current stage.') },
    { to: '#national-map', icon: Map, title: t('ctaExploreTitle', 'Explore water data'), desc: t('ctaExploreDesc', 'Reservoirs, rainfall, groundwater and satellite water-body status by district.') },
  ];

  return (
    <div className="space-y-6">
      <MainPortalDashboard
        waterBodies={waterBodies}
        complaints={complaints}
        onSelectRole={(role) => navigate(roleToPath(role))}
        onOpenLodgeModal={() => navigate(PATHS.report)}
        onOpenDirectoryModal={() => navigate(PATHS.officers)}
        quickActions={
          <section aria-label="Quick actions" className="grid gap-3 sm:grid-cols-3">
            {actions.map(({ to, icon: Icon, title, desc }) => {
              const body = (
                <>
                  <span className="w-10 h-10 rounded-2xl bg-[#CAF0F8] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#0077B6]" aria-hidden />
                  </span>
                  <span className="space-y-1">
                    <span className="block font-bold text-[#03045E] text-sm">{title}</span>
                    <span className="block text-xs text-slate-500 leading-relaxed">{desc}</span>
                  </span>
                </>
              );
              const cls = 'flex gap-3 items-start bg-white border border-slate-200 rounded-2xl p-4 hover:border-[#00B4D8] hover:shadow-sm transition';
              return to.startsWith('#') ? (
                <a key={to} href={to} className={cls}>{body}</a>
              ) : (
                <Link key={to} to={to} className={cls}>{body}</Link>
              );
            })}
          </section>
        }
      />
    </div>
  );
}
