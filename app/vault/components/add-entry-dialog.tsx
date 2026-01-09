"use client";

import { useState, useEffect } from "react";
import { Plus, AlertTriangle, Loader2, ChevronDown } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GROUP_OPTIONS } from "../constants";
import type { VaultEntryCreate } from "@/lib/vault-api";

interface AddEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (entry: VaultEntryCreate) => Promise<boolean>;
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
  const [showOptions, setShowOptions] = useState(false);
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
    setShowOptions(false);
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
      setError("Inserisci un valore");
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
        setError("Impossibile aggiungere. Riprova.");
      }
    } catch {
      setError("Si è verificato un errore. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Aggiungi un dato</DialogTitle>
          <DialogDescription>
            Inserisci il valore che vuoi riutilizzare nei documenti.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Campo principale - VALORE */}
            <div className="space-y-2">
              <Label htmlFor="valueData" className="text-base font-medium">
                Valore
              </Label>
              <Input
                id="valueData"
                placeholder="Scrivi qui il dato..."
                value={formData.valueData}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    valueData: e.target.value,
                  }))
                }
                className="text-base h-11"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Questo è il testo che verrà inserito nel documento
              </p>
            </div>

            {/* Opzioni aggiuntive - collassate */}
            <Collapsible open={showOptions} onOpenChange={setShowOptions}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground w-full justify-start"
                >
                  <ChevronDown
                    className={`h-3 w-3 mr-1.5 transition-transform ${
                      showOptions ? "rotate-180" : ""
                    }`}
                  />
                  {showOptions ? "Nascondi opzioni" : "Opzioni aggiuntive"}
                  <span className="ml-1 opacity-60">(facoltative)</span>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4 pt-3">
                {/* Etichetta */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="nameLabel"
                    className="text-sm text-muted-foreground"
                  >
                    Etichetta
                  </Label>
                  <Input
                    id="nameLabel"
                    placeholder="Un nome per riconoscerlo"
                    value={formData.nameLabel}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nameLabel: e.target.value,
                      }))
                    }
                    className="h-9 text-sm"
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">
                    Categoria
                  </Label>

                  {!useCustomGroup ? (
                    <div className="space-y-1">
                      <Select
                        value={formData.nameGroup}
                        onValueChange={(value: string) =>
                          setFormData((prev) => ({ ...prev, nameGroup: value }))
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Nessuna" />
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
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground"
                        onClick={() => setUseCustomGroup(true)}
                      >
                        Crea nuova categoria
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Input
                        placeholder="Nome categoria"
                        value={formData.customGroup}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customGroup: e.target.value,
                          }))
                        }
                        className="h-9 text-sm"
                      />
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground"
                        onClick={() => {
                          setUseCustomGroup(false);
                          setFormData((prev) => ({ ...prev, customGroup: "" }));
                        }}
                      >
                        ← Scegli esistente
                      </Button>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.valueData.trim()}
              className="bg-(--brand-primary) hover:bg-(--brand-primary-hover)"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aggiunta...
                </>
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
