import test from "node:test";
import assert from "node:assert/strict";
import { editWordTiming } from "../src/timeline-edit.mjs";
const words = [
  { id: "a", text: "Hola", start: 0.2, end: 0.6 },
  { id: "b", text: "mundo", start: 1, end: 1.5 },
  { id: "c", text: "fin", start: 2, end: 2.5 },
];
test("mover conserva duración y texto y deja intactos los vecinos", () => {
  const original = structuredClone(words);
  const result = editWordTiming(words, "b", "move", 0.25, 3);
  assert.equal(result[1].start, 1.25);
  assert.equal(result[1].end, 1.75);
  assert.deepEqual(result[0], words[0]);
  assert.deepEqual(words, original);
});
test("mover respeta los límites del video y los subtítulos vecinos", () => {
  let r = editWordTiming(words, "b", "move", 99, 3);
  assert.equal(r[1].end, 2);
  r = editWordTiming(words, "a", "move", -99, 3);
  assert.equal(r[0].start, 0);
  r = editWordTiming(words, "c", "move", 99, 3);
  assert.equal(r[2].end, 3);
});
test("los bordes cambian la duración sin solapamientos ni duración cero", () => {
  let r = editWordTiming(words, "b", "start", -99, 3);
  assert.equal(r[1].start, 0.6);
  r = editWordTiming(words, "b", "end", 99, 3);
  assert.equal(r[1].end, 2);
  r = editWordTiming(words, "b", "end", -99, 3);
  assert.ok(r[1].end > r[1].start);
  assert.ok(Math.abs(r[1].end - r[1].start - 1 / 30) < 1e-10);
});
test("no modifica ids ausentes ni deltas inválidos", () => {
  assert.equal(editWordTiming(words, "none", "move", 1, 3), words);
  assert.equal(editWordTiming(words, "a", "move", NaN, 3), words);
});
