import React from 'react';
import { OfficerDirectoryModal } from '../components/OfficerDirectoryModal';
import { useAppState } from '../state/AppStateContext';
import { PATHS } from '../navigation/paths';
import { useCloseRoute } from './useCloseRoute';

export default function OfficersPage() {
  const { officers } = useAppState();
  const close = useCloseRoute(PATHS.home);
  return (
    <div className="min-h-[60vh]">
      <OfficerDirectoryModal isOpen onClose={close} officers={officers} />
    </div>
  );
}
