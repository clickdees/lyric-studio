export const CHATGPT_PROMPT = [
  'You are reviewing an existing karaoke lyric timing map. Do not transcribe the song and do not invent or rewrite lyrics.',
  'Use the attached lyric-studio.timing-review JSON as the only audio evidence. The original audio is intentionally not included.',
  'Review all lyric lines together, using manual start/end times, order, text, estimated syllables, neighboring lines, nearby acoustic frames, whole-song features and candidate onsets.',
  'RMS and spectral onsets are whole-mix measurements. Drums and instruments can create peaks. Do not treat every onset or loudness peak as a sung syllable.',
  'Suggest conservative corrections to boundaries that appear early or late. Preserve sequence and musical phrasing. Prefer small changes; do not move either boundary by more than 3 seconds.',
  'Use original-audio source seconds, not cropped-timeline seconds. Return every line, including unchanged lines. If evidence is weak, return status needs-review and null suggestedStart/suggestedEnd.',
  'Return ONLY valid JSON with schema lyric-studio.timing-corrections, schemaVersion 1, and corrections containing lineId, originalStart, originalEnd, suggestedStart, suggestedEnd, confidence (0 to 1), status (suggested or needs-review), and reason.'
].join(' ');

const PACKAGE_SCHEMA = 'lyric-studio.timing-review';
const RESPONSE_SCHEMA = 'lyric-studio.timing-corrections';
const round = n => Number(Number(n).toFixed(3));
const syllables = text => {
  const words = String(text || '').toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g) || [];
  return words.reduce((sum, word) => {
    const groups = word.replace(/(?:e$)/, '').match(/[aeiouy]+/g);
    return sum + Math.max(1, groups ? groups.length : 1);
  }, 0);
};
export function buildTimingReviewPackage({ audioName, duration, analysis, lines, timelineClips, projectIn, projectOut }) {
  if (!analysis || !Array.isArray(analysis.frames)) throw new Error('Analyze the audio before exporting the review package.');
  return {
    schema: PACKAGE_SCHEMA, schemaVersion: 1,
    purpose: 'Refine existing manually marked lyric line start and end times. This is not a transcription task.',
    audio: { fileName: audioName || 'audio', durationSeconds: round(duration), analysisSampleRateHz: analysis.sampleRate, featureFrameHopSeconds: analysis.frameHopSeconds, originalAudioIncluded: false },
    project: {
      timebase: 'original-audio-source-seconds', projectInSeconds: round(projectIn || 0), projectOutSeconds: round(projectOut || duration),
      keptSourceRanges: (timelineClips || []).map(clip => ({ start: round(clip.start), end: round(clip.end) }))
    },
    constraints: {
      maxAdjustmentSecondsPerBoundary: 3, minimumLineDurationSeconds: 0.08, preserveLineIdsAndText: true,
      preserveSequence: true, doNotInventOrRewriteLyrics: true, doNotSnapEveryBoundaryToAnOnset: true,
      preferSmallCorrectionsUnlessEvidenceSupportsLargerChanges: true
    },
    analysis: {
      method: analysis.method, summary: analysis.summary,
      featureDefinitions: {
        time: 'Seconds from the start of the original uploaded audio.',
        rms: 'Root-mean-square signal level; loudness proxy, not vocal activity.',
        low: 'Share of spectral power below 250 Hz.', mid: 'Share from 250 Hz to 2 kHz.',
        high: 'Share from 2 kHz to the Nyquist limit.', centroid: 'Spectral centroid in Hz.',
        flux: 'Positive spectral change relative to the previous frame.',
        onset: 'Candidate transient from spectral flux; may be drums or instruments, not necessarily a sung syllable.'
      },
      limitation: 'Whole-mix acoustic measurements, not isolated vocals or speech recognition. Instruments and drums can create peaks. Consider lyric text, syllable count, manual timestamps, neighboring lines and musical context; mark uncertain lines for human review.',
      frames: analysis.frames, onsetTimesSeconds: analysis.onsets
    },
    lines: (lines || []).map((line, index, all) => ({
      id: line.id, order: index + 1, text: line.text, estimatedSyllables: syllables(line.text),
      manualStartSeconds: round(line.start || 0), manualEndSeconds: round(line.end || 0),
      manualDurationSeconds: round(Math.max(0, (line.end || 0) - (line.start || 0))),
      neighboringLineIds: { previous: all[index - 1]?.id || null, next: all[index + 1]?.id || null },
      contextWindowSeconds: { from: round(Math.max(0, (line.start || 0) - 5)), to: round(Math.min(duration, (line.end || 0) + 5)) }
    })),
    responseFormat: {
      schema: RESPONSE_SCHEMA, schemaVersion: 1,
      corrections: [{
        lineId: 'copy an exact line id from this package', originalStart: 0, originalEnd: 0,
        suggestedStart: 0, suggestedEnd: 0, confidence: 0, status: 'suggested', reason: 'Brief evidence-based explanation'
      }],
      statusRules: 'Use status suggested with numeric suggestedStart/suggestedEnd, or needs-review with null suggested times where evidence is weak. Return original-audio seconds. Include every line, including unchanged lines.'
    }
  };
}
function parseInput(input) {
  const fence = String.fromCharCode(96).repeat(3);
  let clean = String(input || '').trim();
  if (clean.startsWith(fence)) {
    const newline = clean.indexOf('\n');
    clean = newline >= 0 ? clean.slice(newline + 1) : clean.slice(3);
    if (clean.endsWith(fence)) clean = clean.slice(0, -3).trim();
  }
  return JSON.parse(clean);
}
export function validateTimingCorrections(input, lines, duration, maxAdjustment = 3) {
  let data;
  try { data = typeof input === 'string' ? parseInput(input) : input; }
  catch (_) { return { ok: false, error: 'That is not valid JSON. Paste the complete corrections object.' }; }
  if (!data || data.schema !== RESPONSE_SCHEMA || data.schemaVersion !== 1 || !Array.isArray(data.corrections)) {
    return { ok: false, error: 'Use schema "lyric-studio.timing-corrections" with schemaVersion 1.' };
  }
  const byId = new Map((lines || []).map(line => [String(line.id), line]));
  const seen = new Set(), accepted = [], needsReview = [];
  for (const item of data.corrections) {
    const id = String(item && item.lineId || '');
    if (!id || !byId.has(id)) return { ok: false, error: 'Unknown or missing lineId: ' + (id || '(empty)') + '.' };
    if (seen.has(id)) return { ok: false, error: 'Duplicate correction for line ' + id + '.' };
    seen.add(id);
    const line = byId.get(id);
    if (!Number.isFinite(Number(item.originalStart)) || !Number.isFinite(Number(item.originalEnd)) ||
        Math.abs(Number(item.originalStart) - Number(line.start || 0)) > 0.05 ||
        Math.abs(Number(item.originalEnd) - Number(line.end || 0)) > 0.05) {
      return { ok: false, error: 'Original timestamps for "' + line.text + '" do not match this project. Export a fresh package.' };
    }
    if (item.status === 'needs-review' || item.suggestedStart == null || item.suggestedEnd == null) {
      needsReview.push({ lineId: id, text: line.text, reason: String(item.reason || 'Needs manual review.') }); continue;
    }
    if (item.status && item.status !== 'suggested') return { ok: false, error: 'Unsupported correction status for line ' + id + '.' };
    const start = Number(item.suggestedStart), end = Number(item.suggestedEnd);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return { ok: false, error: 'A suggested time is not numeric.' };
    if (Math.abs(start - Number(line.start || 0)) > maxAdjustment || Math.abs(end - Number(line.end || 0)) > maxAdjustment) {
      return { ok: false, error: 'A suggested boundary moves more than ' + maxAdjustment + ' seconds.' };
    }
    if (start < 0 || end > duration + 0.02 || end - start < 0.08) return { ok: false, error: 'A suggested line is outside the audio duration or shorter than 0.08 seconds.' };
    const confidence = Number(item.confidence);
    accepted.push({
      lineId: id, text: line.text, originalStart: Number(line.start || 0), originalEnd: Number(line.end || 0),
      start, end, confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.5,
      reason: String(item.reason || 'No explanation provided.')
    });
  }
  if (!accepted.length && !needsReview.length) return { ok: false, error: 'No usable line corrections were found.' };
  const proposed = new Map(accepted.map(item => [item.lineId, item])); let previousStart = -Infinity;
  for (let i = 0; i < (lines || []).length; i += 1) {
    const line = lines[i];
    const item = proposed.get(String(line.id)), start = item ? item.start : Number(line.start || 0);
    if (start < previousStart - 0.001) return { ok: false, error: 'Suggested timings change the chronological lyric order.' };
    previousStart = start;
    if (i < lines.length - 1) {
      const nextLine = lines[i + 1], nextItem = proposed.get(String(nextLine.id));
      const end = item ? item.end : Number(line.end || 0);
      const nextStart = nextItem ? nextItem.start : Number(nextLine.start || 0);
      if (end > nextStart + 0.02) return { ok: false, error: 'The suggested line timings overlap the next lyric line. Review the boundaries before importing.' };
    }
  }
  return { ok: true, corrections: accepted, needsReview };
}
export function validateSelectedCorrectionSequence(lines, selected) {
  const byId = new Map((selected || []).map(item => [String(item.lineId), item])); let previous = -Infinity;
  for (let i = 0; i < (lines || []).length; i += 1) {
    const line = lines[i], item = byId.get(String(line.id));
    const start = item ? item.start : Number(line.start || 0);
    if (start < previous - 0.001) return 'These changes would reorder lyric lines. Uncheck the conflicting suggestion or adjust it manually.';
    previous = start;
    if (i < lines.length - 1) {
      const nextLine = lines[i + 1], nextItem = byId.get(String(nextLine.id));
      const end = item ? item.end : Number(line.end || 0);
      const nextStart = nextItem ? nextItem.start : Number(nextLine.start || 0);
      if (end > nextStart + 0.02) return 'These changes would overlap adjacent lyric lines. Uncheck a conflicting suggestion or adjust it manually.';
    }
  }
  return '';
}
