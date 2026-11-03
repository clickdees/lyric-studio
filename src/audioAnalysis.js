export async function analyzeAudioFile(file, onProgress = () => {}, signal) {
  if (!file) throw new Error('Choose an audio file first.');
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) throw new Error('Web Audio API is not available in this browser.');
  const context = new Ctx(); let worker;
  try {
    onProgress({ progress: 2, message: 'Decoding audio locally…' });
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    if (signal && signal.aborted) { const error = new Error('Audio analysis was cancelled.'); error.name = 'AbortError'; throw error; }
    const factor = Math.max(1, Math.ceil(decoded.sampleRate / 11025));
    const sampleRate = decoded.sampleRate / factor;
    const mono = new Float32Array(Math.ceil(decoded.length / factor));
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i));
    for (let i = 0; i < mono.length; i += 1) {
      const from = i * factor, to = Math.min(decoded.length, from + factor);
      let sum = 0, count = 0;
      for (const channel of channels) for (let j = from; j < to; j += 1) { sum += channel[j]; count += 1; }
      mono[i] = count ? sum / count : 0;
    }
    onProgress({ progress: 8, message: 'Measuring acoustic features…' });
    worker = new Worker(new URL('./audioAnalysis.worker.js', import.meta.url), { type: 'module' });
    return await new Promise((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        if (signal) signal.removeEventListener('abort', abort);
        if (worker) { worker.onmessage = null; worker.onerror = null; }
      };
      const finish = (callback, value) => {
        if (settled) return;
        settled = true; cleanup(); callback(value);
      };
      const abort = () => {
        if (worker) worker.terminate();
        const error = new Error('Audio analysis was cancelled.'); error.name = 'AbortError';
        finish(reject, error);
      };
      if (signal && signal.aborted) { abort(); return; }
      if (signal) signal.addEventListener('abort', abort, { once: true });
      worker.onmessage = event => {
        const data = event.data || {};
        if (data.type === 'progress') onProgress({ progress: 8 + Math.round(data.progress * 0.92), message: 'Analyzing audio… ' + data.progress + '%' });
        else if (data.type === 'result') finish(resolve, data.analysis);
        else if (data.type === 'error') finish(reject, new Error(data.message || 'Audio analysis failed.'));
      };
      worker.onerror = event => finish(reject, new Error(event.message || 'Audio analysis worker failed.'));
      worker.postMessage({ type: 'analyze', samples: mono, sampleRate, duration: decoded.duration }, [mono.buffer]);
    });
  } finally {
    if (worker) worker.terminate();
    try { await context.close(); } catch (_) {}
  }
}
