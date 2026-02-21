import { describe, it, expect } from "vitest";
import { createAssistant } from "../src/assistant";
import { createDeterministicHarness } from "llm-gateway/packages/ai/harness/providers/deterministic";
import { createAgentHarness } from "llm-gateway/packages/ai/harness/agent";
import type { HarnessEvent } from "llm-gateway/packages/ai/types";

describe("ED-006: LLM Gateway integration", () => {
  it("can import llm-gateway modules", () => {
    expect(typeof createAgentHarness).toBe("function");
    expect(typeof createDeterministicHarness).toBe("function");
  });

  it("can create agent harness from provider harness", () => {
    const provider = createDeterministicHarness({
      responses: [],
      model: "test-model",
    });
    const agent = createAgentHarness({ harness: provider });
    expect(agent).toBeDefined();
    expect(typeof agent.invoke).toBe("function");
    expect(typeof agent.supportedModels).toBe("function");
  });

  it("can create assistant with harness", () => {
    const provider = createDeterministicHarness({
      responses: [],
      model: "test-model",
    });
    const assistant = createAssistant({ harness: provider, model: "test-model" });
    expect(assistant).toBeDefined();
    expect(typeof assistant.chat).toBe("function");
    expect(typeof assistant.ask).toBe("function");
    expect(assistant.agent).toBeDefined();
  });

  it("basic invoke yields text events", async () => {
    const provider = createDeterministicHarness({
      responses: [
        {
          events: [
            { type: "text", content: "Hello, " },
            { type: "text", content: "I can help with HCL!" },
          ],
        },
      ],
      model: "test-model",
    });

    const assistant = createAssistant({ harness: provider, model: "test-model" });
    const events: HarnessEvent[] = [];
    for await (const event of assistant.chat([
      { role: "user", content: "Help me with Terraform" },
    ])) {
      events.push(event);
    }

    const textEvents = events.filter((e) => e.type === "text");
    expect(textEvents.length).toBe(2);
    expect(textEvents[0].type === "text" && textEvents[0].content).toBe("Hello, ");
    expect(textEvents[1].type === "text" && textEvents[1].content).toBe(
      "I can help with HCL!",
    );
  });

  it("ask() returns concatenated text response", async () => {
    const provider = createDeterministicHarness({
      responses: [
        {
          events: [
            { type: "text", content: "The aws_s3_bucket resource " },
            { type: "text", content: "creates an S3 bucket." },
          ],
        },
      ],
      model: "test-model",
    });

    const assistant = createAssistant({ harness: provider, model: "test-model" });
    const response = await assistant.ask("What does aws_s3_bucket do?");
    expect(response).toBe("The aws_s3_bucket resource creates an S3 bucket.");
  });

  it("ask() supports system context", async () => {
    const provider = createDeterministicHarness({
      responses: [
        {
          events: [{ type: "text", content: "Based on the HCL context provided..." }],
        },
      ],
      model: "test-model",
    });

    const assistant = createAssistant({ harness: provider, model: "test-model" });
    const response = await assistant.ask("Explain this", {
      context: 'resource "aws_vpc" "main" { cidr_block = "10.0.0.0/16" }',
    });
    expect(response).toBe("Based on the HCL context provided...");
  });
});
