/** Thin route wrappers that connect the existing role dashboards to global state. */
import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { AdminDashboard } from '../../components/AdminDashboard';
import { NodalOfficerDashboard } from '../../components/NodalOfficerDashboard';
import { InspectorDashboard } from '../../components/InspectorDashboard';
import { EngineerDashboard } from '../../components/EngineerDashboard';
import { useAppState } from '../../state/AppStateContext';
import { PATHS, nodalBySlug } from '../../navigation/paths';

export function AdminWorkspace() {
  const app = useAppState();
  const navigate = useNavigate();
  return (
    <AdminDashboard
      waterBodies={app.waterBodies}
      complaints={app.complaints}
      officers={app.officers}
      onOpenDirectoryModal={() => navigate(PATHS.officers)}
      onOpenLodgeModal={() => navigate(PATHS.report)}
      onOpenDrawer={app.openDrawer}
      onUpdateComplaint={app.updateComplaint}
    />
  );
}

export function NodalWorkspace() {
  const { district } = useParams();
  const app = useAppState();
  const d = nodalBySlug(district);
  if (!d) return <Navigate to={PATHS.console} replace />;
  return (
    <NodalOfficerDashboard
      key={d.slug}
      district={d.name}
      complaints={app.complaints}
      waterBodies={app.waterBodies}
      officers={app.officers}
      onAssignInspector={app.assignInspector}
      onAssignEngineer={app.assignEngineer}
    />
  );
}

export function InspectorWorkspace() {
  const app = useAppState();
  return (
    <InspectorDashboard
      complaints={app.complaints}
      waterBodies={app.waterBodies}
      onSubmitInspectionReport={app.submitInspectionReport}
      onSubmitPostWorkVerification={app.submitPostWorkVerification}
    />
  );
}

export function EngineerWorkspace() {
  const app = useAppState();
  return (
    <EngineerDashboard
      complaints={app.complaints}
      waterBodies={app.waterBodies}
      onAcceptTask={app.acceptTask}
      onBlockTask={app.blockTask}
      onCompleteTask={app.completeTask}
    />
  );
}
