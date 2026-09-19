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
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setIsSearching(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Debounced global search (400ms)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 2 || !activeWorkspace) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await globalSearchApi(activeWorkspace._id, trimmed);
        setResults(response.data.results || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
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
        return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'doc':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'channel':
      case 'message':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-white">
          <svg
            className="w-4 h-4 text-slate-400 shrink-0 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs, cards, messages..."
            className="w-full text-sm bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {isSearching && (
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-semibold px-2 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 bg-white">
          {results.length === 0 && query.trim().length >= 2 && !isSearching && (
            <p className="text-xs text-slate-400 text-center py-8">
              No matching results found.
            </p>
          )}

          {results.length === 0 && query.trim().length < 2 && (
            <p className="text-xs text-slate-400 text-center py-8">
              Type at least 2 characters to search this workspace...
            </p>
          )}

          {results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => handleSelectResult(item)}
              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {item.title}
                </p>
                {item.snippet && (
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {item.snippet}
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${getBadgeColor(
                  item.type
                )} shrink-0`}
              >
                {item.type}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};