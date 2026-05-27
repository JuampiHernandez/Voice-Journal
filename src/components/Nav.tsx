import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/journal", label: "Check-in" },
  { href: "/threads", label: "Threads" },
  { href: "/dashboard", label: "Insights" },
  { href: "/memoir", label: "Memoir" },
];

export function Nav() {
  return (
    <header className="border-b border-stone-800/60 bg-stone-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30 text-sm">
            ◉
          </span>
          <span className="font-semibold tracking-tight text-stone-100 group-hover:text-amber-200 transition-colors">
            Voice Journal
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm text-stone-400 hover:text-amber-200 hover:bg-stone-800/60 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
