// Parcours complet dans Chromium : captures, débordement à 320 px, axe, clavier, stockage.
// Usage : npm run build && (npx astro preview --port 4321 &) && node tools/check.mjs
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { mkdirSync, readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:4321";
const OUT = "docs/captures";
mkdirSync(OUT, { recursive: true });
const data = JSON.parse(readFileSync("data/quiz.json", "utf8")).parts[0].quizzes;
const q1 = data[0].questions;
const problems = [];
const browser = await chromium.launch();

async function axe(page, name) {
  const r = await new AxeBuilder({ page }).analyze();
  for (const v of r.violations) problems.push(`axe ${name}: ${v.id} (${v.nodes.length}) ${v.help}`);
}
async function overflow(page, name) {
  const w = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (w > 0) problems.push(`débordement horizontal ${name}: ${w}px`);
}

for (const [dev, vp] of [["telephone", { width: 390, height: 844 }], ["ordinateur", { width: 1440, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dev === "telephone" ? 2 : 1, hasTouch: dev === "telephone" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`erreur JS ${dev}: ${e.message}`));
  await page.goto(`${BASE}/`);
  await page.waitForLoadState("networkidle");
  await axe(page, `accueil ${dev}`);
  await page.screenshot({ path: `${OUT}/${dev}-1-accueil.png`, fullPage: dev === "telephone" ? false : true });

  await page.goto(`${BASE}/quiz/1`);
  await page.screenshot({ path: `${OUT}/${dev}-2-debut-quiz.png` });
  await page.click("#start");
  await page.waitForTimeout(500);
  await axe(page, `question ${dev}`);
  await page.screenshot({ path: `${OUT}/${dev}-3-question-avant.png` });
  // question 1 : mauvaise réponse
  const wrong = (q1[0].correct + 1) % 4;
  await page.click(`#answers button[data-k="${wrong}"]`);
  await page.click(`#answers button[data-k="${q1[0].correct}"]`, { force: true }); // doit être ignoré
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await axe(page, `réponse ${dev}`);
  await page.screenshot({ path: `${OUT}/${dev}-4-question-apres.png` });
  // le reste : au clavier sur ordinateur, bonnes réponses sauf la 5e
  for (let i = 1; i < q1.length; i++) {
    await page.click("#next");
    const k = i === 4 ? (q1[i].correct + 2) % 4 : q1[i].correct;
    if (dev === "ordinateur") await page.keyboard.press("abcd"[k]);
    else await page.click(`#answers button[data-k="${k}"]`);
  }
  await page.click("#next");
  await page.waitForTimeout(1200);
  const grade = await page.textContent("#grade");
  if (grade !== "13/15") problems.push(`score ${dev}: attendu 13/15, obtenu ${grade}`);
  await axe(page, `fin ${dev}`);
  await page.screenshot({ path: `${OUT}/${dev}-5-fin.png`, fullPage: true });
  await page.goto(`${BASE}/`);
  const best = await page.textContent('[data-best="1"]');
  if (best !== "13/15") problems.push(`meilleur score accueil ${dev}: ${best}`);
  await ctx.close();
}

// 320 px : aucun débordement, sur toutes les pages et une réponse ouverte
const ctx = await browser.newContext({ viewport: { width: 320, height: 640 } });
const page = await ctx.newPage();
for (const p of ["/", ...data.map((d) => `/quiz/${d.slug}`)]) {
  await page.goto(`${BASE}${p}`);
  await overflow(page, p);
  if (p !== "/") {
    await page.click("#start");
    await page.click("#answers button");
    await overflow(page, `${p} (question)`);
  }
}
const r404 = await page.goto(`${BASE}/quiz/9`);
if (r404.status() !== 404) problems.push(`/quiz/9 renvoie ${r404.status()}`);
await browser.close();

console.log(problems.length ? problems.join("\n") : "Tout est bon.");
process.exit(problems.length ? 1 : 0);
