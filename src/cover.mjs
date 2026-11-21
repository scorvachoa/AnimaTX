import {
  drawCoverLines,
  validateCoverLines,
  distributeCoverTitle,
} from "./cover-lines.mjs";
import { constrainPosition } from "./caption-position.mjs";
export const coverDefaults = {
  time: 0,
  title: "Tu próxima historia",
  template: "impact",
  fontFamily: "Impact",
  fontSize: 100,
  color: "#ffffff",
  outline: "#111111",
  background: "#111111",
  textBackground: false,
  x: 50,
  y: 70,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};
export const coverTemplates = [
  {
    id: "impact",
    name: "Impacto",
    style: {
      template: "impact",
      fontFamily: "Impact",
      fontSize: 110,
      color: "#ffffff",
      outline: "#111111",
      textBackground: false,
      y: 70,
    },
  },
  {
    id: "editorial",
    name: "Editorial",
    style: {
      template: "editorial",
      fontFamily: "Georgia",
      fontSize: 86,
      color: "#fff2cc",
      outline: "#171717",
      textBackground: false,
      y: 65,
    },
  },
  {
    id: "banner",
    name: "Contraste",
    style: {
      template: "banner",
      fontFamily: "Arial",
      fontSize: 94,
      color: "#111111",
      outline: "#d2fa4b",
      background: "#d2fa4b",
      textBackground: true,
      y: 68,
    },
  },
  {
    id: "neon",
    name: "Neón",
    style: {
      template: "neon",
      fontFamily: "Impact",
      fontSize: 108,
      color: "#70ffff",
      outline: "#173647",
      textBackground: false,
      y: 62,
    },
  },
  {
    id: "cinema",
    name: "Cine",
    style: {
      template: "cinema",
      fontFamily: "Georgia",
      fontSize: 82,
      color: "#ffffff",
      outline: "#181818",
      textBackground: false,
      y: 78,
    },
  },
  {
    id: "handwritten",
    name: "Manuscrito",
    style: {
      template: "handwritten",
      fontFamily: "Segoe Print",
      fontSize: 88,
      color: "#ffe1f0",
      outline: "#3e2036",
      textBackground: false,
      y: 38,
    },
  },
  {
    id: "comic",
    name: "Cómic",
    style: {
      template: "comic",
      fontFamily: "Impact",
      fontSize: 116,
      color: "#ffffff",
      outline: "#171717",
      background: "#ed365b",
      textBackground: true,
      y: 55,
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    style: {
      template: "minimal",
      fontFamily: "Arial",
      fontSize: 68,
      color: "#ffffff",
      outline: "#333333",
      textBackground: false,
      y: 23,
    },
  },
  {
    id: "frame",
    name: "Marco",
    style: {
      template: "frame",
      fontFamily: "Georgia",
      fontSize: 96,
      color: "#ffdc94",
      outline: "#342718",
      textBackground: false,
      y: 70,
    },
  },
];
const line = (text, fontFamily, fontSize, color, extra = {}) => ({
  text,
  fontFamily,
  fontSize,
  color,
  outline: "#151515",
  bold: true,
  textCase: "original",
  outlineEnabled: true,
  outlineSize: 5,
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowOpacity: 0.6,
  shadowSize: 12,
  ...extra,
});
const designs = [
  [
    line("HAZLO", "Impact", 140, "#ffffff"),
    line("INCREÍBLE", "Impact", 166, "#e8ff59"),
  ],
  [
    line("Una nueva", "Georgia", 62, "#fff2cc", {
      italic: true,
      bold: false,
      outlineEnabled: false,
    }),
    line("perspectiva", "Georgia", 112, "#ffffff", { outlineSize: 2 }),
    line("EMPIEZA AQUÍ", "Arial", 38, "#e7be79", {
      letterSpacing: 5,
      outlineEnabled: false,
    }),
  ],
  [
    line("SIN LÍMITES", "Impact", 138, "#111111", {
      outlineEnabled: false,
      shadowEnabled: false,
    }),
  ],
  [
    line("OTRA", "Arial", 66, "#ffffff", {
      letterSpacing: 8,
      outlineEnabled: false,
    }),
    line("DIMENSIÓN", "Impact", 144, "#70ffff", {
      shadowColor: "#00eaff",
      shadowOpacity: 1,
      shadowSize: 30,
    }),
  ],
  [
    line("CADA", "Arial", 42, "#ffca85", {
      letterSpacing: 8,
      outlineEnabled: false,
    }),
    line("instante", "Georgia", 116, "#ffffff", {
      italic: true,
      outlineSize: 2,
    }),
    line("CUENTA", "Arial", 54, "#ffffff", {
      letterSpacing: 5,
      outlineEnabled: false,
    }),
  ],
  [
    line("hecho a mano", "Segoe Print", 92, "#ffe1f0", {
      bold: false,
      outlineSize: 2,
      italic: true,
    }),
  ],
  [
    line("¡NO TE", "Comic Sans MS", 82, "#ffffff", { italic: true }),
    line("LO VAS", "Impact", 136, "#fff067"),
    line("A CREER!", "Impact", 116, "#ffffff"),
  ],
  [
    line("Menos es más.", "Arial", 68, "#ffffff", {
      bold: false,
      outlineEnabled: false,
      letterSpacing: 2,
    }),
  ],
  [
    line("EL ARTE DE", "Arial", 42, "#ffffff", {
      letterSpacing: 6,
      outlineEnabled: false,
    }),
    line("descubrir", "Georgia", 118, "#ffdc94", {
      italic: true,
      outlineSize: 2,
    }),
  ],
];
coverTemplates.forEach((template, i) => {
  template.style.lines = designs[i];
});
export function applyCoverTemplate(cover, template) {
  return {
    ...coverDefaults,
    ...template.style,
    title: cover.title,
    lines: template.style.lines.map((line, i) => ({
      ...line,
      text: distributeCoverTitle(cover.title, template.style.lines.length)[i],
    })),
    time: cover.time,
    zoom: cover.zoom,
    offsetX: cover.offsetX,
    offsetY: cover.offsetY,
  };
}
export function validateCover(cover, duration) {
  if (cover === undefined) return;
  if (!cover || typeof cover !== "object" || Array.isArray(cover))
    throw Error("Portada inválida");
  validateCoverLines(cover.lines);
  if (typeof cover.title !== "string" || cover.title.length > 160)
    throw Error("El título de portada admite hasta 160 caracteres.");
  for (const [key, min, max] of [
    ["time", 0, duration],
    ["fontSize", 24, 180],
    ["x", 0, 100],
    ["y", 0, 100],
    ["zoom", 1, 4],
    ["offsetX", -100, 100],
    ["offsetY", -100, 100],
  ])
    if (!Number.isFinite(cover[key]) || cover[key] < min || cover[key] > max)
      throw Error("Ajuste de portada inválido: " + key);
  if (
    !coverTemplates.some((template) => template.id === cover.template) ||
    !["Impact", "Arial", "Georgia", "Segoe Print"].includes(cover.fontFamily) ||
    typeof cover.textBackground !== "boolean"
  )
    throw Error("Estilo de portada inválido");
  for (const key of ["color", "outline", "background"])
    if (!/^#[0-9a-f]{6}$/i.test(cover[key]))
      throw Error("Color de portada inválido");
}
export function coverCrop(width, height, zoom, offsetX, offsetY) {
  const scale = Math.max(1080 / width, 1920 / height) * zoom;
  const w = width * scale,
    h = height * scale;
  return {
    width: w,
    height: h,
    x: (1080 - w) / 2 + ((offsetX / 100) * (w - 1080)) / 2,
    y: (1920 - h) / 2 + ((offsetY / 100) * (h - 1920)) / 2,
  };
}
export function wrapCoverTitle(text, measure, maxWidth) {
  const lines = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/u).filter(Boolean)) {
      const candidate = line ? line + " " + word : word;
      if (measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) {
        lines.push(line);
        line = "";
      }
      for (const char of Array.from(word)) {
        if (line && measure(line + char) > maxWidth) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
    }
    lines.push(line);
  }
  return lines;
}
export function drawCover(canvas, video, cover, safeGuide = false, onLayout) {
  const ctx = canvas.getContext("2d");
  if (!ctx || !video.videoWidth) return;
  canvas.width = 1080;
  canvas.height = 1920;
  const crop = coverCrop(
    video.videoWidth,
    video.videoHeight,
    cover.zoom,
    cover.offsetX,
    cover.offsetY,
  );
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.drawImage(video, crop.x, crop.y, crop.width, crop.height);
  if (cover.template === "cinema") {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 1080, 135);
    ctx.fillRect(0, 1785, 1080, 135);
  }
  if (cover.template === "frame") {
    ctx.strokeStyle = cover.color;
    ctx.lineWidth = 6;
    ctx.strokeRect(46, 64, 988, 1792);
  }
  if (["minimal", "handwritten"].includes(cover.template)) {
    const topShade = ctx.createLinearGradient(0, 0, 0, 1000);
    topShade.addColorStop(0, "#000000aa");
    topShade.addColorStop(1, "#00000000");
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, 1080, 1000);
  }
  if (cover.template !== "banner") {
    const gradient = ctx.createLinearGradient(0, 600, 0, 1920);
    gradient.addColorStop(0, "#00000000");
    gradient.addColorStop(
      1,
      cover.template === "editorial" ? "#000000cc" : "#00000099",
    );
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);
  }
  if (cover.lines) return drawCoverLines(ctx, cover, safeGuide, onLayout);
  let size = cover.fontSize,
    lines;
  do {
    ctx.font = `900 ${size}px "${cover.fontFamily}"`;
    lines = wrapCoverTitle(
      cover.title,
      (value) => ctx.measureText(value).width,
      940,
    );
    if (lines.length * size * 1.15 <= 1600) break;
    size--;
  } while (size > 24);
  const lineHeight = size * 1.15,
    total = lines.length * lineHeight;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const padding = cover.textBackground ? 18 : Math.max(2, size / 16) / 2;
  const measures = lines.map((line) => ctx.measureText(line));
  const left =
    Math.max(
      0,
      ...measures.map((m) => m.actualBoundingBoxLeft ?? m.width / 2),
    ) + padding;
  const right =
    Math.max(
      0,
      ...measures.map((m) => m.actualBoundingBoxRight ?? m.width / 2),
    ) + padding;
  const top =
    Math.max(
      0,
      ...measures.map(
        (m, i) =>
          (m.actualBoundingBoxAscent ?? size * 0.5) -
          (i - (lines.length - 1) / 2) * lineHeight,
      ),
    ) + (cover.textBackground ? lineHeight * 0.15 : padding);
  const bottom =
    Math.max(
      0,
      ...measures.map(
        (m, i) =>
          (m.actualBoundingBoxDescent ?? size * 0.5) +
          (i - (lines.length - 1) / 2) * lineHeight,
      ),
    ) + (cover.textBackground ? lineHeight * 0.15 : padding);
  const bounds = {
    halfWidth: ((left + right) / 1080) * 50,
    halfHeight: ((top + bottom) / 1920) * 50,
    left: (left / 1080) * 100,
    right: (right / 1080) * 100,
    top: (top / 1920) * 100,
    bottom: (bottom / 1920) * 100,
  };
  const position = constrainPosition(
    { x: cover.x, y: cover.y },
    safeGuide,
    bounds,
  );
  const x = position.x * 10.8,
    firstY = position.y * 19.2 - ((lines.length - 1) * lineHeight) / 2;
  if (cover.template === "neon") {
    ctx.shadowColor = cover.color;
    ctx.shadowBlur = 30;
  }
  lines.forEach((line, i) => {
    const textWidth = ctx.measureText(line).width,
      cx = x,
      cy = firstY + i * lineHeight;
    if (cover.textBackground && line) {
      ctx.fillStyle = cover.background;
      ctx.fillRect(
        cx - textWidth / 2 - 18,
        cy - lineHeight / 2,
        textWidth + 36,
        lineHeight,
      );
    }
    ctx.lineWidth = Math.max(2, size / 16);
    ctx.strokeStyle = cover.outline;
    ctx.strokeText(line, cx, cy);
    ctx.fillStyle = cover.color;
    ctx.fillText(line, cx, cy);
  });
  const indices = cover.title
    .split("\n")
    .flatMap((paragraph, i) =>
      wrapCoverTitle(
        paragraph,
        (value) => ctx.measureText(value).width,
        940,
      ).map(() => Math.min(i, 2)),
    );
  const rectangles = new Map();
  measures.forEach((m, i) => {
    const index = indices[i] ?? 0,
      y = firstY + i * lineHeight;
    const rect = {
      index,
      x: x - (m.actualBoundingBoxLeft ?? m.width / 2) - padding,
      y: y - (m.actualBoundingBoxAscent ?? size / 2) - padding,
      width:
        (m.actualBoundingBoxLeft ?? m.width / 2) +
        (m.actualBoundingBoxRight ?? m.width / 2) +
        padding * 2,
      height:
        (m.actualBoundingBoxAscent ?? size / 2) +
        (m.actualBoundingBoxDescent ?? size / 2) +
        padding * 2,
    };
    const previous = rectangles.get(index);
    if (previous) {
      const right = Math.max(previous.x + previous.width, rect.x + rect.width),
        bottom = Math.max(previous.y + previous.height, rect.y + rect.height);
      rect.x = Math.min(previous.x, rect.x);
      rect.y = Math.min(previous.y, rect.y);
      rect.width = right - rect.x;
      rect.height = bottom - rect.y;
    }
    rectangles.set(index, rect);
  });
  onLayout?.([...rectangles.values()]);
  return bounds;
}
