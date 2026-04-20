import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppLayout } from '../shared/components/AppLayout';
import { AuthLayout } from '../shared/components/AuthLayout';
import { useAuthStore } from '../domains/auth/stores/authStore';

import { LoginPage } from './auth/LoginPage';
import { SignupPage } from './auth/SignupPage';
import { DashboardPage } from './dashboard/DashboardPage';
import { CreatePage } from './evaluation/CreatePage';
import { ConfigPage } from './evaluation/ConfigPage';
import { UploadPage } from './evaluation/UploadPage';
import { PipelinePage } from './evaluation/PipelinePage';
import { ResultListPage } from './results/ResultListPage';
import { ResultDetailPage } from './results/ResultDetailPage';
import { TenantListPage } from './admin/TenantListPage';
import { TenantDetailPage } from './admin/TenantDetailPage';
import { NotFoundPage } from './NotFoundPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    element: (
      <PublicOnlyRoute>
        <AuthLayout />
      </PublicOnlyRoute>
    ),
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/evaluations/create', element: <CreatePage /> },
      { path: '/evaluations/:id/config', element: <ConfigPage /> },
      { path: '/evaluations/:id/upload', element: <UploadPage /> },
      { path: '/evaluations/:id/pipeline', element: <PipelinePage /> },
      { path: '/evaluations/:id/results', element: <ResultListPage /> },
      { path: '/evaluations/:id/results/:examineeNo', element: <ResultDetailPage /> },
      { path: '/admin/tenants', element: <TenantListPage /> },
      { path: '/admin/tenants/:tenantId', element: <TenantDetailPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
