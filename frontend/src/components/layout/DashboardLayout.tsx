import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { CreateWorkspaceModal } from '../workspace/CreateWorkspaceModal';


export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { fetchWorkspaces, isLoading } = useWorkspaceStore();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Listen to custom create workspace event
  useEffect(() => {
    const handleOpenModal = () => setIsCreateModalOpen(true);
    window.addEventListener('collabsuite:open-create-workspace-modal', handleOpenModal);
    return () => window.removeEventListener('collabsuite:open-create-workspace-modal', handleOpenModal);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenCreateWorkspaceModal={() => setIsCreateModalOpen(true)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Navbar
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onOpenSearchModal={() => {}}
          />

          <main className="flex-1 p-6 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>

        {/* Global Create Workspace Modal */}
        <CreateWorkspaceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
};