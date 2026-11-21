import test from "node:test";
import assert from "node:assert/strict";
import {
  lineAppearance,
  secondAppearanceDefaults,
  alphaColor,
  caseCharacters,
  validateTextAppearance,
} from "../src/text-appearance.mjs";
import { captionCharacters } from "../src/caption-display.mjs";
import { scaleTemplateStyle } from "../src/custom-templates.mjs";
import { normalizeEditorUi } from "../src/editor-ui.mjs";
test("proyectos anteriores conservan negrita, contorno, sombra y mayúsculas por línea", () => {
  const style = {
    fontSize: 72,
    secondFontSize: 90,
    uppercase: true,
    secondUppercase: false,
  };
  const first = lineAppearance(style),
    second = lineAppearance(style, true);
  assert.equal(first.bold, true);
  assert.equal(first.outlineSize, 4);
  assert.equal(second.outlineSize, 5);
  assert.equal(first.shadowSize, 8);
  assert.equal(first.shadowOpacity, 8 / 15);
  assert.equal(first.textCase, "upper");
  assert.equal(second.textCase, "original");
});
test("ajustes independientes no cambian la línea inferior al editar la superior", () => {
  const style = { fontSize: 64, shadowColor: "#000000", bold: true };
  const frozen = {
    ...style,
    ...secondAppearanceDefaults(style),
    bold: false,
    shadowColor: "#ff0000",
    textCase: "lower",
  };
  assert.equal(lineAppearance(frozen).bold, false);
  assert.equal(lineAppearance(frozen, true).bold, true);
  assert.equal(lineAppearance(frozen, true).shadowColor, "#000000");
  assert.equal(lineAppearance(frozen, true).textCase, "original");
});
test("los cuatro modos respetan índices de animación, acentos y signos", () => {
  const raw = captionCharacters("¿ÁRBOL, sí?", false);
  const format = (mode) =>
    caseCharacters(raw, mode)
      .map((c) => c.letter)
      .join("");
  assert.equal(format("original"), "¿ÁRBOL, sí?");
  assert.equal(format("upper"), "¿ÁRBOL, SÍ?");
  assert.equal(format("lower"), "¿árbol, sí?");
  assert.equal(format("capitalize"), "¿Árbol, sí?");
  assert.equal(
    caseCharacters(captionCharacters("OTRO"), "capitalize", false)
      .map((c) => c.letter)
      .join(""),
    "otro",
  );
  assert.deepEqual(
    caseCharacters(raw, "lower").map((c) => c.index),
    raw.map((c) => c.index),
  );
});
test("opacidad y validación de contorno y sombra; escala de plantillas", () => {
  assert.equal(alphaColor("#ff8000", 0.5), "rgba(255,128,0,0.5)");
  assert.equal(alphaColor("#000000", 0), "rgba(0,0,0,0)");
  validateTextAppearance({
    bold: false,
    italic: true,
    underline: true,
    outlineOpacity: 0,
    shadowOpacity: 1,
    outlineSize: 20,
    shadowSize: 80,
    secondTextCase: "capitalize",
  });
  for (const invalid of [
    { outlineOpacity: 2 },
    { secondShadowSize: -1 },
    { shadowColor: "red" },
    { italic: 1 },
    { textCase: "none" },
  ])
    assert.throws(() => validateTextAppearance(invalid));
  const result = scaleTemplateStyle(
    {
      width: 1080,
      style: {
        outlineSize: 8,
        secondOutlineSize: 6,
        shadowSize: 20,
        secondShadowSize: 10,
        shadowOpacity: 0.5,
      },
    },
    540,
  );
  assert.equal(result.outlineSize, 4);
  assert.equal(result.secondShadowSize, 5);
  assert.equal(result.shadowOpacity, 0.5);
  assert.equal(
    normalizeEditorUi({ styleSection: "animation" }).styleSection,
    "text",
  );
});

test("los efectos se desactivan por línea conservando sus propiedades", () => {
  const original = {
    fontSize: 72,
    outlineSize: 5,
    shadowSize: 18,
    shadowOpacity: 0.7,
  };
  assert.equal(lineAppearance(original).outlineEnabled, true);
  assert.equal(lineAppearance(original).shadowEnabled, true);
  const disabled = {
    ...original,
    ...secondAppearanceDefaults(original),
    outlineEnabled: false,
    shadowEnabled: false,
  };
  assert.equal(lineAppearance(disabled).outlineEnabled, false);
  assert.equal(lineAppearance(disabled).shadowEnabled, false);
  assert.equal(lineAppearance(disabled).outlineSize, 5);
  assert.equal(lineAppearance(disabled).shadowSize, 18);
  assert.equal(lineAppearance(disabled, true).outlineEnabled, true);
  assert.equal(lineAppearance(disabled, true).shadowEnabled, true);
  assert.doesNotThrow(() => validateTextAppearance(disabled));
  assert.throws(() => validateTextAppearance({ secondShadowEnabled: "false" }));
});
