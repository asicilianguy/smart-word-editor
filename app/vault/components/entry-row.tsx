"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Trash2,
  MoreHorizontal,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { VaultEntry } from "../types";

interface EntryRowProps {
  entry: VaultEntry;
  onEdit: () => void;
  onDelete: () => void;
  onMoveToGroup: (group: string) => void;
  availableGroups: string[];
}

export function EntryRow({
  entry,
  onEdit,
  onDelete,
  onMoveToGroup,
  availableGroups,
}: EntryRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: entry.id,
      data: {
        type: "entry",
        entry,
      },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-4 py-3 group bg-card",
        isDragging && "opacity-50 shadow-md rounded-md border border-primary/50"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{entry.label}</p>
        <p className="text-xs text-muted-foreground truncate">{entry.value}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifica
            </DropdownMenuItem>
            {availableGroups.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled
                  className="text-xs text-muted-foreground"
                >
                  Sposta in...
                </DropdownMenuItem>
                {availableGroups.slice(0, 5).map((group) => (
                  <DropdownMenuItem
                    key={group}
                    onClick={() => onMoveToGroup(group)}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    {group}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Componente per il drag overlay
export function EntryDragOverlay({ entry }: { entry: VaultEntry }) {
  return (
    <div className="bg-card border-2 border-primary rounded-md p-3 shadow-lg">
      <p className="font-medium text-sm">{entry.label}</p>
      <p className="text-xs text-muted-foreground truncate">{entry.value}</p>
    </div>
  );
}
