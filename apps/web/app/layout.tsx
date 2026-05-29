import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "j-entends-rien",
  description: "Turn music into living visuals."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
