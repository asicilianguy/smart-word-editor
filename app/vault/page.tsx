"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Plus,
  Search,
  GripVertical,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  FolderOpen,
  AlertTriangle,
  FileText,
  Building2,
  Users,
  MapPin,
  Landmark,
  Briefcase,
  Award,
  MoreHorizontal,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useVaultData } from "@/hooks/use-vault-data";
import type { VaultEntryCreate, VaultEntryUpdate } from "@/lib/vault-api";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface VaultEntry {
  id: string;
  value: string;
  label: string;
  group: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_GROUPS = [
  "Dati Identificativi",
  "Persone",
  "Contatti",
  "Indirizzi",
  "Coordinate Bancarie",
  "Dati Professionali",
  "Certificazioni",
  "Altri dati",
];

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Dati Identificativi": Building2,
  "Persone": Users,
  "Contatti": Users,
  "Indirizzi": MapPin,
  "Coordinate Bancarie": Landmark,
  "Dati Professionali": Briefcase,
  "Certificazioni": Award,
  "Altri dati": FileText,
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function VaultPage() {
  return (
    <ProtectedRoute>
      <VaultManager />
    </ProtectedRoute>
  );
}

function VaultManager() {
  const router = useRouter();
  const {
    categories,
    isAuthenticated,
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
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<VaultEntry | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flatten entries for easier manipulation
  const allEntries: VaultEntry[] = categories.flatMap((cat) =>
    cat.values.map((v) => ({
      id: v.id,
      value: v.value,
      label: v.label,
      group: cat.name,
    }))
  );

  // Get unique groups (including custom ones)
  const existingGroups = [...new Set(allEntries.map((e) => e.group))];
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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeEntry = allEntries.find((e) => e.id === active.id);
      if (!activeEntry) return;

      // Check if dropped on a group header
      const overId = over.id as string;
      if (overId.startsWith("group-")) {
        const newGroup = overId.replace("group-", "");
        if (newGroup !== activeEntry.group) {
          await updateEntry(activeEntry.id, { nameGroup: newGroup });
        }
      }
    },
    [allEntries, updateEntry]
  );

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
      if (success) {
        setAddDialogOpen(false);
      }
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

  const activeEntry = activeId
    ? allEntries.find((e) => e.id === activeId)
    : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Gestione Vault</h1>
                <p className="text-sm text-muted-foreground">
                  {totalEntries} valor{totalEntries === 1 ? "e" : "i"} salvat
                  {totalEntries === 1 ? "o" : "i"}
                </p>
              </div>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Aggiungi</span>
            </Button>
          </div>

          {/* Search */}
          {!isEmpty && (
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca valori, etichette o categorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
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

        {/* Entries list */}
        {!isEmpty && !error && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-6">
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
                    onUpdateGroup={(entryId, newGroup) =>
                      updateEntry(entryId, { nameGroup: newGroup })
                    }
                    availableGroups={availableGroups}
                  />
                ))
              )}
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeEntry ? (
                <div className="bg-card border rounded-lg p-3 shadow-lg opacity-90">
                  <p className="font-medium text-sm">{activeEntry.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activeEntry.value}
                  </p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {/* Add Dialog */}
      <AddEntryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddEntry}
        isSubmitting={isSubmitting}
        availableGroups={availableGroups}
      />

      {/* Edit Dialog */}
      <EditEntryDialog
        entry={editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        onSave={handleUpdateEntry}
        isSubmitting={isSubmitting}
        availableGroups={availableGroups}
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

// ============================================================================
// GROUP SECTION
// ============================================================================

interface GroupSectionProps {
  group: string;
  entries: VaultEntry[];
  onEdit: (entry: VaultEntry) => void;
  onDelete: (entry: VaultEntry) => void;
  onUpdateGroup: (entryId: string, newGroup: string) => void;
  availableGroups: string[];
}

function GroupSection({
  group,
  entries,
  onEdit,
  onDelete,
  onUpdateGroup,
  availableGroups,
}: GroupSectionProps) {
  const Icon = GROUP_ICONS[group] || FileText;
  const { setNodeRef, isOver } = useSortable({
    id: `group-${group}`,
    data: { type: "group", group },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border bg-card"
      )}
    >
      {/* Group header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-medium flex-1">{group}</h2>
        <span className="text-sm text-muted-foreground">
          {entries.length} valor{entries.length === 1 ? "e" : "i"}
        </span>
      </div>

      {/* Entries */}
      <SortableContext
        items={entries.map((e) => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="divide-y">
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onEdit={() => onEdit(entry)}
              onDelete={() => onDelete(entry)}
              onMoveToGroup={(newGroup) => onUpdateGroup(entry.id, newGroup)}
              availableGroups={availableGroups.filter((g) => g !== group)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ============================================================================
// ENTRY ROW
// ============================================================================

interface EntryRowProps {
  entry: VaultEntry;
  onEdit: () => void;
  onDelete: () => void;
  onMoveToGroup: (group: string) => void;
  availableGroups: string[];
}

function EntryRow({
  entry,
  onEdit,
  onDelete,
  onMoveToGroup,
  availableGroups,
}: EntryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-4 py-3 group",
        isDragging && "opacity-50 bg-muted"
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
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
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
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
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

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <FolderOpen className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Il tuo vault è vuoto</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Inizia ad aggiungere i tuoi dati personali e aziendali. Potrai usarli
        per compilare rapidamente i tuoi documenti.
      </p>
      <Button onClick={onAddClick} size="lg" className="gap-2">
        <Plus className="h-5 w-5" />
        Aggiungi il primo valore
      </Button>
    </div>
  );
}

// ============================================================================
// ADD ENTRY DIALOG
// ============================================================================

interface AddEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
    valueData: string;
    nameLabel?: string;
    nameGroup?: string;
  }) => Promise<boolean>;
  isSubmitting: boolean;
  availableGroups: string[];
}

function AddEntryDialog({
  open,
  onOpenChange,
  onAdd,
  isSubmitting,
  availableGroups,
}: AddEntryDialogProps) {
  const [formData, setFormData] = useState({
    valueData: "",
    nameLabel: "",
    nameGroup: "",
    customGroup: "",
  });
  const [useCustomGroup, setUseCustomGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({ valueData: "", nameLabel: "", nameGroup: "", customGroup: "" });
    setUseCustomGroup(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.valueData.trim()) {
      setError("Il valore è obbligatorio");
      return;
    }

    const group = useCustomGroup
      ? formData.customGroup.trim() || undefined
      : formData.nameGroup || undefined;

    const success = await onAdd({
      valueData: formData.valueData.trim(),
      nameLabel: formData.nameLabel.trim() || undefined,
      nameGroup: group,
    });

    if (success) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Aggiungi nuovo valore</DialogTitle>
          <DialogDescription>
            Inserisci un dato da salvare nel vault.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-value">
                Valore <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-value"
                placeholder="es. IT01234567890"
                value={formData.valueData}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, valueData: e.target.value }))
                }
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-label">Etichetta</Label>
              <Input
                id="add-label"
                placeholder="es. Partita IVA"
                value={formData.nameLabel}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, nameLabel: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              {!useCustomGroup ? (
                <>
                  <Select
                    value={formData.nameGroup}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, nameGroup: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGroups.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => setUseCustomGroup(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Crea nuova categoria
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    placeholder="Nome nuova categoria"
                    value={formData.customGroup}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, customGroup: e.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setUseCustomGroup(false)}
                  >
                    ← Usa categoria esistente
                  </Button>
                </>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aggiungi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// EDIT ENTRY DIALOG
// ============================================================================

interface EditEntryDialogProps {
  entry: VaultEntry | null;
  onOpenChange: (open: boolean) => void;
  onSave: (
    id: string,
    data: { valueData?: string; nameLabel?: string; nameGroup?: string }
  ) => Promise<boolean>;
  isSubmitting: boolean;
  availableGroups: string[];
}

function EditEntryDialog({
  entry,
  onOpenChange,
  onSave,
  isSubmitting,
  availableGroups,
}: EditEntryDialogProps) {
  const [formData, setFormData] = useState({
    valueData: "",
    nameLabel: "",
    nameGroup: "",
  });

  // Sync form data when entry changes
  useState(() => {
    if (entry) {
      setFormData({
        valueData: entry.value,
        nameLabel: entry.label !== entry.value ? entry.label : "",
        nameGroup: entry.group,
      });
    }
  });

  // Update form when entry changes
  if (entry && formData.valueData !== entry.value && formData.nameGroup !== entry.group) {
    setFormData({
      valueData: entry.value,
      nameLabel: entry.label !== entry.value ? entry.label : "",
      nameGroup: entry.group,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    await onSave(entry.id, {
      valueData: formData.valueData.trim(),
      nameLabel: formData.nameLabel.trim() || undefined,
      nameGroup: formData.nameGroup,
    });
  };

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Modifica valore</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-value">Valore</Label>
              <Input
                id="edit-value"
                value={formData.valueData}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, valueData: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-label">Etichetta</Label>
              <Input
                id="edit-label"
                placeholder="Lascia vuoto per usare il valore"
                value={formData.nameLabel}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, nameLabel: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.nameGroup}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, nameGroup: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableGroups.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
