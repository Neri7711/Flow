"use server";

import { api } from "@/shared/api";

import type { User } from "../model/types";

/** The signed-in user; without a valid session this redirects to the login screen. */
export async function getCurrentUser(): Promise<User> {
  return api.get<User>("/users/me");
}

/** The signed-in user, or `undefined` when nobody is (never redirects). */
export async function getSessionUser(): Promise<User | undefined> {
  return api.find<User>("/users/me", { redirectOnUnauthorized: false });
}

export async function getUsers(): Promise<readonly User[]> {
  return api.get<User[]>("/users");
}
