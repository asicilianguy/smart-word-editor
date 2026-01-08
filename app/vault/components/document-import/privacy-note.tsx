"use client";

import { Shield, Lock, Eye, Trash2 } from "lucide-react";

interface PrivacyNoteProps {
  variant?: "compact" | "full";
}

export function PrivacyNote({ variant = "compact" }: PrivacyNoteProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        <span>I tuoi documenti restano privati e non vengono condivisi</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="h-4 w-4 text-[var(--brand-primary)]" />I tuoi dati
        sono al sicuro
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--brand-primary)]" />
          <span>
            I documenti vengono elaborati e poi eliminati dai nostri server
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Eye className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--brand-primary)]" />
          <span>Tu decidi quali dati salvare nel tuo vault personale</span>
        </div>
        <div className="flex items-start gap-2">
          <Trash2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--brand-primary)]" />
          <span>Puoi eliminare qualsiasi dato in qualsiasi momento</span>
        </div>
      </div>
    </div>
  );
}
