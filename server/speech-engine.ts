import { createServer } from "node:http";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { SpeechEngineSession } from "@elevenlabs/elevenlabs-js/wrapper/speech-engine/SpeechEngineSession";
import OpenAI from "openai";
import "dotenv/config";
import { ensureUser, getEntryById, saveJournalEntry } from "../src/lib/memory";
import { buildAgentInstructions } from "../src/lib/agent-instructions";
import { syncSpeechEngineConversationConfig } from "../src/lib/speech-engine-config";
import { consumePendingSessionUser } from "../src/lib/session-user";
import { analyzeTranscript } from "../src/lib/analysis";
import { fetchConversationUserTranscript } from "../src/lib/elevenlabs-conversation";
import { resolveSpeechEngineWsUrl, syncSpeechEngineWsUrl } from "../src/lib/speech-engine-sync";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const SPEECH_ENGINE_ID = process.env.SPEECH_ENGINE_ID;
const PORT = Number(process.env.PORT ?? process.env.SPEECH_ENGINE_PORT ?? 3002);
const HOST = process.env.SPEECH_ENGINE_HOST ?? "0.0.0.0";

type TranscriptMessage = { role: string; content: string };

type SessionMeta = {
  userId: string;
  startedAt: number;
  transcript: TranscriptMessage[];
  saved: boolean;
  entryId?: string;
};

// conversationId is stable; WeakMap session keys were missing transcripts on some disconnects
const sessionMetaByConversation = new Map<string, SessionMeta>();

function getSessionMeta(session: SpeechEngineSession): SessionMeta | undefined {
  const id = session.conversationId;
  if (!id) return undefined;
  return sessionMetaByConversation.get(id);
}

async function resolveUserTranscript(
  session: SpeechEngineSession,
  meta: SessionMeta | undefined
): Promise<string> {
  const fromMeta = (meta?.transcript ?? [])
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n")
    .trim();

  if (fromMeta) return fromMeta;

  const conversationId = session.conversationId;
  if (!conversationId) return "";

  console.log(
    `[SpeechEngine] no WS transcript for ${conversationId} — fetching from ElevenLabs API`
  );

  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt > 0) await sleep(1500);
    const fetched = await fetchConversationUserTranscript(conversationId);
    if (fetched?.transcript) {
      console.log(`[SpeechEngine] ElevenLabs transcript ready (attempt ${attempt + 1})`);
      if (meta) {
        meta.transcript = fetched.transcript.split("\n").map((content) => ({
          role: "user",
          content,
        }));
      }
      return fetched.transcript;
    }
    console.log(
      `[SpeechEngine] transcript poll ${attempt + 1}/8:`,
      fetched?.error ?? "not ready"
    );
  }

  return "";
}

function userTranscriptFromMeta(meta: SessionMeta): string {
  return meta.transcript
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n")
    .trim();
}

/** Write partial transcript so the client poll succeeds even if the WS drops mid-session */
async function checkpointTranscript(
  meta: SessionMeta,
  conversationId: string | undefined
): Promise<void> {
  const userLines = userTranscriptFromMeta(meta);
  if (!userLines || !conversationId) return;

  const durationSeconds = Math.round((Date.now() - meta.startedAt) / 1000);
  const payload = {
    userId: meta.userId,
    transcript: userLines,
    summary: "Processing your check-in…",
    mood: 5,
    themes: [] as string[],
    durationSeconds,
    conversationId,
  };

  if (meta.entryId) {
    await saveJournalEntry({ ...payload, entryId: meta.entryId });
    return;
  }

  meta.entryId = await saveJournalEntry(payload);
  console.log(`[SpeechEngine] checkpoint entry ${meta.entryId} for ${conversationId}`);
}

async function persistSession(session: SpeechEngineSession, reason: string) {
  const meta = getSessionMeta(session);
  if (!meta || meta.saved) return;

  const userLines = await resolveUserTranscript(session, meta);

  if (!userLines) {
    console.log(`Session ended (${reason}, no user speech):`, session.conversationId);
    sessionMetaByConversation.delete(session.conversationId ?? "");
    return;
  }

  meta.saved = true;

  try {
    const durationSeconds = Math.round((Date.now() - meta.startedAt) / 1000);

    if (!meta.entryId) {
      meta.entryId = await saveJournalEntry({
        userId: meta.userId,
        transcript: userLines,
        summary: "Processing your check-in…",
        mood: 5,
        themes: [],
        durationSeconds,
        conversationId: session.conversationId,
      });
    } else {
      await saveJournalEntry({
        userId: meta.userId,
        entryId: meta.entryId,
        transcript: userLines,
        summary: "Processing your check-in…",
        mood: 5,
        themes: [],
        durationSeconds,
        conversationId: session.conversationId,
      });
    }

    const analysis = await analyzeTranscript(userLines);

    await saveJournalEntry({
      userId: meta.userId,
      entryId: meta.entryId,
      transcript: userLines,
      summary: analysis.summary,
      mood: analysis.mood,
      themes: analysis.themes,
      durationSeconds,
      conversationId: session.conversationId,
      emotionalMoments: analysis.emotionalMoments,
      openThread: analysis.openThread,
    });

    const saved = await getEntryById(meta.userId, meta.entryId);
    console.log(`Saved journal entry (${reason}) for`, meta.userId, saved?.entry_date);
  } catch (err) {
    meta.saved = false;
    console.error("Failed to save journal entry:", err);
  } finally {
    sessionMetaByConversation.delete(session.conversationId ?? "");
  }
}

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});

