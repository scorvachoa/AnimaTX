// Integration check against a running local server. Creates a short local fixture.
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import ffmpeg from "ffmpeg-static";
import assert from "node:assert/strict";
import { impactoStyle } from "../src/templates-data.mjs";
await fs.mkdir("data/test-fixtures", { recursive: true });
const fixture = "data/test-fixtures/test.mp4";
const result = spawnSync(
  ffmpeg,
  [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=0x23302b:s=360x640:d=2",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:duration=2",
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-shortest",
    fixture,
  ],
  { windowsHide: true },
);
assert.equal(result.status, 0, result.stderr?.toString());
const body = new FormData();
body.append(
  "video",
  new Blob([await fs.readFile(fixture)], { type: "video/mp4" }),
  "prueba.mp4",
);
const base = "http://127.0.0.1:4310";
async function request(url, options) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(base + url, options);
      const j = await r.json();
      assert.equal(r.ok, true, JSON.stringify(j));
      return j;
    } catch (error) {
      if (options?.method || attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
let p = await request("/api/projects", { method: "POST", body });
assert.equal(p.width, 360);
assert.equal(p.height, 640);
assert.ok(p.duration >= 2);
p.words = [
  { id: "test1", text: "Hola", start: 0.1, end: 0.8 },
  { id: "test2", text: "mundo", start: 0.8, end: 1.8 },
];
if (process.env.ADVANCED === "1") {
  p.style = {
    ...p.style,
    twoLines: true,
    firstLineWords: 1,
    fontFamily: process.env.HANDWRITING === "1" ? "Segoe Print" : "Georgia",
    secondFontFamily: process.env.HANDWRITING === "1" ? "Ink Free" : "Impact",
    secondFontSize: 80,
    secondColor: "#ffbc59",
    animation: "slide",
  };
  if (process.env.SPACING === "1")
    Object.assign(p.style, { letterSpacing: 3, lineGap: 24, uppercase: true });
}
if (process.env.INDEPENDENT === "1")
  Object.assign(p.style, {
    uppercase: true,
    letterSpacing: 3,
    animation: "pop",
    secondUppercase: false,
    secondLetterSpacing: 0,
    secondAnimation: "slide",
    secondOutline: "#553311",
    secondActiveColor: "#ff0000",
  });
if (process.env.ANIMATIONS === "1")
  Object.assign(p.style, { animation: "typewriter", secondAnimation: "float" });
if (process.env.TEMPLATE === "1") p.style = impactoStyle(p.width);
await request("/api/projects/" + p.id, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(p),
});
const { id } = await request("/api/projects/" + p.id + "/export", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});
for (let i = 0; i < 300; i++) {
  const job = await request("/api/jobs/" + id);
  if (job.status === "error") throw Error(job.message);
  if (job.status === "done") {
    const video = await fetch(base + job.url);
    assert.ok(video.ok);
    assert.ok(Number(video.headers.get("content-length")) > 1000);
    console.log("PASS upload, metadata, save, animated MP4 export:", job.url);
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 1000));
}
throw Error("Export timeout");
