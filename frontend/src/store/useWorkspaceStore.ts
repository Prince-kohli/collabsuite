import { create } from 'zustand';
import type { Workspace } from '../types';
import {
  getUserWorkspacesApi,
  getWorkspaceByIdApi,
  createWorkspaceApi,
  addWorkspaceMemberApi,
} from '../api/workspace.api';
import type {
  CreateWorkspacePayload,
  AddMemberPayload,
} from '../api/workspace.api';

const ACTIVE_WORKSPACE_STORAGE_KEY = 'collabsuite_active_workspace_id';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  currentUserRole: 'owner' | 'admin' | 'member' | 'viewer' | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWorkspaces: () => Promise<void>;
  setActiveWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (payload: CreateWorkspacePayload, currentUserId?: string) => Promise<Workspace>;
  inviteMember: (workspaceId: string, payload: AddMemberPayload) => Promise<void>;
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

      // Automatically select saved workspace or first workspace if none active
      const savedWorkspaceId = localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
      const currentActive = get().activeWorkspace;

      if (!currentActive && workspaces.length > 0) {
        const workspaceToSelect = workspaces.find((w) => w._id === savedWorkspaceId) || workspaces[0];
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

    // Optimistic UI update: Insert temporary workspace
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

      // Replace optimistic workspace with server response
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
      // Rollback optimistic update on error
      set({ workspaces: previousWorkspaces });
      const errorMessage = err.response?.data?.message || 'Failed to create workspace';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  inviteMember: async (workspaceId: string, payload: AddMemberPayload) => {
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