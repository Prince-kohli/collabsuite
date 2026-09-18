import { Draggable } from '@hello-pangea/dnd';
import type { Card } from '../../types';

interface KanbanCardProps {
  card: Card;
  index: number;
}

export const KanbanCard = ({ card, index }: KanbanCardProps) => {
  return (
    <Draggable draggableId={card._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-indigo-500 transition-all ${
            snapshot.isDragging ? 'shadow-lg border-indigo-500 rotate-1' : ''
          }`}
        >
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

          <h4 className="text-xs font-semibold text-slate-900 leading-snug">{card.title}</h4>

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
  );
};