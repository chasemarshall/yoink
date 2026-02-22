import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execFileAsync = promisify(execFile);

export interface AudioQualityInfo {
  codec: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
  duration: number;
  bitDepth?: number;
  isUpscaled: boolean;
  upscaleReason?: string;
}

/**
 * Analyze audio buffer with ffprobe and return quality metadata.
 * Returns null on any failure (ffprobe not installed, bad audio, etc).
 */
export async function analyzeAudio(
  buffer: Buffer,
  format: string
): Promise<AudioQualityInfo | null> {
  const tempPath = join(tmpdir(), `probe-${Date.now()}-${Math.random().toString(36).slice(2)}.${format}`);

  try {
    await writeFile(tempPath, buffer);

    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        "-show_format",
        tempPath,
      ],
      { timeout: 10000 }
    );

    const data = JSON.parse(stdout);
    const audioStream = data.streams?.find(
      (s: Record<string, unknown>) => s.codec_type === "audio"
    );
    if (!audioStream) return null;

    const codec = audioStream.codec_name || "unknown";
    const bitrate = parseInt(audioStream.bit_rate || data.format?.bit_rate || "0", 10);
    const sampleRate = parseInt(audioStream.sample_rate || "0", 10);
    const channels = audioStream.channels || 0;
    const duration = parseFloat(audioStream.duration || data.format?.duration || "0");
    const bitDepth = audioStream.bits_per_raw_sample
      ? parseInt(audioStream.bits_per_raw_sample, 10)
      : undefined;

    // Upscale detection: FLAC with suspiciously low bitrate
    let isUpscaled = false;
    let upscaleReason: string | undefined;

    if (codec === "flac" && bitrate > 0 && sampleRate >= 44100 && channels >= 2) {
      // Genuine 44.1kHz stereo 16-bit FLAC is typically 700-1100 kbps
      const bitrateKbps = bitrate / 1000;
      if (bitrateKbps < 700) {
        isUpscaled = true;
        upscaleReason = `FLAC bitrate ${Math.round(bitrateKbps)}kbps is below expected minimum (~700kbps for 44.1kHz stereo)`;
      }
    }

    return {
      codec,
      bitrate,
      sampleRate,
      channels,
      duration,
      bitDepth,
      isUpscaled,
      upscaleReason,
    };
  } catch {
    return null;
  } finally {
    try {
      await unlink(tempPath);
    } catch {
      // best effort cleanup
    }
  }
}
