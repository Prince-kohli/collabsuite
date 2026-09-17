import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { connectSocket, disconnectSocket } from '../../api/socket';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { CreateWorkspaceModal } from '../workspace/CreateWorkspaceModal';
import { SearchModal } from '../common/SearchModal';


export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { fetchWorkspaces, isLoading } = useWorkspaceStore();

  useEffect(() => {
    fetchWorkspaces();
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, [fetchWorkspaces]);

  // Global Keyboard Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
            onOpenSearchModal={() => setIsSearchModalOpen(true)}
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

        {/* Global Modals */}
        <CreateWorkspaceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
};