import { create } from 'zustand';
import type { Channel, Message } from '../types';
import {
  createChannelApi,
  createOrGetDMApi,
  getWorkspaceChannelsApi,
  deleteChannelApi,
  sendMessageApi,
  getChannelMessagesApi,
  addChannelMemberApi,
  removeChannelMemberApi,
  type CreateChannelPayload,
  type CreateDMPayload,
  type SendMessagePayload,
} from '../api/slack.api';
import { getSocket } from '../api/socket';

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
  typingUsers: Record<string, string>; // userId -> userName
  onlineUserIds: string[];

  fetchChannels: (workspaceId: string) => Promise<void>;
  setActiveChannel: (channel: Channel) => Promise<void>;
  createChannel: (payload: CreateChannelPayload) => Promise<Channel>;
  createOrGetDM: (payload: CreateDMPayload) => Promise<Channel>;
  deleteChannel: (channelId: string) => Promise<void>;
  addMemberToChannel: (channelId: string, memberId: string) => Promise<Channel>;
  removeMemberFromChannel: (channelId: string, memberId: string) => Promise<Channel>;
  fetchMessages: (channelId: string) => Promise<void>;
  fetchMoreMessages: () => Promise<void>;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
  appendRealtimeMessage: (message: Message) => void;
  setTypingUser: (userId: string, userName: string, isTyping: boolean) => void;
  initSocketListeners: () => void;
  joinChannelRoom: (channelId: string) => void;
  leaveChannelRoom: (channelId: string) => void;
  emitTypingStart: (channelId: string, userName: string) => void;
  emitTypingStop: (channelId: string) => void;
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
  typingUsers: {},
  onlineUserIds: [],

  fetchChannels: async (workspaceId: string) => {
    set({ isLoadingChannels: true, error: null });
    try {
      const response = await getWorkspaceChannelsApi(workspaceId);
      const channels = response.data.channels;
      set({ channels, isLoadingChannels: false });

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
    const prev = get().activeChannel;
    if (prev?._id) {
      get().leaveChannelRoom(prev._id);
    }

    set({
      activeChannel: channel,
      messages: [],
      nextCursor: null,
      hasMoreMessages: false,
      typingUsers: {},
    });

    get().joinChannelRoom(channel._id);
    await get().fetchMessages(channel._id);
  },

  createChannel: async (payload: CreateChannelPayload) => {
    try {
      const response = await createChannelApi(payload);
      const newChannel = response.data.channel;

      set((state) => ({
        channels: [...state.channels, newChannel],
      }));

      await get().setActiveChannel(newChannel);
      return newChannel;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create channel';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  createOrGetDM: async (payload: CreateDMPayload) => {
    try {
      const response = await createOrGetDMApi(payload);
      const channel = response.data.channel;

      set((state) => {
        const exists = state.channels.some((c) => c._id === channel._id);
        return {
          channels: exists ? state.channels : [...state.channels, channel],
        };
      });

      await get().setActiveChannel(channel);
      return channel;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to start DM';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  deleteChannel: async (channelId: string) => {
    await deleteChannelApi(channelId);

    const { activeChannel, channels } = get();
    const nextChannels = channels.filter((c) => c._id !== channelId);

    set({ channels: nextChannels });

    if (activeChannel?._id === channelId) {
      if (nextChannels.length > 0) {
        await get().setActiveChannel(nextChannels[0]);
      } else {
        set({ activeChannel: null, messages: [] });
      }
    }
  },

  addMemberToChannel: async (channelId: string, memberId: string) => {
    try {
      const response = await addChannelMemberApi(channelId, memberId);
      const updatedChannel = response.data.channel;
      set((state) => ({
        activeChannel: state.activeChannel?._id === channelId ? updatedChannel : state.activeChannel,
        channels: state.channels.map((c) => (c._id === channelId ? updatedChannel : c)),
      }));
      return updatedChannel;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add member';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  removeMemberFromChannel: async (channelId: string, memberId: string) => {
    try {
      const response = await removeChannelMemberApi(channelId, memberId);
      const updatedChannel = response.data.channel;
      set((state) => ({
        activeChannel: state.activeChannel?._id === channelId ? updatedChannel : state.activeChannel,
        channels: state.channels.map((c) => (c._id === channelId ? updatedChannel : c)),
      }));
      return updatedChannel;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to remove member';
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
    if (!activeChannel || !hasMoreMessages || !nextCursor || isLoadingMore) return;

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
    } catch (err) {
      set({ isLoadingMore: false });
      console.error('Failed to load older messages:', err);
    }
  },

  sendMessage: async (payload: SendMessagePayload) => {
    try {
      const response = await sendMessageApi(payload);
      // Backend already emits socket event; append guards duplicates
      get().appendRealtimeMessage(response.data.message);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send message';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  appendRealtimeMessage: (message: Message) => {
    const { activeChannel, messages } = get();
    if (!activeChannel || message.channelId !== activeChannel._id) return;
    if (messages.some((m) => m._id === message._id)) return;
    set({ messages: [...messages, message] });
  },

  setTypingUser: (userId: string, userName: string, isTyping: boolean) => {
    set((state) => {
      const next = { ...state.typingUsers };
      if (isTyping) next[userId] = userName || 'Someone';
      else delete next[userId];
      return { typingUsers: next };
    });
  },

   initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    // Clean up old listeners
    socket.off('message:new');
    socket.off('typing:status');
    socket.off('user:status');
    socket.off('users:online');
    socket.off('channel:members_updated');
    socket.off('channel:member_removed');

    // Chat listeners
    socket.on('message:new', (message: Message) => {
      get().appendRealtimeMessage(message);
    });

    socket.on(
      'typing:status',
      (payload: { userId: string; userName?: string; isTyping: boolean }) => {
        if (!payload?.userId) return;
        get().setTypingUser(payload.userId, payload.userName || 'Someone', payload.isTyping);
      }
    );

    // Online/offline presence tracking
    socket.on('users:online', (userIds: string[]) => {
      set({ onlineUserIds: userIds });
    });

    socket.on('user:status', (payload: { userId: string; status: 'online' | 'offline' }) => {
      set((state) => {
        if (payload.status === 'online') {
          if (state.onlineUserIds.includes(payload.userId)) return state;
          return { onlineUserIds: [...state.onlineUserIds, payload.userId] };
        } else {
          return { onlineUserIds: state.onlineUserIds.filter((id) => id !== payload.userId) };
        }
      });
    });

    // Real-time channel member updates
    socket.on('channel:members_updated', (updatedChannel: Channel) => {
      if (!updatedChannel?._id) return;
      set((state) => ({
        channels: state.channels.map((c) =>
          c._id === updatedChannel._id ? { ...c, ...updatedChannel } : c
        ),
        activeChannel:
          state.activeChannel?._id === updatedChannel._id
            ? { ...state.activeChannel, ...updatedChannel }
            : state.activeChannel,
      }));
    });

    // When current user gets removed from a channel
    socket.on(
      'channel:member_removed',
      (payload: { channelId: string; workspaceId?: string }) => {
        if (!payload?.channelId) return;
        const { activeChannel, channels } = get();
        const nextChannels = channels.filter((c) => c._id !== payload.channelId);
        
        set({ channels: nextChannels });

        if (activeChannel?._id === payload.channelId) {
          get().leaveChannelRoom(payload.channelId);
          if (nextChannels.length > 0) {
            get().setActiveChannel(nextChannels[0]);
          } else {
            set({ activeChannel: null, messages: [] });
          }
        }
      }
    );

    // Request full list on init
    socket.emit('get:online_users');
  },

  joinChannelRoom: (channelId: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('join:channel', channelId);
  },

  leaveChannelRoom: (channelId: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('leave:channel', channelId);
  },

  emitTypingStart: (channelId: string, userName: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing:start', { channelId, userName });
  },

  emitTypingStop: (channelId: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing:stop', { channelId });
  },

  reset: () => {
    const active = get().activeChannel;
    if (active?._id) get().leaveChannelRoom(active._id);

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
      typingUsers: {},
    });
  },
}));