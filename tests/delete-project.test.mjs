import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { deleteProjectFiles } from "../server/delete-project.mjs";
test("elimina solo el proyecto indicado y rechaza rutas fuera de la carpeta de datos", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "animatx-delete-test-"));
  const id = "12345678-1234-1234-1234-123456789abc",
    neighbor = "87654321-4321-4321-4321-cba987654321";
  try {
    await fs.mkdir(path.join(root, id));
    await fs.writeFile(path.join(root, id, "project.json"), "{}");
    await fs.mkdir(path.join(root, neighbor));
    await fs.writeFile(path.join(root, neighbor, "keep.txt"), "conservar");
    for (const invalid of [
      "../otra-carpeta",
      "..",
      root,
      "------------------------------------",
    ])
      await assert.rejects(() => deleteProjectFiles(root, invalid), /inválido/);
    await deleteProjectFiles(root, id);
    await assert.rejects(() => fs.access(path.join(root, id)), {
      code: "ENOENT",
    });
    assert.equal(
      await fs.readFile(path.join(root, neighbor, "keep.txt"), "utf8"),
      "conservar",
    );
    await assert.rejects(() => deleteProjectFiles(root, id), {
      code: "ENOENT",
    });
  } finally {
    const resolved = path.resolve(root);
    if (
      path.dirname(resolved) !== path.resolve(os.tmpdir()) ||
      !path.basename(resolved).startsWith("animatx-delete-test-")
    )
      throw Error("Ruta temporal inesperada");
    await fs.rm(resolved, { recursive: true, force: true });
  }
});
