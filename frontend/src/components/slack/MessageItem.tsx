import type { Message } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';

interface MessageItemProps {
  message: Message;
  status?: 'sending' | 'sent' | 'delivered';
}

export const MessageItem = ({ message, status = 'delivered' }: MessageItemProps) => {
  const { user } = useAuthStore();

  const myId = user?.id || (user as any)?._id;

  const senderObj = typeof message.senderId === 'object' ? (message.senderId as any) : null;
  const senderId = senderObj?._id || senderObj?.id || String(message.senderId || '');

  const senderName = senderObj?.name || 'User';
  const initial = senderName.charAt(0).toUpperCase();

  const isMine = !!myId && String(myId) === String(senderId);

  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const Ticks = () => {
    if (!isMine) return null;
    if (status === 'sending') {
      return <span className="text-[10px] text-slate-400 ml-1">✓</span>;
    }
    return (
      <span className="text-[10px] ml-1 font-bold text-emerald-700">
        ✓✓
      </span>
    );
  };

  if (isMine) {
    return (
      <div className="flex justify-end py-1 px-2">
        <div className="max-w-[75%] rounded-2xl rounded-tr-none bg-[#DCF8C6] text-slate-900 px-3 py-2 shadow-xs border border-emerald-200/60">
          <p className="text-xs whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[9px] text-slate-500">{time}</span>
            <Ticks />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start items-end gap-2 py-1 px-2">
      <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
        {initial}
      </div>
      <div className="max-w-[75%] rounded-2xl rounded-tl-none bg-white border border-slate-200 px-3 py-2 shadow-xs">
        <p className="text-[10px] font-bold text-indigo-600 mb-0.5">{senderName}</p>
        <p className="text-xs text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>
        <div className="flex justify-end mt-1">
          <span className="text-[9px] text-slate-400">{time}</span>
        </div>
      </div>
    </div>
  );
};