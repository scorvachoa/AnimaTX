const frame = 1 / 30;
export function insertWordAt(words, index, duration, id, referenceId) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index > words.length ||
    !Number.isFinite(duration) ||
    duration <= 0
  )
    throw Error("Posición de inserción inválida.");
  if (words.length >= 10000)
    throw Error("El proyecto admite hasta 10 000 palabras.");
  if (!id || words.some((word) => word.id === id))
    throw Error("Identificador de palabra inválido.");
  if (
    words.some(
      (word, i) =>
        !Number.isFinite(word.start) ||
        !Number.isFinite(word.end) ||
        word.start < 0 ||
        word.end <= word.start ||
        word.end > duration ||
        (i > 0 && word.start < words[i - 1].end),
    )
  )
    throw Error("Corrige los tiempos actuales antes de insertar una palabra.");
  const previous = words[index - 1],
    next = words[index];
  const left = previous?.end ?? 0,
    right = next?.start ?? duration;
  const result = words.slice();
  let start, end, adjustedId;
  if (right - left >= frame) {
    start = left;
    end = Math.min(right, left + 0.5);
  } else if (next && next.end - next.start >= 2 * frame) {
    start = next.start;
    end = start + (next.end - start) / 2;
    result[index] = { ...next, start: end };
    adjustedId = next.id;
  } else if (previous && previous.end - previous.start >= 2 * frame) {
    end = previous.end;
    start = previous.start + (end - previous.start) / 2;
    result[index - 1] = { ...previous, end: start };
    adjustedId = previous.id;
  } else
    throw Error(
      "No hay tiempo suficiente aquí. Amplía el hueco o la duración de una palabra vecina.",
    );
  const reference =
    words.find((word) => word.id === referenceId) ?? next ?? previous;
  const word = {
    id,
    text: "Palabra",
    start,
    end,
    ...(reference?.cueId ? { cueId: reference.cueId } : {}),
  };
  result.splice(index, 0, word);
  return { words: result, word, adjustedId };
}
