import { create } from 'zustand';
import type { Board, List, Card } from '../types';
import {
  getWorkspaceBoardsApi,
  createBoardApi,
  deleteBoardApi,
  getBoardDetailsApi,
  createListApi,
  deleteListApi,
  createCardApi,
  updateCardApi,
  deleteCardApi,
  uploadAttachmentApi,
  removeAttachmentApi,
  moveCardApi,
  type CreateBoardPayload,
  type CreateListPayload,
  type CreateCardPayload,
  type UpdateCardPayload,
  updateListApi,
  updateBoardApi,
} from '../api/trello.api';

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  lists: List[];
  cardsByListId: Record<string, Card[]>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWorkspaceBoards: (workspaceId: string) => Promise<void>;
  fetchBoardDetails: (boardId: string) => Promise<void>;
  createBoard: (payload: CreateBoardPayload) => Promise<Board>;
  deleteBoard: (boardId: string) => Promise<void>;
  createList: (payload: CreateListPayload) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  createCard: (payload: CreateCardPayload) => Promise<void>;
  updateCardDetails: (cardId: string, payload: UpdateCardPayload) => Promise<void>;
  uploadCardAttachment: (cardId: string, file: File) => Promise<void>;
  deleteCardAttachment: (cardId: string, attachmentId: string) => Promise<void>;
  deleteCard: (cardId: string, listId: string) => Promise<void>;
    updateBoard: (boardId: string, payload: { title?: string; description?: string }) => Promise<void>;
  updateList: (listId: string, title: string) => Promise<void>;
  moveCardOptimistic: (
    cardId: string,
    sourceListId: string,
    targetListId: string,
    sourceIndex: number,
    targetIndex: number
  ) => Promise<void>;
  reset: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  lists: [],
  cardsByListId: {},
  isLoading: false,
  error: null,

  fetchWorkspaceBoards: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getWorkspaceBoardsApi(workspaceId);
      set({ boards: response.data.boards, isLoading: false });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch boards';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchBoardDetails: async (boardId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getBoardDetailsApi(boardId);
      const { board, lists = [], cards = [] } = response.data;

      const cardsMap: Record<string, Card[]> = {};
      lists.forEach((list) => {
        cardsMap[list._id] = [];
      });

      cards.forEach((card) => {
        if (!cardsMap[card.listId]) {
          cardsMap[card.listId] = [];
        }
        cardsMap[card.listId].push(card);
      });

      Object.keys(cardsMap).forEach((listId) => {
        cardsMap[listId].sort((a, b) => a.position - b.position);
      });

      const sortedLists = [...lists].sort((a, b) => a.position - b.position);

      set({
        currentBoard: board,
        lists: sortedLists,
        cardsByListId: cardsMap,
        isLoading: false,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch board details';
      set({ error: errorMessage, isLoading: false });
    }
  },
  updateBoard: async (boardId, payload) => {
    try {
      const response = await updateBoardApi(boardId, payload);
      const updated = response.data.board;
      set((state) => ({
        boards: state.boards.map((b) => (b._id === boardId ? updated : b)),
        currentBoard:
          state.currentBoard?._id === boardId
            ? { ...state.currentBoard, ...updated }
            : state.currentBoard,
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update board';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  updateList: async (listId, title) => {
    try {
      const response = await updateListApi(listId, { title });
      const updated = response.data.list;
      set((state) => ({
        lists: state.lists.map((l) => (l._id === listId ? updated : l)),
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update list';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  createBoard: async (payload: CreateBoardPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await createBoardApi(payload);
      const newBoard = response.data.board;
      set((state) => ({
        boards: [newBoard, ...state.boards],
        isLoading: false,
      }));
      return newBoard;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create board';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  deleteBoard: async (boardId: string) => {
    try {
      await deleteBoardApi(boardId);
      set((state) => ({
        boards: state.boards.filter((b) => b._id !== boardId),
        currentBoard: state.currentBoard?._id === boardId ? null : state.currentBoard,
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete board';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  createList: async (payload: CreateListPayload) => {
    try {
      const response = await createListApi(payload);
      const newList = response.data.list;

      set((state) => ({
        lists: [...state.lists, newList],
        cardsByListId: {
          ...state.cardsByListId,
          [newList._id]: [],
        },
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create list';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  deleteList: async (listId: string) => {
    try {
      await deleteListApi(listId);
      set((state) => {
        const newCardsMap = { ...state.cardsByListId };
        delete newCardsMap[listId];
        return {
          lists: state.lists.filter((l) => l._id !== listId),
          cardsByListId: newCardsMap,
        };
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete list';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  createCard: async (payload: CreateCardPayload) => {
    try {
      const response = await createCardApi(payload);
      const newCard = response.data.card;

      set((state) => {
        const listCards = state.cardsByListId[newCard.listId] || [];
        return {
          cardsByListId: {
            ...state.cardsByListId,
            [newCard.listId]: [...listCards, newCard],
          },
        };
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create card';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  updateCardDetails: async (cardId: string, payload: UpdateCardPayload) => {
    try {
      const response = await updateCardApi(cardId, payload);
      const updatedCard = response.data.card;

      set((state) => {
        const listCards = state.cardsByListId[updatedCard.listId] || [];
        return {
          cardsByListId: {
            ...state.cardsByListId,
            [updatedCard.listId]: listCards.map((c) =>
              c._id === cardId ? updatedCard : c
            ),
          },
        };
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update card';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  uploadCardAttachment: async (cardId: string, file: File) => {
    try {
      const response = await uploadAttachmentApi(cardId, file);
      const updatedCard = response.data.card;

      set((state) => {
        const listCards = state.cardsByListId[updatedCard.listId] || [];
        return {
          cardsByListId: {
            ...state.cardsByListId,
            [updatedCard.listId]: listCards.map((c) =>
              c._id === cardId ? updatedCard : c
            ),
          },
        };
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to upload attachment';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  deleteCardAttachment: async (cardId: string, attachmentId: string) => {
    try {
      const response = await removeAttachmentApi(cardId, attachmentId);
      const updatedCard = response.data.card;

      set((state) => {
        const listCards = state.cardsByListId[updatedCard.listId] || [];
        return {
          cardsByListId: {
            ...state.cardsByListId,
            [updatedCard.listId]: listCards.map((c) =>
              c._id === cardId ? updatedCard : c
            ),
          },
        };
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to remove attachment';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  deleteCard: async (cardId: string, listId: string) => {
    try {
      await deleteCardApi(cardId);
      set((state) => {
        const currentListCards = state.cardsByListId[listId] || [];
        return {
          cardsByListId: {
            ...state.cardsByListId,
            [listId]: currentListCards.filter((c) => c._id !== cardId),
          },
        };
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete card';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  moveCardOptimistic: async (
    cardId: string,
    sourceListId: string,
    targetListId: string,
    sourceIndex: number,
    targetIndex: number
  ) => {
    const previousCardsMap = get().cardsByListId;

    const newCardsMap: Record<string, Card[]> = JSON.parse(JSON.stringify(previousCardsMap));
    const sourceCards = newCardsMap[sourceListId] || [];
    const targetCards = sourceListId === targetListId ? sourceCards : newCardsMap[targetListId] || [];

    const [movedCard] = sourceCards.splice(sourceIndex, 1);
    if (!movedCard) return;

    movedCard.listId = targetListId;
    targetCards.splice(targetIndex, 0, movedCard);

    targetCards.forEach((card, idx) => {
      card.position = idx;
    });

    if (sourceListId !== targetListId) {
      sourceCards.forEach((card, idx) => {
        card.position = idx;
      });
    }

    set({ cardsByListId: newCardsMap });

    try {
      await moveCardApi(cardId, {
        targetListId,
        newPosition: targetIndex,
      });
    } catch (err: any) {
      set({ cardsByListId: previousCardsMap });
      const errorMessage = err.response?.data?.message || 'Failed to move card';
      set({ error: errorMessage });
    }
  },

  reset: () => {
    set({
      boards: [],
      currentBoard: null,
      lists: [],
      cardsByListId: {},
      isLoading: false,
      error: null,
    });
  },
}));