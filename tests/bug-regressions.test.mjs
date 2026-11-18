import test from "node:test";
import assert from "node:assert/strict";
import { createJobLock } from "../server/job-lock.mjs";
import { activeCaptionBlock } from "../src/caption-blocks.mjs";
import { captionTime } from "../src/caption-time.mjs";
import {
  exportSubtitles,
  importSubtitles,
  applyImportedSubtitles,
} from "../src/subtitle-files.mjs";
test("un único trabajo atraviesa la lectura asíncrona; libera al fallar y al terminar", async () => {
  const lock = createJobLock();
  let starts = 0;
  const start = async () => {
    const release = lock.tryAcquire();
    if (!release) return false;
    try {
      await Promise.resolve();
      starts++;
      return true;
    } finally {
      release();
    }
  };
  assert.deepEqual(await Promise.all([start(), start()]), [true, false]);
  assert.equal(starts, 1);
  const first = lock.tryAcquire();
  first();
  const second = lock.tryAcquire();
  first();
  assert.equal(lock.tryAcquire(), null);
  second();
  await assert.rejects(async () => {
    const release = lock.tryAcquire();
    try {
      await Promise.resolve();
      throw Error("lectura fallida");
    } finally {
      release();
    }
  });
  assert.equal(await start(), true);
});
test("la frontera pertenece al bloque nuevo y el final no añade un fotograma", () => {
  const a = [{ start: 0, end: 1 }],
    b = [{ start: 1, end: 2 }];
  assert.equal(activeCaptionBlock([a, b], 1), b);
  assert.equal(activeCaptionBlock([a, b], 29 / 30), a);
  assert.equal(activeCaptionBlock([a, b], 2), undefined);
  assert.equal(activeCaptionBlock([a, b], -1), undefined);
  assert.equal(activeCaptionBlock([], 0), undefined);
});
for (const format of ["srt", "vtt"])
  for (const offset of [150, -200, 0])
    test(`ida y vuelta ${format}, offset ${offset} ms, no acumula desplazamiento`, () => {
      const project = {
        duration: 3,
        words: [{ id: "a", text: "Hola.", start: 1, end: 2 }],
        style: { wordsPerBlock: 4, captionLeadMs: offset },
      };
      const output = exportSubtitles(project, format);
      const imported = applyImportedSubtitles(
        project,
        importSubtitles(output, 3).words,
      );
      assert.equal(imported.style.captionLeadMs, 0);
      assert.equal(
        captionTime(imported.words[0].start, imported.style.captionLeadMs),
        1 - offset / 1000,
      );
      assert.equal(exportSubtitles(imported, format), output);
      assert.equal(project.style.captionLeadMs, offset);
    });
