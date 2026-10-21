import React from 'react';
import { NavLink } from 'react-router';
import { Home, FilePlus2, Search, ListChecks, Phone, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PATHS } from '../navigation/paths';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
    isActive ? 'bg-[#03045E] text-white shadow-xs' : 'text-slate-600 hover:text-[#03045E] hover:bg-[#CAF0F8]/60'
  }`;

/**
 * Primary navigation. Public sections on the left, officer console on the right.
 * Scrolls horizontally on small screens instead of collapsing into a hamburger,
 * so citizens always see "Report" and "Track".
 */
export const PortalNav: React.FC = () => {
  const { t } = useLanguage();

  const items = [
    { to: PATHS.home, label: t('navHome', 'Home'), icon: Home, end: true },
    { to: PATHS.report, label: t('navReport', 'Report an issue'), icon: FilePlus2 },
    { to: PATHS.track, label: t('navTrack', 'Track complaint'), icon: Search },
    { to: PATHS.citizen, label: t('navMyComplaints', 'My complaints'), icon: ListChecks },
    { to: PATHS.officers, label: t('navOfficers', 'Officer directory'), icon: Phone },
  ];

  return (
    <nav aria-label="Primary" className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-1 overflow-x-auto py-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass}>
            <Icon className="w-4 h-4" aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
        <NavLink to={PATHS.console} className={(s) => `${linkClass(s)} ml-auto`}>
          <ShieldCheck className="w-4 h-4" aria-hidden />
          <span>{t('navConsole', 'Officer console')}</span>
        </NavLink>
      </div>
    </nav>
  );
};
