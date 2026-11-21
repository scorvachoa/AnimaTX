import { animations } from "../src/text-animations.mjs";
import { validateCover } from "../src/cover.mjs";
import { validateTextAppearance } from "../src/text-appearance.mjs";
const animationIds = animations.map(([id]) => id);
export function validateProject(p) {
  validateCover(p?.cover, p?.duration);
  if (
    p?.script !== undefined &&
    (typeof p.script !== "string" || p.script.length > 20000)
  )
    throw Error("El guion admite hasta 20 000 caracteres.");
  if (!p || !Array.isArray(p.words) || p.words.length > 10000)
    throw Error("Subtítulos inválidos");
  for (const w of p.words)
    if (
      w.cueId !== undefined &&
      (typeof w.cueId !== "string" || w.cueId.length > 200)
    )
      throw Error("Identificador de bloque inválido");
  for (const w of p.words)
    if (
      typeof w.text !== "string" ||
      w.text.length > 300 ||
      !Number.isFinite(w.start) ||
      !Number.isFinite(w.end) ||
      w.start < 0 ||
      w.end <= w.start ||
      w.end > p.duration + 0.1
    )
      throw Error("Revisa los tiempos: inicio < fin y dentro del video.");
  for (let i = 1; i < p.words.length; i++)
    if (p.words[i].start < p.words[i - 1].end)
      throw Error("Las palabras deben estar ordenadas y no superponerse.");
  for (const w of p.words)
    if (w.style !== undefined) {
      const s = w.style;
      if (!s || typeof s !== "object" || Array.isArray(s))
        throw Error("Estilo de palabra inválido");
      if (s.color !== undefined && !/^#[0-9a-f]{6}$/i.test(s.color))
        throw Error("Color de palabra inválido");
      if (
        s.fontSize !== undefined &&
        (!Number.isFinite(s.fontSize) || s.fontSize < 16 || s.fontSize > 180)
      )
        throw Error("Tamaño de palabra inválido");
      if (s.animation !== undefined && !animationIds.includes(s.animation))
        throw Error("Animación de palabra inválida");
      if (s.uppercase !== undefined && typeof s.uppercase !== "boolean")
        throw Error("Mayúsculas de palabra inválidas");
    }
  const s = p.style;
  if (s) validateTextAppearance(s);
  if (
    s?.hidePunctuation !== undefined &&
    typeof s.hidePunctuation !== "boolean"
  )
    throw Error("Opción de puntuación inválida");
  if (s) {
    if (s.x !== undefined && (!Number.isFinite(s.x) || s.x < 5 || s.x > 95))
      throw Error("Posición horizontal inválida");
    if (
      s.captionLeadMs !== undefined &&
      (!Number.isFinite(s.captionLeadMs) ||
        s.captionLeadMs < -1000 ||
        s.captionLeadMs > 1000)
    )
      throw Error(
        "El ajuste de sincronización debe estar entre -1000 y 1000 ms.",
      );
    for (const color of [s.secondActiveColor, s.secondOutline])
      if (color !== undefined && !/^#[0-9a-f]{6}$/i.test(color))
        throw Error("Color inválido");
    if (
      s.secondUppercase !== undefined &&
      typeof s.secondUppercase !== "boolean"
    )
      throw Error("Mayúsculas inválidas");
    if (
      s.secondLetterSpacing !== undefined &&
      (!Number.isFinite(s.secondLetterSpacing) ||
        s.secondLetterSpacing < -3 ||
        s.secondLetterSpacing > 30)
    )
      throw Error("Espaciado inválido");
    if (
      s.secondAnimation !== undefined &&
      !animationIds.includes(s.secondAnimation)
    )
      throw Error("Animación inválida");
  }
  if (
    !s ||
    !Number.isFinite(s.fontSize) ||
    s.fontSize < 16 ||
    s.fontSize > 180 ||
    !Number.isFinite(s.y) ||
    s.y < 5 ||
    s.y > 95 ||
    !Number.isInteger(s.wordsPerBlock) ||
    s.wordsPerBlock < 1 ||
    s.wordsPerBlock > 8 ||
    !animationIds.includes(s.animation)
  )
    throw Error("Estilo inválido");
  for (const [key, min, max] of [
    ["letterSpacing", -3, 30],
    ["lineGap", -20, 150],
  ]) {
    if (
      s[key] !== undefined &&
      (!Number.isFinite(s[key]) || s[key] < min || s[key] > max)
    )
      throw Error("Espaciado inválido");
  }
  if (s.uppercase !== undefined && typeof s.uppercase !== "boolean")
    throw Error("Mayúsculas inválidas");
  for (const c of [s.color, s.activeColor, s.outline])
    if (!/^#[0-9a-f]{6}$/i.test(c)) throw Error("Color inválido");
  if (s.twoLines !== undefined && typeof s.twoLines !== "boolean")
    throw Error("Diseño inválido");
  if (
    s.firstLineWords !== undefined &&
    (!Number.isInteger(s.firstLineWords) ||
      s.firstLineWords < 1 ||
      s.firstLineWords > 7)
  )
    throw Error("División de líneas inválida");
  if (
    s.secondFontSize !== undefined &&
    (!Number.isFinite(s.secondFontSize) ||
      s.secondFontSize < 16 ||
      s.secondFontSize > 180)
  )
    throw Error("Tamaño de segunda línea inválido");
  if (s.secondColor !== undefined && !/^#[0-9a-f]{6}$/i.test(s.secondColor))
    throw Error("Color inválido");
  for (const font of [
    s.fontFamily,
    s.secondFontFamily,
    ...p.words.map((w) => w.style?.fontFamily),
  ])
    if (
      font !== undefined &&
      ![
        "Arial",
        "Impact",
        "Georgia",
        "Courier New",
        "Trebuchet MS",
        "Segoe Print",
        "Segoe Script",
        "Ink Free",
        "Bradley Hand ITC",
        "Lucida Handwriting",
        "Mistral",
        "Comic Sans MS",
      ].includes(font)
    )
      throw Error("Tipografía inválida");
  return p;
}
