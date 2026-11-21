import test from "node:test";
import assert from "node:assert/strict";
import { insertWordAt } from "../src/insert-word.mjs";
import { validateProject } from "../server/validation.mjs";
const word = (id, start, end, extra = {}) => ({
  id,
  text: id,
  start,
  end,
  ...extra,
});
const check = (words) =>
  validateProject({
    duration: 3,
    words,
    style: {
      fontSize: 64,
      y: 76,
      wordsPerBlock: 4,
      animation: "karaoke",
      color: "#ffffff",
      activeColor: "#ffffff",
      outline: "#111111",
    },
  });
test("inserta al inicio, entre palabras y al final aprovechando huecos sin modificar vecinos", () => {
  const original = [word("a", 0.5, 1), word("b", 2, 2.5)];
  for (const index of [0, 1, 2]) {
    const result = insertWordAt(original, index, 3, "new");
    check(result.words);
    assert.equal(result.words[index].id, "new");
    assert.deepEqual(
      result.words.filter((w) => w.id !== "new"),
      original,
    );
    assert.equal(result.adjustedId, undefined);
  }
});
test("sin hueco reparte el intervalo con el siguiente y conserva estilos, ids y cortes", () => {
  const original = [
    word("a", 0, 1, { cueId: "first" }),
    word("b", 1, 2, { cueId: "second", style: { color: "#ff0000" } }),
  ];
  const snapshot = structuredClone(original);
  const result = insertWordAt(original, 1, 3, "new", "a");
  check(result.words);
  assert.equal(result.word.cueId, "first");
  assert.equal(result.word.start, 1);
  assert.equal(result.word.end, 1.5);
  assert.equal(result.words[2].start, 1.5);
  assert.equal(result.words[2].end, 2);
  assert.deepEqual(result.words[2].style, original[1].style);
  assert.deepEqual(original, snapshot);
});
test("permite insertar al final cuando el video ya está ocupado", () => {
  const result = insertWordAt([word("a", 0, 3)], 1, 3, "new");
  check(result.words);
  assert.equal(result.words[0].end, 1.5);
  assert.equal(result.word.start, 1.5);
  assert.equal(result.word.end, 3);
});
test("crea la primera palabra y rechaza falta de espacio, ids repetidos o tiempos inválidos", () => {
  check(insertWordAt([], 0, 3, "new").words);
  assert.throws(
    () => insertWordAt([word("a", 0, 0.04)], 0, 0.04, "new"),
    /tiempo suficiente/,
  );
  assert.throws(
    () => insertWordAt([word("a", 0, 1)], 0, 3, "a"),
    /Identificador/,
  );
  assert.throws(() => insertWordAt([], 1, 3, "new"), /Posición/);
  assert.throws(() => insertWordAt([word("a", 1, 0)], 0, 3, "new"), /Corrige/);
});
