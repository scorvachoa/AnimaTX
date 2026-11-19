// Display-only filtering; retain source indices for typewriter timing.
export function captionCharacters(text, hidePunctuation = false) {
  return Array.from(text, (letter, index) => ({ letter, index })).filter(
    ({ letter }) => !hidePunctuation || !/[.,;:]/.test(letter),
  );
}
export function captionDisplayText(text, hidePunctuation = false) {
  return captionCharacters(text, hidePunctuation)
    .map(({ letter }) => letter)
    .join("");
}
