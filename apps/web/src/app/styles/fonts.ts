import { Instrument_Serif, JetBrains_Mono, Onest } from "next/font/google";

/** UI and headings. */
const onest = Onest({
  subsets: ["latin", "latin-ext"],
  variable: "--font-onest",
  display: "swap",
});

/** Uppercase labels, task identifiers, property names, dates, shortcuts. */
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/** Sparing warm accents (welcome phrases, subtitles). Italic only. */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const fontVariables = [onest.variable, jetBrainsMono.variable, instrumentSerif.variable].join(" ");
