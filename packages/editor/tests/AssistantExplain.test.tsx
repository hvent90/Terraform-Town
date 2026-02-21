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

async function sendMessage(container: HTMLElement, text: string) {
  const input = container.querySelector(
    '[data-testid="chat-input"]',
  ) as HTMLTextAreaElement;
  act(() => setInputValue(input, text));
  await act(async () => {
    (
      container.querySelector('[data-testid="chat-send"]') as HTMLElement
    ).click();
    await new Promise((r) => setTimeout(r, 10));
  });
}

describe("ED-009: Assistant can explain resources", () => {
  it("onChat receives selectedText when user sends a message", async () => {
    let receivedSelected: string | undefined;
    async function* mockChat(
      _msg: string,
      _fileContent?: string,
      selectedText?: string,
    ) {
      receivedSelected = selectedText;
      yield "explanation";
    }

    const selection = `resource "aws_s3_bucket" "example" {\n  bucket = "my-bucket"\n}`;
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(
      <AssistantPanel onChat={mockChat} selectedText={selection} />,
    );

    await sendMessage(container, "explain this");

    expect(receivedSelected).toBe(selection);
  });

  it("assistant explains selected HCL block", async () => {
    async function* mockChat(
      _msg: string,
      _fileContent?: string,
      selectedText?: string,
    ) {
      if (selectedText && selectedText.includes("aws_s3_bucket")) {
        yield "This is an S3 bucket resource that creates a bucket named 'my-bucket'.";
      } else {
        yield "No selection to explain.";
      }
    }

    const selection = `resource "aws_s3_bucket" "example" {\n  bucket = "my-bucket"\n}`;
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(
      <AssistantPanel onChat={mockChat} selectedText={selection} />,
    );

    await sendMessage(container, "explain this");

    const messages = container.querySelectorAll('[data-testid="chat-message"]');
    expect(messages.length).toBe(2);
    expect(messages[1].textContent).toContain("S3 bucket resource");
  });

  it("uses HCL knowledge — context includes both file and selection", async () => {
    let receivedFile: string | undefined;
    let receivedSelected: string | undefined;
    async function* mockChat(
      _msg: string,
      fileContent?: string,
      selectedText?: string,
    ) {
      receivedFile = fileContent;
      receivedSelected = selectedText;
      yield "ok";
    }

    const fullFile = `resource "aws_vpc" "main" {\n  cidr_block = "10.0.0.0/16"\n}\n\nresource "aws_s3_bucket" "example" {\n  bucket = "my-bucket"\n}`;
    const selection = `resource "aws_s3_bucket" "example" {\n  bucket = "my-bucket"\n}`;
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(
      <AssistantPanel
        onChat={mockChat}
        fileContent={fullFile}
        selectedText={selection}
      />,
    );

    await sendMessage(container, "what does this do?");

    expect(receivedFile).toBe(fullFile);
    expect(receivedSelected).toBe(selection);
  });

  it("works without selectedText — backwards compatible", async () => {
    let receivedSelected: string | undefined = "UNSET";
    async function* mockChat(
      _msg: string,
      _fileContent?: string,
      selectedText?: string,
    ) {
      receivedSelected = selectedText;
      yield "general response";
    }

    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(<AssistantPanel onChat={mockChat} />);

    await sendMessage(container, "hello");

    expect(receivedSelected).toBeUndefined();
  });
});
