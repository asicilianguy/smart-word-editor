"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ReplacePopoverProps {
  x: number
  y: number
  selectedText: string
  onReplace: (newText: string) => void
  onClose: () => void
  suggestedValue?: string
}

export function ReplacePopover({ x, y, selectedText, onReplace, onClose, suggestedValue }: ReplacePopoverProps) {
  const [customText, setCustomText] = useState("")
  const [position, setPosition] = useState({ x, y })
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Adjust position if popover goes off screen
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = y - rect.height - 20
      }

      if (adjustedX < 10) adjustedX = 10
      if (adjustedY < 10) adjustedY = 10

      setPosition({ x: adjustedX, y: adjustedY })
    }
  }, [x, y])

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus()
  }, [])

  const handleReplace = (text: string) => {
    onReplace(text)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customText.trim()) {
      handleReplace(customText)
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={popoverRef}
        className={cn(
          "fixed z-50 bg-popover border border-border rounded-lg shadow-lg",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -100%)",
        }}
      >
        <div className="p-3 space-y-3 min-w-[320px]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">Selected text</p>
              <p className="text-sm font-medium line-clamp-2">{selectedText}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1" onClick={onClose}>
              <X className="h-3 w-3" />
            </Button>
          </div>

          {suggestedValue && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Suggested from vault</p>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-2 px-3 bg-transparent"
                onClick={() => handleReplace(suggestedValue)}
              >
                <div className="flex items-center gap-2 w-full">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm flex-1 line-clamp-2">{suggestedValue}</span>
                </div>
              </Button>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Replace with custom text</p>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Enter new text..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button size="sm" onClick={() => handleReplace(customText)} disabled={!customText.trim()}>
                Replace
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
