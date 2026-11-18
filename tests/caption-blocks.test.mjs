import test from "node:test";
import assert from "node:assert/strict";
import {
  captionBlocks,
  captionLineSplit,
  editCaptionBlocks,
} from "../src/caption-blocks.mjs";
import { exportSubtitles } from "../src/subtitle-files.mjs";
const words = (text) =>
  text
    .split(" ")
    .map((text, i) => ({
      id: `w${i}`,
      text,
      start: i * 0.3,
      end: i * 0.3 + 0.25,
    }));
test("agrupa por puntuación y evita dejar artículos o preposiciones al final", () => {
  const w = words(
    "No olvides llevar tu documento para poder ingresar. Gracias por venir.",
  );
  const blocks = captionBlocks(w, 4);
  assert.ok(blocks[0].length >= 3);
  assert.notEqual(blocks[0].at(-1).text, "tu");
  assert.deepEqual(blocks.flat(), w);
  assert.ok(blocks.some((b) => b.at(-1).text === "ingresar."));
  assert.ok(
    blocks.every((b) => !["tu", "para", "por"].includes(b.at(-1).text)),
  );
});
test("respeta pausas largas y modo de una palabra; limita duración y longitud", () => {
  const w = words("hola mundo otra frase");
  w[2].start = 2;
  w[2].end = 2.2;
  w[3].start = 2.3;
  w[3].end = 2.6;
  assert.equal(captionBlocks(w, 8)[0].length, 2);
  assert.ok(captionBlocks(w, 1).every((b) => b.length === 1));
  assert.ok(
    captionBlocks(words(Array(40).fill("largapalabra").join(" ")), 4).every(
      (b) => b.map((w) => w.text).join(" ").length <= 64,
    ),
  );
});
test("unir y dividir fija los cortes sin cambiar palabras, estilos ni tiempos", () => {
  const w = words("Hola mundo. Esta es otra frase.");
  w[0].style = { color: "#ffffff" };
  const joined = editCaptionBlocks(w, 4, "join", w[0].id);
  assert.equal(captionBlocks(joined, 1).length, 1);
  const split = editCaptionBlocks(joined, 4, "split", w[1].id);
  assert.deepEqual(
    captionBlocks(split, 1).map((b) => b.length),
    [2, 4],
  );
  assert.deepEqual(editCaptionBlocks(split, 4, "auto"), w);
  assert.deepEqual(w[0].style, { color: "#ffffff" });
  const srt = exportSubtitles({
    words: split,
    duration: 3,
    style: { wordsPerBlock: 1, captionLeadMs: 0 },
  });
  assert.match(srt, /Hola mundo\./);
  assert.match(srt, /Esta es otra frase\./);
});
test("la separación entre líneas evita terminar en artículo y respeta elección explícita", () => {
  const w = words("No olvides llevar tu documento para ingresar");
  assert.notEqual(captionLineSplit(w), 4);
  assert.equal(captionLineSplit(w, 4), 4);
  assert.equal(captionLineSplit(w, 100), 6);
  assert.deepEqual(captionBlocks([], 4), []);
});
