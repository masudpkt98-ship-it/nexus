import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
