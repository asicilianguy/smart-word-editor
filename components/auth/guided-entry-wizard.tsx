"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  Building2,
  Mail,
  MapPin,
  Landmark,
  User,
  SkipForward,
  Edit2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { VaultEntry } from "@/lib/auth-types";
import { generateEntryId } from "@/lib/auth-types";

// ============================================================================
// TYPES
// ============================================================================

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  examples: string[];
  /** Suggerimenti per questo campo */
  placeholders: string[];
}

const CATEGORIES: Category[] = [
  {
    id: "contacts",
    name: "Contatti",
    icon: Mail,
    description: "Email, telefono, PEC... i recapiti che usi più spesso",
    examples: ["Email aziendale", "PEC", "Telefono fisso", "Cellulare"],
    placeholders: [
      "info@azienda.it",
      "azienda@pec.it",
      "+39 02 1234567",
      "+39 333 1234567",
    ],
  },
  {
    id: "company",
    name: "Azienda",
    icon: Building2,
    description: "Ragione sociale, P.IVA, codice fiscale...",
    examples: ["Ragione sociale", "Partita IVA", "Codice Fiscale", "REA"],
    placeholders: [
      "Rossi S.r.l.",
      "IT01234567890",
      "01234567890",
      "MI-123456",
    ],
  },
  {
    id: "addresses",
    name: "Indirizzi",
    icon: MapPin,
    description: "Sede legale, operativa, spedizioni...",
    examples: ["Sede legale", "Sede operativa", "Indirizzo spedizioni"],
    placeholders: [
      "Via Roma 123, 20100 Milano (MI)",
      "Via Napoli 456, 00100 Roma (RM)",
      "Via Torino 789, 10100 Torino (TO)",
    ],
  },
  {
    id: "people",
    name: "Persone",
    icon: User,
    description: "Legale rappresentante, referenti, firmatari...",
    examples: [
      "Legale rappresentante",
      "Referente progetto",
      "Responsabile acquisti",
    ],
    placeholders: ["Mario Rossi", "Laura Bianchi", "Giuseppe Verdi"],
  },
  {
    id: "banking",
    name: "Coordinate bancarie",
    icon: Landmark,
    description: "IBAN, banca di riferimento... per i pagamenti",
    examples: ["IBAN principale", "Banca", "SWIFT/BIC"],
    placeholders: [
      "IT60X0542811101000000123456",
      "Banca Intesa Sanpaolo",
      "BCITITMM",
    ],
  },
];

