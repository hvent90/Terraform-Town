import { describe, test, expect } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { SplitLayout } from "../src/SplitLayout";

function render(el: React.ReactElement): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    createRoot(container).render(el);
  });
  return container;
}

describe("SplitLayout", () => {
  test("renders left panel with data-testid='editor-panel'", () => {
    const container = render(createElement(SplitLayout));
    const panel = container.querySelector("[data-testid='editor-panel']");
    expect(panel).not.toBeNull();
  });

  test("renders right panel with data-testid='visualization-panel'", () => {
    const container = render(createElement(SplitLayout));
    const panel = container.querySelector("[data-testid='visualization-panel']");
    expect(panel).not.toBeNull();
  });

  test("both panels visible simultaneously", () => {
    const container = render(createElement(SplitLayout));
    const left = container.querySelector("[data-testid='editor-panel']") as HTMLElement;
    const right = container.querySelector("[data-testid='visualization-panel']") as HTMLElement;
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    // Both should be in the DOM at the same time
    expect(left.parentElement).toBe(right.parentElement);
  });

  test("uses flexbox row layout", () => {
    const container = render(createElement(SplitLayout));
    const left = container.querySelector("[data-testid='editor-panel']") as HTMLElement;
    const wrapper = left.parentElement as HTMLElement;
    expect(wrapper.style.display).toBe("flex");
    expect(wrapper.style.flexDirection).toBe("row");
  });

  test("left panel takes 50% width", () => {
    const container = render(createElement(SplitLayout));
    const left = container.querySelector("[data-testid='editor-panel']") as HTMLElement;
    expect(left.style.width).toBe("50%");
  });

  test("right panel takes 50% width", () => {
    const container = render(createElement(SplitLayout));
    const right = container.querySelector("[data-testid='visualization-panel']") as HTMLElement;
    expect(right.style.width).toBe("50%");
  });

  test("layout fills full height", () => {
    const container = render(createElement(SplitLayout));
    const left = container.querySelector("[data-testid='editor-panel']") as HTMLElement;
    const wrapper = left.parentElement as HTMLElement;
    expect(wrapper.style.height).toBe("100%");
  });

  test("renders children in left panel when provided", () => {
    const container = render(
      createElement(SplitLayout, {
        left: createElement("div", { "data-testid": "custom-left" }, "Left Content"),
      })
    );
    const panel = container.querySelector("[data-testid='editor-panel']");
    const child = panel?.querySelector("[data-testid='custom-left']");
    expect(child).not.toBeNull();
    expect(child?.textContent).toBe("Left Content");
  });

  test("renders children in right panel when provided", () => {
    const container = render(
      createElement(SplitLayout, {
        right: createElement("div", { "data-testid": "custom-right" }, "Right Content"),
      })
    );
    const panel = container.querySelector("[data-testid='visualization-panel']");
    const child = panel?.querySelector("[data-testid='custom-right']");
    expect(child).not.toBeNull();
    expect(child?.textContent).toBe("Right Content");
  });
});
