import { apiClient } from './axios';
import type { ApiResponse, Board, List, Card } from '../types';

export interface CreateBoardPayload {
  title: string;
  workspaceId: string;
  description?: string;
}

export interface CreateListPayload {
  title: string;
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
  newPosition: number;
}

export interface BoardDetailsResponse {
  board: Board;
  lists: List[];
  cards: Card[];
}

export interface UpdateCardPayload {
  title?: string;
  description?: string;
  labels?: string[];
  dueDate?: string | null;
  assignees?: string[];
}

export interface CardComment {
  _id: string;
  cardId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  mentions?: any[];
  createdAt: string;
}

export interface CardActivity {
  _id: string;
  action: string;
  details: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
}

/**
 * Fetch all boards for a specific workspace.
 */
export const getWorkspaceBoardsApi = async (
  workspaceId: string
): Promise<ApiResponse<{ boards: Board[] }>> => {
  const response = await apiClient.get<ApiResponse<{ boards: Board[] }>>(
    `/trello/boards?workspaceId=${workspaceId}`
  );
  return response.data;
};

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
 * Delete a board by ID.
 */
export const deleteBoardApi = async (boardId: string): Promise<ApiResponse> => {
  const response = await apiClient.delete<ApiResponse>(`/trello/boards/${boardId}`);
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
 * Delete a list by ID.
 */
export const deleteListApi = async (listId: string): Promise<ApiResponse> => {
  const response = await apiClient.delete<ApiResponse>(`/trello/lists/${listId}`);
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

/**
 * Update card details (title, description, labels, assignees, due date).
 */
export const updateCardApi = async (
  cardId: string,
  payload: UpdateCardPayload
): Promise<ApiResponse<{ card: Card }>> => {
  const response = await apiClient.patch<ApiResponse<{ card: Card }>>(
    `/trello/cards/${cardId}`,
    payload
  );
  return response.data;
};

/**
 * Delete a card by ID.
 */
export const deleteCardApi = async (cardId: string): Promise<ApiResponse> => {
  const response = await apiClient.delete<ApiResponse>(`/trello/cards/${cardId}`);
  return response.data;
};

/**
 * Upload attachment file to card.
 */
export const uploadAttachmentApi = async (
  cardId: string,
  file: File
): Promise<ApiResponse<{ card: Card }>> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ApiResponse<{ card: Card }>>(
    `/trello/cards/${cardId}/attachments`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

/**
 * Remove attachment file from card.
 */
export const removeAttachmentApi = async (
  cardId: string,
  attachmentId: string
): Promise<ApiResponse<{ card: Card }>> => {
  const response = await apiClient.delete<ApiResponse<{ card: Card }>>(
    `/trello/cards/${cardId}/attachments/${attachmentId}`
  );
  return response.data;
};

/**
 * Fetch all comments for a card.
 */
export const getCardCommentsApi = async (
  cardId: string
): Promise<ApiResponse<{ comments: CardComment[] }>> => {
  const response = await apiClient.get<ApiResponse<{ comments: CardComment[] }>>(
    `/trello/cards/${cardId}/comments`
  );
  return response.data;
};

/**
 * Post a new comment on a card.
 */
export const addCardCommentApi = async (
  cardId: string,
  content: string,
  mentions: string[] = []
): Promise<ApiResponse<{ comment: CardComment }>> => {
  const response = await apiClient.post<ApiResponse<{ comment: CardComment }>>(
    `/trello/cards/${cardId}/comments`,
    { content, mentions }
  );
  return response.data;
};

/**
 * Fetch activity audit log for a card.
 */
export const getCardActivitiesApi = async (
  cardId: string
): Promise<ApiResponse<{ activities: CardActivity[] }>> => {
  const response = await apiClient.get<ApiResponse<{ activities: CardActivity[] }>>(
    `/trello/cards/${cardId}/activities`
  );
  return response.data;
};

/**
 * Update board title/description.
 */
export const updateBoardApi = async (
  boardId: string,
  payload: { title?: string; description?: string }
): Promise<ApiResponse<{ board: Board }>> => {
  const response = await apiClient.patch<ApiResponse<{ board: Board }>>(
    `/trello/boards/${boardId}`,
    payload
  );
  return response.data;
};

/**
 * Update list title.
 */
export const updateListApi = async (
  listId: string,
  payload: { title: string }
): Promise<ApiResponse<{ list: List }>> => {
  const response = await apiClient.patch<ApiResponse<{ list: List }>>(
    `/trello/lists/${listId}`,
    payload
  );
  return response.data;
};