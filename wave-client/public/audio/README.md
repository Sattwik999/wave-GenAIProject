# Soothing Music for WAVE App

This directory contains audio files for the relaxing music feature.

## Current Audio Files:
- **videoplayback.m4a** - Background music player (navbar + Meditation ambient)
- **chime.mp3** - Short completion chime used at the end of a meditation session

## Audio Configuration:
- Format: M4A (AAC audio format, well supported by modern browsers)
- Playback: Automatic looping when music is enabled
- Volume: Set to 30% for comfortable background listening
- Controls: Toggle on/off via the music button in the navbar

## Additional Audio Files (Optional):
You can add more audio files for future features:
- **ambient-nature.mp3** - Nature sounds (rain, forest, ocean waves)
- **meditation-music.mp3** - Soft instrumental meditation music
- **white-noise.mp3** - Gentle white noise for focus

## Audio Requirements:
- Format: MP3, M4A, or OGG for web compatibility
- Duration: 5-30 minutes (will loop automatically)
- Volume: Pre-normalized to comfortable listening levels
- Quality: 128kbps is sufficient for background music

## Free Audio Sources:
- Freesound.org
- Zapsplat.com
- YouTube Audio Library
- Pixabay Audio

## Usage:
- Navbar music toggle uses `videoplayback.m4a` and loops continuously when toggled on.
- Meditation page uses `videoplayback.m4a` for ambient sound and plays `chime.mp3` once when the session completes.

Note: If `chime.mp3` is an empty placeholder in this repo, replace it with a real short chime to enable the completion sound.