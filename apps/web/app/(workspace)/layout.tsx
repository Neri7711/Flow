import type { ReactNode } from "react";

import { SpaceTheme } from "@/app/layouts/space-theme";

// Group layout: persists across spaces so the team theme can transition between them.
export default function WorkspaceGroupLayout({ children }: { children: ReactNode }) {
  return <SpaceTheme>{children}</SpaceTheme>;
}
