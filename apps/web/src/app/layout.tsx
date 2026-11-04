import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import { Workspace } from "@/components/workspace";
import "./globals.css";

export const metadata: Metadata = {
  // Every route names itself, so the default is only ever reached by a 404 — which is
  // not the review queue, whatever the old default claimed.
  title: { default: "ClearPath", template: "%s | ClearPath" },
  description: "A review workspace for financial marketing copy.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Workspace>{children}</Workspace>
      </body>
    </html>
  );
}
