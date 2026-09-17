import { create } from 'zustand';
import type { Board, List, Card } from '../types';
import {
  createBoardApi,
  getBoardDetailsApi,
  createListApi,
  createCardApi,
  moveCardApi,
  type CreateBoardPayload,
  type CreateListPayload,
  type CreateCardPayload,
} from '../api/trello.api';

interface BoardState {
  currentBoard: Board | null;
  lists: List[];
  cardsByListId: Record<string, Card[]>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBoardDetails: (boardId: string) => Promise<void>;
  createBoard: (payload: CreateBoardPayload) => Promise<Board>;
  createList: (payload: CreateListPayload) => Promise<void>;
  createCard: (payload: CreateCardPayload) => Promise<void>;
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
  currentBoard: null,
  lists: [],
  cardsByListId: {},
  isLoading: false,
  error: null,

  fetchBoardDetails: async (boardId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getBoardDetailsApi(boardId);
      const { board, lists = [], cards = [] } = response.data;

      // Group cards by listId
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

      // Sort cards in each list by position
      Object.keys(cardsMap).forEach((listId) => {
        cardsMap[listId].sort((a, b) => a.position - b.position);
      });

      // Sort lists by position
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

  createBoard: async (payload: CreateBoardPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await createBoardApi(payload);
      set({ isLoading: false });
      return response.data.board;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create board';
      set({ error: errorMessage, isLoading: false });
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

  moveCardOptimistic: async (
    cardId: string,
    sourceListId: string,
    targetListId: string,
    sourceIndex: number,
    targetIndex: number
  ) => {
    const previousCardsMap = get().cardsByListId;

    // Deep clone current map
    const newCardsMap: Record<string, Card[]> = JSON.parse(JSON.stringify(previousCardsMap));
    const sourceCards = newCardsMap[sourceListId] || [];
    const targetCards = sourceListId === targetListId ? sourceCards : newCardsMap[targetListId] || [];

    // Remove card from source list
    const [movedCard] = sourceCards.splice(sourceIndex, 1);
    if (!movedCard) return;

    movedCard.listId = targetListId;

    // Insert card into target list
    targetCards.splice(targetIndex, 0, movedCard);

    // Re-calculate positions in target list
    targetCards.forEach((card, idx) => {
      card.position = idx;
    });

    if (sourceListId !== targetListId) {
      sourceCards.forEach((card, idx) => {
        card.position = idx;
      });
    }

    // Immediate local UI update
    set({ cardsByListId: newCardsMap });

    try {
      await moveCardApi(cardId, {
        targetListId,
        position: targetIndex,
      });
    } catch (err: any) {
      // Rollback to previous state on server error
      set({ cardsByListId: previousCardsMap });
      const errorMessage = err.response?.data?.message || 'Failed to move card';
      set({ error: errorMessage });
    }
  },

  reset: () => {
    set({
      currentBoard: null,
      lists: [],
      cardsByListId: {},
      isLoading: false,
      error: null,
    });
  },
}));