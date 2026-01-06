"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { VaultManager } from "./components/vault-manager";

export default function VaultPage() {
  return (
    <ProtectedRoute>
      <VaultManager />
    </ProtectedRoute>
  );
}