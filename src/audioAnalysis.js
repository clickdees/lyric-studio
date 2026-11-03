export async function analyzeAudioFile(file, onProgress = () => {}) {
  if (!file) throw new Error('Choose an audio file first.');
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) throw new Error('Web Audio API is not available in this browser.');
  const context = new Ctx(); let worker;
  try {
    onProgress({ progress: 2, message: 'Decoding audio locally…' });
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
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
      worker.onmessage = event => {
        const data = event.data || {};
        if (data.type === 'progress') onProgress({ progress: 8 + Math.round(data.progress * 0.92), message: 'Analyzing audio… ' + data.progress + '%' });
        else if (data.type === 'result') resolve(data.analysis);
        else if (data.type === 'error') reject(new Error(data.message || 'Audio analysis failed.'));
      };
      worker.onerror = event => reject(new Error(event.message || 'Audio analysis worker failed.'));
      worker.postMessage({ type: 'analyze', samples: mono, sampleRate, duration: decoded.duration }, [mono.buffer]);
    });
  } finally {
    if (worker) worker.terminate();
    try { await context.close(); } catch (_) {}
  }
}
