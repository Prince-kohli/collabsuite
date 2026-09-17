import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import type { List, Card } from '../../types';
import { KanbanCard } from './KanbanCard';
import { useBoardStore } from '../../store/useBoardStore';

interface KanbanColumnProps {
  list: List;
  cards: Card[];
  boardId: string;
}

export const KanbanColumn = ({ list, cards, boardId }: KanbanColumnProps) => {
  const { createCard } = useBoardStore();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim()) return;

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
    } catch (err) {
      console.error('Failed to create card', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-72 shrink-0 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex flex-col max-h-full">
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
            {list.name}
          </h3>
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {cards.length}
          </span>
        </div>
      </div>

      {/* Cards Droppable Area */}
      <Droppable droppableId={list._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-2 flex-1 overflow-y-auto space-y-2 min-h-[100px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
            }`}
          >
            {cards.map((card, index) => (
              <KanbanCard key={card._id} card={card} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Card Footer */}
      <div className="p-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
        {isAddingCard ? (
          <form onSubmit={handleAddCard} className="space-y-2">
            <input
              type="text"
              autoFocus
              placeholder="Enter card title..."
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !cardTitle.trim()}
                className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Adding...' : 'Add Card'}
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCard(false)}
                className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full py-1.5 px-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Card
          </button>
        )}
      </div>
    </div>
  );
};