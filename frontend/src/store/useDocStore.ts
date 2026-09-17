import { create } from 'zustand';
import type { Doc, DocTreeNode } from '../types';
import {
  createDocApi,
  getDocsTreeApi,
  getDocByIdApi,
  updateDocApi,
  archiveDocApi,
  type CreateDocPayload,
  type UpdateDocPayload,
} from '../api/doc.api';

interface DocState {
  docTree: DocTreeNode[];
  activeDoc: Doc | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  fetchDocsTree: (workspaceId: string) => Promise<void>;
  fetchDocById: (docId: string) => Promise<void>;
  createDoc: (payload: CreateDocPayload) => Promise<Doc>;
  updateDocAutoSave: (docId: string, payload: UpdateDocPayload) => Promise<void>;
  archiveDoc: (docId: string, workspaceId: string) => Promise<void>;
  reset: () => void;
}

export const useDocStore = create<DocState>((set, get) => ({
  docTree: [],
  activeDoc: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchDocsTree: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getDocsTreeApi(workspaceId);
      set({ docTree: response.data.tree, isLoading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch docs tree';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchDocById: async (docId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getDocByIdApi(docId);
      set({ activeDoc: response.data.doc, isLoading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch document';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createDoc: async (payload: CreateDocPayload) => {
    try {
      const response = await createDocApi(payload);
      const createdDoc = response.data.doc;

      // Refresh document tree
      await get().fetchDocsTree(payload.workspaceId);
      return createdDoc;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create document';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  updateDocAutoSave: async (docId: string, payload: UpdateDocPayload) => {
    set({ isSaving: true });
    try {
      const response = await updateDocApi(docId, payload);
      const updated = response.data.doc;

      set((state) => ({
        activeDoc: state.activeDoc?._id === docId ? updated : state.activeDoc,
        isSaving: false,
      }));

      // If title changed, update tree view
      if (payload.title && get().activeDoc) {
        await get().fetchDocsTree(get().activeDoc!.workspaceId);
      }
    } catch (err: any) {
      set({ isSaving: false });
      console.error('Auto-save document failed:', err);
    }
  },

  archiveDoc: async (docId: string, workspaceId: string) => {
    try {
      await archiveDocApi(docId);
      if (get().activeDoc?._id === docId) {
        set({ activeDoc: null });
      }
      await get().fetchDocsTree(workspaceId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to archive document';
      set({ error: errorMessage });
    }
  },

  reset: () => {
    set({
      docTree: [],
      activeDoc: null,
      isLoading: false,
      isSaving: false,
      error: null,
    });
  },
}));