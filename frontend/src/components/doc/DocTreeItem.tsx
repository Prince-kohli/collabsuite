import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DocTreeNode } from '../../types';
import { useDocStore } from '../../store/useDocStore';

interface DocTreeItemProps {
  node: DocTreeNode;
  workspaceId: string;
  activeDocId?: string;
  level?: number;
}

export const DocTreeItem = ({
  node,
  workspaceId,
  activeDocId,
  level = 0,
}: DocTreeItemProps) => {
  const navigate = useNavigate();
  const { createDoc, archiveDoc } = useDocStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const isActive = activeDocId === node._id;
  const hasChildren = node.children && node.children.length > 0;

  const handleSelect = () => {
    navigate(`/workspaces/${workspaceId}/docs/${node._id}`);
  };

  const handleAddSubDoc = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newDoc = await createDoc({
        workspaceId,
        title: 'Untitled Sub-page',
        parentDocId: node._id,
      });
      setIsExpanded(true);
      navigate(`/workspaces/${workspaceId}/docs/${newDoc._id}`);
    } catch (err) {
      console.error('Failed to create sub-document:', err);
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to archive this page?')) {
      await archiveDoc(node._id, workspaceId);
      if (isActive) {
        navigate(`/workspaces/${workspaceId}/docs`);
      }
    }
  };

  return (
    <div className="select-none">
      <div
        onClick={handleSelect}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Expand/Collapse Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-transform ${
              hasChildren ? 'visible' : 'invisible'
            }`}
          >
            <svg
              className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Doc Icon */}
          <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>

          <span className="truncate">{node.title || 'Untitled'}</span>
        </div>

        {/* Action Buttons */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={handleAddSubDoc}
            title="Add sub-page"
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={handleArchive}
            title="Archive page"
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/50 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Render Nested Children */}
      {isExpanded && hasChildren && (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <DocTreeItem
              key={child._id}
              node={child}
              workspaceId={workspaceId}
              activeDocId={activeDocId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};