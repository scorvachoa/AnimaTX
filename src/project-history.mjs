export function historyGroup(previous, next) {
  if (previous.script !== next.script) return "script";
  if (JSON.stringify(previous.style) !== JSON.stringify(next.style))
    return (
      "style:" +
      Object.keys(next.style)
        .filter((k) => previous.style[k] !== next.style[k])
        .join(",")
    );
  if (previous.words.length !== next.words.length) return "structure";
  const changed = next.words.filter(
    (w, i) => JSON.stringify(w) !== JSON.stringify(previous.words[i]),
  );
  return changed.length === 1 ? "word:" + changed[0].id : "words";
}
export function recordHistory(history, previous, next, now = Date.now()) {
  if (
    !previous ||
    previous.id !== next.id ||
    JSON.stringify(previous) === JSON.stringify(next)
  )
    return history;
  const group = historyGroup(previous, next),
    coalesce = history.group === group && now - history.at < 600;
  return {
    past: coalesce ? history.past : [...history.past, previous].slice(-50),
    future: [],
    group,
    at: now,
  };
}
