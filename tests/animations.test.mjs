import test from "node:test";
import assert from "node:assert/strict";
import { animations, lineMotion, wordMotion } from "../src/text-animations.mjs";
test("máquina de escribir sigue el tiempo de cada palabra y admite Unicode", () => {
  const w = { text: "Hola", start: 1, end: 2 };
  assert.equal(wordMotion("typewriter", 0.5, w, 64).visibleCharacters, 0);
  assert.equal(wordMotion("typewriter", 1.5, w, 64).visibleCharacters, 2);
  assert.equal(wordMotion("typewriter", 2, w, 64).visibleCharacters, 4);
  assert.equal(
    wordMotion("typewriter", 2, { ...w, text: "á😊" }, 64).visibleCharacters,
    2,
  );
});
test("entradas verticales usan direcciones opuestas y terminan en reposo", () => {
  assert.equal(lineMotion("slide-up", 0).transform, "translateY(35px)");
  assert.equal(lineMotion("slide-down", 0).transform, "translateY(-35px)");
  assert.equal(lineMotion("slide-up", 1).transform, "translateY(0px)");
  assert.equal(lineMotion("slide-down", 1).opacity, 1);
});
test("todos los efectos son deterministas y producen valores finitos al adelantar o retroceder", () => {
  const w = { text: "Texto", start: 0.3, end: 1 };
  for (const [id] of animations)
    for (const t of [-0.1, 0, 0.1, 0.7, 2]) {
      const a = lineMotion(id, t, 1),
        b = wordMotion(id, t, w, 64, 2, 0);
      assert.deepEqual(a, lineMotion(id, t, 1));
      assert.deepEqual(b, wordMotion(id, t, w, 64, 2, 0));
      assert.ok(a.opacity >= 0 && a.opacity <= 1);
      assert.doesNotMatch(a.transform + b.transform, /NaN|Infinity/);
      assert.ok(b.visibleCharacters >= 0 && b.visibleCharacters <= 5);
    }
});
