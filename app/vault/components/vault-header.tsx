"use client";

import {
  ArrowLeft,
  Plus,
  Search,
  FolderPlus,
  Coins,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface VaultHeaderProps {
  totalEntries: number;
  userTokens: number;
  isLoadingTokens?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
  onCreateGroupClick: () => void;
  onBackClick: () => void;
  showSearch: boolean;
}

export function VaultHeader({
  totalEntries,
  userTokens,
  isLoadingTokens = false,
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
        {/* Top row: Navigation + Token Badge */}
        <div className="flex items-center justify-between gap-4 mb-4">
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

          {/* Token Badge */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border",
              userTokens > 5
                ? "bg-[var(--brand-primary)]/5 border-[var(--brand-primary)]/20"
                : userTokens > 0
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
            )}
          >
            {isLoadingTokens ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Coins
                  className={cn(
                    "h-4 w-4",
                    userTokens > 5
                      ? "text-[var(--brand-primary)]"
                      : userTokens > 0
                      ? "text-amber-600"
                      : "text-red-600"
                  )}
                />
                <div className="text-sm">
                  <span
                    className={cn(
                      "font-semibold",
                      userTokens > 5
                        ? "text-[var(--brand-primary)]"
                        : userTokens > 0
                        ? "text-amber-700"
                        : "text-red-700"
                    )}
                  >
                    {userTokens}
                  </span>
                  <span className="text-muted-foreground ml-1">token</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between gap-4">
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
            <Button
              onClick={onAddClick}
              className="gap-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Aggiungi valore</span>
              <span className="sm:hidden">Aggiungi</span>
            </Button>
          </div>

          {/* Mobile token display */}
          <div className="sm:hidden flex items-center gap-1.5 text-sm text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            <span>{userTokens}</span>
          </div>
        </div>

        {/* Search */}
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
