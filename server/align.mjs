import { parentPort, workerData } from "node:worker_threads";
import fs from "node:fs/promises";
import { AutoProcessor, AutoModelForCTC, env } from "@huggingface/transformers";
import { alignCTC, scriptTokens } from "./ctc-align.mjs";
try {
  scriptTokens(workerData.script);
  env.cacheDir = workerData.cache;
  const id = "onnx-community/mms-300m-1130-forced-aligner-ONNX";
  let lastProgress = "";
  const progress_callback = (p) => {
    const status = p.file + ":" + Math.round(p.progress ?? 0);
    if (p.status === "progress" && status !== lastProgress) {
      lastProgress = status;
      parentPort.postMessage({
        message: `Modelo de alineación: ${p.file} (${Math.round(p.progress)}%)`,
      });
    }
  };
  const processor = await AutoProcessor.from_pretrained(id, {
    progress_callback,
  });
  const model = await AutoModelForCTC.from_pretrained(id, {
    dtype: "q8",
    device: "cpu",
    progress_callback,
  });
  const bytes = await fs.readFile(workerData.audio),
    audio = new Float32Array(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    );
  const chunks = [],
    step = 10 * 16000;
  let totalFrames = 0;
  for (let start = 0; start < audio.length; start += step) {
    const from = Math.max(0, start - 16000),
      to = Math.min(audio.length, start + step + 16000);
    parentPort.postMessage({
      message: `Analizando audio para alinear: ${Math.round((start / audio.length) * 100)}%`,
    });
    const input = await processor(audio.subarray(from, to));
    const { logits } = await model(input);
    const frames = Number(logits.dims[1]),
      classes = Number(logits.dims[2]),
      first = Math.round(((start - from) / (to - from)) * frames),
      last = Math.round(
        ((Math.min(audio.length, start + step) - from) / (to - from)) * frames,
      );
    const data = Float32Array.from(
      logits.data.slice(first * classes, last * classes),
    );
    chunks.push({ data, classes, frames: last - first });
    totalFrames += last - first;
    logits.dispose?.();
  }
  const classes = chunks[0].classes,
    joined = new Float32Array(totalFrames * classes);
  let offset = 0;
  for (const c of chunks) {
    joined.set(c.data, offset);
    offset += c.data.length;
  }
  parentPort.postMessage({
    message: "Calculando alineación acústica del guion…",
  });
  const result = alignCTC(
    joined,
    totalFrames,
    classes,
    workerData.script,
    audio.length / 16000,
  );
  await model.dispose();
  parentPort.postMessage({ result });
} catch (e) {
  parentPort.postMessage({ error: e.message });
}
