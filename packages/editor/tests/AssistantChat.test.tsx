import { describe, it, expect } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";

function render(element: React.ReactElement): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    const root = createRoot(container);
    root.render(element);
  });
  return container;
}

function setInputValue(input: HTMLTextAreaElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )!.set!;
  nativeInputValueSetter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("ED-008: Assistant responds to HCL questions", () => {
  it("assistant receives user message via onChat callback", async () => {
    let receivedMessage: string | undefined;
    async function* mockChat(msg: string) {
      receivedMessage = msg;
      yield "ok";
    }

    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(<AssistantPanel onChat={mockChat} />);
    const input = container.querySelector(
      '[data-testid="chat-input"]',
    ) as HTMLTextAreaElement;

    act(() => setInputValue(input, "How do I create a VPC?"));
    await act(async () => {
      (
        container.querySelector('[data-testid="chat-send"]') as HTMLElement
      ).click();
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(receivedMessage).toBe("How do I create a VPC?");
  });

  it("LLM Gateway invoked with context — response streams to chat", async () => {
    async function* mockChat() {
      yield "You can create ";
      yield "an S3 bucket with ";
      yield "the aws_s3_bucket resource.";
    }

    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(<AssistantPanel onChat={mockChat} />);
    const input = container.querySelector(
      '[data-testid="chat-input"]',
    ) as HTMLTextAreaElement;

    act(() => setInputValue(input, "How do I create a bucket?"));
    await act(async () => {
      (
        container.querySelector('[data-testid="chat-send"]') as HTMLElement
      ).click();
      await new Promise((r) => setTimeout(r, 10));
    });

    const messages = container.querySelectorAll('[data-testid="chat-message"]');
    expect(messages.length).toBe(2);
    expect(messages[0].getAttribute("data-role")).toBe("user");
    expect(messages[1].getAttribute("data-role")).toBe("assistant");
    expect(messages[1].textContent).toBe(
      "You can create an S3 bucket with the aws_s3_bucket resource.",
    );
  });

  it("context includes current file content", async () => {
    let receivedContext: string | undefined;
    async function* mockChat(_msg: string, ctx?: string) {
      receivedContext = ctx;
      yield "got it";
    }

    const hcl = 'resource "aws_s3_bucket" "test" {\n  bucket = "my-bucket"\n}';
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(
      <AssistantPanel onChat={mockChat} fileContent={hcl} />,
    );
    const input = container.querySelector(
      '[data-testid="chat-input"]',
    ) as HTMLTextAreaElement;

    act(() => setInputValue(input, "explain this"));
    await act(async () => {
      (
        container.querySelector('[data-testid="chat-send"]') as HTMLElement
      ).click();
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(receivedContext).toBe(hcl);
  });

  it("existing ED-007 behavior preserved — works without onChat prop", async () => {
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(<AssistantPanel />);
    const input = container.querySelector(
      '[data-testid="chat-input"]',
    ) as HTMLTextAreaElement;

    act(() => setInputValue(input, "hello"));
    act(() => {
      (
        container.querySelector('[data-testid="chat-send"]') as HTMLElement
      ).click();
    });

    const messages = container.querySelectorAll('[data-testid="chat-message"]');
    expect(messages.length).toBe(1);
    expect(messages[0].getAttribute("data-role")).toBe("user");
  });
});
