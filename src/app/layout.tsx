import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { LocalJournalRecovery } from "@/components/LocalJournalRecovery";
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
        <LocalJournalRecovery />
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="py-5 text-center text-[0.65rem] text-stone-700">
          Built for #ElevenHacks · Speech Engine + Eleven Music
        </footer>
      </body>
    </html>
  );
}
