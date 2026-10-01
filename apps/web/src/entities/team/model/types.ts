/**
 * Team ids double as URL slugs and as the `data-team` theme key
 * (see `src/app/styles/globals.css`). Adding a team means adding its id here
 * plus its color tokens and mascot.
 */
export type TeamId = "cs" | "pl" | "me" | "ii";

export type Team = {
  id: TeamId;
  name: string;
  /** Two-letter code used in task identifiers (PL-42) and as avatar fallback. */
  abbreviation: string;
  /** Short description of the mascot accessory, used as alt text. */
  mascotAlt: string;
};
