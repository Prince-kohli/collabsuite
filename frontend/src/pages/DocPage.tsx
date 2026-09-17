import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocStore } from '../store/useDocStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { DocTreeItem } from '../components/doc/DocTreeItem';

export const DocPage = () => {
  const { workspaceId, docId } = useParams<{ workspaceId: string; docId: string }>();
  const navigate = useNavigate();

  const { activeWorkspace } = useWorkspaceStore();
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

  // Fetch Tree
  useEffect(() => {
    if (workspaceId) {
      fetchDocsTree(workspaceId);
    }
  }, [workspaceId, fetchDocsTree]);

  // Fetch Active Doc when docId changes
  useEffect(() => {
    if (docId) {
      fetchDocById(docId);
    }
  }, [docId, fetchDocById]);

  // Sync activeDoc data to local form state
  useEffect(() => {
    if (activeDoc && activeDoc._id === docId) {
      setTitle(activeDoc.title || '');
      setContent(activeDoc.content || '');
    }
  }, [activeDoc, docId]);

  // Trigger Debounced Auto-Save (1 Second Delay)
  const triggerAutoSave = (newTitle: string, newContent: string) => {
    if (!docId) return;

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
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(val, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    triggerAutoSave(title, val);
  };

  const handleCreateRootDoc = async () => {
    if (!workspaceId) return;
    try {
      const created = await createDoc({
        workspaceId,
        title: 'Untitled Page',
      });
      navigate(`/workspaces/${workspaceId}/docs/${created._id}`);
    } catch (err) {
      console.error('Failed to create root doc', err);
    }
  };

  if (!workspaceId) {
    return <div className="p-8 text-center text-zinc-500">Workspace not found</div>;
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] flex border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
      {/* Left Tree Sidebar */}
      <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-3 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Workspace Wiki
            </span>
            <button
              onClick={handleCreateRootDoc}
              className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
              title="New Page"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Tree Structure */}
          <div className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-12rem)]">
            {docTree.length === 0 ? (
              <p className="text-xs text-zinc-400 px-2 py-4 text-center">No documents yet.</p>
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

        <button
          onClick={handleCreateRootDoc}
          className="w-full py-2 px-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors flex items-center gap-2 cursor-pointer border border-dashed border-indigo-200 dark:border-indigo-900"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Page
        </button>
      </div>

      {/* Right Content / Notion Editor */}
      <div className="flex-1 flex flex-col min-w-0 p-6 sm:p-10 overflow-y-auto">
        {docId && activeDoc ? (
          <div className="max-w-3xl w-full mx-auto space-y-6">
            {/* Auto-save Status Badge */}
            <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-[11px] font-medium text-zinc-400">
                Workspace: {activeWorkspace?.name}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                {isSaving ? (
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

            {/* Editable Title */}
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Page"
              className="w-full text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 bg-transparent border-none focus:outline-none placeholder-zinc-300 dark:placeholder-zinc-700"
            />

            {/* Editable Markdown/Text Content Area */}
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Type your notes, ideas, or documentation here..."
              rows={20}
              className="w-full text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 bg-transparent border-none focus:outline-none resize-none placeholder-zinc-400 dark:placeholder-zinc-600"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
              Select or Create a Document
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1">
              Choose a page from the wiki sidebar on the left or create a new page to start drafting ideas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};