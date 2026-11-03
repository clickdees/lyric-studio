import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AudioLines, Download, Clipboard, Upload, Check, AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';
import { analyzeAudioFile } from './audioAnalysis.js';
import { buildTimingReviewPackage, validateTimingCorrections, validateSelectedCorrectionSequence, CHATGPT_PROMPT } from './timingCorrection.js';
const timeLabel = value => {
  const n = Math.max(0, Number(value) || 0), minutes = Math.floor(n / 60);
  return String(minutes).padStart(2, '0') + ':' + (n % 60).toFixed(2).padStart(5, '0');
};
export function TimingCorrectionPanel({ audioFile, audioName, duration, lines, timelineClips, projectIn, projectOut, onApplyCorrections }) {
  const [analysis, setAnalysis] = useState(null), [progress, setProgress] = useState(0), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(''), [error, setError] = useState(''), [responseText, setResponseText] = useState('');
  const [review, setReview] = useState(null), [selectedIds, setSelectedIds] = useState([]), [undoSnapshot, setUndoSnapshot] = useState(null);
  const importRef = useRef(null);
  useEffect(() => {
    setAnalysis(null); setProgress(0); setMessage(''); setError(''); setResponseText(''); setReview(null);
    setSelectedIds([]); setUndoSnapshot(null);
  }, [audioFile]);
  const selectedCorrections = useMemo(() => (review?.corrections || []).filter(item => selectedIds.includes(item.lineId)), [review, selectedIds]);
  const analyze = async () => {
    setError(''); setMessage(''); setReview(null); setSelectedIds([]); setAnalysis(null);
    if (!audioFile) { setError('Upload an audio file first.'); return; }
    setBusy(true); setProgress(0);
    try {
      const result = await analyzeAudioFile(audioFile, update => { setProgress(update.progress || 0); setMessage(update.message || 'Analyzing locally…'); });
      setAnalysis(result); setProgress(100); setMessage('Analysis complete. The audio has not left this browser.');
    } catch (err) { setError(err && err.message || 'Could not analyze this audio file.'); }
    finally { setBusy(false); }
  };
  const buildPackage = () => buildTimingReviewPackage({
    audioName, duration: duration || analysis && analysis.durationSeconds || 0, analysis, lines, timelineClips, projectIn, projectOut
  });
  const downloadPackage = () => {
    try {
      const blob = new Blob([JSON.stringify(buildPackage(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      const safeName = String(audioName || 'song').replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'song';
      link.href = url; link.download = safeName + '-lyric-timing-review.json';
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      setMessage('JSON package downloaded. Attach it to ChatGPT; do not upload the song audio.');
    } catch (err) { setError(err && err.message || 'Could not create the review package.'); }
  };
  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(CHATGPT_PROMPT); setMessage('ChatGPT instructions copied. Attach the JSON package and paste the prompt into ChatGPT.'); setError(''); }
    catch (_) { setError('Clipboard access is unavailable. See docs/timing-correction.md for the prompt.'); }
  };
  const copyPackage = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildPackage(), null, 2));
      setMessage('Review package copied to the clipboard.'); setError('');
    } catch (_) { setError('Clipboard access is unavailable here. Use Download JSON instead.'); }
  };
  const importResponse = () => {
    setError('');
    const result = validateTimingCorrections(responseText, lines, duration || analysis && analysis.durationSeconds || 0);
    if (!result.ok) { setReview(null); setSelectedIds([]); setError(result.error); return; }
    setReview(result); setSelectedIds(result.corrections.map(item => item.lineId));
    setMessage('Review loaded. Uncheck any line you do not want to change, then apply the selected suggestions.');
  };
  const applySelected = () => {
    const sequenceError = validateSelectedCorrectionSequence(lines, selectedCorrections);
    if (sequenceError) { setError(sequenceError); return; }
    const snapshot = lines.map(line => ({ lineId: line.id, start: line.start, end: line.end }));
    onApplyCorrections(selectedCorrections.map(item => ({ lineId: item.lineId, start: item.start, end: item.end })));
    setUndoSnapshot(snapshot); setMessage('Selected timing changes applied. Line styling and word-level settings were preserved.'); setError('');
  };
  const undoLastApply = () => {
    if (!undoSnapshot) return;
    onApplyCorrections(undoSnapshot); setUndoSnapshot(null); setMessage('The previous AI timing changes were undone.');
  };
  const loadResponseFile = async file => {
    if (!file) return;
    try {
      setResponseText(await file.text()); setReview(null); setSelectedIds([]); setError('');
      setMessage('JSON loaded. Select “Validate & preview corrections” to inspect it.');
    } catch (_) { setError('Could not read that JSON file.'); }
  };
  return <section className="panel timing-correction-panel">
    <div className="timing-correction-heading">
      <div className="panel-title"><Sparkles size={18}/><h3>AI timing correction</h3><span className="count">local analysis</span></div>
      <span className="timing-local-tag"><span/> AUDIO STAYS HERE</span>
    </div>
    <p className="timing-correction-intro">Refine your existing manual line timings. Lyric Studio analyzes the full song in your browser and exports an acoustic-data JSON package for ChatGPT. The song itself is never uploaded.</p>
    <div className="timing-analysis-summary">
      <div><small>Audio</small><b>{audioFile ? audioName : 'No audio uploaded'}</b></div>
      <div><small>Duration</small><b>{duration ? timeLabel(duration) : '—'}</b></div>
      <div><small>Lyric lines</small><b>{lines.length}</b></div>
      <div><small>Analysis</small><b>{analysis ? analysis.summary.frameCount.toLocaleString() + ' frames' : 'Not run'}</b></div>
    </div>
    <div className="timing-action-row">
      <button type="button" className="btn primary" onClick={analyze} disabled={!audioFile || busy}><AudioLines size={15}/>{busy ? 'Analyzing…' : analysis ? 'Re-analyze audio' : 'Analyze full song'}</button>
      <button type="button" className="btn ghost" onClick={downloadPackage} disabled={!analysis || !lines.length}><Download size={15}/>Download ChatGPT package</button>
      <button type="button" className="btn ghost" onClick={copyPackage} disabled={!analysis || !lines.length}><Clipboard size={15}/>Copy JSON</button>
      <button type="button" className="btn ghost" onClick={copyPrompt}><Clipboard size={15}/>Copy ChatGPT prompt</button>
    </div>
    {busy && <div className="timing-progress"><div><span style={{ width: progress + '%' }}/></div><small>{message || 'Analyzing…'}</small></div>}
    {analysis && <div className="timing-analysis-note"><Check size={14}/> Acoustic analysis ready: {analysis.summary.onsetCount.toLocaleString()} candidate onsets. They may be instrumental, not vocal.</div>}
    <div className="timing-response">
      <div className="timing-response-heading"><b>Import ChatGPT’s corrections</b><small>Paste the returned JSON or load a JSON file.</small></div>
      <input ref={importRef} type="file" accept=".json,application/json,text/json" hidden onChange={event => { loadResponseFile(event.target.files && event.target.files[0]); event.target.value = ''; }}/>
      <div className="timing-import-row"><button type="button" className="btn small ghost" onClick={() => importRef.current && importRef.current.click()}><Upload size={14}/>Load JSON file</button></div>
      <textarea value={responseText} onChange={event => setResponseText(event.target.value)} rows={7} spellCheck="false" placeholder={'Paste the complete JSON object returned by ChatGPT…'}/>
      <div className="timing-action-row">
        <button type="button" className="btn primary" onClick={importResponse} disabled={!responseText.trim() || !lines.length}>Validate & preview corrections</button>
        <button type="button" className="btn ghost" onClick={() => { setResponseText(''); setReview(null); setSelectedIds([]); setError(''); }}>Clear</button>
      </div>
    </div>
    {review && <div className="timing-review">
      <div className="timing-review-heading"><b>Review suggested changes</b><span>{selectedCorrections.length} of {review.corrections.length} selected</span></div>
      <p>Compare the current times with the proposed times. Nothing is applied until you approve it below.</p>
      {review.corrections.map(item => <label className="timing-review-row" key={item.lineId}>
        <input type="checkbox" checked={selectedIds.includes(item.lineId)} onChange={event => setSelectedIds(old => event.target.checked ? [...old, item.lineId] : old.filter(id => id !== item.lineId))}/>
        <span className="timing-review-copy"><b>{item.text}</b><small>{timeLabel(item.originalStart)}–{timeLabel(item.originalEnd)} <strong>→</strong> {timeLabel(item.start)}–{timeLabel(item.end)} · {Math.round(item.confidence * 100)}% confidence</small><small>{item.reason}</small></span>
      </label>)}
      {review.needsReview.length > 0 && <div className="timing-needs-review"><AlertTriangle size={15}/><span>{review.needsReview.length} line(s) need manual review and will remain unchanged.</span></div>}
      <div className="timing-action-row">
        <button type="button" className="btn primary" onClick={applySelected} disabled={!selectedCorrections.length}>Apply selected corrections</button>
        <button type="button" className="btn ghost" onClick={() => setSelectedIds(review.corrections.map(item => item.lineId))}>Select all</button>
        <button type="button" className="btn ghost" onClick={() => setSelectedIds([])}>Select none</button>
        {undoSnapshot && <button type="button" className="btn ghost" onClick={undoLastApply}><RotateCcw size={14}/>Undo last apply</button>}
      </div>
    </div>}
    {error && <div className="timing-error"><AlertTriangle size={15}/>{error}</div>}
    {message && !busy && <div className="timing-message"><Check size={14}/>{message}</div>}
    <div className="timing-correction-footnote">The analysis measures loudness, frequency balance, spectral change and transient candidates across the whole mix. Those signals help ChatGPT reason about manual marks, but do not identify sung words by themselves. Listen to the preview before exporting.</div>
  </section>;
}
