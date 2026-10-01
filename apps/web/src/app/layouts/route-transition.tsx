import type { ReactNode } from "react";

/**
 * Light fade-in for page content on navigation (remounted by Next's `template.tsx`).
 * Opacity only and short: navigation is frequent, the sidebar stays put.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 animate-in flex-col duration-(--motion-fast) ease-out fade-in-0">
      {children}
    </div>
  );
}
