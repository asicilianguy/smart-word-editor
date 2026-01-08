"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
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
import type { VaultEntry } from "../types";

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

export function EditEntryDialog({
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
    customGroup: "",
  });
  const [useCustomGroup, setUseCustomGroup] = useState(false);

  useEffect(() => {
    if (entry) {
      setFormData({
        valueData: entry.value,
        nameLabel: entry.label !== entry.value ? entry.label : "",
        nameGroup: entry.group,
        customGroup: "",
      });
      setUseCustomGroup(false);
    }
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    const group = useCustomGroup
      ? formData.customGroup.trim() || entry.group
      : formData.nameGroup || entry.group;

    const success = await onSave(entry.id, {
      valueData: formData.valueData.trim(),
      nameLabel: formData.nameLabel.trim() || undefined,
      nameGroup: group,
    });

    if (success) {
      onOpenChange(false);
    }
  };

  const allGroups = [
    ...new Set([...availableGroups, entry?.group || ""]),
  ].filter(Boolean);

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Modifica dato</DialogTitle>
          <DialogDescription>
            Aggiorna le informazioni di questo valore.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Campo principale - VALORE */}
            <div className="space-y-2">
              <Label htmlFor="edit-value" className="text-base font-medium">
                Valore
              </Label>
              <Input
                id="edit-value"
                value={formData.valueData}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, valueData: e.target.value }))
                }
                className="text-base h-11"
              />
              <p className="text-xs text-muted-foreground">
                Questo è il testo che verrà inserito nel documento
              </p>
            </div>

            {/* Etichetta - già visibile in edit mode */}
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-label"
                className="text-sm text-muted-foreground"
              >
                Etichetta
              </Label>
              <Input
                id="edit-label"
                placeholder="Un nome per riconoscerlo"
                value={formData.nameLabel}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, nameLabel: e.target.value }))
                }
                className="h-9 text-sm"
              />
            </div>

            {/* Categoria - già visibile in edit mode */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Categoria</Label>

              {!useCustomGroup ? (
                <div className="space-y-1">
                  <Select
                    value={formData.nameGroup}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, nameGroup: v }))
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allGroups.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground"
                    onClick={() => setUseCustomGroup(true)}
                  >
                    Sposta in nuova categoria
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Input
                    placeholder="Nome categoria"
                    value={formData.customGroup}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        customGroup: e.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground"
                    onClick={() => setUseCustomGroup(false)}
                  >
                    ← Scegli esistente
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.valueData.trim()}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                "Salva"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
