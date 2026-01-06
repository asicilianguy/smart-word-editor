"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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

  // Sincronizza form quando entry cambia
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

  // Gruppi disponibili incluso quello corrente
  const allGroups = [
    ...new Set([...availableGroups, entry?.group || ""]),
  ].filter(Boolean);

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
              {!useCustomGroup ? (
                <>
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
                      {allGroups.map((g) => (
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
                    Sposta in nuova categoria
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
                    autoFocus
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
                "Salva"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
