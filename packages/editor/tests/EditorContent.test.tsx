import { describe, it, expect } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import * as fs from "fs";
import * as path from "path";

describe("ED-003: Monaco editor displays file content", () => {
  it("Editor accepts props (not a zero-arg function)", async () => {
    const { Editor } = await import("../src/Editor");
    // Current Editor() has 0 params — needs to accept props for value/onChange
    expect(Editor.length).toBeGreaterThan(0);
  });

  it("Editor uses controlled value prop (not defaultValue)", async () => {
    const editorSrc = fs.readFileSync(path.resolve(process.cwd(), "src/Editor.tsx"), "utf-8");
    // Must use value= (controlled) to support file switching, not defaultValue=
    expect(editorSrc).toContain("value=");
    expect(editorSrc).not.toContain("defaultValue=");
  });

  it("Editor uses vs-dark theme", async () => {
    const editorSrc = fs.readFileSync(path.resolve(process.cwd(), "src/Editor.tsx"), "utf-8");
    expect(editorSrc).toContain('theme="vs-dark"');
  });

  it("Editor uses HCL language mode", async () => {
    const editorSrc = fs.readFileSync(path.resolve(process.cwd(), "src/Editor.tsx"), "utf-8");
    expect(editorSrc).toMatch(/language.*hcl|hcl.*language/i);
  });

  it("Editor re-renders without error when value changes", async () => {
    const { Editor } = await import("../src/Editor");

    const container = document.createElement("div");
    document.body.appendChild(container);
    let root: ReturnType<typeof createRoot>;

    const hcl1 = 'resource "aws_s3_bucket" "a" {}';
    const hcl2 = 'resource "aws_vpc" "b" {}';

    act(() => {
      root = createRoot(container);
      root.render(React.createElement(Editor, { value: hcl1 }));
    });

    // Re-render with different content — controlled component should not throw
    act(() => {
      root.render(React.createElement(Editor, { value: hcl2 }));
    });

    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it("Editor renders with default content when no value given", async () => {
    const { Editor } = await import("../src/Editor");
    const html = renderToString(React.createElement(Editor));
    expect(html.length).toBeGreaterThan(0);
  });
});
