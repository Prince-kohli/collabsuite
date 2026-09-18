import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useBoardStore } from '../store/useBoardStore';
import { CreateBoardModal } from '../components/trello/CreateBoardModal';

export const BoardListPage = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { activeWorkspace } = useWorkspaceStore();
  const { boards, fetchWorkspaceBoards, isLoading } = useBoardStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceBoards(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceBoards]);

  if (!activeWorkspace || !workspaceId) {
    return <div className="text-center py-16 text-slate-500">Workspace not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kanban Boards</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage workflows and track project progress for {activeWorkspace.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Board
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div
            onClick={() => setIsCreateModalOpen(true)}
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 transition-colors min-h-[140px] bg-white"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-700">Create New Board</span>
          </div>

          {boards.map((board) => (
            <div
              key={board._id}
              onClick={() => navigate(`/workspaces/${workspaceId}/boards/${board._id}`)}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900">{board.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {board.description || 'No description provided'}
                </p>
              </div>

              <div className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 mt-4">
                Open Board
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        workspaceId={workspaceId}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};