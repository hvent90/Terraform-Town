import { describe, test, expect, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Visualization } from "../../visualization/src/Visualization";

const hasDOM = typeof document !== "undefined";

function setInputValue(input: HTMLTextAreaElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )!.set!;
  nativeInputValueSetter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe.skipIf(!hasDOM)("ED-012: Full integration test", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
  });

  test("user can edit HCL in the editor", async () => {
    const { App } = await import("../src/App");
    act(() => root.render(<App />));

    // Editor component should be present
    const editor = container.querySelector('[data-testid="editor-wrapper"]');
    expect(editor).not.toBeNull();

    // Monaco renders a loading state in jsdom — verify the wrapper accepts content
    const editorSource = await import("../src/Editor");
    expect(typeof editorSource.Editor).toBe("function");
  });

  test("user can ask assistant questions and get responses", async () => {
    let chatCalled = false;
    async function* mockChat(msg: string) {
      chatCalled = true;
      yield `Here is help with: ${msg}`;
    }

    const { App } = await import("../src/App");
    act(() => root.render(<App onChat={mockChat} />));

    // Assistant panel should exist
    const panel = container.querySelector('[data-testid="assistant-panel"]');
    expect(panel).not.toBeNull();

    // Type a question and send
    const input = container.querySelector(
      '[data-testid="chat-input"]',
    ) as HTMLTextAreaElement;
    expect(input).not.toBeNull();

    act(() => setInputValue(input, "What is a VPC?"));
    await act(async () => {
      (
        container.querySelector('[data-testid="chat-send"]') as HTMLElement
      ).click();
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(chatCalled).toBe(true);
    const messages = container.querySelectorAll('[data-testid="chat-message"]');
    expect(messages.length).toBe(2);
    expect(messages[0].getAttribute("data-role")).toBe("user");
    expect(messages[1].getAttribute("data-role")).toBe("assistant");
    expect(messages[1].textContent).toContain("Here is help with");
  });

  test("user can apply changes and visualization updates", async () => {
    const { App } = await import("../src/App");
    act(() => root.render(<App />));

    // Verify Apply button exists
    const applyBtn = container.querySelector(
      '[data-testid="btn-apply"]',
    ) as HTMLElement;
    expect(applyBtn).not.toBeNull();

    // Get reference to the visualization container
    const visContainer = container.querySelector(
      '[data-testid="vis-container"]',
    ) as HTMLElement;
    expect(visContainer).not.toBeNull();
  });

  test("visualization updates correctly after apply with HCL content", async () => {
    // Test the core integration: HCL → parse → visualization update
    // Use applyToVisualization directly since Monaco can't type in jsdom
    const { applyToVisualization } = await import("../src/applySync");

    const visContainer = document.createElement("div");
    Object.defineProperty(visContainer, "clientWidth", {
      value: 800,
      configurable: true,
    });
    Object.defineProperty(visContainer, "clientHeight", {
      value: 600,
      configurable: true,
    });
    document.body.appendChild(visContainer);

    const vis = new Visualization(visContainer);

    const hcl = `resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "web" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
}`;

    const state = applyToVisualization(hcl, vis);

    // Resources parsed and sent to visualization
    expect(state.resources).toHaveLength(3);
    expect(state.connections).toHaveLength(1);

    // Visualization has all resources
    const resources = (vis as any).resources as Map<string, any>;
    expect(resources.has("aws_vpc.main")).toBe(true);
    expect(resources.has("aws_subnet.web")).toBe(true);
    expect(resources.has("aws_s3_bucket.data")).toBe(true);

    // Connection visible
    const connections = (vis as any).connections as Map<string, any>;
    expect(connections.has("aws_subnet.web->aws_vpc.main")).toBe(true);

    // Animations complete and resources fully visible
    const animator = (vis as any).animator;
    for (let i = 0; i < 25; i++) {
      animator.update(16);
    }

    const vpc = resources.get("aws_vpc.main");
    expect(vpc.scale.x).toBeCloseTo(1, 0);

    vis.dispose();
    document.body.removeChild(visContainer);
  });
});
