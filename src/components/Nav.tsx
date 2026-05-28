"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isClientReadOnly } from "@/lib/runtime";
import { UserBadge } from "./UserBadge";

const links = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/journal", label: "Check-in", match: (p: string) => p.startsWith("/journal") },
  { href: "/threads", label: "Threads", match: (p: string) => p.startsWith("/threads") },
  { href: "/dashboard", label: "Insights", match: (p: string) => p.startsWith("/dashboard") },
  { href: "/memoir", label: "Memoir", match: (p: string) => p.startsWith("/memoir") },
];

export function Nav() {
  const pathname = usePathname();
  const readOnly = isClientReadOnly();

  return (
    <header className="sticky top-0 z-50 border-b border-stone-800/60 bg-stone-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
            <SunIcon />
          </span>
          <span className="font-semibold tracking-tight text-stone-100 transition-colors group-hover:text-amber-200">
            Voice Journal
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 text-sm transition-colors ${
                  active ? "text-stone-100" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-amber-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <UserBadge compact />
          {!readOnly && (
            <Link
              href="/login"
              className="rounded-full border border-amber-500/50 px-4 py-1.5 text-sm text-amber-200/90 transition-colors hover:border-amber-400 hover:bg-amber-500/10"
            >
              Your journal
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
