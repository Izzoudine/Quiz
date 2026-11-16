# Site des quiz « LLM de zéro » : design

## Pourquoi
Les spectateurs arrivent depuis la description YouTube, presque toujours sur téléphone, juste après la vidéo. Le site leur permet de vérifier en quelques minutes qu'ils ont compris, sans compte, et de revenir vers la vidéo, le notebook et le livre.

## Objectifs
- 6 quiz (vidéos 1 à 5 et récap), **15 questions chacun, toutes à la suite**, score sur 15 (choix de l'auteur).
- Adresses stables : `/part1/quiz/1` … `/part1/quiz/5`, `/part1/quiz/recap` (page de la série `/`, page de la partie `/part1`).
- Lighthouse mobile ≥ 95 en performance, accessibilité et bonnes pratiques.
- Ajout facile des quiz de la Partie II : on ajoute une entrée dans `data/quiz.json` et une miniature.

## Non-objectifs
- Pas de comptes, pas de classement, pas de backend.
- Pas de statistiques de visite, pas de traceurs, pas de cookies.

## Anti-objectifs (ce serait raté même si ça marche)
- Une réponse ou une explication différente du PDF.
- Une animation qui gêne la lecture ou ralentit le téléphone.
- Un lien de partage sans aperçu (WhatsApp lit le HTML statique, pas le JavaScript).

## Direction visuelle retenue : C, « le cahier corrigé »
- Feuille quadrillée claire (#FCFCF8, carreaux bleu pâle), marge rouge, encre bleu marine #1F2A5C.
- Typo : Fraunces (titres), Figtree (texte), Caveat (annotations à la main), auto-hébergées en woff2 et sous-ensemble latin.
- Accueil : titre « Interro surprise. », cartes en photos scotchées (miniature, titre, « 15 questions », meilleur score au stylo rouge).
- Question : barre de progression en 15 traits ; réponses a/b/c/d en lignes de cahier. Après le clic : bonne réponse surlignée au fluo vert + ✓, mauvaise barrée et entourée en rouge, explication en écriture main ; bouton « Question suivante ».
- Robot dessiné au stylo : sourit (bonne réponse), réfléchit (mauvaise), clin d'œil (fin).
- Fin : note au stylo rouge « 12/15 » qui monte, message adapté à la tranche de score, liste des questions ratées avec l'explication, boutons Refaire, Revoir la vidéo, Le notebook du chapitre, Le livre, Quiz suivant, Partager (WhatsApp, copier le lien). Quelques confettis seulement pour 15/15.
- Mouvements doux, désactivés si `prefers-reduced-motion`.
- La palette des vidéos (#11151D…) n'est plus imposée : l'auteur l'a écartée.

## Approches techniques considérées
1. **Astro, site statique** (retenu) : une page HTML générée par quiz, avec ses balises d'aperçu (Open Graph) et sa miniature. Le seul JavaScript est un petit script de quiz. C'est le plus rapide et l'aperçu WhatsApp fonctionne.
2. Application React à page unique : plus lourde, et les aperçus par quiz demandent un rendu serveur.
3. HTML écrit à la main : rapide, mais 6 pages dupliquées, et l'ajout de la Partie II est pénible.

## Données
- `data/quiz.json` : `{ parts: [{ id, title, quizzes: [{ slug, number, title, video, notebook, questions: [{ q, answers[4], correct (index), explanation }] }] }] }`.
- `site.config.json` : liens YouTube, notebooks, livre, URL du site (emplacements vides à remplir).
- Meilleurs scores : `localStorage` (`llm0:best:<slug>`), lecture/écriture protégées par try/catch.

## Tests
- Chaque quiz a 15 questions et 4 réponses distinctes, et un index de bonne réponse valide.
- Chaque bonne réponse et chaque explication sont identiques au texte du PDF (extraction automatique du PDF comparée au JSON). Dans le PDF, la bonne réponse est la seule des 4 écrite en demi-gras (police « Semibold ») : le script d'extraction et le test s'appuient sur ce repère.
- Le calcul du score, du message par tranche et du meilleur score est juste.

## Laissé au constructeur
- Messages d'encouragement par tranche (0–5, 6–9, 10–13, 14, 15), au tutoiement.
- Détails d'animation et dimensions exactes.
- Génération des images de partage 1200×630 (miniature + titre) au build.
