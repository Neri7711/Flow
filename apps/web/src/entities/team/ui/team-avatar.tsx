import { cn } from "@/shared/lib/utils";
import { Avatar } from "@/shared/ui/avatar";

import type { Team } from "../model/types";

/** Below this size the mascot is unreadable, so the abbreviation is shown instead. */
const MIN_MASCOT_SIZE = 20;

type TeamAvatarProps = {
  team: Team;
  size?: number;
  /** Decorative avatars (next to the team name) should not repeat it to screen readers. */
  decorative?: boolean;
  className?: string;
};

export function TeamAvatar({ team, size = 24, decorative = false, className }: TeamAvatarProps) {
  if (size < MIN_MASCOT_SIZE) {
    return (
      <Avatar
        data-team={team.id}
        size={size}
        initials={team.abbreviation}
        aria-hidden={decorative || undefined}
        className={cn("bg-team-soft text-team-strong", className)}
      />
    );
  }

  return (
    <Avatar
      size={size}
      src={`/mascots/${team.id}.png`}
      alt={decorative ? "" : team.mascotAlt}
      // The sticker leaves margin around the head; zoom in so the face fills the circle.
      imageClassName="scale-[1.22]"
      className={cn("bg-surface-sunken", className)}
    />
  );
}
