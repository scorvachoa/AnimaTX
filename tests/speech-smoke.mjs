import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";
import assert from "node:assert/strict";
const base = "http://127.0.0.1:4310";
const file = "data/test-fixtures/speech.mp4";
const conversion = spawnSync(
  ffmpeg,
  [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=0x23302b:s=360x640:r=30",
    "-i",
    "data/test-fixtures/speech.wav",
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-shortest",
    file,
  ],
  { windowsHide: true },
);
assert.equal(conversion.status, 0, conversion.stderr?.toString());
async function request(url, options) {
  for (let n = 0; n < 4; n++) {
    try {
      const r = await fetch(base + url, options);
      const j = await r.json();
      if (!r.ok) throw Error(JSON.stringify(j));
      return j;
    } catch (e) {
      if (n === 3 || options?.method === "POST") throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}
const body = new FormData();
body.append("video", new Blob([await fs.readFile(file)]), "voz-prueba.mp4");
const p = await request("/api/projects", { method: "POST", body });
const { id } = await request(`/api/projects/${p.id}/transcribe`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ language: "en" }),
});
let last = "";
for (let i = 0; i < 900; i++) {
  const j = await request("/api/jobs/" + id);
  if (j.message !== last) {
    console.log(j.message);
    last = j.message;
  }
  if (j.status === "error") throw Error(j.message);
  if (j.status === "done") {
    assert.ok(j.project.words.length > 2);
    assert.match(j.project.words.map((w) => w.text).join(" "), /hello/i);
    console.log(
      "PASS local speech recognition",
      JSON.stringify(j.project.words),
    );
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 1000));
}
throw Error("Transcription timeout");
