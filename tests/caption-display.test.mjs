import test from "node:test";
import assert from "node:assert/strict";
import {
  captionCharacters,
  captionDisplayText,
} from "../src/caption-display.mjs";
import { captionBlocks } from "../src/caption-blocks.mjs";
import { exportSubtitles } from "../src/subtitle-files.mjs";
import { wordMotion } from "../src/text-animations.mjs";
import { validateProject } from "../server/validation.mjs";
test("solo oculta los cuatro signos solicitados y es reversible sin modificar el original", () => {
  const original = "¡Hola, mundo! ¿Sí? 3.5; listo: 😀";
  assert.equal(
    captionDisplayText(original, true),
    "¡Hola mundo! ¿Sí? 35 listo 😀",
  );
  assert.equal(captionDisplayText(original, false), original);
  assert.deepEqual(captionCharacters(".,;:", true), []);
});
test("máquina de escribir conserva índices originales y tiempos al ocultar signos", () => {
  const word = { id: "a", text: "a,b.", start: 0, end: 4 };
  const letters = captionCharacters(word.text, true);
  assert.deepEqual(letters, [
    { letter: "a", index: 0 },
    { letter: "b", index: 2 },
  ]);
  const atTwo = wordMotion("typewriter", 2, word, 64);
  assert.equal(
    letters
      .filter((c) => c.index < atTwo.visibleCharacters)
      .map((c) => c.letter)
      .join(""),
    "a",
  );
  const atThree = wordMotion("typewriter", 3, word, 64);
  assert.equal(
    letters
      .filter((c) => c.index < atThree.visibleCharacters)
      .map((c) => c.letter)
      .join(""),
    "ab",
  );
  assert.equal(word.end, 4);
});
test("ocultar puntuación conserva agrupación, SRT/VTT y validación de proyectos anteriores", () => {
  const p = {
    duration: 3,
    words: [
      { id: "a", text: "Hola,", start: 0, end: 1 },
      { id: "b", text: "mundo.", start: 1, end: 2 },
    ],
    style: {
      fontSize: 64,
      y: 76,
      wordsPerBlock: 4,
      animation: "karaoke",
      color: "#ffffff",
      activeColor: "#ffffff",
      outline: "#111111",
    },
  };
  const hidden = { ...p, style: { ...p.style, hidePunctuation: true } };
  assert.equal(validateProject(p), p);
  assert.equal(validateProject(hidden), hidden);
  for (const format of ["srt", "vtt"])
    assert.equal(exportSubtitles(p, format), exportSubtitles(hidden, format));
  assert.deepEqual(captionBlocks(p.words), captionBlocks(hidden.words));
  assert.throws(
    () =>
      validateProject({ ...p, style: { ...p.style, hidePunctuation: "true" } }),
    /puntuación/,
  );
});
