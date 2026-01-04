"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import type { JSONContent } from "@tiptap/react";
import {
  Checkbox,
  CHECKBOX_UNCHECKED,
  CHECKBOX_CHECKED,
} from "./extensions/checkbox-extension";

// ============================================================================
// TYPES
// ============================================================================

export interface TipTapEditorHandle {
  insertText: (text: string) => void;
  replaceSelection: (text: string) => void;
  getContent: () => JSONContent;
  hasSelection: () => boolean;
  focus: () => void;
  getSelectedText: () => string | undefined;
}

interface TipTapEditorProps {
  initialContent: JSONContent;
  onContentChange?: (content: JSONContent) => void;
  onSelectionChange?: (
    hasSelection: boolean,
    hasCursor: boolean,
    selectedText?: string
  ) => void;
  /** Chiamato quando una checkbox viene togglata. Riceve indice e nuovo stato. */
  onCheckboxToggle?: (checkboxIndex: number, newChecked: boolean) => void;
}

const SELECTION_DEBOUNCE_MS = 100;

// ============================================================================
// COMPONENT
// ============================================================================

export const TipTapEditor = forwardRef<TipTapEditorHandle, TipTapEditorProps>(
  function TipTapEditor(
    { initialContent, onContentChange, onSelectionChange, onCheckboxToggle },
    ref
  ) {
    const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const savedSelectionRef = useRef<{
      from: number;
      to: number;
      text: string;
    } | null>(null);

    // Callback per quando una checkbox viene togglata
    // Riceve (checkboxIndex, newChecked) dalla nuova estensione
    const handleCheckboxToggle = useCallback(
      (checkboxIndex: number, newChecked: boolean) => {
        if (onCheckboxToggle) {
          onCheckboxToggle(checkboxIndex, newChecked);
        }
      },
      [onCheckboxToggle]
    );

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          blockquote: false,
          codeBlock: false,
          code: false,
          horizontalRule: false,
        }),
        Placeholder.configure({
          placeholder: "Clicca qui per iniziare a digitare...",
        }),
        Underline,
        // Estensioni tabella
        Table.configure({
          resizable: false,
          HTMLAttributes: {
            class: "docx-table",
          },
        }),
        TableRow,
        TableCell.configure({
          HTMLAttributes: {
            class: "docx-cell",
          },
        }),
        TableHeader.configure({
          HTMLAttributes: {
            class: "docx-header-cell",
          },
        }),
        // Estensione checkbox interattive (versione 4 - per indice)
        Checkbox.configure({
          onToggle: handleCheckboxToggle,
        }),
      ],
      content: initialContent,
      onCreate: ({ editor }) => {
        if (
          initialContent &&
          initialContent.content &&
          initialContent.content.length > 0
        ) {
          editor.commands.setContent(initialContent);
        }
      },
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[600px] px-12 py-8",
        },
      },
      onUpdate: ({ editor }) => {
        onContentChange?.(editor.getJSON());
      },
      onSelectionUpdate: ({ editor }) => {
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }

        selectionTimeoutRef.current = setTimeout(() => {
          const { from, to } = editor.state.selection;
          const hasSelection = from !== to;

          if (hasSelection) {
            const selectedText = editor.state.doc
              .textBetween(from, to, " ")
              .trim();
            savedSelectionRef.current = { from, to, text: selectedText };
            onSelectionChange?.(true, true, selectedText);
          } else {
            savedSelectionRef.current = null;
            onSelectionChange?.(false, true, undefined);
          }
        }, SELECTION_DEBOUNCE_MS);
      },
      onFocus: ({ editor }) => {
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        if (hasSelection) {
          const selectedText = editor.state.doc
            .textBetween(from, to, " ")
            .trim();
          savedSelectionRef.current = { from, to, text: selectedText };
          onSelectionChange?.(true, true, selectedText);
        } else if (savedSelectionRef.current) {
          onSelectionChange?.(true, true, savedSelectionRef.current.text);
        } else {
          onSelectionChange?.(false, true, undefined);
        }
      },
      onBlur: () => {
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
        if (savedSelectionRef.current) {
          onSelectionChange?.(true, false, savedSelectionRef.current.text);
        } else {
          onSelectionChange?.(false, false, undefined);
        }
      },
    });

    useEffect(() => {
      return () => {
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        if (editor) {
          editor.chain().focus().insertContent(text).run();
          savedSelectionRef.current = null;
        }
      },
      replaceSelection: (text: string) => {
        if (editor) {
          if (savedSelectionRef.current) {
            const { from, to } = savedSelectionRef.current;
            editor
              .chain()
              .focus()
              .setTextSelection({ from, to })
              .deleteSelection()
              .insertContent(text)
              .run();
          } else {
            editor.chain().focus().deleteSelection().insertContent(text).run();
          }
          savedSelectionRef.current = null;
          onSelectionChange?.(false, true, undefined);
        }
      },
      getContent: () => {
        return editor?.getJSON() || { type: "doc", content: [] };
      },
      hasSelection: () => {
        if (savedSelectionRef.current) return true;
        if (!editor) return false;
        const { from, to } = editor.state.selection;
        return from !== to;
      },
      focus: () => {
        editor?.chain().focus().run();
      },
      getSelectedText: () => {
        return savedSelectionRef.current?.text;
      },
    }));

    useEffect(() => {
      if (editor && initialContent) {
        const currentContent = JSON.stringify(editor.getJSON());
        const newContent = JSON.stringify(initialContent);
        if (currentContent !== newContent) {
          editor.commands.setContent(initialContent);
          savedSelectionRef.current = null;
        }
      }
    }, [editor, initialContent]);

    if (!editor) {
      return (
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Caricamento editor...</p>
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto bg-background">
        <div className="mx-auto max-w-4xl py-8">
          <div className="bg-card shadow-lg rounded-lg border border-border min-h-[11in] docx-preview">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Stili per tabelle e checkbox */}
        <style jsx global>{`
          /* Reset prose table styles */
          .docx-preview .ProseMirror table {
            border-collapse: collapse;
            width: 100%;
            margin: 0.75rem 0;
            table-layout: auto;
          }

          .docx-preview .ProseMirror td,
          .docx-preview .ProseMirror th {
            border: 1px solid #d1d5db;
            padding: 0.5rem 0.75rem;
            text-align: left;
            vertical-align: top;
            min-width: 50px;
          }

          .docx-preview .ProseMirror th {
            background-color: #f9fafb;
            font-weight: 600;
          }

          .docx-preview .ProseMirror tr:nth-child(even) td {
            background-color: #fafafa;
          }

          /* Selezione nelle celle */
          .docx-preview .ProseMirror td.selectedCell,
          .docx-preview .ProseMirror th.selectedCell {
            background-color: #dbeafe;
          }

          .docx-preview .ProseMirror td p,
          .docx-preview .ProseMirror th p {
            margin: 0;
          }

          /* Checkbox interattive */
          .docx-preview .ProseMirror .tiptap-checkbox {
            cursor: pointer;
            font-size: 1.1em;
            padding: 0 2px;
            border-radius: 2px;
            transition: all 0.15s ease;
            user-select: none;
          }

          .docx-preview .ProseMirror .tiptap-checkbox:hover {
            background-color: #dbeafe;
            transform: scale(1.2);
          }

          .docx-preview .ProseMirror .tiptap-checkbox[data-checked="true"] {
            color: #16a34a;
          }

          .docx-preview .ProseMirror .tiptap-checkbox[data-checked="false"] {
            color: #6b7280;
          }

          .docx-preview .ProseMirror .tiptap-checkbox:active {
            transform: scale(0.95);
          }

          /* Dark mode */
          .dark .docx-preview .ProseMirror td,
          .dark .docx-preview .ProseMirror th {
            border-color: #374151;
          }

          .dark .docx-preview .ProseMirror th {
            background-color: #1f2937;
          }

          .dark .docx-preview .ProseMirror tr:nth-child(even) td {
            background-color: #111827;
          }

          .dark .docx-preview .ProseMirror td.selectedCell,
          .dark .docx-preview .ProseMirror th.selectedCell {
            background-color: #1e3a5f;
          }

          .dark .docx-preview .ProseMirror .tiptap-checkbox:hover {
            background-color: #1e3a5f;
          }

          .dark
            .docx-preview
            .ProseMirror
            .tiptap-checkbox[data-checked="true"] {
            color: #22c55e;
          }

          .dark
            .docx-preview
            .ProseMirror
            .tiptap-checkbox[data-checked="false"] {
            color: #9ca3af;
          }
        `}</style>
      </div>
    );
  }
);
