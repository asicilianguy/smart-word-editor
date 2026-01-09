"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import {
  GripVertical,
  Pencil,
  Trash2,
  MoreHorizontal,
  FolderInput,
  Copy,
  Check,
  Database,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  const t = useTranslations("myData.entryRow");
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(entry.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-3 px-4 py-3 group bg-card transition-all",
        isDragging &&
          "opacity-50 shadow-lg rounded-lg border-2 border-(--brand-primary)/50"
      )}
    >
      {/* Drag handle */}
      <div className="pt-0.5">
        <button
          {...attributes}
          {...listeners}
          className="touch-none text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Icona dato */}
      <div className="pt-0.5">
        <Database className="h-4 w-4 text-(--brand-primary)" />
      </div>

      {/* Content - VALORE in evidenza */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* VALORE - il dato principale, in grassetto */}
        <p className="font-semibold text-sm break-words">{entry.value}</p>

        {/* ETICHETTA - secondaria, più piccola */}
        {entry.label && (
          <p className="text-xs text-muted-foreground italic">{entry.label}</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          title={t("copyValue")}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
          title={t("edit")}
        >
          <Pencil className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              {t("copyValue")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              {t("edit")}
            </DropdownMenuItem>

            {availableGroups.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput className="h-4 w-4 mr-2" />
                    {t("moveTo")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {availableGroups.map((group) => (
                      <DropdownMenuItem
                        key={group}
                        onClick={() => onMoveToGroup(group)}
                      >
                        {group}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Componente per il drag overlay - anche qui valore in evidenza
export function EntryDragOverlay({ entry }: { entry: VaultEntry }) {
  return (
    <div className="bg-card border-2 border-(--brand-primary) rounded-lg p-3 shadow-xl flex items-start gap-3">
      <Database className="h-4 w-4 text-(--brand-primary) shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-semibold text-sm">{entry.value}</p>
        {entry.label && (
          <p className="text-xs text-muted-foreground italic truncate">
            {entry.label}
          </p>
        )}
      </div>
    </div>
  );
}
