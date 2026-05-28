"use client";

import { isClientReadOnly } from "@/lib/runtime";

/** Renders children only on the deployed demo (not localhost). */
export function ProductionOnly({ children }: { children: React.ReactNode }) {
  if (!isClientReadOnly()) return null;
  return <>{children}</>;
}
