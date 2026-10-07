import { LogOut } from "lucide-react";

import { signOut } from "../api/auth-api";

/** Works without JavaScript: a plain form posting to the sign-out Server Function. */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut} className={className}>
      <button
        type="submit"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="flex cursor-pointer rounded-lg p-1.5 text-ink-muted hover:bg-surface/60 hover:text-ink"
      >
        <LogOut className="size-4" strokeWidth={1.8} />
      </button>
    </form>
  );
}
