import test from "node:test";
import assert from "node:assert/strict";
import {
  positionOffset,
  offsetPosition,
  constrainPosition,
  alignPosition,
  positionBounds,
} from "../src/caption-position.mjs";
test("coordenadas centradas: derecha/arriba positivas, izquierda/abajo negativas", () => {
  assert.equal(positionOffset("x", 50), 0);
  assert.equal(positionOffset("y", 50), 0);
  assert.equal(positionOffset("x", 75), 25);
  assert.equal(positionOffset("y", 25), 25);
  assert.equal(positionOffset("x", 25), -25);
  assert.equal(positionOffset("y", 75), -25);
  for (const axis of ["x", "y"])
    for (const offset of [-45, -10, 0, 10, 45])
      assert.equal(positionOffset(axis, offsetPosition(axis, offset)), offset);
});
test("imán dentro de un punto del centro, con ajuste fino por teclado sin bloqueo", () => {
  for (const axis of ["x", "y"])
    for (const value of [-1, -0.1, 0, 0.1, 1])
      assert.equal(offsetPosition(axis, value), 50);
  assert.equal(offsetPosition("x", 1.1), 51.1);
  assert.equal(offsetPosition("y", -1.1), 51.1);
  assert.equal(offsetPosition("x", 0.1, false), 50.1);
});
test("sin guía los botones conservan límites del proyecto y centro 0.0", () => {
  const size = { halfWidth: 20, halfHeight: 5 };
  for (const axis of ["x", "y"])
    for (const [alignment, value] of [
      ["start", 5],
      ["center", 50],
      ["end", 95],
    ])
      assert.equal(
        alignPosition({ x: 50, y: 50 }, axis, alignment, false, size)[axis],
        alignment === "center"
          ? value
          : value +
              (alignment === "start" ? 1 : -1) *
                (axis === "x" ? size.halfWidth : size.halfHeight),
      );
});
test("la guía contiene el bloque completo, evita reserva superior y respeta el recorte derecho", () => {
  const size = { halfWidth: 15, halfHeight: 4 };
  const high = alignPosition({ x: 50, y: 30 }, "x", "end", true, size);
  const low = alignPosition({ x: 50, y: 65 }, "x", "end", true, size);
  assert.ok(high.x > low.x);
  assert.ok(high.x + 15 <= (1033 / 1080) * 100 + 1e-8);
  assert.ok(low.x + 15 <= (886 / 1080) * 100 + 1e-8);
  for (const x of [5, 50, 95])
    for (const y of [5, 30, 70, 95]) {
      const p = constrainPosition({ x, y }, true, size);
      assert.ok(p.x - size.halfWidth >= (46 / 1080) * 100 - 1e-8);
      assert.ok(p.y - size.halfHeight >= (216 / 1920) * 100 - 1e-8);
      assert.ok(p.y + size.halfHeight <= (1545 / 1920) * 100 + 1e-8);
      assert.ok(
        p.x + size.halfWidth <=
          ((p.y + size.halfHeight > (958 / 1920) * 100 ? 886 : 1033) / 1080) *
            100 +
            1e-8,
      );
    }
  assert.equal(positionBounds(true, 50, 5, 70).fits, false);
});

test("alineación usa cada borde real incluso cuando no coincide con la mitad del bloque", () => {
  const size = {
    halfWidth: 15,
    halfHeight: 6,
    left: 18,
    right: 12,
    top: 9,
    bottom: 3,
  };
  const p = { x: 50, y: 50 };
  const left = alignPosition(p, "x", "start", false, size),
    right = alignPosition(p, "x", "end", false, size);
  const top = alignPosition(p, "y", "start", false, size),
    bottom = alignPosition(p, "y", "end", false, size);
  assert.equal(left.x - size.left, 5);
  assert.equal(right.x + size.right, 95);
  assert.equal(top.y - size.top, 5);
  assert.equal(bottom.y + size.bottom, 95);
  const safeRight = alignPosition({ ...p, y: 65 }, "x", "end", true, size);
  assert.ok(Math.abs(safeRight.x + size.right - (886 / 1080) * 100) < 1e-8);
  const safeBottom = alignPosition(p, "y", "end", true, size);
  assert.ok(Math.abs(safeBottom.y + size.bottom - (1545 / 1920) * 100) < 1e-8);
});
