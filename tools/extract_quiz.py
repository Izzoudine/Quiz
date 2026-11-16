"""Extrait les 6 quiz de descriptions_et_quiz_partie1.pdf.

Usage : python tools/extract_quiz.py <chemin du PDF>
Écrit data/quiz.json et tests/pdf_reference.json.
Repères du PDF : question = « N. … » (x < 60), réponses à x ≈ 90, bonne réponse en police Semibold,
explication = « Explication : … » (x ≈ 68). Les lignes d'un même paragraphe sont à ~18 pt d'écart,
deux paragraphes à ~21 pt.
"""
import json
import re
import sys
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parent.parent
SECTION = re.compile(r"^(Vidéo #(\d) — (.+)|Récap de la Partie I)$")
QNUM = re.compile(r"^(\d{1,2})\. (.*)$")
SAME_PARA = 19.5


def lines(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        for pno, page in enumerate(pdf.pages):
            for l in page.extract_text_lines(return_chars=True):
                text = l["text"].strip()
                font = l["chars"][0]["fontname"]
                if font.endswith("DejaVuSans"):  # en-tête et pied de page
                    continue
                semi = all("Semibold" in c["fontname"] for c in l["chars"] if c["text"].strip())
                yield {"page": pno, "top": l["top"], "x": l["x0"], "text": text, "semi": semi, "font": font}


def join(a, b):
    return (a + " " + b).strip()


def extract(pdf_path):
    quizzes = []
    cur = None  # quiz en cours
    in_quiz = False
    q = None
    field = None  # 'q' | 'answer' | 'exp'
    prev = None
    for ln in lines(pdf_path):
        t = ln["text"]
        m = SECTION.match(t)
        if m and "Serif" in ln["font"]:
            if m.group(1).startswith("Récap"):
                cur = {"slug": "recap", "number": "Récap", "title": "Récap de la Partie I", "questions": []}
            else:
                cur = {"slug": m.group(2), "number": "Vidéo " + m.group(2), "title": m.group(3), "questions": []}
            quizzes.append(cur)
            in_quiz = False
            prev = None
            continue
        if cur is None:
            continue
        if t == "Quiz" and "Semibold" in ln["font"]:
            in_quiz = True
            prev = None
            continue
        if not in_quiz:
            continue
        cont = prev is not None and prev["page"] == ln["page"] and ln["top"] - prev["top"] < SAME_PARA
        page_cont = prev is not None and prev["page"] != ln["page"]
        qm = QNUM.match(t)
        if qm and ln["x"] < 60:
            q = {"q": qm.group(2), "answers": [], "correct": None, "explanation": ""}
            cur["questions"].append(q)
            field = "q"
        elif t.startswith("Explication :"):
            q["explanation"] = t[len("Explication :"):].strip()
            field = "exp"
        elif ln["x"] > 80 and not (cont and field == "answer"):
            q["answers"].append(t)
            if ln["semi"]:
                q["correct"] = len(q["answers"]) - 1
            field = "answer"
        elif cont or (page_cont and ln["x"] < 80):
            if field == "q":
                q["q"] = join(q["q"], t)
            elif field == "exp":
                q["explanation"] = join(q["explanation"], t)
            elif field == "answer":
                q["answers"][-1] = join(q["answers"][-1], t)
        else:
            raise ValueError(f"ligne inattendue p{ln['page']+1}: {t!r}")
        prev = ln
    return quizzes


def main():
    pdf_path = sys.argv[1]
    quizzes = extract(pdf_path)
    ref = [{"slug": z["slug"], "questions": z["questions"]} for z in quizzes]
    (ROOT / "tests").mkdir(exist_ok=True)
    (ROOT / "tests" / "pdf_reference.json").write_text(json.dumps(ref, ensure_ascii=False, indent=1), encoding="utf-8")
    data = {"parts": [{"id": "1", "title": "Partie I", "quizzes": [
        {**z, "image": f"/thumbs/{'ep' + z['slug'] if z['slug'] != 'recap' else 'recap'}.webp"} for z in quizzes
    ]}]}
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "quiz.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    for z in quizzes:
        bad = [i + 1 for i, q in enumerate(z["questions"]) if len(q["answers"]) != 4 or q["correct"] is None or not q["explanation"]]
        print(z["slug"], z["title"], len(z["questions"]), "questions", "PROBLÈMES:" if bad else "ok", bad or "")


if __name__ == "__main__":
    main()
