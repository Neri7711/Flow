"use client";

import { type Ref, useImperativeHandle, useState } from "react";
import { type Editor, Extension, type Range, ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";
import { Calendar, Code, Heading2, type LucideIcon, MessageSquareQuote, SquareCheck, Table, Type } from "lucide-react";

import { normalize } from "@/shared/lib/text-match";
import { cn } from "@/shared/lib/utils";
import { Eyebrow } from "@/shared/ui/eyebrow";

type SlashItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Missing for blocks not available yet (shown disabled). */
  run?: (editor: Editor, range: Range) => void;
};

const ITEMS: SlashItem[] = [
  {
    title: "Texto",
    description: "Empieza a escribir normalmente",
    icon: Type,
    run: (editor, range) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Encabezado",
    description: "Título de sección",
    icon: Heading2,
    run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: "Lista de tareas",
    description: "Pendientes con casillas",
    icon: SquareCheck,
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  { title: "Tabla", description: "Base de datos con propiedades", icon: Table },
  { title: "Calendario", description: "Eventos por fecha", icon: Calendar },
  {
    title: "Callout",
    description: "Nota destacada",
    icon: MessageSquareQuote,
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertContent({ type: "callout", content: [{ type: "paragraph" }] }).run(),
  },
  {
    title: "Código",
    description: "Bloque de terminal",
    icon: Code,
    run: (editor, range) => editor.chain().focus().deleteRange(range).setCodeBlock().run(),
  },
];

type SlashMenuHandle = { onKeyDown: (props: SuggestionKeyDownProps) => boolean };
type SlashMenuProps = SuggestionProps<SlashItem, SlashItem> & { ref?: Ref<SlashMenuHandle> };

function SlashMenu({ items, command, ref }: SlashMenuProps) {
  const [active, setActive] = useState(0);
  // Reset the highlight whenever the filtered list changes (render-time state adjustment).
  const [lastItems, setLastItems] = useState(items);
  if (lastItems !== items) {
    setLastItems(items);
    setActive(0);
  }

  const choose = (index: number) => {
    const item = items[index];
    if (item?.run) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      switch (event.key) {
        case "ArrowDown":
          setActive((index) => (index + 1) % items.length);
          return true;
        case "ArrowUp":
          setActive((index) => (index - 1 + items.length) % items.length);
          return true;
        case "Enter":
          choose(active);
          return true;
        default:
          return false;
      }
    },
  }));

  if (items.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Insertar bloque"
      className="flex w-80 flex-col gap-0.5 rounded-[18px] border border-line bg-surface p-2 shadow-float"
    >
      <Eyebrow className="px-2.5 pt-1.5 pb-1 text-[10px]">Bloques básicos</Eyebrow>
      {items.map((item, index) => {
        const Icon = item.icon;
        const disabled = !item.run;

        return (
          <button
            key={item.title}
            type="button"
            role="option"
            aria-selected={index === active}
            aria-disabled={disabled}
            onMouseEnter={() => setActive(index)}
            onClick={() => choose(index)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left",
              index === active && "bg-team-soft",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface">
              <Icon className="size-4" strokeWidth={1.8} />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{item.title}</span>
              <span className="text-xs text-ink-muted">{disabled ? "Próximamente" : item.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Notion-style "/" menu to insert blocks. */
export const SlashCommand = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: "/",
        items: ({ query }) => ITEMS.filter((item) => normalize(item.title).includes(normalize(query))),
        command: ({ editor, range, props }) => props.run?.(editor, range),
        render: () => {
          let component: ReactRenderer<SlashMenuHandle, SlashMenuProps> | undefined;
          let unmount: (() => void) | undefined;

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenu, { props, editor: props.editor });
              // The element inherits the space theme (data-team) from the editor's root.
              const themed = props.editor.view.dom.closest("[data-team]")?.getAttribute("data-team");
              if (themed) component.element.setAttribute("data-team", themed);
              component.element.style.zIndex = "50";
              unmount = props.mount(component.element);
            },
            onUpdate: (props) => component?.updateProps(props),
            onKeyDown: (props) => {
              if (props.event.key === "Escape") return false;
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              unmount?.();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});
