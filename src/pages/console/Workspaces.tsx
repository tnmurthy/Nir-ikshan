/** Thin route wrappers that connect the existing role dashboards to global state. */
import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { AdminDashboard } from '../../components/AdminDashboard';
import { NodalOfficerDashboard } from '../../components/NodalOfficerDashboard';
import { InspectorDashboard } from '../../components/InspectorDashboard';
import { EngineerDashboard } from '../../components/EngineerDashboard';
import { useAppState } from '../../state/AppStateContext';
import { PATHS, nodalBySlug } from '../../navigation/paths';
import { canOpen, homeFor, Workspace } from './access';

/** Redirect officers away from workspaces their role does not cover. */
function Guard({ ws, children }: { ws: Workspace; children: React.ReactElement }) {
  const { official, isDemo } = useAppState();
  if (!canOpen(official, isDemo, ws)) return <Navigate to={homeFor(official)} replace />;
  return children;
}

export function AdminWorkspace() {
  const app = useAppState();
  const navigate = useNavigate();
  return (
    <Guard ws={{ kind: 'admin' }}>
    <AdminDashboard
      waterBodies={app.waterBodies}
      complaints={app.complaints}
      officers={app.officers}
      onOpenDirectoryModal={() => navigate(PATHS.officers)}
      onOpenLodgeModal={() => navigate(PATHS.report)}
      onOpenDrawer={app.openDrawer}
      onUpdateComplaint={app.updateComplaint}
    />
    </Guard>
  );
}

export function NodalWorkspace() {
  const { district } = useParams();
  const app = useAppState();
  const d = nodalBySlug(district);
  if (!d) return <Navigate to={PATHS.console} replace />;
  return (
    <Guard ws={{ kind: 'nodal', slug: d.slug }}>
    <NodalOfficerDashboard
      key={d.slug}
      district={d.name}
      complaints={app.complaints}
      waterBodies={app.waterBodies}
      officers={app.officers}
      onAssignInspector={app.assignInspector}
      onAssignEngineer={app.assignEngineer}
    />
    </Guard>
  );
}

export function InspectorWorkspace() {
  const app = useAppState();
  return (
    <Guard ws={{ kind: 'inspector' }}>
    <InspectorDashboard
      complaints={app.complaints}
      waterBodies={app.waterBodies}
      onSubmitInspectionReport={app.submitInspectionReport}
      onSubmitPostWorkVerification={app.submitPostWorkVerification}
    />
    </Guard>
  );
}

export function EngineerWorkspace() {
  const app = useAppState();
  return (
    <Guard ws={{ kind: 'engineer' }}>
    <EngineerDashboard
      complaints={app.complaints}
      waterBodies={app.waterBodies}
      onAcceptTask={app.acceptTask}
      onBlockTask={app.blockTask}
      onCompleteTask={app.completeTask}
    />
    </Guard>
  );
}
