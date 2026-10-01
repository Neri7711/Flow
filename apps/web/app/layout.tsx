import type { Metadata } from "next";

import { fontVariables } from "@/app/styles/fonts";
import "@/app/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Flow",
    template: "%s · Flow",
  },
  description: "El espacio de trabajo de los equipos Panteras.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
