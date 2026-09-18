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
  const { fetchWorkspaces, isLoading, workspaces, activeWorkspace } = useWorkspaceStore();

  useEffect(() => {
    // Force light mode - remove any leftover dark class
    document.documentElement.classList.remove('dark');

    fetchWorkspaces();
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, [fetchWorkspaces]);

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

  const showEmptyState = !isLoading && workspaces.length === 0;

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-slate-50 text-slate-900">
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
                <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : showEmptyState ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v3M3 3h12a1.5 1.5 0 011.5 1.5v15A1.5 1.5 0 0115 21H3A1.5 1.5 0 011.5 19.5v-15A1.5 1.5 0 013 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No workspace yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-6">
                  Create your first workspace to start using Boards, Docs, and Channels.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Create Workspace
                </button>
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>

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