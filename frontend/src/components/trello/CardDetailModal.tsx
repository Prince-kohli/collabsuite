import { useState, useEffect, useMemo, useRef } from 'react';
import type { Card } from '../../types';
import { useBoardStore } from '../../store/useBoardStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import {
  getCardCommentsApi,
  addCardCommentApi,
  getCardActivitiesApi,
  type CardComment,
  type CardActivity,
} from '../../api/trello.api';
import { getSocket } from '../../api/socket';

interface CardDetailModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
}

interface MemberOption {
  id: string;
  name: string;
  email: string;
}

function getMemberId(userField: unknown): string {
  if (!userField) return '';
  if (typeof userField === 'string') return userField;
  const u = userField as { _id?: string; id?: string };
  return u._id || u.id || '';
}

function getMemberName(userField: unknown): string {
  if (!userField || typeof userField === 'string') return 'User';
  return (userField as { name?: string }).name || 'User';
}

function getMemberEmail(userField: unknown): string {
  if (!userField || typeof userField === 'string') return '';
  return (userField as { email?: string }).email || '';
}

export const CardDetailModal = ({ card, isOpen, onClose }: CardDetailModalProps) => {
  const { updateCardDetails, uploadCardAttachment, deleteCardAttachment } = useBoardStore();
  const { activeWorkspace, currentUserRole } = useWorkspaceStore();
  const { user } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);

  const isViewer = currentUserRole === 'viewer';
  const canEdit = !isViewer;
  // Only workspace owner can assign / unassign tasks
  const canAssign = currentUserRole === 'owner';

  const [description, setDescription] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [comments, setComments] = useState<CardComment[]>([]);
  const [activities, setActivities] = useState<CardActivity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [isAssigneeMenuOpen, setIsAssigneeMenuOpen] = useState(false);
  const [isSavingAssignees, setIsSavingAssignees] = useState(false);

  // @ mention autocomplete
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [selectedMentionIds, setSelectedMentionIds] = useState<string[]>([]);

  const assigneeMenuRef = useRef<HTMLDivElement>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const workspaceMembers: MemberOption[] = useMemo(() => {
    if (!activeWorkspace?.members) return [];
    return activeWorkspace.members
      .map((m) => {
        const id = getMemberId(m.userId);
        const name = getMemberName(m.userId);
        const email = getMemberEmail(m.userId);
        if (!id) return null;
        return { id, name, email };
      })
      .filter(Boolean) as MemberOption[];
  }, [activeWorkspace]);

  const assignedIds = useMemo(() => {
    if (!card?.assignees) return [] as string[];
    return card.assignees.map((a) => getMemberId(a)).filter(Boolean);
  }, [card]);

  const assignedMembers = useMemo(() => {
    return workspaceMembers.filter((m) => assignedIds.includes(m.id));
  }, [workspaceMembers, assignedIds]);

  const filteredMentionMembers = useMemo(() => {
    const q = mentionQuery.trim().toLowerCase();
    const myId = user?.id;
    return workspaceMembers.filter((m) => {
      if (myId && m.id === myId) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    });
  }, [workspaceMembers, mentionQuery, user?.id]);

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

  useEffect(() => {
    if (card && isOpen) {
      setDescription(card.description || '');
      setCardTitle(card.title);
      setIsEditingDesc(false);
      setIsEditingTitle(false);
      setNewComment('');
      setSelectedMentionIds([]);
      setShowMentionList(false);
      setMentionQuery('');
      setMentionStartIndex(null);
      setActiveTab('comments');
      loadCommentsAndActivities(card._id);
    }
  }, [card?._id, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(event.target as Node)) {
        setIsAssigneeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !card?._id) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('join:card', card._id);

    const onNewComment = (comment: CardComment) => {
      setComments((prev) => {
        if (prev.some((c) => c._id === comment._id)) return prev;
        return [...prev, comment];
      });
    };

    const onDeletedComment = (payload: { commentId: string }) => {
      setComments((prev) => prev.filter((c) => c._id !== payload.commentId));
    };

    socket.on('comment:new', onNewComment);
    socket.on('comment:deleted', onDeletedComment);

    return () => {
      socket.emit('leave:card', card._id);
      socket.off('comment:new', onNewComment);
      socket.off('comment:deleted', onDeletedComment);
    };
  }, [isOpen, card?._id]);

  if (!isOpen || !card) return null;

  const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000/api/v1';
  const SERVER_URL = API_BASE_URL.replace('/api/v1', '');

  const handleSaveTitle = async () => {
    if (!canEdit) return;
    const trimmed = cardTitle.trim();
    if (!trimmed || trimmed === card.title) {
      setCardTitle(card.title);
      setIsEditingTitle(false);
      return;
    }
    try {
      await updateCardDetails(card._id, { title: trimmed });
      setIsEditingTitle(false);
      showToast('Title updated', 'success');
    } catch (err: any) {
      setCardTitle(card.title);
      showToast(err.message || 'Failed to update title', 'error');
    }
  };

  const handleSaveDescription = async () => {
    if (!canEdit) return;
    try {
      await updateCardDetails(card._id, { description });
      setIsEditingDesc(false);
      showToast('Description updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update description', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsUploading(true);
    try {
      await uploadCardAttachment(card._id, file);
      showToast('File uploaded successfully', 'success');
      await loadCommentsAndActivities(card._id);
    } catch (err: any) {
      showToast(err.message || 'Failed to upload file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async (attachmentId: string) => {
    if (!canEdit) return;
    try {
      await deleteCardAttachment(card._id, attachmentId);
      showToast('Attachment removed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove attachment', 'error');
    }
  };

  /**
   * Detect @query while typing for mention autocomplete.
   */
  const handleCommentChange = (value: string) => {
    setNewComment(value);

    const textarea = commentTextareaRef.current;
    const cursor = textarea ? textarea.selectionStart : value.length;
    const textBeforeCursor = value.slice(0, cursor);
    const match = textBeforeCursor.match(/@([^@\s]*)$/);

    if (match) {
      setShowMentionList(true);
      setMentionQuery(match[1] || '');
      setMentionStartIndex(cursor - match[0].length);
    } else {
      setShowMentionList(false);
      setMentionQuery('');
      setMentionStartIndex(null);
    }
  };

  const insertMention = (member: MemberOption) => {
    if (mentionStartIndex === null) return;

    const textarea = commentTextareaRef.current;
    const cursor = textarea ? textarea.selectionStart : newComment.length;
    const before = newComment.slice(0, mentionStartIndex);
    const after = newComment.slice(cursor);
    const insertion = `@${member.name} `;
    const next = `${before}${insertion}${after}`;

    setNewComment(next);
    setSelectedMentionIds((prev) =>
      prev.includes(member.id) ? prev : [...prev, member.id]
    );
    setShowMentionList(false);
    setMentionQuery('');
    setMentionStartIndex(null);

    requestAnimationFrame(() => {
      if (!commentTextareaRef.current) return;
      const pos = before.length + insertion.length;
      commentTextareaRef.current.focus();
      commentTextareaRef.current.setSelectionRange(pos, pos);
    });
  };

  /**
   * Build mentions array from selected chips + any @Name still in text.
   */
  const buildMentionsPayload = (text: string): string[] => {
    const ids = new Set<string>(selectedMentionIds);
    const lower = text.toLowerCase();

    workspaceMembers.forEach((m) => {
      if (lower.includes(`@${m.name.toLowerCase()}`)) {
        ids.add(m.id);
      }
    });

    if (user?.id) ids.delete(user.id);
    return Array.from(ids);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !newComment.trim()) return;

    setIsPostingComment(true);
    try {
      const mentions = buildMentionsPayload(newComment);
      const res = await addCardCommentApi(card._id, newComment.trim(), mentions);
      setComments((prev) => {
        if (prev.some((c) => c._id === res.data.comment._id)) return prev;
        return [...prev, res.data.comment];
      });
      setNewComment('');
      setSelectedMentionIds([]);
      setShowMentionList(false);
      showToast(
        mentions.length > 0 ? 'Comment posted & members notified' : 'Comment posted',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setIsPostingComment(false);
    }
  };

  const toggleAssignee = async (memberId: string) => {
    if (!canAssign || isSavingAssignees) return;

    const next = assignedIds.includes(memberId)
      ? assignedIds.filter((id) => id !== memberId)
      : [...assignedIds, memberId];

    setIsSavingAssignees(true);
    try {
      await updateCardDetails(card._id, { assignees: next });
      showToast(
        assignedIds.includes(memberId) ? 'Assignee removed' : 'Member assigned',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update assignees', 'error');
    } finally {
      setIsSavingAssignees(false);
    }
  };

  const attachments = card.attachments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div className="flex-1 pr-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Card Details
            </span>
            {isEditingTitle && canEdit ? (
              <input
                autoFocus
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setCardTitle(card.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="mt-1 w-full text-lg font-bold border border-indigo-400 rounded-lg px-2 py-1 focus:outline-none"
              />
            ) : (
              <h2
                onClick={() => canEdit && setIsEditingTitle(true)}
                className={`text-lg font-bold text-slate-900 mt-0.5 ${
                  canEdit ? 'cursor-pointer hover:text-indigo-600' : ''
                }`}
              >
                {card.title}
              </h2>
            )}
            {isViewer && (
              <p className="text-[11px] text-amber-600 mt-1 font-medium">
                View only — you cannot edit this card
              </p>
            )}
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

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Description
                </h3>
                {canEdit && !isEditingDesc && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDesc && canEdit ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDescription}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-md cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDescription(card.description || '');
                        setIsEditingDesc(false);
                      }}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 min-h-[60px] whitespace-pre-wrap">
                  {card.description || 'No description added yet.'}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Attachments ({attachments.length})
                </h3>
                {canEdit && (
                  <label className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer">
                    <input type="file" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                    {isUploading ? 'Uploading...' : '+ Add File'}
                  </label>
                )}
              </div>
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No files attached</p>
                ) : (
                  attachments.map((att) => (
                    <div
                      key={att._id || att.url}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <a
                        href={`${SERVER_URL}${att.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-indigo-600 hover:underline truncate max-w-xs"
                      >
                        {att.name}
                      </a>
                      {canEdit && att._id && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(att._id!)}
                          className="text-rose-600 text-xs font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <div className="flex border-b border-slate-200 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('comments')}
                  className={`pb-2 text-xs font-bold border-b-2 cursor-pointer ${
                    activeTab === 'comments'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500'
                  }`}
                >
                  Comments ({comments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`pb-2 text-xs font-bold border-b-2 cursor-pointer ${
                    activeTab === 'activity'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500'
                  }`}
                >
                  Activity ({activities.length})
                </button>
              </div>

              {activeTab === 'comments' ? (
                <div className="space-y-4">
                  {canEdit && (
                    <form onSubmit={handleAddComment} className="space-y-2 relative">
                      <textarea
                        ref={commentTextareaRef}
                        rows={3}
                        value={newComment}
                        onChange={(e) => handleCommentChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setShowMentionList(false);
                        }}
                        placeholder="Write a comment... Type @ to mention a member"
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />

                      {showMentionList && (
                        <div className="absolute left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                          {filteredMentionMembers.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-slate-500">No members found</p>
                          ) : (
                            filteredMentionMembers.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => insertMention(m)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 flex flex-col cursor-pointer"
                              >
                                <span className="font-semibold text-slate-900">{m.name}</span>
                                <span className="text-[10px] text-slate-400">{m.email}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}

                      {selectedMentionIds.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedMentionIds.map((id) => {
                            const m = workspaceMembers.find((x) => x.id === id);
                            if (!m) return null;
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100"
                              >
                                @{m.name}
                                <button
                                  type="button"
                                  className="cursor-pointer hover:text-rose-600"
                                  onClick={() =>
                                    setSelectedMentionIds((prev) => prev.filter((x) => x !== id))
                                  }
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isPostingComment || !newComment.trim()}
                          className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md cursor-pointer"
                        >
                          {isPostingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No comments yet</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c._id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900">{c.userId?.name || 'User'}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700 whitespace-pre-wrap">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activities.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No activity yet</p>
                  ) : (
                    activities.map((a) => (
                      <div
                        key={a._id}
                        className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100 flex justify-between gap-2"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{a.userId?.name || 'User'}</span>
                          <span className="text-slate-500 ml-1.5">{a.details}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(a.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4 md:border-l md:border-slate-200 md:pl-6">
            <div ref={assigneeMenuRef} className="relative">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Assignees
                </h4>
                {canAssign && (
                  <button
                    type="button"
                    onClick={() => setIsAssigneeMenuOpen((v) => !v)}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    + Add
                  </button>
                )}
              </div>

              {!canAssign && (
                <p className="text-[10px] text-slate-400 mb-2">
                  Only workspace owner can assign tasks
                </p>
              )}

              <div className="flex flex-wrap gap-2 min-h-[28px]">
                {assignedMembers.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No one assigned</span>
                ) : (
                  assignedMembers.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-md text-[11px] font-semibold text-indigo-700"
                    >
                      {m.name}
                      {canAssign && (
                        <button
                          type="button"
                          onClick={() => toggleAssignee(m.id)}
                          className="text-indigo-400 hover:text-rose-600 cursor-pointer"
                          title="Remove"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))
                )}
              </div>

              {isAssigneeMenuOpen && canAssign && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto py-1">
                  {workspaceMembers.map((m) => {
                    const checked = assignedIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={isSavingAssignees}
                        onClick={() => toggleAssignee(m.id)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between cursor-pointer disabled:opacity-50"
                      >
                        <span>
                          <span className="font-semibold text-slate-800">{m.name}</span>
                          <span className="block text-[10px] text-slate-400">{m.email}</span>
                        </span>
                        {checked && <span className="text-indigo-600 font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Created On
              </h4>
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