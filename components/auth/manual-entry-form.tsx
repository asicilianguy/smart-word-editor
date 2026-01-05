"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Tag,
  FolderOpen,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Edit2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { VaultEntry } from "@/lib/auth-types";
import { generateEntryId } from "@/lib/auth-types";

// ============================================================================
// TYPES
// ============================================================================

interface ManualEntryFormProps {
  entries: VaultEntry[];
  onEntriesChange: (entries: VaultEntry[]) => void;
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ManualEntryForm({
  entries,
  onEntriesChange,
  onComplete,
  onBack,
  isLoading = false,
}: ManualEntryFormProps) {
  // Form state per nuova entry
  const [valueData, setValueData] = useState("");
  const [nameLabel, setNameLabel] = useState("");
  const [nameGroup, setNameGroup] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Gruppi esistenti (per suggerimenti)
  const existingGroups = Array.from(
    new Set(entries.map((e) => e.nameGroup).filter(Boolean))
  ) as string[];

  const valueInputRef = useRef<HTMLInputElement>(null);

  // Focus sul campo valore all'avvio
  useEffect(() => {
    valueInputRef.current?.focus();
  }, []);

  const handleAddEntry = () => {
    if (!valueData.trim()) return;

    const newEntry: VaultEntry = {
      id: generateEntryId(),
      valueData: valueData.trim(),
      nameLabel: nameLabel.trim() || undefined,
      nameGroup: nameGroup.trim() || undefined,
      createdAt: new Date(),
      source: "manual",
    };

    onEntriesChange([...entries, newEntry]);
    resetForm();
    valueInputRef.current?.focus();
  };

  const handleUpdateEntry = () => {
    if (!editingId || !valueData.trim()) return;

    onEntriesChange(
      entries.map((entry) =>
        entry.id === editingId
          ? {
              ...entry,
              valueData: valueData.trim(),
              nameLabel: nameLabel.trim() || undefined,
              nameGroup: nameGroup.trim() || undefined,
            }
          : entry
      )
    );
    setEditingId(null);
    resetForm();
  };

  const handleEditEntry = (entry: VaultEntry) => {
    setEditingId(entry.id);
    setValueData(entry.valueData);
    setNameLabel(entry.nameLabel || "");
    setNameGroup(entry.nameGroup || "");
    setShowOptionalFields(true);
    valueInputRef.current?.focus();
  };

  const handleDeleteEntry = (id: string) => {
    onEntriesChange(entries.filter((e) => e.id !== id));
    if (editingId === id) {
      setEditingId(null);
      resetForm();
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setValueData("");
    setNameLabel("");
    setNameGroup("");
    setShowOptionalFields(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && valueData.trim()) {
      e.preventDefault();
      if (editingId) {
        handleUpdateEntry();
      } else {
        handleAddEntry();
      }
    }
    if (e.key === "Escape" && editingId) {
      handleCancelEdit();
    }
  };

  // Raggruppa entries per nameGroup
  const groupedEntries = entries.reduce(
    (acc, entry) => {
      const group = entry.nameGroup || "Senza gruppo";
      if (!acc[group]) acc[group] = [];
      acc[group].push(entry);
      return acc;
    },
    {} as Record<string, VaultEntry[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Inserimento manuale</h3>
        <p className="text-sm text-muted-foreground">
          Aggiungi i valori che vuoi avere sempre a portata di mano. Potrai
          inserirli nei documenti con un click.
        </p>
      </div>

      {/* Entry Form */}
      <div className="p-4 rounded-xl border bg-card space-y-4">
        {/* Value Data (Required) */}
        <div className="space-y-2">
          <Label htmlFor="valueData" className="text-sm font-medium">
            Valore <span className="text-destructive">*</span>
          </Label>
          <Input
            ref={valueInputRef}
            id="valueData"
            value={valueData}
            onChange={(e) => setValueData(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="es. IT60X0542811101000000123456"
            className="h-11"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Il testo che verrà inserito nel documento
          </p>
        </div>

        {/* Toggle Optional Fields */}
        <button
          type="button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              showOptionalFields && "rotate-180"
            )}
          />
          {showOptionalFields ? "Nascondi opzioni" : "Aggiungi etichetta o gruppo"}
        </button>

        {/* Optional Fields */}
        {showOptionalFields && (
          <div className="space-y-4 pt-2 border-t">
            {/* Name Label */}
            <div className="space-y-2">
              <Label
                htmlFor="nameLabel"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Tag className="h-3.5 w-3.5" />
                Etichetta
                <span className="text-xs text-muted-foreground font-normal">
                  (opzionale)
                </span>
              </Label>
              <Input
                id="nameLabel"
                value={nameLabel}
                onChange={(e) => setNameLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="es. IBAN Principale"
                className="h-10"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Un nome descrittivo per riconoscere facilmente questo valore
              </p>
            </div>

            {/* Name Group */}
            <div className="space-y-2">
              <Label
                htmlFor="nameGroup"
                className="text-sm font-medium flex items-center gap-2"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Gruppo
                <span className="text-xs text-muted-foreground font-normal">
                  (opzionale)
                </span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="nameGroup"
                  value={nameGroup}
                  onChange={(e) => setNameGroup(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="es. Dati Bancari"
                  className="h-10 flex-1"
                  disabled={isLoading}
                />
                {existingGroups.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-48 p-1">
                      <div className="text-xs text-muted-foreground px-2 py-1.5 font-medium">
                        Gruppi esistenti
                      </div>
                      {existingGroups.map((group) => (
                        <button
                          key={group}
                          type="button"
                          onClick={() => setNameGroup(group)}
                          className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                        >
                          {group}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Organizza i valori in categorie per trovarli più facilmente
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {editingId ? (
            <>
              <Button
                type="button"
                onClick={handleUpdateEntry}
                disabled={!valueData.trim() || isLoading}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Salva modifiche
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={handleAddEntry}
              disabled={!valueData.trim() || isLoading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi valore
            </Button>
          )}
        </div>
      </div>

      {/* Entries List */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Valori aggiunti ({entries.length})
            </h4>
          </div>

          <ScrollArea className="max-h-64">
            <div className="space-y-4">
              {Object.entries(groupedEntries).map(([group, groupEntries]) => (
                <div key={group} className="space-y-2">
                  {/* Group Header */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FolderOpen className="h-3 w-3" />
                    <span className="font-medium">{group}</span>
                    <span>({groupEntries.length})</span>
                  </div>

                  {/* Group Entries */}
                  <div className="space-y-1.5 pl-5">
                    {groupEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border bg-background group",
                          editingId === entry.id && "ring-2 ring-primary"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono truncate">
                            {entry.valueData}
                          </p>
                          {entry.nameLabel && (
                            <p className="text-xs text-muted-foreground truncate">
                              {entry.nameLabel}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditEntry(entry)}
                            disabled={isLoading}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteEntry(entry.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
        <Button
          type="button"
          onClick={onComplete}
          disabled={isLoading}
          className="flex-1"
        >
          {entries.length === 0 ? (
            "Salta per ora"
          ) : (
            <>
              Completa registrazione
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Hint */}
      <p className="text-xs text-center text-muted-foreground">
        Potrai sempre aggiungere altri valori dalla dashboard
      </p>
    </div>
  );
}
