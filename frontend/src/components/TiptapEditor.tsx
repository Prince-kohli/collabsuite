import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
}

export const TiptapEditor = ({ content, onChange, readOnly = false }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-5 space-y-1 my-2',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-5 space-y-1 my-2',
          },
        },
        heading: {
          HTMLAttributes: {
            class: 'font-bold text-slate-900 my-3',
          },
        },
      }),
      Placeholder.configure({
        placeholder: readOnly ? '' : "Type '/' for commands or start typing...",
      }),
    ],
    content: content,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] text-slate-800 text-sm leading-relaxed p-2',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  if (!editor) return null;

  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
      {/* Formatting Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded font-bold hover:bg-slate-200 cursor-pointer ${
              editor.isActive('bold') ? 'bg-slate-200 text-indigo-600' : 'text-slate-700'
            }`}
            title="Bold (Ctrl+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded italic hover:bg-slate-200 cursor-pointer ${
              editor.isActive('italic') ? 'bg-slate-200 text-indigo-600' : 'text-slate-700'
            }`}
            title="Italic (Ctrl+I)"
          >
            I
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 rounded font-bold hover:bg-slate-200 cursor-pointer ${
              editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 text-indigo-600' : 'text-slate-700'
            }`}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 rounded font-bold hover:bg-slate-200 cursor-pointer ${
              editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-indigo-600' : 'text-slate-700'
            }`}
          >
            H2
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2.5 py-1 rounded font-medium hover:bg-slate-200 cursor-pointer ${
              editor.isActive('bulletList') ? 'bg-slate-200 text-indigo-600' : 'text-slate-700'
            }`}
            title="Bullet List"
          >
            • Bullet List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2.5 py-1 rounded font-medium hover:bg-slate-200 cursor-pointer ${
              editor.isActive('orderedList') ? 'bg-slate-200 text-indigo-600' : 'text-slate-700'
            }`}
            title="Numbered List"
          >
            1. Numbered List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-2 py-1 rounded font-medium hover:bg-slate-200 cursor-pointer ${
              editor.isActive('blockquote') ? 'bg-slate-200 text-indigo-600' : 'text-slate-700'
            }`}
            title="Quote"
          >
            " Quote
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};