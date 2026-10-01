"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";

/**
 * Persistent theme root for every space. It lives in the `(workspace)` group layout,
 * which survives navigation between spaces (the `[team]` layout remounts per team),
 * so changing `data-team` here transitions the team colors (see `.space-theme`).
 */
export function SpaceTheme({ children }: { children: ReactNode }) {
  const params = useParams<{ team: string }>();

  return (
    <div data-team={params?.team} className="space-theme min-h-dvh">
      {children}
    </div>
  );
}
