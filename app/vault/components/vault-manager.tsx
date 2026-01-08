"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Loader2, AlertTriangle, Folder, Database } from "lucide-react";
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
import { useAuth } from "@/lib/auth-context";
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
import { DocumentImportSection } from "./document-import";

export function VaultManager() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
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

  // Token state
  const [userTokens, setUserTokens] = useState(user?.tokens ?? 0);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  // Sync tokens from user
  useEffect(() => {
    if (user?.tokens !== undefined) {
      setUserTokens(user.tokens);
    }
  }, [user?.tokens]);

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

      if (overId.startsWith("group-")) {
        const newGroup = overId.replace("group-", "");

        if (newGroup !== draggedEntry.group) {
          setIsSubmitting(true);
          try {
            await updateEntry(draggedEntry.id, { nameGroup: newGroup });
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

  // Document extraction handlers
  const handleExtractionComplete = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleTokensUpdated = useCallback(
    (newBalance: number) => {
      setUserTokens(newBalance);
      refreshAuth();
    },
    [refreshAuth]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)] mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <VaultHeader
        totalEntries={totalEntries}
        userTokens={userTokens}
        isLoadingTokens={isLoadingTokens}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddClick={() => setAddDialogOpen(true)}
        onCreateGroupClick={() => setCreateGroupDialogOpen(true)}
        onBackClick={() => router.push("/editor")}
        showSearch={!isEmpty}
      />

      {/* Main Content - Full width, scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
          {/* Error state */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-destructive">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="shrink-0"
              >
                Riprova
              </Button>
            </div>
          )}

          {/* Document Import Section */}
          <DocumentImportSection
            userTokens={userTokens}
            onExtractionComplete={handleExtractionComplete}
            onTokensUpdated={handleTokensUpdated}
          />

          {/* Empty state */}
          {isEmpty && !error && (
            <EmptyState onAddClick={() => setAddDialogOpen(true)} />
          )}

          {/* Entries list with DnD - LISTA VERTICALE */}
          {!isEmpty && !error && (
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              {/* Lista verticale - NO GRID */}
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

          {/* Legenda e info drag & drop */}
          {!isEmpty && !error && (
            <div className="space-y-3 pb-4">
              {/* Legenda icone */}
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5" />
                  <span>= Categoria (per organizzare)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  <span>= Dato (verrà inserito nei documenti)</span>
                </div>
              </div>

              {/* Info drag & drop */}
              <p className="text-xs text-center text-muted-foreground">
                Trascina i dati per spostarli tra le categorie
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <AddEntryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddEntry}
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
            <AlertDialogTitle>Elimina dato</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo dato?
              <br />
              <span className="font-medium text-foreground">
                {deletingEntry?.value}
              </span>
              {deletingEntry?.label && (
                <span className="text-muted-foreground">
                  {" "}
                  ({deletingEntry.label})
                </span>
              )}
              <br />
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
