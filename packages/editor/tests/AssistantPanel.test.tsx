import { describe, it, expect, vi } from "vitest";
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

describe("ED-007: Assistant chat panel", () => {
  it("AssistantPanel component exists and is a function", async () => {
    const { AssistantPanel } = await import("../src/AssistantPanel");
    expect(typeof AssistantPanel).toBe("function");
  });

  it("renders a chat panel with input and send button", async () => {
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(<AssistantPanel />);
    const input = container.querySelector('[data-testid="chat-input"]') as HTMLTextAreaElement;
    const sendBtn = container.querySelector('[data-testid="chat-send"]');
    expect(input).not.toBeNull();
    expect(sendBtn).not.toBeNull();
  });

  it("can type messages into the input", async () => {
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(<AssistantPanel />);
    const input = container.querySelector('[data-testid="chat-input"]') as HTMLTextAreaElement;
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )!.set!;
      nativeInputValueSetter.call(input, "How do I create an S3 bucket?");
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(input.value).toBe("How do I create an S3 bucket?");
  });

  it("messages display in thread after sending", async () => {
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(<AssistantPanel />);
    const input = container.querySelector('[data-testid="chat-input"]') as HTMLTextAreaElement;
    const sendBtn = container.querySelector('[data-testid="chat-send"]') as HTMLElement;

    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )!.set!;
      nativeInputValueSetter.call(input, "Hello assistant");
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => {
      sendBtn.click();
    });

    const messages = container.querySelectorAll('[data-testid="chat-message"]');
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages[0].textContent).toContain("Hello assistant");
  });

  it("input is cleared after sending", async () => {
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(<AssistantPanel />);
    const input = container.querySelector('[data-testid="chat-input"]') as HTMLTextAreaElement;
    const sendBtn = container.querySelector('[data-testid="chat-send"]') as HTMLElement;

    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )!.set!;
      nativeInputValueSetter.call(input, "test message");
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => {
      sendBtn.click();
    });

    expect(input.value).toBe("");
  });

  it("collapse/expand toggle exists and works", async () => {
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(<AssistantPanel />);
    const toggle = container.querySelector('[data-testid="chat-toggle"]') as HTMLElement;
    expect(toggle).not.toBeNull();

    // Panel content should be visible initially
    const thread = container.querySelector('[data-testid="chat-thread"]');
    expect(thread).not.toBeNull();

    // Click to collapse
    act(() => {
      toggle.click();
    });
    const threadAfterCollapse = container.querySelector('[data-testid="chat-thread"]');
    expect(threadAfterCollapse).toBeNull();

    // Click to expand
    act(() => {
      toggle.click();
    });
    const threadAfterExpand = container.querySelector('[data-testid="chat-thread"]');
    expect(threadAfterExpand).not.toBeNull();
  });

  it("does not send empty messages", async () => {
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(<AssistantPanel />);
    const sendBtn = container.querySelector('[data-testid="chat-send"]') as HTMLElement;

    act(() => {
      sendBtn.click();
    });

    const messages = container.querySelectorAll('[data-testid="chat-message"]');
    expect(messages.length).toBe(0);
  });

  it("messages have role attributes (user/assistant)", async () => {
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(<AssistantPanel />);
    const input = container.querySelector('[data-testid="chat-input"]') as HTMLTextAreaElement;
    const sendBtn = container.querySelector('[data-testid="chat-send"]') as HTMLElement;

    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )!.set!;
      nativeInputValueSetter.call(input, "test");
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => {
      sendBtn.click();
    });

    const messages = container.querySelectorAll('[data-testid="chat-message"]');
    expect(messages[0].getAttribute("data-role")).toBe("user");
  });
});
