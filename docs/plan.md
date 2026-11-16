# Site des quiz « LLM de zéro » : plan d'implémentation

> **Pour les agents :** exécuter tâche par tâche (superpowers:executing-plans). Cases `- [ ]` pour le suivi.

**But :** site statique de 6 quiz de 15 questions, direction « cahier corrigé », déployé sur Vercel, code sur github.com/Izzoudine/Quiz.

**Architecture :** Astro génère une page HTML par quiz (avec ses balises Open Graph). Un seul script client (`src/scripts/quiz.ts`) pilote le déroulé à partir des données injectées dans la page en JSON. La logique pure (score, messages, stockage) vit dans `src/lib/` et est testée avec Vitest.

**Pile :** Astro 5, TypeScript, Vitest, Python 3 + pdfplumber (extraction), sharp (images de partage), polices auto-hébergées (@fontsource).

**Spec :** `docs/design.md`

## Contraintes globales
- Adresses : `/`, `/part1/quiz/1` … `/part1/quiz/5`, `/part1/quiz/recap` (page de la série `/`, page de la partie `/part1`) ; `trailingSlash: "never"`.
- 15 questions par quiz, 4 réponses, score sur 15.
- Texte des questions, réponses et explications : identique au PDF, caractère pour caractère (après normalisation des espaces et des retours à la ligne).
- Couleurs : papier #FCFCF8, encre #1F2A5C, stylo rouge #D23A2E, fluo #9BE8C6, vert ✓ #1E8A5E, marge #E8879A.
- Polices : Fraunces (titres), Figtree (texte), Caveat (main), woff2 sous-ensemble latin, `font-display: swap`.
- Aucun traceur, aucun appel réseau tiers à l'exécution.
- Tout en français, tutoiement.
- `prefers-reduced-motion` coupe les animations et les confettis.

## Points de vigilance
1. `localStorage` indisponible (navigation privée, Safari) : le quiz fonctionne, simplement sans meilleur score.
2. Double clic ou clic sur une autre réponse après avoir répondu : ignoré, le score ne compte qu'une fois.
3. Lien de quiz inconnu (`/quiz/9`) : page 404 qui renvoie à l'accueil.
4. Long texte de réponse sur un téléphone de 320 px : retour à la ligne, aucun débordement horizontal.
5. Lien de configuration vide (vidéo, notebook, livre) : le bouton est masqué au lieu de pointer vers rien.

---

### Tâche 1 : extraction du PDF vers `data/quiz.json`

**Fichiers :** créer `tools/extract_quiz.py`, `data/quiz.json`, `tests/pdf_reference.json` (sortie brute), `tests/quiz-data.test.ts`.

**Interfaces :** produit `data/quiz.json` :
```ts
type Question = { q: string; answers: [string, string, string, string]; correct: 0|1|2|3; explanation: string };
type Quiz = { slug: "1"|"2"|"3"|"4"|"5"|"recap"; number: string; title: string; image: string; questions: Question[] };
type Data = { parts: { id: string; title: string; quizzes: Quiz[] }[] };
```
- [ ] Script : pdfplumber, lignes de texte ; section = « Vidéo #N — Titre » ou « Récap de la Partie I » ; question = ligne `N. …` (x≈55, avec continuations) ; réponses = lignes x≈90 (continuations fusionnées) ; bonne réponse = celle dont la police contient `Semibold` ; explication = texte après « Explication : » jusqu'à la question suivante. Retirer les en-têtes et pieds de page (« Descriptions YouTube et quiz — Partie I », « Page n of 24 »).
- [ ] Le script écrit aussi `tests/pdf_reference.json` (même forme), pour que le test compare sans dépendre de Python.
- [ ] Tests : 6 quiz, slugs `1..5, recap`, 15 questions chacun, 4 réponses non vides et distinctes, `correct` entre 0 et 3, explication non vide, et `quiz.json` égal à `pdf_reference.json` sur `q`, `answers`, `correct`, `explanation`.
- [ ] Vérification visuelle : relire 3 questions par quiz contre le PDF.
- [ ] Commit.

