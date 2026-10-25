// BACKROOMS - MÓVIL 22 · Sonido posicional con WebAudio
"use strict";

var SFX = (function () {
  var ctx = null, master = null, buffers = {}, listener = { x: 0, z: 0, rx: 1, rz: 0 };
  var NAMES = ["beep", "bolt", "casing", "chase", "creak", "cyl", "door", "drip", "empty", "flare", "flicker", "flip", "growl",
    "heart", "hum", "hurt", "machine", "magin", "magout", "mdie", "mhit", "noclip", "phone", "pickup", "pump", "rattle",
    "revolver", "rifle", "rumble", "scream", "shell", "shot", "shot_far", "stab", "static", "steam", "step0", "step1", "step2",
    "step3", "sup", "swipe", "swish", "water", "zap"];

  function init() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  function unlock() {
    init();
    if (ctx && ctx.state !== "running") ctx.resume();
  }
  function load(onProgress) {
    init();
    var done = 0;
    return Promise.all(NAMES.map(function (n) {
      return fetch("assets/snd/" + n + ".wav").then(function (r) { return r.arrayBuffer(); })
        .then(function (ab) {
          return new Promise(function (res) {
            ctx.decodeAudioData(ab, function (b) { buffers[n] = b; res(); }, function () { res(); });
          });
        })
        .catch(function () { })
        .then(function () { done++; if (onProgress) onProgress(done / NAMES.length); });
    }));
  }
  function gains(pos, maxd) {
    var dx = pos[0] - listener.x, dz = pos[1] - listener.z, d = Math.hypot(dx, dz);
    var att = Math.pow(Math.max(0, 1 - d / maxd), 1.6), pan = 0;
    if (d > 0.01) pan = Math.max(-1, Math.min(1, (dx * listener.rx + dz * listener.rz) / d)) * 0.8;
    return [att, pan];
  }
  function play(name, vol, rate, pos, maxd) {
    if (!ctx || !buffers[name]) return null;
    vol = vol === undefined ? 1 : vol;
    var pan = 0;
    if (pos) {
      var g = gains(pos, maxd || 35);
      vol *= g[0]; pan = g[1];
      if (vol < 0.01) return null;
    }
    var src = ctx.createBufferSource();
    src.buffer = buffers[name];
    src.playbackRate.value = rate || 1;
    var gn = ctx.createGain();
    gn.gain.value = vol;
    src.connect(gn);
    var out = gn;
    if (ctx.createStereoPanner) {
      var p = ctx.createStereoPanner(); p.pan.value = pan; gn.connect(p); out = p;
    }
    out.connect(master);
    src.start();
    return src;
  }
  function loop(name, vol) {
    if (!ctx || !buffers[name]) return null;
    var src = ctx.createBufferSource();
    src.buffer = buffers[name];
    src.loop = true;
    var gn = ctx.createGain();
    gn.gain.value = vol;
    src.connect(gn); gn.connect(master);
    src.start();
    return {
      setVolume: function (v) { gn.gain.setTargetAtTime(v, ctx.currentTime, 0.05); },
      setRate: function (r) { src.playbackRate.value = r; },
      stop: function () { try { src.stop(); } catch (e) { } }
    };
  }
  return {
    init: init, unlock: unlock, load: load, play: play, loop: loop, gains: gains, listener: listener,
    get ctx() { return ctx; }, get master() { return master; }, has: function (n) { return !!buffers[n]; }
  };
})();
