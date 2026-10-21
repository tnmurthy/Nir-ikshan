import React, { useRef } from 'react';
import { useNavigate } from 'react-router';
import { UserCheck } from 'lucide-react';
import { LodgeComplaintModal } from '../components/LodgeComplaintModal';
import { useAppState } from '../state/AppStateContext';
import { useLanguage } from '../context/LanguageContext';
import { PATHS } from '../navigation/paths';
import { useCloseRoute } from './useCloseRoute';
import { CitizenComplaint } from '../types/nirikshan';

/**
 * /report — the complaint form has its own URL (shareable on WhatsApp, printable as a QR
 * code at water bodies). After a successful submit we land on /track/:id.
 */
export default function ReportPage() {
  const app = useAppState();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const close = useCloseRoute(PATHS.home);
  const pending = useRef<Promise<CitizenComplaint | null> | null>(null);

  // Cloud mode: collect contact details first so the form never shows the demo OTP flow
  if (!app.isDemo && !app.currentUser) {
    return (
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-2xs">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#CAF0F8] flex items-center justify-center">
          <UserCheck className="w-6 h-6 text-[#0077B6]" aria-hidden />
        </div>
        <h2 className="text-xl font-black text-[#03045E]">{t('navReport', 'Report an issue')}</h2>
        <p className="text-sm text-slate-500">{t('reportSignInHint', 'Add your name and mobile number so the district officer can reach you.')}</p>
        <button onClick={app.openOtpModal} className="w-full px-4 py-2.5 rounded-xl bg-[#03045E] hover:bg-[#0077B6] text-white text-sm font-bold">
          {t('continue', 'Continue')}
        </button>
      </div>
    );
  }

  const handleSubmitted = (c: CitizenComplaint) => {
    pending.current = app.submitComplaint(c);
  };

  const handleClose = async () => {
    if (!pending.current) return close();
    const saved = await pending.current;
    pending.current = null;
    if (saved) navigate(PATHS.trackOne(saved.id), { replace: true });
    else navigate(PATHS.home, { replace: true }); // error toast is shown by the shell
  };

  return (
    <div className="min-h-[60vh]">
      <LodgeComplaintModal
        isOpen
        onClose={handleClose}
        onComplaintSubmitted={handleSubmitted}
        currentUser={app.currentUser}
        isLoggedIn={app.isLoggedIn}
        onOpenLoginModal={app.openOtpModal}
        onLoginSuccess={app.login}
      />
    </div>
  );
}
