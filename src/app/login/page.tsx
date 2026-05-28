import Link from "next/link";
import { ProductionOnly } from "@/components/ProductionOnly";
import { ShowcaseUserPicker } from "@/components/ShowcaseUserPicker";
import { DEFAULT_SHOWCASE_USER_ID } from "@/lib/showcase-users";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20">
      <h1 className="text-2xl font-light text-stone-50">Your journal user</h1>
      <p className="mt-2 text-sm text-stone-500">
        On localhost, add your name to the URL — no email or password. Each name gets a separate
        journal on your machine.
      </p>

      <ProductionOnly>
        <section className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h2 className="text-sm font-medium text-amber-200/90">Deployed demo (view only)</h2>
          <div className="mt-4">
            <ShowcaseUserPicker compact />
          </div>
        </section>
      </ProductionOnly>

      <section className="mt-6 rounded-2xl border border-stone-800 bg-stone-900/40 p-6">
        <h2 className="text-sm font-medium text-stone-200">Localhost (full voice)</h2>
        <p className="mt-2 text-sm text-stone-500">
          After <code className="text-amber-200/80">npm run dev:full</code>, open:
        </p>
        <Link
          href="/journal?user=Alex"
          className="mt-3 inline-block text-sm text-amber-400 hover:underline"
        >
          /journal?user=Alex
        </Link>
        <p className="mt-3 text-xs text-stone-600">
          If you already have entries, open <code>/dashboard</code> without changing the URL — your
          browser remembers your journal id.
        </p>
        <Link
          href={`/dashboard?user=${DEFAULT_SHOWCASE_USER_ID}`}
          className="mt-2 block text-xs text-stone-600 hover:text-stone-400"
        >
          Or view the public demo week →
        </Link>
      </section>

      <p className="mt-8 text-center text-sm text-stone-600">
        <Link href="/" className="text-amber-500/80 hover:text-amber-400">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
