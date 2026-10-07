"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { User } from "@/entities/user";
import { api, ApiError, SESSION_COOKIE } from "@/shared/api";

/** Matches the API's default token lifetime (JWT_EXPIRES_IN); an expired token just sends you back here. */
const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7;

type Session = { token: string; user: User };

/** Keeps the API token in an httpOnly cookie and lands in the user's space. */
async function startSession({ token, user }: Session): Promise<never> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  redirect(`/${user.teamId}`);
}

export type SignInState = { error: string | null; email: string };

/** Form action: signs in against the API. */
export async function signIn(_previous: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña.", email };

  let session: Session;
  try {
    session = await api.post("/auth/login", { email, password }, { redirectOnUnauthorized: false });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { error: "Correo o contraseña incorrectos.", email };
    if (error instanceof ApiError && error.status === 400) return { error: "Escribe un correo válido.", email };
    if (error instanceof ApiError && error.status === 429) return { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.", email };
    return { error: "No pudimos iniciar sesión. Inténtalo de nuevo en un momento.", email };
  }
  return startSession(session);
}

export type AcceptInvitationState = { error: string | null };

/** Form action: the invited person chooses a password; the account is created and signed in. */
export async function acceptInvitation(_previous: AcceptInvitationState, form: FormData): Promise<AcceptInvitationState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== String(form.get("confirm") ?? "")) return { error: "Las contraseñas no coinciden." };

  let session: Session;
  try {
    session = await api.post("/invitations/accept", { token, password }, { redirectOnUnauthorized: false });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { error: "Esta invitación ya se usó o expiró. Pide una nueva a tu líder." };
    if (error instanceof ApiError && error.status === 409) return { error: "Ya existe una cuenta con este correo. Inicia sesión." };
    return { error: "No pudimos crear tu cuenta. Inténtalo de nuevo en un momento." };
  }
  return startSession(session);
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
