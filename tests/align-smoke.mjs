import { spawnSync } from "node:child_process";
import { Worker } from "node:worker_threads";
import path from "node:path";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import ffmpeg from "ffmpeg-static";
const audio = path.resolve("data/test-fixtures/align.f32");
await fs.mkdir(path.dirname(audio), { recursive: true });
const r = spawnSync(
  ffmpeg,
  [
    "-y",
    "-i",
    "data/test-fixtures/speech.wav",
    "-ar",
    "16000",
    "-ac",
    "1",
    "-f",
    "f32le",
    audio,
  ],
  { windowsHide: true },
);
assert.equal(r.status, 0, r.stderr?.toString());
const script = "Hello world. This is a test of automatic subtitles.";
const worker = new Worker(path.resolve("server/align.mjs"), {
  workerData: { audio, script, cache: path.resolve(".cache") },
});
await new Promise((resolve, reject) => {
  worker.on("message", (m) => {
    if (m.message) console.log(m.message);
    if (m.error) {
      reject(Error(m.error));
      worker.terminate();
    }
    if (m.result) {
      try {
        assert.equal(m.result.words.map((w) => w.text).join(" "), script);
        assert.ok(m.result.confidence > 0.1);
        for (let i = 0; i < m.result.words.length; i++) {
          const w = m.result.words[i];
          assert.ok(w.end > w.start);
          if (i) assert.ok(w.start >= m.result.words[i - 1].end);
        }
        console.log("PASS acoustic alignment", JSON.stringify(m.result));
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        worker.terminate();
      }
    }
  });
  worker.on("error", reject);
});
