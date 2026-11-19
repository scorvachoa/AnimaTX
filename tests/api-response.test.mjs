import test from "node:test";
import assert from "node:assert/strict";
import { readApiResponse } from "../src/api-response.mjs";
test("respuesta HTML de servidor antiguo produce mensaje útil sin mostrar HTML", async () => {
  const response = new Response(
    "<!DOCTYPE html><html>Cannot DELETE /api/projects/id</html>",
    { status: 404, headers: { "content-type": "text/html" } },
  );
  await assert.rejects(() => readApiResponse(response), /Reinicia AnimaTX/);
});
test("errores JSON del borrado se conservan y las respuestas válidas se leen", async () => {
  await assert.rejects(
    () =>
      readApiResponse(
        Response.json(
          { error: "Espera a que termine el trabajo." },
          { status: 409 },
        ),
      ),
    /Espera a que termine/,
  );
  assert.deepEqual(await readApiResponse(Response.json({ deleted: true })), {
    deleted: true,
  });
  await assert.rejects(
    () =>
      readApiResponse(
        new Response("{", { headers: { "content-type": "application/json" } }),
      ),
    /respuesta del servidor no es válida/,
  );
});
