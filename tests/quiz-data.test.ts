import { describe, expect, it } from "vitest";
import data from "../data/quiz.json";
import ref from "./pdf_reference.json";

const quizzes = data.parts.flatMap((p) => p.quizzes);

describe("data/quiz.json", () => {
  it("contient les 6 quiz de la Partie I, dans l'ordre", () => {
    expect(quizzes.map((q) => q.slug)).toEqual(["1", "2", "3", "4", "5", "recap"]);
  });

  for (const quiz of quizzes) {
    describe(`quiz ${quiz.slug}`, () => {
      it("a 15 questions", () => expect(quiz.questions).toHaveLength(15));
      it("a 4 réponses non vides et distinctes, une bonne réponse valide et une explication", () => {
        for (const q of quiz.questions) {
          expect(q.answers).toHaveLength(4);
          expect(new Set(q.answers).size).toBe(4);
          q.answers.forEach((a) => expect(a.trim()).not.toBe(""));
          expect([0, 1, 2, 3]).toContain(q.correct);
          expect(q.explanation.trim()).not.toBe("");
        }
      });
      it("est identique au PDF (questions, réponses, bonne réponse, explications)", () => {
        const pdf = ref.find((r) => r.slug === quiz.slug)!;
        expect(pdf).toBeDefined();
        quiz.questions.forEach((q, i) => {
          const p = pdf.questions[i];
          expect(q.q).toBe(p.q);
          expect(q.answers).toEqual(p.answers);
          expect(q.answers[q.correct]).toBe(p.answers[p.correct!]);
          expect(q.explanation).toBe(p.explanation);
        });
      });
    });
  }
});
