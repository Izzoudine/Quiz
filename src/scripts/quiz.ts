import { createSession, messageFor, type Session } from "../lib/score";
import { getBest, saveBest } from "../lib/storage";

type Q = { q: string; answers: string[]; correct: number; explanation: string };
type Payload = { slug: string; title: string; questions: Q[]; url: string };

const LETTERS = ["a", "b", "c", "d"];
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export function mountQuiz() {
  const data: Payload = JSON.parse($("quiz-data").textContent!);
  const total = data.questions.length;
  const intro = $("intro"), play = $("play"), end = $("end");
  const qText = $("q-text"), answers = $("answers"), feedback = $("feedback");
  const verdict = $("verdict"), explanation = $("explanation"), nextBtn = $<HTMLButtonElement>("next");
  const live = $("live"), robot = $("robot"), ticks = [...play.querySelectorAll<HTMLElement>(".ticks i")];
  let s: Session = createSession(total);

  const best = getBest(data.slug);
  if (best !== null) {
    const el = $("intro-best");
    el.textContent = `Ton meilleur score : ${best}/${total}`;
    el.hidden = false;
  }

  function show(section: HTMLElement) {
    for (const el of [intro, play, end]) el.hidden = el !== section;
    window.scrollTo({ top: 0 });
  }

  function renderQuestion() {
    const i = s.current();
    const q = data.questions[i];
    $("progress-text").textContent = `Question ${i + 1} / ${total}`;
    ticks.forEach((t, k) => t.classList.toggle("on", k <= i && !t.classList.contains("miss")));
    robot.dataset.mood = "smile";
    qText.textContent = q.q;
    answers.replaceChildren(
      ...q.answers.map((a, k) => {
        const li = document.createElement("li");
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.k = String(k);
        b.innerHTML = `<span class="lt" aria-hidden="true">${LETTERS[k]}</span><span class="txt"></span><span class="sr-only st"></span>`;
        (b.querySelector(".txt") as HTMLElement).textContent = a;
        b.addEventListener("click", () => choose(k));
        li.append(b);
        return li;
      }),
    );
    feedback.hidden = true;
    nextBtn.hidden = true;
    play.classList.remove("enter");
    void play.offsetWidth;
    play.classList.add("enter");
  }

  function choose(k: number) {
    const i = s.current();
    const q = data.questions[i];
    const ok = s.answer(k, q.correct);
    if (ok === null) return; // déjà répondu
    answers.querySelectorAll<HTMLButtonElement>("button").forEach((b) => {
      const j = Number(b.dataset.k);
      b.setAttribute("aria-disabled", "true");
      const st = b.querySelector(".st")!;
      if (j === q.correct) { b.classList.add("right"); st.textContent = j === k ? " (ta réponse, juste)" : " (la bonne réponse)"; }
      else if (j === k) { b.classList.add("wrong"); st.textContent = " (ta réponse, fausse)"; }
      else b.classList.add("dim");
    });
    if (!ok) ticks[i].classList.add("miss");
    robot.dataset.mood = ok ? "smile" : "think";
    robot.classList.remove("bump");
    if (ok) { void robot.getBoundingClientRect(); robot.classList.add("bump"); }
    verdict.textContent = ok ? pick(["Bien vu !", "Exact !", "Bravo !", "C'est ça !"], i) : pick(["Presque !", "Pas tout à fait.", "Raté, mais c'est fréquent."], i);
    explanation.textContent = q.explanation;
    feedback.classList.toggle("ok", ok);
    feedback.hidden = false;
    nextBtn.textContent = s.current() === total - 1 ? "Voir mon score" : "Question suivante";
    nextBtn.hidden = false;
    live.textContent = ok
      ? `Bonne réponse. ${q.explanation}`
      : `Mauvaise réponse. La bonne réponse était : ${q.answers[q.correct]}. ${q.explanation}`;
    nextBtn.focus({ preventScroll: true });
    feedback.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
  }

  function goNext() {
    s.next();
    if (s.done()) return finish();
    renderQuestion();
    qText.focus();
  }

  function finish() {
    const score = s.score();
    const b = saveBest(data.slug, score);
    show(end);
    $("end-msg").textContent = messageFor(score, total);
    $("end-best").textContent = b > score ? `Ton meilleur score reste ${b}/${total}.` : score > 0 && best !== null && score > best ? "Nouveau record !" : "";
    countUp($("grade"), score, total);
    const msg = `J'ai eu ${score}/${total} au quiz « ${data.title} » de la série LLM de zéro. À toi : ${data.url}`;
    $<HTMLAnchorElement>("wa").href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    const missed = s.missed();
    $("missed-wrap").hidden = missed.length === 0;
    $("missed").replaceChildren(
      ...missed.map((i) => {
        const q = data.questions[i];
        const li = document.createElement("li");
        li.innerHTML = `<p class="mq"></p><p class="ma">Bonne réponse : <b></b></p><p class="me"></p>`;
        li.querySelector(".mq")!.textContent = `${i + 1}. ${q.q}`;
        li.querySelector(".ma b")!.textContent = q.answers[q.correct];
        li.querySelector(".me")!.textContent = q.explanation;
        return li;
      }),
    );
    $("end-title").focus();
    if (score === total && !reduced()) confetti();
  }

  function start() {
    s = createSession(total);
    ticks.forEach((t) => t.classList.remove("on", "miss"));
    show(play);
    renderQuestion();
    qText.focus();
  }

  $("start").addEventListener("click", start);
  $("restart").addEventListener("click", start);
  nextBtn.addEventListener("click", goNext);
  $("copy").addEventListener("click", async () => {
    const out = $("copied");
    try { await navigator.clipboard.writeText(data.url); out.textContent = "Lien copié !"; }
    catch { out.textContent = data.url; }
  });
  document.addEventListener("keydown", (e) => {
    if (play.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = LETTERS.indexOf(e.key.toLowerCase());
    const n = ["1", "2", "3", "4"].indexOf(e.key);
    const idx = k >= 0 ? k : n;
    if (idx >= 0 && nextBtn.hidden) { e.preventDefault(); choose(idx); }
  });
}

function pick(list: string[], i: number) { return list[i % list.length]; }

function countUp(el: HTMLElement, score: number, total: number) {
  if (reduced() || score === 0) { el.textContent = `${score}/${total}`; return; }
  const t0 = performance.now(), dur = 900;
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = `${Math.round(score * (1 - Math.pow(1 - p, 3)))}/${total}`;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function confetti() {
  const colors = ["#D23A2E", "#9BE8C6", "#F5C64B", "#1F2A5C", "#E8879A"];
  const frag = document.createDocumentFragment();
  const bits: HTMLElement[] = [];
  for (let i = 0; i < 36; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = colors[i % colors.length];
    c.style.setProperty("--dx", `${(Math.random() - 0.5) * 160}px`);
    c.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    c.style.animationDelay = `${Math.random() * 0.4}s`;
    bits.push(c);
    frag.append(c);
  }
  document.body.append(frag);
  setTimeout(() => bits.forEach((b) => b.remove()), 3200);
}
