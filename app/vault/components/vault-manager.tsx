"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useVaultData } from "@/hooks/use-vault-data";
import { DEFAULT_GROUPS } from "../constants";
import type { VaultEntry } from "../types";

// Components
import { VaultHeader } from "./vault-header";
import { GroupSection } from "./group-section";
import { EmptyState } from "./empty-state";
import { AddEntryDialog } from "./add-entry-dialog";
import { EditEntryDialog } from "./edit-entry-dialog";
import { CreateGroupDialog } from "./create-group-dialog";
import { EntryDragOverlay } from "./entry-row";

export function VaultManager() {
  const router = useRouter();
  const {
    categories,
    isEmpty,
    isLoading,
    error,
    totalEntries,
    refresh,
    addEntry,
    updateEntry,
    deleteEntry,
  } = useVaultData();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<VaultEntry | null>(null);
  const [activeEntry, setActiveEntry] = useState<VaultEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customGroups, setCustomGroups] = useState<string[]>([]);

  // Flatten entries
  const allEntries: VaultEntry[] = categories.flatMap((cat) =>
    cat.values.map((v) => ({
      id: v.id,
      value: v.value,
      label: v.label,
      group: cat.name,
    }))
  );

  // Gruppi esistenti (da entries + custom groups)
  const existingGroups = [
    ...new Set([...allEntries.map((e) => e.group), ...customGroups]),
  ];

  // Tutti i gruppi disponibili
  const availableGroups = [...new Set([...DEFAULT_GROUPS, ...existingGroups])];

  // Gruppi da mostrare (quelli con entries + custom groups vuoti)
  const groupsToShow = [...new Set([...existingGroups, ...customGroups])];

  // Filter entries
  const filteredEntries = allEntries.filter(
    (entry) =>
      entry.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered entries
  const groupedEntries = filteredEntries.reduce<Record<string, VaultEntry[]>>(
    (acc, entry) => {
      if (!acc[entry.group]) {
        acc[entry.group] = [];
      }
      acc[entry.group].push(entry);
      return acc;
    },
    {}
  );

  // Aggiungi gruppi vuoti (custom groups senza entries)
  for (const group of customGroups) {
    if (!groupedEntries[group]) {
      groupedEntries[group] = [];
    }
  }

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "entry") {
      setActiveEntry(data.entry as VaultEntry);
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveEntry(null);

      if (!over) return;

      const activeData = active.data.current;
      if (activeData?.type !== "entry") return;

      const draggedEntry = activeData.entry as VaultEntry;
      const overId = over.id as string;

      // Check se droppato su un gruppo
      if (overId.startsWith("group-")) {
        const newGroup = overId.replace("group-", "");

        // Solo se è un gruppo diverso
        if (newGroup !== draggedEntry.group) {
          console.log(
            `[DnD] Moving ${draggedEntry.id} from "${draggedEntry.group}" to "${newGroup}"`
          );

          setIsSubmitting(true);
          try {
            const success = await updateEntry(draggedEntry.id, {
              nameGroup: newGroup,
            });
            if (success) {
              console.log(`[DnD] Successfully moved to ${newGroup}`);
            } else {
              console.error(`[DnD] Failed to move entry`);
            }
          } catch (err) {
            console.error(`[DnD] Error moving entry:`, err);
          } finally {
            setIsSubmitting(false);
          }
        }
      }
    },
    [updateEntry]
  );

  const handleDragCancel = useCallback(() => {
    setActiveEntry(null);
  }, []);

  // Entry handlers
  const handleAddEntry = async (data: {
    valueData: string;
    nameLabel?: string;
    nameGroup?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const success = await addEntry({
        valueData: data.valueData,
        nameLabel: data.nameLabel,
        nameGroup: data.nameGroup || "Altri dati",
        source: "manual",
      });
      return success;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEntry = async (
    id: string,
    data: { valueData?: string; nameLabel?: string; nameGroup?: string }
  ) => {
    setIsSubmitting(true);
    try {
      const success = await updateEntry(id, data);
      if (success) {
        setEditingEntry(null);
      }
      return success;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deletingEntry) return;
    setIsSubmitting(true);
    try {
      await deleteEntry(deletingEntry.id);
      setDeletingEntry(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveToGroup = async (entryId: string, newGroup: string) => {
    setIsSubmitting(true);
    try {
      await updateEntry(entryId, { nameGroup: newGroup });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGroup = (groupName: string) => {
    setCustomGroups((prev) => [...prev, groupName]);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <VaultHeader
        totalEntries={totalEntries}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddClick={() => setAddDialogOpen(true)}
        onCreateGroupClick={() => setCreateGroupDialogOpen(true)}
        onBackClick={() => router.push("/editor")}
        showSearch={!isEmpty}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>
              Riprova
            </Button>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && !error && (
          <EmptyState onAddClick={() => setAddDialogOpen(true)} />
        )}

        {/* Entries list with DnD */}
        {!isEmpty && !error && (
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="space-y-4">
              {Object.entries(groupedEntries).length === 0 && searchQuery ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nessun risultato per &quot;{searchQuery}&quot;
                  </p>
                </div>
              ) : (
                Object.entries(groupedEntries).map(([group, entries]) => (
                  <GroupSection
                    key={group}
                    group={group}
                    entries={entries}
                    onEdit={setEditingEntry}
                    onDelete={setDeletingEntry}
                    onMoveToGroup={handleMoveToGroup}
                    availableGroups={availableGroups}
                  />
                ))
              )}
            </div>

            {/* Drag overlay */}
            <DragOverlay dropAnimation={null}>
              {activeEntry ? <EntryDragOverlay entry={activeEntry} /> : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Info sul drag & drop */}
        {!isEmpty && !error && (
          <p className="text-xs text-center text-muted-foreground mt-6">
            Trascina i valori per spostarli tra le categorie
          </p>
        )}
      </main>

      {/* Dialogs */}
      <AddEntryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddEntry}
        isSubmitting={isSubmitting}
        availableGroups={availableGroups}
      />

      <EditEntryDialog
        entry={editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        onSave={handleUpdateEntry}
        isSubmitting={isSubmitting}
        availableGroups={availableGroups}
      />

      <CreateGroupDialog
        open={createGroupDialogOpen}
        onOpenChange={setCreateGroupDialogOpen}
        onCreateGroup={handleCreateGroup}
        existingGroups={availableGroups}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingEntry}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina valore</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare &quot;{deletingEntry?.label}&quot;?
              <br />
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntry}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Elimina"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
