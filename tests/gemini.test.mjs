import test from "node:test";
import assert from "node:assert/strict";
import {
  reviewWithGemini,
  validateSuggestions,
  testGeminiConnection,
} from "../server/gemini.mjs";
const words = [
  { id: "a", text: "hola", start: 0, end: 1 },
  { id: "b", text: "como", start: 1, end: 2 },
];
test("la prueba de conexión usa un saludo sintético y no devuelve la clave", async () => {
  let payload;
  const response = await testGeminiConnection({
    apiKey: "secret-test-key",
    model: "gemini-3.8-flash",
    fetchImpl: async (url, options) => {
      payload = JSON.parse(options.body);
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
  assert.deepEqual(JSON.parse(payload.contents[0].parts[0].text).words, [
    { id: "connection-test", text: "Hola." },
  ]);
  assert.equal(response.ok, true);
  assert.doesNotMatch(JSON.stringify(response), /secret-test-key/);
  await assert.rejects(
    testGeminiConnection({ apiKey: "", model: "gemini-3.8-flash" }),
    /clave/,
  );
});
test("Gemini recibe solo ids/texto y devuelve propuestas sin modificar los tiempos", async () => {
  const before = structuredClone(words);
  let sent;
  const result = await reviewWithGemini({
    apiKey: "test-key",
    words,
    fetchImpl: async (url, options) => {
      assert.match(url, /generativelanguage.googleapis.com/);
      assert.equal(options.headers["x-goog-api-key"], "test-key");
      sent = JSON.parse(options.body);
      assert.equal(sent.generationConfig.responseMimeType, "application/json");
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      edits: [
                        { id: "b", text: "cómo", reason: "Interrogativo" },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
    },
  });
  assert.deepEqual(JSON.parse(sent.contents[0].parts[0].text).words, [
    { id: "a", text: "hola" },
    { id: "b", text: "como" },
  ]);
  assert.equal(result[0].original, "como");
  assert.equal(result[0].text, "cómo");
  assert.deepEqual(words, before);
});
test("rechaza claves ausentes, cuotas agotadas y respuesta truncada sin revelar la clave", async () => {
  await assert.rejects(reviewWithGemini({ apiKey: "", words }), /clave/);
  await assert.rejects(
    reviewWithGemini({
      apiKey: "secret",
      words,
      fetchImpl: async () => ({ ok: false, status: 429 }),
    }),
    /Cuota/,
  );
  await assert.rejects(
    reviewWithGemini({
      apiKey: "secret",
      words,
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ candidates: [{ finishReason: "MAX_TOKENS" }] }),
      }),
    }),
    /no completó/,
  );
});
test("rechaza palabras añadidas, ids inventados y propuestas duplicadas", () => {
  for (const edits of [
    [{ id: "b", text: "cómo estás", reason: "x" }],
    [{ id: "unknown", text: "Hola", reason: "x" }],
    [
      { id: "a", text: "Hola", reason: "x" },
      { id: "a", text: "Hola", reason: "x" },
    ],
  ])
    assert.throws(() => validateSuggestions({ edits }, words));
  assert.deepEqual(validateSuggestions({ edits: [] }, words), []);
});
