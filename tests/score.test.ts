import { describe, expect, it } from "vitest";
import { createSession, messageFor } from "../src/lib/score";

describe("createSession", () => {
  it("15 bonnes réponses donnent 15/15", () => {
    const s = createSession(15);
    for (let i = 0; i < 15; i++) {
      s.answer(2, 2);
      s.next();
    }
    expect(s.score()).toBe(15);
    expect(s.done()).toBe(true);
    expect(s.missed()).toEqual([]);
  });

  it("3 fautes donnent 12 et la liste des questions ratées", () => {
    const s = createSession(15);
    const wrong = new Set([1, 6, 14]);
    for (let i = 0; i < 15; i++) {
      expect(s.answer(wrong.has(i) ? 0 : 3, 3)).toBe(!wrong.has(i));
      s.next();
    }
    expect(s.score()).toBe(12);
    expect(s.missed()).toEqual([1, 6, 14]);
  });

  it("une seconde réponse à la même question est ignorée", () => {
    const s = createSession(15);
    expect(s.answer(0, 1)).toBe(false);
    expect(s.answer(1, 1)).toBeNull();
    expect(s.score()).toBe(0);
    expect(s.missed()).toEqual([0]);
  });

  it("n'est pas terminé tant que toutes les questions n'ont pas de réponse", () => {
    const s = createSession(15);
    s.answer(0, 0);
    s.next();
    expect(s.done()).toBe(false);
    expect(s.current()).toBe(1);
  });
});

describe("messageFor", () => {
  it("donne un message différent pour chaque tranche", () => {
    const msgs = [0, 5, 6, 9, 10, 13, 14, 15].map((n) => messageFor(n, 15));
    expect(msgs[0]).toBe(msgs[1]);
    expect(msgs[2]).toBe(msgs[3]);
    expect(msgs[4]).toBe(msgs[5]);
    expect(new Set([msgs[0], msgs[2], msgs[4], msgs[6], msgs[7]]).size).toBe(5);
  });
});
