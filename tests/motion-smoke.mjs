// Regression: compare every exported frame against a moving 30fps source.
// A static-color fixture cannot detect duplicated, skipped or out-of-order frames.
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import ffmpeg from "ffmpeg-static";
const base = "http://127.0.0.1:4310";
await fs.mkdir("data/test-fixtures", { recursive: true });
const fixture = "data/test-fixtures/motion.mp4";
function run(args) {
  const r = spawnSync(ffmpeg, args, {
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
  assert.equal(r.status, 0, r.stderr?.toString());
  return r.stderr.toString();
}
run([
  "-y",
  "-f",
  "lavfi",
  "-i",
  "testsrc2=size=320x480:rate=30:duration=2",
  "-f",
  "lavfi",
  "-i",
  "sine=frequency=440:duration=2",
  "-c:v",
  "libx264",
  "-crf",
  "18",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "aac",
  "-shortest",
  fixture,
]);
async function request(url, options) {
  for (let i = 0; i < 4; i++) {
    try {
      const response = await fetch(base + url, options);
      const body = await response.json();
      assert.ok(response.ok, JSON.stringify(body));
      return body;
    } catch (e) {
      if (i === 3 || options?.method) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}
const form = new FormData();
form.append(
  "video",
  new Blob([await fs.readFile(fixture)], { type: "video/mp4" }),
  "motion-regression.mp4",
);
const project = await request("/api/projects", { method: "POST", body: form });
const { id } = await request(`/api/projects/${project.id}/export`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});
let exported;
for (let i = 0; i < 180; i++) {
  const j = await request("/api/jobs/" + id);
  assert.notEqual(j.status, "error", j.message);
  if (j.status === "done") {
    exported = path.resolve("data", j.url.replace("/media/", ""));
    break;
  }
  await new Promise((r) => setTimeout(r, 1000));
}
assert.ok(exported, "Export timed out");
const source = path.resolve("data", project.id, "video.mp4");
const info = run([
  "-i",
  source,
  "-i",
  exported,
  "-filter_complex",
  "[0:v]setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]ssim",
  "-an",
  "-f",
  "null",
  "-",
]);
const score = Number(info.match(/All:([\d.]+)/)?.[1]);
assert.ok(score > 0.97, `Frame similarity too low: ${score}`);
const sourceAudio = run(["-i", source, "-map", "0:a:0", "-f", "null", "-"]);
const outputAudio = run(["-i", exported, "-map", "0:a:0", "-f", "null", "-"]);
assert.match(sourceAudio, /Audio:/);
assert.match(outputAudio, /Audio:/);
console.log(
  `PASS moving video: frame SSIM=${score}; audio present; export=${exported}`,
);
