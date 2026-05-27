import { MemoirView } from "@/components/MemoirView";

export default function MemoirPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-light text-stone-100">Year-end memoir</h1>
      <p className="mt-1 text-sm text-stone-500">
        Narrated by ElevenLabs · Scored by Eleven Music
      </p>
      <div className="mt-10">
        <MemoirView />
      </div>
    </div>
  );
}
