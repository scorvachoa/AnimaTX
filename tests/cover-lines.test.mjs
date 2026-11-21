import test from "node:test";
import assert from "node:assert/strict";
import {
  coverDefaults,
  coverTemplates,
  applyCoverTemplate,
  validateCover,
  drawCover,
} from "../src/cover.mjs";
import { getCoverLines, distributeCoverTitle } from "../src/cover-lines.mjs";
test("plantillas incluyen 1, 2 y 3 líneas y conservan contenido y encuadre", () => {
  assert.deepEqual(
    [...new Set(coverTemplates.map((t) => t.style.lines.length))].sort(),
    [1, 2, 3],
  );
  const initial = {
    ...coverDefaults,
    title: "¿Una historia nueva para contar?",
    time: 1,
    zoom: 2,
  };
  for (const template of coverTemplates) {
    const cover = applyCoverTemplate(initial, template);
    validateCover(cover, 5);
    assert.equal(
      cover.lines
        .map((l) => l.text)
        .filter(Boolean)
        .join(" "),
      initial.title,
    );
    assert.equal(cover.lines.length, template.style.lines.length);
    assert.equal(cover.time, 1);
    assert.equal(cover.zoom, 2);
    cover.lines[0].color = "#000000";
    assert.notEqual(template.style.lines[0].color, "#000000");
  }
  assert.deepEqual(distributeCoverTitle("Uno\nDos\nTres", 3), [
    "Uno",
    "Dos",
    "Tres",
  ]);
  assert.equal(
    getCoverLines({ ...initial, title: "Antes\nDespués" }).length,
    2,
  );
});
test("valida efectos por línea y rechaza formatos y contenido inválidos", () => {
  const cover = applyCoverTemplate(coverDefaults, coverTemplates[1]);
  assert.throws(() => validateCover({ ...cover, lines: [] }, 5));
  assert.throws(() =>
    validateCover({ ...cover, lines: [...cover.lines, cover.lines[0]] }, 5),
  );
  for (const patch of [
    { fontSize: NaN },
    { color: "red" },
    { text: "a\nb" },
    { shadowOpacity: 2 },
    { outlineEnabled: "no" },
    { fontFamily: 'bad"font' },
    { letterSpacing: 99 },
  ]) {
    assert.throws(() =>
      validateCover({ ...cover, lines: [{ ...cover.lines[0], ...patch }] }, 5),
    );
  }
});
test("canvas aplica formato independiente, efectos, mayúsculas y alinea todo el bloque", () => {
  const calls = [];
  const ctx = new Proxy(
    {
      measureText(t) {
        const size = Number(this.font.match(/ ([\d.]+)px/)?.[1] ?? 50);
        return { width: (t.length * size) / 2 };
      },
      createLinearGradient: () => ({ addColorStop() {} }),
    },
    {
      get(t, k) {
        return k in t
          ? t[k]
          : (...args) => calls.push([k, ...args, t.font, t.fillStyle]);
      },
    },
  );
  const cover = applyCoverTemplate(
    { ...coverDefaults, title: "hola mundo" },
    coverTemplates[0],
  );
  cover.lines[0] = {
    ...cover.lines[0],
    textCase: "upper",
    italic: true,
    underline: true,
    outlineEnabled: false,
    shadowEnabled: false,
  };
  cover.lines[1] = { ...cover.lines[1], textCase: "lower", color: "#00ff00" };
  const bounds = drawCover(
    { getContext: () => ctx },
    { videoWidth: 1080, videoHeight: 1920 },
    cover,
    true,
  );
  const text = calls.filter((c) => c[0] === "fillText");
  assert.equal(text.length, 2);
  assert.equal(text[0][1], "HOLA");
  assert.equal(text[1][1], "mundo");
  assert.match(text[0][4], /^italic /);
  assert.equal(text[1][5], "#00ff00");
  assert.equal(calls.filter((c) => c[0] === "strokeText").length, 1);
  assert.ok(text[0][3] < text[1][3]);
  assert.ok(Object.values(bounds).every(Number.isFinite));
  assert.ok(text[1][2] + bounds.right * 10.8 <= 886 + 0.001);
});

