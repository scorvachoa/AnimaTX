import { inferenceSessionOptions, requireFreeMemory } from "./resources.mjs";
import { parentPort, workerData } from "node:worker_threads";
import fs from "node:fs/promises";
import { pipeline, env } from "@huggingface/transformers";
let transcriber;
try {
  requireFreeMemory("transcribe");
  env.cacheDir = workerData.cache;
  transcriber = await pipeline(
    "automatic-speech-recognition",
    "onnx-community/whisper-base_timestamped",
    {
      dtype: "q8",
      device: "cpu",
      session_options: inferenceSessionOptions(),
      progress_callback: (p) => {
        if (p.status === "progress")
          parentPort.postMessage({
            message: `Descargando modelo: ${p.file} (${Math.round(p.progress)}%)`,
          });
      },
    },
  );
  parentPort.postMessage({ message: "Transcribiendo audio en tu CPU…" });
  const bytes = await fs.readFile(workerData.audio);
  const audio = new Float32Array(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength / 4,
  );
  const result = await transcriber(audio, {
    language: workerData.language,
    task: "transcribe",
    return_timestamps: "word",
    chunk_length_s: 30,
    stride_length_s: 5,
  });
  await transcriber.dispose();
  transcriber = null;
  parentPort.postMessage({ result });
} catch (e) {
  parentPort.postMessage({ error: e.message });
} finally {
  await transcriber?.dispose().catch(() => {});
}
