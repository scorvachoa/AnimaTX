import test from "node:test";
import assert from "node:assert/strict";
import { editCaptionText, blockTextKey } from "../src/edit-caption-text.mjs";
import { captionBlocks } from "../src/caption-blocks.mjs";
const words = [
  { id: "a", text: "Hola", start: 1, end: 1.5, style: { color: "#ffffff" } },
  { id: "b", text: "mundo.", start: 1.5, end: 2 },
  { id: "c", text: "Otra", start: 3, end: 3.5 },
  { id: "d", text: "frase.", start: 3.5, end: 4 },
];
const key = blockTextKey(captionBlocks(words, 4)[0]);
test("edición directa conserva ids, estilos y tiempos al corregir palabras", () => {
  const result = editCaptionText(words, 4, key, "Hola gente.");
  assert.equal(result.estimated, false);
  assert.deepEqual(
    result.words.map((w) => [w.id, w.start, w.end]),
    words.map((w) => [w.id, w.start, w.end]),
  );
  assert.equal(result.words[1].text, "gente.");
  assert.deepEqual(result.words[0].style, words[0].style);
  assert.equal(blockTextKey(captionBlocks(result.words, 4)[0]), key);
  assert.deepEqual(words[1].text, "mundo.");
});
test("insertar o quitar palabras solo redistribuye el intervalo de la frase", () => {
  for (const text of ["Qué hermoso mundo nuevo.", "Hola."]) {
    const result = editCaptionText(words, 4, key, text);
    const blocks = captionBlocks(result.words, 1);
    assert.equal(blocks.length, 2);
    assert.equal(blockTextKey(blocks[0]), key);
    assert.equal(blocks[0].map((w) => w.text).join(" "), text);
    assert.ok(blocks[0][0].start >= 1);
    assert.ok(blocks[0].at(-1).end <= 2);
    assert.deepEqual(
      blocks[1].map(({ cueId, ...w }) => w),
      words.slice(2),
    );
    assert.ok(
      result.words.every(
        (w, i) => w.start < w.end && (!i || w.start >= result.words[i - 1].end),
      ),
    );
    const changed = editCaptionText(result.words, 4, key, text + " Más.");
    assert.equal(blockTextKey(captionBlocks(changed.words, 4)[0]), key);
  }
});
test("espacios redundantes no alteran y vaciar la frase elimina solo sus palabras", () => {
  assert.equal(editCaptionText(words, 4, key, "  Hola   mundo. ").words, words);
  const removed = editCaptionText(words, 4, key, "   ");
  assert.deepEqual(
    removed.words.map(({ cueId, ...word }) => word),
    words.slice(2),
  );
  assert.deepEqual(editCaptionText(words.slice(0, 2), 4, key, "").words, []);
  assert.throws(() => editCaptionText(words, 4, "missing", "Texto"));
  assert.throws(() => editCaptionText(words, 4, key, "x".repeat(301)));
});

test("Enter divide en el cursor, conserva tiempos y prepara el foco de la segunda frase", async () => {
  const { splitCaptionText } = await import("../src/edit-caption-text.mjs");
  const result = splitCaptionText(words, 4, key, "Hola mundo.", 5);
  const blocks = captionBlocks(result.words, 4);
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].map((w) => w.text).join(" "), "Hola");
  assert.equal(blocks[1].map((w) => w.text).join(" "), "mundo.");
  assert.equal(blockTextKey(blocks[1]), result.focusKey);
  assert.deepEqual(
    result.words.map((w) => [w.id, w.start, w.end]),
    words.map((w) => [w.id, w.start, w.end]),
  );
  assert.deepEqual(splitCaptionText(words, 4, key, "Hola mundo.", 0), {
    words,
    focusKey: null,
  });
  assert.deepEqual(splitCaptionText(words, 4, key, "Hola mundo.", 11), {
    words,
    focusKey: null,
  });
});
test("Enter dentro de una palabra reparte su intervalo sin afectar las frases vecinas", async () => {
  const { splitCaptionText } = await import("../src/edit-caption-text.mjs");
  const result = splitCaptionText(words, 4, key, "Hola mundo.", 2);
  const blocks = captionBlocks(result.words, 4);
  assert.equal(blocks[0][0].text, "Ho");
  assert.equal(blocks[1].map((w) => w.text).join(" "), "la mundo.");
  assert.equal(blocks[0][0].start, 1);
  assert.equal(blocks[1].at(-1).end, 2);
  assert.deepEqual(
    blocks[2].map(({ cueId, ...w }) => w),
    words.slice(2),
  );
  assert.ok(
    result.words.every(
      (w, i) => w.end > w.start && (!i || w.start >= result.words[i - 1].end),
    ),
  );
});
