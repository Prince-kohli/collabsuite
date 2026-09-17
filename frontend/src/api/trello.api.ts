import { apiClient } from './axios';
import type { ApiResponse, Board, List, Card } from '../types';

export interface CreateBoardPayload {
  name: string;
  workspaceId: string;
  description?: string;
}

export interface CreateListPayload {
  name: string;
  boardId: string;
  position?: number;
}

export interface CreateCardPayload {
  title: string;
  listId: string;
  boardId: string;
  description?: string;
  position?: number;
}

export interface MoveCardPayload {
  targetListId: string;
  position: number;
}

export interface BoardDetailsResponse {
  board: Board;
  lists: List[];
  cards: Card[];
}

/**
 * Create a new board in a workspace.
 */
export const createBoardApi = async (
  payload: CreateBoardPayload
): Promise<ApiResponse<{ board: Board }>> => {
  const response = await apiClient.post<ApiResponse<{ board: Board }>>('/trello/boards', payload);
  return response.data;
};

/**
 * Get board details along with its lists and cards.
 */
export const getBoardDetailsApi = async (
  boardId: string
): Promise<ApiResponse<BoardDetailsResponse>> => {
  const response = await apiClient.get<ApiResponse<BoardDetailsResponse>>(`/trello/boards/${boardId}`);
  return response.data;
};

/**
 * Create a new list inside a board.
 */
export const createListApi = async (
  payload: CreateListPayload
): Promise<ApiResponse<{ list: List }>> => {
  const response = await apiClient.post<ApiResponse<{ list: List }>>('/trello/lists', payload);
  return response.data;
};

/**
 * Create a new card inside a list.
 */
export const createCardApi = async (
  payload: CreateCardPayload
): Promise<ApiResponse<{ card: Card }>> => {
  const response = await apiClient.post<ApiResponse<{ card: Card }>>('/trello/cards', payload);
  return response.data;
};

/**
 * Move or reorder a card across lists using backend transaction.
 */
export const moveCardApi = async (
  cardId: string,
  payload: MoveCardPayload
): Promise<ApiResponse<{ card: Card }>> => {
  const response = await apiClient.patch<ApiResponse<{ card: Card }>>(
    `/trello/cards/${cardId}/move`,
    payload
  );
  return response.data;
};