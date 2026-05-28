"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Conversation } from "@elevenlabs/client";
import type { DisconnectionDetails, Mode, Status } from "@elevenlabs/client";
import { TimerRing } from "./TimerRing";
import { VoiceWave } from "./VoiceWave";
import { authConfigured, useJournalUser } from "@/hooks/useJournalUser";

const SESSION_SECONDS = 180;
const MIN_SESSION_MS = 8000; // don't treat disconnect as "done" before this unless we heard speech
const FINALIZE_TIMEOUT_MS = 45_000;
const SERVER_POLL_ATTEMPTS = 12;
const IMPORT_RETRY_ATTEMPTS = 10;

type SessionStatus = "idle" | "connecting" | "active" | "ending" | "done" | "error";

type DebugEntry = { t: number; msg: string };

function ts() {
  return new Date().toLocaleTimeString();
}

export function VoiceJournalSession() {
  const { userId, ready, mode: journalMode } = useJournalUser();
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [agentText, setAgentText] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Status>("disconnected");
  const [mode, setMode] = useState<Mode>("listening");
  const [vadScore, setVadScore] = useState(0);
  const [debugLog, setDebugLog] = useState<DebugEntry[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [ngrokWarning, setNgrokWarning] = useState<string | null>(null);
  const [interruptionCount, setInterruptionCount] = useState(0);
  const [connectionLost, setConnectionLost] = useState(false);

  useEffect(() => {
    if (window.location.search.includes("debug")) setShowDebug(true);
  }, []);

  const conversationRef = useRef<Awaited<ReturnType<typeof Conversation.startSession>> | null>(
    null
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userTranscriptRef = useRef<string[]>([]);
  const conversationIdRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef<number>(0);
  const isEndingRef = useRef(false);
  const hadActivityRef = useRef(false);
  const userEndedRef = useRef(false);
  const connectionLostRef = useRef(false);
  const disconnectHandledRef = useRef(false);

  const log = useCallback((msg: string) => {
    console.log(`[VoiceJournal] ${msg}`);
    setDebugLog((prev) => [...prev.slice(-30), { t: Date.now(), msg }]);
  }, []);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        log(`config: speechEngineReady=${data.speechEngineReady}, health=${data.speechEngineHealth?.ok}`);
        if (data.speechEngineWsUrl) log(`wsUrl: ${data.speechEngineWsUrl}`);
        if (data.speechEngineTunnelReachable === false || data.ngrokTunnelReachable === false) {
          const msg =
            data.speechEngineTunnelError ??
            data.ngrokTunnelError ??
            "Speech Engine offline — check Railway deploy or run npm run dev:voice locally";
          setNgrokWarning(msg);
          log(`Speech Engine tunnel OFFLINE: ${msg}`);
        } else {
          setNgrokWarning(null);
          log("Speech Engine tunnel reachable");
        }
        if (!data.speechEngineReady) {
          setSetupError(
            `Speech Engine not ready. Missing: ${data.missing.join(", ")}. See docs/DEPLOY.md`
          );
        } else if (!data.speechEngineHealth?.ok) {
          setSetupError(
            data.speechEngineHealth?.error ??
              "Speech Engine server unreachable. Deploy to Railway or run npm run speech-engine locally."
          );
        }
      })
      .catch(() => setSetupError("Could not verify Speech Engine configuration."));
  }, [log]);

  const waitForServerSave = useCallback(
    async (maxAttempts = SERVER_POLL_ATTEMPTS, delayMs = 1000) => {
      const conversationId = conversationIdRef.current;
      if (!conversationId) {
        log("poll: no conversationId");
        return null;
      }

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const res = await fetch(
          `/api/check-in/status?userId=${encodeURIComponent(userId)}&conversationId=${encodeURIComponent(conversationId)}`,
          { credentials: "include" }
        );
        const data = (await res.json()) as { saved?: boolean; summary?: string | null };

        log(`poll #${attempt + 1}: saved=${data.saved}`);

        if (data.saved) {
          return data.summary ?? "Entry saved.";
        }
      }

      return null;
    },
    [log, userId]
  );

  const saveClientCheckIn = useCallback(async () => {
    const transcript = userTranscriptRef.current.join("\n").trim();
    log(`client save: ${transcript.length} chars, ${userTranscriptRef.current.length} lines`);
    if (!transcript) return null;

    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - sessionStartedAtRef.current) / 1000)
    );

    const res = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        userId,
        transcript,
        durationSeconds,
        conversationId: conversationIdRef.current,
      }),
    });

    const data = (await res.json()) as {
      error?: string;
      summary?: string;
      entryDate?: string;
      note?: string;
    };
    if (!res.ok) {
      setError(data.error ?? "Failed to save check-in");
      return null;
    }

    const label = data.summary ?? "Entry saved.";
    return data.note ? `${label} (${data.note})` : label;
  }, [log, userId]);

  const importFromElevenLabs = useCallback(async () => {
    const conversationId = conversationIdRef.current;
    if (!conversationId) return null;

    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - sessionStartedAtRef.current) / 1000)
    );

    log(`importing transcript from ElevenLabs API for ${conversationId}`);
    const res = await fetch("/api/check-in/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, conversationId, durationSeconds }),
    });

    const data = (await res.json()) as {
      saved?: boolean;
      summary?: string;
      error?: string;
      source?: string;
    };

    log(`import: saved=${data.saved}, source=${data.source}, error=${data.error ?? "none"}`);

    if (!res.ok || !data.saved) return null;
    return data.summary ?? "Entry saved from ElevenLabs.";
  }, [log, userId]);

  const tryRecoverTranscript = useCallback(
    async (deadlineMs: number): Promise<string | null> => {
      let attempts = 0;
      while (Date.now() < deadlineMs && attempts < IMPORT_RETRY_ATTEMPTS) {
        attempts += 1;
        const imported = await importFromElevenLabs();
        if (imported) return imported;

        const polled = await waitForServerSave(3, 800);
        if (polled && polled !== "Processing your check-in…") return polled;

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      return null;
    },
    [importFromElevenLabs, waitForServerSave]
  );

  const finishWithSummary = useCallback((summary: string) => {
    setSaveStatus(summary);
    setError(null);
    connectionLostRef.current = false;
    disconnectHandledRef.current = false;
    setConnectionLost(false);
    setStatus("done");
  }, []);

  const finalizeSession = useCallback(
    async (options?: { endConversation?: boolean; connectionDropped?: boolean }) => {
      if (isEndingRef.current) return;
      isEndingRef.current = true;
      userEndedRef.current = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setStatus("ending");
      const finalizeStarted = Date.now();
      const deadline = finalizeStarted + FINALIZE_TIMEOUT_MS;
      const elapsed = Date.now() - sessionStartedAtRef.current;
      log(
        `finalize: elapsed=${elapsed}ms, activity=${hadActivityRef.current}, clientLines=${userTranscriptRef.current.length}, conv=${conversationIdRef.current}`
      );

      if (options?.endConversation !== false && conversationRef.current) {
        try {
          await conversationRef.current.endSession();
          log("endSession() ok");
        } catch (e) {
          log(`endSession() error: ${e instanceof Error ? e.message : "unknown"}`);
        }
        conversationRef.current = null;
      }

      const serverSummary = await waitForServerSave(5, 600);
      if (serverSummary && serverSummary !== "Processing your check-in…") {
        finishWithSummary(serverSummary);
        return;
      }

      const hasClientTranscript = userTranscriptRef.current.join("\n").trim().length > 0;

      if (!hasClientTranscript) {
        const recovered = await tryRecoverTranscript(deadline);
        if (recovered) {
          finishWithSummary(recovered);
          return;
        }
      }

      const clientSummary = await saveClientCheckIn();
      if (clientSummary) {
        finishWithSummary(clientSummary);
        return;
      }

      if (hasClientTranscript) {
        const recovered = await tryRecoverTranscript(deadline);
        if (recovered) {
          finishWithSummary(recovered);
          return;
        }
      }

      const lateServerSummary = await waitForServerSave(
        Math.max(2, Math.floor((deadline - Date.now()) / 1000)),
        1000
      );
      if (lateServerSummary && lateServerSummary !== "Processing your check-in…") {
        finishWithSummary(lateServerSummary);
        return;
      }

      setSaveStatus(null);
      const lines = userTranscriptRef.current.length;
      const secs = Math.round(elapsed / 1000);
      const dropped = options?.connectionDropped ?? connectionLostRef.current;
      const reason = dropped
        ? "The voice connection dropped before your check-in could be saved."
        : "No speech was captured.";
      setError(
        `${reason} (${secs}s, ${lines} client lines). ` +
          `Tap Start to try again. If this keeps happening, check Speech Engine on Railway (/health) or your network.`
      );
      connectionLostRef.current = false;
      disconnectHandledRef.current = false;
      setConnectionLost(false);
      setStatus("error");
      setShowDebug(true);
      isEndingRef.current = false;
      userEndedRef.current = false;
    },
    [finishWithSummary, log, saveClientCheckIn, tryRecoverTranscript, waitForServerSave]
  );

  const abortEnding = useCallback(() => {
    isEndingRef.current = false;
    userEndedRef.current = false;
    disconnectHandledRef.current = false;
    connectionLostRef.current = false;
    setConnectionLost(false);
    setSaveStatus(null);
    setStatus("error");
    setError("Save cancelled. Tap Start to try again.");
    setShowDebug(true);
  }, []);

  const recoverFromDisconnect = useCallback(
    (reason: string) => {
      if (disconnectHandledRef.current || isEndingRef.current || userEndedRef.current) return;
      disconnectHandledRef.current = true;

      const elapsed = Date.now() - sessionStartedAtRef.current;
      log(
        `disconnect: reason=${reason}, elapsed=${elapsed}ms, activity=${hadActivityRef.current}, clientLines=${userTranscriptRef.current.length}`
      );

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      conversationRef.current = null;

      connectionLostRef.current = true;
      setConnectionLost(true);

      // Connection dropped before any real conversation — let user retry, don't "save"
      if (!hadActivityRef.current && elapsed < MIN_SESSION_MS) {
        setError(
          `Voice connection dropped after ${Math.round(elapsed / 1000)}s (${reason}). ` +
            `Wait for the agent greeting, then speak. Tap Start to retry.`
        );
        connectionLostRef.current = false;
        setConnectionLost(false);
        setStatus("error");
        setShowDebug(true);
        disconnectHandledRef.current = false;
        isEndingRef.current = false;
        return;
      }

      void finalizeSession({ endConversation: false, connectionDropped: true });
    },
    [finalizeSession, log]
  );

  const handleUnexpectedDisconnect = useCallback(
    (details: DisconnectionDetails) => {
      recoverFromDisconnect(details.reason);
    },
    [recoverFromDisconnect]
  );

  const startSession = useCallback(async () => {
    if (setupError || !ready) return;

    setError(null);
    setSaveStatus(null);
    connectionLostRef.current = false;
    disconnectHandledRef.current = false;
    setConnectionLost(false);
    setStatus("connecting");
    setSecondsLeft(SESSION_SECONDS);
    setAgentText("");
    userTranscriptRef.current = [];
    conversationIdRef.current = null;
    sessionStartedAtRef.current = Date.now();
    isEndingRef.current = false;
    userEndedRef.current = false;
    hadActivityRef.current = false;
    setInterruptionCount(0);
    setDebugLog([]);

    try {
      log("requesting mic permission…");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      log("mic permission granted");

      log(`fetching token for ${userId}`);
      const res = await fetch(`/api/conversation-token?userId=${encodeURIComponent(userId)}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? data.hint ?? "Failed to get conversation token");
      }
      log("token received");

      const conversation = await Conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
        overrides: {
          agent: {
            firstMessage:
              "Hey — I'm here with you for three minutes. What's weighing on you most right now?",
          },
        },
        onInterruption: () => {
          hadActivityRef.current = true;
          setInterruptionCount((n) => n + 1);
          log("barge-in: turn interrupted");
        },
        onConnect: ({ conversationId }) => {
          conversationIdRef.current = conversationId;
          log(`connected: ${conversationId}`);
          setStatus("active");
        },
        onDisconnect: handleUnexpectedDisconnect,
        onError: (message, context) => {
          log(`error: ${message} ${context ? JSON.stringify(context) : ""}`);
          // Non-fatal server warnings — keep session alive; disconnect handler will finalize
          if (!isEndingRef.current && !disconnectHandledRef.current) {
            setSaveStatus(null);
            return;
          }
          setError(`Voice error: ${message}. Is Speech Engine deployed (Railway) or running locally?`);
          setStatus("error");
          setShowDebug(true);
        },
        onStatusChange: ({ status: s }) => {
          setConnectionStatus(s);
          log(`status: ${s}`);
          if (
            s === "disconnected" &&
            !isEndingRef.current &&
            !userEndedRef.current &&
            sessionStartedAtRef.current > 0 &&
            conversationIdRef.current
          ) {
            log("status disconnected while session active — recovering");
            recoverFromDisconnect("disconnected");
          }
        },
        onModeChange: ({ mode: m }) => {
          setMode(m);
          if (m === "listening") hadActivityRef.current = true;
        },
        onVadScore: ({ vadScore: score }) => {
          setVadScore(score);
          if (score > 0.5) hadActivityRef.current = true;
        },
        onMessage: (msg) => {
          if (msg.source === "ai" || msg.role === "agent") {
            hadActivityRef.current = true;
            setAgentText(msg.message);
            log(`agent: ${msg.message.slice(0, 80)}`);
            return;
          }
          if (msg.source === "user" || msg.role === "user") {
            hadActivityRef.current = true;
            const lines = userTranscriptRef.current;
            const last = lines[lines.length - 1];
            if (msg.message !== last) {
              lines.push(msg.message);
              log(`user: ${msg.message.slice(0, 80)}`);
            }
          }
        },
      });

      conversationRef.current = conversation;
      log("session started");

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            void finalizeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start session";
      log(`start failed: ${msg}`);
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setError("Microphone blocked. Allow mic access in browser settings and retry.");
      } else {
        setError(msg);
      }
      setStatus("error");
      setShowDebug(true);
    }
  }, [finalizeSession, handleUnexpectedDisconnect, log, ready, recoverFromDisconnect, setupError, userId]);

  // Only end session on page unload — NOT on React strict-mode remount
  useEffect(() => {
    const onUnload = () => {
      conversationRef.current?.endSession();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  const elapsedSec =
    status !== "idle"
      ? Math.round((Date.now() - sessionStartedAtRef.current) / 1000)
      : 0;

  const agentSpeaking = status === "active" && mode === "speaking";
  const userSpeaking = status === "active" && mode === "listening" && vadScore > 0.35;
  const sessionNotice = setupError ?? (!setupError && ngrokWarning ? ngrokWarning : null);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      {sessionNotice && (
        <p className="w-full rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-left text-xs leading-relaxed text-amber-200/80">
          {ngrokWarning && !setupError ? `⚠ ${ngrokWarning}` : sessionNotice}
        </p>
      )}

      <div className="flex flex-col items-center gap-3">
        <TimerRing
          secondsLeft={secondsLeft}
          totalSeconds={SESSION_SECONDS}
          isActive={status === "active"}
          isEnding={status === "ending"}
          agentSpeaking={agentSpeaking}
        />

        <div className="flex h-10 items-end justify-center">
          <VoiceWave active={agentSpeaking} />
          {!agentSpeaking && userSpeaking && (
            <VoiceWave active variant="user" bars={10} className="opacity-50" />
          )}
        </div>
      </div>

      {agentText && status === "active" && (
        <div className="w-full rounded-2xl border border-stone-800/50 bg-stone-900/20 px-5 py-4 backdrop-blur-sm">
          <p className="text-center text-[0.95rem] leading-relaxed text-stone-300">
            &ldquo;{agentText}&rdquo;
          </p>
        </div>
      )}

      {ready && journalMode === "guest" && authConfigured() && (
        <p className="w-full rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-center text-xs text-amber-200/90">
          Not signed in — this check-in saves to a guest profile.{" "}
          <Link href="/login" className="underline hover:text-amber-100">
            Sign in
          </Link>{" "}
          so it appears in Insights.
        </p>
      )}

      {error && (
        <p className="w-full rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-center text-xs text-rose-300">
          {error}
        </p>
      )}

      <div className="flex min-h-[5.5rem] flex-col items-center justify-center gap-3 pt-2">
        {!ready ? (
          <p className="text-sm text-stone-500">Loading your account…</p>
        ) : status === "idle" || status === "error" || status === "done" ? (
          <button
            onClick={startSession}
            disabled={!!setupError}
            className="rounded-full bg-amber-500 px-10 py-3.5 text-sm font-medium text-stone-950 shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "done" ? "Check in again" : "Start check-in"}
          </button>
        ) : status === "active" ? (
          <>
            <button
              onClick={() => void finalizeSession()}
              className="group relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 shadow-[0_0_40px_-6px_rgba(245,158,11,0.65)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
              aria-label="End check-in early"
            >
              <span className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl transition-opacity group-hover:opacity-100" />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
            <button
              onClick={() => void finalizeSession()}
              className="text-[0.7rem] uppercase tracking-[0.18em] text-stone-600 transition-colors hover:text-stone-400"
            >
              End early
            </button>
          </>
        ) : status === "ending" ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              {connectionLost ? "Connection lost — saving…" : "Saving…"}
            </div>
            {connectionLost && (
              <p className="max-w-xs text-[0.7rem] leading-relaxed text-stone-600">
                The voice link dropped. We are pulling your transcript from the server.
              </p>
            )}
            <button
              type="button"
              onClick={abortEnding}
              className="text-[0.7rem] text-stone-600 underline hover:text-stone-400"
            >
              Cancel and retry
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            Connecting…
          </div>
        )}
      </div>

      {status === "done" && saveStatus && (
        <div className="flex w-full flex-col items-center gap-3 text-center">
          <p className="text-sm text-emerald-400/90">Saved</p>
          <Link
            href="/dashboard"
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-amber-500/60 bg-amber-500/15 px-8 py-3.5 text-sm font-medium text-amber-200 shadow-lg shadow-amber-500/15 transition-all hover:border-amber-400 hover:bg-amber-500/25 hover:text-amber-100 active:scale-[0.98]"
          >
            View insights
            <span aria-hidden>→</span>
          </Link>
        </div>
      )}

      <div className="w-full pt-4">
        <button
          type="button"
          onClick={() => setShowDebug((v) => !v)}
          className="mx-auto flex items-center gap-1.5 text-[0.7rem] text-stone-600 transition-colors hover:text-stone-400"
        >
          {showDebug ? "Hide debug" : "Show debug"}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${showDebug ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {showDebug && (
          <div className="mt-3 rounded-xl border border-stone-800/80 bg-stone-950/60 p-3 text-left font-mono text-[11px] text-stone-500">
            {status === "active" && (
              <div className="mb-3 grid grid-cols-2 gap-2 border-b border-stone-800/80 pb-3 text-[10px] uppercase tracking-wider sm:grid-cols-4">
                <span>{connectionStatus}</span>
                <span>{mode}</span>
                <span>vad {(vadScore * 100).toFixed(0)}%</span>
                <span>{interruptionCount} interrupts</span>
              </div>
            )}
            <p className="mb-2 text-stone-400">
              conv: {conversationIdRef.current ?? "—"} · {elapsedSec}s · activity=
              {String(hadActivityRef.current)}
            </p>
            {debugLog.length === 0 ? (
              <p>No events yet</p>
            ) : (
              debugLog.map((e, i) => (
                <p key={i} className="leading-relaxed">
                  <span className="text-stone-600">{ts()}</span> {e.msg}
                </p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
