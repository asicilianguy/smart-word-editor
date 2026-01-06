"use client";

import type React from "react";
import { useState } from "react";
import { Search, Sparkles, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { VaultValue } from "@/lib/document-types";
import type { VaultEntryCreate } from "@/lib/vault-api";
import type { VaultSidebarProps, ActionType } from "./types";
import {
  StatusBadge,
  NotAuthenticatedState,
  ErrorState,
  OnboardingState,
  AddEntryDialog,
  VaultCategoryList,
} from "./components";
import { cn } from "@/lib/utils";

export function VaultSidebar({
  categories,
  onValueClick,
  hasSelection = false,
  hasCursor = false,
  selectedText,
  isAuthenticated = false,
  isEmpty = false,
  isLoading = false,
  error,
  onAddEntry,
  onRefresh,
  onLoginClick,
  onManageVaultClick,
}: VaultSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [initialValueForDialog, setInitialValueForDialog] = useState<
    string | undefined
  >();

  // Determina lo stato e l'azione
  const canInteract = isAuthenticated && (hasSelection || hasCursor);
  const actionType: ActionType = hasSelection
    ? "replace"
    : hasCursor
    ? "insert"
    : "none";

  // Filtra le categorie
  const filteredCategories = categories
    .map((category) => ({
      ...category,
      values: category.values.filter(
        (value) =>
          value.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          value.value.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.values.length > 0);

  /**
   * Previene che i click sulla sidebar facciano perdere il focus all'editor
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT") {
      return;
    }
    e.preventDefault();
  };

  const handleAddEntry = async (entry: VaultEntryCreate) => {
    if (onAddEntry) {
      const success = await onAddEntry(entry);
      if (success) {
        setAddDialogOpen(false);
        setInitialValueForDialog(undefined);
      }
      return success;
    }
    return false;
  };

  const handleOpenAddDialog = (initialValue?: string) => {
    setInitialValueForDialog(initialValue);
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setInitialValueForDialog(undefined);
    }
  };

  const handleDemoValueClick = (value: VaultValue) => {
    // I dati demo funzionano come quelli reali
    onValueClick?.(value);
  };

  // Determina se mostrare l'onboarding (vault vuoto)
  const showOnboarding = isAuthenticated && !error && isEmpty;
  const showRealData = isAuthenticated && !error && !isEmpty;

  return (
    <>
      <div
        className={cn(
          "h-full flex flex-col border-l transition-all duration-300 overflow-hidden",
          hasSelection && isAuthenticated
            ? "bg-green-50/50 dark:bg-green-950/20 border-green-300 dark:border-green-800 shadow-[-4px_0_20px_rgba(34,197,94,0.15)]"
            : hasCursor && isAuthenticated
            ? "bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900"
            : "bg-muted/30 border-border"
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Header - Fixed */}
        <div
          className={cn(
            "flex-shrink-0 p-4 border-b transition-colors duration-300",
            hasSelection && isAuthenticated
              ? "bg-green-100/80 dark:bg-green-900/30 border-green-200 dark:border-green-800"
              : hasCursor && isAuthenticated
              ? "bg-blue-100/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              : "bg-card border-border"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Vault</h2>
              {hasSelection && isAuthenticated && (
                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 animate-pulse" />
              )}
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {isAuthenticated && onAddEntry && !showOnboarding && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => handleOpenAddDialog()}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Aggiungi</span>
              </Button>
            )}
          </div>

          {/* Status Badge - solo se autenticato e non in onboarding */}
          {isAuthenticated && !showOnboarding && (
            <StatusBadge
              actionType={actionType}
              selectedText={selectedText}
              onSaveSelected={
                onAddEntry && selectedText
                  ? () => handleOpenAddDialog(selectedText)
                  : undefined
              }
            />
          )}

          {/* Status Badge per onboarding (senza salva) */}
          {showOnboarding && (
            <StatusBadge actionType={actionType} selectedText={selectedText} isDemo />
          )}

          {/* Search - solo se autenticato e ha dati reali */}
          {showRealData && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca valori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-9 transition-colors",
                  hasSelection &&
                    "border-green-300 dark:border-green-700 focus:ring-green-500"
                )}
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          {/* Non autenticato */}
          {!isAuthenticated && (
            <NotAuthenticatedState onLoginClick={onLoginClick} />
          )}

          {/* Autenticato ma errore */}
          {isAuthenticated && error && (
            <ErrorState error={error} onRefresh={onRefresh} />
          )}

          {/* Onboarding con dati demo */}
          {showOnboarding && (
            <OnboardingState
              onAddClick={() => handleOpenAddDialog()}
              onManageClick={onManageVaultClick}
              onDemoValueClick={handleDemoValueClick}
              hasSelection={hasSelection}
              hasCursor={hasCursor}
              actionType={actionType}
            />
          )}

          {/* Dati reali */}
          {showRealData && (
            <VaultCategoryList
              categories={categories}
              filteredCategories={filteredCategories}
              searchQuery={searchQuery}
              onValueClick={onValueClick}
              onManageClick={onManageVaultClick}
              canInteract={canInteract}
              actionType={actionType}
              hasSelection={hasSelection}
            />
          )}
        </div>

        {/* Footer - Fixed (solo per dati reali) */}
        {showRealData && (
          <div
            className={cn(
              "flex-shrink-0 p-4 border-t transition-colors",
              hasSelection
                ? "bg-green-100/50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-card border-border"
            )}
          >
            <p className="text-xs text-muted-foreground text-center">
              {categories.reduce((acc, cat) => acc + cat.values.length, 0)}{" "}
              valori in {categories.length} categorie
            </p>
          </div>
        )}
      </div>

      {/* Add Entry Dialog */}
      <AddEntryDialog
        open={addDialogOpen}
        onOpenChange={handleCloseAddDialog}
        onAdd={handleAddEntry}
        initialValue={initialValueForDialog}
      />
    </>
  );
}
