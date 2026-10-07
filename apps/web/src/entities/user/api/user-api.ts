"use server";

import { api, query, segment } from "@/shared/api";

import type { User, UserRole } from "../model/types";

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

export async function getTeamMembers(teamId: string): Promise<readonly User[]> {
  return api.get<User[]>(`/users${query({ teamId })}`);
}

/** Leaders only, for members of their own team (not themselves). */
export async function changeUserRole(id: string, role: UserRole): Promise<User> {
  return api.patch<User>(`/users/${segment(id)}/role`, { role });
}
