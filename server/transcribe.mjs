import { parentPort, workerData } from "node:worker_threads";
import fs from "node:fs/promises";
import { pipeline, env } from "@huggingface/transformers";
try {
  env.cacheDir = workerData.cache;
  const transcriber = await pipeline(
    "automatic-speech-recognition",
    "onnx-community/whisper-base_timestamped",
    {
      dtype: "q8",
      device: "cpu",
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
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  const result = await transcriber(audio, {
    language: workerData.language,
    task: "transcribe",
    return_timestamps: "word",
    chunk_length_s: 30,
    stride_length_s: 5,
  });
  parentPort.postMessage({ result });
} catch (e) {
  parentPort.postMessage({ error: e.message });
}