test("selección detecta textos, prioriza el superior y los offsets solo mueven su línea", async () => {
  const { hitCoverLine } = await import("../src/cover-lines.mjs");
  const ctx = new Proxy(
    {
      measureText: (text) => ({ width: text.length * 30 }),
      createLinearGradient: () => ({ addColorStop() {} }),
    },
    {
      get(t, k) {
        return k in t ? t[k] : () => {};
      },
    },
  );
  const cover = applyCoverTemplate(
    { ...coverDefaults, title: "hola mundo" },
    coverTemplates[0],
  );
  const canvas = { getContext: () => ctx },
    video = { videoWidth: 1080, videoHeight: 1920 };
  let before, after;
  drawCover(canvas, video, cover, false, (next) => (before = next));
  drawCover(
    canvas,
    video,
    {
      ...cover,
      lines: cover.lines.map((line, i) =>
        i === 1 ? { ...line, offsetX: 10, offsetY: -5 } : line,
      ),
    },
    false,
    (next) => (after = next),
  );
  assert.deepEqual(after[0], before[0]);
  assert.ok(Math.abs(after[1].x - before[1].x - 108) < 0.001);
  assert.ok(Math.abs(after[1].y - before[1].y + 96) < 0.001);
  assert.equal(
    hitCoverLine(
      after,
      after[1].x + after[1].width / 2,
      after[1].y + after[1].height / 2,
    ),
    1,
  );
  assert.equal(hitCoverLine(after, 0, 0), null);
  assert.equal(
    hitCoverLine(
      [
        { index: 0, x: 10, y: 10, width: 100, height: 100 },
        { index: 1, x: 10, y: 10, width: 100, height: 100 },
      ],
      50,
      50,
    ),
    1,
  );
  assert.throws(() =>
    validateCover(
      { ...cover, lines: [{ ...cover.lines[0], offsetY: Infinity }] },
      5,
    ),
  );
});

test("selección de títulos anteriores reconoce cada línea y el PNG mantiene offsets dentro de la guía", () => {
  const calls = [];
  const ctx = new Proxy(
    {
      measureText: (text) => ({ width: text.length * 30 }),
      createLinearGradient: () => ({ addColorStop() {} }),
    },
    {
      get(t, k) {
        return k in t ? t[k] : (...args) => calls.push([k, ...args]);
      },
    },
  );
  const canvas = { getContext: () => ctx },
    video = { videoWidth: 1080, videoHeight: 1920 };
  let layout;
  drawCover(
    canvas,
    video,
    { ...coverDefaults, title: "Antes\nDespués" },
    false,
    (next) => (layout = next),
  );
  assert.deepEqual(
    layout.map((r) => r.index),
    [0, 1],
  );
  const cover = applyCoverTemplate(
    { ...coverDefaults, title: "Hola mundo" },
    coverTemplates[0],
  );
  cover.lines[1] = { ...cover.lines[1], offsetX: 100, offsetY: 100 };
  drawCover(canvas, video, cover, true, (next) => (layout = next));
  assert.ok(layout[1].x + layout[1].width <= 886 + 0.001);
  assert.ok(layout[1].y + layout[1].height <= 1545 + 0.001);
  assert.ok(!calls.some((call) => call[0] === "strokeRect"));
  validateCover(cover, 5);
});

test("Ctrl alterna selección y mover varios textos mantiene su separación", async () => {
  const { toggleCoverSelection, moveCoverSelection } =
    await import("../src/cover-lines.mjs");
  assert.deepEqual(toggleCoverSelection([], 0, true), [0]);
  assert.deepEqual(toggleCoverSelection([0], 2, true), [0, 2]);
  assert.deepEqual(toggleCoverSelection([0, 2], 0, true), [2]);
  assert.deepEqual(toggleCoverSelection([0, 2], 1), [1]);
  assert.deepEqual(toggleCoverSelection([0, 2], null, true), []);
  const cover = applyCoverTemplate(
    { ...coverDefaults, title: "Uno dos tres" },
    coverTemplates[1],
  );
  const layout = [
    { index: 0, x: 300, y: 600, width: 200, height: 80 },
    { index: 1, x: 280, y: 700, width: 240, height: 90 },
    { index: 2, x: 320, y: 800, width: 160, height: 50 },
  ];
  const moved = moveCoverSelection(cover, layout, [0, 1], 5, 10, false);
  assert.equal(moved[0].offsetX, 5);
  assert.equal(moved[1].offsetX, 5);
  assert.equal(moved[0].offsetY, 10);
  assert.equal(moved[1].offsetY, 10);
  assert.deepEqual(moved[2], cover.lines[2]);
  const clamped = moveCoverSelection(cover, layout, [0, 1], 100, 100, true);
  assert.equal(clamped[0].offsetX, clamped[1].offsetX);
  assert.equal(clamped[0].offsetY, clamped[1].offsetY);
  assert.ok(
    layout[1].x + layout[1].width + clamped[1].offsetX * 10.8 <= 886 + 0.001,
  );
  assert.ok(
    layout[1].y + layout[1].height + clamped[1].offsetY * 19.2 <= 1545 + 0.001,
  );
  assert.deepEqual(cover.lines[0].offsetX, undefined);
});
