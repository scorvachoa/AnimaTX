import test from "node:test";
import assert from "node:assert/strict";
import { compareScript } from "../src/compare-script.mjs";
import { reviewWithGemini } from "../server/gemini.mjs";
const words = (text) =>
  text
    .split(" ")
    .map((text, i) => ({ id: String(i), text, start: i, end: i + 1 }));
test("alinea sustituciones, omisiones y repeticiones sin modificar tiempos", () => {
  const w = words("Hola mundo otra vez");
  const before = structuredClone(w);
  const diff = compareScript("Hola hermoso mundo vez", w);
  assert.deepEqual(
    diff.flatMap((p) => p.reference),
    ["Hola", "hermoso", "mundo", "vez"],
  );
  assert.deepEqual(
    diff.flatMap((p) => p.transcript),
    w.map((w) => w.text),
  );
  assert.equal(diff.filter((p) => p.kind === "change").length, 2);
  assert.deepEqual(w, before);
  assert.equal(
    compareScript("hola hola mundo", words("hola mundo")).filter(
      (p) => p.kind === "change",
    ).length,
    1,
  );
});
test("resalta tildes y puntuación, admite texto vacío y limita el tamaño", () => {
  assert.equal(compareScript("Cómo", words("Como"))[0].kind, "change");
  assert.equal(compareScript("Hola,", words("Hola"))[0].kind, "change");
  assert.equal(compareScript("Hola", [])[0].transcript.length, 0);
  assert.deepEqual(compareScript("", []), []);
  assert.throws(() => compareScript("x ".repeat(2001), []), /2000/);
});
test("Gemini recibe el guion solo cuando se proporciona explícitamente", async () => {
  for (const script of [undefined, "Hola mundo"]) {
    let sent;
    await reviewWithGemini({
      apiKey: "test",
      words: words("Hola mundo"),
      script,
      fetchImpl: async (url, options) => {
        sent = JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                finishReason: "STOP",
                content: { parts: [{ text: '{"edits":[]}' }] },
              },
            ],
          }),
        };
      },
    });
    assert.equal(sent.referenceScript, script);
  }
});
