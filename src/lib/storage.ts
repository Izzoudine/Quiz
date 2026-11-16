const key = (slug: string) => `llm0:best:${slug}`;

export function getBest(slug: string): number | null {
  try {
    const v = localStorage.getItem(key(slug));
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Garde le meilleur score et le retourne. Sans stockage disponible, retourne simplement `score`. */
export function saveBest(slug: string, score: number): number {
  const best = Math.max(score, getBest(slug) ?? -1);
  try {
    localStorage.setItem(key(slug), String(best));
  } catch {
    /* stockage indisponible : on continue sans */
  }
  return best;
}
