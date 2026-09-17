import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSlackStore } from '../../store/useSlackStore';

const createChannelSchema = z.object({
  name: z
    .string()
    .min(2, 'Channel name must be at least 2 characters')
    .max(30, 'Channel name must not exceed 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Channel name must be lowercase alphanumeric with hyphens'),
  topic: z.string().max(100, 'Topic must not exceed 100 characters').optional(),
  isPrivate: z.boolean(),
});

type CreateChannelFormValues = z.infer<typeof createChannelSchema>;

interface CreateChannelModalProps {
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
}

export const CreateChannelModal = ({ isOpen, workspaceId, onClose }: CreateChannelModalProps) => {
  const { createChannel } = useSlackStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateChannelFormValues>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: '',
      topic: '',
      isPrivate: false,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: CreateChannelFormValues) => {
    setServerError(null);
    try {
      await createChannel({
        workspaceId,
        ...values,
      });
      reset();
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to create channel');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Create Channel
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {serverError && (
          <div className="p-3 mb-4 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Channel Name *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-zinc-400 text-sm font-semibold">#</span>
              <input
                type="text"
                placeholder="e.g. general, announcement"
                {...register('name')}
                className="w-full pl-7 pr-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Topic (Optional)
            </label>
            <input
              type="text"
              placeholder="What is this channel about?"
              {...register('topic')}
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
            />
            {errors.topic && (
              <p className="mt-1 text-xs text-red-500">{errors.topic.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPrivate"
              {...register('isPrivate')}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700"
            />
            <label htmlFor="isPrivate" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer">
              Make channel private (Only invited members can view)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};