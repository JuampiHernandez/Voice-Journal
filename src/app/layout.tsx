import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voice Journal — Daily check-ins that become your memoir",
  description:
    "A 3-minute daily voice check-in powered by ElevenLabs Speech Engine. Your memories stay on your server.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-950 text-stone-200">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-800/60 py-6 text-center text-xs text-stone-600">
          Built for #ElevenHacks · Speech Engine + Eleven Music · @elevenlabsio
        </footer>
      </body>
    </html>
  );
}
