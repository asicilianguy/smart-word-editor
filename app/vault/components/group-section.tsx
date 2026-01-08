"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ChevronDown, ChevronUp, Folder } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { EntryRow } from "./entry-row";
import type { VaultEntry } from "../types";

interface GroupSectionProps {
  group: string;
  entries: VaultEntry[];
  onEdit: (entry: VaultEntry) => void;
  onDelete: (entry: VaultEntry) => void;
  onMoveToGroup: (entryId: string, newGroup: string) => void;
  availableGroups: string[];
}

export function GroupSection({
  group,
  entries,
  onEdit,
  onDelete,
  onMoveToGroup,
  availableGroups,
}: GroupSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { setNodeRef, isOver, active } = useDroppable({
    id: `group-${group}`,
    data: {
      type: "group",
      group,
    },
  });

  const isDraggingFromOtherGroup =
    active?.data?.current?.type === "entry" &&
    active?.data?.current?.entry?.group !== group;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border overflow-hidden transition-all duration-200",
        isOver && isDraggingFromOtherGroup
          ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 ring-2 ring-[var(--brand-primary)]/20"
          : "border-border bg-card"
      )}
    >
      {/* Group header - CATEGORIA chiaramente etichettata */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 border-b transition-colors",
          isOver && isDraggingFromOtherGroup
            ? "bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30"
            : "bg-muted/40 border-border"
        )}
      >
        {/* Area cliccabile per expand/collapse */}
        <div
          className="flex-1 flex items-center gap-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Icona categoria */}
          <div
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
              isOver && isDraggingFromOtherGroup
                ? "bg-[var(--brand-primary)]/20"
                : "bg-muted"
            )}
          >
            <Folder
              className={cn(
                "h-4 w-4 transition-colors",
                isOver && isDraggingFromOtherGroup
                  ? "text-[var(--brand-primary)]"
                  : "text-muted-foreground"
              )}
            />
          </div>

          {/* Nome categoria con label esplicita */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Categoria:
              </span>
              <span className="font-medium text-sm truncate">{group}</span>
            </div>
            <p
              className={cn(
                "text-xs transition-colors",
                isOver && isDraggingFromOtherGroup
                  ? "text-[var(--brand-primary)]"
                  : "text-muted-foreground"
              )}
            >
              {entries.length} {entries.length === 1 ? "dato" : "dati"}
              {isOver && isDraggingFromOtherGroup && " • Rilascia qui"}
            </p>
          </div>

          {/* Chevron */}
          <div className="text-muted-foreground">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>

      {/* Entries - I VERI DATI */}
      {isExpanded && (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onEdit={() => onEdit(entry)}
              onDelete={() => onDelete(entry)}
              onMoveToGroup={(newGroup) => onMoveToGroup(entry.id, newGroup)}
              availableGroups={availableGroups.filter((g) => g !== group)}
            />
          ))}

          {/* Empty group placeholder */}
          {entries.length === 0 && (
            <div
              className={cn(
                "px-4 py-8 text-center transition-colors",
                isOver && isDraggingFromOtherGroup
                  ? "text-[var(--brand-primary)]"
                  : "text-muted-foreground"
              )}
            >
              <p className="text-sm">
                {isOver && isDraggingFromOtherGroup
                  ? "Rilascia per spostare qui"
                  : "Nessun dato in questa categoria"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
