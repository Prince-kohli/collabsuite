import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSlackStore } from '../../store/useSlackStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

const createChannelSchema = z.object({
  name: z
    .string()
    .min(2, 'Channel name must be at least 2 characters')
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  topic: z.string().max(100).optional(),
  isPrivate: z.boolean(),
});

type CreateChannelFormValues = z.infer<typeof createChannelSchema>;

interface CreateChannelModalProps {
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
}

function getMemberMeta(userField: unknown): { id: string; name: string } | null {
  if (!userField) return null;
  if (typeof userField === 'string') return { id: userField, name: 'User' };
  const u = userField as { _id?: string; id?: string; name?: string };
  const id = u._id || u.id || '';
  if (!id) return null;
  return { id, name: u.name || 'User' };
}

export const CreateChannelModal = ({ isOpen, workspaceId, onClose }: CreateChannelModalProps) => {
  const { createChannel } = useSlackStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateChannelFormValues>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: { name: '', topic: '', isPrivate: false },
  });

  const isPrivate = watch('isPrivate');

  const workspaceMembers = useMemo(() => {
    const myId = user?.id;
    if (!activeWorkspace?.members) return [] as { id: string; name: string }[];
    return activeWorkspace.members
      .map((m) => getMemberMeta(m.userId))
      .filter((m): m is { id: string; name: string } => !!m && m.id !== myId);
  }, [activeWorkspace, user?.id]);

  if (!isOpen) return null;

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onSubmit = async (values: CreateChannelFormValues) => {
    setServerError(null);
    try {
      if (values.isPrivate && selectedMemberIds.length === 0) {
        setServerError('Select at least one member for a private channel');
        return;
      }

      await createChannel({
        workspaceId,
        name: values.name,
        topic: values.topic,
        isPrivate: values.isPrivate,
        memberIds: values.isPrivate ? selectedMemberIds : [],
      });

      showToast(
        values.isPrivate ? 'Private channel created' : 'Channel created',
        'success'
      );
      reset();
      setSelectedMemberIds([]);
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to create channel');
    }
  };

  const handleClose = () => {
    reset();
    setSelectedMemberIds([]);
    setServerError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Create Channel</h2>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {serverError && (
          <div className="p-3 mb-4 text-xs text-rose-600 bg-rose-50 rounded-lg border border-rose-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Channel Name *</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-sm font-semibold">#</span>
              <input
                type="text"
                placeholder="e.g. general"
                {...register('name')}
                className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Topic (Optional)</label>
            <input
              type="text"
              placeholder="What is this channel about?"
              {...register('topic')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPrivate" {...register('isPrivate')} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
            <label htmlFor="isPrivate" className="text-xs text-slate-700 font-medium cursor-pointer">
              Private channel (only selected members can see)
            </label>
          </div>

          {isPrivate && (
            <div className="border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Add members</p>
              {workspaceMembers.length === 0 ? (
                <p className="text-xs text-slate-400">No other members in workspace</p>
              ) : (
                workspaceMembers.map((m) => {
                  const checked = selectedMemberIds.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(m.id)}
                        className="accent-indigo-600 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800">{m.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};