import type { Channel } from '../../types';

interface ChannelSidebarProps {
  channels: Channel[];
  activeChannelId?: string;
  onSelectChannel: (channel: Channel) => void;
  onOpenCreateChannelModal: () => void;
}

export const ChannelSidebar = ({
  channels,
  activeChannelId,
  onSelectChannel,
  onOpenCreateChannelModal,
}: ChannelSidebarProps) => {
  return (
    <div className="w-60 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-3 flex flex-col justify-between shrink-0">
      <div>
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Channels
          </span>
          <button
            onClick={onOpenCreateChannelModal}
            className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
            title="Create Channel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {channels.length === 0 ? (
            <p className="text-xs text-zinc-400 px-2 py-4 text-center">No channels found.</p>
          ) : (
            channels.map((channel) => {
              const isActive = activeChannelId === channel._id;

              return (
                <button
                  key={channel._id}
                  onClick={() => onSelectChannel(channel)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="text-zinc-400 font-bold shrink-0">
                      {channel.isPrivate ? '🔒' : '#'}
                    </span>
                    <span className="truncate">{channel.name}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <button
        onClick={onOpenCreateChannelModal}
        className="w-full py-2 px-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors flex items-center gap-2 cursor-pointer border border-dashed border-indigo-200 dark:border-indigo-900"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Channel
      </button>
    </div>
  );
};