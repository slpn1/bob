// OpenAI's /v1/audio/transcriptions endpoint hard-limits uploads to 25MB.
// We stay a bit under to leave room for multipart overhead.
const MAX_TRANSCRIPTION_BYTES = 24 * 1024 * 1024;
const TRANSCRIPTION_MODEL = 'whisper-1';
const TRANSCRIPTION_ENDPOINT = '/api/transcribe';

// ffmpeg.wasm core is loaded from a CDN at runtime; dynamic-imported so the
// main bundle isn't penalized when no video is ever attached.


async function _transcribeAudioBlob(audio: Blob, fileName: string): Promise<string> {
  if (audio.size > MAX_TRANSCRIPTION_BYTES) {
    const mb = (audio.size / 1024 / 1024).toFixed(1);
    throw new Error(`Audio payload is ${mb}MB, above OpenAI's 25MB transcription limit. Trim or re-encode the source file and try again.`);
  }

  const form = new FormData();
  form.append('file', audio, fileName);
  form.append('model', TRANSCRIPTION_MODEL);
  form.append('response_format', 'text');

  const resp = await fetch(TRANSCRIPTION_ENDPOINT, { method: 'POST', body: form });
  if (!resp.ok) {
    const body = await resp.text().catch(() => resp.statusText);
    throw new Error(`Transcription failed (${resp.status}): ${body}`);
  }
  return (await resp.text()).trim();
}


/**
 * Transcribe an audio file (mp3, wav, m4a, etc.) via OpenAI Whisper.
 */
export async function convertAudioToText(audio: Blob, fileName: string): Promise<{ text: string }> {
  const transcript = await _transcribeAudioBlob(audio, fileName);
  if (!transcript)
    return { text: `## ${fileName}\n\n[No speech detected in audio]` };
  return { text: `## Transcript: ${fileName}\n\n${transcript}` };
}


/**
 * Transcribe the audio track of a video file. The video is routed through
 * ffmpeg.wasm to extract a compact mono mp3 (16kHz, 32kbps) that fits the
 * Whisper 25MB cap for roughly up to ~100 minutes of speech.
 */
export async function convertVideoToText(video: Blob, fileName: string): Promise<{ text: string }> {
  const audio = await _extractAudioFromVideo(video);
  const audioName = fileName.replace(/\.[^.]+$/, '') + '.mp3';
  const transcript = await _transcribeAudioBlob(audio, audioName);
  if (!transcript)
    return { text: `## ${fileName}\n\n[No speech detected in video]` };
  return { text: `## Transcript: ${fileName}\n\n${transcript}` };
}


// ffmpeg.wasm is loaded at runtime via native browser ESM (esm.sh rewrites
// bare imports so the browser can resolve them). The `webpackIgnore` magic
// comment tells webpack to leave these imports alone — otherwise webpack
// errors on @ffmpeg/ffmpeg's `new Worker(new URL(..., import.meta.url))`.
interface FFmpegInstance {
  load: (opts: { coreURL: string; wasmURL: string; classWorkerURL?: string }) => Promise<void>;
  writeFile: (name: string, data: Uint8Array) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array | string>;
  exec: (args: string[]) => Promise<number>;
  on: (event: 'progress' | 'log', cb: (e: any) => void) => void;
}

async function _extractAudioFromVideo(video: Blob): Promise<Blob> {
  // All ffmpeg assets are loaded through a Next.js rewrite proxy at /api/ffmpeg-cdn/*
  // so they're same-origin. This is needed because:
  //   1. Workers can only be constructed from same-origin URLs
  //   2. The worker's relative imports need to resolve back to a real URL
  //      (blob URLs break relative import resolution)
  const ffmpegMod = await import(/* webpackIgnore: true */ '/api/ffmpeg-cdn/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js') as {
    FFmpeg: new () => FFmpegInstance;
  };
  const utilMod = await import(/* webpackIgnore: true */ '/api/ffmpeg-cdn/@ffmpeg/util@0.12.2/dist/esm/index.js') as {
    toBlobURL: (url: string, mime: string) => Promise<string>;
    fetchFile: (input: Blob | string) => Promise<Uint8Array>;
  };

  const ffmpeg = new ffmpegMod.FFmpeg();
  const t0 = performance.now();
  ffmpeg.on('log', ({ message }: { message: string }) => console.log('[ffmpeg]', message));
  ffmpeg.on('progress', ({ progress, time }: { progress: number; time: number }) =>
    console.log(`[ffmpeg] progress ${(progress * 100).toFixed(1)}% (media time ${(time / 1e6).toFixed(1)}s)`));
  console.log(`[ffmpeg] loading core... (crossOriginIsolated=${self.crossOriginIsolated}, SAB=${typeof SharedArrayBuffer !== 'undefined'})`);
  await ffmpeg.load({
    coreURL: '/api/ffmpeg-cdn/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
    wasmURL: '/api/ffmpeg-cdn/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm',
    classWorkerURL: '/api/ffmpeg-cdn/@ffmpeg/ffmpeg@0.12.15/dist/esm/worker.js',
  });

  const inputName = 'in.bin';
  const outputName = 'out.mp3';
  await ffmpeg.writeFile(inputName, await utilMod.fetchFile(video));
  // -vn: drop video; -ac 1: mono; -ar 16000: 16kHz (Whisper resamples to this anyway);
  // -b:a 32k: ~32kbps mp3 — plenty for speech, ~14MB/hour.
  console.log(`[ffmpeg] starting audio extraction of ${(video.size / 1024 / 1024).toFixed(1)}MB video...`);
  await ffmpeg.exec(['-i', inputName, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '32k', '-f', 'mp3', outputName]);
  const data = await ffmpeg.readFile(outputName);
  console.log(`[ffmpeg] extraction complete in ${((performance.now() - t0) / 1000).toFixed(1)}s`);

  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return new Blob([bytes], { type: 'audio/mpeg' });
}
