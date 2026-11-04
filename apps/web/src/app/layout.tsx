import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import { Workspace } from "@/components/workspace";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Review queue | ClearPath", template: "%s | ClearPath" },
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
