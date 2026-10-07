import { redirect } from "next/navigation";

import { getSessionUser } from "@/entities/user";

// Entry point: straight to your home space when signed in, otherwise the login screen.
export default async function Home() {
  const user = await getSessionUser();
  redirect(user ? `/${user.teamId}` : "/login");
}
