#!/usr/bin/env python3
"""One-time: bump Chapter N (N>=3) references by +2 after inserting ch3 Nightlife + ch4 slot."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SHIFTED = [
    ("chaos_mastery_ch5.html", 3, 5),
    ("chaos_mastery_ch8.html", 6, 8),
    ("chaos_mastery_ch8_v2.html", 6, 8),
    ("chaos_mastery_ch9.html", 7, 9),
    ("chaos_mastery_ch10.html", 8, 10),
    ("chaos_mastery_ch11.html", 9, 11),
    ("chaos_mastery_ch12.html", 10, 12),
    ("chaos_mastery_ch13.html", 11, 13),
    ("chaos_mastery_ch14.html", 12, 14),
    ("chaos_mastery_ch15.html", 13, 15),
    ("chaos_mastery_ch16.html", 14, 16),
    ("chaos_mastery_ch17.html", 15, 17),
    ("chaos_mastery_ch18.html", 16, 18),
    ("chaos_mastery_ch19.html", 17, 19),
    ("chaos_mastery_ch20.html", 18, 20),
]


def bump_text(text: str) -> str:
    def ch(m: re.Match) -> str:
        n = int(m.group(1))
        return "Chapter " + str(n + 2) if n >= 3 else m.group(0)

    text = re.sub(r"\bChapter\s+(\d+)\b", ch, text)

    def ch_and(m: re.Match) -> str:
        a, b = int(m.group(1)), int(m.group(2))
        a2 = a + 2 if a >= 3 else a
        b2 = b + 2 if b >= 3 else b
        return f"Chapters {a2} and {b2}"

    text = re.sub(r"\bChapters\s+(\d+)\s+and\s+(\d+)\b", ch_and, text)

    def ch_through(m: re.Match) -> str:
        a, b = int(m.group(1)), int(m.group(2))
        a2 = a + 2 if a >= 3 else a
        b2 = b + 2 if b >= 3 else b
        return f"Chapters {a2} through {b2}"

    text = re.sub(r"\bChapters\s+(\d+)\s+through\s+(\d+)\b", ch_through, text)

    def ch_range(m: re.Match) -> str:
        a, b = int(m.group(1)), int(m.group(3))
        sep = m.group(2)
        a2 = a + 2 if a >= 3 else a
        b2 = b + 2 if b >= 3 else b
        return f"Chapters {a2}{sep}{b2}"

    text = re.sub(r"\bChapters\s+(\d+)\s*([\u2013\-])\s*(\d+)\b", ch_range, text)

    return text


def fix_pf_num(text: str, old: int, new: int) -> str:
    return text.replace(f'<span class="pf-num">{old} ·', f'<span class="pf-num">{new} ·')


def process_file(path: Path, old_ch: int, new_ch: int) -> None:
    t = path.read_text(encoding="utf-8")
    t = bump_text(t)
    t = fix_pf_num(t, old_ch, new_ch)
    path.write_text(t, encoding="utf-8")


def main() -> None:
    for name, old_ch, new_ch in SHIFTED:
        process_file(ROOT / name, old_ch, new_ch)

    pb = ROOT / "chaos_mastery_playbook.html"
    if pb.exists():
        t = bump_text(pb.read_text(encoding="utf-8"))
        pb.write_text(t, encoding="utf-8")

    print("Done: shifted chapter files + playbook references (+2 for Chapter N, N>=3).")


if __name__ == "__main__":
    main()
