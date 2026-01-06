"use client";

import { useState, useEffect } from "react";
import { FolderPlus, Loader2 } from "lucide-react";
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

  // Reset quando si apre
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
            <FolderPlus className="h-5 w-5" />
            Nuova categoria
          </DialogTitle>
          <DialogDescription>
            Crea una nuova categoria per organizzare i tuoi dati.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nome categoria</Label>
              <Input
                id="group-name"
                placeholder="es. Certificazioni, Documenti personali..."
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
            <Button type="submit">Crea categoria</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
