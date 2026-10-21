import React, { useRef } from 'react';
import { useNavigate } from 'react-router';
import { LodgeComplaintModal } from '../components/LodgeComplaintModal';
import { useAppState } from '../state/AppStateContext';
import { PATHS } from '../navigation/paths';
import { useCloseRoute } from './useCloseRoute';
import { CitizenComplaint } from '../types/nirikshan';

/**
 * /report — the complaint form now has its own URL (shareable on WhatsApp,
 * printable as a QR code at water bodies). After submit we land on /track/:id.
 */
export default function ReportPage() {
  const app = useAppState();
  const navigate = useNavigate();
  const close = useCloseRoute(PATHS.home);
  const submittedId = useRef<string | null>(null);

  const handleSubmitted = (c: CitizenComplaint) => {
    app.submitComplaint(c);
    submittedId.current = c.id;
  };

  const handleClose = () => {
    if (submittedId.current) navigate(PATHS.trackOne(submittedId.current), { replace: true });
    else close();
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
