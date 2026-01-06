"use client";

import { ArrowLeft, Plus, Search, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VaultHeaderProps {
  totalEntries: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
  onCreateGroupClick: () => void;
  onBackClick: () => void;
  showSearch: boolean;
}

export function VaultHeader({
  totalEntries,
  searchQuery,
  onSearchChange,
  onAddClick,
  onCreateGroupClick,
  onBackClick,
  showSearch,
}: VaultHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-card border-b">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBackClick}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Gestione Vault</h1>
              <p className="text-sm text-muted-foreground">
                {totalEntries} valor{totalEntries === 1 ? "e" : "i"} salvat
                {totalEntries === 1 ? "o" : "i"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateGroupClick}
              className="hidden sm:flex gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              Nuovo gruppo
            </Button>
            <Button onClick={onAddClick} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Aggiungi</span>
            </Button>
          </div>
        </div>

        {showSearch && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca valori, etichette o categorie..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </div>
    </header>
  );
}
