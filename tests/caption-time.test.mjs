import test from "node:test";
import assert from "node:assert/strict";
import { captionTime } from "../src/caption-time.mjs";
test("adelanta 150ms sin modificar los tiempos del video", () => {
  assert.equal(captionTime(0.85), 1);
  assert.equal(captionTime(0.7, 300), 1);
  assert.equal(captionTime(1, 0), 1);
});
test("permite retrasar y evita mostrar subtítulos antes de tiempo al inicio", () => {
  assert.equal(captionTime(1.2, -200), 1);
  assert.equal(captionTime(0, -200), -0.2);
  assert.equal(captionTime(0, 150), 0.15);
});
