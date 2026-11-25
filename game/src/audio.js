// Tiny WebAudio kitchen sounds, made from oscillators — no audio files, so
// the game stays fully offline. Sounds start only after a player gesture,
// which is when the context is created.

let context = null;

function tone(freq, seconds, type, gain, when = 0) {
  if (!context) return;
  const start = context.currentTime + when;
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  osc.connect(amp).connect(context.destination);
  osc.start(start);
  osc.stop(start + seconds);
}

export function unlockAudio() {
  try {
    if (!context) context = new window.AudioContext();
    if (context.state === 'suspended') context.resume();
  } catch {
    context = null;
  }
}

export function soundAdded() { tone(520, 0.08, 'triangle', 0.12); tone(780, 0.07, 'triangle', 0.08, 0.05); }
export function soundWrong() { tone(160, 0.16, 'sawtooth', 0.08); }
export function soundCooked() { tone(880, 0.12, 'sine', 0.14); tone(1174, 0.16, 'sine', 0.12, 0.1); }
export function soundServed() { tone(659, 0.1, 'triangle', 0.12); tone(784, 0.1, 'triangle', 0.12, 0.09); tone(1046, 0.18, 'triangle', 0.12, 0.18); }
export function soundExpired() { tone(300, 0.2, 'sine', 0.1); tone(220, 0.28, 'sine', 0.1, 0.14); }
