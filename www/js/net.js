// BACKROOMS - MÓVIL 22 · Red: salas con código. Mensajes por MQTT público (internet)
// o BroadcastChannel (pruebas en una misma máquina con ?local=1).
"use strict";

var NET = (function () {
  var BROKERS = ["wss://broker.hivemq.com:8884/mqtt", "wss://broker.emqx.io:8084/mqtt", "wss://test.mosquitto.org:8081/mqtt"];
  var enc = new TextEncoder(), dec = new TextDecoder();

  // ------------------------------------------------------------ cliente MQTT mínimo (3.1.1, QoS 0)
  function MQTT(url, onOpen, onMsg, onClose) {
    var ws, buf = new Uint8Array(0), ping, self = this, pid = 1;
    this.open = false;
    function str(s) { var b = enc.encode(s); var o = new Uint8Array(2 + b.length); o[0] = b.length >> 8; o[1] = b.length & 255; o.set(b, 2); return o; }
    function len(n) { var o = []; do { var d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return o; }
    function pkt(type, body) { var l = len(body.length), o = new Uint8Array(1 + l.length + body.length); o[0] = type; o.set(l, 1); o.set(body, 1 + l.length); return o; }
    function cat(arrs) { var n = 0; arrs.forEach(function (a) { n += a.length; }); var o = new Uint8Array(n), k = 0; arrs.forEach(function (a) { o.set(a, k); k += a.length; }); return o; }
    this.send = function (b) { if (ws && ws.readyState === 1) ws.send(b); };
    this.publish = function (topic, s) { self.send(pkt(0x30, cat([str(topic), enc.encode(s)]))); };
    this.subscribe = function (topic) {
      var id = pid++;
      self.send(pkt(0x82, cat([new Uint8Array([id >> 8, id & 255]), str(topic), new Uint8Array([0])])));
    };
    this.close = function () { clearInterval(ping); try { ws.close(); } catch (e) { } };
    try { ws = new WebSocket(url, "mqtt"); } catch (e) { setTimeout(function () { onClose("ws"); }, 0); return; }
    ws.binaryType = "arraybuffer";
    ws.onopen = function () {
      var cid = "br22" + Math.random().toString(36).slice(2, 12);
      var vh = cat([str("MQTT"), new Uint8Array([4, 2, 0, 30])]);
      self.send(pkt(0x10, cat([vh, str(cid)])));
    };
    ws.onmessage = function (e) {
      var d = new Uint8Array(e.data), nb = new Uint8Array(buf.length + d.length);
      nb.set(buf); nb.set(d, buf.length); buf = nb;
      while (buf.length >= 2) {
        var mult = 1, rl = 0, i = 1, b;
        do { if (i >= buf.length) return; b = buf[i++]; rl += (b & 127) * mult; mult *= 128; } while (b & 128);
        if (buf.length < i + rl) return;
        var type = buf[0] & 0xF0, body = buf.subarray(i, i + rl);
        if (type === 0x20) {
          self.open = true;
          ping = setInterval(function () { self.send(new Uint8Array([0xC0, 0])); }, 20000);
          onOpen();
        } else if (type === 0x30) {
          var tl = (body[0] << 8) | body[1], topic = dec.decode(body.subarray(2, 2 + tl));
          var off = 2 + tl + ((buf[0] & 6) ? 2 : 0);
          onMsg(topic, dec.decode(body.subarray(off)));
        }
        buf = buf.slice(i + rl);
      }
    };
    ws.onclose = function () { clearInterval(ping); self.open = false; onClose("close"); };
    ws.onerror = function () { };
  }

  // ------------------------------------------------------------ transporte local (pruebas)
  function Local(onOpen, onMsg) {
    var bc = new BroadcastChannel("br22-local"), subs = [];
    this.open = true;
    bc.onmessage = function (e) {
      var t = e.data.t;
      for (var k = 0; k < subs.length; k++) if (subs[k] === t) { onMsg(t, e.data.p); break; }
    };
    this.publish = function (t, p) { bc.postMessage({ t: t, p: p }); };
    this.subscribe = function (t) { subs.push(t); };
    this.close = function () { bc.close(); };
    setTimeout(onOpen, 10);
  }

  function connect(brokerIdx, onMsg, cb) {
    if (/[?&]local=1/.test(location.search)) { var l = new Local(function () { cb(null, l); }, onMsg); return; }
    var done = false;
    var t = setTimeout(function () { if (!done) { done = true; cb("timeout"); try { m.close(); } catch (e) { } } }, 8000);
    var m = new MQTT(BROKERS[brokerIdx], function () { if (!done) { done = true; clearTimeout(t); cb(null, m); } }, onMsg,
      function () { if (!done) { done = true; clearTimeout(t); cb("close"); } });
  }

  function code4() {
    var A = "ABCDEFGHJKMNPQRSTUVWXYZ", s = "";
    for (var i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
    return s;
  }

  // ------------------------------------------------------------ host
  function Host(cb) {
    var self = this;
    this.q = []; this.clients = {}; this.keys = {}; this.nextId = 1; this.alive = true;
    var tryB = function (bi) {
      if (bi >= BROKERS.length) { cb("No se pudo conectar a ningún servidor de salas. Revisá tu internet."); return; }
      var code = code4() + bi;
      connect(bi, function (topic, payload) { self._in(topic, payload); }, function (err, tr) {
        if (err) { tryB(bi + 1); return; }
        self.tr = tr; self.code = code; self.pre = "br22v3/" + code;
        tr.subscribe(self.pre + "/h");
        self.hb = setInterval(function () { self._check(); }, 1000);
        cb(null, self);
      });
    };
    tryB(0);
  }
  Host.prototype._in = function (topic, payload) {
    var m;
    try { m = JSON.parse(payload); } catch (e) { return; }
    var key = m.k;
    if (!key) return;
    var id = this.keys[key];
    if (m.t === "hello" && id === undefined) {
      id = this.nextId++; this.keys[key] = id; this.clients[id] = { key: key, last: Date.now() };
    }
    if (id === undefined) return;
    if (this.clients[id]) this.clients[id].last = Date.now();
    this.q.push([id, m]);
  };
  Host.prototype._check = function () {
    var now = Date.now();
    for (var id in this.clients) if (now - this.clients[id].last > 9000) { this.q.push([+id, { t: "bye" }]); this.drop(+id); }
  };
  Host.prototype.poll = function () { var q = this.q; this.q = []; return q; };
  Host.prototype.send = function (id, msg) { var c = this.clients[id]; if (c) this.tr.publish(this.pre + "/c/" + c.key, JSON.stringify(msg)); };
  Host.prototype.broadcast = function (msg) { this.tr.publish(this.pre + "/c", JSON.stringify(msg)); };
  Host.prototype.drop = function (id) { var c = this.clients[id]; if (c) { delete this.keys[c.key]; delete this.clients[id]; } };
  Host.prototype.signal = function (to, msg) { this.tr.publish(this.pre + "/sig/" + to, JSON.stringify(msg)); };
  Host.prototype.onSignal = function (myId, fn) { this.sigFn = fn; this.tr.subscribe(this.pre + "/sig/" + myId); };
  Host.prototype.close = function () { clearInterval(this.hb); this.alive = false; try { this.tr.close(); } catch (e) { } };

  // ------------------------------------------------------------ cliente
  function Client(code, cb) {
    var self = this;
    code = (code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length !== 5) { cb("El código tiene 4 letras y un número (ej: KQZT0)"); return; }
    var bi = +code[4];
    if (!(bi >= 0 && bi < BROKERS.length)) { cb("Código inválido"); return; }
    this.key = "c" + Math.random().toString(36).slice(2, 10);
    this.q = []; this.alive = true; this.last = Date.now();
    this.pre = "br22v3/" + code;
    connect(bi, function (topic, payload) {
      var m;
      try { m = JSON.parse(payload); } catch (e) { return; }
      if (topic.indexOf("/sig/") >= 0) { if (self.sigFn) self.sigFn(m); return; }
      self.last = Date.now();
      self.q.push(m);
    }, function (err, tr) {
      if (err) { cb("No se pudo conectar al servidor de salas. Revisá tu internet."); return; }
      self.tr = tr;
      tr.subscribe(self.pre + "/c");
      tr.subscribe(self.pre + "/c/" + self.key);
      self.hb = setInterval(function () { if (Date.now() - self.last > 10000) { self.alive = false; } }, 1000);
      cb(null, self);
    });
  }
  Client.prototype.send = function (msg) { msg.k = this.key; if (this.tr) this.tr.publish(this.pre + "/h", JSON.stringify(msg)); };
  Client.prototype.poll = function () { var q = this.q; this.q = []; return q; };
  Client.prototype.signal = function (to, msg) { this.tr.publish(this.pre + "/sig/" + to, JSON.stringify(msg)); };
  Client.prototype.onSignal = function (myId, fn) { this.sigFn = fn; this.tr.subscribe(this.pre + "/sig/" + myId); };
  Client.prototype.close = function () { clearInterval(this.hb); this.alive = false; try { this.tr.close(); } catch (e) { } };

  // el host también recibe señales WebRTC
  var _hin = Host.prototype._in;
  Host.prototype._in = function (topic, payload) {
    if (topic.indexOf("/sig/") >= 0) { try { if (this.sigFn) this.sigFn(JSON.parse(payload)); } catch (e) { } return; }
    _hin.call(this, topic, payload);
  };

  return { Host: Host, Client: Client };
})();
