"use client";

import { Plus } from "lucide-react";

import { useCreatePage } from "@/features/create-page";
import { Button } from "@/shared/ui/button";

export function NewPageButton({ teamId }: { teamId: string }) {
  const { createPage, pending } = useCreatePage(teamId);

  return (
    <Button size="md" onClick={createPage} disabled={pending}>
      <Plus strokeWidth={1.8} />
      Nueva página
    </Button>
  );
}
