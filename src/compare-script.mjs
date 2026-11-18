// Exact word alignment preserves punctuation and accents as visible differences.
export function compareScript(script, words) {
  const expected = script.trim().split(/\s+/u).filter(Boolean);
  if (expected.length > 2000 || words.length > 2000)
    throw Error("La comparación admite hasta 2000 palabras por texto.");
  const actual = words.map((w) => w.text);
  const cols = actual.length + 1;
  const dp = new Uint16Array((expected.length + 1) * cols);
  for (let i = expected.length - 1; i >= 0; i--)
    for (let j = actual.length - 1; j >= 0; j--)
      dp[i * cols + j] =
        expected[i].normalize("NFC") === actual[j].normalize("NFC")
          ? 1 + dp[(i + 1) * cols + j + 1]
          : Math.max(dp[(i + 1) * cols + j], dp[i * cols + j + 1]);
  const parts = [];
  let i = 0,
    j = 0;
  function push(kind, reference, transcript, index) {
    let last = parts.at(-1);
    if (!last || last.kind !== kind) {
      last = { kind, reference: [], transcript: [], wordIndex: index };
      parts.push(last);
    }
    if (reference !== null) last.reference.push(reference);
    if (transcript !== null) last.transcript.push(transcript);
  }
  while (i < expected.length || j < actual.length) {
    if (
      i < expected.length &&
      j < actual.length &&
      expected[i].normalize("NFC") === actual[j].normalize("NFC")
    ) {
      push("equal", expected[i++], actual[j], j);
      j++;
    } else if (
      i < expected.length &&
      (j === actual.length || dp[(i + 1) * cols + j] >= dp[i * cols + j + 1])
    ) {
      push(
        "change",
        expected[i++],
        null,
        j < actual.length ? j : Math.max(0, j - 1),
      );
    } else {
      push("change", null, actual[j], j);
      j++;
    }
  }
  return parts;
}
