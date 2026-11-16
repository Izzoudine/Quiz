import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBest, saveBest } from "../src/lib/storage";

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    length: 0,
  };
}

describe("meilleur score", () => {
  beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));

  it("est null tant que le quiz n'a pas été fait", () => expect(getBest("1")).toBeNull());

  it("garde le maximum", () => {
    expect(saveBest("1", 9)).toBe(9);
    expect(saveBest("1", 7)).toBe(9);
    expect(getBest("1")).toBe(9);
    expect(saveBest("1", 15)).toBe(15);
  });

  it("est propre à chaque quiz", () => {
    saveBest("1", 9);
    expect(getBest("recap")).toBeNull();
  });

  it("ne casse rien si le stockage est indisponible", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("bloqué"); },
      setItem: () => { throw new Error("bloqué"); },
    });
    expect(getBest("1")).toBeNull();
    expect(saveBest("1", 12)).toBe(12);
  });
});
