"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Pencil,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  FolderPlus,
  Folder,
  Database,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ExtractedEntry } from "./types";

interface ExtractedEntriesReviewProps {
  entries: ExtractedEntry[];
  existingVaultValues: string[];
  onEntriesChange: (entries: ExtractedEntry[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ExtractedEntriesReview({
  entries,
  existingVaultValues,
  onEntriesChange,
  onConfirm,
  onCancel,
  isSubmitting,
}: ExtractedEntriesReviewProps) {
  const t = useTranslations("myData.extractedEntriesReview");

  // I gruppi arrivano già tradotti dal backend nella lingua corretta
  // Estraiamo i gruppi unici dalle entries
  const defaultGroups = useMemo(() => {
    const groupsFromEntries = entries.map((e) => e.nameGroup).filter(Boolean);
    return [...new Set(groupsFromEntries)];
  }, [entries]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const groups = new Set<string>();
    entries.forEach((e) => {
      if (e.nameGroup) groups.add(e.nameGroup);
    });
    return groups;
  });

  const [customGroups, setCustomGroups] = useState<string[]>([]);

  const allGroups = useMemo(() => {
    return [
      ...new Set([
        ...defaultGroups,
        ...customGroups,
        ...entries.map((e) => e.nameGroup).filter(Boolean),
      ]),
    ];
  }, [defaultGroups, customGroups, entries]);

  const addCustomGroup = (groupName: string): boolean => {
    const trimmed = groupName.trim();
    if (!trimmed) return false;

    const exists = allGroups.some(
      (g) => g.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) return false;

    setCustomGroups((prev) => [...prev, trimmed]);
    return true;
  };

  function groupEntries(items: ExtractedEntry[]) {
    return items.reduce((acc, entry) => {
      const group = entry.nameGroup || "";
      if (!acc[group]) acc[group] = [];
      acc[group].push(entry);
      return acc;
    }, {} as Record<string, ExtractedEntry[]>);
  }

  const grouped = groupEntries(entries);
  const selectedCount = entries.filter((e) => e.selected).length;

  const { uniqueCount, duplicateCount, alreadyInVaultCount } = useMemo(() => {
    const selected = entries.filter((e) => e.selected);
    const seen = new Set<string>();
    const existingSet = new Set(existingVaultValues);

    let unique = 0;
    let duplicatesInternal = 0;
    let alreadyInVault = 0;

    for (const entry of selected) {
      const key = (entry.valueData || "").trim().toLowerCase();

      if (existingSet.has(key)) {
        alreadyInVault++;
        continue;
      }

      if (seen.has(key)) {
        duplicatesInternal++;
      } else {
        seen.add(key);
        unique++;
      }
    }

    return {
      uniqueCount: unique,
      duplicateCount: duplicatesInternal + alreadyInVault,
      alreadyInVaultCount: alreadyInVault,
    };
  }, [entries, existingVaultValues]);

  const toggleSelect = (id: string) => {
    onEntriesChange(
      entries.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e))
    );
  };

  const toggleGroupSelect = (groupName: string, selected: boolean) => {
    onEntriesChange(
      entries.map((e) => (e.nameGroup === groupName ? { ...e, selected } : e))
    );
  };

  const toggleEdit = (id: string) => {
    onEntriesChange(
      entries.map((e) => (e.id === id ? { ...e, isEditing: !e.isEditing } : e))
    );
  };

