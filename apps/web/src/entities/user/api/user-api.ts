import type { User } from "../model/types";
import { CURRENT_USER_ID, USERS } from "./fixtures";

// Static data for now. Async on purpose: same signature the backend-backed version will have.

export async function getCurrentUser(): Promise<User> {
  const user = USERS.find((candidate) => candidate.id === CURRENT_USER_ID);
  if (!user) throw new Error(`Fixture user "${CURRENT_USER_ID}" not found`);
  return user;
}

export async function getUsers(): Promise<readonly User[]> {
  return USERS;
}
