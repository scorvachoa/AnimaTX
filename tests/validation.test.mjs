import test from "node:test";
import assert from "node:assert/strict";
import { validateProject } from "../server/validation.mjs";
const project = () => ({
  duration: 3,
  words: [
    { id: "a", text: "Hola", start: 0, end: 1 },
    { id: "b", text: "mundo", start: 1, end: 2 },
  ],
  style: {
    fontSize: 64,
    y: 76,
    wordsPerBlock: 4,
    animation: "karaoke",
    color: "#ffffff",
    activeColor: "#c8ff59",
    outline: "#111111",
  },
});
test("guarda estilos independientes de dos líneas y admite proyectos anteriores", () => {
  const p = project();
  assert.doesNotThrow(() => validateProject(p));
  Object.assign(p.style, {
    twoLines: true,
    firstLineWords: 2,
    fontFamily: "Georgia",
    secondFontFamily: "Impact",
    secondFontSize: 80,
    secondColor: "#ffaa00",
    animation: "slide",
  });
  assert.equal(validateProject(p).style.secondFontFamily, "Impact");
  p.style.secondFontSize = NaN;
  assert.throws(() => validateProject(p), /Tamaño/);
  p.style.secondFontSize = 80;
  p.style.fontFamily = "unsupported";
  assert.throws(() => validateProject(p), /Tipografía/);
});
test("acepta palabras consecutivas y conserva sus tiempos", () => {
  const p = project();
  assert.equal(validateProject(p), p);
});
test("permite opciones independientes por línea y valida la inferior", () => {
  const p = project();
  Object.assign(p.style, {
    twoLines: true,
    uppercase: true,
    animation: "pop",
    secondUppercase: false,
    secondAnimation: "slide",
    secondLetterSpacing: 2,
    secondOutline: "#553311",
    secondActiveColor: "#ff0000",
  });
  assert.equal(validateProject(p).style.secondUppercase, false);
  p.style.secondAnimation = "invalid";
  assert.throws(() => validateProject(p), /Animación/);
  p.style.secondAnimation = "none";
  p.style.secondLetterSpacing = Infinity;
  assert.throws(() => validateProject(p), /Espaciado/);
});
test("acepta espaciado y mayúsculas, rechaza valores inválidos", () => {
  const p = project();
  Object.assign(p.style, { letterSpacing: 3.5, lineGap: 24, uppercase: true });
  assert.doesNotThrow(() => validateProject(p));
  p.style.lineGap = NaN;
  assert.throws(() => validateProject(p), /Espaciado/);
  p.style.lineGap = 0;
  p.style.letterSpacing = 31;
  assert.throws(() => validateProject(p), /Espaciado/);
  p.style.letterSpacing = 0;
  p.style.uppercase = "true";
  assert.throws(() => validateProject(p), /Mayúsculas/);
});
test("rechaza solapamientos y tiempos fuera del video", () => {
  const p = project();
  p.words[1].start = 0.5;
  assert.throws(() => validateProject(p), /superponerse/);
  p.words[1].start = 1;
  p.words[1].end = 4;
  assert.throws(() => validateProject(p), /tiempos/);
});
test("rechaza tiempos no numéricos y bloques que impedirían renderizar", () => {
  const p = project();
  p.words[0].start = NaN;
  assert.throws(() => validateProject(p));
  p.words = [];
  p.style.wordsPerBlock = 0;
  assert.throws(() => validateProject(p), /Estilo/);
});
