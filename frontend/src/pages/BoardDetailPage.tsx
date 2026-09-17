import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { useBoardStore } from '../store/useBoardStore';
import { KanbanColumn } from '../components/trello/KanbanColumn';

export const BoardDetailPage = () => {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const navigate = useNavigate();
  const {
    currentBoard,
    lists,
    cardsByListId,
    fetchBoardDetails,
    createList,
    moveCardOptimistic,
    isLoading,
  } = useBoardStore();

  const [isAddingList, setIsAddingList] = useState(false);
  const [listName, setListName] = useState('');
  const [isSubmittingList, setIsSubmittingList] = useState(false);

  useEffect(() => {
    if (boardId) {
      fetchBoardDetails(boardId);
    }
  }, [boardId, fetchBoardDetails]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Dropped in the same spot
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
    if (!listName.trim() || !boardId) return;

    setIsSubmittingList(true);
    try {
      await createList({
        name: listName.trim(),
        boardId,
        position: lists.length,
      });
      setListName('');
      setIsAddingList(false);
    } catch (err) {
      console.error('Failed to create list', err);
    } finally {
      setIsSubmittingList(false);
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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/boards`)}
            aria-label="Back to boards"
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {currentBoard?.name || 'Kanban Board'}
            </h1>
            {currentBoard?.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {currentBoard.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Kanban DragDrop Canvas */}
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

          {/* Add List Input/Button */}
          <div className="w-72 shrink-0 bg-zinc-100/60 dark:bg-zinc-900/40 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl p-2">
            {isAddingList ? (
              <form onSubmit={handleAddList} className="space-y-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter list title..."
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingList || !listName.trim()}
                    className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md transition-colors cursor-pointer"
                  >
                    {isSubmittingList ? 'Adding...' : 'Add List'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingList(true)}
                className="w-full py-2 px-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
    </div>
  );
};