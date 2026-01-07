"use client";

import { useState, useEffect } from "react";
import { Plus, AlertTriangle, Loader2, Info } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GROUP_OPTIONS } from "../constants";
import type { VaultEntryCreate } from "@/lib/vault-api";

interface AddEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (entry: VaultEntryCreate) => Promise<boolean>;
  initialValue?: string;
  isDemo?: boolean;
}

export function AddEntryDialog({
  open,
  onOpenChange,
  onAdd,
  initialValue,
  isDemo = false,
}: AddEntryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    valueData: "",
    nameLabel: "",
    nameGroup: "",
    customGroup: "",
  });
  const [useCustomGroup, setUseCustomGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && initialValue) {
      setFormData((prev) => ({ ...prev, valueData: initialValue }));
    }
  }, [open, initialValue]);

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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.valueData.trim()) {
      setError("Il valore è obbligatorio");
      return;
    }

    setIsSubmitting(true);
    setError(null);

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
        handleOpenChange(false);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {initialValue ? "Aggiungi ai dati" : "Aggiungi nuovo valore"}
          </DialogTitle>
          <DialogDescription>
            {isDemo
              ? "Aggiungi un dato di prova. Registrati per salvarlo permanentemente."
              : "Inserisci un dato da salvare nel vault."}
          </DialogDescription>
        </DialogHeader>

        {/* Demo notice */}
        {isDemo && (
          <div className="flex items-start gap-2 text-xs bg-[var(--brand-primary-subtle)] text-[var(--brand-primary-hover)] px-3 py-2 rounded-md border border-[var(--brand-primary)]/20">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Stai provando la demo. Questo dato sarà disponibile finché non
              chiudi la pagina.{" "}
              <strong>Registrati per salvarlo per sempre.</strong>
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Valore (obbligatorio) */}
            <div className="space-y-2">
              <Label htmlFor="valueData">
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
                Il dato che verrà inserito nel documento
              </p>
            </div>

            {/* Etichetta (opzionale) */}
            <div className="space-y-2">
              <Label htmlFor="nameLabel">
                Etichetta{" "}
                <span className="text-muted-foreground font-normal">
                  (opzionale)
                </span>
              </Label>
              <Input
                id="nameLabel"
                placeholder="es. Partita IVA, Indirizzo sede, Email PEC"
                value={formData.nameLabel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    nameLabel: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Un nome per riconoscere facilmente questo valore
              </p>
            </div>

            {/* Categoria (opzionale) */}
            <div className="space-y-2">
              <Label>
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
                      <SelectValue placeholder="Seleziona categoria..." />
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
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
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
            </div>

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
              onClick={() => handleOpenChange(false)}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aggiunta...
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
