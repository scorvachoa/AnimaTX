import test from "node:test";
import assert from "node:assert/strict";
import { adaptScript } from "../src/adapt-script.mjs";
import { validateProject } from "../server/validation.mjs";
const words = (text) =>
  text
    .split(" ")
    .map((text, i) => ({ id: String(i), text, start: i, end: i + 1 }));
for (const [source, script] of [
  ["Hola mundo", "Hola hermoso mundo"],
  ["Hola hermoso mundo", "Hola mundo"],
  ["uno dos tres", "otro texto completamente diferente"],
  ["hola hola mundo", "hola mundo"],
  ["a b c d e f g", "a b X d e f g"],
  ["a b", "antes a b después"],
  ["Hola mundo", "Hola mundo"],
])
  test(`adaptación exacta: ${script}`, () => {
    const input = words(source),
      before = structuredClone(input);
    const result = adaptScript(script, input, input.length);
    assert.equal(result.words.map((w) => w.text).join(" "), script);
    assert.deepEqual(input, before);
    assert.equal(
      new Set(result.words.map((w) => w.id)).size,
      result.words.length,
    );
    validateProject({
      duration: input.length,
      words: result.words,
      style: {
        fontSize: 64,
        y: 76,
        wordsPerBlock: 4,
        animation: "none",
        color: "#ffffff",
        activeColor: "#ffffff",
        outline: "#000000",
      },
    });
    if (source === "a b c d e f g")
      assert.deepEqual(result.words.at(-1), input.at(-1));
  });
test("rechaza guion vacío o transcripción sin tiempos", () => {
  assert.throws(() => adaptScript("", words("a"), 1));
  assert.throws(() => adaptScript("a", [], 1));
});
test("una sustitución uno a uno conserva los tiempos originales", () => {
  const input = words("hola mundo");
  const adapted = adaptScript("Hola planeta", input, 2);
  assert.equal(adapted.estimated, false);
  assert.deepEqual(
    adapted.words.map(({ start, end }) => ({ start, end })),
    input.map(({ start, end }) => ({ start, end })),
  );
});
