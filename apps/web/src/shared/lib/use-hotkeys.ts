"use client";

import { useEffect, useRef } from "react";

/**
 * Keyboard shortcuts. Keys are lowercase; sequences are space-separated ("g c")
 * and must be typed within a short window. Modifier combos use "mod+k"
 * (⌘ on macOS, Ctrl elsewhere). Plain keys are ignored while typing in fields.
 */
export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

const SEQUENCE_TIMEOUT_MS = 800;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function useHotkeys(hotkeys: HotkeyMap, enabled = true) {
  // Latest handlers without re-subscribing on every render.
  const hotkeysRef = useRef(hotkeys);
  useEffect(() => {
    hotkeysRef.current = hotkeys;
  });

  useEffect(() => {
    if (!enabled) return;

    let buffer: string[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      const map = hotkeysRef.current;
      const key = event.key.toLowerCase();

      if (event.metaKey || event.ctrlKey) {
        map[`mod+${key}`]?.(event);
        return;
      }
      if (event.altKey || isTypingTarget(event.target)) return;

      buffer = [...buffer, key].slice(-2);
      clearTimeout(timer);
      timer = setTimeout(() => (buffer = []), SEQUENCE_TIMEOUT_MS);

      // A full sequence ("g c") wins over the single last key ("c").
      const handler = map[buffer.join(" ")] ?? map[key];
      if (!handler) return;

      event.preventDefault();
      buffer = [];
      handler(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(timer);
    };
  }, [enabled]);
}
