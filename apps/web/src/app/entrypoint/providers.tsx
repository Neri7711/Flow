"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

/** App-wide client providers. `reducedMotion="user"` honors the OS "reduce motion" setting. */
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
