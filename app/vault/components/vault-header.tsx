"use client";

import {
  ArrowLeft,
  Plus,
  Search,
  FolderPlus,
  Coins,
  Loader2,
  Database,
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
    <header className="shrink-0 bg-card border-b border-border">
      <div className="px-4 lg:px-6 py-4">
        {/* Top row */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackClick}
              className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center shrink-0">
                <Database className="h-5 w-5 text-[var(--brand-primary)]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold truncate">I tuoi dati</h1>
                <p className="text-sm text-muted-foreground">
                  {totalEntries} valor{totalEntries === 1 ? "e" : "i"}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Token badge + Actions */}
          <div className="flex items-center gap-3">
            {/* Token Badge */}
            <div
              className={cn(
                "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                userTokens > 5
                  ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                  : userTokens > 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {isLoadingTokens ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Coins className="h-4 w-4" />
                  <span>{userTokens} token</span>
                </>
              )}
            </div>

            {/* Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateGroupClick}
              className="hidden md:flex gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              Nuovo gruppo
            </Button>

            <Button
              onClick={onAddClick}
              size="sm"
              className="gap-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Aggiungi</span>
            </Button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca valori, etichette o categorie..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        )}
      </div>
    </header>
  );
}
