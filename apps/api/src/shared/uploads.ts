import { resolve } from "node:path";

/**
 * Where uploaded files live (UPLOADS_DIR, default `./uploads` next to the API).
 * Development storage: in production, mount a persistent volume here or swap for object storage.
 */
export function uploadsDir(): string {
  return resolve(process.env.UPLOADS_DIR ?? "uploads");
}

export function avatarsDir(): string {
  return resolve(uploadsDir(), "avatars");
}
