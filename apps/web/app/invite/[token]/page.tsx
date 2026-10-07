import type { Metadata } from "next";

import { InvitePage } from "@/pages/invite";

export const metadata: Metadata = {
  title: "Invitación",
  // One-time links must not end up in search results.
  robots: { index: false, follow: false },
};

export default async function Page({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  return <InvitePage token={token} />;
}
