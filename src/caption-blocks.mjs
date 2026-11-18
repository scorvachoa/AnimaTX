const dangling = new Set(
  "el la los las un una unos unas de del a al en con sin por para que y o ni su sus mi mis tu tus se me te lo le les como".split(
    " ",
  ),
);
const token = (w) => w.text.toLocaleLowerCase().replace(/[^\p{L}]/gu, "");
const sentence = (w) => /[.!?…]["»”')]*$/.test(w.text);
const punctuation = (w) => /[,;:]["»”')]*$/.test(w.text);
export function activeCaptionBlock(blocks, time) {
  return blocks.find(
    (block) => time >= block[0].start && time < block.at(-1).end,
  );
}
function cost(words, n, target) {
  const last = words[n - 1],
    next = words[n];
  let score = Math.abs(n - target) * 1.4;
  if (dangling.has(token(last))) score += 7;
  if (sentence(last)) score -= 7;
  else if (punctuation(last)) score -= 3;
  if (next) score -= Math.min(3, Math.max(0, next.start - last.end) * 8);
  if (n === 1 && words.length > 1) score += 2;
  return score;
}
export function captionBlocks(words, limit = 4) {
  const blocks = [];
  const target = Math.max(1, Math.round(limit));
  let i = 0;
  while (i < words.length) {
    // Explicit/imported blocks are authoritative, even after template changes.
    if (words[i].cueId) {
      let end = i + 1;
      while (end < words.length && words[end].cueId === words[i].cueId) end++;
      blocks.push(words.slice(i, end));
      i = end;
      continue;
    }
    let end = i;
    while (end < words.length && end < i + target + 3 && !words[end].cueId) {
      if (
        end > i &&
        (words[end].start - words[end - 1].end > 0.6 ||
          sentence(words[end - 1]))
      )
        break;
      end++;
    }
    const run = words.slice(i, end);
    let max = Math.min(run.length, target === 1 ? 1 : target + 2);
    for (let n = 2; n <= max; n++) {
      if (
        run[n - 1].end - run[0].start > 4 ||
        run
          .slice(0, n)
          .map((w) => w.text)
          .join(" ").length > 64
      ) {
        max = n - 1;
        break;
      }
    }
    let best = 1,
      score = Infinity;
    for (let n = 1; n <= max; n++) {
      const candidate = cost(run, n, target) + (run.length - n === 1 ? 3 : 0);
      if (candidate < score) {
        best = n;
        score = candidate;
      }
    }
    blocks.push(run.slice(0, best));
    i += best;
  }
  return blocks;
}
export function captionLineSplit(words, preferred) {
  if (words.length < 2) return 1;
  if (preferred != null)
    return Math.max(1, Math.min(preferred, words.length - 1));
  let best = 1,
    score = Infinity;
  const total = words.map((w) => w.text).join(" ").length;
  for (let n = 1; n < words.length; n++) {
    const left = words
      .slice(0, n)
      .map((w) => w.text)
      .join(" ").length;
    const candidate =
      (Math.abs(total - 2 * left) / Math.max(1, total)) * 4 +
      (dangling.has(token(words[n - 1])) ? 6 : 0) -
      (punctuation(words[n - 1]) ? 2 : 0);
    if (candidate < score) {
      best = n;
      score = candidate;
    }
  }
  return best;
}
export function editCaptionBlocks(words, limit, action, wordId) {
  if (action === "auto") return words.map(({ cueId, ...word }) => word);
  const blocks = captionBlocks(words, limit).map((b) => b.slice());
  const index = blocks.findIndex((b) => b.some((w) => w.id === wordId));
  if (index < 0) return words;
  if (action === "join" && index < blocks.length - 1)
    blocks.splice(index, 2, [...blocks[index], ...blocks[index + 1]]);
  else if (action === "split") {
    const at = blocks[index].findIndex((w) => w.id === wordId) + 1;
    if (at >= blocks[index].length) return words;
    blocks.splice(
      index,
      1,
      blocks[index].slice(0, at),
      blocks[index].slice(at),
    );
  } else return words;
  return blocks.flatMap((b) =>
    b.map((w) => ({ ...w, cueId: `manual-${b[0].id}` })),
  );
}
