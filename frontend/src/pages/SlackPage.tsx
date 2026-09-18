import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSlackStore } from '../store/useSlackStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { ChannelSidebar } from '../components/slack/ChannelSidebar';
import { MessageItem } from '../components/slack/MessageItem';
import { CreateChannelModal } from '../components/slack/CreateChannelModal';

export const SlackPage = () => {
  const { workspaceId, channelId } = useParams<{ workspaceId: string; channelId?: string }>();
  const navigate = useNavigate();

  const { activeWorkspace, currentUserRole } = useWorkspaceStore();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  const {
    channels,
    activeChannel,
    messages,
    hasMoreMessages,
    isLoadingMore,
    typingUsers,
    fetchChannels,
    setActiveChannel,
    fetchMoreMessages,
    sendMessage,
    createOrGetDM,
    initSocketListeners,
    emitTypingStart,
    emitTypingStop,
  } = useSlackStore();

  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const isViewer = currentUserRole === 'viewer';
  const canWrite = currentUserRole === 'owner' || currentUserRole === 'member';

  useEffect(() => {
    if (workspaceId) fetchChannels(workspaceId);
    initSocketListeners();
  }, [workspaceId, fetchChannels, initSocketListeners]);

  useEffect(() => {
    if (channelId && channels.length > 0) {
      const found = channels.find((c) => c._id === channelId);
      if (found && activeChannel?._id !== found._id) {
        setActiveChannel(found);
      }
    }
  }, [channelId, channels, activeChannel, setActiveChannel]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const typingLabel = useMemo(() => {
    const names = Object.entries(typingUsers)
      .filter(([id]) => id !== user?.id)
      .map(([, name]) => name);
    if (names.length === 0) return '';
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return 'Several people are typing...';
  }, [typingUsers, user?.id]);

  const handleSelectChannel = (channel: any) => {
    setActiveChannel(channel);
    navigate(`/workspaces/${workspaceId}/channels/${channel._id}`);
  };

  const handleStartDM = async (targetUserId: string) => {
    if (!workspaceId || !canWrite) return;
    try {
      const channel = await createOrGetDM({ workspaceId, targetUserId });
      navigate(`/workspaces/${workspaceId}/channels/${channel._id}`);
      showToast('DM opened', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to open DM', 'error');
    }
  };

  const stopTyping = () => {
    if (!activeChannel || !isTypingRef.current) return;
    isTypingRef.current = false;
    emitTypingStop(activeChannel._id);
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    if (!activeChannel || !canWrite || !user) return;

    if (!isTypingRef.current && value.trim()) {
      isTypingRef.current = true;
      emitTypingStart(activeChannel._id, user.name || 'User');
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1200);

    if (!value.trim()) stopTyping();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChannel || !canWrite) return;

    setIsSending(true);
    const content = inputText.trim();
    setInputText('');
    stopTyping();

    try {
      await sendMessage({ channelId: activeChannel._id, content });
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
      setInputText(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el || isLoadingMore || !hasMoreMessages) return;
    if (el.scrollTop < 40) {
      const prevHeight = el.scrollHeight;
      fetchMoreMessages().then(() => {
        requestAnimationFrame(() => {
          if (!chatContainerRef.current) return;
          const nextHeight = chatContainerRef.current.scrollHeight;
          chatContainerRef.current.scrollTop = nextHeight - prevHeight;
        });
      });
    }
  };

  if (!workspaceId) {
    return <div className="p-8 text-center text-slate-500">Workspace not found</div>;
  }

  const headerTitle =
    activeChannel?.type === 'dm'
      ? 'Direct Message'
      : activeChannel
        ? `${activeChannel.isPrivate ? 'P' : '#'}${activeChannel.name}`
        : '';

  return (
    <div className="h-[calc(100vh-6.5rem)] flex border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <ChannelSidebar
        channels={channels}
        activeChannelId={activeChannel?._id}
        onSelectChannel={handleSelectChannel}
        onOpenCreateChannelModal={() => setIsCreateChannelOpen(true)}
        onStartDM={handleStartDM}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeChannel ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{headerTitle}</h2>
                {activeChannel.topic && activeChannel.type !== 'dm' && (
                  <p className="text-xs text-slate-500 mt-0.5">{activeChannel.topic}</p>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Workspace: {activeWorkspace?.name}
              </span>
            </div>

            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 p-4 overflow-y-auto space-y-1"
            >
              {hasMoreMessages && (
                <div className="text-center py-2">
                  <button
                    type="button"
                    onClick={fetchMoreMessages}
                    disabled={isLoadingMore}
                    className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingMore ? 'Loading older messages...' : 'Load older messages'}
                  </button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <p className="text-xs">No messages yet.</p>
                  <p className="text-[11px] mt-1">Start the conversation below.</p>
                </div>
              ) : (
                messages.map((msg) => <MessageItem key={msg._id} message={msg} />)
              )}

              <div ref={chatBottomRef} />
            </div>

            <div className="px-4 pt-1 min-h-[20px]">
              {typingLabel ? (
                <p className="text-[11px] text-indigo-500 font-medium animate-pulse">{typingLabel}</p>
              ) : (
                <p className="text-[11px] text-transparent">.</p>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 shrink-0">
              {isViewer ? (
                <div className="px-4 py-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl">
                  Viewer mode — you can read messages but cannot send.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={`Message ${headerTitle}...`}
                    className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-8">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Select or Create a Channel</h3>
            <p className="text-xs max-w-sm">
              Choose a channel from the left sidebar to start chatting with team members.
            </p>
          </div>
        )}
      </div>

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        workspaceId={workspaceId}
        onClose={() => setIsCreateChannelOpen(false)}
      />
    </div>
  );
};