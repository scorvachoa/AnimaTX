import { compareScript } from "./compare-script.mjs";
// Keep unchanged words anchored; retime edited runs with one neighboring anchor
// on each side so inserted words have time even when the original gap is zero.
export function adaptScript(script, words, duration) {
  const tokens = script.trim().split(/\s+/u).filter(Boolean);
  if (!tokens.length) throw Error("Pega primero el guion original.");
  if (!words.length)
    throw Error(
      "Genera primero la transcripción para obtener los tiempos del audio.",
    );
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    words.some(
      (w, i) =>
        !Number.isFinite(w.start) ||
        !Number.isFinite(w.end) ||
        w.start < 0 ||
        w.end <= w.start ||
        w.end > duration + 0.1 ||
        (i > 0 && w.start < words[i - 1].end),
    )
  )
    throw Error(
      "Corrige los tiempos de la transcripción antes de adaptar el guion.",
    );
  const parts = compareScript(script, words),
    result = new Array(tokens.length),
    regions = [];
  let ri = 0,
    ai = 0;
  for (const part of parts) {
    if (
      part.kind === "equal" ||
      part.reference.length === part.transcript.length
    )
      for (let k = 0; k < part.reference.length; k++)
        result[ri + k] = { ...words[ai + k], text: tokens[ri + k] };
    else
      regions.push({
        r0: Math.max(0, ri - 1),
        r1: Math.min(tokens.length, ri + part.reference.length + 1),
        a0: Math.max(0, ai - 1),
        a1: Math.min(words.length, ai + part.transcript.length + 1),
      });
    ri += part.reference.length;
    ai += part.transcript.length;
  }
  const merged = [];
  for (const region of regions) {
    const last = merged.at(-1);
    if (last && (region.r0 <= last.r1 || region.a0 <= last.a1)) {
      last.r1 = Math.max(last.r1, region.r1);
      last.a1 = Math.max(last.a1, region.a1);
    } else merged.push({ ...region });
  }
  for (const region of merged) {
    const start = words[region.a0].start,
      end = Math.min(duration, words[region.a1 - 1].end),
      slice = tokens.slice(region.r0, region.r1);
    const weights = slice.map((t) => Math.max(1, Array.from(t).length)),
      total = weights.reduce((a, b) => a + b, 0);
    let elapsed = 0;
    for (let k = 0; k < slice.length; k++) {
      const from = start + ((end - start) * elapsed) / total;
      elapsed += weights[k];
      const to =
        k === slice.length - 1
          ? end
          : start + ((end - start) * elapsed) / total;
      result[region.r0 + k] = {
        id: crypto.randomUUID(),
        text: slice[k],
        start: from,
        end: to,
      };
    }
  }
  return { words: result, estimated: merged.length > 0 };
}
