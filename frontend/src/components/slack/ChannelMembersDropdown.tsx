import { useState, useRef, useEffect } from 'react';
import type { Channel, Workspace } from '../../types';
import { useSlackStore } from '../../store/useSlackStore';
import { useToastStore } from '../../store/useToastStore';
import { ConfirmModal } from '../common/ConfirmModal';

interface ChannelMembersDropdownProps {
  channel: Channel;
  workspace: Workspace | null;
  currentUserRole: string | null;
  currentUserId?: string;
}

export const ChannelMembersDropdown = ({
  channel,
  workspace,
  currentUserRole,
  currentUserId,
}: ChannelMembersDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [confirmMember, setConfirmMember] = useState<{ id: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addMemberToChannel, removeMemberFromChannel, onlineUserIds } = useSlackStore();
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddSection(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const channelCreatorId =
    typeof channel.createdBy === 'string'
      ? channel.createdBy
      : (channel.createdBy as any)?._id || '';

  const workspaceOwnerId =
    typeof workspace?.ownerId === 'string'
      ? workspace.ownerId
      : (workspace?.ownerId as any)?._id || '';

  const isWorkspaceOwner =
    currentUserRole === 'owner' || (!!currentUserId && workspaceOwnerId === currentUserId);
  const isChannelCreator = !!currentUserId && channelCreatorId === currentUserId;
  const canManageMembers = isWorkspaceOwner || isChannelCreator;

  const resolvedMembers: { id: string; name: string; email: string; avatar?: string }[] = [];
  const seenIds = new Set<string>();

  if (channelCreatorId) {
    const creatorObj = typeof channel.createdBy === 'object' ? (channel.createdBy as any) : null;
    let name = creatorObj?.name || 'Channel Creator';
    let email = creatorObj?.email || '';

    const wsMember = workspace?.members?.find((m) => {
      const u = m.userId as any;
      return (u?._id || u?.id || u) === channelCreatorId;
    });
    if (wsMember && typeof wsMember.userId === 'object') {
      const u = wsMember.userId as any;
      name = u.name || name;
      email = u.email || email;
    }

    resolvedMembers.push({ id: channelCreatorId, name, email, avatar: creatorObj?.avatar });
    seenIds.add(channelCreatorId);
  }

  (channel.members || []).forEach((m) => {
    let id = '';
    let name = 'User';
    let email = '';
    let avatar: string | undefined;

    if (typeof m === 'string') {
      id = m;
      const wsMember = workspace?.members?.find((wm) => {
        const u = wm.userId as any;
        return (u?._id || u?.id || u) === m;
      });
      if (wsMember && typeof wsMember.userId === 'object') {
        const u = wsMember.userId as any;
        name = u.name || 'User';
        email = u.email || '';
        avatar = u.avatar;
      }
    } else if (m && typeof m === 'object') {
      id = (m as any)._id || (m as any).id || '';
      name = (m as any).name || 'User';
      email = (m as any).email || '';
      avatar = (m as any).avatar;
    }

    if (id && !seenIds.has(id)) {
      seenIds.add(id);
      resolvedMembers.push({ id, name, email, avatar });
    }
  });

  const availableToAdd = (workspace?.members || [])
    .map((m) => {
      const u = m.userId as any;
      if (typeof u === 'object' && u !== null) {
        return {
          id: u._id || u.id || '',
          name: u.name || 'User',
          email: u.email || '',
        };
      }
      return null;
    })
    .filter((m): m is { id: string; name: string; email: string } => !!m && !seenIds.has(m.id));

  const handleConfirmRemove = async () => {
    if (!confirmMember) return;
    setIsRemoving(true);
    try {
      await removeMemberFromChannel(channel._id, confirmMember.id);
      showToast(`${confirmMember.name} removed from channel`, 'success');
      setConfirmMember(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member', 'error');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAddMember = async (memberId: string, memberName: string) => {
    setIsAdding(true);
    try {
      await addMemberToChannel(channel._id, memberId);
      showToast(`${memberName} added to channel`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add member', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>{resolvedMembers.length} {resolvedMembers.length === 1 ? 'member' : 'members'}</span>
        <svg className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Channel Members</h3>
              <p className="text-[11px] text-slate-500">#{channel.name} · {resolvedMembers.length} users</p>
            </div>
            {canManageMembers && availableToAdd.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddSection((prev) => !prev)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                {showAddSection ? 'Close' : '+ Add User'}
              </button>
            )}
          </div>

          {showAddSection && canManageMembers && (
            <div className="p-3 bg-indigo-50/50 border-b border-indigo-100 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase text-indigo-700 tracking-wider mb-2">
                Add workspace member to channel
              </p>
              {availableToAdd.length === 0 ? (
                <p className="text-xs text-slate-400">All workspace members are already in this channel</p>
              ) : (
                <div className="space-y-1.5">
                  {availableToAdd.map((avail) => (
                    <div
                      key={avail.id}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-slate-800 truncate">{avail.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{avail.email}</p>
                      </div>
                      <button
                        type="button"
                        disabled={isAdding}
                        onClick={() => handleAddMember(avail.id, avail.name)}
                        className="text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
            {resolvedMembers.map((member) => {
              const isCreator = member.id === channelCreatorId;
              const isOwner = member.id === workspaceOwnerId;
              const isMe = member.id === currentUserId;
              const isOnline = onlineUserIds.includes(member.id);

              const canRemoveThisUser = canManageMembers && !isCreator && !isOwner && !isMe;
              const initial = (member.name || 'U').charAt(0).toUpperCase();

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                        {initial}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {member.name}
                        </span>
                        {isMe && <span className="text-[10px] text-slate-400 font-medium">(You)</span>}
                        {isCreator && <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded">Creator</span>}
                        {isOwner && !isCreator && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded">Workspace Owner</span>}
                      </div>
                      {member.email && <p className="text-[10px] text-slate-400 truncate">{member.email}</p>}
                    </div>
                  </div>

                  {canRemoveThisUser && (
                    <button
                      type="button"
                      onClick={() => setConfirmMember({ id: member.id, name: member.name })}
                      className="opacity-90 hover:opacity-100 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {!canManageMembers && (
            <div className="p-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 text-center">
              Only workspace owner or channel creator can remove members
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmMember}
        title="Remove Member"
        message={`Remove "${confirmMember?.name}" from #${channel.name}?`}
        confirmText="Remove User"
        variant="danger"
        isLoading={isRemoving}
        onConfirm={handleConfirmRemove}
        onClose={() => { if (!isRemoving) setConfirmMember(null); }}
      />
    </div>
  );
};