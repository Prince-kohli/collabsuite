import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { CreateBoardModal } from '../components/trello/CreateBoardModal';

export const BoardListPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { activeWorkspace } = useWorkspaceStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!activeWorkspace || !workspaceId) {
    return (
      <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
        Workspace not found.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Kanban Boards
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage workflows and track project progress for {activeWorkspace.name}
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Board
        </button>
      </div>

      {/* Boards Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* New Board Action Card */}
        <div
          onClick={() => setIsCreateModalOpen(true)}
          className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors min-h-[140px]"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Create New Board
          </span>
        </div>
      </div>

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        workspaceId={workspaceId}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};