import { redirect } from "next/navigation";

// No real session yet: the entry point is always the login screen.
export default function Home() {
  redirect("/login");
}
