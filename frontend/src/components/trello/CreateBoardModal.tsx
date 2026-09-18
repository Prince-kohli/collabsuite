import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBoardStore } from '../../store/useBoardStore';
import { useToastStore } from '../../store/useToastStore';

const createBoardSchema = z.object({
  title: z
    .string()
    .min(3, 'Board title must be at least 3 characters')
    .max(50, 'Board title must not exceed 50 characters'),
  description: z.string().max(200, 'Description must not exceed 200 characters').optional(),
});

type CreateBoardFormValues = z.infer<typeof createBoardSchema>;

interface CreateBoardModalProps {
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
}

export const CreateBoardModal = ({ isOpen, workspaceId, onClose }: CreateBoardModalProps) => {
  const navigate = useNavigate();
  const { createBoard } = useBoardStore();
  const showToast = useToastStore((state) => state.showToast);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBoardFormValues>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: CreateBoardFormValues) => {
    try {
      const board = await createBoard({
        ...values,
        workspaceId,
      });
      showToast('Board created successfully!', 'success');
      reset();
      onClose();
      navigate(`/workspaces/${workspaceId}/boards/${board._id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create board', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Create Kanban Board</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Board Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Sprint Roadmap, Q3 Marketing"
              {...register('title')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
            {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Purpose of this kanban board"
              {...register('description')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isSubmitting ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};