interface GuidedEntryWizardProps {
  entries: VaultEntry[];
  onEntriesChange: (entries: VaultEntry[]) => void;
  onComplete: () => void;
  onBack: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GuidedEntryWizard({
  entries,
  onEntriesChange,
  onComplete,
  onBack,
}: GuidedEntryWizardProps) {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [categoryEntries, setCategoryEntries] = useState<
    Record<string, VaultEntry[]>
  >({});

  const currentCategory = CATEGORIES[currentCategoryIndex];
  const isLastCategory = currentCategoryIndex === CATEGORIES.length - 1;
  const isFirstCategory = currentCategoryIndex === 0;

  // Inizializza le entries per categoria dalle entries esistenti
  useEffect(() => {
    const grouped: Record<string, VaultEntry[]> = {};
    CATEGORIES.forEach((cat) => {
      grouped[cat.id] = entries.filter((e) => e.nameGroup === cat.name);
    });
    setCategoryEntries(grouped);
  }, []);

  const handleAddEntry = (entry: VaultEntry) => {
    const newEntry = { ...entry, nameGroup: currentCategory.name };
    setCategoryEntries((prev) => ({
      ...prev,
      [currentCategory.id]: [...(prev[currentCategory.id] || []), newEntry],
    }));
  };

  const handleRemoveEntry = (entryId: string) => {
    setCategoryEntries((prev) => ({
      ...prev,
      [currentCategory.id]: (prev[currentCategory.id] || []).filter(
        (e) => e.id !== entryId
      ),
    }));
  };

  const handleUpdateEntry = (entryId: string, updates: Partial<VaultEntry>) => {
    setCategoryEntries((prev) => ({
      ...prev,
      [currentCategory.id]: (prev[currentCategory.id] || []).map((e) =>
        e.id === entryId ? { ...e, ...updates } : e
      ),
    }));
  };

  const handleNext = () => {
    if (isLastCategory) {
      // Combina tutte le entries e completa
      const allEntries = Object.values(categoryEntries).flat();
      onEntriesChange(allEntries);
      onComplete();
    } else {
      setCurrentCategoryIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (isFirstCategory) {
      onBack();
    } else {
      setCurrentCategoryIndex((prev) => prev - 1);
    }
  };

  const handleSkipCategory = () => {
    handleNext();
  };

  const currentEntries = categoryEntries[currentCategory.id] || [];
  const totalEntriesCount = Object.values(categoryEntries).flat().length;
  const progress =
    ((currentCategoryIndex + 1) / CATEGORIES.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {currentCategoryIndex + 1} di {CATEGORIES.length}
        </span>
        <div className="flex items-center gap-2">
          {CATEGORIES.map((cat, index) => {
            const hasEntries = (categoryEntries[cat.id] || []).length > 0;
            const isCurrent = index === currentCategoryIndex;
            const isPast = index < currentCategoryIndex;

            return (
              <button
                key={cat.id}
                onClick={() => setCurrentCategoryIndex(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  isCurrent
                    ? "w-8 bg-primary"
                    : hasEntries
                      ? "w-2 bg-green-500"
                      : isPast
                        ? "w-2 bg-muted-foreground/50"
                        : "w-2 bg-muted"
                )}
              />
            );
          })}
        </div>
        {totalEntriesCount > 0 && (
          <span className="text-muted-foreground">
            {totalEntriesCount} salvat{totalEntriesCount === 1 ? "o" : "i"}
          </span>
        )}
      </div>

      {/* Category Header */}
      <div className="text-center space-y-3">
        <div
          className={cn(
            "h-16 w-16 rounded-2xl flex items-center justify-center mx-auto",
            "bg-primary/10 text-primary"
          )}
        >
          <currentCategory.icon className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">{currentCategory.name}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {currentCategory.description}
        </p>
      </div>

      {/* Entry Form */}
      <CategoryEntryForm
        category={currentCategory}
        entries={currentEntries}
        onAdd={handleAddEntry}
        onRemove={handleRemoveEntry}
        onUpdate={handleUpdateEntry}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={handlePrevious}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isFirstCategory ? "Indietro" : "Categoria precedente"}
        </Button>

        <div className="flex items-center gap-3">
          {currentEntries.length === 0 && (
            <Button variant="ghost" onClick={handleSkipCategory}>
              <SkipForward className="h-4 w-4 mr-2" />
              Salta
            </Button>
          )}

          <Button onClick={handleNext}>
            {isLastCategory ? (
              <>
                Completa
                <Check className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Continua
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tip */}
      <p className="text-center text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3 inline mr-1" />
        Non preoccuparti se non hai tutti i dati. Puoi sempre aggiungerli dopo.
      </p>
    </div>
  );
}

// ============================================================================
// CATEGORY ENTRY FORM
// ============================================================================

interface CategoryEntryFormProps {
  category: Category;
  entries: VaultEntry[];
  onAdd: (entry: VaultEntry) => void;
  onRemove: (entryId: string) => void;
  onUpdate: (entryId: string, updates: Partial<VaultEntry>) => void;
}

function CategoryEntryForm({
  category,
  entries,
  onAdd,
  onRemove,
  onUpdate,
}: CategoryEntryFormProps) {
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [showLabelField, setShowLabelField] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on input when category changes
  useEffect(() => {
    setValue("");
    setLabel("");
    setShowLabelField(false);
    setEditingId(null);
    inputRef.current?.focus();
  }, [category.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    if (editingId) {
      onUpdate(editingId, {
        valueData: value.trim(),
        nameLabel: label.trim() || undefined,
      });
      setEditingId(null);
    } else {
      onAdd({
        id: generateEntryId(),
        valueData: value.trim(),
        nameLabel: label.trim() || undefined,
        nameGroup: category.name,
        createdAt: new Date(),
        source: "manual",
      });
    }

    setValue("");
    setLabel("");
    setShowLabelField(false);
    inputRef.current?.focus();
  };

  const handleEdit = (entry: VaultEntry) => {
    setEditingId(entry.id);
    setValue(entry.valueData);
    setLabel(entry.nameLabel || "");
    setShowLabelField(!!entry.nameLabel);
    inputRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setValue("");
    setLabel("");
    setShowLabelField(false);
  };

  const randomPlaceholder =
    category.placeholders[Math.floor(Math.random() * category.placeholders.length)];

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="value" className="sr-only">
            Valore
          </Label>
          <Input
            ref={inputRef}
            id="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`es. ${randomPlaceholder}`}
            className="h-12 text-base"
          />
        </div>

        {/* Label toggle */}
        {!showLabelField ? (
          <button
            type="button"
            onClick={() => setShowLabelField(true)}
            className="text-sm text-primary hover:underline"
          >
            + Aggiungi un nome (es. "{category.examples[0]}")
          </button>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="label" className="text-sm text-muted-foreground">
              Come vuoi chiamarlo?
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={category.examples[0]}
              className="h-10"
            />
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!value.trim()}
            className="flex-1"
          >
            {editingId ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Salva modifiche
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi
              </>
            )}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={handleCancelEdit}>
              Annulla
            </Button>
          )}
        </div>
      </form>

      {/* Added Entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Aggiunti ({entries.length})
          </h4>
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border bg-card group",
                  editingId === entry.id && "ring-2 ring-primary"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm truncate">{entry.valueData}</p>
                  {entry.nameLabel && (
                    <p className="text-xs text-muted-foreground">
                      {entry.nameLabel}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(entry)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onRemove(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {entries.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed rounded-xl">
          <p className="text-sm text-muted-foreground mb-3">
            Suggerimenti per questa categoria:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {category.examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setLabel(example);
                  setShowLabelField(true);
                  inputRef.current?.focus();
                }}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
