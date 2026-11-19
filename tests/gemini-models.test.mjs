import test from "node:test";
import assert from "node:assert/strict";
import { listGeminiModels } from "../server/gemini-models.mjs";
const model = (name, methods = ["generateContent"]) => ({
  name: "models/" + name,
  displayName: name,
  supportedGenerationMethods: methods,
});
test("lista modelos de texto sin exponer la clave y filtra imágenes, audio y embeddings", async () => {
  const key = "private-key";
  const models = await listGeminiModels({
    apiKey: key,
    fetchImpl: async (url, options) => {
      assert.ok(
        url.startsWith(
          "https://generativelanguage.googleapis.com/v1beta/models?",
        ),
      );
      assert.ok(!url.includes(key));
      assert.equal(options.headers["x-goog-api-key"], key);
      return Response.json({
        models: [
          model("gemini-2.5-flash"),
          model("gemini-2.5-pro"),
          model("gemini-image"),
          model("gemini-audio"),
          model("gemini-tts"),
          model("gemini-embedding", ["embedContent"]),
          model("other-model"),
        ],
      });
    },
  });
  assert.deepEqual(
    models.map((m) => m.id),
    ["gemini-2.5-flash", "gemini-2.5-pro"],
  );
  assert.ok(!JSON.stringify(models).includes(key));
});
test("recorre páginas y elimina duplicados", async () => {
  let calls = 0;
  const models = await listGeminiModels({
    apiKey: "test",
    fetchImpl: async (url) => {
      calls++;
      if (calls === 1)
        return Response.json({
          models: [model("gemini-2.5-flash")],
          nextPageToken: "next",
        });
      assert.equal(new URL(url).searchParams.get("pageToken"), "next");
      return Response.json({
        models: [model("gemini-2.5-flash"), model("gemini-2.5-pro")],
      });
    },
  });
  assert.equal(calls, 2);
  assert.equal(models.length, 2);
});
test("errores de Google y de red no revelan clave ni contenido de la respuesta", async () => {
  await assert.rejects(listGeminiModels({ apiKey: "" }), /clave/);
  await assert.rejects(
    listGeminiModels({
      apiKey: "private",
      fetchImpl: async () => new Response("private", { status: 403 }),
    }),
    (error) =>
      /clave o sus permisos/.test(error.message) &&
      !error.message.includes("private"),
  );
  await assert.rejects(
    listGeminiModels({
      apiKey: "private",
      fetchImpl: async () => {
        throw Error("private");
      },
    }),
    (error) =>
      /conectar/.test(error.message) && !error.message.includes("private"),
  );
});
test("rechaza paginación repetida y JSON inválido", async () => {
  await assert.rejects(
    listGeminiModels({
      apiKey: "test",
      fetchImpl: async () =>
        Response.json({ models: [], nextPageToken: "same" }),
    }),
    /paginación/,
  );
  await assert.rejects(
    listGeminiModels({
      apiKey: "test",
      fetchImpl: async () => new Response("<html>"),
    }),
    /lista de modelos/,
  );
});
