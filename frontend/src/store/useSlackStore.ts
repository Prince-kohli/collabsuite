import { create } from 'zustand';
import type { Channel, Message } from '../types';
import {
  createChannelApi,
  getWorkspaceChannelsApi,
  sendMessageApi,
  getChannelMessagesApi,
  type CreateChannelPayload,
  type SendMessagePayload,
} from '../api/slack.api';

interface SlackState {
  channels: Channel[];
  activeChannel: Channel | null;
  messages: Message[];
  nextCursor: string | null;
  hasMoreMessages: boolean;
  isLoadingChannels: boolean;
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Actions
  fetchChannels: (workspaceId: string) => Promise<void>;
  setActiveChannel: (channel: Channel) => Promise<void>;
  createChannel: (payload: CreateChannelPayload) => Promise<Channel>;
  fetchMessages: (channelId: string) => Promise<void>;
  fetchMoreMessages: () => Promise<void>;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
  appendRealtimeMessage: (message: Message) => void;
  reset: () => void;
}

export const useSlackStore = create<SlackState>((set, get) => ({
  channels: [],
  activeChannel: null,
  messages: [],
  nextCursor: null,
  hasMoreMessages: false,
  isLoadingChannels: false,
  isLoadingMessages: false,
  isLoadingMore: false,
  error: null,

  fetchChannels: async (workspaceId: string) => {
    set({ isLoadingChannels: true, error: null });
    try {
      const response = await getWorkspaceChannelsApi(workspaceId);
      const channels = response.data.channels;

      set({ channels, isLoadingChannels: false });

      // Automatically select first channel if none active
      const currentActive = get().activeChannel;
      if ((!currentActive || currentActive.workspaceId !== workspaceId) && channels.length > 0) {
        await get().setActiveChannel(channels[0]);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch channels';
      set({ error: errorMessage, isLoadingChannels: false });
    }
  },

  setActiveChannel: async (channel: Channel) => {
    set({ activeChannel: channel, messages: [], nextCursor: null, hasMoreMessages: false });
    await get().fetchMessages(channel._id);
  },

  createChannel: async (payload: CreateChannelPayload) => {
    try {
      const response = await createChannelApi(payload);
      const newChannel = response.data.channel;

      set((state) => ({
        channels: [...state.channels, newChannel],
        activeChannel: newChannel,
      }));

      await get().fetchMessages(newChannel._id);
      return newChannel;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create channel';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  fetchMessages: async (channelId: string) => {
    set({ isLoadingMessages: true, error: null });
    try {
      const response = await getChannelMessagesApi(channelId);
      const { messages, nextCursor, hasMore } = response.data;

      set({
        messages,
        nextCursor,
        hasMoreMessages: hasMore,
        isLoadingMessages: false,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch messages';
      set({ error: errorMessage, isLoadingMessages: false });
    }
  },

  fetchMoreMessages: async () => {
    const { activeChannel, nextCursor, hasMoreMessages, isLoadingMore, messages } = get();

    if (!activeChannel || !hasMoreMessages || !nextCursor || isLoadingMore) {
      return;
    }

    set({ isLoadingMore: true });
    try {
      const response = await getChannelMessagesApi(activeChannel._id, nextCursor);
      const { messages: olderMessages, nextCursor: newCursor, hasMore } = response.data;

      set({
        messages: [...olderMessages, ...messages],
        nextCursor: newCursor,
        hasMoreMessages: hasMore,
        isLoadingMore: false,
      });
    } catch (err: any) {
      set({ isLoadingMore: false });
      console.error('Failed to load older messages:', err);
    }
  },

  sendMessage: async (payload: SendMessagePayload) => {
    try {
      const response = await sendMessageApi(payload);
      const sentMessage = response.data.message;

      // Append locally immediately
      get().appendRealtimeMessage(sentMessage);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send message';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  appendRealtimeMessage: (message: Message) => {
    const { activeChannel, messages } = get();

    if (activeChannel && message.channelId === activeChannel._id) {
      // Prevent duplicate messages
      if (messages.some((m) => m._id === message._id)) {
        return;
      }
      set({ messages: [...messages, message] });
    }
  },

  reset: () => {
    set({
      channels: [],
      activeChannel: null,
      messages: [],
      nextCursor: null,
      hasMoreMessages: false,
      isLoadingChannels: false,
      isLoadingMessages: false,
      isLoadingMore: false,
      error: null,
    });
  },
}));