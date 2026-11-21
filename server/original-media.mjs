import fs from "node:fs/promises";
import ffmpeg from "ffmpeg-static";
import { spawn } from "node:child_process";
import { RenderInternals } from "@remotion/renderer";
export function mediaParameters(info) {
  const video = info.streams?.find(
    (s) => s.codec_type === "video" && !s.disposition?.attached_pic,
  );
  if (!video) throw Error("El archivo no contiene video.");
  const audio = info.streams.find((s) => s.codec_type === "audio");
  const rate = (value) => {
    const [n, d = 1] = String(value ?? "0")
      .split("/")
      .map(Number);
    return d ? n / d : 0;
  };
  const fps = rate(video.avg_frame_rate) || rate(video.r_frame_rate);
  const rotation = Number(
    video.side_data_list?.find((s) => s.rotation !== undefined)?.rotation ??
      video.tags?.rotate ??
      0,
  );
  const rotated = Math.abs(rotation) % 180 === 90;
  const width = rotated ? video.height : video.width,
    height = rotated ? video.width : video.height;
  const duration = Number(info.format?.duration ?? video.duration);
  if (
    ![width, height, duration, fps].every(Number.isFinite) ||
    width < 2 ||
    height < 2 ||
    duration <= 0 ||
    fps <= 0 ||
    fps > 240
  )
    throw Error(
      "No se pudieron leer los parámetros del video (hasta 240 FPS).",
    );
  const audioBitrate = Number(audio?.bit_rate) || 0;
  const totalBitrate =
    Number(info.format?.bit_rate) || (Number(info.format?.size) * 8) / duration;
  const videoBitrate =
    Number(video.bit_rate) || Math.max(0, totalBitrate - audioBitrate);
  return {
    width,
    height,
    duration,
    fps,
    videoCodec: video.codec_name,
    videoBitrate: Math.round(videoBitrate) || null,
    hasAudio: !!audio,
    audioCodec: audio?.codec_name ?? null,
    audioBitrate: audioBitrate || null,
    sampleRate: Number(audio?.sample_rate) || null,
    channels: Number(audio?.channels) || null,
    sizeBytes: Number(info.format?.size) || null,
    rotation,
    variableFrameRate: Math.abs(rate(video.r_frame_rate) - fps) > 0.1,
  };
}
async function probeNative(file) {
  const executable = RenderInternals.getExecutablePath({
    type: "ffprobe",
    binariesDirectory: null,
    indent: false,
    logLevel: "error",
  });
  return new Promise((resolve, reject) => {
    const child = spawn(
      executable,
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
      { windowsHide: true },
    );
    let output = "",
      error = "";
    child.stdout.on("data", (data) => (output += data));
    child.stderr.on("data", (data) => (error = (error + data).slice(-2000)));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0)
        return reject(Error(error || "No se pudo leer el video."));
      try {
        resolve(mediaParameters(JSON.parse(output)));
      } catch (e) {
        reject(e);
      }
    });
  });
}
let nativeProbeUsable = true;
export function ffmpegParameters(output, sizeBytes) {
  const input = output.split(/Output #/)[0];
  const durationMatch = input.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const videoLine = input
    .split("\n")
    .find((line) => /Stream .*Video:/.test(line) && !/attached pic/.test(line));
  const audioLine = input
    .split("\n")
    .find((line) => /Stream .*Audio:/.test(line));
  const dims = videoLine?.match(/ (\d{2,5})x(\d{2,5})/),
    fpsMatch = videoLine?.match(/([\d.]+) fps/);
  if (!durationMatch || !dims || !fpsMatch)
    throw Error("No se pudieron leer los parámetros del video.");
  let fps = +fpsMatch[1];
  for (const rate of [24000 / 1001, 30000 / 1001, 60000 / 1001, 120000 / 1001])
    if (Math.abs(fps - rate) < 0.006) fps = rate;
  const rotation = Number(
    input.match(/rotation of ([\d.-]+) degrees/)?.[1] ?? 0,
  );
  const duration =
    +durationMatch[1] * 3600 + +durationMatch[2] * 60 + +durationMatch[3];
  const bitrate = (line) =>
    Number(line?.match(/([\d.]+) kb\/s/)?.[1] ?? 0) * 1000;
  return mediaParameters({
    format: {
      duration,
      size: sizeBytes,
      bit_rate: bitrate(input.match(/Duration:.*$/m)?.[0]),
    },
    streams: [
      {
        codec_type: "video",
        codec_name: videoLine.match(/Video: ([^ ,]+)/)?.[1],
        width: +dims[1],
        height: +dims[2],
        avg_frame_rate: String(fps),
        r_frame_rate: String(fps),
        bit_rate: bitrate(videoLine),
        side_data_list: [{ rotation }],
      },
      ...(audioLine
        ? [
            {
              codec_type: "audio",
              codec_name: audioLine.match(/Audio: ([^ ,]+)/)?.[1],
              bit_rate: bitrate(audioLine),
              sample_rate: audioLine.match(/(\d+) Hz/)?.[1],
              channels: /stereo/.test(audioLine)
                ? 2
                : /mono/.test(audioLine)
                  ? 1
                  : null,
            },
          ]
        : []),
    ],
  });
}
export async function probeMedia(file) {
  if (nativeProbeUsable) {
    try {
      return await probeNative(file);
    } catch {
      nativeProbeUsable = false;
    }
  }
  const sizeBytes = (await fs.stat(file)).size;
  return new Promise((resolve, reject) => {
    const child = spawn(
      ffmpeg,
      [
        "-hide_banner",
        "-threads",
        "1",
        "-i",
        file,
        "-map",
        "0:v:0",
        "-frames:v",
        "0",
        "-an",
        "-f",
        "null",
        "-",
      ],
      { windowsHide: true },
    );
    let output = "";
    child.stderr.on("data", (data) => (output = (output + data).slice(-30000)));
    child.on("error", reject);
    child.on("close", () => {
      try {
        resolve(ffmpegParameters(output, sizeBytes));
      } catch (error) {
        reject(error);
      }
    });
  });
}
export function originalExportSettings(media) {
  const codec = ["hevc", "h265"].includes(media.videoCodec) ? "h265" : "h264";
  return {
    codec,
    width: Math.ceil(media.width / 2) * 2,
    height: Math.ceil(media.height / 2) * 2,
    fps: media.fps,
    ...(media.videoBitrate > 0
      ? {
          videoBitrate: `${Math.max(1, Math.round(media.videoBitrate / 1000))}k`,
        }
      : { crf: 23 }),
    copyAudio: media.hasAudio && ["aac", "mp3"].includes(media.audioCodec),
    audioBitrate: String(media.audioBitrate || 128000),
    codecChanged: codec === "h264" && media.videoCodec !== "h264",
  };
}
export function originalAudioMuxArgs(
  rendered,
  source,
  output,
  media,
  settings,
  duration,
) {
  const args = ["-y", "-threads", "2", "-i", rendered];
  if (media.hasAudio) args.push("-threads", "2", "-i", source);
  args.push("-map", "0:v:0", "-c:v", "copy");
  if (media.hasAudio) {
    args.push("-map", "1:a:0", "-c:a", settings.copyAudio ? "copy" : "aac");
    if (!settings.copyAudio) {
      args.push("-b:a", settings.audioBitrate);
      if (media.sampleRate) args.push("-ar", String(media.sampleRate));
      if (media.channels) args.push("-ac", String(media.channels));
    }
  }
  args.push("-t", String(duration), "-movflags", "+faststart");
  if (settings.codec === "h265") args.push("-tag:v", "hvc1");
  return [...args, output];
}
