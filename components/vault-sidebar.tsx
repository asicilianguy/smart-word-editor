"use client";

import type React from "react";
import { useState } from "react";
import {
  Search,
  Building2,
  Users,
  MapPin,
  Scale,
  Award,
  Landmark,
  Briefcase,
  FileText,
  MousePointer2,
  Type,
  Sparkles,
  Plus,
  AlertTriangle,
  Loader2,
  LogIn,
  FolderOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VaultCategory, VaultValue } from "@/lib/document-types";
import type { VaultEntryCreate } from "@/lib/vault-api";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface VaultSidebarProps {
  categories: VaultCategory[];
  onValueClick?: (value: VaultValue) => void;
  /** C'è testo selezionato nell'editor */
  hasSelection?: boolean;
  /** L'editor ha il focus (cursore attivo) */
  hasCursor?: boolean;
  /** Testo attualmente selezionato (opzionale, per mostrarlo) */
  selectedText?: string;
  /** True se l'utente è autenticato */
  isAuthenticated?: boolean;
  /** True se il vault è vuoto (autenticato ma senza dati) */
  isEmpty?: boolean;
  /** True durante il caricamento */
  isLoading?: boolean;
  /** Errore se presente */
  error?: string | null;
  /** Callback per aggiungere una nuova entry */
  onAddEntry?: (entry: VaultEntryCreate) => Promise<boolean>;
  /** Callback per ricaricare i dati */
  onRefresh?: () => Promise<void>;
  /** Callback per navigare al login */
  onLoginClick?: () => void;
}

// ============================================================================
// ICONS MAPPING
// ============================================================================

const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  company: Building2,
  "dati-identificativi": Building2,
  contacts: Users,
  contatti: Users,
  persone: Users,
  addresses: MapPin,
  indirizzi: MapPin,
  legal: Scale,
  "dati-legali": Scale,
  certifications: Award,
  certificazioni: Award,
  banking: Landmark,
  "coordinate-bancarie": Landmark,
  "dati-professionali": Briefcase,
  "altri-dati": FileText,
};

// ============================================================================
// GROUP OPTIONS FOR ADD DIALOG
// ============================================================================

