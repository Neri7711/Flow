"use server";

import { api } from "@/shared/api";

import type { User } from "../model/types";

/** The signed-in user. */
export async function getCurrentUser(): Promise<User> {
  return api.get<User>("/users/me");
}

export async function getUsers(): Promise<readonly User[]> {
  return api.get<User[]>("/users");
}
