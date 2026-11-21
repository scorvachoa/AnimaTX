import test from "node:test";
import assert from "node:assert/strict";
import { createJobLock } from "../server/job-lock.mjs";
import {
  resourcePolicy,
  inferenceSessionOptions,
  requireFreeMemory,
  alignmentMemoryBudget,
  limitedFfmpegArgs,
} from "../server/resources.mjs";
test("los trabajos pesados usan una única cola FIFO y liberan una sola vez", async () => {
  const queue = createJobLock(),
    first = await queue.acquire(),
    events = [];
  const second = queue.acquire().then((release) => {
    events.push("second");
    return release;
  });
  const third = queue.acquire().then((release) => {
    events.push("third");
    return release;
  });
  assert.deepEqual(queue.state(), { busy: true, queued: 2 });
  assert.equal(queue.tryAcquire(), null);
  first();
  first();
  const releaseSecond = await second;
  assert.deepEqual(events, ["second"]);
  assert.equal(queue.tryAcquire(), null);
  releaseSecond();
  const releaseThird = await third;
  assert.deepEqual(events, ["second", "third"]);
  releaseThird();
  assert.deepEqual(queue.state(), { busy: false, queued: 0 });
});
test("cancelar un trabajo en espera no interrumpe el actual ni bloquea la cola", async () => {
  const queue = createJobLock(),
    release = await queue.acquire(),
    controller = new AbortController();
  const cancelled = queue.acquire(controller.signal);
  controller.abort();
  await assert.rejects(cancelled, /cancelada/);
  assert.deepEqual(queue.state(), { busy: true, queued: 0 });
  release();
  const next = await queue.acquire();
  next();
  await assert.rejects(queue.acquire(controller.signal), /cancelada/);
});
test("IA y FFmpeg limitan hilos, filtros y memoria antes de iniciar", () => {
  const opts = inferenceSessionOptions();
  assert.ok(opts.intraOpNumThreads <= 2);
  assert.equal(opts.interOpNumThreads, 1);
  assert.equal(opts.executionMode, "sequential");
  assert.equal(opts.extra.session.intra_op.allow_spinning, "0");
  assert.equal(resourcePolicy.renderConcurrency, 1);
  assert.throws(() => requireFreeMemory("align", 500 * 1024 * 1024), /Memoria/);
  assert.doesNotThrow(() => requireFreeMemory("transcribe", 2 * 1073741824));
  assert.ok(alignmentMemoryBudget(8 * 1073741824) <= 64 * 1024 * 1024);
  const args = limitedFfmpegArgs([
    "-i",
    "input.mp4",
    "-c:v",
    "libx264",
    "out.mp4",
  ]);
  assert.equal(args.at(-1), "out.mp4");
  assert.equal(args[args.indexOf("-filter_threads") + 1], "1");
  assert.equal(args.at(-2), String(resourcePolicy.threads));
});
