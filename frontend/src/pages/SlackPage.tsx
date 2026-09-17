import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSlackStore } from '../store/useSlackStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { ChannelSidebar } from '../components/slack/ChannelSidebar';
import { MessageItem } from '../components/slack/MessageItem';
import { CreateChannelModal } from '../components/slack/CreateChannelModal';

export const SlackPage = () => {
  const { workspaceId, channelId } = useParams<{ workspaceId: string; channelId?: string }>();
  const navigate = useNavigate();

  const { activeWorkspace } = useWorkspaceStore();
  const {
    channels,
    activeChannel,
    messages,
    hasMoreMessages,
    isLoadingMore,
    fetchChannels,
    setActiveChannel,
    fetchMoreMessages,
    sendMessage,
  } = useSlackStore();

  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSubmitting] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch Workspace Channels on Mount
  useEffect(() => {
    if (workspaceId) {
      fetchChannels(workspaceId);
    }
  }, [workspaceId, fetchChannels]);

  // Handle URL Channel Selection Sync
  useEffect(() => {
    if (channelId && channels.length > 0) {
      const found = channels.find((c) => c._id === channelId);
      if (found && activeChannel?._id !== found._id) {
        setActiveChannel(found);
      }
    }
  }, [channelId, channels, activeChannel, setActiveChannel]);

  // Auto Scroll to Bottom on New Messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSelectChannel = (channel: any) => {
    setActiveChannel(channel);
    navigate(`/workspaces/${workspaceId}/channels/${channel._id}`);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChannel) return;

    setIsSubmitting(true);
    const content = inputText.trim();
    setInputText('');

    try {
      await sendMessage({
        channelId: activeChannel._id,
        content,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!workspaceId) {
    return <div className="p-8 text-center text-zinc-500">Workspace not found</div>;
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] flex border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
      {/* Left Sidebar: Channels */}
      <ChannelSidebar
        channels={channels}
        activeChannelId={activeChannel?._id}
        onSelectChannel={handleSelectChannel}
        onOpenCreateChannelModal={() => setIsCreateChannelOpen(true)}
      />

      {/* Right Area: Messages View */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChannel ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span className="text-zinc-400">{activeChannel.isPrivate ? '🔒' : '#'}</span>
                  {activeChannel.name}
                </h2>
                {activeChannel.topic && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {activeChannel.topic}
                  </p>
                )}
              </div>
              <span className="text-[11px] font-medium text-zinc-400">
                Workspace: {activeWorkspace?.name}
              </span>
            </div>

            {/* Chat Stream Window */}
            <div className="flex-1 p-4 overflow-y-auto space-y-1">
              {/* Load More Button for Cursor Pagination */}
              {hasMoreMessages && (
                <div className="text-center py-2">
                  <button
                    onClick={fetchMoreMessages}
                    disabled={isLoadingMore}
                    className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingMore ? 'Loading older messages...' : 'Load older messages'}
                  </button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400">
                  <p className="text-xs">No messages in #{activeChannel.name} yet.</p>
                  <p className="text-[11px] mt-1">Start the conversation below.</p>
                </div>
              ) : (
                messages.map((msg) => <MessageItem key={msg._id} message={msg} />)
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Message Input Box */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message #${activeChannel.name}...`}
                  className="flex-1 px-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-400 p-8">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Select or Create a Channel
            </h3>
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