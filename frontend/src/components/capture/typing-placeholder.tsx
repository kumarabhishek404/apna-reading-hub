"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "Write a note…",
  "Draw a note…",
  "Save a PDF…",
  "Paste a link…",
  "Draft a blog…",
  "Set an alarm…",
  "Add a reminder…",
];

export function TypingPlaceholder({ visible }: { visible: boolean }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [caretOn, setCaretOn] = useState(true);

  useEffect(() => {
    const blink = setInterval(() => setCaretOn((on) => !on), 530);
    return () => clearInterval(blink);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const phrase = PHRASES[phraseIndex];
    const atEnd = !deleting && charCount === phrase.length;
    const atStart = deleting && charCount === 0;
    const delay = atEnd ? 1500 : atStart ? 280 : deleting ? 28 : 46;
    const timer = setTimeout(() => {
      if (!deleting && charCount < phrase.length) {
        setCharCount((count) => count + 1);
        return;
      }
      if (atEnd) {
        setDeleting(true);
        return;
      }
      if (deleting && charCount > 0) {
        setCharCount((count) => count - 1);
        return;
      }
      setDeleting(false);
      setPhraseIndex((index) => (index + 1) % PHRASES.length);
    }, delay);
    return () => clearTimeout(timer);
  }, [visible, phraseIndex, charCount, deleting]);

  if (!visible) return null;

  return (
    <span className="pointer-events-none absolute left-5 top-5 text-base text-slate-400">
      {PHRASES[phraseIndex].slice(0, charCount)}
      <span className={caretOn ? "opacity-100" : "opacity-0"}>|</span>
    </span>
  );
}
