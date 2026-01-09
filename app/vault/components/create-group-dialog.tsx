"use client";

import { useState, useEffect } from "react";
import { FolderPlus } from "lucide-react";
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

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (groupName: string) => void;
  existingGroups: string[];
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onCreateGroup,
  existingGroups,
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setGroupName("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = groupName.trim();

    if (!trimmed) {
      setError("Il nome è obbligatorio");
      return;
    }

    if (existingGroups.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
      setError("Questa categoria esiste già");
      return;
    }

    onCreateGroup(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-(--brand-primary)/10 flex items-center justify-center">
              <FolderPlus className="h-4 w-4 text-(--brand-primary)" />
            </div>
            Nuova categoria
          </DialogTitle>
          <DialogDescription>
            Crea una categoria per organizzare i tuoi dati.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nome categoria</Label>
              <Input
                id="group-name"
                placeholder="es. Certificazioni, Progetti..."
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  setError(null);
                }}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
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
            <Button
              type="submit"
              className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) text-white"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Crea
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
