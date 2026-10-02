import { motionTokens } from "@/shared/config";

import { prefersReducedMotion } from "./flip";

type MorphSource = {
  /** Tight rect of the source text (measure before the DOM changes). */
  rect: DOMRect;
  text: string;
  /** Computed `font` and `color` of the source, so the ghost looks identical. */
  font: string;
  color: string;
};

/** Tight bounding box and look of an element's text, to morph it later. */
export function measureText(element: HTMLElement): MorphSource {
  const range = document.createRange();
  range.selectNodeContents(element);
  const style = getComputedStyle(element);
  return { rect: range.getBoundingClientRect(), text: element.textContent ?? "", font: style.font, color: style.color };
}

/**
 * Makes a text visibly "become" another element: a ghost copy of the text flies
 * from where it was into `target`, shrinking and fading, then `target` pops in.
 * Used for the doc → task bridge (checklist text → task pill).
 */
export function morphTextInto(source: MorphSource, target: HTMLElement) {
  if (prefersReducedMotion()) return;

  const to = target.getBoundingClientRect();
  const { rect: from } = source;
  if (!from.width || !to.width) return;

  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.textContent = source.text;
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    margin: "0",
    font: source.font,
    color: source.color,
    whiteSpace: "pre-wrap",
    transformOrigin: "top left",
    pointerEvents: "none",
    zIndex: "60",
  });
  document.body.append(ghost);

  const scale = Math.min(1, Math.max(0.2, to.width / from.width));
  const duration = motionTokens.duration.slow * 1000;

  ghost
    .animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${scale})`, opacity: 0 },
      ],
      { duration, easing: `cubic-bezier(${motionTokens.ease.inOut.join(", ")})` },
    )
    .finished.finally(() => ghost.remove());

  target.animate(
    [
      { opacity: 0, transform: "scale(0.85)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    {
      duration: motionTokens.duration.fast * 1000,
      delay: duration * 0.55,
      easing: `cubic-bezier(${motionTokens.ease.out.join(", ")})`,
      fill: "backwards",
    },
  );
}
