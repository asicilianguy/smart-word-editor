/**
 * TipTap Checkbox Extension - Versione 4 (Indice Ordinale)
 *
 * Le checkbox sono identificate dal loro INDICE nel documento (0, 1, 2, ...).
 * Nessun matching testuale, identificazione chirurgica.
 *
 * Funzionamento:
 * 1. Il parser backend numera le checkbox in ordine documento
 * 2. TipTap le mostra come caratteri ☐/☑ nello stesso ordine
 * 3. Al click, contiamo quante checkbox ci sono PRIMA → indice
 * 4. Inviamo al backend: {checkboxIndex: 5, newChecked: true}
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Caratteri checkbox
export const CHECKBOX_UNCHECKED = "☐";
export const CHECKBOX_CHECKED = "☑";
export const CHECKBOX_CHARS = [CHECKBOX_UNCHECKED, CHECKBOX_CHECKED];

export interface CheckboxOptions {
  /**
   * Callback quando una checkbox viene togglata.
   * Riceve l'indice della checkbox e il nuovo stato.
   */
  onToggle?: (checkboxIndex: number, newChecked: boolean) => void;
}

/**
 * Trova tutte le posizioni delle checkbox nel documento
 */
function findAllCheckboxPositions(
  doc: any
): Array<{ pos: number; char: string }> {
  const positions: Array<{ pos: number; char: string }> = [];

  doc.descendants((node: any, pos: number) => {
    if (!node.isText || !node.text) return;

    const text = node.text;
    for (let i = 0; i < text.length; i++) {
      if (CHECKBOX_CHARS.includes(text[i])) {
        positions.push({ pos: pos + i, char: text[i] });
      }
    }
  });

  return positions;
}

/**
 * Trova la checkbox più vicina alla posizione del click
 */
function findNearestCheckbox(
  doc: any,
  clickPos: number,
  maxDistance: number = 3
): { pos: number; char: string; index: number } | null {
  const allCheckboxes = findAllCheckboxPositions(doc);

  let nearest: { pos: number; char: string; index: number } | null = null;
  let nearestDist = Infinity;

  for (let i = 0; i < allCheckboxes.length; i++) {
    const cb = allCheckboxes[i];
    const dist = Math.abs(cb.pos - clickPos);

    if (dist < nearestDist && dist <= maxDistance) {
      nearestDist = dist;
      nearest = { ...cb, index: i };
    }
  }

  return nearest;
}

/**
 * Plugin ProseMirror per checkbox interattive
 */
function createCheckboxPlugin(onToggle?: CheckboxOptions["onToggle"]) {
  return new Plugin({
    key: new PluginKey("checkbox-index"),

    props: {
      handleClick(view, pos, event) {
        const { state } = view;
        const { doc } = state;

        // Trova la checkbox più vicina
        const found = findNearestCheckbox(doc, pos, 3);

        if (!found) {
          return false;
        }

        const { pos: checkboxPos, char: oldChar, index: checkboxIndex } = found;
        const newChar =
          oldChar === CHECKBOX_UNCHECKED
            ? CHECKBOX_CHECKED
            : CHECKBOX_UNCHECKED;
        const newChecked = newChar === CHECKBOX_CHECKED;

        // Applica la sostituzione visuale
        const tr = state.tr.replaceWith(
          checkboxPos,
          checkboxPos + 1,
          state.schema.text(newChar)
        );
        view.dispatch(tr);

        // Callback con indice
        if (onToggle) {
          console.log(
            `[Checkbox] Toggle #${checkboxIndex}: ${oldChar} → ${newChar}`
          );
          onToggle(checkboxIndex, newChecked);
        }

        return true;
      },

      /**
       * Decorazioni per styling
       */
      decorations(state) {
        const { doc } = state;
        const decorations: Decoration[] = [];
        const allCheckboxes = findAllCheckboxPositions(doc);

        for (let i = 0; i < allCheckboxes.length; i++) {
          const cb = allCheckboxes[i];

          decorations.push(
            Decoration.inline(cb.pos, cb.pos + 1, {
              class: "tiptap-checkbox",
              "data-checkbox-index": String(i),
              "data-checked": cb.char === CHECKBOX_CHECKED ? "true" : "false",
            })
          );
        }

        return DecorationSet.create(doc, decorations);
      },
    },
  });
}

/**
 * Estensione Checkbox per TipTap
 */
export const Checkbox = Extension.create<CheckboxOptions>({
  name: "checkbox",

  addOptions() {
    return {
      onToggle: undefined,
    };
  },

  addProseMirrorPlugins() {
    return [createCheckboxPlugin(this.options.onToggle)];
  },
});

export default Checkbox;
