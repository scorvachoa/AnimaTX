import { alignmentMemoryBudget } from "./resources.mjs";
import { spokenScriptToken } from "./spoken-numbers.mjs";
const vocab = {
  "'": 28,
  a: 4,
  b: 20,
  c: 23,
  d: 16,
  e: 6,
  f: 27,
  g: 17,
  h: 18,
  i: 5,
  j: 25,
  k: 14,
  l: 15,
  m: 13,
  n: 7,
  o: 8,
  p: 21,
  q: 29,
  r: 12,
  s: 11,
  t: 10,
  u: 9,
  v: 24,
  w: 22,
  x: 30,
  y: 19,
  z: 26,
};
export function scriptTokens(script, language = "es") {
  const words = script.trim().split(/\s+/u).filter(Boolean);
  if (!words.length || words.length > 2000)
    throw Error("El guion debe tener entre 1 y 2000 palabras.");
  const tokens = [],
    owners = [];
  for (let i = 0; i < words.length; i++) {
    const text = spokenScriptToken(words[i], language)
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[^a-z']/g, "");
    if (!text)
      throw Error(
        `La palabra «${words[i]}» no se puede alinear. Usa un guion con palabras en español, inglés o portugués.`,
      );
    for (const c of text) {
      tokens.push(vocab[c]);
      owners.push(i);
    }
  }
  return { words, tokens, owners };
}
export function alignCTC(
  logits,
  frames,
  classes,
  script,
  duration,
  language = "es",
) {
  const { words, tokens, owners } = scriptTokens(script, language),
    states = tokens.length * 2 + 1;
  if (
    frames * states > 260000000 ||
    Math.ceil((frames * states) / 4) > alignmentMemoryBudget()
  )
    throw Error(
      "El guion es demasiado largo para alinear en este equipo. Usa un fragmento más corto.",
    );
  const logp = new Float32Array(logits.length);
  for (let t = 0; t < frames; t++) {
    const row = t * classes;
    let max = -Infinity;
    for (let c = 0; c < classes; c++) max = Math.max(max, logits[row + c]);
    let sum = 0;
    for (let c = 0; c < classes; c++) sum += Math.exp(logits[row + c] - max);
    const normalizer = max + Math.log(sum);
    for (let c = 0; c < classes; c++)
      logp[row + c] = logits[row + c] - normalizer;
  }
  const dirs = new Uint8Array(Math.ceil((frames * states) / 4));
  let prev = new Float64Array(states).fill(-Infinity);
  prev[0] = 0;
  let next = new Float64Array(states);
  for (let t = 0; t < frames; t++) {
    next.fill(-Infinity);
    for (let s = 0; s < Math.min(states, 2 * t + 2); s++) {
      const token = s % 2 ? tokens[(s - 1) / 2] : 0;
      let score = prev[s],
        step = 0;
      if (s > 0 && prev[s - 1] > score) {
        score = prev[s - 1];
        step = 1;
      }
      if (
        s > 1 &&
        s % 2 &&
        token !== tokens[(s - 3) / 2] &&
        prev[s - 2] > score
      ) {
        score = prev[s - 2];
        step = 2;
      }
      next[s] = score + logp[t * classes + token];
      const index = t * states + s;
      dirs[index >> 2] |= step << ((index & 3) * 2);
    }
    [prev, next] = [next, prev];
  }
  let state = prev[states - 1] > prev[states - 2] ? states - 1 : states - 2;
  if (!Number.isFinite(prev[state]))
    throw Error(
      "El guion no cabe en el audio. Revisa que sea el texto correcto.",
    );
  const spans = Array.from({ length: words.length }, () => ({
    start: Infinity,
    end: 0,
    score: 0,
    count: 0,
  }));
  for (let t = frames - 1; t >= 0; t--) {
    if (state % 2) {
      const tokenIndex = (state - 1) / 2,
        span = spans[owners[tokenIndex]];
      span.start = Math.min(span.start, t);
      span.end = Math.max(span.end, t + 1);
      span.score += Math.exp(logp[t * classes + tokens[tokenIndex]]);
      span.count++;
    }
    const index = t * states + state;
    state -= (dirs[index >> 2] >> ((index & 3) * 2)) & 3;
  }
  const aligned = words.map((text, i) => {
    const span = spans[i];
    if (!Number.isFinite(span.start) || !span.count)
      throw Error(
        "No se pudieron alinear todas las palabras. Revisa el guion.",
      );
    return {
      text,
      start: (span.start / frames) * duration,
      end: (span.end / frames) * duration,
      confidence: span.score / span.count,
    };
  });
  const confidence =
    aligned.reduce((n, w) => n + w.confidence, 0) / aligned.length;
  return { words: aligned, confidence };
}