  const updateEntry = (
    id: string,
    field: keyof ExtractedEntry,
    value: string
  ) => {
    onEntriesChange(
      entries.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const toggleAll = (selected: boolean) => {
    onEntriesChange(entries.map((e) => ({ ...e, selected })));
  };

  const toggleGroupExpand = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const deleteEntry = (id: string) => {
    onEntriesChange(entries.filter((e) => e.id !== id));
  };

  const getDuplicateWarning = () => {
    const parts: string[] = [];

    if (alreadyInVaultCount > 0) {
      parts.push(
        t("duplicates.alreadyInVault", { count: alreadyInVaultCount })
      );
    }

    const internalDuplicates = duplicateCount - alreadyInVaultCount;
    if (internalDuplicates > 0) {
      parts.push(t("duplicates.internal", { count: internalDuplicates }));
    }

    return parts.join(", ") + " — " + t("duplicates.willBeIgnored");
  };

  return (
    <div className="space-y-4">
      {/* Header con spiegazione */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">{t("title")}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAll(true)}
              className="text-xs h-7"
            >
              {t("selectAll")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAll(false)}
              className="text-xs h-7"
            >
              {t("deselectAll")}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {t.rich("description", {
            strong: (chunks) => <strong>{chunks}</strong>,
            icon: () => <Pencil className="inline h-3 w-3" />,
          })}
        </p>
      </div>

      {/* Grouped entries */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {Object.entries(grouped).map(([groupName, groupEntries]) => {
          const isExpanded = expandedGroups.has(groupName);
          const selectedInGroup = groupEntries.filter((e) => e.selected).length;
          const allSelected =
            selectedInGroup === groupEntries.length && groupEntries.length > 0;

          return (
            <div key={groupName} className="rounded-xl border overflow-hidden">
              {/* Group header */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/40 border-b">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) =>
                    toggleGroupSelect(groupName, !!checked)
                  }
                />

                <div
                  className="flex-1 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleGroupExpand(groupName)}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        {t("categoryLabel")}
                      </span>
                      <span className="font-medium text-sm">{groupName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t("groupCount", {
                        selected: selectedInGroup,
                        total: groupEntries.length,
                      })}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Group entries */}
              {isExpanded && (
                <div className="divide-y divide-border">
                  {groupEntries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      allGroups={allGroups}
                      onToggleSelect={() => toggleSelect(entry.id)}
                      onToggleEdit={() => toggleEdit(entry.id)}
                      onUpdate={(field, value) =>
                        updateEntry(entry.id, field, value)
                      }
                      onDelete={() => deleteEntry(entry.id)}
                      onAddCustomGroup={addCustomGroup}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <Folder className="h-3.5 w-3.5" />
          <span>{t("legend.category")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5" />
          <span>{t("legend.data")}</span>
        </div>
      </div>

      {/* Warning duplicati */}
      {duplicateCount > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-amber-700">{getDuplicateWarning()}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{uniqueCount}</span>{" "}
          {t("uniqueData", { count: uniqueCount })}
          {duplicateCount > 0 && (
            <span className="text-amber-600">
              {" "}
              ({t("ignored", { count: duplicateCount })})
            </span>
          )}
        </p>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={uniqueCount === 0 || isSubmitting}
            className="bg-(--brand-primary) hover:bg-(--brand-primary-hover)"
          >
            {isSubmitting ? (
              t("saving")
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t("save", { count: uniqueCount })}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ENTRY ROW COMPONENT
// ============================================================================

function EntryRow({
  entry,
  allGroups,
  onToggleSelect,
  onToggleEdit,
  onUpdate,
  onDelete,
  onAddCustomGroup,
}: {
  entry: ExtractedEntry;
  allGroups: string[];
  onToggleSelect: () => void;
  onToggleEdit: () => void;
  onUpdate: (field: keyof ExtractedEntry, value: string) => void;
  onDelete: () => void;
  onAddCustomGroup: (groupName: string) => boolean;
}) {
  const t = useTranslations("myData.extractedEntriesReview.entryRow");

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupError, setGroupError] = useState<string | null>(null);

  const handleCreateGroup = () => {
    const trimmed = newGroupName.trim();

    if (!trimmed) {
      setGroupError(t("errors.nameRequired"));
      return;
    }

    const exists = allGroups.some(
      (g) => g.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setGroupError(t("errors.alreadyExists"));
      return;
    }

    onAddCustomGroup(trimmed);
    onUpdate("nameGroup", trimmed);

    setNewGroupName("");
    setIsCreatingGroup(false);
    setGroupError(null);
  };

  const handleCancelCreateGroup = () => {
    setNewGroupName("");
    setIsCreatingGroup(false);
    setGroupError(null);
  };

  // ===== EDIT MODE =====
  if (entry.isEditing) {
    return (
      <div className="p-4 space-y-4 bg-muted/10 border-l-4 border-l-(--brand-primary)">
        {/* Header edit */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("editHeader")}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <X className="h-3 w-3 mr-1" />
              {t("delete")}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs bg-(--brand-primary) hover:bg-(--brand-primary-hover)"
              onClick={onToggleEdit}
            >
              <Check className="h-3 w-3 mr-1" />
              {t("done")}
            </Button>
          </div>
        </div>

        {/* VALORE */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4 text-(--brand-primary)" />
            {t("valueLabel")}
          </Label>
          <Input
            value={entry.valueData}
            onChange={(e) => onUpdate("valueData", e.target.value)}
            className="text-base font-semibold h-12 bg-background border-2 border-(--brand-primary)/30 focus:border-(--brand-primary)"
            placeholder={t("valuePlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("valueHint")}</p>
        </div>

        {/* ETICHETTA */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">
            {t("labelLabel")}{" "}
            <span className="font-normal">({t("optional")})</span>
          </Label>
          <Input
            value={entry.nameLabel}
            onChange={(e) => onUpdate("nameLabel", e.target.value)}
            className="h-9 text-sm"
            placeholder={t("labelPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("labelHint")}</p>
        </div>

        {/* CATEGORIA */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-2">
            <Folder className="h-3.5 w-3.5" />
            {t("categoryLabel")}{" "}
            <span className="font-normal">({t("forOrganization")})</span>
          </Label>

          {!isCreatingGroup ? (
            <>
              <Select
                value={entry.nameGroup}
                onValueChange={(v) => onUpdate("nameGroup", v)}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder={t("selectCategory")}>
                    {entry.nameGroup || t("selectCategory")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {allGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs border-dashed"
                onClick={() => setIsCreatingGroup(true)}
              >
                <FolderPlus className="h-3.5 w-3.5 mr-2" />
                {t("createNewCategory")}
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <Input
                value={newGroupName}
                onChange={(e) => {
                  setNewGroupName(e.target.value);
                  setGroupError(null);
                }}
                className="h-9 text-sm"
                placeholder={t("newCategoryPlaceholder")}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateGroup();
                  }
                  if (e.key === "Escape") {
                    handleCancelCreateGroup();
                  }
                }}
              />

              {groupError && (
                <p className="text-xs text-destructive">{groupError}</p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="flex-1 h-8 text-xs bg-(--brand-primary) hover:bg-(--brand-primary-hover)"
                  onClick={handleCreateGroup}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {t("createCategory")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleCancelCreateGroup}
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== VIEW MODE =====
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 group transition-colors",
        entry.selected ? "bg-(--brand-primary)/5" : "hover:bg-muted/30"
      )}
    >
      <div className="pt-0.5">
        <Checkbox checked={entry.selected} onCheckedChange={onToggleSelect} />
      </div>

      <div className="pt-0.5">
        <Database
          className={cn(
            "h-4 w-4",
            entry.selected ? "text-(--brand-primary)" : "text-muted-foreground"
          )}
        />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <p
          className={cn(
            "text-sm font-semibold wrap-break-word",
            entry.selected ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {entry.valueData}
        </p>

        {entry.nameLabel && (
          <p className="text-xs text-muted-foreground italic">
            {entry.nameLabel}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
        onClick={onToggleEdit}
        title={t("edit")}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}
