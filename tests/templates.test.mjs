import test from "node:test";
import assert from "node:assert/strict";
import {
  impactoStyle,
  subtitleTemplates,
  templateStyle,
} from "../src/templates-data.mjs";
import { validateProject } from "../server/validation.mjs";
test("Impacto escala las fuentes y produce estilos guardables sin cambiar las palabras", () => {
  for (const width of [240, 360, 576, 1080, 1920]) {
    const words = [{ id: "a", text: "Hola", start: 0, end: 1 }];
    const style = impactoStyle(width);
    const project = { duration: 2, words, style };
    assert.doesNotThrow(() => validateProject(project));
    assert.equal(project.words, words);
    assert.equal(style.fontFamily, "Impact");
    assert.equal(style.twoLines, true);
    assert.equal(style.secondColor, "#d4ff3f");
    assert.ok(style.fontSize >= 16 && style.fontSize <= 180);
  }
});
test("las nueve plantillas son distintas y tienen estilos válidos en todos los tamaños", () => {
  assert.equal(subtitleTemplates.length, 9);
  assert.equal(new Set(subtitleTemplates.map((t) => t.id)).size, 9);
  assert.equal(
    new Set(
      subtitleTemplates.map((t) => JSON.stringify(templateStyle(t.id, 576))),
    ).size,
    9,
  );
  for (const t of subtitleTemplates)
    for (const width of [240, 360, 576, 1080, 1920])
      assert.doesNotThrow(() =>
        validateProject({
          duration: 2,
          words: [{ id: "a", text: "Hola", start: 0, end: 1 }],
          style: templateStyle(t.id, width),
        }),
      );
});
