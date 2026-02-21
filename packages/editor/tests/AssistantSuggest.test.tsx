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

describe("ED-010: Assistant suggests improvements", () => {
  it("'Suggest Improvements' button exists in the panel", async () => {
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(<AssistantPanel />);

    const btn = container.querySelector('[data-testid="btn-suggest"]');
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain("Suggest");
  });

  it("clicking 'Suggest Improvements' sends improvement request via onChat", async () => {
    let receivedMessage: string | undefined;
    let receivedFile: string | undefined;
    async function* mockChat(
      msg: string,
      fileContent?: string,
    ) {
      receivedMessage = msg;
      receivedFile = fileContent;
      yield "Use lifecycle rules.";
    }

    const hcl = `resource "aws_s3_bucket" "logs" {\n  bucket = "my-logs"\n}`;
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(
      <AssistantPanel onChat={mockChat} fileContent={hcl} />,
    );

    await act(async () => {
      (container.querySelector('[data-testid="btn-suggest"]') as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(receivedMessage).toBeDefined();
    expect(receivedMessage!.toLowerCase()).toContain("improve");
    expect(receivedFile).toBe(hcl);
  });

  it("improvement suggestions stream into chat thread", async () => {
    async function* mockChat() {
      yield "1. Add lifecycle rules for cost management. ";
      yield "2. Enable versioning for data protection. ";
      yield "3. Add server-side encryption.";
    }

    const hcl = `resource "aws_s3_bucket" "logs" {\n  bucket = "my-logs"\n}`;
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(
      <AssistantPanel onChat={mockChat} fileContent={hcl} />,
    );

    await act(async () => {
      (container.querySelector('[data-testid="btn-suggest"]') as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 10));
    });

    const messages = container.querySelectorAll('[data-testid="chat-message"]');
    // Should have the auto-generated user message + the assistant response
    expect(messages.length).toBe(2);
    const assistantMsg = messages[1];
    expect(assistantMsg.getAttribute("data-role")).toBe("assistant");
    expect(assistantMsg.textContent).toContain("lifecycle rules");
    expect(assistantMsg.textContent).toContain("versioning");
    expect(assistantMsg.textContent).toContain("encryption");
  });

  it("suggestions are relevant to HCL — onChat receives file for analysis", async () => {
    let receivedFile: string | undefined;
    async function* mockChat(
      _msg: string,
      fileContent?: string,
    ) {
      receivedFile = fileContent;
      if (fileContent && fileContent.includes("aws_s3_bucket")) {
        yield "Consider adding an aws_s3_bucket_versioning resource for data protection.";
      } else {
        yield "No HCL content to analyze.";
      }
    }

    const hcl = `resource "aws_s3_bucket" "data" {\n  bucket = "my-data"\n  tags = {\n    Environment = "production"\n  }\n}`;
    const { AssistantPanel } = await import("../src/AssistantPanel");
    const container = render(
      <AssistantPanel onChat={mockChat} fileContent={hcl} />,
    );

    await act(async () => {
      (container.querySelector('[data-testid="btn-suggest"]') as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(receivedFile).toBe(hcl);
    const messages = container.querySelectorAll('[data-testid="chat-message"]');
    const assistantMsg = messages[1];
    expect(assistantMsg.textContent).toContain("aws_s3_bucket_versioning");
  });
});
