"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export type FilterOption = { id: string; label: string; icon?: ReactNode };

type FilterMenuProps = {
  label: string;
  options: readonly FilterOption[];
  selected: ReadonlySet<string>;
  onChange: (selected: ReadonlySet<string>) => void;
};

/** Pill dropdown with multi-select checkboxes ("Responsable · 2"). */
export function FilterMenu({ label, options, selected, onChange }: FilterMenuProps) {
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (!next.delete(id)) next.add(id);
    onChange(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          selected.size > 0 ? "border-ink bg-surface font-medium" : "border-line hover:border-line-strong",
        )}
      >
        {label}
        {selected.size > 0 && <span className="font-mono text-[11px] text-ink-muted">· {selected.size}</span>}
        <ChevronDown className="size-[13px] text-ink-muted" strokeWidth={1.8} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 rounded-[14px] border border-line p-1.5 shadow-float ring-0">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.id}
            checked={selected.has(option.id)}
            onCheckedChange={() => toggle(option.id)}
            onSelect={(event) => event.preventDefault()}
            className="gap-2 rounded-[10px] text-sm"
          >
            {option.icon}
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange(new Set())} className="rounded-[10px] text-sm text-ink-muted">
              Quitar filtro
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
