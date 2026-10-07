"use server";

import { api, query, segment } from "@/shared/api";

import type { Invitation, InvitationPreview, NewInvitation } from "../model/types";

/** Leaders only: invitations of their team that haven't been used yet. */
export async function getPendingInvitations(teamId: string): Promise<readonly Invitation[]> {
  return api.get<Invitation[]>(`/invitations${query({ teamId })}`);
}

/** Leaders only. `token` builds the invitation link; it's only available now. */
export async function createInvitation(input: NewInvitation): Promise<{ invitation: Invitation; token: string }> {
  return api.post("/invitations", input);
}

export async function revokeInvitation(id: string): Promise<void> {
  await api.delete(`/invitations/${segment(id)}`);
}

/** Public: `undefined` when the link is unknown, used or expired. */
export async function getInvitationPreview(token: string): Promise<InvitationPreview | undefined> {
  return api.find<InvitationPreview>(`/invitations/preview/${segment(token)}`, { redirectOnUnauthorized: false });
}
