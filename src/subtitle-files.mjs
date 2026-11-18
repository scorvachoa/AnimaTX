import { captionBlocks, captionLineSplit } from "./caption-blocks.mjs";
export function applyImportedSubtitles(project, words) {
  // SRT/VTT timestamps are already presentation times, including any offset
  // applied by their exporter. Start at zero offset when importing them.
  return { ...project, words, style: { ...project.style, captionLeadMs: 0 } };
}
export function parseTime(value) {
  const match = value.match(/^(?:(\d{1,3}):)?(\d{2}):(\d{2})[,.](\d{3})$/);
  if (!match || +match[2] > 59 || +match[3] > 59)
    throw Error("Marca de tiempo inválida: " + value);
  return (
    (+match[1] || 0) * 3600 + +match[2] * 60 + +match[3] + +match[4] / 1000
  );
}
export function importSubtitles(text, duration) {
  if (text.length > 2000000) throw Error("El archivo supera los 2 MB.");
  const chunks = text
      .replace(/^\uFEFF/, "")
      .replace(/\r/g, "")
      .split(/\n\s*\n/),
    words = [];
  let previous = 0,
    cues = 0;
  for (const chunk of chunks) {
    const lines = chunk.trim().split("\n");
    if (!lines.length || /^(WEBVTT|NOTE(?:\s|$)|STYLE$|REGION$)/.test(lines[0]))
      continue;
    const index = lines.findIndex((l) => l.includes("-->"));
    if (index < 0) continue;
    const timing = lines[index].match(/^(\S+)\s+-->\s+(\S+)(?:\s+.*)?$/);
    if (!timing) throw Error("Línea de tiempo inválida");
    const start = parseTime(timing[1]),
      end = parseTime(timing[2]);
    if (end <= start || start < previous || end > duration + 0.05)
      throw Error(
        "Los subtítulos se superponen, tienen tiempos inválidos o exceden el video.",
      );
    const content = lines
      .slice(index + 1)
      .join(" ")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim()
      .split(/\s+/u)
      .filter(Boolean);
    if (!content.length) continue;
    const cueId = crypto.randomUUID();
    content.forEach((text, i) =>
      words.push({
        id: crypto.randomUUID(),
        text,
        start: start + ((end - start) * i) / content.length,
        end:
          i === content.length - 1
            ? end
            : start + ((end - start) * (i + 1)) / content.length,
        cueId,
      }),
    );
    previous = end;
    cues++;
  }
  if (!words.length)
    throw Error("No se encontraron subtítulos válidos SRT/VTT.");
  if (words.length > 10000)
    throw Error("El archivo supera las 10 000 palabras.");
  return { words, cues };
}
function stamp(seconds, vtt) {
  let ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3600000);
  ms %= 3600000;
  const m = Math.floor(ms / 60000);
  ms %= 60000;
  const s = Math.floor(ms / 1000);
  ms %= 1000;
  return (
    [h, m, s].map((n) => String(n).padStart(2, "0")).join(":") +
    (vtt ? "." : ",") +
    String(ms).padStart(3, "0")
  );
}
export function exportSubtitles(project, format = "srt") {
  const vtt = format === "vtt",
    lead = (project.style.captionLeadMs ?? 150) / 1000;
  const groups = captionBlocks(project.words, project.style.wordsPerBlock);
  const cues = [];
  for (const g of groups) {
    const start = Math.max(0, g[0].start - lead),
      end = Math.min(project.duration, g.at(-1).end - lead);
    if (end <= start) continue;
    let content = g.map((w) => w.text).join(" ");
    if (project.style.twoLines && g.length > 1) {
      const split = captionLineSplit(g, project.style.firstLineWords);
      content =
        g
          .slice(0, split)
          .map((w) => w.text)
          .join(" ") +
        "\n" +
        g
          .slice(split)
          .map((w) => w.text)
          .join(" ");
    }
    cues.push(
      `${cues.length + 1}\n${stamp(start, vtt)} --> ${stamp(end, vtt)}\n${content}`,
    );
  }
  return (vtt ? "WEBVTT\n\n" : "") + cues.join("\n\n") + "\n";
}