async function main() {
  httpServer.listen(PORT, HOST, () => {
    console.log(`Voice Journal Speech Engine listening on http://${HOST}:${PORT}`);
    console.log(`WebSocket: ws://${HOST}:${PORT}/ws`);
    console.log(`Speech Engine ID: ${SPEECH_ENGINE_ID ?? "not configured"}`);
    const publicWs = resolveSpeechEngineWsUrl();
    if (publicWs) {
      console.log(`Public WebSocket: ${publicWs}`);
    } else if (process.env.RAILWAY_ENVIRONMENT) {
      console.warn(
        "Railway: generate a public domain in Settings → Networking, then restart (or set SPEECH_ENGINE_WS_URL)"
      );
    }
    console.log(`Journal DB: Supabase (${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not configured"})`);
  });

  const missing = [
    !process.env.ELEVENLABS_API_KEY && "ELEVENLABS_API_KEY",
    !process.env.OPENAI_API_KEY && "OPENAI_API_KEY",
    !SPEECH_ENGINE_ID && "SPEECH_ENGINE_ID",
  ].filter(Boolean);

  if (missing.length > 0) {
    console.warn(
      `Speech Engine not attached yet. Missing: ${missing.join(", ")}. /health will still pass for Railway setup.`
    );
    return;
  }

  const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const sync = await syncSpeechEngineWsUrl();
  const convConfig = await syncSpeechEngineConversationConfig();
  if (convConfig.updated) {
    console.log("Speech Engine conversation config updated (eager turns + interruptions)");
  } else if (!convConfig.ok) {
    console.warn("Speech Engine conversation config:", convConfig.error);
  }

  if (!sync.ok) {
    console.warn("Speech Engine URL sync warning:", sync.error);
    console.warn(
      "Starting server anyway — ensure ngrok is up, then run: npm run sync:speech-engine"
    );
  } else if (sync.updated) {
    console.log(`Updated ElevenLabs wsUrl: ${sync.registered} → ${sync.expected}`);
  } else {
    console.log(`ElevenLabs wsUrl OK: ${sync.expected}`);
  }

  await elevenlabs.speechEngine.attach(SPEECH_ENGINE_ID!, httpServer, "/ws", {
    debug: true,

    async onInit(conversationId, session) {
      const userId = await consumePendingSessionUser();
      await ensureUser(userId);
      sessionMetaByConversation.set(conversationId, {
        userId,
        startedAt: Date.now(),
        transcript: [],
        saved: false,
      });
      console.log("Session started:", conversationId, "user:", userId);
    },

    async onTranscript(transcript, signal, session) {
      try {
        const meta = getSessionMeta(session);
        const userId = meta?.userId ?? "demo-user";
        await ensureUser(userId);

        const userLines = transcript.filter((m) => m.role === "user");
        console.log(
          `[SpeechEngine] transcript event_id=${session.conversationId} total=${transcript.length} user=${userLines.length}`,
          userLines.map((m) => m.content.slice(0, 60)).join(" | ") || "(no user speech yet)"
        );

        const instructions = await buildAgentInstructions(userId);

        if (meta) {
          meta.transcript = transcript.map((m) => ({
            role: m.role,
            content: m.content,
          }));
          console.log(
            `[SpeechEngine] transcript update (${transcript.length} messages):`,
            transcript.map((m) => `${m.role}: ${m.content.slice(0, 60)}`).join(" | ")
          );
        }

        const response = await openai.responses.create(
          {
            model: "gpt-4o-mini",
            instructions,
            input: transcript.map((m) => ({
              role: m.role === "agent" ? "assistant" : m.role,
              content: m.content,
            })),
            stream: true,
          },
          { signal }
        );

        await session.sendResponse(response);

        if (meta) {
          void checkpointTranscript(meta, session.conversationId).catch((e) =>
            console.error("[SpeechEngine] checkpoint failed:", e)
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error(
          `[SpeechEngine] onTranscript failed (${session.conversationId}):`,
          err
        );
        try {
          await session.sendResponse(
            "I'm having a brief technical hiccup — go ahead, I'm still listening."
          );
        } catch {
          /* session may already be closed */
        }
      }
    },

    async onClose(session) {
      await persistSession(session, "close");
    },

    async onDisconnect(session) {
      // Browser "End early" / tab close triggers disconnect, not close
      await persistSession(session, "disconnect");
    },

    onError(err) {
      console.error("Speech Engine error:", err);
    },
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
