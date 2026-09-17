import type { Message, User } from '../../types';

interface MessageItemProps {
  message: Message;
}

export const MessageItem = ({ message }: MessageItemProps) => {
  const getSenderDetails = (sender: User | string) => {
    if (typeof sender === 'object' && sender !== null) {
      return {
        name: sender.name || 'Unknown User',
        avatarInitial: sender.name ? sender.name.charAt(0).toUpperCase() : 'U',
      };
    }
    return {
      name: 'User',
      avatarInitial: 'U',
    };
  };

  const sender = getSenderDetails(message.senderId);
  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="flex items-start gap-3 group py-1.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 px-2 rounded-lg transition-colors">
      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
        {sender.avatarInitial}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {sender.name}
          </span>
          <span className="text-[10px] text-zinc-400">
            {formattedTime}
          </span>
        </div>

        <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>
      </div>
    </div>
  );
};