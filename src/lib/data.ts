import data from "../../data/quiz.json";
import config from "../../site.config.json";

export type Question = { q: string; answers: string[]; correct: number; explanation: string };
export type Quiz = { slug: string; number: string; title: string; image: string; questions: Question[] };

export const allQuizzes: Quiz[] = data.parts.flatMap((p) => p.quizzes);

export type Links = { video: string; notebook: string; book: string };
export function linksFor(slug: string): Links {
  const q = (config.quizzes as Record<string, { video: string; notebook: string }>)[slug] ?? { video: "", notebook: "" };
  return { video: q.video.trim(), notebook: q.notebook.trim(), book: config.book.trim() };
}

export function nextQuiz(slug: string): Quiz | undefined {
  const i = allQuizzes.findIndex((q) => q.slug === slug);
  return allQuizzes[i + 1];
}
