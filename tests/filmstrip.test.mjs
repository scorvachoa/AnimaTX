import test from "node:test";
import assert from "node:assert/strict";
import { filmstripTiles } from "../src/filmstrip.mjs";
test("miniaturas conservan proporción y cubren solo la región visible", () => {
  const t = filmstripTiles(16000, 800, 9000, 9 / 16, 120);
  assert.ok(t.length < 30);
  assert.ok(t.every((t) => t.width === 36 && t.height === 64));
  assert.ok(t[0].left <= 9000);
  assert.ok(t.at(-1).left + t.at(-1).width >= 9800);
  assert.ok(t.every((t) => t.index >= 0 && t.index < 120));
});
test("el fotograma se corresponde al instante de la pista y al final no excede la hoja", () => {
  const a = filmstripTiles(1000, 300, 0, 16 / 9, 20),
    b = filmstripTiles(1000, 300, 700, 16 / 9, 20);
  assert.ok(a[0].index < b[0].index);
  assert.ok(b.at(-1).index < 20);
  assert.deepEqual(filmstripTiles(0, 300, 0, 1, 12), []);
});
