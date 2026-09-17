import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { InviteMemberModal } from '../components/workspace/InviteMemberModal';
import type { User } from '../types';

export const WorkspaceSettingsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { activeWorkspace, currentUserRole } = useWorkspaceStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  if (!activeWorkspace) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No workspace selected.</p>
      </div>
    );
  }

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
      email: userField,
      avatarInitial: 'U',
    };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Workspace Settings
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Manage workspace profile and team member permissions.
        </p>
      </div>

      {/* General Information Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          General Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-zinc-400 block mb-1 font-medium">Workspace Name</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{activeWorkspace.name}</span>
          </div>
          <div>
            <span className="text-zinc-400 block mb-1 font-medium">Workspace Slug</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">{activeWorkspace.slug}</span>
          </div>
          <div>
            <span className="text-zinc-400 block mb-1 font-medium">Description</span>
            <span className="text-zinc-700 dark:text-zinc-300">
              {activeWorkspace.description || 'No description provided'}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block mb-1 font-medium">Created On</span>
            <span className="text-zinc-700 dark:text-zinc-300">
              {new Date(activeWorkspace.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Members Management Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Team Members ({activeWorkspace.members?.length || 0})
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              People who have access to this workspace
            </p>
          </div>

          {canManageMembers && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invite Member
            </button>
          )}
        </div>

        {/* Members Table */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {activeWorkspace.members?.map((member, index) => {
            const userDetails = getMemberDetails(member.userId);

            return (
              <div key={index} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center">
                    {userDetails.avatarInitial}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {userDetails.name}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {userDetails.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    {member.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Member Modal */}
      {workspaceId && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          workspaceId={workspaceId}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
    </div>
  );
};