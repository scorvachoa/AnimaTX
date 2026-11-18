import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import ffmpeg from "ffmpeg-static";
const root = path.resolve("data"),
  fixture = path.join(root, "test-fixtures", "thumb-motion.mp4");
await fs.mkdir(path.dirname(fixture), { recursive: true });
const made = spawnSync(
  ffmpeg,
  [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=360x640:rate=30:duration=3",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    fixture,
  ],
  { windowsHide: true },
);
assert.equal(made.status, 0, made.stderr?.toString());
const base = "http://127.0.0.1:4310",
  form = new FormData();
form.append(
  "video",
  new Blob([await fs.readFile(fixture)]),
  "__THUMB_TEST__.mp4",
);
let r = await fetch(base + "/api/projects", { method: "POST", body: form });
assert.ok(r.ok);
const p = await r.json();
try {
  r = await fetch(base + `/api/projects/${p.id}/assets`);
  const a = await r.json();
  assert.ok(r.ok, JSON.stringify(a));
  assert.equal(a.thumbnailVersion, 2);
  assert.ok(a.thumbnailCount >= 12);
  assert.ok(
    Math.abs(a.thumbnailWidth / a.thumbnailHeight - p.width / p.height) < 0.02,
  );
  const image = path.join(root, p.id, "thumbnails-v2.jpg");
  function hash(index) {
    const col = index % a.thumbnailColumns,
      row = Math.floor(index / a.thumbnailColumns);
    const result = spawnSync(
      ffmpeg,
      [
        "-i",
        image,
        "-vf",
        `crop=${a.thumbnailWidth}:${a.thumbnailHeight}:${col * a.thumbnailWidth}:${row * a.thumbnailHeight}`,
        "-frames:v",
        "1",
        "-f",
        "md5",
        "-",
      ],
      { windowsHide: true },
    );
    assert.equal(result.status, 0, result.stderr?.toString());
    return result.stdout.toString();
  }
  assert.notEqual(hash(0), hash(a.thumbnailCount - 1));
  console.log(
    "PASS sharp proportional thumbnails, different frames, v2 cache",
    a.thumbnailCount,
    a.thumbnailWidth,
    a.thumbnailHeight,
  );
} finally {
  const dir = path.resolve(root, p.id);
  assert.equal(path.dirname(dir), root);
  await fs.rm(dir, { recursive: true, force: true });
}
