import { alignPosition } from "../src/caption-position.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  coverDefaults,
  applyCoverTemplate,
  coverTemplates,
  coverCrop,
  wrapCoverTitle,
  validateCover,
  drawCover,
} from "../src/cover.mjs";
import { validateProject } from "../server/validation.mjs";
import { recordHistory } from "../src/project-history.mjs";
const project = {
  id: "a",
  duration: 3,
  words: [{ id: "w", text: "Hola", start: 0, end: 1 }],
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
test("proyectos anteriores siguen siendo válidos y las nueve plantillas solo afectan a la portada", () => {
  assert.equal(validateProject(project), project);
  for (const template of coverTemplates) {
    const next = { ...project, cover: { ...coverDefaults, ...template.style } };
    assert.equal(validateProject(next), next);
    assert.deepEqual(next.words, project.words);
    assert.deepEqual(next.style, project.style);
  }
  for (const cover of [
    { ...coverDefaults, time: 4 },
    { ...coverDefaults, color: "red" },
    { ...coverDefaults, zoom: 0 },
    { ...coverDefaults, title: "a".repeat(161) },
  ])
    assert.throws(() => validateCover(cover, 3));
});
test("el encuadre llena 1080x1920 sin deformar ni dejar bordes al desplazar", () => {
  for (const [width, height] of [
    [1920, 1080],
    [1080, 1920],
    [800, 800],
  ])
    for (const zoom of [1, 2, 4])
      for (const offset of [-100, 0, 100]) {
        const crop = coverCrop(width, height, zoom, offset, offset);
        assert.ok(Math.abs(crop.width / crop.height - width / height) < 1e-8);
        assert.ok(crop.x <= 1e-8 && crop.y <= 1e-8);
        assert.ok(
          crop.x + crop.width >= 1080 - 1e-8 &&
            crop.y + crop.height >= 1920 - 1e-8,
        );
      }
});
test("títulos se ajustan en líneas sin perder palabras ni caracteres Unicode", () => {
  const measure = (s) => Array.from(s).length * 10;
  const text = "Una historia increíble\n😀😀😀😀😀😀😀😀";
  const lines = wrapCoverTitle(text, measure, 50);
  assert.ok(lines.every((line) => measure(line) <= 50));
  assert.equal(
    lines.join("").replaceAll(" ", ""),
    text.replaceAll(" ", "").replaceAll("\n", ""),
  );
});
test("deshacer la primera portada restaura un proyecto sin portada", () => {
  const next = {
    ...project,
    cover: { ...coverDefaults, title: "Nuevo título" },
  };
  const history = recordHistory(
    { past: [], future: [], group: "", at: 0 },
    project,
    next,
  );
  assert.equal(history.past[0].cover, undefined);
  assert.deepEqual(history.past[0].words, project.words);
});
test("render de portada usa canvas 1080x1920, fotograma y título sin capas de subtítulos", () => {
  const calls = [];
  const ctx = new Proxy(
    {
      font: "",
      measureText: (t) => ({ width: t.length * 40 }),
      createLinearGradient: () => ({ addColorStop() {} }),
    },
    {
      get: (target, key) =>
        key in target ? target[key] : (...args) => calls.push([key, ...args]),
    },
  );
  const canvas = { getContext: () => ctx },
    video = { videoWidth: 1920, videoHeight: 1080 };
  drawCover(canvas, video, coverDefaults);
  assert.equal(canvas.width, 1080);
  assert.equal(canvas.height, 1920);
  assert.equal(calls.filter((c) => c[0] === "drawImage").length, 1);
  assert.ok(calls.some((c) => c[0] === "fillText"));
});

test("nueve estilos únicos conservan título, fotograma y encuadre al aplicarse", () => {
  assert.equal(coverTemplates.length, 9);
  assert.equal(new Set(coverTemplates.map((t) => t.id)).size, 9);
  assert.equal(
    new Set(coverTemplates.map((t) => JSON.stringify(t.style))).size,
    9,
  );
  const original = {
    ...coverDefaults,
    title: "Mi título",
    time: 1.5,
    zoom: 2,
    offsetX: 30,
    offsetY: -25,
  };
  for (const template of coverTemplates) {
    const cover = applyCoverTemplate(original, template);
    validateCover(cover, 3);
    for (const key of ["title", "time", "zoom", "offsetX", "offsetY"])
      assert.equal(cover[key], original[key]);
  }
  assert.equal(original.template, "impact");
});

test("miniatura alinea bordes medidos del título y conserva esa posición en el PNG", () => {
  const calls = [];
  const ctx = new Proxy(
    {
      font: "",
      measureText: () => ({
        width: 300,
        actualBoundingBoxLeft: 120,
        actualBoundingBoxRight: 180,
        actualBoundingBoxAscent: 50,
        actualBoundingBoxDescent: 30,
      }),
      createLinearGradient: () => ({ addColorStop() {} }),
    },
    {
      get: (target, key) =>
        key in target ? target[key] : (...args) => calls.push([key, ...args]),
    },
  );
  const canvas = { getContext: () => ctx },
    video = { videoWidth: 1080, videoHeight: 1920 };
  const cover = { ...coverDefaults, title: "Título" };
  const bounds = drawCover(canvas, video, cover);
  const position = alignPosition(cover, "x", "end", true, bounds);
  drawCover(canvas, video, { ...cover, ...position }, true);
  const text = calls.filter((c) => c[0] === "fillText").at(-1);
  assert.ok(Math.abs(text[2] + bounds.right * 10.8 - 886) < 1e-6);
  assert.ok(text[3] + bounds.bottom * 19.2 <= 1545 + 1e-6);
  assert.equal(canvas.width, 1080);
  assert.equal(canvas.height, 1920);
});