### Tâche 2 : logique du quiz

**Fichiers :** `src/lib/score.ts`, `src/lib/storage.ts`, `tests/score.test.ts`, `tests/storage.test.ts`.

**Interfaces :**
- `createSession(total: number) → { answer(i: number, correctIndex: number): boolean | null; score(): number; missed(): number[]; done(): boolean }` — `answer` retourne `null` si la question en cours a déjà une réponse (vigilance 2).
- `messageFor(score: number, total: number): string` — tranches 0–5, 6–9, 10–13, 14, 15.
- `getBest(slug: string): number | null`, `saveBest(slug: string, score: number): number` (garde le max ; try/catch, vigilance 1).
- [ ] Tests : 15 bonnes → 15 ; 3 fautes → 12 et `missed` = leurs index ; second `answer` sur la même question → `null` et score inchangé ; chaque tranche a son message ; `saveBest(…, 9)` puis `saveBest(…, 7)` → 9 ; `localStorage` qui lève une exception → `getBest` = null sans erreur.
- [ ] Implémenter, tests verts, commit.

### Tâche 3 : squelette Astro, configuration, accueil

**Fichiers :** `package.json`, `astro.config.mjs`, `site.config.json`, `src/layouts/Base.astro`, `src/styles/paper.css`, `src/components/Robot.astro` (états `smile|think|wink`), `src/components/QuizCard.astro`, `src/pages/index.astro`, `src/pages/404.astro`, `public/thumbs/*.webp` (miniatures 640 px).

`site.config.json` : `{ "siteUrl": "", "book": "", "quizzes": { "1": { "video": "", "notebook": "" }, … "recap": {…} } }`.
- [ ] Accueil : « Interro surprise. », présentation courte, 6 cartes photo scotchées (miniature, titre, « 15 questions », meilleur score lu en client).
- [ ] 404 (vigilance 3).
- [ ] `npm run build` passe, commit.

### Tâche 4 : page de quiz et déroulé

**Fichiers :** `src/pages/quiz/[slug].astro`, `src/scripts/quiz.ts`, `src/components/Confetti.ts`.
- [ ] `getStaticPaths` depuis `quiz.json` → 6 pages.
- [ ] Écran d'accueil du quiz (titre de la vidéo, « Commencer », « Revoir la vidéo »), puis une question à la fois, progression en 15 traits, réponses en `<button>`, raccourcis a/b/c/d, région `aria-live="polite"` qui annonce « Bonne réponse » ou « Mauvaise réponse, la bonne était … », focus déplacé sur l'explication puis sur « Question suivante ».
- [ ] Fin : note qui monte, message, robot clin d'œil, questions ratées avec explication, boutons Refaire, Revoir la vidéo, Le notebook du chapitre, Le livre, Quiz suivant, Partager (WhatsApp `https://wa.me/?text=…`, copier le lien). Boutons masqués si lien vide (vigilance 5). Confettis seulement à 15/15.
- [ ] Mise en page sans débordement à 320 px (vigilance 4).
- [ ] Commit.

### Tâche 5 : images de partage et métadonnées

**Fichiers :** `tools/og.mjs` (sharp), `public/og/<slug>.png` 1200×630, `public/og/home.png`.
- [ ] Balises `og:title`, `og:description`, `og:image` absolue (depuis `siteUrl`), `twitter:card=summary_large_image` sur chaque page.
- [ ] Commit.

### Tâche 6 : audits et corrections
- [ ] Captures téléphone (390×844) et ordinateur (1440×900) : accueil, question avant/après, fin.
- [ ] Lighthouse mobile sur la version construite : ≥ 95 en performance, accessibilité, bonnes pratiques. Corriger.
- [ ] Audits design, UX, accessibilité (axe), performance. Corriger.
- [ ] ⏸ Montrer captures et rapport.

### Tâche 7 : déploiement
- [ ] Pousser sur github.com/Izzoudine/Quiz.
- [ ] Déployer sur Vercel, renseigner `siteUrl`, redéployer.
- [ ] Donner les 6 adresses exactes.
