// BACKROOMS - MÓVIL 22 · Chat de voz (WebRTC entre jugadores, señalización por la sala)
//  - voz por cercanía; radio (todos te escuchan, con filtro de walkie-talkie)
//  - nivel del micrófono para que las entidades te escuchen si gritás
//  - guarda en memoria frases propias para que el doppelgänger te imite (nada se guarda en disco)
"use strict";

var VOICE = (function () {
  var ICE = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];
  var V = {
    ok: false, error: "", muted: false, radio: false, talking: false, level: 0,
    stream: null, peers: {}, net: null, myId: 0, phrases: [], remoteRadio: {}
  };
  var analyser = null, abuf = null, hang = 0, rec = [], recSil = 0, recNode = null;

  V.start = function (net, myId) {
    V.net = net; V.myId = myId;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.RTCPeerConnection) {
      V.error = "Este dispositivo no permite micrófono en el juego";
      return Promise.resolve(false);
    }
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then(function (st) {
        V.stream = st; V.ok = true;
        var ctx = SFX.ctx;
        var src = ctx.createMediaStreamSource(st);
        analyser = ctx.createAnalyser(); analyser.fftSize = 1024;
        abuf = new Float32Array(analyser.fftSize);
        src.connect(analyser);
        // grabador de frases (para el doppelgänger)
        if (ctx.createScriptProcessor) {
          recNode = ctx.createScriptProcessor(4096, 1, 1);
          var mute = ctx.createGain(); mute.gain.value = 0;
          src.connect(recNode); recNode.connect(mute); mute.connect(ctx.destination);
          recNode.onaudioprocess = function (e) { capture(e.inputBuffer.getChannelData(0), ctx.sampleRate); };
        }
        net.onSignal(myId, onSignal);
        return true;
      })
      .catch(function (e) { V.error = "Sin permiso de micrófono"; return false; });
  };

  function capture(x, sr) {
    var s = 0;
    for (var i = 0; i < x.length; i++) s += x[i] * x[i];
    var rms = Math.sqrt(s / x.length), voiced = rms > 0.02 && !V.muted;
    if (voiced) { rec.push(new Float32Array(x)); recSil = 0; }
    else if (rec.length) {
      recSil += x.length / sr; rec.push(new Float32Array(x));
      if (recSil > 0.35) {
        var n = 0; rec.forEach(function (c) { n += c.length; });
        if (n > 0.6 * sr && n < 5 * sr) {
          // a 16 kHz
          var step = sr / 16000, out = new Float32Array(Math.floor(n / step)), all = new Float32Array(n), k = 0;
          rec.forEach(function (c) { all.set(c, k); k += c.length; });
          for (var j = 0; j < out.length; j++) out[j] = all[Math.floor(j * step)];
          V.phrases.push(out);
          if (V.phrases.length > 6) V.phrases.shift();
        }
        rec = []; recSil = 0;
      }
    }
    if (rec.length > (5 * sr) / 4096) rec = [];
  }

  // --- μ-law para mandar clips
  V.encodeClip = function (x) {
    var b = new Uint8Array(x.length);
    for (var i = 0; i < x.length; i++) {
      var v = Math.max(-1, Math.min(1, x[i])), y = Math.sign(v) * Math.log1p(255 * Math.abs(v)) / Math.log1p(255);
      b[i] = Math.round((y + 1) * 127.5);
    }
    var s = "";
    for (i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    return btoa(s);
  };
  V.decodeClip = function (s) {
    var raw = atob(s), out = new Float32Array(raw.length);
    for (var i = 0; i < raw.length; i++) {
      var y = raw.charCodeAt(i) / 127.5 - 1;
      out[i] = Math.sign(y) * (Math.pow(256, Math.abs(y)) - 1) / 255;
    }
    return out;
  };
  V.playClip = function (samples, pos) {
    var ctx = SFX.ctx;
    if (!ctx) return;
    var buf = ctx.createBuffer(1, samples.length, 16000);
    buf.copyToChannel ? buf.copyToChannel(samples, 0) : buf.getChannelData(0).set(samples);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var g = SFX.gains(pos, 30), gn = ctx.createGain(); gn.gain.value = g[0] * 1.3;
    src.connect(gn);
    var out = gn;
    if (ctx.createStereoPanner) { var p = ctx.createStereoPanner(); p.pan.value = g[1]; gn.connect(p); out = p; }
    out.connect(SFX.master);
    src.start();
  };
  V.randomPhrase = function () { return V.phrases.length ? V.phrases[Math.floor(Math.random() * V.phrases.length)] : null; };

  // --- nivel del micro (cada cuadro)
  V.update = function (dt) {
    if (!V.ok) return;
    analyser.getFloatTimeDomainData(abuf);
    var s = 0;
    for (var i = 0; i < abuf.length; i++) s += abuf[i] * abuf[i];
    V.level = V.muted ? 0 : Math.sqrt(s / abuf.length);
    if (V.level > 0.02 || V.radio) hang = 0.35; else hang -= dt;
    V.talking = hang > 0 && !V.muted;
    V.stream.getAudioTracks().forEach(function (t) { t.enabled = !V.muted; });
  };

  // --- WebRTC
  function peer(id, initiator) {
    if (V.peers[id]) return V.peers[id];
    var pc = new RTCPeerConnection({ iceServers: ICE });
    var P = { pc: pc, id: id, gain: null, pan: null, filt: null, el: null };
    V.peers[id] = P;
    V.stream.getTracks().forEach(function (t) { pc.addTrack(t, V.stream); });
    pc.onicecandidate = function (e) { if (e.candidate) V.net.signal(id, { from: V.myId, ice: e.candidate }); };
    pc.ontrack = function (e) {
      if (P.gain) return;
      var ctx = SFX.ctx, st = e.streams[0];
      P.el = new Audio(); P.el.srcObject = st; P.el.muted = true; P.el.play().catch(function () { });
      var src = ctx.createMediaStreamSource(st);
      P.filt = ctx.createBiquadFilter(); P.filt.type = "allpass";
      P.gain = ctx.createGain(); P.gain.gain.value = 0;
      src.connect(P.filt); P.filt.connect(P.gain);
      var out = P.gain;
      if (ctx.createStereoPanner) { P.pan = ctx.createStereoPanner(); P.gain.connect(P.pan); out = P.pan; }
      out.connect(SFX.master);
    };
    if (initiator) {
      pc.createOffer().then(function (o) { return pc.setLocalDescription(o); })
        .then(function () { V.net.signal(id, { from: V.myId, sdp: pc.localDescription }); });
    }
    return P;
  }
  function onSignal(m) {
    if (!V.ok || m.from === undefined || m.from === V.myId) return;
    var P = peer(m.from, false), pc = P.pc;
    if (m.sdp) {
      pc.setRemoteDescription(m.sdp).then(function () {
        if (m.sdp.type === "offer") {
          return pc.createAnswer().then(function (a) { return pc.setLocalDescription(a); })
            .then(function () { V.net.signal(m.from, { from: V.myId, sdp: pc.localDescription }); });
        }
      }).catch(function () { });
    } else if (m.ice) pc.addIceCandidate(m.ice).catch(function () { });
  }
  // conectar con los jugadores presentes (el de id menor inicia)
  V.sync = function (ids) {
    if (!V.ok) return;
    ids.forEach(function (id) { if (id !== V.myId && !V.peers[id] && V.myId < id) peer(id, true); });
    Object.keys(V.peers).forEach(function (k) {
      if (ids.indexOf(+k) < 0) { try { V.peers[k].pc.close(); } catch (e) { } delete V.peers[k]; }
    });
  };
  // volumen según distancia / radio
  V.setPeer = function (id, gain, pan, radio) {
    var P = V.peers[id];
    if (!P || !P.gain) return;
    var ctx = SFX.ctx;
    if (radio) { P.filt.type = "bandpass"; P.filt.frequency.value = 1600; P.filt.Q.value = 1.2; gain = 0.9; pan = 0; }
    else P.filt.type = "allpass";
    P.gain.gain.setTargetAtTime(gain, ctx.currentTime, 0.08);
    if (P.pan) P.pan.pan.setTargetAtTime(pan, ctx.currentTime, 0.08);
  };
  V.stop = function () {
    Object.keys(V.peers).forEach(function (k) { try { V.peers[k].pc.close(); } catch (e) { } });
    V.peers = {};
    if (V.stream) V.stream.getTracks().forEach(function (t) { t.stop(); });
    V.ok = false;
  };
  return V;
})();
