/* مؤثرات صوتية مولّدة بالكود (Web Audio) — لا توجد ملفات صوت خارجية */
window.SA = window.SA || {};

SA.Sound = (function () {
  'use strict';
  var ctx = null, master = null, muted = false;
  var VOLUME = 0.32;

  try { muted = localStorage.getItem('sa_muted') === '1'; } catch (e) { /* التخزين غير متاح */ }

  function ensure() {
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : VOLUME;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }

  function tone(o) {
    var c = ensure();
    if (!c || muted) return;
    var t = c.currentTime + (o.delay || 0);
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
    g.gain.setValueAtTime(o.vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + o.dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + o.dur + 0.03);
  }

  var FX = {
    jump: function () { tone({ freq: 300, to: 620, dur: 0.14, vol: 0.22 }); },
    coin: function () {
      tone({ freq: 988, dur: 0.07, vol: 0.22 });
      tone({ freq: 1319, dur: 0.2, vol: 0.22, delay: 0.07 });
    },
    stomp: function () { tone({ freq: 220, to: 90, dur: 0.12, vol: 0.3, type: 'triangle' }); },
    hurt: function () {
      tone({ freq: 440, to: 110, dur: 0.35, vol: 0.28, type: 'sawtooth' });
    },
    item: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { tone({ freq: f, dur: 0.1, vol: 0.2, delay: i * 0.06, type: 'triangle' }); });
    },
    checkpoint: function () {
      tone({ freq: 659, dur: 0.12, vol: 0.2 });
      tone({ freq: 880, dur: 0.22, vol: 0.2, delay: 0.12 });
    },
    win: function () {
      [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) {
        tone({ freq: f, dur: i === 5 ? 0.5 : 0.13, vol: 0.22, delay: i * 0.12 });
      });
    },
    gameover: function () {
      [392, 330, 262, 196].forEach(function (f, i) { tone({ freq: f, dur: 0.22, vol: 0.22, delay: i * 0.2, type: 'triangle' }); });
    }
  };

  return {
    unlock: ensure,
    play: function (name) {
      try { if (FX[name]) FX[name](); } catch (e) { /* تجاهل أخطاء الصوت */ }
    },
    isMuted: function () { return muted; },
    toggle: function () {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : VOLUME;
      try { localStorage.setItem('sa_muted', muted ? '1' : '0'); } catch (e) { /* */ }
      return muted;
    }
  };
})();
