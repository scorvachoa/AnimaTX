import assert from "node:assert/strict";
import * as ort from "onnxruntime-node";
import { inferenceSessionOptions } from "../server/resources.mjs";
const bytes = (...parts) =>
  Buffer.concat(
    parts.map((part) => (Buffer.isBuffer(part) ? part : Buffer.from(part))),
  );
const v = (value) => {
  const out = [];
  do {
    const b = value & 127;
    value >>>= 7;
    out.push(b | (value ? 128 : 0));
  } while (value);
  return Buffer.from(out);
};
const num = (field, value) => bytes(v(field * 8), v(value));
const msg = (field, value) => bytes(v(field * 8 + 2), v(value.length), value);
const str = (field, value) => msg(field, Buffer.from(value));
const type = msg(1, bytes(num(1, 1), msg(2, msg(1, num(1, 1)))));
const info = (name) => bytes(str(1, name), msg(2, type));
const node = bytes(str(1, "x"), str(2, "y"), str(4, "Identity"));
const graph = bytes(
  msg(1, node),
  str(2, "resource-test"),
  msg(11, info("x")),
  msg(12, info("y")),
);
const model = bytes(num(1, 8), msg(7, graph), msg(8, num(2, 13)));
const session = await ort.InferenceSession.create(
  model,
  inferenceSessionOptions(),
);
try {
  const result = await session.run({
    x: new ort.Tensor("float32", Float32Array.of(42), [1]),
  });
  assert.equal(result.y.data[0], 42);
  console.log("ONNX: opciones de dos hilos aceptadas e inferencia correcta.");
} finally {
  await session.release();
}
