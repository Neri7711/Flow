"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createDocument, UNTITLED_DOCUMENT } from "@/entities/document";
import { routes } from "@/shared/config";
import { toast } from "@/shared/lib/toast";

/** Notion-style "new page": creates an untitled page in the space and opens it to name it. */
export function useCreatePage(teamId: string) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const createPage = async () => {
    if (pending) return;
    setPending(true);
    try {
      const page = await createDocument({ teamId, title: UNTITLED_DOCUMENT });
      router.push(routes.document(teamId, page.id));
      // The sidebar tree comes from the layout: refresh it so the new page shows up.
      router.refresh();
    } catch {
      toast("No se pudo crear la página.");
    } finally {
      setPending(false);
    }
  };

  return { createPage, pending };
}
