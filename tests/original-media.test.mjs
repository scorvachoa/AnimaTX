import test from "node:test";
import assert from "node:assert/strict";
import {
  mediaParameters,
  ffmpegParameters,
  originalExportSettings,
  originalAudioMuxArgs,
} from "../server/original-media.mjs";
const metadata = {
  format: { duration: "12", size: "9000000", bit_rate: "6000000" },
  streams: [
    {
      codec_type: "video",
      codec_name: "h264",
      width: 1920,
      height: 1080,
      avg_frame_rate: "60000/1001",
      r_frame_rate: "60000/1001",
      bit_rate: "5800000",
      side_data_list: [{ rotation: -90 }],
    },
    {
      codec_type: "audio",
      codec_name: "aac",
      bit_rate: "128000",
      sample_rate: "48000",
      channels: 2,
    },
  ],
};
test("conserva resolución orientada, fps fraccionales, bitrate y parámetros de audio", () => {
  const m = mediaParameters(metadata),
    s = originalExportSettings(m);
  assert.equal(m.width, 1080);
  assert.equal(m.height, 1920);
  assert.equal(m.fps, 60000 / 1001);
  assert.equal(s.videoBitrate, "5800k");
  assert.equal(s.copyAudio, true);
  assert.equal(s.codec, "h264");
  assert.equal(m.sampleRate, 48000);
  const args = originalAudioMuxArgs(
    "render.mp4",
    "source",
    "out.mp4",
    m,
    s,
    12,
  );
  assert.ok(args.includes("copy"));
  assert.equal(args[args.indexOf("-c:a") + 1], "copy");
  assert.ok(!args.includes("-shortest"));
});
test("compatibilidad de códecs, ausencia de audio y bitrate no disponible", () => {
  const m = mediaParameters({
    ...metadata,
    streams: [{ ...metadata.streams[0], codec_name: "hevc" }],
  });
  assert.equal(originalExportSettings(m).codec, "h265");
  const s = originalExportSettings({
    ...m,
    videoCodec: "av1",
    videoBitrate: null,
  });
  assert.equal(s.codecChanged, true);
  assert.equal(s.crf, 23);
  assert.ok(!originalAudioMuxArgs("r", "s", "o", m, s, 12).includes("-c:a"));
  const audio = {
    ...m,
    hasAudio: true,
    audioCodec: "pcm_s16le",
    audioBitrate: null,
    channels: 2,
    sampleRate: 48000,
  };
  const a = originalAudioMuxArgs(
    "r",
    "s",
    "o",
    audio,
    originalExportSettings(audio),
    12,
  );
  assert.equal(a[a.indexOf("-c:a") + 1], "aac");
  assert.equal(a[a.indexOf("-ar") + 1], "48000");
});
test("metadatos alternativos usan solo cabecera de FFmpeg sin decodificar el archivo entero", () => {
  const m = ffmpegParameters(
    "Input #0, mov, from source:\n Duration: 00:00:42.35, start: 0, bitrate: 8431 kb/s\n Stream #0:0: Video: h264 (High), yuv420p, 1080x1920, 8303 kb/s, 29.97 fps\n Stream #0:1: Audio: aac (LC), 44100 Hz, stereo, 136 kb/s\nOutput #0, null",
    42000000,
  );
  assert.equal(m.fps, 30000 / 1001);
  assert.equal(m.videoBitrate, 8303000);
  assert.equal(m.audioBitrate, 136000);
  assert.equal(m.channels, 2);
  assert.throws(() => mediaParameters({ streams: [] }));
});