const GROUP_OPTIONS = [
  { value: "Dati Identificativi", label: "Dati Identificativi" },
  { value: "Persone", label: "Persone" },
  { value: "Contatti", label: "Contatti" },
  { value: "Indirizzi", label: "Indirizzi" },
  { value: "Coordinate Bancarie", label: "Coordinate Bancarie" },
  { value: "Dati Professionali", label: "Dati Professionali" },
  { value: "Certificazioni", label: "Certificazioni" },
  { value: "Altri dati", label: "Altri dati" },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VaultSidebar({
  categories,
  onValueClick,
  hasSelection = false,
  hasCursor = false,
  selectedText,
  isAuthenticated = false,
  isEmpty = false,
  isLoading = false,
  error,
  onAddEntry,
  onRefresh,
  onLoginClick,
}: VaultSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Determina lo stato e l'azione
  const canInteract = isAuthenticated && (hasSelection || hasCursor);
  const actionType: "replace" | "insert" | "none" = hasSelection
    ? "replace"
    : hasCursor
    ? "insert"
    : "none";

  // Filtra le categorie
  const filteredCategories = categories
    .map((category) => ({
      ...category,
      values: category.values.filter(
        (value) =>
          value.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          value.value.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.values.length > 0);

  /**
   * Previene che i click sulla sidebar facciano perdere il focus all'editor
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT") {
      return;
    }
    e.preventDefault();
  };

  const handleAddEntry = async (entry: VaultEntryCreate) => {
    if (onAddEntry) {
      const success = await onAddEntry(entry);
      if (success) {
        setAddDialogOpen(false);
      }
      return success;
    }
    return false;
  };

  return (
    <>
      <div
        className={cn(
          "h-full flex flex-col border-l transition-all duration-300 overflow-hidden",
          hasSelection && isAuthenticated
            ? "bg-green-50/50 dark:bg-green-950/20 border-green-300 dark:border-green-800 shadow-[-4px_0_20px_rgba(34,197,94,0.15)]"
            : hasCursor && isAuthenticated
            ? "bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900"
            : "bg-muted/30 border-border"
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Header - Fixed */}
        <div
          className={cn(
            "flex-shrink-0 p-4 border-b transition-colors duration-300",
            hasSelection && isAuthenticated
              ? "bg-green-100/80 dark:bg-green-900/30 border-green-200 dark:border-green-800"
              : hasCursor && isAuthenticated
              ? "bg-blue-100/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              : "bg-card border-border"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Vault</h2>
              {hasSelection && isAuthenticated && (
                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 animate-pulse" />
              )}
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {isAuthenticated && onAddEntry && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Aggiungi</span>
              </Button>
            )}
          </div>

          {/* Status Badge - solo se autenticato */}
          {isAuthenticated && (
            <StatusBadge actionType={actionType} selectedText={selectedText} />
          )}

          {/* Search - solo se autenticato e ha dati */}
          {isAuthenticated && !isEmpty && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca valori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-9 transition-colors",
                  hasSelection &&
                    "border-green-300 dark:border-green-700 focus:ring-green-500"
                )}
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Non autenticato */}
          {!isAuthenticated && (
            <NotAuthenticatedState onLoginClick={onLoginClick} />
          )}

          {/* Autenticato ma errore */}
          {isAuthenticated && error && (
            <ErrorState error={error} onRefresh={onRefresh} />
          )}

          {/* Autenticato ma vault vuoto */}
          {isAuthenticated && !error && isEmpty && (
            <EmptyVaultState onAddClick={() => setAddDialogOpen(true)} />
          )}

          {/* Autenticato con dati */}
          {isAuthenticated && !error && !isEmpty && (
            <div className="p-4">
              <Accordion
                type="multiple"
                defaultValue={categories.map((c) => c.id)}
                className="space-y-2"
              >
                {filteredCategories.map((category) => {
                  const Icon =
                    categoryIcons[category.id] ||
                    categoryIcons[category.id.toLowerCase()] ||
                    FileText;
                  return (
                    <AccordionItem
                      key={category.id}
                      value={category.id}
                      className={cn(
                        "border rounded-lg transition-all duration-200",
                        hasSelection
                          ? "bg-white dark:bg-card border-green-200 dark:border-green-800 shadow-sm"
                          : "bg-card"
                      )}
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              hasSelection
                                ? "text-green-600 dark:text-green-400"
                                : "text-muted-foreground"
                            )}
                          />
                          <span className="font-medium">{category.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto mr-2">
                            ({category.values.length})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3">
                        <div className="space-y-1">
                          {category.values.map((value) => (
                            <VaultValueButton
                              key={value.id}
                              value={value}
                              onClick={() => onValueClick?.(value)}
                              canInteract={canInteract}
                              actionType={actionType}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              {filteredCategories.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">
                    Nessun risultato per &quot;{searchQuery}&quot;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        {isAuthenticated && !isEmpty && (
          <div
            className={cn(
              "flex-shrink-0 p-4 border-t transition-colors",
              hasSelection
                ? "bg-green-100/50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-card border-border"
            )}
          >
            <p className="text-xs text-muted-foreground text-center">
              {categories.reduce((acc, cat) => acc + cat.values.length, 0)}{" "}
              valori in {categories.length} categorie
            </p>
          </div>
        )}
      </div>

      {/* Add Entry Dialog */}
      <AddEntryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddEntry}
      />
    </>
  );
}

// ============================================================================
// NOT AUTHENTICATED STATE
// ============================================================================

function NotAuthenticatedState({
  onLoginClick,
}: {
  onLoginClick?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <LogIn className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">Accesso richiesto</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Effettua l&apos;accesso per visualizzare e gestire i tuoi dati salvati
        nel vault.
      </p>
      {onLoginClick && (
        <Button onClick={onLoginClick} className="gap-2">
          <LogIn className="h-4 w-4" />
          Accedi
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({
  error,
  onRefresh,
}: {
  error: string;
  onRefresh?: () => Promise<void>;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="font-semibold mb-2">Errore di caricamento</h3>
      <p className="text-sm text-muted-foreground mb-4">{error}</p>
      {onRefresh && (
        <Button variant="outline" onClick={onRefresh} className="gap-2">
          Riprova
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// EMPTY VAULT STATE
// ============================================================================

function EmptyVaultState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <FolderOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">Vault vuoto</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Non hai ancora salvato nessun dato. Aggiungi il tuo primo valore per
        iniziare.
      </p>
      <Button onClick={onAddClick} className="gap-2">
        <Plus className="h-4 w-4" />
        Aggiungi primo valore
      </Button>
    </div>
  );
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({
  actionType,
  selectedText,
}: {
  actionType: "replace" | "insert" | "none";
  selectedText?: string;
}) {
  if (actionType === "replace") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-3 py-2 rounded-md border border-green-300 dark:border-green-700 animate-in fade-in slide-in-from-top-1 duration-200">
          <Type className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">
            Seleziona un valore per <strong>sostituire</strong>
          </span>
        </div>
        {selectedText && (
          <div className="text-xs bg-white dark:bg-card px-3 py-2 rounded border border-green-200 dark:border-green-800">
            <span className="text-muted-foreground">Testo selezionato: </span>
            <span className="font-medium text-green-700 dark:text-green-400 line-clamp-1">
              &quot;{selectedText}&quot;
            </span>
          </div>
        )}
      </div>
    );
  }

  if (actionType === "insert") {
    return (
      <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-md border border-blue-200 dark:border-blue-700">
        <MousePointer2 className="h-4 w-4 flex-shrink-0" />
        <span>
          Cursore attivo — clicca per <strong>inserire</strong>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
      <MousePointer2 className="h-4 w-4 flex-shrink-0" />
      <span>Seleziona testo nel documento per sostituirlo</span>
    </div>
  );
}

// ============================================================================
// VAULT VALUE BUTTON
// ============================================================================

interface VaultValueButtonProps {
  value: VaultValue;
  onClick: () => void;
  canInteract: boolean;
  actionType: "replace" | "insert" | "none";
}

function VaultValueButton({
  value,
  onClick,
  canInteract,
  actionType,
}: VaultValueButtonProps) {
  const isReplace = actionType === "replace";

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-left h-auto py-2.5 px-3 transition-all duration-150",
        canInteract
          ? isReplace
            ? "hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-900 dark:hover:text-green-100 hover:border-green-300 dark:hover:border-green-700 border border-transparent cursor-pointer"
            : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
          : "opacity-40 cursor-not-allowed"
      )}
      onClick={canInteract ? onClick : undefined}
      disabled={!canInteract}
      title={
        actionType === "replace"
          ? `Sostituisci con: ${value.value}`
          : actionType === "insert"
          ? `Inserisci: ${value.value}`
          : "Seleziona testo nel documento per attivare"
      }
    >
      <div className="flex flex-col items-start gap-1 w-full">
        <span
          className={cn(
            "text-sm font-medium",
            isReplace && canInteract && "text-green-800 dark:text-green-300"
          )}
        >
          {value.label}
        </span>
        <span className="text-xs text-muted-foreground line-clamp-2 break-all">
          {value.value}
        </span>
      </div>
    </Button>
  );
}

// ============================================================================
// ADD ENTRY DIALOG
// ============================================================================

interface AddEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (entry: VaultEntryCreate) => Promise<boolean>;
}

function AddEntryDialog({ open, onOpenChange, onAdd }: AddEntryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    valueData: "",
    nameLabel: "",
    nameGroup: "",
    customGroup: "",
  });
  const [useCustomGroup, setUseCustomGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      valueData: "",
      nameLabel: "",
      nameGroup: "",
      customGroup: "",
    });
    setUseCustomGroup(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.valueData.trim()) {
      setError("Il valore è obbligatorio");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Determina il gruppo finale
    const finalGroup = useCustomGroup
      ? formData.customGroup.trim() || undefined
      : formData.nameGroup || undefined;

    try {
      const success = await onAdd({
        valueData: formData.valueData.trim(),
        nameLabel: formData.nameLabel.trim() || undefined,
        nameGroup: finalGroup,
        source: "manual",
      });

      if (success) {
        resetForm();
        onOpenChange(false);
      } else {
        setError("Impossibile aggiungere il valore. Riprova.");
      }
    } catch {
      setError("Si è verificato un errore. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Aggiungi nuovo valore</DialogTitle>
          <DialogDescription>
            Inserisci un dato da salvare nel vault. Potrai usarlo per compilare
            rapidamente i tuoi documenti.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4">
            {/* Valore (obbligatorio) */}
            <div className="space-y-2">
              <Label htmlFor="valueData" className="text-sm font-medium">
                Valore <span className="text-destructive">*</span>
              </Label>
              <Input
                id="valueData"
                placeholder="es. IT01234567890, Via Roma 123, mario.rossi@email.it"
                value={formData.valueData}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    valueData: e.target.value,
                  }))
                }
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Il dato effettivo che verrà inserito nel documento (es. codice
                fiscale, indirizzo, email, IBAN...)
              </p>
            </div>

            {/* Etichetta (opzionale) */}
            <div className="space-y-2">
              <Label htmlFor="nameLabel" className="text-sm font-medium">
                Etichetta{" "}
                <span className="text-muted-foreground font-normal">
                  (opzionale)
                </span>
              </Label>
              <Input
                id="nameLabel"
                placeholder="es. Partita IVA, Indirizzo sede legale, Email PEC"
                value={formData.nameLabel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    nameLabel: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Un nome descrittivo per riconoscere facilmente questo valore
                nella lista. Se non specificato, verrà mostrato il valore
                stesso.
              </p>
            </div>

            {/* Categoria (opzionale) */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Categoria{" "}
                <span className="text-muted-foreground font-normal">
                  (opzionale)
                </span>
              </Label>

              {!useCustomGroup ? (
                <>
                  <Select
                    value={formData.nameGroup}
                    onValueChange={(value: string) =>
                      setFormData((prev) => ({ ...prev, nameGroup: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona una categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                    onClick={() => setUseCustomGroup(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Crea nuova categoria
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    placeholder="es. Referenze, Progetti, Clienti..."
                    value={formData.customGroup}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customGroup: e.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setUseCustomGroup(false);
                      setFormData((prev) => ({ ...prev, customGroup: "" }));
                    }}
                  >
                    ← Usa categoria esistente
                  </Button>
                </>
              )}

              <p className="text-xs text-muted-foreground">
                Raggruppa i valori simili per trovarli più facilmente. I valori
                senza categoria appariranno in &quot;Altri dati&quot;.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
