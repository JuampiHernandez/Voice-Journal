import { VoiceJournalSession } from "@/components/VoiceJournalSession";

export default function JournalPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-3xl flex-col items-center justify-center px-6 py-12">
      <p className="mb-8 text-sm font-light tracking-wide text-stone-500">Today&apos;s check-in</p>
      <VoiceJournalSession />
    </div>
  );
}
