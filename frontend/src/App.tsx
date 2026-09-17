import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorkspaceOverviewPage } from './pages/WorkspaceOverviewPage';
import { WorkspaceSettingsPage } from './pages/WorkspaceSettingsPage';
import { BoardListPage } from './pages/BoardListPage';
import { BoardDetailPage } from './pages/BoardDetailPage';
import { DocPage } from './pages/DocPage';
import { SlackPage } from './pages/SlackPage';
import { useThemeStore } from './store/useThemeStore';
import { useWorkspaceStore } from './store/useWorkspaceStore';
import { DashboardLayout } from './components/layout/DashboardLayout';

const DashboardRedirect = () => {
  const { activeWorkspace, workspaces } = useWorkspaceStore();

  if (activeWorkspace) {
    return <Navigate to={`/workspaces/${activeWorkspace._id}`} replace />;
  }

  if (workspaces.length > 0) {
    return <Navigate to={`/workspaces/${workspaces[0]._id}`} replace />;
  }

  return <WorkspaceOverviewPage />;
};

function App() {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspaceOverviewPage />} />
            <Route path="/workspaces/:workspaceId/settings" element={<WorkspaceSettingsPage />} />

            {/* Trello / Kanban Engine Routes */}
            <Route path="/workspaces/:workspaceId/boards" element={<BoardListPage />} />
            <Route path="/workspaces/:workspaceId/boards/:boardId" element={<BoardDetailPage />} />

            {/* Notion / Docs Engine Routes */}
            <Route path="/workspaces/:workspaceId/docs" element={<DocPage />} />
            <Route path="/workspaces/:workspaceId/docs/:docId" element={<DocPage />} />

            {/* Slack / Realtime Channels Routes */}
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