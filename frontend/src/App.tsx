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

            <Route
              path="/workspaces/:workspaceId/docs"
              element={
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                  <h2 className="text-base font-semibold mb-1 text-zinc-800 dark:text-zinc-200">Docs & Wiki Module</h2>
                  <p className="text-xs">Coming up in Phase 11 (Notion Engine)</p>
                </div>
              }
            />
            <Route
              path="/workspaces/:workspaceId/channels"
              element={
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                  <h2 className="text-base font-semibold mb-1 text-zinc-800 dark:text-zinc-200">Channels & Chat Module</h2>
                  <p className="text-xs">Coming up in Phase 12 (Slack Engine)</p>
                </div>
              }
            />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;