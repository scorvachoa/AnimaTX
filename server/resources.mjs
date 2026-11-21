import os from "node:os";
export const resourcePolicy = Object.freeze({
  threads: Math.max(1, Math.min(2, os.availableParallelism())),
  renderConcurrency: 1,
  videoCacheBytes: 128 * 1024 * 1024,
});
export function inferenceSessionOptions() {
  return {
    intraOpNumThreads: resourcePolicy.threads,
    interOpNumThreads: 1,
    executionMode: "sequential",
    extra: {
      session: {
        intra_op: { allow_spinning: "0" },
        inter_op: { allow_spinning: "0" },
      },
    },
  };
}
export function requireFreeMemory(task, freeBytes = os.freemem()) {
  const required =
    (task === "align" || task === "transcribe"
      ? 1280
      : task === "export"
        ? 768
        : 384) *
    1024 *
    1024;
  if (freeBytes < required)
    throw Error(
      `Memoria disponible insuficiente para ${task === "align" ? "sincronizar" : task === "transcribe" ? "transcribir" : task === "export" ? "exportar" : "procesar el video"}: ${(freeBytes / 1073741824).toFixed(1)} GB libres. Libera memoria cerrando otras aplicaciones; se requieren al menos ${(required / 1073741824).toFixed(1)} GB libres.`,
    );
}
export function alignmentMemoryBudget(freeBytes = os.freemem()) {
  return Math.max(
    8 * 1024 * 1024,
    Math.min(
      64 * 1024 * 1024,
      Math.floor((freeBytes - 384 * 1024 * 1024) * 0.2),
    ),
  );
}
export function limitedFfmpegArgs(args) {
  return [
    "-threads",
    String(resourcePolicy.threads),
    "-filter_threads",
    "1",
    "-filter_complex_threads",
    "1",
    ...args.slice(0, -1),
    "-threads",
    String(resourcePolicy.threads),
    args.at(-1),
  ];
}
export function lowerPriority(pid) {
  try {
    os.setPriority(pid, os.constants.priority.PRIORITY_BELOW_NORMAL);
  } catch {}
}
