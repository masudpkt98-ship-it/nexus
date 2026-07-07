import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

// Self-hosted Inter (variable weight, latin) — no build-time network fetch.
const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEXUS — Competency & Performance Nexus",
  description:
    "Connecting Excellence. Driving Performance. The digital operating system for competency & performance management.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-nexus-radial">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
