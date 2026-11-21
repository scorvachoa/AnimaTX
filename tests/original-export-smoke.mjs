import fs from "node:fs/promises";
import { spawnSync, spawn } from "node:child_process";
import ffmpeg from "ffmpeg-static";
import { probeMedia } from "../server/original-media.mjs";
import assert from "node:assert/strict";
const file = "data/test-fixtures/original-export-smoke.mp4",
  base = "http://127.0.0.1:4311";
const r = spawnSync(
  ffmpeg,
  [
    "-y",
    "-threads",
    "1",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=1280x720:rate=15",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:sample_rate=48000",
    "-t",
    "0.8",
    "-c:v",
    "libx264",
    "-threads",
    "1",
    "-b:v",
    "400k",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "64k",
    file,
  ],
  { encoding: "utf8", windowsHide: true },
);
assert.equal(r.status, 0, r.stderr);
const server = spawn(process.execPath, ["server/index.mjs"], {
  env: { ...process.env, ANIMATX_PORT: "4311" },
  windowsHide: true,
  stdio: "ignore",
});
let id;
try {
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(base + "/api/projects");
      if (response.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  const form = new FormData();
  form.append(
    "video",
    new Blob([await fs.readFile(file)], { type: "video/mp4" }),
    "original-export-smoke.mp4",
  );
  const upload = await fetch(base + "/api/projects", {
    method: "POST",
    body: form,
  });
  const p = await upload.json();
  assert.ok(upload.ok, JSON.stringify(p));
  id = p.id;
  assert.equal(
    p.sourceMedia?.fps,
    15,
    "El servidor no está actualizado o no guardó los metadatos.",
  );
  assert.equal(p.sourceMedia.width, 1280);
  assert.equal(p.width, 1080);
  await fs.access("data/" + id + "/source");
  p.words = [{ id: "smoke-word", text: "Prueba", start: 0, end: 0.6 }];
  const saved = await fetch(base + "/api/projects/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  assert.ok(saved.ok, await saved.text());
  const job = await (
    await fetch(base + "/api/projects/" + id + "/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
  ).json();
  assert.ok(job.id, JSON.stringify(job));
  const queued = await (
    await fetch(base + "/api/projects/" + id + "/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
  ).json();
  const cancelled = await fetch(base + "/api/jobs/" + queued.id + "/cancel", {
    method: "POST",
  });
  assert.ok(cancelled.ok);
  for (let i = 0; i < 30; i++) {
    const state = await (await fetch(base + "/api/jobs/" + queued.id)).json();
    if (state.status === "cancelled") break;
    if (i === 29) throw Error("La cancelación en cola no se completó.");
    await new Promise((r) => setTimeout(r, 100));
  }
  const resources = await (await fetch(base + "/api/resources")).json();
  assert.ok(resources.threads <= 2);
  assert.equal(resources.renderConcurrency, 1);
  for (let i = 0; i < 120; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const status = await (await fetch(base + "/api/jobs/" + job.id)).json();
    if (status.status === "error") throw Error(status.message);
    if (status.status === "done") {
      const target = "data/" + id + "/" + status.url.split("/").at(-1);
      const m = await probeMedia(target);
      assert.equal(m.fps, 15);
      assert.equal(m.width, 1280);
      assert.equal(m.height, 720);
      assert.equal(m.audioCodec, "aac");
      assert.equal(m.sampleRate, 48000);
      const audioHash = (file) => {
        const r = spawnSync(
          ffmpeg,
          [
            "-v",
            "error",
            "-i",
            file,
            "-map",
            "0:a:0",
            "-c:a",
            "copy",
            "-f",
            "hash",
            "-hash",
            "sha256",
            "-",
          ],
          { encoding: "utf8", windowsHide: true },
        );
        assert.equal(r.status, 0, r.stderr);
        return r.stdout.trim();
      };
      assert.equal(
        audioHash(target),
        audioHash("data/" + id + "/source"),
        "El audio debe conservar sus paquetes sin recodificar",
      );
      console.log(
        JSON.stringify({
          status: "passed",
          fps: m.fps,
          width: m.width,
          height: m.height,
          audioCodec: m.audioCodec,
          sampleRate: m.sampleRate,
        }),
      );
      break;
    }
    if (i === 119) throw Error("Exportación no terminó en 60 segundos.");
  }
} finally {
  if (id) {
    const result = await fetch(base + "/api/projects/" + id, {
      method: "DELETE",
    });
    console.log("Limpieza de proyecto de prueba:", result.status);
  }
  server.kill();
  await fs.unlink(file).catch(() => {});
}
