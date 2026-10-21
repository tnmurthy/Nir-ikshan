import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import AppShell from './layouts/AppShell';

// Route-level code splitting: each page (and the heavy map/data modules it pulls in) loads on demand.
const HomePage = lazy(() => import('./pages/HomePage'));
const CitizenPage = lazy(() => import('./pages/CitizenPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const TrackPage = lazy(() => import('./pages/TrackPage'));
const OfficersPage = lazy(() => import('./pages/OfficersPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ConsoleLayout = lazy(() => import('./pages/console/ConsoleLayout'));
const ConsoleHome = lazy(() => import('./pages/console/ConsoleHome'));
const AdminWorkspace = lazy(() => import('./pages/console/Workspaces').then((m) => ({ default: m.AdminWorkspace })));
const NodalWorkspace = lazy(() => import('./pages/console/Workspaces').then((m) => ({ default: m.NodalWorkspace })));
const InspectorWorkspace = lazy(() => import('./pages/console/Workspaces').then((m) => ({ default: m.InspectorWorkspace })));
const EngineerWorkspace = lazy(() => import('./pages/console/Workspaces').then((m) => ({ default: m.EngineerWorkspace })));

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/citizen', element: <CitizenPage /> },
      { path: '/report', element: <ReportPage /> },
      { path: '/track', element: <TrackPage /> },
      { path: '/track/:id', element: <TrackPage /> },
      { path: '/officers', element: <OfficersPage /> },
      {
        path: '/console',
        element: <ConsoleLayout />,
        children: [
          { index: true, element: <ConsoleHome /> },
          { path: 'admin', element: <AdminWorkspace /> },
          { path: 'nodal/:district', element: <NodalWorkspace /> },
          { path: 'inspector', element: <InspectorWorkspace /> },
          { path: 'engineer', element: <EngineerWorkspace /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
