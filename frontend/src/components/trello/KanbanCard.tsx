import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import type { Card } from '../../types';
import { useBoardStore } from '../../store/useBoardStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useToastStore } from '../../store/useToastStore';
import { CardDetailModal } from './CardDetailModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface KanbanCardProps {
  card: Card;
  index: number;
}

export const KanbanCard = ({ card, index }: KanbanCardProps) => {
  const { deleteCard } = useBoardStore();
  const { currentUserRole } = useWorkspaceStore();
  const showToast = useToastStore((state) => state.showToast);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isViewer = currentUserRole === 'viewer';

  const handleDeleteCard = async () => {
    if (isViewer) return;
    setIsDeleting(true);
    try {
      await deleteCard(card._id, card.listId);
      showToast('Card deleted', 'info');
      setIsDeleteConfirmOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete card', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Draggable draggableId={card._id} index={index} isDragDisabled={isViewer}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => setIsModalOpen(true)}
            className={`group p-3 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-indigo-500 transition-all relative cursor-pointer ${
              snapshot.isDragging && !isViewer ? 'shadow-lg border-indigo-500 rotate-1' : ''
            }`}
          >
            {!isViewer && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteConfirmOpen(true);
                }}
                aria-label="Delete card"
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {card.labels && card.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {card.labels.map((label, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-100 text-indigo-700"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            <h4 className="text-xs font-semibold text-slate-900 leading-snug pr-4">{card.title}</h4>

            {card.description && (
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{card.description}</p>
            )}

            {card.dueDate && (
              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{new Date(card.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </Draggable>

      <CardDetailModal
        card={card}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Card"
        message={`Are you sure you want to delete "${card.title}"?`}
        confirmText="Delete Card"
        isLoading={isDeleting}
        onConfirm={handleDeleteCard}
        onClose={() => setIsDeleteConfirmOpen(false)}
      />
    </>
  );
};