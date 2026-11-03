function fft(real, imag) {
  const n = real.length; let j = 0;
  for (let i = 1; i < n; i += 1) {
    let bit = n >> 1; while (j & bit) { j ^= bit; bit >>= 1; } j ^= bit;
    if (i < j) { let t = real[i]; real[i] = real[j]; real[j] = t; t = imag[i]; imag[i] = imag[j]; imag[j] = t; }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1, angle = -2 * Math.PI / size, sr = Math.cos(angle), si = Math.sin(angle);
    for (let start = 0; start < n; start += size) {
      let wr = 1, wi = 0;
      for (let k = 0; k < half; k += 1) {
        const a = start + k, b = a + half, tr = wr * real[b] - wi * imag[b], ti = wr * imag[b] + wi * real[b];
        real[b] = real[a] - tr; imag[b] = imag[a] - ti; real[a] += tr; imag[a] += ti;
        const nr = wr * sr - wi * si; wi = wr * si + wi * sr; wr = nr;
      }
    }
  }
}
function analyze(samples, sampleRate, duration) {
  const size = 2048, half = size >> 1, hop = Math.max(1, Math.round(sampleRate * 0.1));
  const count = Math.max(1, Math.ceil(samples.length / hop));
  const real = new Float32Array(size), imag = new Float32Array(size), prev = new Float32Array(half), win = new Float32Array(size);
  const frames = []; let rmsTotal = 0, peakRms = 0;
  for (let i = 0; i < size; i += 1) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (size - 1));
  for (let frame = 0; frame < count; frame += 1) {
    const center = frame * hop, start = center - half; let squares = 0, valid = 0;
    real.fill(0); imag.fill(0);
    for (let i = 0; i < size; i += 1) {
      const at = start + i;
      if (at >= 0 && at < samples.length) { const x = samples[at]; real[i] = x * win[i]; squares += x * x; valid += 1; }
    }
    fft(real, imag);
    let total = 0, low = 0, mid = 0, high = 0, weighted = 0, mags = 0, fluxSum = 0;
    for (let bin = 1; bin < half; bin += 1) {
      const re = real[bin], im = imag[bin], mag = Math.sqrt(re * re + im * im) / size;
      const power = mag * mag, hz = bin * sampleRate / size;
      total += power; mags += mag; weighted += mag * hz; fluxSum += Math.max(0, mag - prev[bin]); prev[bin] = mag;
      if (hz < 250) low += power; else if (hz < 2000) mid += power; else high += power;
    }
    const rms = valid ? Math.sqrt(squares / valid) : 0, flux = mags > 1e-9 ? fluxSum / mags : 0;
    rmsTotal += rms; peakRms = Math.max(peakRms, rms);
    frames.push({
      time: Number((center / sampleRate).toFixed(2)), rms: Number(rms.toFixed(4)),
      low: Number((total ? low / total : 0).toFixed(3)), mid: Number((total ? mid / total : 0).toFixed(3)),
      high: Number((total ? high / total : 0).toFixed(3)), centroid: Number((mags ? weighted / mags : 0).toFixed(0)),
      flux: Number(flux.toFixed(3)), onset: false
    });
    if (frame % 100 === 0) self.postMessage({ type: 'progress', progress: Math.min(99, Math.round((frame + 1) / count * 100)) });
  }
  const onsets = [];
  for (let i = 1; i < frames.length - 1; i += 1) {
    const prior = frames.slice(Math.max(0, i - 8), i);
    const avg = prior.length ? prior.reduce((sum, item) => sum + item.flux, 0) / prior.length : 0;
    if (frames[i].flux > Math.max(0.18, avg * 1.45) && frames[i].flux >= frames[i - 1].flux && frames[i].flux > frames[i + 1].flux) {
      frames[i].onset = true; onsets.push(frames[i].time);
    }
  }
  return {
    method: 'browser-web-audio-dsp-v1', sampleRate, frameHopSeconds: Number((hop / sampleRate).toFixed(4)),
    durationSeconds: duration, frames, onsets,
    summary: { frameCount: frames.length, onsetCount: onsets.length, meanRms: Number((rmsTotal / frames.length).toFixed(4)), peakRms: Number(peakRms.toFixed(4)) }
  };
}
self.onmessage = event => {
  const d = event.data || {}; if (d.type !== 'analyze') return;
  try {
    const samples = d.samples instanceof Float32Array ? d.samples : new Float32Array(d.samples);
    self.postMessage({ type: 'result', analysis: analyze(samples, Number(d.sampleRate), Number(d.duration)) });
  } catch (error) { self.postMessage({ type: 'error', message: error && error.message ? error.message : 'Unknown analysis error' }); }
};
