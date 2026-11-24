import { describe, expect, it } from "vitest";
import { findShortcut, SHORTCUTS } from "./shortcuts";

const press = (key: string, init: KeyboardEventInit = {}) =>
  new KeyboardEvent("keydown", { key, ...init });

describe("keyboard shortcuts", () => {
  it("never assign the same keys to two actions", () => {
    const combos = Object.values(SHORTCUTS).map((shortcut) => shortcut.keys.join("+"));
    expect(new Set(combos).size).toBe(combos.length);
  });

  it("match single keys without modifiers", () => {
    expect(findShortcut(press("j"))).toBe("next");
    expect(findShortcut(press("j", { metaKey: true }))).toBeUndefined();
  });

  it("match the command palette with Cmd or Ctrl", () => {
    expect(findShortcut(press("k", { metaKey: true }))).toBe("commandPalette");
    expect(findShortcut(press("k", { ctrlKey: true }))).toBe("commandPalette");
  });
});
