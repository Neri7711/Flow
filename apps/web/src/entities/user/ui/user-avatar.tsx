import { cn } from "@/shared/lib/utils";
import { Avatar } from "@/shared/ui/avatar";

import type { User } from "../model/types";

type UserAvatarProps = {
  user: Pick<User, "name" | "initials" | "avatarTone">;
  size?: number;
  ring?: boolean;
  className?: string;
};

export function UserAvatar({ user, size = 24, ring = false, className }: UserAvatarProps) {
  return (
    <Avatar
      data-team={user.avatarTone ?? undefined}
      size={size}
      ring={ring}
      initials={user.initials}
      title={user.name}
      aria-label={user.name}
      role="img"
      className={cn(user.avatarTone && "bg-team-soft", className)}
    />
  );
}
