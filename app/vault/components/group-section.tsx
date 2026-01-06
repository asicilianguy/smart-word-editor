"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { EntryRow } from "./entry-row";
import { getGroupIcon } from "../constants";
import type { VaultEntry } from "../types";

interface GroupSectionProps {
  group: string;
  entries: VaultEntry[];
  onEdit: (entry: VaultEntry) => void;
  onDelete: (entry: VaultEntry) => void;
  onMoveToGroup: (entryId: string, newGroup: string) => void;
  availableGroups: string[];
  isDraggingOver?: boolean;
}

export function GroupSection({
  group,
  entries,
  onEdit,
  onDelete,
  onMoveToGroup,
  availableGroups,
}: GroupSectionProps) {
  const Icon = getGroupIcon(group);

  const { setNodeRef, isOver, active } = useDroppable({
    id: `group-${group}`,
    data: {
      type: "group",
      group,
    },
  });

  // Determina se stiamo trascinando un elemento da un altro gruppo
  const isDraggingFromOtherGroup =
    active?.data?.current?.type === "entry" &&
    active?.data?.current?.entry?.group !== group;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md border-2 overflow-hidden",
        isOver && isDraggingFromOtherGroup
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-card"
      )}
    >
      {/* Group header */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 border-b",
          isOver && isDraggingFromOtherGroup
            ? "bg-primary/10 border-primary/30"
            : "bg-muted/30 border-border"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            isOver && isDraggingFromOtherGroup
              ? "text-primary"
              : "text-muted-foreground"
          )}
        />
        <h2 className="font-medium flex-1">{group}</h2>
        <span
          className={cn(
            "text-sm",
            isOver && isDraggingFromOtherGroup
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {entries.length} valor{entries.length === 1 ? "e" : "i"}
          {isOver && isDraggingFromOtherGroup && (
            <span className="ml-1">• Rilascia qui</span>
          )}
        </span>
      </div>

      {/* Entries */}
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
              "px-4 py-8 text-center",
              isOver && isDraggingFromOtherGroup
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <p className="text-sm">
              {isOver && isDraggingFromOtherGroup
                ? "Rilascia per spostare qui"
                : "Nessun valore in questa categoria"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
