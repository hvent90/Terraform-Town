import { createAgentHarness } from "llm-gateway/packages/ai/harness/agent";
import type { GeneratorHarnessModule, HarnessEvent, Message } from "llm-gateway/packages/ai/types";

export interface AssistantOptions {
  harness: GeneratorHarnessModule;
  model?: string;
  maxIterations?: number;
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Creates an AI assistant powered by llm-gateway.
 * Wraps the agent harness with a simple chat interface for the editor.
 */
export function createAssistant(options: AssistantOptions) {
  const agent = createAgentHarness({
    harness: options.harness,
    model: options.model,
    maxIterations: options.maxIterations ?? 5,
  });

  return {
    /**
     * Send a message and stream back events.
     * Caller can filter for "text" events to build up the response.
     */
    async *chat(
      messages: Message[],
      opts?: { model?: string },
    ): AsyncIterable<HarnessEvent> {
      yield* agent.invoke({
        model: opts?.model,
        messages,
      });
    },

    /**
     * Simple request-response: send a user message, get back the full text.
     */
    async ask(
      userMessage: string,
      opts?: { model?: string; context?: string },
    ): Promise<string> {
      const messages: Message[] = [];
      if (opts?.context) {
        messages.push({
          role: "system",
          content: opts.context,
        });
      }
      messages.push({ role: "user", content: userMessage });

      let response = "";
      for await (const event of agent.invoke({
        model: opts?.model,
        messages,
      })) {
        if (event.type === "text") {
          response += event.content;
        }
      }
      return response;
    },

    /** Expose the underlying agent for advanced usage. */
    agent,
  };
}

export type { GeneratorHarnessModule, HarnessEvent, Message };
