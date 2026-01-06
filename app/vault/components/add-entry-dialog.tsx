"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
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

export function AddEntryDialog({
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

  // Reset form quando si apre/chiude
  useEffect(() => {
    if (open) {
      setFormData({
        valueData: "",
        nameLabel: "",
        nameGroup: "",
        customGroup: "",
      });
      setUseCustomGroup(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.valueData.trim()) {
      setError("Il valore è obbligatorio");
      return;
    }

    const group = useCustomGroup
      ? formData.customGroup.trim() || "Altri dati"
      : formData.nameGroup || "Altri dati";

    const success = await onAdd({
      valueData: formData.valueData.trim(),
      nameLabel: formData.nameLabel.trim() || undefined,
      nameGroup: group,
    });

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    placeholder="Nome nuova categoria"
                    value={formData.customGroup}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        customGroup: e.target.value,
                      }))
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
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Aggiungi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
