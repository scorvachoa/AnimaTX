import {
  lineAppearance,
  caseCharacters,
  alphaColor,
  validateTextAppearance,
} from "./text-appearance.mjs";
import { constrainPosition } from "./caption-position.mjs";
export const coverFonts = [
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
];
export function getCoverLines(cover) {
  if (cover.lines) return cover.lines.map((line) => ({ ...line }));
  const parts = cover.title.split("\n");
  return parts.slice(0, 3).map((text, i) => ({
    text: i === 2 ? parts.slice(2).join(" ") : text,
    fontFamily: cover.fontFamily,
    fontSize: cover.fontSize,
    color: cover.color,
    outline: cover.outline,
    outlineEnabled: true,
    outlineSize: Math.max(2, cover.fontSize / 16),
    shadowEnabled: cover.template === "neon",
    shadowColor: cover.color,
    shadowSize: 30,
    shadowOpacity: 1,
    bold: true,
    letterSpacing: 0,
  }));
}
export function distributeCoverTitle(title, count) {
  const paragraphs = title.split("\n");
  if (paragraphs.length === count) return paragraphs;
  const words = title.trim().split(/\s+/u).filter(Boolean),
    result = [];
  for (let i = 0; i < count; i++) {
    const take = Math.ceil(words.length / (count - i));
    result.push(words.splice(0, take).join(" "));
  }
  return result;
}
export function validateCoverLines(lines) {
  if (lines === undefined) return;
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 3)
    throw Error("La miniatura admite de 1 a 3 líneas.");
  if (lines.map((line) => line?.text ?? "").join("\n").length > 160)
    throw Error("El título de miniatura admite hasta 160 caracteres.");
  for (const line of lines) {
    if (
      !line ||
      typeof line.text !== "string" ||
      /[\r\n]/u.test(line.text) ||
      !coverFonts.includes(line.fontFamily) ||
      !Number.isFinite(line.fontSize) ||
      line.fontSize < 16 ||
      line.fontSize > 180
    )
      throw Error("Línea de miniatura inválida");
    for (const key of ["color", "outline"])
      if (!/^#[0-9a-f]{6}$/i.test(line[key]))
        throw Error("Color de miniatura inválido");
    if (
      line.letterSpacing !== undefined &&
      (!Number.isFinite(line.letterSpacing) ||
        line.letterSpacing < -3 ||
        line.letterSpacing > 30)
    )
      throw Error("Espaciado de miniatura inválido");
    for (const key of ["offsetX", "offsetY"]) {
      if (
        line[key] !== undefined &&
        (!Number.isFinite(line[key]) || Math.abs(line[key]) > 100)
      )
        throw Error("Posición de texto inválida");
    }
    validateTextAppearance(line);
  }
}
export function drawCoverLines(ctx, cover, safeGuide, onLayout) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const rows = getCoverLines(cover).map((line) => {
    const appearance = lineAppearance(line);
    const text = caseCharacters(
      Array.from(line.text, (letter, index) => ({ letter, index })),
      appearance.textCase,
    )
      .map((c) => c.letter)
      .join("");
    let size = line.fontSize;
    const configure = () => {
      ctx.font = `${appearance.italic ? "italic " : ""}${appearance.bold ? 900 : 400} ${size}px "${line.fontFamily}"`;
      ctx.letterSpacing = `${((line.letterSpacing ?? 0) * size) / line.fontSize}px`;
    };
    configure();
    while (ctx.measureText(text).width > 920 && size > 1) {
      size--;
      configure();
    }
    const m = ctx.measureText(text),
      stroke = appearance.outlineEnabled ? appearance.outlineSize : 0;
    const padding = cover.textBackground
      ? Math.max(18, stroke / 2)
      : Math.max(stroke / 2 + 1, appearance.underline ? 3 + size / 22 : 0);
    return {
      line,
      appearance,
      text,
      size,
      m,
      padding,
      height: Math.max(
        size * 1.25,
        (m.actualBoundingBoxAscent ?? size / 2) +
          (m.actualBoundingBoxDescent ?? size / 2) +
          padding * 2,
      ),
    };
  });
  const total = rows.reduce((n, row) => n + row.height, 0);
  let cursor = -total / 2;
  rows.forEach((row) => {
    row.cy = cursor + row.height / 2;
    cursor += row.height;
  });
  const left = Math.max(
    0,
    ...rows.map(
      (r) => (r.m.actualBoundingBoxLeft ?? r.m.width / 2) + r.padding,
    ),
  );
  const right = Math.max(
    0,
    ...rows.map(
      (r) => (r.m.actualBoundingBoxRight ?? r.m.width / 2) + r.padding,
    ),
  );
  const top = Math.max(
    0,
    ...rows.map(
      (r) => -r.cy + (r.m.actualBoundingBoxAscent ?? r.size / 2) + r.padding,
    ),
  );
  const bottom = Math.max(
    0,
    ...rows.map(
      (r) => r.cy + (r.m.actualBoundingBoxDescent ?? r.size / 2) + r.padding,
    ),
  );
  const bounds = {
    halfWidth: (left + right) / 21.6,
    halfHeight: (top + bottom) / 38.4,
    left: left / 10.8,
    right: right / 10.8,
    top: top / 19.2,
    bottom: bottom / 19.2,
  };
  const position = constrainPosition(
      { x: cover.x, y: cover.y },
      safeGuide,
      bounds,
    ),
    x = position.x * 10.8;
  const layout = [];
  rows.forEach(({ line, appearance: a, text, size, m, padding, cy }, index) => {
    const rowBounds = {
      left: ((m.actualBoundingBoxLeft ?? m.width / 2) + padding) / 10.8,
      right: ((m.actualBoundingBoxRight ?? m.width / 2) + padding) / 10.8,
      top: ((m.actualBoundingBoxAscent ?? size / 2) + padding) / 19.2,
      bottom: ((m.actualBoundingBoxDescent ?? size / 2) + padding) / 19.2,
      halfWidth: (m.width + padding * 2) / 21.6,
      halfHeight: (size + padding * 2) / 38.4,
    };
    const rowPosition = constrainPosition(
      {
        x: position.x + (line.offsetX ?? 0),
        y: position.y + cy / 19.2 + (line.offsetY ?? 0),
      },
      safeGuide,
      rowBounds,
    );
    const x = rowPosition.x * 10.8,
      y = rowPosition.y * 19.2;
    layout.push({
      index,
      x: x - rowBounds.left * 10.8,
      y: y - rowBounds.top * 19.2,
      width: (rowBounds.left + rowBounds.right) * 10.8,
      height: (rowBounds.top + rowBounds.bottom) * 19.2,
    });
    ctx.font = `${a.italic ? "italic " : ""}${a.bold ? 900 : 400} ${size}px "${line.fontFamily}"`;
    ctx.letterSpacing = `${((line.letterSpacing ?? 0) * size) / line.fontSize}px`;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    if (cover.textBackground && text) {
      ctx.fillStyle = cover.background;
      ctx.fillRect(
        x - (m.actualBoundingBoxLeft ?? m.width / 2) - padding,
        y - (m.actualBoundingBoxAscent ?? size / 2) - padding,
        (m.actualBoundingBoxLeft ?? m.width / 2) +
          (m.actualBoundingBoxRight ?? m.width / 2) +
          padding * 2,
        (m.actualBoundingBoxAscent ?? size / 2) +
          (m.actualBoundingBoxDescent ?? size / 2) +
          padding * 2,
      );
    }
    if (a.shadowEnabled) {
      ctx.shadowColor = alphaColor(a.shadowColor, a.shadowOpacity);
      ctx.shadowBlur = a.shadowSize;
      ctx.shadowOffsetY = 3;
    }
    if (a.outlineEnabled && a.outlineSize > 0 && a.outlineOpacity > 0) {
      ctx.lineWidth = a.outlineSize;
      ctx.strokeStyle = alphaColor(line.outline, a.outlineOpacity);
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = line.color;
    ctx.fillText(text, x, y);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    if (a.underline && text) {
      ctx.fillRect(
        x - m.width / 2,
        y + (m.actualBoundingBoxDescent ?? size / 2) + 3,
        m.width,
        Math.max(1, size / 22),
      );
    }
  });
  ctx.letterSpacing = "0px";
  onLayout?.(layout);
  const movedBounds = {
    left: Math.max(0, ...layout.map((r) => cover.x - r.x / 10.8)),
    right: Math.max(0, ...layout.map((r) => (r.x + r.width) / 10.8 - cover.x)),
    top: Math.max(0, ...layout.map((r) => cover.y - r.y / 19.2)),
    bottom: Math.max(
      0,
      ...layout.map((r) => (r.y + r.height) / 19.2 - cover.y),
    ),
  };
  return {
    ...movedBounds,
    halfWidth: (movedBounds.left + movedBounds.right) / 2,
    halfHeight: (movedBounds.top + movedBounds.bottom) / 2,
  };
}
export function hitCoverLine(layout, x, y) {
  return (
    [...layout]
      .reverse()
      .find(
        (r) =>
          x >= r.x - 6 &&
          x <= r.x + r.width + 6 &&
          y >= r.y - 6 &&
          y <= r.y + r.height + 6,
      )?.index ?? null
  );
}
export function toggleCoverSelection(current, index, additive = false) {
  if (index === null) return [];
  if (!additive) return [index];
  return current.includes(index)
    ? current.filter((item) => item !== index)
    : [...current, index];
}
export function moveCoverSelection(cover, layout, selected, dx, dy, safeGuide) {
  const boxes = layout.filter((rect) => selected.includes(rect.index));
  if (!boxes.length) return getCoverLines(cover);
  const left = Math.min(...boxes.map((r) => r.x)),
    top = Math.min(...boxes.map((r) => r.y));
  const right = Math.max(...boxes.map((r) => r.x + r.width)),
    bottom = Math.max(...boxes.map((r) => r.y + r.height));
  const center = { x: (left + right) / 21.6, y: (top + bottom) / 38.4 };
  const next = constrainPosition(
    { x: center.x + dx, y: center.y + dy },
    safeGuide,
    { halfWidth: (right - left) / 21.6, halfHeight: (bottom - top) / 38.4 },
  );
  const lines = getCoverLines(cover);
  let moveX = next.x - center.x,
    moveY = next.y - center.y;
  for (const [axis, value] of [
    ["offsetX", moveX],
    ["offsetY", moveY],
  ]) {
    const limited = Math.max(
      ...selected.map((i) => -100 - (lines[i]?.[axis] ?? 0)),
      Math.min(value, ...selected.map((i) => 100 - (lines[i]?.[axis] ?? 0))),
    );
    if (axis === "offsetX") moveX = limited;
    else moveY = limited;
  }
  return lines.map((line, index) =>
    selected.includes(index)
      ? {
          ...line,
          offsetX: (line.offsetX ?? 0) + moveX,
          offsetY: (line.offsetY ?? 0) + moveY,
        }
      : line,
  );
}
