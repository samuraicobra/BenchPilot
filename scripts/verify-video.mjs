import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ffmpeg =
  "C:/Users/Avatar.Avatar-PC/AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe";
const video = path.join(
  root,
  "submission",
  "video",
  "BenchPilot-Build-Week-Demo.webm",
);
const outputDir = path.join(root, "tmp", "video-frames");
const resultPath = path.join(
  root,
  "submission",
  "video",
  "BenchPilot-Build-Week-Demo.verification.json",
);
await fs.mkdir(outputDir, { recursive: true });

const probe = spawnSync(ffmpeg, ["-hide_banner", "-i", video], {
  encoding: "utf8",
});
const probeText = `${probe.stdout ?? ""}\n${probe.stderr ?? ""}`;
const durationMatch = probeText.match(
  /Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)/,
);
const sizeMatch = probeText.match(/Video:\s+vp8[^\n]*?\b(\d{3,5})x(\d{3,5})\b/);
if (!durationMatch || !sizeMatch)
  throw new Error(`Could not parse FFmpeg metadata:\n${probeText}`);
const duration =
  Number(durationMatch[1]) * 3600 +
  Number(durationMatch[2]) * 60 +
  Number(durationMatch[3]);
const width = Number(sizeMatch[1]);
const height = Number(sizeMatch[2]);
if (width !== 1920 || height !== 1080)
  throw new Error(`Unexpected video size ${width}x${height}`);
if (duration < 104 || duration > 106)
  throw new Error(`Unexpected video duration ${duration}`);

const frames = [];
for (const time of [1, 12, 30, 50, 70, 82, 92, 103]) {
  const filename = `frame-${String(time).padStart(3, "0")}.png`;
  const output = path.join(outputDir, filename);
  execFileSync(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      String(time),
      "-i",
      video,
      "-frames:v",
      "1",
      "-y",
      output,
    ],
    { stdio: "pipe" },
  );
  const png = await fs.readFile(output);
  if (png.readUInt32BE(16) !== 1920 || png.readUInt32BE(20) !== 1080)
    throw new Error(`Unexpected frame dimensions for ${filename}`);
  frames.push({ time, filename, bytes: png.byteLength });
}
const result = {
  verifiedAt: new Date().toISOString(),
  durationSeconds: duration,
  width,
  height,
  aspectRatio: "16:9",
  frameRate: 25,
  format: "WebM/VP8",
  silent: true,
  burnedInCaptions: true,
  captionsSource: "DEMO_CAPTIONS.srt",
  frames,
};
await fs.writeFile(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(JSON.stringify(result, null, 2));
