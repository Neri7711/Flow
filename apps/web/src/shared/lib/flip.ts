import { motionTokens } from "@/shared/config";

/**
 * Minimal FLIP (First, Last, Invert, Play) with the Web Animations API.
 * Capture element rects before a DOM change, then animate every element from its
 * old position to its new one. Elements are matched by the `data-flip-id` attribute.
 */

export type RectMap = Map<string, DOMRect>;

const ATTRIBUTE = "data-flip-id";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Rects of every `[data-flip-id]` element inside `root`. */
export function captureRects(root: ParentNode): RectMap {
  const rects: RectMap = new Map();
  root.querySelectorAll<HTMLElement>(`[${ATTRIBUTE}]`).forEach((element) => {
    const id = element.getAttribute(ATTRIBUTE);
    if (id) rects.set(id, element.getBoundingClientRect());
  });
  return rects;
}

type PlayFlipOptions = {
  /** Start rects that win over the captured ones (e.g. where a dragged card was dropped). */
  overrides?: RectMap;
  /** Extra transform at the start of these elements' animation (e.g. the drag "lift"). */
  startTransform?: Map<string, string>;
};

/** Animates every `[data-flip-id]` element in `root` from its rect in `before` to where it is now. */
export function playFlip(root: ParentNode, before: RectMap, { overrides, startTransform }: PlayFlipOptions = {}) {
  if (prefersReducedMotion()) return;

  root.querySelectorAll<HTMLElement>(`[${ATTRIBUTE}]`).forEach((element) => {
    const id = element.getAttribute(ATTRIBUTE);
    const from = id ? (overrides?.get(id) ?? before.get(id)) : undefined;
    if (!id || !from) return;

    const to = element.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const extra = startTransform?.get(id) ?? "";
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && !extra) return;

    element.animate([{ transform: `translate(${dx}px, ${dy}px) ${extra}` }, { transform: "none" }], {
      duration: motionTokens.duration.base * 1000,
      easing: `cubic-bezier(${motionTokens.ease.out.join(", ")})`,
    });
  });
}
