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

describe("ED-005: Toolbar with Plan/Apply/Destroy buttons", () => {
  it("Toolbar component exists and is a function", async () => {
    const { Toolbar } = await import("../src/Toolbar");
    expect(typeof Toolbar).toBe("function");
  });

  it("Plan button exists", async () => {
    const { Toolbar } = await import("../src/Toolbar");
    const container = render(<Toolbar />);
    const btn = container.querySelector('[data-testid="btn-plan"]');
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain("Plan");
  });

  it("Apply button exists", async () => {
    const { Toolbar } = await import("../src/Toolbar");
    const container = render(<Toolbar />);
    const btn = container.querySelector('[data-testid="btn-apply"]');
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain("Apply");
  });

  it("Destroy button exists", async () => {
    const { Toolbar } = await import("../src/Toolbar");
    const container = render(<Toolbar />);
    const btn = container.querySelector('[data-testid="btn-destroy"]');
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain("Destroy");
  });

  it("Plan button triggers onPlan callback", async () => {
    const { Toolbar } = await import("../src/Toolbar");
    const onPlan = vi.fn();
    const container = render(<Toolbar onPlan={onPlan} />);
    const btn = container.querySelector('[data-testid="btn-plan"]') as HTMLElement;
    act(() => btn.click());
    expect(onPlan).toHaveBeenCalledOnce();
  });

  it("Apply button triggers onApply callback", async () => {
    const { Toolbar } = await import("../src/Toolbar");
    const onApply = vi.fn();
    const container = render(<Toolbar onApply={onApply} />);
    const btn = container.querySelector('[data-testid="btn-apply"]') as HTMLElement;
    act(() => btn.click());
    expect(onApply).toHaveBeenCalledOnce();
  });

  it("Destroy button triggers onDestroy callback", async () => {
    const { Toolbar } = await import("../src/Toolbar");
    const onDestroy = vi.fn();
    const container = render(<Toolbar onDestroy={onDestroy} />);
    const btn = container.querySelector('[data-testid="btn-destroy"]') as HTMLElement;
    act(() => btn.click());
    expect(onDestroy).toHaveBeenCalledOnce();
  });
});
