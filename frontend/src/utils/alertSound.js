/**
 * Synthesized alert sounds using the Web Audio API.
 * No external audio files required.
 *
 * Severity profiles:
 *   critical → three sharp high-pitched beeps (urgent)
 *   warning  → two mid-tone beeps (attention)
 *   info     → single soft chime (informational)
 */

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return null;
  }
}

/**
 * Play a single beep tone.
 * @param {AudioContext} ctx
 * @param {number} frequency   Hz
 * @param {number} startTime   seconds from ctx.currentTime
 * @param {number} duration    seconds
 * @param {number} volume      0.0 – 1.0
 * @param {'sine'|'square'|'triangle'} type
 */
function beep(ctx, frequency, startTime, duration, volume = 0.4, type = 'sine') {
  const oscillator = ctx.createOscillator();
  const gainNode   = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type      = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  // Fade in quickly, hold, then fade out to avoid clicks
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.setValueAtTime(volume, startTime + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

const SOUND_PROFILES = {
  /**
   * Critical — three sharp beeps at high frequency (880 Hz)
   * Pattern: beep … beep … beep
   */
  critical: (ctx) => {
    const t = ctx.currentTime;
    beep(ctx, 880, t + 0.00, 0.12, 0.5, 'square');
    beep(ctx, 880, t + 0.20, 0.12, 0.5, 'square');
    beep(ctx, 880, t + 0.40, 0.18, 0.5, 'square');
  },

  /**
   * Warning — two mid-tone beeps (520 Hz)
   * Pattern: beep … beep
   */
  warning: (ctx) => {
    const t = ctx.currentTime;
    beep(ctx, 520, t + 0.00, 0.15, 0.4, 'sine');
    beep(ctx, 520, t + 0.25, 0.15, 0.4, 'sine');
  },

  /**
   * Info — single soft chime with descending tone
   * Pattern: high → low
   */
  info: (ctx) => {
    const t = ctx.currentTime;
    beep(ctx, 660, t + 0.00, 0.12, 0.3, 'sine');
    beep(ctx, 440, t + 0.15, 0.18, 0.25, 'sine');
  },
};

/**
 * Play the notification sound for a given severity level.
 * Safe to call — silently does nothing if Web Audio API is unavailable.
 *
 * @param {'critical'|'warning'|'info'} severity
 */
export function playAlertSound(severity = 'info') {
  const ctx = getAudioContext();
  if (!ctx) return;

  const profile = SOUND_PROFILES[severity] ?? SOUND_PROFILES.info;

  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => profile(ctx));
  } else {
    profile(ctx);
  }
}
