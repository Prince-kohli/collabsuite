import { useState, useEffect } from 'react';
import type { Card } from '../../types';
import { useBoardStore } from '../../store/useBoardStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useToastStore } from '../../store/useToastStore';
import {
  getCardCommentsApi,
  addCardCommentApi,
  getCardActivitiesApi,
  type CardComment,
  type CardActivity,
} from '../../api/trello.api';

interface CardDetailModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CardDetailModal = ({ card, isOpen, onClose }: CardDetailModalProps) => {
  const { updateCardDetails, uploadCardAttachment, deleteCardAttachment } = useBoardStore();
  const { activeWorkspace } = useWorkspaceStore();
  const showToast = useToastStore((state) => state.showToast);

  const [description, setDescription] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [comments, setComments] = useState<CardComment[]>([]);
  const [activities, setActivities] = useState<CardActivity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');

  useEffect(() => {
    if (card) {
      setDescription(card.description || '');
      loadCommentsAndActivities(card._id);
    }
  }, [card]);

  const loadCommentsAndActivities = async (cardId: string) => {
    try {
      const [commentsRes, activitiesRes] = await Promise.all([
        getCardCommentsApi(cardId),
        getCardActivitiesApi(cardId),
      ]);
      setComments(commentsRes.data.comments || []);
      setActivities(activitiesRes.data.activities || []);
    } catch (err) {
      console.error('Failed to load card details', err);
    }
  };

  if (!isOpen || !card) return null;

  const handleSaveDescription = async () => {
    try {
      await updateCardDetails(card._id, { description });
      setIsEditingDesc(false);
      showToast('Description updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update description', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadCardAttachment(card._id, file);
      showToast('File uploaded successfully', 'success');
      loadCommentsAndActivities(card._id);
    } catch (err: any) {
      showToast(err.message || 'Failed to upload file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async (attachmentId: string) => {
    try {
      await deleteCardAttachment(card._id, attachmentId);
      showToast('Attachment removed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove attachment', 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await addCardCommentApi(card._id, newComment.trim());
      setComments([...comments, res.data.comment]);
      setNewComment('');
      showToast('Comment posted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment', 'error');
    }
  };

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000/api/v1';
  const SERVER_URL = API_BASE_URL.replace('/api/v1', '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Card Details</span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{card.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Left Column (2/3 width) */}
          <div className="md:col-span-2 space-y-6">
            {/* Description Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </h3>
                {!isEditingDesc && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDescription}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingDesc(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 min-h-[60px] whitespace-pre-wrap leading-relaxed">
                  {card.description || 'No description added yet. Click edit to add details.'}
                </p>
              )}
            </div>

            {/* Attachments Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Attachments ({(card as any).attachments?.length || 0})
                </h3>

                <label className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1">
                  <input type="file" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                  {isUploading ? 'Uploading...' : '+ Add File'}
                </label>
              </div>

              <div className="space-y-2">
                {(card as any).attachments?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No files attached</p>
                ) : (
                  (card as any).attachments?.map((att: any) => (
                    <div key={att._id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <a
                        href={`${SERVER_URL}${att.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-indigo-600 hover:underline truncate max-w-xs"
                      >
                        {att.name}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(att._id)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tabs for Comments vs Activity */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex border-b border-slate-200 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('comments')}
                  className={`pb-2 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                    activeTab === 'comments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
                  }`}
                >
                  Comments ({comments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`pb-2 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                    activeTab === 'activity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
                  }`}
                >
                  Activity Audit Trail ({activities.length})
                </button>
              </div>

              {activeTab === 'comments' ? (
                <div className="space-y-4">
                  <form onSubmit={handleAddComment} className="space-y-2">
                    <textarea
                      rows={2}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment... (use @name to mention team members)"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md transition-colors cursor-pointer"
                      >
                        Post Comment
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments.map((c) => (
                      <div key={c._id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{c.userId?.name || 'User'}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activities.map((a) => (
                    <div key={a._id} className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900">{a.userId?.name || 'User'}</span>
                        <span className="text-slate-500 ml-1.5">{a.details}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Metadata Column (1/3 width) */}
          <div className="space-y-4 border-l border-slate-200 pl-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assignees</h4>
              <div className="flex flex-wrap gap-2">
                {activeWorkspace?.members?.map((m: any) => {
                  const u = typeof m.userId === 'object' ? m.userId : null;
                  if (!u) return null;
                  return (
                    <span key={u._id} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700">
                      {u.name}
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Created On</h4>
              <span className="text-xs text-slate-700 font-medium">
                {new Date(card.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};