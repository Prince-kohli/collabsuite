import { create } from 'zustand';
import type { Workspace } from '../types';
import {
  getUserWorkspacesApi,
  getWorkspaceByIdApi,
  createWorkspaceApi,
  updateWorkspaceApi,
  deleteWorkspaceApi,
  addWorkspaceMemberApi,
  updateWorkspaceMemberRoleApi,
  removeWorkspaceMemberApi,
} from '../api/workspace.api';
import type {
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  AddMemberPayload,
  UpdateMemberRolePayload,
} from '../api/workspace.api';

const ACTIVE_WORKSPACE_STORAGE_KEY = 'collabsuite_active_workspace_id';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  currentUserRole: 'owner'  | 'member' | 'viewer' | null;
  isLoading: boolean;
  error: string | null;

  fetchWorkspaces: () => Promise<void>;
  setActiveWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (payload: CreateWorkspacePayload, currentUserId?: string) => Promise<Workspace>;
  updateWorkspace: (workspaceId: string, payload: UpdateWorkspacePayload) => Promise<Workspace>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  inviteMember: (workspaceId: string, payload: AddMemberPayload) => Promise<void>;
  updateMemberRole: (
    workspaceId: string,
    memberId: string,
    payload: UpdateMemberRolePayload
  ) => Promise<void>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  currentUserRole: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getUserWorkspacesApi();
      const workspaces = response.data.workspaces;
      set({ workspaces, isLoading: false });

      const savedWorkspaceId = localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
      const currentActive = get().activeWorkspace;

      if (!currentActive && workspaces.length > 0) {
        const workspaceToSelect =
          workspaces.find((w) => w._id === savedWorkspaceId) || workspaces[0];
        await get().setActiveWorkspace(workspaceToSelect._id);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch workspaces';
      set({ error: errorMessage, isLoading: false });
    }
  },

  setActiveWorkspace: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getWorkspaceByIdApi(workspaceId);
      const { workspace, currentUserRole } = response.data;

      localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, workspace._id);
      set({
        activeWorkspace: workspace,
        currentUserRole,
        isLoading: false,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load workspace details';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createWorkspace: async (payload: CreateWorkspacePayload, currentUserId?: string) => {
    const previousWorkspaces = get().workspaces;
    const tempId = `temp_${Date.now()}`;
    const optimisticWorkspace: Workspace = {
      _id: tempId,
      name: payload.name,
      slug: payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: payload.description || '',
      ownerId: currentUserId || 'temp_user',
      members: currentUserId
        ? [{ userId: currentUserId, role: 'owner', joinedAt: new Date().toISOString() }]
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({ workspaces: [optimisticWorkspace, ...previousWorkspaces], error: null });

    try {
      const response = await createWorkspaceApi(payload);
      const createdWorkspace = response.data.workspace;

      set({
        workspaces: [
          createdWorkspace,
          ...get().workspaces.filter((w) => w._id !== tempId),
        ],
        activeWorkspace: createdWorkspace,
        currentUserRole: 'owner',
      });

      localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, createdWorkspace._id);
      return createdWorkspace;
    } catch (err: any) {
      set({ workspaces: previousWorkspaces });
      const errorMessage = err.response?.data?.message || 'Failed to create workspace';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  updateWorkspace: async (workspaceId, payload) => {
    try {
      const response = await updateWorkspaceApi(workspaceId, payload);
      const updated = response.data.workspace;
      set({
        activeWorkspace: updated,
        workspaces: get().workspaces.map((w) => (w._id === workspaceId ? updated : w)),
      });
      return updated;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update workspace';
      throw new Error(errorMessage);
    }
  },

  deleteWorkspace: async (workspaceId) => {
    try {
      await deleteWorkspaceApi(workspaceId);
      const remaining = get().workspaces.filter((w) => w._id !== workspaceId);
      set({ workspaces: remaining });

      if (get().activeWorkspace?._id === workspaceId) {
        localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
        if (remaining.length > 0) {
          await get().setActiveWorkspace(remaining[0]._id);
        } else {
          set({ activeWorkspace: null, currentUserRole: null });
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete workspace';
      throw new Error(errorMessage);
    }
  },

  inviteMember: async (workspaceId, payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await addWorkspaceMemberApi(workspaceId, payload);
      const updatedWorkspace = response.data.workspace;

      set({
        activeWorkspace: updatedWorkspace,
        workspaces: get().workspaces.map((w) =>
          w._id === workspaceId ? updatedWorkspace : w
        ),
        isLoading: false,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to invite member';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateMemberRole: async (workspaceId, memberId, payload) => {
    try {
      const response = await updateWorkspaceMemberRoleApi(workspaceId, memberId, payload);
      const updatedWorkspace = response.data.workspace;
      set({
        activeWorkspace: updatedWorkspace,
        workspaces: get().workspaces.map((w) =>
          w._id === workspaceId ? updatedWorkspace : w
        ),
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update member role';
      throw new Error(errorMessage);
    }
  },

  removeMember: async (workspaceId, memberId) => {
    try {
      const response = await removeWorkspaceMemberApi(workspaceId, memberId);
      const updatedWorkspace = response.data.workspace;
      set({
        activeWorkspace: updatedWorkspace,
        workspaces: get().workspaces.map((w) =>
          w._id === workspaceId ? updatedWorkspace : w
        ),
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to remove member';
      throw new Error(errorMessage);
    }
  },

  reset: () => {
    localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
    set({
      workspaces: [],
      activeWorkspace: null,
      currentUserRole: null,
      isLoading: false,
      error: null,
    });
  },
}));