import data from "../../data/quiz.json";
import config from "../../site.config.json";

export type Question = { q: string; answers: string[]; correct: number; explanation: string };
export type Quiz = { slug: string; number: string; title: string; image: string; questions: Question[] };
export type Part = { id: string; title: string; quizzes: Quiz[] };

export const parts: Part[] = data.parts;

/** Adresse d'une partie et d'un quiz : /part1, /part1/quiz/recap */
export const partPath = (part: Part | string) => `/part${typeof part === "string" ? part : part.id}`;
export const quizPath = (part: Part | string, quiz: Quiz) => `${partPath(part)}/quiz/${quiz.slug}`;
/** Clé unique d'un quiz (stockage local, images de partage) : "1/recap" */
export const quizKey = (part: Part | string, quiz: Quiz) => `${typeof part === "string" ? part : part.id}/${quiz.slug}`;
export const ogImage = (part: Part, quiz: Quiz) => `/og/part${part.id}-${quiz.slug}.jpg`;

type QuizLinks = { video: string; notebook: string };
export type Links = QuizLinks & { book: string };
export function linksFor(part: Part, quiz: Quiz): Links {
  const p = (config.parts as Record<string, Record<string, QuizLinks>>)[part.id] ?? {};
  const q = p[quiz.slug] ?? { video: "", notebook: "" };
  return { video: q.video.trim(), notebook: q.notebook.trim(), book: config.book.trim() };
}

export function nextQuiz(part: Part, quiz: Quiz): Quiz | undefined {
  return part.quizzes[part.quizzes.findIndex((q) => q.slug === quiz.slug) + 1];
}
