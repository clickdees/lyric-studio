# AI-assisted lyric timing correction

This feature refines manually marked **line start and end times**. It does not create lyrics, listen to the song through ChatGPT, or upload the original audio.

## Workflow

1. Upload your audio and create or sync your lyric lines as usual.
2. Open **AI timing correction** in the Sync editor and choose **Analyze full song**.
3. Choose **Download ChatGPT package** when analysis finishes. The JSON contains the whole-song acoustic feature series, candidate onset times, current manual lyric timings, line IDs, lyrics, syllable estimates, neighboring lines, project IN/OUT, and retained source-audio ranges.
4. Attach that JSON file to ChatGPT. Do **not** attach the song audio. Paste the prompt below (the panel also has a **Copy ChatGPT prompt** button).
5. Ask ChatGPT to return only the specified JSON response.
6. Paste the result into **Import ChatGPT’s corrections**, or load the returned JSON file. Choose **Validate & preview corrections**.
7. Review each suggestion, uncheck changes you do not want, and choose **Apply selected corrections**. Use **Undo last apply** to revert the most recent batch.

## ChatGPT prompt

You are reviewing an existing karaoke lyric timing map. Do not transcribe the song and do not invent or rewrite lyrics. Use the attached lyric-studio.timing-review JSON as the only audio evidence. The original audio is intentionally not included. Review all lyric lines together, using their manual start/end times, order, text, estimated syllable counts, neighboring lines, nearby acoustic frames, whole-song features and candidate onsets. Remember: RMS and spectral onsets are whole-mix measurements. Drums and instruments can create peaks. Do not treat every onset or loudness peak as a sung syllable. Suggest conservative corrections to boundaries that appear early or late. Preserve the overall sequence and musical phrasing. Prefer small changes; do not move either boundary by more than 3 seconds. Use original-audio source seconds, not cropped-timeline seconds. Return every line, including unchanged lines. If the data does not support a reliable correction, return status needs-review and null suggestedStart/suggestedEnd. Return only valid JSON with schema lyric-studio.timing-corrections, schemaVersion 1, and corrections containing lineId, originalStart, originalEnd, suggestedStart, suggestedEnd, confidence (0 to 1), status (suggested or needs-review), and a concise reason.

## What local analysis measures

The browser decodes audio with the Web Audio API, downmixes to mono, reduces the analysis sample rate to at most approximately 11 kHz, and computes a feature frame about every 100 ms in a Web Worker:

- RMS signal level (a loudness proxy)
- Relative low-, mid-, and high-frequency spectral energy
- Spectral centroid (brightness proxy)
- Positive spectral flux
- Candidate transient/onset times derived from spectral flux

The original audio is not sent to a server by this feature. The exported JSON includes analysis features and lyrics/timings, not audio samples.

## Limitations and safety checks

These are measurements of the **whole mix**, not a separated vocal stem or speech-recognition output. A drum hit, guitar attack, piano note, or other instrument can be louder or create an onset than the singer. ChatGPT can make informed timing estimates from the sequence and acoustic context, but it cannot verify exact syllable boundaries without hearing the audio. Treat suggestions as proposals and listen to the preview.

Imports are checked for schema version, line IDs, original timestamps, duplicate IDs, finite values, audio-duration bounds, minimum line duration, a maximum three-second change per boundary, and chronological start-time order. The project keeps its original source-timebase and the feature does not change the song audio or timeline clips. Each line’s style and word-level settings are preserved.
