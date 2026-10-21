import React from 'react';
import { useNavigate } from 'react-router';
import { CitizenDashboard } from '../components/CitizenDashboard';
import { useAppState } from '../state/AppStateContext';
import { PATHS } from '../navigation/paths';

export default function CitizenPage() {
  const app = useAppState();
  const navigate = useNavigate();
  return (
    <CitizenDashboard
      complaints={app.complaints}
      waterBodies={app.waterBodies}
      currentUser={app.currentUser}
      isLoggedIn={app.isLoggedIn}
      onOpenLoginModal={app.openOtpModal}
      onOpenLodgeModal={() => navigate(PATHS.report)}
      onOpenDirectoryModal={() => navigate(PATHS.officers)}
    />
  );
}
