import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { ClientEvent, TurnEagerness } from "@elevenlabs/elevenlabs-js/api";

/** Turn + conversation settings for natural barge-in and agent interjections */
export const SPEECH_ENGINE_CONVERSATION_CONFIG = {
  turn: {
    turnEagerness: TurnEagerness.Eager,
    turnTimeout: 7,
    speculativeTurn: false,
  },
  conversation: {
    maxDurationSeconds: 200,
    clientEvents: [
      ClientEvent.ConversationInitiationMetadata,
      ClientEvent.AsrInitiationMetadata,
      ClientEvent.Audio,
      ClientEvent.Interruption,
      ClientEvent.UserTranscript,
      ClientEvent.AgentResponse,
      ClientEvent.AgentResponseCorrection,
      ClientEvent.VadScore,
      ClientEvent.AgentChatResponsePart,
      ClientEvent.AgentResponseComplete,
    ],
  },
};

export async function syncSpeechEngineConversationConfig(): Promise<{
  ok: boolean;
  updated?: boolean;
  error?: string;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const engineId = process.env.SPEECH_ENGINE_ID;

  if (!apiKey || !engineId) {
    return { ok: false, error: "Missing ELEVENLABS_API_KEY or SPEECH_ENGINE_ID" };
  }

  const elevenlabs = new ElevenLabsClient({ apiKey });

  try {
    const engine = await elevenlabs.speechEngine.get(engineId);
    const currentEagerness = engine.config?.turn?.turnEagerness;
    const hasInterruption = engine.config?.conversation?.clientEvents?.includes("interruption");

    const speculative = engine.config?.turn?.speculativeTurn;
    if (
      currentEagerness === TurnEagerness.Eager &&
      hasInterruption &&
      speculative === false
    ) {
      return { ok: true, updated: false };
    }

    await elevenlabs.speechEngine.update(engineId, {
      turn: SPEECH_ENGINE_CONVERSATION_CONFIG.turn,
      conversation: SPEECH_ENGINE_CONVERSATION_CONFIG.conversation,
    });

    console.log("[speech-engine-config] Updated turn eagerness + interruption client events");
    return { ok: true, updated: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update Speech Engine config",
    };
  }
}
