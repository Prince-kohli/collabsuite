import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

export const WorkspaceOverviewPage = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { activeWorkspace, setActiveWorkspace, isLoading } = useWorkspaceStore();

  useEffect(() => {
    if (workspaceId && activeWorkspace?._id !== workspaceId) {
      setActiveWorkspace(workspaceId);
    }
  }, [workspaceId, activeWorkspace, setActiveWorkspace]);

  if (isLoading && !activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">No Workspace Selected</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Select or create a workspace from the sidebar to get started.</p>
      </div>
    );
  }

  const modules = [
    {
      title: 'Kanban Boards (Trello)',
      description: 'Organize tasks, manage sprint workflows, and drag-and-drop cards across custom lists.',
      path: `/workspaces/${activeWorkspace._id}/boards`,
      badge: 'Workflows',
      color: 'indigo',
    },
    {
      title: 'Docs & Wiki (Notion)',
      description: 'Collaborate on nested real-time documentation, rich markdown pages, and auto-saved notes.',
      path: `/workspaces/${activeWorkspace._id}/docs`,
      badge: 'Knowledge',
      color: 'purple',
    },
    {
      title: 'Team Channels (Slack)',
      description: 'Communicate in real-time channels, direct messages, and team threads with live typing indicators.',
      path: `/workspaces/${activeWorkspace._id}/channels`,
      badge: 'Messaging',
      color: 'emerald',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Workspace Overview
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {activeWorkspace.name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-xl">
              {activeWorkspace.description || 'Welcome to your collaborative workspace hub.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
              <span className="block text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {activeWorkspace.members?.length || 1}
              </span>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Quick Launch Grid */}
      <div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Workspace Apps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {modules.map((mod) => (
            <div
              key={mod.title}
              onClick={() => navigate(mod.path)}
              className="group p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mb-3">
                  {mod.badge}
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Open App
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};