import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyOtpPage } from './pages/VerifyOtpPage';

import { WorkspaceOverviewPage } from './pages/WorkspaceOverviewPage';
import { WorkspaceSettingsPage } from './pages/WorkspaceSettingsPage';
import { BoardListPage } from './pages/BoardListPage';
import { BoardDetailPage } from './pages/BoardDetailPage';
import { DocPage } from './pages/DocPage';
import { SlackPage } from './pages/SlackPage';

import { DashboardLayout } from './components/layout/DashboardLayout';
import { ToastContainer } from './components/common/ToastContainer';
import { useWorkspaceStore } from './store/useWorkspaceStore';

const DashboardRedirect = () => {
  const { activeWorkspace, workspaces, isLoading } = useWorkspaceStore();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activeWorkspace) {
    return <Navigate to={`/workspaces/${activeWorkspace._id}`} replace />;
  }

  if (workspaces.length > 0) {
    return <Navigate to={`/workspaces/${workspaces[0]._id}`} replace />;
  }

  // No workspace: DashboardLayout empty state handle karega
  return <WorkspaceOverviewPage />;
};

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspaceOverviewPage />} />
            <Route path="/workspaces/:workspaceId/settings" element={<WorkspaceSettingsPage />} />
            <Route path="/workspaces/:workspaceId/boards" element={<BoardListPage />} />
            <Route path="/workspaces/:workspaceId/boards/:boardId" element={<BoardDetailPage />} />
            <Route path="/workspaces/:workspaceId/docs" element={<DocPage />} />
            <Route path="/workspaces/:workspaceId/docs/:docId" element={<DocPage />} />
            <Route path="/workspaces/:workspaceId/channels" element={<SlackPage />} />
            <Route path="/workspaces/:workspaceId/channels/:channelId" element={<SlackPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;