"use client"

import { useState } from "react"
import { Search, Building2, Users, MapPin, Scale } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import type { VaultCategory, VaultValue } from "@/lib/document-types"
import { cn } from "@/lib/utils"

interface VaultSidebarProps {
  categories: VaultCategory[]
  onValueClick?: (value: VaultValue) => void
}

const categoryIcons = {
  company: Building2,
  contacts: Users,
  addresses: MapPin,
  legal: Scale,
}

export function VaultSidebar({ categories, onValueClick }: VaultSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      values: category.values.filter(
        (value) =>
          value.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          value.value.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.values.length > 0)

  return (
    <div className="h-full flex flex-col bg-muted/30 border-l border-border">
      <div className="p-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold mb-3">Vault</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Accordion type="multiple" defaultValue={categories.map((c) => c.id)} className="space-y-2">
            {filteredCategories.map((category) => {
              const Icon = categoryIcons[category.id as keyof typeof categoryIcons]
              return (
                <AccordionItem key={category.id} value={category.id} className="border rounded-lg bg-card">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      <span className="font-medium">{category.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto mr-2">({category.values.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <div className="space-y-1">
                      {category.values.map((value) => (
                        <Button
                          key={value.id}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-left h-auto py-2 px-3",
                            "hover:bg-accent hover:text-accent-foreground",
                          )}
                          onClick={() => onValueClick?.(value)}
                        >
                          <div className="flex flex-col items-start gap-1 w-full">
                            <span className="text-sm font-medium">{value.label}</span>
                            <span className="text-xs text-muted-foreground line-clamp-2">{value.value}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No results found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
