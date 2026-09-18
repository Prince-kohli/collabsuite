import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useBoardStore } from '../store/useBoardStore';
import { useToastStore } from '../store/useToastStore';
import { CreateBoardModal } from '../components/trello/CreateBoardModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import type { Board } from '../types';

export const BoardListPage = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { activeWorkspace, currentUserRole } = useWorkspaceStore();
  const { boards, fetchWorkspaceBoards, deleteBoard, updateBoard, isLoading } = useBoardStore();
  const showToast = useToastStore((s) => s.showToast);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editBoard, setEditBoard] = useState<Board | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // RBAC checks
  const isViewer = currentUserRole === 'viewer';
  const canManageBoard = currentUserRole === 'owner' || currentUserRole === 'admin';

  useEffect(() => {
    if (workspaceId) fetchWorkspaceBoards(workspaceId);
  }, [workspaceId, fetchWorkspaceBoards]);

  if (!activeWorkspace || !workspaceId) {
    return <div className="text-center py-16 text-slate-500">Workspace not found.</div>;
  }

  const openEdit = (board: Board, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditBoard(board);
    setEditTitle(board.title);
    setEditDescription(board.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBoard || !editTitle.trim()) return;
    setIsSaving(true);
    try {
      await updateBoard(editBoard._id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      showToast('Board updated', 'success');
      setEditBoard(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update board', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBoard(boardToDelete._id);
      showToast('Board deleted', 'info');
      setBoardToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete board', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kanban Boards</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage workflows and track project progress for {activeWorkspace.name}
          </p>
        </div>
        {!isViewer && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Board
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {!isViewer && (
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
          )}

          {boards.map((board) => (
            <div
              key={board._id}
              onClick={() => navigate(`/workspaces/${workspaceId}/boards/${board._id}`)}
              className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[140px]"
            >
              {canManageBoard && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => openEdit(board, e)}
                    className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                    title="Edit board"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBoardToDelete(board);
                    }}
                    className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                    title="Delete board"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-900 pr-16">{board.title}</h3>
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

      {editBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Edit Board</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditBoard(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!boardToDelete}
        title="Delete Board"
        message={`Are you sure you want to delete board "${boardToDelete?.title}"?`}
        confirmText="Delete Board"
        isLoading={isDeleting}
        onConfirm={handleDeleteBoard}
        onClose={() => setBoardToDelete(null)}
      />
    </div>
  );
};