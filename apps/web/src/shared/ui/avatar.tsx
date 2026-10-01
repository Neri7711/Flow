import * as React from "react";
import Image from "next/image";

import { cn } from "@/shared/lib/utils";

type AvatarProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Diameter in px. Mockup sizes: 22, 24, 26, 32, 88. */
  size?: number;
  /** Separates overlapping avatars (presence stacks, rows) with a surface-colored ring. */
  ring?: boolean;
  /** Image avatar. When omitted, `initials` are rendered. */
  src?: string;
  alt?: string;
  /** Extra classes for the image (e.g. a zoom to crop a sticker-style picture). */
  imageClassName?: string;
  initials?: string;
};

/**
 * Circular avatar. Tint initials avatars with a background utility
 * (e.g. `bg-cs-soft`); neutral by default.
 */
function Avatar({
  size = 24,
  ring = false,
  src,
  alt = "",
  imageClassName,
  initials,
  className,
  style,
  ...props
}: AvatarProps) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-line-strong font-semibold text-ink",
        ring && "ring-2 ring-surface",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), ...style }}
      {...props}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${size}px`} className={cn("object-cover", imageClassName)} />
      ) : (
        initials
      )}
    </span>
  );
}

export { Avatar };
