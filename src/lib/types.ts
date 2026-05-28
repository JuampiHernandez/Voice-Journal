export type JournalEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  transcript: string;
  summary: string | null;
  mood: number | null;
  themes: string | null;
  open_thread: string | null;
  duration_seconds: number;
  conversation_id: string | null;
  created_at: string;
};

export type EmotionalMoment = {
  id: string;
  user_id: string;
  entry_id: string | null;
  moment_date: string;
  description: string;
  emotion: string;
  intensity: number;
  created_at: string;
};

export type MindThread = {
  id: string;
  title: string;
  summary: string;
  intensity: number;
  trend: "rising" | "stable" | "fading";
  mentionCount: number;
  firstSeen: string;
  lastSeen: string;
  focusPriority: number;
  suggestedActions: string[];
  relatedDates: string[];
};

export type WorryThread = MindThread;
export type BrightThread = MindThread;
