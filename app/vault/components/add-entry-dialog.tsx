"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
import { useGroupOptions } from "@/components/vault-sidebar/components/use-translated-constants";
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
  const t = useTranslations("myData.addDialog");
  const groupOptions = useGroupOptions();

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
      setError(t("errors.valueRequired"));
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
        setError(t("errors.addFailed"));
      }
    } catch {
      setError(t("errors.unexpected"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Campo principale - VALORE */}
            <div className="space-y-2">
              <Label htmlFor="valueData" className="text-base font-medium">
                {t("value")}
              </Label>
              <Input
                id="valueData"
                placeholder={t("valuePlaceholder")}
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
              <p className="text-xs text-muted-foreground">{t("valueHint")}</p>
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
                  {showOptions ? t("hideOptions") : t("showOptions")}
                  <span className="ml-1 opacity-60">({t("optional")})</span>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4 pt-3">
                {/* Etichetta */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="nameLabel"
                    className="text-sm text-muted-foreground"
                  >
                    {t("label")}
                  </Label>
                  <Input
                    id="nameLabel"
                    placeholder={t("labelPlaceholder")}
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
                    {t("category")}
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
                          <SelectValue placeholder={t("categoryNone")} />
                        </SelectTrigger>
                        <SelectContent>
                          {groupOptions.map((option) => (
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
                        {t("createNewCategory")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Input
                        placeholder={t("categoryNamePlaceholder")}
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
                        {t("chooseExisting")}
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
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.valueData.trim()}
              className="bg-(--brand-primary) hover:bg-(--brand-primary-hover)"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("adding")}
                </>
              ) : (
                t("add")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
