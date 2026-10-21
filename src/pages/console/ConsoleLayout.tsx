import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { ShieldCheck, LogIn, Globe } from 'lucide-react';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../context/LanguageContext';
import { NODAL_DISTRICTS, PATHS } from '../../navigation/paths';

const tab = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
    isActive ? 'bg-[#03045E] text-white' : 'text-slate-600 hover:bg-[#CAF0F8]/60'
  }`;

/**
 * Officer console frame: sign-in gate, breadcrumb and workspace tabs.
 * NOTE: the gate uses the existing demo OTP session. Replace with Supabase Auth
 * (role in app_metadata) before any real pilot — see review item #3/#4.
 */
export default function ConsoleLayout() {
  const { isLoggedIn, openOtpModal } = useAppState();
  const { t } = useLanguage();
  const { pathname } = useLocation();

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-2xs">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#CAF0F8] flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-[#0077B6]" aria-hidden />
        </div>
        <h2 className="text-xl font-black text-[#03045E]">{t('navConsole', 'Officer console')}</h2>
        <p className="text-sm text-slate-500">{t('consoleSignInHint', 'Sign in with your registered mobile number to open your workspace.')}</p>
        <button
          onClick={openOtpModal}
          className="w-full px-4 py-2.5 rounded-xl bg-[#03045E] hover:bg-[#0077B6] text-white text-sm font-bold inline-flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" aria-hidden />
          <span>{t('consoleSignIn', 'Sign in')}</span>
        </button>
      </div>
    );
  }

  const isHome = pathname === PATHS.console || pathname === `${PATHS.console}/`;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
          <Link to={PATHS.home} className="font-semibold text-slate-500 hover:text-[#0077B6] flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" aria-hidden />
            <span>{t('breadcrumbPortalHome', 'Portal home')}</span>
          </Link>
          <span className="text-slate-300">/</span>
          <Link to={PATHS.console} className={`font-semibold ${isHome ? 'text-[#03045E]' : 'text-slate-500 hover:text-[#0077B6]'}`}>
            {t('navConsole', 'Officer console')}
          </Link>
        </nav>
        <nav aria-label="Workspaces" className="flex items-center gap-1 overflow-x-auto">
          <NavLink to={PATHS.admin} className={tab}>{t('wsAdmin', 'State admin')}</NavLink>
          {NODAL_DISTRICTS.map((d) => (
            <NavLink key={d.slug} to={PATHS.nodal(d.slug)} className={tab}>
              {t('wsNodal', 'Nodal')} · {d.name.split(' ')[0]}
            </NavLink>
          ))}
          <NavLink to={PATHS.inspector} className={tab}>{t('wsInspector', 'Inspector')}</NavLink>
          <NavLink to={PATHS.engineer} className={tab}>{t('wsEngineer', 'Engineer')}</NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
