import { useCallback, useEffect, useRef, useState } from "react";

export const INITIAL_VERBS = [
  "thinking",
  "pondering",
  "reasoning",
  "mulling",
  "noodling",
  "contemplating",
  "daydreaming",
  "meditating",
  "ruminating",
  "wondering",
  "imagining",
  "brainstorming",
];

export const STREAMING_VERBS = [
  "brewing",
  "conjuring",
  "cooking",
  "crafting",
  "weaving",
  "assembling",
  "forging",
  "composing",
  "sculpting",
  "distilling",
  "sketching",
  "mixing",
  "painting",
  "stitching",
  "wiring",
  "molding",
  "tuning",
  "polishing",
  "building",
  "shaping",
  "spinning",
  "tinkering",
  "whittling",
  "arranging",
  "rendering",
  "summoning",
  "channeling",
  "unspooling",
  "manifesting",
  "crystallizing",
];

const SCRAMBLE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const SCRAMBLE_SPEED_MS = 30;
const REVEAL_STAGGER_MS = 60;

export function useRotatingVerb(verbs: string[]) {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * verbs.length),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % verbs.length);
    }, 5000);
    return () => clearInterval(id);
  }, [verbs]);
  return verbs[index];
}

export function useScrambleText(text: string) {
  const [display, setDisplay] = useState(text + "...");
  const rafRef = useRef<number>(0);
  const prevTextRef = useRef(text);

  const scramble = useCallback((target: string) => {
    const len = Math.max(target.length, prevTextRef.current.length);
    const startTime = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const revealed = Math.floor(elapsed / REVEAL_STAGGER_MS);
      let result = "";
      for (let i = 0; i < len; i++) {
        if (i < revealed) {
          result += i < target.length ? target[i] : "";
        } else {
          const scrambleCycle = Math.floor(elapsed / SCRAMBLE_SPEED_MS + i);
          result += SCRAMBLE_CHARS[scrambleCycle % SCRAMBLE_CHARS.length];
        }
      }

      if (revealed >= len) {
        setDisplay(target + "...");
        prevTextRef.current = target;
        return;
      }

      setDisplay(result + "...");
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (text !== prevTextRef.current) {
      scramble(text);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, scramble]);

  return display;
}

interface ScrambleVerbProps {
  verbs: string[];
}

export function ScrambleVerb({ verbs }: ScrambleVerbProps) {
  const verb = useRotatingVerb(verbs);
  const display = useScrambleText(verb);
  return (
    <span
      className="inline-block text-sm text-muted-foreground animate-shimmer"
      aria-hidden="true"
    >
      {display}
    </span>
  );
}
