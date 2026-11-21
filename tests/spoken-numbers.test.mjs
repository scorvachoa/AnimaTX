import test from "node:test";
import assert from "node:assert/strict";
import { spokenNumber, spokenScriptToken } from "../server/spoken-numbers.mjs";
import { scriptTokens, alignCTC } from "../server/ctc-align.mjs";
test("normaliza enteros, años, miles y decimales sin cambiar la escritura original", () => {
  const cases = [
    ["0", "cero"],
    ["16", "dieciseis"],
    ["25", "veinticinco"],
    ["31", "treinta y uno"],
    ["100", "cien"],
    ["150", "ciento cincuenta"],
    ["2026", "dos mil veintiseis"],
    ["1.000", "mil"],
    ["21.000", "veintiun mil"],
    ["1,500", "mil quinientos"],
    ["2,5", "dos coma cinco"],
    ["1.234,50", "mil doscientos treinta y cuatro coma cinco cero"],
    ["001", "cero cero uno"],
  ];
  for (const [number, spoken] of cases) {
    assert.equal(spokenNumber(number), spoken);
    assert.deepEqual(scriptTokens(number).words, [number]);
    assert.deepEqual(scriptTokens(number).tokens, scriptTokens(spoken).tokens);
  }
});
test("normaliza porcentajes, horas, importes y números negativos", () => {
  for (const [source, spoken] of [
    ["25%", "veinticinco por ciento"],
    ["10:30", "diez y treinta"],
    ["06:00", "seis"],
    ["S/25", "veinticinco soles"],
    ["$10", "diez dolares"],
    ["-5", "menos cinco"],
    ["6-8", "seis a ocho"],
    ["€1", "un euro"],
  ])
    assert.deepEqual(
      scriptTokens(source).tokens,
      scriptTokens(spoken).tokens,
      source,
    );
  assert.equal(spokenNumber("25", "en"), "twenty five");
  assert.equal(spokenNumber("25", "pt"), "vinte e cinco");
  assert.deepEqual(
    scriptTokens("25%", "en").tokens,
    scriptTokens("twenty five percent", "en").tokens,
  );
  assert.ok(!/\d/.test(spokenScriptToken("1080p")));
});
test("CTC alinea los sonidos del número y devuelve dígitos con sus tiempos", () => {
  const script = "En 2026 cuesta 25%.",
    { tokens, owners, words } = scriptTokens(script);
  assert.equal(owners.length, tokens.length);
  assert.equal(new Set(owners).size, words.length);
  const labels = [0, ...tokens.flatMap((id) => [id, 0])],
    classes = 31;
  const logits = new Float32Array(labels.length * classes).fill(-10);
  labels.forEach((id, t) => {
    logits[t * classes + id] = 10;
  });
  const result = alignCTC(logits, labels.length, classes, script, 8);
  assert.deepEqual(
    result.words.map((w) => w.text),
    ["En", "2026", "cuesta", "25%."],
  );
  assert.ok(result.confidence > 0.99);
  assert.ok(
    result.words.every(
      (w, i) =>
        w.start >= 0 &&
        w.end > w.start &&
        w.end <= 8 &&
        (!i || w.start >= result.words[i - 1].end),
    ),
  );
});
