import express from "express";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { Worker } from "node:worker_threads";
import ffmpeg from "ffmpeg-static";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { validateProject } from "./validation.mjs";
import { createJobLock } from "./job-lock.mjs";
import { installTemplateRoutes } from "./template-store.mjs";
import {
  reviewWithGemini,
  defaultModel,
  testGeminiConnection,
} from "./gemini.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  data = path.join(root, "data");
await fs.mkdir(data, { recursive: true });
const app = express();
app.use(express.json({ limit: "3mb" }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    origin &&
    ![
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      "http://127.0.0.1:4310",
      "http://localhost:4310",
    ].includes(origin)
  )
    return res.status(403).json({ error: "Origen no permitido" });
  next();
});
app.use("/media", express.static(data));
installTemplateRoutes(app, root);
const upload = multer({
  dest: path.join(data, "uploads"),
  limits: { fileSize: 500 * 1024 * 1024, files: 1 },
});
const jobs = new Map();
const privateDir = path.join(root, ".local");
const configFile = path.join(privateDir, "gemini.json");
async function geminiConfig() {
  try {
    return JSON.parse(await fs.readFile(configFile, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT")
      return {
        apiKey: process.env.GEMINI_API_KEY || "",
        model: process.env.GEMINI_MODEL || defaultModel,
      };
    throw Error("No se pudo leer la configuración de Gemini.");
  }
}
app.get("/api/gemini/config", async (req, res, next) => {
  try {
    const c = await geminiConfig();
    res.json({ configured: !!c.apiKey, model: c.model || defaultModel });
  } catch (e) {
    next(e);
  }
});
app.put("/api/gemini/config", async (req, res, next) => {
  try {
    const previous = await geminiConfig();
    const apiKey =
      typeof req.body.apiKey === "string"
        ? req.body.apiKey.trim()
        : previous.apiKey;
    const model = req.body.model || previous.model || defaultModel;
    if (
      !apiKey ||
      apiKey.length < 15 ||
      apiKey.length > 256 ||
      /\s/.test(apiKey)
    )
      throw Error("Introduce una clave de Gemini válida.");
    if (
      typeof model !== "string" ||
      !/^gemini-[a-zA-Z0-9.-]{1,100}$/.test(model)
    )
      throw Error("Nombre de modelo inválido.");
    await fs.mkdir(privateDir, { recursive: true });
    const temp = path.join(privateDir, `gemini-${randomUUID()}.tmp`);
    await fs.writeFile(temp, JSON.stringify({ apiKey, model }), {
      mode: 0o600,
    });
    await fs.rename(temp, configFile);
    res.json({ configured: true, model });
  } catch (e) {
    next(e);
  }
});
let testingGemini = false;
app.post("/api/gemini/test", async (req, res, next) => {
  try {
    if (testingGemini)
      return res
        .status(409)
        .json({ error: "Ya hay una prueba de conexión en curso." });
    const config = await geminiConfig();
    const apiKey =
      typeof req.body.apiKey === "string" && req.body.apiKey.trim()
        ? req.body.apiKey.trim()
        : config.apiKey;
    const model = req.body.model || config.model || defaultModel;
    testingGemini = true;
    try {
      res.json(await testGeminiConnection({ apiKey, model }));
    } finally {
      testingGemini = false;
    }
  } catch (e) {
    next(e);
  }
});
let reviewing = false;
app.post("/api/gemini/review", async (req, res, next) => {
  try {
    if (reviewing)
      return res
        .status(409)
        .json({ error: "Ya hay una revisión de Gemini en curso." });
    const p = validateProject(req.body.project);
    const config = await geminiConfig();
    reviewing = true;
    try {
      const edits = await reviewWithGemini({
        ...config,
        words: p.words,
        script: req.body.useScript === true ? p.script : undefined,
        language: req.body.language,
      });
      res.json({ edits });
    } finally {
      reviewing = false;
    }
  } catch (e) {
    next(e);
  }
});
const jobLock = createJobLock();
let bundled;
const folder = (id) => {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw Error("Proyecto inválido");
  return path.join(data, id);
};
const read = async (id) =>
  JSON.parse(await fs.readFile(path.join(folder(id), "project.json"), "utf8"));
const assetJobs = new Map();
app.get("/api/projects/:id/assets", async (req, res, next) => {
  try {
    const p = await read(req.params.id),
      dir = folder(p.id),
      cache = path.join(dir, "timeline-assets.json");
    try {
      const cached = JSON.parse(await fs.readFile(cache, "utf8"));
      if (cached.thumbnailVersion === 2) return res.json(cached);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    if (!assetJobs.has(p.id))
      assetJobs.set(
        p.id,
        (async () => {
          const file = path.join(dir, "waveform.f32");
          let peaks = [],
            hasAudio = true;
          try {
            await run([
              "-y",
              "-i",
              path.join(dir, "video.mp4"),
              "-vn",
              "-ac",
              "1",
              "-ar",
              "8000",
              "-f",
              "f32le",
              file,
            ]);
            const b = await fs.readFile(file),
              samples = new Float32Array(
                b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
              ),
              bins = Math.min(2000, Math.ceil(p.duration * 30));
            for (let i = 0; i < bins; i++) {
              let peak = 0;
              for (
                let j = Math.floor((i * samples.length) / bins);
                j < Math.floor(((i + 1) * samples.length) / bins);
                j++
              )
                peak = Math.max(peak, Math.abs(samples[j]));
              peaks.push(peak);
            }
          } catch {
            hasAudio = false;
          } finally {
            await fs.unlink(file).catch(() => {});
          }
          const thumbnailCount = Math.max(
            12,
            Math.min(120, Math.ceil(p.duration * 2)),
          );
          const thumbnailWidth = Math.max(
            32,
            Math.min(180, 2 * Math.round((48 * p.width) / p.height)),
          );
          const thumbnailHeight = 96,
            thumbnailColumns = 10,
            thumbnailRows = Math.ceil(thumbnailCount / thumbnailColumns);
          await run([
            "-y",
            "-i",
            path.join(dir, "video.mp4"),
            "-vf",
            `tpad=stop_mode=clone:stop_duration=1,fps=${thumbnailCount / p.duration}:start_time=0,trim=end_frame=${thumbnailCount},scale=${thumbnailWidth}:${thumbnailHeight}:force_original_aspect_ratio=decrease,pad=${thumbnailWidth}:${thumbnailHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1,tile=${thumbnailColumns}x${thumbnailRows}`,
            "-frames:v",
            "1",
            "-update",
            "1",
            "-q:v",
            "2",
            path.join(dir, "thumbnails-v2.jpg"),
          ]);
          const result = {
            peaks,
            hasAudio,
            thumbnails: `/media/${p.id}/thumbnails-v2.jpg`,
            thumbnailVersion: 2,
            thumbnailWidth,
            thumbnailHeight,
            thumbnailColumns,
            thumbnailRows,
            thumbnailCount,
          };
          await fs.writeFile(cache, JSON.stringify(result));
          return result;
        })().finally(() => assetJobs.delete(p.id)),
      );
    res.json(await assetJobs.get(p.id));
  } catch (e) {
    next(e);
  }
});
const write = async (p) => {
  const temp = path.join(folder(p.id), `project-${randomUUID()}.tmp`);
  await fs.writeFile(temp, JSON.stringify(p, null, 2));
  await fs.rename(temp, path.join(folder(p.id), "project.json"));
};
function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args, { windowsHide: true });
    let output = "";
    child.stderr.on("data", (d) => (output = (output + d).slice(-16000)));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve(output) : reject(Error(output.slice(-1200))),
    );
  });
}
app.get("/api/projects", async (req, res, next) => {
  try {
    const names = await fs.readdir(data);
    const all = await Promise.all(
      names
        .filter((n) => /^[0-9a-f-]{36}$/.test(n))
        .map((n) => read(n).catch(() => null)),
    );
    res.json(all.filter(Boolean));
  } catch (e) {
    next(e);
  }
});
app.post("/api/projects", upload.single("video"), async (req, res, next) => {
  let dir;
  try {
    if (!req.file) throw Error("Selecciona un video");
    const id = randomUUID();
    dir = folder(id);
    await fs.mkdir(dir);
    await fs.rename(req.file.path, path.join(dir, "source"));
    await run([
      "-y",
      "-i",
      path.join(dir, "source"),
      "-t",
      "181",
      "-vf",
      "scale='min(1080,iw)':-2",
      "-r",
      "30",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      path.join(dir, "video.mp4"),
    ]);
    const info = await run([
      "-i",
      path.join(dir, "video.mp4"),
      "-f",
      "null",
      "-",
    ]);
    const match = info.match(/Duration: (\d+):(\d+):([\d.]+)/);
    if (!match) throw Error("No se pudo leer el video");
    const duration = +match[1] * 3600 + +match[2] * 60 + +match[3];
    if (duration > 180.1) throw Error("El límite del MVP es 3 minutos.");
    const dims = info.match(/Video:.*? (\d{2,5})x(\d{2,5})/);
    if (!dims) throw Error("Resolución no reconocida");
    const p = {
      id,
      name: req.file.originalname,
      duration,
      width: +dims[1],
      height: +dims[2],
      words: [],
      style: {
        fontSize: 64,
        color: "#ffffff",
        activeColor: "#c8ff59",
        outline: "#111111",
        y: 76,
        animation: "karaoke",
        wordsPerBlock: 4,
      },
    };
    await write(p);
    await fs.unlink(path.join(dir, "source"));
    res.json(p);
  } catch (e) {
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    if (dir) await fs.rm(dir, { recursive: true, force: true });
    next(e);
  }
});
app.put("/api/projects/:id", async (req, res, next) => {
  try {
    const old = await read(req.params.id);
    const p = validateProject({
      ...old,
      words: req.body.words,
      script: req.body.script ?? old.script,
      style: req.body.style,
    });
    await write(p);
    res.json(p);
  } catch (e) {
    next(e);
  }
});
app.get("/api/jobs/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  res.status(job ? 200 : 404).json(job || { error: "Trabajo no encontrado" });
});
app.post("/api/projects/:id/:action", async (req, res, next) => {
  let release;
  try {
    if (!["transcribe", "export", "align"].includes(req.params.action))
      return res.sendStatus(404);
    release = jobLock.tryAcquire();
    if (!release)
      return res
        .status(409)
        .json({ error: "Hay un trabajo en curso. Espera a que termine." });
    const p = await read(req.params.id);
    if (req.params.action === "export") validateProject(p);
    const id = randomUUID(),
      job = { status: "running", message: "Preparando…", progress: 0 };
    jobs.set(id, job);
    res.json({ id });
    (async () => {
      try {
        const dir = folder(p.id);
        if (
          req.params.action === "transcribe" ||
          req.params.action === "align"
        ) {
          if (req.params.action === "align" && !p.script?.trim())
            throw Error("Pega y guarda el guion original antes de alinearlo.");
          const language = ["es", "en", "pt"].includes(req.body.language)
            ? req.body.language
            : "es";
          job.message = "Extrayendo audio…";
          const audio = path.join(dir, "audio.f32");
          await run([
            "-y",
            "-i",
            path.join(dir, "video.mp4"),
            "-vn",
            "-ar",
            "16000",
            "-ac",
            "1",
            "-f",
            "f32le",
            audio,
          ]);
          const result = await new Promise((resolve, reject) => {
            const worker = new Worker(
              path.join(
                root,
                req.params.action === "align"
                  ? "server/align.mjs"
                  : "server/transcribe.mjs",
              ),
              {
                workerData: {
                  audio,
                  language,
                  script: p.script,
                  cache: path.join(root, ".cache"),
                },
              },
            );
            let settled = false;
            worker.on("message", (m) => {
              if (m.message) job.message = m.message;
              if (m.error) {
                settled = true;
                reject(Error(m.error));
                worker.terminate();
              }
              if (m.result) {
                settled = true;
                resolve(m.result);
                worker.terminate();
              }
            });
            worker.on("error", reject);
            worker.on("exit", (code) => {
              if (!settled) reject(Error(`El transcriptor se cerró (${code})`));
            });
          });
          let previous = 0;
          if (req.params.action === "align") {
            p.words = result.words.map(({ text, start, end, confidence }) => ({
              id: randomUUID(),
              text,
              start,
              end: Math.min(end, p.duration),
              confidence,
            }));
            p.alignment = {
              confidence: result.confidence,
              at: new Date().toISOString(),
            };
            validateProject(p);
            await write(p);
            job.project = p;
            job.message = `Guion alineado con el audio. ${result.confidence < 0.4 ? "Confianza baja: revisa el resultado." : "Revisa los tiempos antes de exportar."}`;
            job.status = "done";
            job.progress = 1;
            return;
          }
          p.words = (result.chunks || []).flatMap((c) => {
            const start = Math.max(previous, c.timestamp[0] ?? previous);
            const end = Math.min(
              p.duration,
              Math.max(start + 0.04, c.timestamp[1] ?? start + 0.3),
            );
            if (end <= start) return [];
            previous = end;
            return [{ id: randomUUID(), text: c.text.trim(), start, end }];
          });
          await fs.writeFile(
            path.join(dir, "transcription.json"),
            JSON.stringify(result, null, 2),
          );
          await write(p);
          job.project = p;
          job.message = p.words.length
            ? "Subtítulos listos"
            : "No se detectó voz. Puedes agregar palabras manualmente.";
        } else {
          job.message = "Preparando motor de exportación…";
          bundled ??= await bundle({
            entryPoint: path.join(root, "src/remotion.tsx"),
          });
          const inputProps = {
            project: p,
            src: `http://127.0.0.1:4310/media/${p.id}/video.mp4`,
          };
          const composition = await selectComposition({
            serveUrl: bundled,
            id: "CaptionVideo",
            inputProps,
          });
          const name = `export-${id}.mp4`;
          await renderMedia({
            serveUrl: bundled,
            composition,
            inputProps,
            codec: "h264",
            outputLocation: path.join(dir, name),
            concurrency: 2,
            onProgress: ({ progress }) => {
              job.progress = progress;
              job.message = `Exportando ${Math.round(progress * 100)}%`;
            },
          });
          job.url = `/media/${p.id}/${name}`;
          job.message = "Exportación lista";
        }
        job.status = "done";
        job.progress = 1;
      } catch (e) {
        job.status = "error";
        job.message = e.message;
        console.error(e);
      } finally {
        release();
        setTimeout(() => jobs.delete(id), 3600000).unref();
      }
    })();
  } catch (e) {
    release?.();
    next(e);
  }
});
app.use(express.static(path.join(root, "dist")));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Error inesperado" });
});
app.listen(4310, "127.0.0.1", () =>
  console.log(
    "AnimaTX: http://127.0.0.1:4310 (desarrollo: http://127.0.0.1:5173)",
  ),
);
