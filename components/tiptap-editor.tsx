"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import type { JSONContent } from "@tiptap/react";

// ============================================================================
// TYPES
// ============================================================================

export interface TipTapEditorHandle {
  /** Inserisce testo alla posizione corrente del cursore */
  insertText: (text: string) => void;
  /** Sostituisce la selezione corrente con il testo */
  replaceSelection: (text: string) => void;
  /** Ottiene il contenuto JSON dell'editor */
  getContent: () => JSONContent;
  /** Verifica se c'è una selezione di testo */
  hasSelection: () => boolean;
  /** Focus sull'editor */
  focus: () => void;
}

interface TipTapEditorProps {
  /** Contenuto iniziale in formato TipTap JSON */
  initialContent: JSONContent;
  /** Callback quando il contenuto cambia */
  onContentChange?: (content: JSONContent) => void;
  /** Callback quando lo stato della selezione cambia */
  onSelectionChange?: (
    hasSelection: boolean,
    hasCursor: boolean,
    selectedText?: string
  ) => void;
}

// Debounce delay in ms
const SELECTION_DEBOUNCE_MS = 100;

// ============================================================================
// COMPONENT
// ============================================================================

export const TipTapEditor = forwardRef<TipTapEditorHandle, TipTapEditorProps>(
  function TipTapEditor(
    { initialContent, onContentChange, onSelectionChange },
    ref
  ) {
    // Ref per debounce
    const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Salva la selezione corrente per mantenerla anche dopo blur
    const savedSelectionRef = useRef<{
      from: number;
      to: number;
      text: string;
    } | null>(null);

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
            "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[600px] px-16 py-12",
        },
      },
      onUpdate: ({ editor }) => {
        onContentChange?.(editor.getJSON());
      },
      onSelectionUpdate: ({ editor }) => {
        // Cancella il timeout precedente
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }

        // Debounce per evitare chiamate multiple durante il drag
        selectionTimeoutRef.current = setTimeout(() => {
          const { from, to } = editor.state.selection;
          const hasSelection = from !== to;

          if (hasSelection) {
            const selectedText = editor.state.doc
              .textBetween(from, to, " ")
              .trim();
            // Salva la selezione
            savedSelectionRef.current = { from, to, text: selectedText };
            onSelectionChange?.(true, true, selectedText);
          } else {
            // Selezione vuota (solo cursore) - resetta la selezione salvata
            savedSelectionRef.current = null;
            onSelectionChange?.(false, true, undefined);
          }
        }, SELECTION_DEBOUNCE_MS);
      },
      onFocus: ({ editor }) => {
        // Quando l'editor riprende il focus, controlla se c'è una selezione salvata
        // e se la selezione corrente è diversa
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        if (hasSelection) {
          const selectedText = editor.state.doc
            .textBetween(from, to, " ")
            .trim();
          savedSelectionRef.current = { from, to, text: selectedText };
          onSelectionChange?.(true, true, selectedText);
        } else if (savedSelectionRef.current) {
          // Mantieni la selezione salvata
          onSelectionChange?.(true, true, savedSelectionRef.current.text);
        } else {
          onSelectionChange?.(false, true, undefined);
        }
      },
      onBlur: () => {
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
        // NON resettare la selezione su blur!
        // La selezione salvata rimane disponibile per la sidebar
        // Notifica solo che non c'è più il cursore attivo, ma mantieni hasSelection
        if (savedSelectionRef.current) {
          onSelectionChange?.(true, false, savedSelectionRef.current.text);
        } else {
          onSelectionChange?.(false, false, undefined);
        }
      },
    });

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
      };
    }, []);

    // Espone i metodi al parent via ref
    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        if (editor) {
          editor.chain().focus().insertContent(text).run();
          // Dopo l'inserimento, resetta la selezione salvata
          savedSelectionRef.current = null;
        }
      },
      replaceSelection: (text: string) => {
        if (editor) {
          // Se c'è una selezione salvata, ripristinala prima di sostituire
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
          // Resetta la selezione salvata dopo la sostituzione
          savedSelectionRef.current = null;
          onSelectionChange?.(false, true, undefined);
        }
      },
      getContent: () => {
        return editor?.getJSON() || { type: "doc", content: [] };
      },
      hasSelection: () => {
        // Considera anche la selezione salvata
        if (savedSelectionRef.current) return true;
        if (!editor) return false;
        const { from, to } = editor.state.selection;
        return from !== to;
      },
      focus: () => {
        editor?.chain().focus().run();
      },
    }));

    // Aggiorna il contenuto se cambia dall'esterno
    useEffect(() => {
      if (editor && initialContent) {
        const currentContent = JSON.stringify(editor.getJSON());
        const newContent = JSON.stringify(initialContent);
        if (currentContent !== newContent) {
          editor.commands.setContent(initialContent);
          // Resetta la selezione quando cambia il documento
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
          <div className="bg-card shadow-lg rounded-lg border border-border min-h-[11in]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    );
  }
);
