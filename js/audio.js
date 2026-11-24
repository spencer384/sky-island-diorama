// js/audio.js — Synthesized Web Audio steam train whistle

window.SkyAudio = (function () {
  let ctx = null;

  function playWhistle() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
    gain.gain.setValueAtTime(0.18, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    gain.connect(ctx.destination);

    // Classic dual-chime steam whistle chord
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * 0.98, now);
      osc.frequency.linearRampToValueAtTime(freq, now + 0.09);
      osc.frequency.linearRampToValueAtTime(freq * 0.97, now + 0.92);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.96);
    });
  }

  return { playWhistle };
})();
