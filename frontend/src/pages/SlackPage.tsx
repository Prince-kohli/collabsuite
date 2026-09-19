import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSlackStore } from '../store/useSlackStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { ChannelSidebar } from '../components/slack/ChannelSidebar';
import { MessageItem } from '../components/slack/MessageItem';
import { CreateChannelModal } from '../components/slack/CreateChannelModal';
import { ChannelMembersDropdown } from '../components/slack/ChannelMembersDropdown';

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

  const canWrite = !!currentUserRole;

  useEffect(() => {
    if (workspaceId) fetchChannels(workspaceId);
    initSocketListeners();
  }, [workspaceId, fetchChannels, initSocketListeners]);

  // Handle URL param channel change & auto-refetch if channel is not present in store
  useEffect(() => {
    if (!channelId) return;

    if (channels.length > 0) {
      const found = channels.find((c) => c._id === channelId);
      if (found) {
        if (activeChannel?._id !== found._id) {
          setActiveChannel(found);
        }
      } else if (workspaceId) {
        // If channel or DM is not in local state (e.g., clicked from notification), refetch channels
        fetchChannels(workspaceId);
      }
    }
  }, [channelId, channels, activeChannel, setActiveChannel, fetchChannels, workspaceId]);

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
        ? `#${activeChannel.name}`
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

      <div className="flex-1 flex flex-col min-w-0 bg-[#E5DDD5]">
        {activeChannel ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {activeChannel.type === 'dm' ? (
                      <span>Direct Message</span>
                    ) : (
                      <>
                        {activeChannel.isPrivate ? (
                          <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        ) : (
                          <span className="text-slate-400 font-bold text-base leading-none">#</span>
                        )}
                        <span>{activeChannel.name}</span>
                      </>
                    )}
                  </h2>
                  {activeChannel.type !== 'dm' && activeChannel.isPrivate && (
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-md">
                      Private
                    </span>
                  )}
                </div>
                {activeChannel.topic && activeChannel.type !== 'dm' && (
                  <p className="text-xs text-slate-500 mt-0.5">{activeChannel.topic}</p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {activeChannel.type !== 'dm' && (
                  <ChannelMembersDropdown
                    channel={activeChannel}
                    workspace={activeWorkspace}
                    currentUserRole={currentUserRole}
                    currentUserId={user?.id}
                  />
                )}
                <span className="text-[11px] font-medium text-slate-400 hidden md:inline">
                  Workspace: {activeWorkspace?.name}
                </span>
              </div>
            </div>

            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 p-4 overflow-y-auto space-y-2"
            >
              {hasMoreMessages && (
                <div className="text-center py-2">
                  <button
                    type="button"
                    onClick={fetchMoreMessages}
                    disabled={isLoadingMore}
                    className="px-3 py-1 text-xs font-medium text-indigo-600 bg-white shadow-xs rounded-full hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingMore ? 'Loading older messages...' : 'Load older messages'}
                  </button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                  <p className="text-xs bg-white px-4 py-2 rounded-xl shadow-xs">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => <MessageItem key={msg._id} message={msg} />)
              )}

              <div ref={chatBottomRef} />
            </div>

            <div className="px-4 pt-1 min-h-[20px] bg-[#F0F2F5]">
              {typingLabel ? (
                <p className="text-[11px] text-indigo-500 font-medium animate-pulse">{typingLabel}</p>
              ) : (
                <p className="text-[11px] text-transparent">.</p>
              )}
            </div>

            <div className="p-3 bg-[#F0F2F5] shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={`Message ${headerTitle}...`}
                  className="flex-1 px-4 py-3 text-xs bg-white rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 shadow-sm"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="w-10 h-10 flex items-center justify-center bg-[#00A884] hover:bg-emerald-600 disabled:opacity-50 text-white rounded-full transition-colors cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-8">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Select or Create a Channel</h3>
            <p className="text-xs max-w-sm">
              Choose a channel from the left sidebar to start chatting.
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