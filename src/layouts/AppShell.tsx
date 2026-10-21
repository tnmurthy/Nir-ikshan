import React, { Suspense } from 'react';
import { Link, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router';
import { Droplets } from 'lucide-react';
import { NirikshanHeader } from '../components/NirikshanHeader';
import { NirikshanSlideDrawer } from '../components/NirikshanSlideDrawer';
import { OtpLoginModal } from '../components/OtpLoginModal';
import { PortalNav } from '../components/PortalNav';
import { useAppState } from '../state/AppStateContext';
import { useLanguage } from '../context/LanguageContext';
import { PATHS, nodalByName, pathToRole, roleToPath, nodalBySlug } from '../navigation/paths';
import { UserRoleType } from '../types/nirikshan';

export const PageFallback: React.FC = () => (
  <div className="py-24 flex flex-col items-center gap-3 text-slate-500 text-sm" role="status">
    <div className="w-8 h-8 rounded-full border-2 border-[#00B4D8] border-t-transparent animate-spin" />
    <span>Loading…</span>
  </div>
);

export default function AppShell() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const app = useAppState();

  const currentRole = pathToRole(pathname);
  const nodalSlug = pathname.match(/^\/console\/nodal\/([^/]+)/)?.[1];
  const selectedNodalDistrict = nodalBySlug(nodalSlug)?.name ?? 'Vizianagaram';

  const goToRole = (role: UserRoleType) => navigate(roleToPath(role));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] w-full">
      <ScrollRestoration />

      <NirikshanHeader
        currentRole={currentRole}
        onSelectRole={goToRole}
        isLoggedIn={app.isLoggedIn}
        currentUser={app.currentUser}
        onOpenLoginModal={app.openOtpModal}
        onOpenDrawer={app.openDrawer}
      />
      <PortalNav />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-6">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="w-full bg-[#0b1b36] text-slate-300 text-xs py-7 border-t border-blue-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">{t('footerTitle')}</h4>
                <p className="text-blue-300 text-[11px]">{t('footerSubtitle')}</p>
              </div>
            </div>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-[12px]">
              <Link className="hover:text-white" to={PATHS.report}>{t('navReport', 'Report an issue')}</Link>
              <Link className="hover:text-white" to={PATHS.track}>{t('navTrack', 'Track complaint')}</Link>
              <Link className="hover:text-white" to={PATHS.officers}>{t('navOfficers', 'Officer directory')}</Link>
              <Link className="hover:text-white" to={PATHS.console}>{t('navConsole', 'Officer console')}</Link>
            </nav>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-blue-900/60 pt-3">
            {t('footerDataNote', 'Hydrology data: India-WRIS, CWC, IMD, CGWB, APWRIMS and ISRO Bhuvan. Figures marked "baseline" are reference values, not live readings.')}
          </div>
        </div>
      </footer>

      {/* Global overlays */}
      <NirikshanSlideDrawer
        isOpen={app.isDrawerOpen}
        onClose={app.closeDrawer}
        currentRole={currentRole}
        onSelectRole={goToRole}
        currentUser={app.currentUser}
        onLogout={() => {
          app.logout();
          navigate(PATHS.home);
        }}
        onOpenLodgeModal={() => navigate(PATHS.report)}
        onOpenDirectoryModal={() => navigate(PATHS.officers)}
        selectedNodalDistrict={selectedNodalDistrict}
        onSelectNodalDistrict={(name) => {
          const d = nodalByName(name);
          if (d) navigate(PATHS.nodal(d.slug));
        }}
        isLoggedIn={app.isLoggedIn}
        onOpenLogin={app.openOtpModal}
      />

      <OtpLoginModal isOpen={app.isOtpModalOpen} onClose={app.closeOtpModal} onLoginSuccess={app.login} />
    </div>
  );
}
