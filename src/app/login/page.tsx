import { AuthPanel } from "@/components/AuthPanel";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-2xl font-light text-stone-50">Sign in to your journal</h1>
      <p className="mt-2 text-sm text-stone-500">
        Magic link — no password. Your entries stay in this app&apos;s database, not ElevenAgents
        memory.
      </p>
      <div className="mt-8">
        <AuthPanel />
      </div>
      <p className="mt-8 text-center text-sm text-stone-600">
        <Link href="/" className="text-amber-500/80 hover:text-amber-400">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
