import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { InviteMemberModal } from '../components/workspace/InviteMemberModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import type { User } from '../types';

export const WorkspaceSettingsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  const {
    activeWorkspace,
    currentUserRole,
    updateWorkspace,
    deleteWorkspace,
    updateMemberRole,
    removeMember,
    setActiveWorkspace,
  } = useWorkspaceStore();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);

  const isOwner = currentUserRole === 'owner';

  useEffect(() => {
    if (workspaceId && activeWorkspace?._id !== workspaceId) {
      setActiveWorkspace(workspaceId);
    }
  }, [workspaceId, activeWorkspace?._id, setActiveWorkspace]);

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name || '');
      setDescription(activeWorkspace.description || '');
    }
  }, [activeWorkspace]);

  const myUserId = user?.id;

  const getMemberUserId = (userField: User | string): string => {
    if (typeof userField === 'string') return userField;
    return (userField as any).id || (userField as any)._id || '';
  };

  const getMemberDetails = (userField: User | string) => {
    if (typeof userField === 'object' && userField !== null) {
      return {
        name: userField.name || 'Unknown User',
        email: userField.email || 'No email available',
        avatarInitial: userField.name ? userField.name.charAt(0).toUpperCase() : 'U',
      };
    }
    return {
      name: 'User',
      email: String(userField),
      avatarInitial: 'U',
    };
  };

  const primaryOwnerId = useMemo(() => {
    if (!activeWorkspace) return '';
    const o = activeWorkspace.ownerId;
    if (typeof o === 'string') return o;
    return (o as any).id || (o as any)._id || '';
  }, [activeWorkspace]);

  const handleSaveGeneral = async () => {
    if (!workspaceId || !isOwner) return;
    if (!name.trim() || name.trim().length < 2) {
      showToast('Workspace name must be at least 2 characters', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await updateWorkspace(workspaceId, {
        name: name.trim(),
        description: description.trim(),
      });
      showToast('Workspace updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update workspace', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (
    memberId: string,
    role: 'owner' | 'member' | 'viewer'
  ) => {
    if (!workspaceId || !isOwner) return;
    setRoleUpdatingId(memberId);
    try {
      await updateMemberRole(workspaceId, memberId, { role });
      showToast('Member role updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'error');
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!workspaceId || !removeTarget) return;
    setIsRemoving(true);
    try {
      await removeMember(workspaceId, removeTarget.id);
      showToast(`${removeTarget.name} removed from workspace`, 'success');
      setRemoveTarget(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member', 'error');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!workspaceId || !isOwner) return;
    setIsDeleting(true);
    try {
      await deleteWorkspace(workspaceId);
      showToast('Workspace deleted', 'success');
      setDeleteOpen(false);
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete workspace', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">No workspace selected.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Workspace Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage workspace profile and team member permissions.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          General Information
        </h2>

        {isOwner ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1 text-xs font-medium">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 text-xs font-medium">
                  Workspace Slug
                </label>
                <input
                  type="text"
                  value={activeWorkspace.slug}
                  disabled
                  className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-xs font-medium">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-400">
                Created on {new Date(activeWorkspace.createdAt).toLocaleDateString()}
              </p>
              <button
                type="button"
                onClick={handleSaveGeneral}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg cursor-pointer flex items-center gap-2"
              >
                {isSaving && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Workspace Name</span>
              <span className="font-semibold text-slate-900">{activeWorkspace.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Workspace slug</span>
              <span className="font-mono text-slate-700">{activeWorkspace.slug}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Description</span>
              <span className="text-slate-700">
                {activeWorkspace.description || 'No description provided'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Created On</span>
              <span className="text-slate-700">
                {new Date(activeWorkspace.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Team Members ({activeWorkspace.members?.length || 0})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              People who have access to this workspace
            </p>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              Invite Member
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {activeWorkspace.members?.map((member, index) => {
            const memberId = getMemberUserId(member.userId);
            const userDetails = getMemberDetails(member.userId);
            const isPrimaryOwner = memberId === primaryOwnerId;
            const isMe = memberId === myUserId;

            // Owner can change anyone except primary creator
            const canEditRole = isOwner && !isPrimaryOwner;
            const canRemove = isOwner && !isPrimaryOwner && !isMe;

            return (
              <div
                key={memberId || index}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {userDetails.avatarInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {userDetails.name}
                      {isMe ? ' (You)' : ''}
                      {isPrimaryOwner ? ' · Primary' : ''}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{userDetails.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canEditRole ? (
                    <select
                      value={member.role}
                      disabled={roleUpdatingId === memberId}
                      onChange={(e) =>
                        handleRoleChange(
                          memberId,
                          e.target.value as 'owner' | 'member' | 'viewer'
                        )
                      }
                      className="text-[11px] font-medium capitalize px-2 py-1 rounded-md bg-white text-slate-700 border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="owner">Owner</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {member.role}
                    </span>
                  )}

                  {canRemove && (
                    <button
                      type="button"
                      onClick={() =>
                        setRemoveTarget({ id: memberId, name: userDetails.name })
                      }
                      className="text-[11px] font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isOwner && (
        <div className="bg-white border border-rose-200 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-rose-700">Danger Zone</h2>
          <p className="text-xs text-slate-500">
            Deleting this workspace permanently removes boards, docs, channels, and messages.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
          >
            Delete Workspace
          </button>
        </div>
      )}

      {workspaceId && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          workspaceId={workspaceId}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={!!removeTarget}
        title="Remove Member"
        message={`Remove "${removeTarget?.name}" from this workspace?`}
        confirmText="Remove"
        variant="danger"
        isLoading={isRemoving}
        onConfirm={handleConfirmRemove}
        onClose={() => {
          if (!isRemoving) setRemoveTarget(null);
        }}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        title="Delete Workspace"
        message={`Delete "${activeWorkspace.name}" and all of its data?`}
        confirmText="Delete Workspace"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) setDeleteOpen(false);
        }}
      />
    </div>
  );
};