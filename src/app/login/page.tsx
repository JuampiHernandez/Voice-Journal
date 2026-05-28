import Link from "next/link";
import { LocalJournalSection } from "@/components/LocalJournalSection";
import { ProductionOnly } from "@/components/ProductionOnly";
import { ShowcaseUserPicker } from "@/components/ShowcaseUserPicker";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20">
      <h1 className="text-2xl font-light text-stone-50">Your journal user</h1>
      <p className="mt-2 text-sm text-stone-500">
        On localhost there is no login — each browser gets its own journal id automatically. Optional{" "}
        <code className="text-amber-200/80">?user=YourName</code> only if you want a readable name
        or a second journal on the same machine.
      </p>

      <ProductionOnly>
        <section className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h2 className="text-sm font-medium text-amber-200/90">Deployed demo (view only)</h2>
          <div className="mt-4">
            <ShowcaseUserPicker compact />
          </div>
        </section>
      </ProductionOnly>

      <LocalJournalSection />

      <p className="mt-8 text-center text-sm text-stone-600">
        <Link href="/" className="text-amber-500/80 hover:text-amber-400">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
