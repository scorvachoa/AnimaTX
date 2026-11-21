const fields = [
  "outlineEnabled",
  "shadowEnabled",
  "bold",
  "italic",
  "underline",
  "textCase",
  "outlineOpacity",
  "outlineSize",
  "shadowColor",
  "shadowOpacity",
  "shadowSize",
];
const secondKey = (key) => "second" + key[0].toUpperCase() + key.slice(1);
export function lineAppearance(style, second = false) {
  const get = (key, fallback) =>
    (second ? (style[secondKey(key)] ?? style[key]) : style[key]) ?? fallback;
  const size = second
    ? (style.secondFontSize ?? style.fontSize ?? 64)
    : (style.fontSize ?? 64);
  const legacyUpper = second
    ? (style.secondUppercase ?? style.uppercase)
    : style.uppercase;
  return {
    outlineEnabled: get("outlineEnabled", true),
    shadowEnabled: get("shadowEnabled", true),
    bold: get("bold", true),
    italic: get("italic", false),
    underline: get("underline", false),
    textCase:
      (second ? style.secondTextCase : style.textCase) ??
      (second && style.secondUppercase === undefined
        ? style.textCase
        : undefined) ??
      (legacyUpper ? "upper" : "original"),
    outlineOpacity: get("outlineOpacity", 1),
    outlineSize: get("outlineSize", Math.max(1, size / 18)),
    shadowColor: get("shadowColor", "#000000"),
    shadowOpacity: get("shadowOpacity", 8 / 15),
    shadowSize: get("shadowSize", 8),
  };
}
export function secondAppearanceDefaults(style) {
  const appearance = lineAppearance(style, true);
  return Object.fromEntries(
    fields.map((key) => [secondKey(key), appearance[key]]),
  );
}
export function alphaColor(hex, opacity) {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16},${(value >> 8) & 255},${value & 255},${Math.max(0, Math.min(1, opacity))})`;
}
export function caseCharacters(characters, mode, firstLetter = true) {
  let first = firstLetter;
  return characters.map((character) => {
    let letter = character.letter;
    if (mode === "upper") letter = letter.toLocaleUpperCase("es");
    else if (mode === "lower") letter = letter.toLocaleLowerCase("es");
    else if (mode === "capitalize") {
      letter = letter.toLocaleLowerCase("es");
      if (first && /\p{L}/u.test(letter)) {
        letter = letter.toLocaleUpperCase("es");
        first = false;
      }
    }
    return { ...character, letter };
  });
}
export function validateTextAppearance(style) {
  for (const prefix of ["", "second"]) {
    const key = (name) => (prefix ? secondKey(name) : name);
    for (const name of [
      "bold",
      "italic",
      "underline",
      "outlineEnabled",
      "shadowEnabled",
    ])
      if (
        style[key(name)] !== undefined &&
        typeof style[key(name)] !== "boolean"
      )
        throw Error("Formato de texto inválido");
    if (
      style[key("textCase")] !== undefined &&
      !["original", "upper", "lower", "capitalize"].includes(
        style[key("textCase")],
      )
    )
      throw Error("Formato de mayúsculas inválido");
    for (const [name, max] of [
      ["outlineOpacity", 1],
      ["shadowOpacity", 1],
      ["outlineSize", 20],
      ["shadowSize", 80],
    ])
      if (
        style[key(name)] !== undefined &&
        (!Number.isFinite(style[key(name)]) ||
          style[key(name)] < 0 ||
          style[key(name)] > max)
      )
        throw Error("Contorno o sombra inválidos");
    if (
      style[key("shadowColor")] !== undefined &&
      !/^#[0-9a-f]{6}$/i.test(style[key("shadowColor")])
    )
      throw Error("Color de sombra inválido");
  }
}
