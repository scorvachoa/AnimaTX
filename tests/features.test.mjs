import test from "node:test";
import assert from "node:assert/strict";
import { alignCTC, scriptTokens } from "../server/ctc-align.mjs";
import { importSubtitles, exportSubtitles } from "../src/subtitle-files.mjs";
import { recordHistory } from "../src/project-history.mjs";
import { scaleTemplateStyle } from "../src/custom-templates.mjs";
import { impactoStyle } from "../src/templates-data.mjs";
import { validateProject } from "../server/validation.mjs";
test("CTC encuentra palabras en probabilidades acústicas, incluido blank", () => {
  const classes = 31,
    labels = [0, 4, 4, 0, 20, 20, 0],
    logits = new Float32Array(classes * labels.length).fill(-10);
  labels.forEach((id, t) => (logits[t * classes + id] = 10));
  const r = alignCTC(logits, labels.length, classes, "a b", 0.7);
  assert.ok(Math.abs(r.words[0].start - 0.1) < 1e-8);
  assert.ok(Math.abs(r.words[0].end - 0.3) < 1e-8);
  assert.equal(r.words[1].text, "b");
  assert.ok(r.confidence > 0.99);
  assert.deepEqual(scriptTokens("niño").tokens, scriptTokens("nino").tokens);
  assert.deepEqual(
    scriptTokens("2026").tokens,
    scriptTokens("dos mil veintiseis").tokens,
  );
});
test("SRT y VTT importan cues conservando texto, orden y límites del video", () => {
  const input =
    "1\n00:00:00,100 --> 00:00:01,000\nHola mundo\n\n2\n00:00:01,200 --> 00:00:02,000\nCómo estás\n";
  const parsed = importSubtitles(input, 3);
  assert.equal(parsed.cues, 2);
  assert.equal(parsed.words.length, 4);
  assert.equal(parsed.words[0].start, 0.1);
  const p = {
    name: "x",
    duration: 3,
    words: parsed.words,
    style: { ...impactoStyle(576), captionLeadMs: 0 },
  };
  for (const format of ["srt", "vtt"])
    assert.deepEqual(
      importSubtitles(exportSubtitles(p, format), 3).words.map((w) => w.text),
      parsed.words.map((w) => w.text),
    );
  assert.throws(() => importSubtitles(input, 1), /exceden/);
  assert.throws(
    () =>
      importSubtitles(
        "1\n00:00:00,000 --> 00:00:02,000\na\n\n2\n00:00:01,000 --> 00:00:03,000\nb",
        3,
      ),
    /superponen/,
  );
});
test("el historial agrupa escritura consecutiva, separa acciones y descarta rehacer", () => {
  const p = {
    id: "x",
    style: impactoStyle(576),
    words: [{ id: "a", text: "H", start: 0, end: 1 }],
  };
  let h = { past: [], future: [], at: 0, group: "" };
  const q = { ...p, words: [{ ...p.words[0], text: "Ho" }] };
  h = recordHistory(h, p, q, 1000);
  const r = { ...q, words: [{ ...q.words[0], text: "Hola" }] };
  h = recordHistory(h, q, r, 1200);
  assert.equal(h.past.length, 1);
  h = recordHistory(h, r, { ...r, style: { ...r.style, y: 60 } }, 1500);
  assert.equal(h.past.length, 2);
  assert.equal(h.future.length, 0);
});
test("plantillas personales escalan fuentes y estilos por palabra se validan", () => {
  const style = scaleTemplateStyle(
    { width: 1080, style: impactoStyle(1080) },
    540,
  );
  assert.equal(style.fontSize, Math.round(impactoStyle(1080).fontSize / 2));
  const p = {
    duration: 2,
    words: [
      {
        id: "a",
        text: "Hola",
        start: 0,
        end: 1,
        style: {
          fontFamily: "Impact",
          color: "#ff0000",
          fontSize: 80,
          animation: "bounce",
        },
      },
    ],
    style,
  };
  assert.doesNotThrow(() => validateProject(p));
  p.words[0].style.fontSize = 0;
  assert.throws(() => validateProject(p), /palabra/);
});
