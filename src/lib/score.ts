export type Session = {
  /** Enregistre la réponse à la question en cours. true/false = juste/faux, null = déjà répondu. */
  answer(choice: number, correct: number): boolean | null;
  next(): void;
  current(): number;
  score(): number;
  missed(): number[];
  done(): boolean;
};

export function createSession(total: number): Session {
  const results: (boolean | undefined)[] = new Array(total).fill(undefined);
  let idx = 0;
  return {
    answer(choice, correct) {
      if (idx >= total || results[idx] !== undefined) return null;
      results[idx] = choice === correct;
      return results[idx]!;
    },
    next() {
      if (results[idx] !== undefined && idx < total) idx++;
    },
    current: () => idx,
    score: () => results.filter((r) => r === true).length,
    missed: () => results.flatMap((r, i) => (r === false ? [i] : [])),
    done: () => results.every((r) => r !== undefined),
  };
}

export function messageFor(score: number, total: number): string {
  if (score === total) return "Sans-faute ! Tu pourrais presque expliquer la vidéo à ma place.";
  if (score >= total - 1) return "Une seule erreur, c'est excellent. Jette un œil à l'explication et c'est parfait.";
  if (score >= 10) return "Très bien, l'essentiel est là. Les explications ci-dessous t'aident à boucher les trous.";
  if (score >= 6) return "Un bon début. Relis les explications, puis revois le passage de la vidéo qui coince.";
  return "Pas de panique, c'est en se trompant qu'on apprend (le robot aussi). Revois la vidéo et retente ta chance.";
}
