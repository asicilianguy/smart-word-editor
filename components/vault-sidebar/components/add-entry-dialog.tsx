"use client";

import { useState, useEffect } from "react";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
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
  /** Valore iniziale pre-compilato (es. da testo selezionato) */
  initialValue?: string;
}

export function AddEntryDialog({
  open,
  onOpenChange,
  onAdd,
  initialValue,
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

  // Aggiorna valueData quando initialValue cambia
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
            {initialValue ? "Salva nel vault" : "Aggiungi nuovo valore"}
          </DialogTitle>
          <DialogDescription>
            {initialValue
              ? "Salva il testo selezionato nel vault per riutilizzarlo in futuro."
              : "Inserisci un dato da salvare nel vault. Potrai usarlo per compilare rapidamente i tuoi documenti."}
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
              onClick={() => handleOpenChange(false)}
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
                  {initialValue ? "Salva" : "Aggiungi"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
