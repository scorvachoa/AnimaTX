import { captionBlocks } from "./caption-blocks.mjs";
import { adaptScript } from "./adapt-script.mjs";
export const blockTextKey = (block) =>
  block[0].cueId ?? `manual-${block[0].id}`;
export function editCaptionText(words, limit, key, text) {
  const tokens = text.trim().split(/\s+/u).filter(Boolean);
  if (tokens.some((token) => token.length > 300))
    throw Error("Cada palabra admite hasta 300 caracteres.");
  const blocks = captionBlocks(words, limit);
  const index = blocks.findIndex((block) => blockTextKey(block) === key);
  if (index < 0) throw Error("La frase ha cambiado. Vuelve a seleccionarla.");
  const block = blocks[index];
  if (!tokens.length) {
    blocks.splice(index, 1);
    return {
      words: blocks.flatMap((items) =>
        items.map((word) => ({ ...word, cueId: blockTextKey(items) })),
      ),
      estimated: false,
    };
  }
  if (tokens.join(" ") === block.map((word) => word.text).join(" "))
    return { words, estimated: false };
  if (words.length - block.length + tokens.length > 10000)
    throw Error("El proyecto admite hasta 10 000 palabras.");
  const adapted = adaptScript(tokens.join(" "), block, block.at(-1).end);
  const cue = blockTextKey(block);
  blocks[index] = adapted.words.map((word) => ({ ...word, cueId: cue }));
  return {
    words: blocks.flatMap((items) =>
      items.map((word) => ({ ...word, cueId: blockTextKey(items) })),
    ),
    estimated: adapted.estimated,
  };
}
export function splitCaptionText(words, limit, key, text, cursor) {
  const at = Math.max(0, Math.min(text.length, cursor));
  const left = text.slice(0, at).trim(),
    right = text.slice(at).trim();
  if (!left || !right) return { words, focusKey: null };
  const edited = editCaptionText(words, limit, key, `${left} ${right}`).words;
  const blocks = captionBlocks(edited, limit);
  const index = blocks.findIndex((block) => blockTextKey(block) === key);
  const count = left.split(/\s+/u).length;
  const block = blocks[index];
  const focusKey = `split-${crypto.randomUUID()}`;
  blocks.splice(
    index,
    1,
    block.slice(0, count).map((word) => ({ ...word, cueId: key })),
    block.slice(count).map((word) => ({ ...word, cueId: focusKey })),
  );
  return {
    words: blocks.flatMap((items) =>
      items.map((word) => ({ ...word, cueId: blockTextKey(items) })),
    ),
    focusKey,
  };
}
