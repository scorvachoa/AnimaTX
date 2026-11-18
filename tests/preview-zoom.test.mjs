import test from "node:test";
import assert from "node:assert/strict";
import { zoomPreview } from "../src/preview-zoom.mjs";
test("zoom de vista previa conserva el punto bajo el cursor", () => {
  const r = zoomPreview(
    { zoom: 1, x: 0, y: 0 },
    2,
    { x: 250, y: 150 },
    800,
    400,
  );
  assert.deepEqual(r, { zoom: 2, x: -250, y: -150 });
  assert.equal((250 - r.x) / r.zoom, 250);
  assert.equal((150 - r.y) / r.zoom, 150);
});
test("límites y encaje centrado no modifican el proyecto", () => {
  assert.equal(
    zoomPreview({ zoom: 1, x: 0, y: 0 }, 10, { x: 0, y: 0 }, 800, 400).zoom,
    4,
  );
  assert.deepEqual(
    zoomPreview(
      { zoom: 2, x: -100, y: -100 },
      0.1,
      { x: 200, y: 200 },
      800,
      400,
    ),
    { zoom: 0.25, x: 300, y: 150 },
  );
  assert.deepEqual(
    zoomPreview({ zoom: 2, x: -100, y: -100 }, 1, { x: 200, y: 200 }, 800, 400),
    { zoom: 1, x: 0, y: 0 },
  );
});
