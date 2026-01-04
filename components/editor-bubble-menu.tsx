"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  Search,
  Clipboard,
  Building2,
  Users,
  MapPin,
  Scale,
  Award,
  Landmark,
  ChevronRight,
  Type,
  Database,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { VaultCategory, VaultValue } from "@/lib/document-types";

interface EditorBubbleMenuProps {
  x: number;
  y: number;
  selectedText: string;
  vaultCategories: VaultCategory[];
  onReplace: (text: string) => void;
  onClose: () => void;
}

type TabType = "text" | "vault";

const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  company: Building2,
  contacts: Users,
  addresses: MapPin,
  legal: Scale,
  certifications: Award,
  banking: Landmark,
};

export function EditorBubbleMenu({
  x,
  y,
  selectedText,
  vaultCategories,
  onReplace,
  onClose,
}: EditorBubbleMenuProps) {
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [customText, setCustomText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calcola la posizione corretta
  useLayoutEffect(() => {
    if (!menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newX = x - menuRect.width / 2;
    let newY = y - menuRect.height - 10;

    // Aggiusta se esce a sinistra
    if (newX < 10) newX = 10;
    // Aggiusta se esce a destra
    if (newX + menuRect.width > viewportWidth - 10) {
      newX = viewportWidth - menuRect.width - 10;
    }
    // Se esce sopra, mostra sotto
    if (newY < 10) newY = y + 30;
    // Se esce sotto
    if (newY + menuRect.height > viewportHeight - 10) {
      newY = viewportHeight - menuRect.height - 10;
    }

    setPosition({ x: newX, y: newY });
  }, [x, y]);

  // Focus sull'input quando cambia tab
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "text") {
        inputRef.current?.focus();
      } else {
        searchInputRef.current?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleReplace = (text: string) => {
    if (text) {
      onReplace(text);
      setCustomText("");
      setSearchQuery("");
      setSelectedCategory(null);
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customText.trim()) {
      e.preventDefault();
      e.stopPropagation();
      handleReplace(customText);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (searchQuery) {
        setSearchQuery("");
      } else if (selectedCategory) {
        setSelectedCategory(null);
      } else {
        onClose();
      }
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCustomText(text);
      inputRef.current?.focus();
    } catch (err) {
      console.warn("Impossibile leggere dagli appunti:", err);
    }
  };

  // Filtra le categorie
  const filteredCategories = vaultCategories
    .map((category) => ({
      ...category,
      values: category.values.filter(
        (value) =>
          value.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          value.value.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.values.length > 0);

  const displayedValues = selectedCategory
    ? filteredCategories.find((c) => c.id === selectedCategory)?.values ?? []
    : searchQuery
    ? filteredCategories.flatMap((c) => c.values)
    : [];

  return (
    <>
      {/* Overlay per chiudere quando si clicca fuori */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-popover border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95"
        style={{
          left: position.x,
          top: position.y,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="w-[380px]">
          {/* Header con testo selezionato */}
          <div className="flex items-start justify-between p-3 border-b border-border bg-muted/30">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-xs text-muted-foreground mb-1">Sostituisci:</p>
              <p className="text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded border border-yellow-300 dark:border-yellow-700 line-clamp-2">
                "{selectedText}"
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                "flex items-center justify-center gap-2",
                activeTab === "text"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("text")}
              type="button"
            >
              <Type className="h-4 w-4" />
              Testo
            </button>
            <button
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                "flex items-center justify-center gap-2",
                activeTab === "vault"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("vault")}
              type="button"
            >
              <Database className="h-4 w-4" />
              Vault
            </button>
          </div>

          {/* Content */}
          <div className="p-3">
            {activeTab === "text" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Nuovo testo
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={handlePasteFromClipboard}
                    type="button"
                  >
                    <Clipboard className="h-3 w-3 mr-1" />
                    Incolla
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Inserisci nuovo testo..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    onKeyDown={handleTextKeyDown}
                    className="flex-1 h-9"
                  />
                  <Button
                    onClick={() => handleReplace(customText)}
                    disabled={!customText.trim()}
                    size="sm"
                    type="button"
                  >
                    Sostituisci
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  <kbd className="px-1 py-0.5 bg-muted rounded">Invio</kbd>{" "}
                  conferma ·{" "}
                  <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd>{" "}
                  annulla
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Cerca nel vault..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedCategory(null);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-8 h-9"
                  />
                </div>

                {/* Breadcrumb */}
                {selectedCategory && !searchQuery && (
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedCategory(null)}
                      type="button"
                    >
                      Categorie
                    </button>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">
                      {
                        vaultCategories.find((c) => c.id === selectedCategory)
                          ?.name
                      }
                    </span>
                  </div>
                )}

                {/* List */}
                <ScrollArea className="h-[180px]">
                  {!selectedCategory && !searchQuery ? (
                    // Category list
                    <div className="space-y-1">
                      {vaultCategories.map((category) => {
                        const Icon = categoryIcons[category.id] || Database;
                        return (
                          <button
                            key={category.id}
                            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left text-sm"
                            onClick={() => setSelectedCategory(category.id)}
                            type="button"
                          >
                            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{category.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {category.values.length} valori
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    // Values list
                    <div className="space-y-1">
                      {(searchQuery
                        ? filteredCategories.flatMap((c) =>
                            c.values.map((v) => ({
                              ...v,
                              categoryName: c.name,
                            }))
                          )
                        : displayedValues.map((v) => ({
                            ...v,
                            categoryName: undefined,
                          }))
                      ).map((value) => (
                        <button
                          key={value.id}
                          className="w-full flex flex-col gap-0.5 p-2 rounded-md hover:bg-accent text-left"
                          onClick={() => handleReplace(value.value)}
                          type="button"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="font-medium text-sm flex-1">
                              {value.label}
                            </span>
                            {"categoryName" in value && value.categoryName && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {value.categoryName}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {value.value}
                          </span>
                        </button>
                      ))}

                      {searchQuery && filteredCategories.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">
                            Nessun risultato
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
