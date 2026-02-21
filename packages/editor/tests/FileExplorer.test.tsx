import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";

function render(element: React.ReactElement): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: ReturnType<typeof createRoot>;
  act(() => {
    root = createRoot(container);
    root.render(element);
  });
  return container;
}

describe("ED-002: File explorer component", () => {
  const sampleFiles = [
    { name: "main.tf", path: "main.tf" },
    { name: "variables.tf", path: "variables.tf" },
    { name: "outputs.tf", path: "outputs.tf" },
  ];

  it("FileExplorer component exists and is a function", async () => {
    const { FileExplorer } = await import("../src/FileExplorer");
    expect(typeof FileExplorer).toBe("function");
  });

  it("shows file list with names", async () => {
    const { FileExplorer } = await import("../src/FileExplorer");
    const container = render(<FileExplorer files={sampleFiles} />);
    for (const file of sampleFiles) {
      expect(container.textContent).toContain(file.name);
    }
  });

  it("each file has an icon element", async () => {
    const { FileExplorer } = await import("../src/FileExplorer");
    const container = render(<FileExplorer files={sampleFiles} />);
    const items = container.querySelectorAll('[data-testid="file-item"]');
    expect(items.length).toBe(3);
    for (const item of items) {
      const icon = item.querySelector('[data-testid="file-icon"]');
      expect(icon).not.toBeNull();
    }
  });

  it("click selects file and calls onSelect", async () => {
    const { FileExplorer } = await import("../src/FileExplorer");
    const onSelect = vi.fn();
    const container = render(<FileExplorer files={sampleFiles} onSelect={onSelect} />);
    const items = container.querySelectorAll('[data-testid="file-item"]');
    act(() => {
      (items[1] as HTMLElement).click();
    });
    expect(onSelect).toHaveBeenCalledWith("variables.tf");
  });

  it("selected file is highlighted", async () => {
    const { FileExplorer } = await import("../src/FileExplorer");
    const container = render(<FileExplorer files={sampleFiles} selectedFile="variables.tf" />);
    const items = container.querySelectorAll('[data-testid="file-item"]');
    const selected = items[1] as HTMLElement;
    const unselected = items[0] as HTMLElement;
    expect(selected.getAttribute("data-selected")).toBe("true");
    expect(unselected.getAttribute("data-selected")).toBe("false");
  });
});
