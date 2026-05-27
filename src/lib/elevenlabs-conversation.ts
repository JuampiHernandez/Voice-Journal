/** Fetch user transcript lines from an ElevenLabs conversation (fallback when Speech Engine WS fails) */
export async function fetchConversationUserTranscript(
  conversationId: string
): Promise<{ transcript: string; status: string; error?: string } | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
    { headers: { "xi-api-key": apiKey } }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    status?: string;
    transcript?: { role: string; message?: string }[];
    metadata?: { error?: { reason?: string }; termination_reason?: string };
  };

  const userLines = (data.transcript ?? [])
    .filter((t) => t.role === "user" && t.message?.trim())
    .map((t) => t.message!.trim());

  const transcript = userLines.join("\n").trim();
  if (!transcript) {
    return {
      transcript: "",
      status: data.status ?? "unknown",
      error:
        data.metadata?.error?.reason ??
        data.metadata?.termination_reason ??
        "No user speech in ElevenLabs transcript",
    };
  }

  return { transcript, status: data.status ?? "unknown" };
}

export async function verifyPublicWsTunnel(wsUrl: string): Promise<{
  reachable: boolean;
  httpUrl: string;
  error?: string;
}> {
  const httpUrl = wsUrl.replace(/^wss:/, "https:").replace(/\/ws\/?$/, "/health");

  try {
    const res = await fetch(httpUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { "ngrok-skip-browser-warning": "1" },
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      const offline =
        bodyText.includes("is offline") || bodyText.includes("ERR_NGROK");
      return {
        reachable: false,
        httpUrl,
        error: offline
          ? "ngrok tunnel is offline — restart: ngrok http 3002 (then npm run sync:speech-engine)"
          : `HTTP ${res.status} from ${httpUrl}`,
      };
    }
    const body = await res.json().catch(() => null);
    if (body && typeof body === "object" && "ok" in body && body.ok === true) {
      return { reachable: true, httpUrl };
    }
    return { reachable: false, httpUrl, error: "Unexpected health response" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Tunnel unreachable";
    const offline = msg.includes("fetch failed") || msg.includes("ENOTFOUND");
    return {
      reachable: false,
      httpUrl,
      error: offline
        ? "ngrok tunnel is offline — run: ngrok http 3002"
        : msg,
    };
  }
}
