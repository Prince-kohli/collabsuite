import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { useBoardStore } from '../store/useBoardStore';
import { useToastStore } from '../store/useToastStore';
import { KanbanColumn } from '../components/trello/KanbanColumn';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const BoardDetailPage = () => {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  const {
    currentBoard,
    lists,
    cardsByListId,
    fetchBoardDetails,
    createList,
    deleteBoard,
    moveCardOptimistic,
    isLoading,
  } = useBoardStore();

  const [isAddingList, setIsAddingList] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [isSubmittingList, setIsSubmittingList] = useState(false);

  const [isDeleteBoardModalOpen, setIsDeleteBoardModalOpen] = useState(false);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);

  useEffect(() => {
    if (boardId) {
      fetchBoardDetails(boardId);
    }
  }, [boardId, fetchBoardDetails]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveCardOptimistic(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    );
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listTitle.trim() || !boardId) return;

    setIsSubmittingList(true);
    try {
      await createList({
        title: listTitle.trim(),
        boardId,
        position: lists.length,
      });
      setListTitle('');
      setIsAddingList(false);
      showToast('List added', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create list', 'error');
    } finally {
      setIsSubmittingList(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardId) return;
    setIsDeletingBoard(true);
    try {
      await deleteBoard(boardId);
      showToast('Board deleted', 'info');
      setIsDeleteBoardModalOpen(false);
      navigate(`/workspaces/${workspaceId}/boards`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete board', 'error');
    } finally {
      setIsDeletingBoard(false);
    }
  };

  if (isLoading && !currentBoard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/workspaces/${workspaceId}/boards`)}
            aria-label="Back to boards"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {currentBoard?.title || 'Kanban Board'}
            </h1>
            {currentBoard?.description && (
              <p className="text-xs text-slate-500">{currentBoard.description}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDeleteBoardModalOpen(true)}
          className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Board
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex items-start gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {lists.map((list) => (
            <KanbanColumn
              key={list._id}
              list={list}
              cards={cardsByListId[list._id] || []}
              boardId={boardId || ''}
            />
          ))}

          <div className="w-72 shrink-0 bg-slate-100 border border-dashed border-slate-300 rounded-xl p-2">
            {isAddingList ? (
              <form onSubmit={handleAddList} className="space-y-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter list title..."
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingList || !listTitle.trim()}
                    className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md transition-colors cursor-pointer"
                  >
                    {isSubmittingList ? 'Adding...' : 'Add List'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingList(true)}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Another List
              </button>
            )}
          </div>
        </div>
      </DragDropContext>

      <ConfirmModal
        isOpen={isDeleteBoardModalOpen}
        title="Delete Board"
        message={`Are you sure you want to delete board "${currentBoard?.title}"? All lists and cards inside it will be permanently deleted.`}
        confirmText="Delete Board"
        isLoading={isDeletingBoard}
        onConfirm={handleDeleteBoard}
        onClose={() => setIsDeleteBoardModalOpen(false)}
      />
    </div>
  );
};