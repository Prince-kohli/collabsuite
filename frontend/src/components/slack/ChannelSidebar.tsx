import { useState } from 'react';
import type { Channel } from '../../types';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSlackStore } from '../../store/useSlackStore';
import { useToastStore } from '../../store/useToastStore';
import { ConfirmModal } from '../common/ConfirmModal';

interface ChannelSidebarProps {
  channels: Channel[];
  activeChannelId?: string;
  onSelectChannel: (channel: Channel) => void;
  onOpenCreateChannelModal: () => void;
  onStartDM?: (userId: string) => void;
}

function getMemberMeta(userField: unknown): { id: string; name: string } | null {
  if (!userField) return null;
  if (typeof userField === 'string') return { id: userField, name: 'User' };
  const u = userField as { _id?: string; id?: string; name?: string };
  const id = u._id || u.id || '';
  if (!id) return null;
  return { id, name: u.name || 'User' };
}

function getDmTargetId(
  channel: Channel,
  myId?: string
): string | null {
  const rawMembers = (channel.members || []) as unknown[];
  const memberIds = rawMembers
    .map((m) => {
      if (typeof m === 'string') return m;
      const obj = m as { _id?: string; id?: string };
      return obj._id || obj.id || '';
    })
    .filter(Boolean);

  return memberIds.find((id) => id && id !== myId) || null;
}

function getDmDisplayName(
  otherId: string | null,
  workspaceMembers: { id: string; name: string }[]
): string {
  if (!otherId) return 'Direct Message';
  const found = workspaceMembers.find((m) => m.id === otherId);
  return found?.name || 'Direct Message';
}

export const ChannelSidebar = ({
  channels,
  activeChannelId,
  onSelectChannel,
  onOpenCreateChannelModal,
  onStartDM,
}: ChannelSidebarProps) => {
  const { currentUserRole, activeWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const { deleteChannel, onlineUserIds } = useSlackStore();
  const showToast = useToastStore((s) => s.showToast);

  // Everyone can create channels now!
  const canCreate = !!currentUserRole; 
  const myId = user?.id;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Channel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const normalChannels = channels.filter((c) => (c.type || 'channel') !== 'dm');
  const dmChannels = channels.filter((c) => c.type === 'dm');

  const members =
    activeWorkspace?.members
      ?.map((m) => getMemberMeta(m.userId))
      .filter((m): m is { id: string; name: string } => !!m && m.id !== myId) || [];

  const canDeleteChannel = (channel: Channel) => {
    if ((channel.type || 'channel') === 'dm') return false;
    if (currentUserRole === 'owner') return true;
    const creatorId =
      typeof channel.createdBy === 'string'
        ? channel.createdBy
        : (channel.createdBy as any)?._id;
    return !!myId && creatorId === myId;
  };

  const handleDeleteClick = (e: React.MouseEvent, channel: Channel) => {
    e.stopPropagation();
    if (!canDeleteChannel(channel)) {
      showToast('Only workspace owner or channel creator can delete', 'error');
      return;
    }
    setPendingDelete(channel);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteChannel(pendingDelete._id);
      showToast('Channel deleted', 'success');
      setConfirmOpen(false);
      setPendingDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete channel', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-60 border-r border-slate-200 bg-slate-50 p-3 flex flex-col justify-between shrink-0">
      <div className="space-y-4 overflow-hidden flex flex-col min-h-0">
        {/* Channels */}
        <div>
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Channels
            </span>
            {canCreate && (
              <button
                type="button"
                onClick={onOpenCreateChannelModal}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 cursor-pointer"
                title="Create Channel"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>

          <div className="space-y-0.5 overflow-y-auto max-h-52">
            {normalChannels.length === 0 ? (
              <p className="text-xs text-slate-400 px-2 py-3 text-center">No channels yet</p>
            ) : (
              normalChannels.map((channel) => {
                const isActive = activeChannelId === channel._id;
                return (
                  <button
                    key={channel._id}
                    type="button"
                    onClick={() => onSelectChannel(channel)}
                    className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span className="text-slate-400 font-bold shrink-0">
                        {channel.isPrivate ? 'P' : '#'}
                      </span>
                      <span className="truncate">{channel.name}</span>
                    </div>
                    {canDeleteChannel(channel) && (
                      <span
                        onClick={(e) => handleDeleteClick(e, channel)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 text-[10px] font-bold px-1"
                        title="Delete channel"
                      >
                        x
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Direct Messages */}
        <div className="min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Direct Messages
            </span>
          </div>

          <div className="space-y-0.5 overflow-y-auto max-h-40">
            {dmChannels.map((channel) => {
              const isActive = activeChannelId === channel._id;
              const otherId = getDmTargetId(channel, myId);
              const dmName = getDmDisplayName(otherId, members);
              const initial = dmName.charAt(0).toUpperCase();
              const isOnline = otherId ? onlineUserIds.includes(otherId) : false;

              return (
                <button
                  key={channel._id}
                  type="button"
                  onClick={() => onSelectChannel(channel)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="relative shrink-0">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                      {initial}
                    </span>
                    <span
                      className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <span className="truncate">{dmName}</span>
                </button>
              );
            })}

            {canCreate && members.length > 0 && (
              <div className="pt-2 border-t border-slate-200 mt-2 space-y-0.5">
                <p className="px-2 text-[10px] text-slate-400 font-semibold uppercase">Start DM</p>
                {members.map((m) => {
                  const isOnline = onlineUserIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onStartDM?.(m.id)}
                      className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 cursor-pointer truncate"
                    >
                       <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      {m.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {canCreate && (
        <button
          type="button"
          onClick={onOpenCreateChannelModal}
          className="w-full py-2 px-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer border border-dashed border-indigo-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Channel
        </button>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Channel"
        message={`Delete #${pendingDelete?.name || ''}? All messages will be removed.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) {
            setConfirmOpen(false);
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
};