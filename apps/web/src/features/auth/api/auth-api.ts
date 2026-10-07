"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { User } from "@/entities/user";
import { api, ApiError, SESSION_COOKIE } from "@/shared/api";

/** Matches the API's default token lifetime (JWT_EXPIRES_IN); an expired token just sends you back here. */
const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7;

export type SignInState = { error: string | null; email: string };

/** Form action: signs in against the API and keeps its token in an httpOnly cookie. */
export async function signIn(_previous: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña.", email };

  let session: { token: string; user: User };
  try {
    session = await api.post("/auth/login", { email, password }, { redirectOnUnauthorized: false });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { error: "Correo o contraseña incorrectos.", email };
    if (error instanceof ApiError && error.status === 400) return { error: "Escribe un correo válido.", email };
    return { error: "No pudimos iniciar sesión. Inténtalo de nuevo en un momento.", email };
  }

  (await cookies()).set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  redirect(`/${session.user.teamId}`);
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
