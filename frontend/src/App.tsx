import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorkspaceOverviewPage } from './pages/WorkspaceOverviewPage';
import { WorkspaceSettingsPage } from './pages/WorkspaceSettingsPage';
import { useThemeStore } from './store/useThemeStore';
import { useWorkspaceStore } from './store/useWorkspaceStore';
import { DashboardLayout } from './components/layout/DashboardLayout';

/**
 * Helper component to redirect /dashboard to active or first workspace.
 */
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

  // Sync dark class on root html tag with zustand theme store
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
        {/* Public / Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Dashboard & Workspace Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspaceOverviewPage />} />
            <Route path="/workspaces/:workspaceId/settings" element={<WorkspaceSettingsPage />} />

            {/* Placeholder routes for upcoming modules */}
            <Route
              path="/workspaces/:workspaceId/boards"
              element={
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                  <h2 className="text-base font-semibold mb-1 text-zinc-800 dark:text-zinc-200">Kanban Boards Module</h2>
                  <p className="text-xs">Coming up in Phase 10 (Trello Engine)</p>
                </div>
              }
            />
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

        {/* Catch-all Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;