import type { User } from "../model/types";

export const USERS: readonly User[] = [
  { id: "u-moge", name: "Moge", shortName: "Moge", initials: "EM", role: "leader", teamId: "pl", avatarTone: null },
  { id: "u-ana", name: "Ana L.", shortName: "Ana", initials: "AL", role: "member", teamId: "pl", avatarTone: "cs" },
  { id: "u-fer", name: "Fer R.", shortName: "Fer", initials: "FR", role: "member", teamId: "pl", avatarTone: "pl" },
  { id: "u-nico", name: "Nico E.", shortName: "Nico", initials: "NE", role: "member", teamId: "pl", avatarTone: "ii" },
];

/** The signed-in user while auth is simulated. */
export const CURRENT_USER_ID = "u-moge";
