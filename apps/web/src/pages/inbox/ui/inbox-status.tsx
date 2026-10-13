"use client";

import { motion } from "motion/react";

import { type Team, TeamAvatar } from "@/entities/team";
import { motionTokens } from "@/shared/config";

/** Shown while only a couple of decisions remain. */
export function AlmostDone({ space, remaining }: { space: Team; remaining: number }) {
  return (
    <div data-team={space.id} role="status" className="flex items-center gap-3.5 rounded-2xl bg-team-soft p-3.5 text-team-ink">
      <TeamAvatar team={space} size={48} decorative />
      <span className="flex flex-col gap-0.5">
        <span className="font-serif text-[19px] italic">Casi al día.</span>
        <span className="text-[13px]">
          {remaining === 1 ? "Te queda 1 decisión pendiente." : `Te quedan ${remaining} decisiones pendientes.`}
        </span>
      </span>
    </div>
  );
}

/** Nothing left to decide: a small, one-time moment with the space's mascot. */
export function AllClear({ space }: { space: Team }) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: motionTokens.duration.slow, ease: motionTokens.ease.out }}
      className="m-auto flex max-w-sm flex-col items-center gap-4 text-center"
    >
      <TeamAvatar team={space} size={88} decorative />
      <div className="flex flex-col gap-1.5">
        <span className="font-serif text-[26px] italic">Todo al día.</span>
        <p className="text-sm leading-[1.55] text-ink-muted">
          No hay solicitudes esperando una decisión de {space.name}. Cuando otro equipo pida algo, aparecerá aquí.
        </p>
      </div>
    </motion.div>
  );
}
