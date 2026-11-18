const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function editWordTiming(words, id, mode, delta, duration) {
  const index = words.findIndex((w) => w.id === id);
  if (index < 0 || !Number.isFinite(delta) || !Number.isFinite(duration))
    return words;
  const word = words[index],
    left = index ? words[index - 1].end : 0,
    right = index < words.length - 1 ? words[index + 1].start : duration;
  const minimum = Math.min(1 / 30, word.end - word.start);
  let start = word.start,
    end = word.end;
  if (mode === "move") {
    const shift = clamp(delta, left - word.start, right - word.end);
    start += shift;
    end += shift;
  } else if (mode === "start")
    start = clamp(word.start + delta, left, word.end - minimum);
  else if (mode === "end")
    end = clamp(word.end + delta, word.start + minimum, right);
  else return words;
  // Avoid floating-point spillover into neighboring words at exact boundaries.
  start = Math.max(left, start);
  end = Math.min(right, end);
  return words.map((w) => (w.id === id ? { ...w, start, end } : w));
}
