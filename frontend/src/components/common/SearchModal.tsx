import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { globalSearchApi, type SearchResultItem } from '../../api/search.api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim() || !activeWorkspace) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await globalSearchApi(activeWorkspace._id, query.trim());
        setResults(response.data.results || []);
      } catch (err) {
        console.error('Global search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, [query, activeWorkspace]);

  if (!isOpen) return null;

  const handleSelectResult = (item: SearchResultItem) => {
    onClose();
    navigate(item.url);
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'board':
      case 'card':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      case 'doc':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
      case 'channel':
      case 'message':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-zinc-400 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs, cards, channels..."
            className="w-full text-sm bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
          {isSearching && (
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length === 0 && query.trim() && !isSearching && (
            <p className="text-xs text-zinc-400 text-center py-6">No matching results found.</p>
          )}

          {results.length === 0 && !query.trim() && (
            <p className="text-xs text-zinc-400 text-center py-6">Type to search across active workspace...</p>
          )}

          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelectResult(item)}
              className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors flex items-center justify-between"
            >
              <div className="min-w-0 flex-1 pr-3">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {item.title}
                </p>
                {item.snippet && (
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{item.snippet}</p>
                )}
              </div>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${getBadgeColor(item.type)} shrink-0`}>
                {item.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};