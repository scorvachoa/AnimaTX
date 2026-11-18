import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { impactoStyle } from "../src/templates-data.mjs";
const base = "http://127.0.0.1:4310";
async function req(url, method = "GET", body) {
  for (let a = 0; a < 4; a++)
    try {
      const r = await fetch(base + url, {
        method,
        headers:
          body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" },
        body:
          body === undefined
            ? undefined
            : body instanceof FormData
              ? body
              : JSON.stringify(body),
      });
      const j = await r.json();
      assert.ok(r.ok, JSON.stringify(j));
      return j;
    } catch (e) {
      if (method !== "GET" || a === 3) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
}
const form = new FormData();
form.append(
  "video",
  new Blob([await fs.readFile("data/test-fixtures/speech.mp4")]),
  "__ANIMATX_TEST__.mp4",
);
const p = await req("/api/projects", "POST", form);
p.style = { ...impactoStyle(p.width), x: 47, y: 70 };
p.words = [
  {
    id: "a",
    text: "Hello",
    start: 0.3,
    end: 0.8,
    style: { fontSize: 70, color: "#ff5599", animation: "bounce" },
  },
  { id: "b", text: "world.", start: 0.8, end: 1.4 },
];
p.script = "Hello world. This is a test of automatic subtitles.";
await req("/api/projects/" + p.id, "PUT", p);
console.log("PROJECT", p.id);
const t = await req("/api/templates", "POST", {
  name: "__TEST__",
  width: p.width,
  style: p.style,
});
await req("/api/templates/" + t.id, "PUT", { name: "__TEST_RENAMED__" });
const copy = await req("/api/templates", "POST", {
  ...t,
  name: "__TEST_COPY__",
});
assert.ok(
  (await req("/api/templates")).some((x) => x.name === "__TEST_RENAMED__"),
);
await req("/api/templates/" + t.id, "DELETE");
await req("/api/templates/" + copy.id, "DELETE");
console.log("PASS personal templates create/rename/duplicate/delete");
const assets = await req(`/api/projects/${p.id}/assets`);
assert.ok(assets.peaks.length > 0);
assert.ok(assets.peaks.some((x) => x > 0));
assert.ok((await fetch(base + assets.thumbnails)).ok);
console.log("PASS waveform and thumbnails");
const job = await req(`/api/projects/${p.id}/export`, "POST", {});
for (let i = 0; i < 180; i++) {
  const j = await req("/api/jobs/" + job.id);
  if (j.status === "error") throw Error(j.message);
  if (j.status === "done") {
    assert.ok((await fetch(base + j.url)).ok);
    console.log(
      "PASS MP4 with positioned captions and individual word styles",
      j.url,
    );
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 1000));
}
throw Error("Render timeout");
