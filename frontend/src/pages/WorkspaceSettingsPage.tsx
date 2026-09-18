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
        <p className="text-sm text-slate-500">No workspace selected.</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1 font-medium">Workspace Name</span>
            <span className="font-semibold text-slate-900">{activeWorkspace.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1 font-medium">Workspace Slug</span>
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

          {canManageMembers && (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invite Member
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {activeWorkspace.members?.map((member, index) => {
            const userDetails = getMemberDetails(member.userId);

            return (
              <div key={index} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {userDetails.avatarInitial}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{userDetails.name}</p>
                    <p className="text-[11px] text-slate-400">{userDetails.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {member.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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