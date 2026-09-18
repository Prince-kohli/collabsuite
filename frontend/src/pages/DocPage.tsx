import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocStore } from '../store/useDocStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useToastStore } from '../store/useToastStore';
import { DocTreeItem } from '../components/doc/DocTreeItem';
import { TiptapEditor } from '../components/TiptapEditor';

export const DocPage = () => {
  const { workspaceId, docId } = useParams<{ workspaceId: string; docId: string }>();
  const navigate = useNavigate();

  const { activeWorkspace, currentUserRole } = useWorkspaceStore();
  const showToast = useToastStore((s) => s.showToast);
  const {
    docTree,
    activeDoc,
    fetchDocsTree,
    fetchDocById,
    createDoc,
    updateDocAutoSave,
    isSaving,
  } = useDocStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Owner + Member can edit; Viewer is read-only
  const isViewer = currentUserRole === 'viewer';
  const canEdit = currentUserRole === 'owner' || currentUserRole === 'member';

  useEffect(() => {
    if (workspaceId) {
      fetchDocsTree(workspaceId);
    }
  }, [workspaceId, fetchDocsTree]);

  useEffect(() => {
    if (docId) {
      fetchDocById(docId);
    }
  }, [docId, fetchDocById]);

  useEffect(() => {
    if (activeDoc && activeDoc._id === docId) {
      setTitle(activeDoc.title || '');
      setContent(activeDoc.content || '');
    }
  }, [activeDoc, docId]);

  // Debounced auto-save (disabled for viewers)
  const triggerAutoSave = (newTitle: string, newContent: string) => {
    if (!docId || !canEdit) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      updateDocAutoSave(docId, {
        title: newTitle,
        content: newContent,
      });
    }, 1000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(val, content);
  };

   const handleContentChange = (newContent: string) => {
    if (!canEdit) return;
    setContent(newContent);
    triggerAutoSave(title, newContent);
  };

  const handleCreateRootDoc = async () => {
    if (!workspaceId) return;
    if (!canEdit) {
      showToast('You do not have permission to create wiki pages', 'error');
      return;
    }

    try {
      const created = await createDoc({
        workspaceId,
        title: 'Untitled Page',
      });
      showToast('New page created successfully', 'success');
      navigate(`/workspaces/${workspaceId}/docs/${created._id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create page', 'error');
    }
  };

  if (!workspaceId) {
    return <div className="p-8 text-center text-slate-500">Workspace not found</div>;
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] flex border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Left Tree Sidebar */}
      <div className="w-64 border-r border-slate-200 bg-slate-50 p-3 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Workspace Wiki
            </span>
            {canEdit && (
              <button
                type="button"
                onClick={handleCreateRootDoc}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 cursor-pointer"
                title="New Page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>

          <div className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-12rem)]">
            {docTree.length === 0 ? (
              <p className="text-xs text-slate-400 px-2 py-4 text-center">No documents yet.</p>
            ) : (
              docTree.map((node) => (
                <DocTreeItem
                  key={node._id}
                  node={node}
                  workspaceId={workspaceId}
                  activeDocId={docId}
                />
              ))
            )}
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={handleCreateRootDoc}
            className="w-full py-2 px-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer border border-dashed border-indigo-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Page
          </button>
        )}
      </div>

      {/* Right Editor */}
      <div className="flex-1 flex flex-col min-w-0 p-6 sm:p-10 overflow-y-auto bg-white">
        {docId && activeDoc ? (
          <div className="max-w-3xl w-full mx-auto space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 pb-2">
              <span className="text-[11px] font-medium text-slate-400">
                Workspace: {activeWorkspace?.name}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                {isViewer ? (
                  <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Viewer Mode (Read-only)
                  </span>
                ) : isSaving ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Saved
                  </>
                )}
              </span>
            </div>

            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              readOnly={isViewer}
              placeholder="Untitled Page"
              className={`w-full text-3xl sm:text-4xl font-extrabold text-slate-900 bg-transparent border-none focus:outline-none placeholder-slate-300 ${
                isViewer ? 'cursor-not-allowed opacity-80' : ''
              }`}
            />

           <div className={`mt-4 ${isViewer ? 'opacity-90' : ''}`}>
              <TiptapEditor
                content={content}
                onChange={handleContentChange}
                readOnly={isViewer}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800">Select or Create a Document</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Choose a page from the wiki sidebar on the left or create a new page to start drafting
              ideas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};