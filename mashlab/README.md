# MashLab

A local-first browser prototype for intelligent two-track mashups.

## What works in this MVP

- Upload audio or compatible video files from desktop/mobile.
- Decode/extract the video's audio track locally in the browser when the codec is supported.
- Analyze BPM, beat onset, coarse musical key, energy profile, and a high-energy hook candidate.
- Calculate tempo, harmonic, energy, structure, and combined compatibility scores.
- Generate three deterministic mashup arrangements: Smooth Handoff, Hook Exchange, and Double Drop.
- Pitch-preserving live tempo matching through `HTMLMediaElement.playbackRate` where supported by the browser.
- Independent volume and stereo pan for both tracks.
- Record a pitch-safe real-time WebM/Opus preview.
- Quick offline WAV render (tempo changes use resampling and can alter pitch).
- PWA manifest + service worker for install/offline shell.

## Privacy

Media is processed locally. This version has no backend and does not upload source media.

## Known limitations

This is the browser-core MVP, not the final production pipeline. It does not yet include source/stem separation, vocal collision detection, chord-level analysis, a phase-vocoder/Rubber Band quality offline time-stretcher, or server-side mastering. Video decoding is limited to codecs the browser itself can decode.

## Run locally

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/mashlab/` if serving from the parent repository, or `http://localhost:8080/` from this directory.

## Rights

Only process audio/video you own or are authorized to use. MashLab does not download or bypass DRM from streaming services.
