import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import type { List, Card } from '../../types';
import { KanbanCard } from './KanbanCard';
import { useBoardStore } from '../../store/useBoardStore';
import { useToastStore } from '../../store/useToastStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { ConfirmModal } from '../common/ConfirmModal';

interface KanbanColumnProps {
  list: List;
  cards: Card[];
  boardId: string;
}

export const KanbanColumn = ({ list, cards, boardId }: KanbanColumnProps) => {
  const { createCard, deleteList, updateList } = useBoardStore();
  const { currentUserRole } = useWorkspaceStore();
  const showToast = useToastStore((s) => s.showToast);

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [listTitle, setListTitle] = useState(list.title);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isViewer = currentUserRole === 'viewer';

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim() || isViewer) return;
    setIsSubmitting(true);
    try {
      await createCard({
        title: cardTitle.trim(),
        listId: list._id,
        boardId,
        position: cards.length,
      });
      setCardTitle('');
      setIsAddingCard(false);
      showToast('Card added', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create card', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteList = async () => {
    if (isViewer) return;
    setIsDeleting(true);
    try {
      await deleteList(list._id);
      showToast('List deleted', 'info');
      setIsDeleteConfirmOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete list', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveListTitle = async () => {
    if (isViewer) return;
    const trimmed = listTitle.trim();
    if (!trimmed || trimmed === list.title) {
      setListTitle(list.title);
      setIsEditingTitle(false);
      return;
    }
    try {
      await updateList(list._id, trimmed);
      setIsEditingTitle(false);
      showToast('List renamed', 'success');
    } catch (err: any) {
      setListTitle(list.title);
      showToast(err.message || 'Failed to rename list', 'error');
    }
  };

  return (
    <>
      <div className="w-72 shrink-0 bg-slate-100 border border-slate-200 rounded-xl flex flex-col max-h-full">
        <div className="p-3 flex items-center justify-between border-b border-slate-200 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isEditingTitle && !isViewer ? (
              <input
                autoFocus
                value={listTitle}
                onChange={(e) => setListTitle(e.target.value)}
                onBlur={handleSaveListTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveListTitle();
                  if (e.key === 'Escape') {
                    setListTitle(list.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="w-full px-2 py-1 text-xs font-bold uppercase bg-white border border-indigo-400 rounded focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => !isViewer && setIsEditingTitle(true)}
                className={`text-left text-xs font-bold text-slate-900 uppercase tracking-wide truncate ${!isViewer ? 'hover:text-indigo-600 cursor-pointer' : 'cursor-default'}`}
                title={!isViewer ? "Click to rename" : ""}
              >
                {list.title}
              </button>
            )}
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-200 text-slate-600 shrink-0">
              {cards.length}
            </span>
          </div>

          {!isViewer && (
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              aria-label="Delete list"
              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        <Droppable droppableId={list._id} isDropDisabled={isViewer}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-2 flex-1 overflow-y-auto space-y-2 min-h-[100px] transition-colors ${
                snapshot.isDraggingOver && !isViewer ? 'bg-indigo-50/50' : ''
              }`}
            >
              {cards.map((card, index) => (
                <KanbanCard key={card._id} card={card} index={index} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {!isViewer && (
          <div className="p-2 border-t border-slate-200">
            {isAddingCard ? (
              <form onSubmit={handleAddCard} className="space-y-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter card title..."
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !cardTitle.trim()}
                    className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md cursor-pointer"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Card'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCard(false)}
                    className="px-2 py-1 text-xs text-slate-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCard(true)}
                className="w-full py-1.5 px-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Card
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Delete List"
        message={`Are you sure you want to delete list "${list.title}" and all its cards?`}
        confirmText="Delete List"
        isLoading={isDeleting}
        onConfirm={handleDeleteList}
        onClose={() => setIsDeleteConfirmOpen(false)}
      />
    </>
  );
};