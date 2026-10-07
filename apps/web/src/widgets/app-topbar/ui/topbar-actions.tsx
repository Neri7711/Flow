"use client";

import { useRouter } from "next/navigation";
import { Ellipsis, Link as LinkIcon, Share, Trash2 } from "lucide-react";

import { deleteDocument } from "@/entities/document";
import { routes } from "@/shared/config";
import { copyText } from "@/shared/lib/clipboard";
import { toast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";

export type TopbarPage = { id: string; teamId: string; title: string };

const copyCurrentLink = async () => {
  toast(
    (await copyText(window.location.href))
      ? "Enlace copiado. Cualquiera de los equipos con cuenta en Flow puede abrirlo."
      : "No se pudo copiar el enlace.",
  );
};

/** "Compartir" and "Más opciones" of the top bar (same look; now they do something). */
export function TopbarActions({ page }: { page?: TopbarPage }) {
  const router = useRouter();

  const removePage = async () => {
    if (!page) return;
    if (!window.confirm(`¿Eliminar “${page.title}” y todas sus subpáginas? No se puede deshacer.`)) return;
    try {
      await deleteDocument(page.id);
      toast(<>Se eliminó <b>{page.title}</b>.</>);
      router.push(routes.space(page.teamId));
      router.refresh();
    } catch {
      toast("No se pudo eliminar la página.");
    }
  };

  return (
    <>
      <Button onClick={copyCurrentLink}>
        <Share strokeWidth={1.8} />
        Compartir
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Más opciones">
            <Ellipsis strokeWidth={1.8} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-[14px] border border-line p-1.5 shadow-float ring-0">
          <DropdownMenuItem onSelect={copyCurrentLink} className="gap-2 rounded-[10px] text-sm">
            <LinkIcon className="size-3.5" strokeWidth={1.8} />
            Copiar enlace
          </DropdownMenuItem>
          {page && (
            <DropdownMenuItem onSelect={removePage} className="gap-2 rounded-[10px] text-sm">
              <Trash2 className="size-3.5" strokeWidth={1.8} />
              Eliminar página
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
