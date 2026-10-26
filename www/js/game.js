// BACKROOMS - MÓVIL 22 · Juego
"use strict";

var $ = function (id) { return document.getElementById(id); };
var ROLE_KEYS = DATA.ROLES.map(function (r) { return r.key; });
var BASE_FOV = 90;   // horizontal
var PROTO = 3;
function roleKey(i) { return ROLE_KEYS[(+i || 0) % 4] || ROLE_KEYS[0]; }
function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function hyp(a, b) { return Math.hypot(a, b); }
function norm3(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

// ===========================================================================
// Entrada (táctil + teclado/ratón)
// ===========================================================================
var INPUT = {
  mx: 0, mz: 0, sprint: false, lookX: 0, lookY: 0, fire: false, use: false, radio: false, aim: false,
  presses: {}, touch: false, sens: 1.2
};
INPUT.press = function (k) { INPUT.presses[k] = true; };
INPUT.took = function (k) { var v = !!INPUT.presses[k]; INPUT.presses[k] = false; return v; };

(function setupInput() {
  var keys = {};
  window.addEventListener("keydown", function (e) {
    if (document.activeElement && document.activeElement.tagName === "INPUT") return;
    if (!keys[e.code]) {
      var map = { KeyR: "reload", KeyG: "flare", KeyQ: "swap", KeyF: "light", KeyM: "mute", KeyV: "insp", Escape: "pause",
        KeyE: "useP", Digit1: "w1", Digit2: "w2" };
      if (map[e.code]) INPUT.press(map[e.code]);
    }
    keys[e.code] = true;
    upd();
  });
  window.addEventListener("keyup", function (e) { keys[e.code] = false; upd(); });
  function upd() {
    if (INPUT.touch) return;
    INPUT.mz = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    INPUT.mx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    INPUT.sprint = !!(keys.ShiftLeft || keys.ShiftRight);
    INPUT.use = !!keys.KeyE; INPUT.radio = !!keys.KeyB; INPUT.tab = !!keys.Tab;
  }
  var cv = $("cv");
  cv.addEventListener("mousedown", function (e) {
    if (INPUT.touch || !G || !G.ready) return;
    if (document.pointerLockElement !== cv) { cv.requestPointerLock && cv.requestPointerLock(); return; }
    if (e.button === 0) INPUT.fire = true;
    if (e.button === 2) INPUT.aim = true;
  });
  window.addEventListener("mouseup", function (e) { if (e.button === 0) INPUT.fire = false; if (e.button === 2) INPUT.aim = false; });
  window.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  window.addEventListener("mousemove", function (e) {
    if (document.pointerLockElement === cv) { INPUT.lookX += e.movementX * 0.1; INPUT.lookY += e.movementY * 0.1; }
  });
  window.addEventListener("wheel", function () { INPUT.press("swap"); });

  // ---- táctil
  var stickId = null, stickO = [0, 0], lookIds = {};
  var stick = $("stick"), knob = $("knob");
  function onStick(t, start) {
    if (start) {
      stickO = [t.clientX, t.clientY];
      stick.style.display = "block"; stick.style.left = (t.clientX - 60) + "px"; stick.style.top = (t.clientY - 60) + "px";
    }
    var dx = t.clientX - stickO[0], dy = t.clientY - stickO[1], d = Math.hypot(dx, dy), R = 55;
    if (d > R) { dx *= R / d; dy *= R / d; }
    knob.style.transform = "translate(" + dx + "px," + dy + "px)";
    INPUT.mx = dx / R; INPUT.mz = -dy / R;
    INPUT.sprint = d > R * 1.15;
  }
  $("lzone").addEventListener("touchstart", function (e) {
    e.preventDefault(); SFX.unlock();
    var t = e.changedTouches[0];
    if (stickId === null) { stickId = t.identifier; onStick(t, true); }
  }, { passive: false });
  function look(e, zoneIsButton) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === stickId) { onStick(t, false); continue; }
      var L = lookIds[t.identifier];
      if (L) {
        INPUT.lookX += (t.clientX - L[0]) * 0.22; INPUT.lookY += (t.clientY - L[1]) * 0.22;
        L[0] = t.clientX; L[1] = t.clientY;
      }
    }
  }
  document.addEventListener("touchmove", function (e) { if (G && G.ready) { e.preventDefault(); look(e); } }, { passive: false });
  function endT(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === stickId) { stickId = null; stick.style.display = "none"; INPUT.mx = INPUT.mz = 0; INPUT.sprint = false; }
      delete lookIds[t.identifier];
    }
  }
  document.addEventListener("touchend", endT); document.addEventListener("touchcancel", endT);
  $("rzone").addEventListener("touchstart", function (e) {
    e.preventDefault(); SFX.unlock();
    for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; lookIds[t.identifier] = [t.clientX, t.clientY]; }
  }, { passive: false });
  // botones: los de mantener también sirven para mirar mientras se arrastra
  function btn(id, down, up, alsoLook) {
    var el = $(id);
    el.addEventListener("touchstart", function (e) {
      e.preventDefault(); e.stopPropagation(); SFX.unlock();
      var t = e.changedTouches[0];
      if (alsoLook) lookIds[t.identifier] = [t.clientX, t.clientY];
      el.classList.add("on"); down();
    }, { passive: false });
    var off = function (e) { el.classList.remove("on"); if (up) up(); };
    el.addEventListener("touchend", off); el.addEventListener("touchcancel", off);
  }
  btn("b_fire", function () { INPUT.fire = true; }, function () { INPUT.fire = false; }, true);
  btn("b_use", function () { INPUT.use = true; INPUT.press("useP"); }, function () { INPUT.use = false; });
  btn("b_radio", function () { INPUT.radio = true; }, function () { INPUT.radio = false; });
  btn("b_aim", function () { INPUT.aim = !INPUT.aim; });
  btn("b_reload", function () { INPUT.press("reload"); });
  btn("b_flare", function () { INPUT.press("flare"); });
  btn("b_swap", function () { INPUT.press("swap"); });
  btn("b_light", function () { INPUT.press("light"); });
  btn("b_mute", function () { INPUT.press("mute"); });
  btn("b_insp", function () { INPUT.press("insp"); });
  $("b_pause").addEventListener("click", function () { INPUT.press("pause"); });
  $("b_pause").addEventListener("touchstart", function (e) { e.preventDefault(); INPUT.press("pause"); }, { passive: false });
  $("note").addEventListener("click", function () { if (G) G.closeNote(); });
  $("note").addEventListener("touchstart", function (e) { e.preventDefault(); if (G) G.closeNote(); }, { passive: false });
  window.addEventListener("touchstart", function () { if (!INPUT.touch) { INPUT.touch = true; } }, { once: true, passive: true });
})();

// ===========================================================================
// Juego
// ===========================================================================
var G = null;
var TUBE = 6;

function Game(o) {
  G = this;
  this.mode = o.mode; this.myId = o.myId; this.net = o.net; this.name = o.name; this.story = o.story;
  this.role = o.role; this.rc = DATA.ROLES[o.role];
  this.ready = false; this.transit = null; this.ending = null;
  this.level = o.level; this.seed = o.seed;
  this.worldRoot = null; this.levelNodes = []; this.pickups = []; this.flickers = []; this.water = null; this.door = null;
  this.monsters = {}; this.avatars = {}; this.remote = {}; this.names = {}; this.names[this.myId] = this.name;
  this.scores = {}; this.killsCarry = {}; this.pending = []; this.hum = null; this.sim = null; this.st = null;
  this.flaresLive = []; this.phantoms = []; this.radioQ = []; this.radioT = 0;
  this.maxhp = this.rc.hp; this.hp = this.maxhp; this.yaw = Math.random() * 360; this.pitch = 0;
  this.vx = 0; this.vz = 0; this.stamina = 1; this.alive = true; this.deadT = 0; this.deadSolo = true; this.deaths = 0; this.kills = 0;
  this.hurtFlash = 0; this.lastHurt = 99; this.shake = 0; this.bob = 0; this.stepD = 0; this.cool = 0; this.reloading = false;
  this.reloadT = 0; this.recoil = 0; this.flashOn = false; this.battery = 1; this.flares = 2; this.power = 1;
  this.brownT = rnd(50, 110); this.brownSeq = []; this.ambT = rnd(15, 30); this.heartT = 0; this.muzzleT = 0; this.tnet = 0;
  this.disconnected = false; this.paused = false; this.px = 0; this.pz = 0; this.scoped = false; this.fov = BASE_FOV;
  this.inspectT = 0; this.drawT = 0; this.anim = {}; this.nerv = 0; this.holdT = 0; this.holdKey = null; this.noteOpen = null;
  this.notesRead = {}; this.phantomT = rnd(60, 110); this.sparkT = rnd(5, 12); this.steamT = 3; this.phoneT = 5; this.danger = 0;
  this.msgT = 0; this.fade = 0; this.headY = 1.62; this.roll = 0; this.lastSync = 0; this.micLevel = 0;
  this.fx = new FX();
  // arma
  var sleeve = this.rc.key === "detective" ? [0.42, 0.32, 0.2] : ROLE_OUTFIT[this.rc.key].shirt;
  this.vm = new GFX.Node({ parent: GFX.vmRoot, s: 0.9 });
  this.vm.flashOff = true;
  this.vms = {};
  for (var k in DATA.WEAPONS) this.vms[k] = new VM(k, this.vm, sleeve);
  this.vmKick = 0; this.sway = [0, 0];
  this.inv = {}; this.order = [];
  this.giveWeapon(this.rc.weapon); this.equip(this.rc.weapon);
  // láser
  this.laserDot = new GFX.Node({ parent: GFX.root, mesh: quadMesh(), tex: "spark", emissive: 1, blend: 2, billboard: true });
  this.laserDot.cs = [2, 0.15, 0.1, 1]; this.laserDot.visible = false;
  var bv = new VB(), w = 0.004;
  bv.quad([[-w, 0, 0], [w, 0, 0], [w, 0, 1], [-w, 0, 1]], [1.6, 0.1, 0.08], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  bv.quad([[0, -w, 0], [0, w, 0], [0, w, 1], [0, -w, 1]], [1.6, 0.1, 0.08], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  this.laserBeam = new GFX.Node({ parent: GFX.root, mesh: bv, tex: "white", emissive: 1, blend: 2 });
  this.laserBeam.cs = [1, 1, 1, 0.35]; this.laserBeam.visible = false;

  this.music = SFX.loop("chase", 0);
  this.loadLevel(this.level, this.seed);
  if (this.mode !== "solo") {
    var self = this;
    VOICE.start(this.net, this.myId).then(function (ok) { if (!ok) self.radioSay("CENTRAL", VOICE.error || "Sin micrófono"); });
  }
  if (this.mode === "host") this.msg("Código de sala: " + this.net.code + "  (también en pausa)", 10);
  else if (this.mode === "client") this.msg("Conectado. No te separes del grupo.", 6);
  showGameUI(true);
  this.ready = true;
}

// ------------------------------------------------------------------ construcción del nivel
Game.prototype.loadLevel = function (level, seed) {
  var t0 = performance.now(), self = this;
  if (this.worldRoot) this.worldRoot.dispose();
  this.levelNodes.forEach(function (n) { n.dispose(); });
  this.levelNodes = [];
  this.pickups.forEach(function (p) { p.n.dispose(); });
  for (var k in this.monsters) this.monsters[k].destroy();
  this.monsters = {};
  this.flaresLive.forEach(function (f) { f.destroy(); }); this.flaresLive = [];
  this.phantoms.forEach(function (p) { p.mv.destroy(); }); this.phantoms = [];
  if (this.door) this.door.destroy();
  this.fx.clear();
  if (this.sim) this.killsCarry = Object.assign({}, this.sim.kills);

  this.level = level; this.seed = seed;
  this.radioQ = []; this.radioT = 0; $("radio").style.display = "none";
  var W = this.world = new World(seed, level), cfg = W.cfg;
  var meshes = W.buildMeshes();
  W.lightmap();
  var root = this.worldRoot = new GFX.Node({ parent: GFX.root });
  var N = function (o) { o.parent = o.parent || root; return new GFX.Node(o); };
  N({ mesh: meshes.floor, tex: cfg.tex[1] }); N({ mesh: meshes.ceil, tex: cfg.tex[2] }); N({ mesh: meshes.wall, tex: cfg.tex[0] });
  if (meshes.base) N({ mesh: meshes.base, tex: "base" });
  if (meshes.pipe) N({ mesh: meshes.pipe, tex: "pipe" });
  if (meshes.crate) N({ mesh: meshes.crate, tex: "crate" });
  N({ mesh: meshes.lamp_on, tex: "lamp", emissive: 1 });
  if (meshes.lamp_dead) N({ mesh: meshes.lamp_dead, tex: "lamp", emissive: 1 });
  this.flickers = meshes.flicker.map(function (f) { return { n: N({ mesh: f[1], tex: "lamp", emissive: 1 }), L: f[0], t: rnd(0, 3), on: true }; });
  this.water = meshes.water ? N({ mesh: meshes.water, tex: "water", blend: 1, tint: 1.15 }) : null;
  this.buildProps();
  this.pickups = W.pickups.map(function (p) {
    var n = new GFX.Node({ parent: GFX.root, x: p[2], z: p[3], ry: p[4], tint: W.lightAt(p[2], p[3]) * 0.6 + 0.1 });
    if (p[1] === "ammo") new GFX.Node({ parent: n, mesh: box(0, 0.09, 0, 0.32, 0.18, 0.2, [1, 1, 1]), tex: "ammo" });
    else if (p[1] === "med") new GFX.Node({ parent: n, mesh: box(0, 0.11, 0, 0.36, 0.22, 0.24, [1, 1, 1]), tex: "med" });
    else { var v = new VB(); box(0, 0.06, 0, 0.3, 0.12, 0.16, [0.7, 0.1, 0.08], 1, v); box(0, 0.125, 0, 0.26, 0.01, 0.12, [0.9, 0.85, 0.2], 1, v); new GFX.Node({ parent: n, mesh: v }); }
    return { id: p[0], kind: p[1], x: p[2], z: p[3], n: n, respawn: 0 };
  });
  this.shotgunN = null;
  if (!this.inv.shotgun) {
    var sp = W.shotgunSpot, sv = new VB();
    box(0, 0, 0, 0.06, 0.07, 1.0, [0.3, 0.3, 0.32], 1, sv); box(0, -0.02, -0.38, 0.05, 0.09, 0.28, [0.45, 0.28, 0.14], 1, sv);
    this.shotgunN = new GFX.Node({ parent: GFX.root, mesh: sv, tex: "metal", x: sp[0], y: 0.06, z: sp[1], ry: sp[2], tint: W.lightAt(sp[0], sp[1]) * 0.6 + 0.15 });
    this.levelNodes.push(this.shotgunN);
  }
  this.noteNodes = W.noteSpots.map(function (s) {
    var n = new GFX.Node({ parent: GFX.root, x: s[0], y: 0.012, z: s[1], ry: s[2], tint: W.lightAt(s[0], s[1]) * 0.6 + 0.2 });
    new GFX.Node({ parent: n, mesh: floorQuad(0, 0, 0.3, 0.4, 0), tex: "paper" });
    self.levelNodes.push(n);
    return n;
  });
  this.notesRead = {};
  this.st = new Story(W, this.story);
  if (this.mode !== "client") { this.sim = new HostSim(W, seed + 1, this.killsCarry, this.story); this.st = this.sim.story; }
  this.buildThings();
  this.door = new ExitDoor(this, W.exit[0], W.exit[1], W.exitRot);
  this.exitOpen = false;
  GFX.globals.fogcol = cfg.fog; GFX.globals.fogdens = cfg.fogd;
  if (this.hum) this.hum.stop();
  this.hum = SFX.loop(cfg.amb, cfg.amb_vol);
  if (this.hum) this.hum.setRate(cfg.amb_rate);
  this.info = { w: 0, ph: "calm", t: cfg.calm, left: 0, ex: false, st: this.st.toJSON() };
  var c = W.collide(W.spawn[0] + rnd(-1, 1), W.spawn[1] + rnd(-1, 1), PLAYER_R);
  this.px = c[0]; this.pz = c[1]; this.vx = this.vz = 0;
  for (var cid in this.remote) { var r = this.remote[cid]; r.x = W.spawn[0]; r.z = W.spawn[1]; r.alive = true; r.lv = null; }
  if (this.story && level < DATA.RADIO_START.length) {
    DATA.RADIO_START[level].forEach(function (l) { self.radioSay(l[0], l[1]); });
    this.radioSay("CENTRAL", "OBJETIVO: " + this.st.text());
  }
  console.log("nivel " + level + " listo en " + Math.round(performance.now() - t0) + "ms");
};

Game.prototype.buildProps = function () {
  var W = this.world, self = this;
  this.cars = []; this.vents = []; this.phones = [];
  var add = function (o) { var n = new GFX.Node(o); n.parent || GFX.root.add(n); self.levelNodes.push(n); return n; };
  W.props.forEach(function (p) {
    var light = W.lightAt(p.x, p.z) * 0.6 + 0.12, n;
    if (p.kind === "car") {
      n = add({ parent: GFX.root, x: p.x, z: p.z, ry: p.rot, tint: light });
      new GFX.Node({ parent: n, mesh: carModel(), tex: "metal" });
      var red = new GFX.Node({ parent: n, mesh: box(-0.3, 1.33, -0.2, 0.5, 0.1, 0.25, [2, 0.15, 0.1]), tex: "white", emissive: 1 });
      var blue = new GFX.Node({ parent: n, mesh: box(0.3, 1.33, -0.2, 0.5, 0.1, 0.25, [0.15, 0.35, 2]), tex: "white", emissive: 1 });
      self.cars.push([red, blue]);
    } else if (p.kind === "cone") {
      n = add({ parent: GFX.root, x: p.x, z: p.z, tint: light });
      var cv = new VB(); box(0, 0.25, 0, 0.26, 0.5, 0.26, [1, 0.4, 0.05], 0.25, cv); box(0, 0.02, 0, 0.36, 0.04, 0.36, [0.15, 0.15, 0.15], 1, cv);
      new GFX.Node({ parent: n, mesh: cv });
    } else if (p.kind === "chalk") {
      n = add({ parent: GFX.root, x: p.x, y: 0.006, z: p.z, ry: p.rot, tint: light + 0.2 });
      new GFX.Node({ parent: n, mesh: floorQuad(0, 0, 1.7, 1.7, 0), tex: "chalk", blend: 1, bias: 1 });
    } else if (p.kind === "desk") {
      n = add({ parent: GFX.root, x: p.x, z: p.z, ry: p.rot, tint: light });
      var dm = deskModel(p.monitor, p.phone);
      new GFX.Node({ parent: n, mesh: dm[0], tex: "wood" }); new GFX.Node({ parent: n, mesh: dm[1], tex: "metal" });
      if (p.monitor) new GFX.Node({ parent: n, mesh: box(0.2, 1.02, 0.095, 0.34, 0.26, 0.01, [0.25, 0.55, 0.45]), tex: "grain", emissive: 1 });
      if (p.phone) self.phones.push([p.x, p.z, false]);
    } else if (p.kind === "lockers") {
      n = add({ parent: GFX.root, x: p.x, z: p.z, ry: p.rot, tint: light });
      new GFX.Node({ parent: n, mesh: lockersModel(), tex: "metal" });
    } else if (p.kind === "puddle") {
      n = add({ parent: GFX.root, x: p.x, y: 0.008, z: p.z, tint: light + 0.3 });
      var pq = new GFX.Node({ parent: n, mesh: floorQuad(0, 0, p.r * 2, p.r * 1.6, 0, [0.6, 0.65, 0.7]), tex: "water", blend: 1, bias: 1 });
      pq.cs = [1, 1, 1, 0.6];
    } else if (p.kind === "vent") {
      n = add({ parent: GFX.root, x: p.x, y: W.h - 0.8, z: p.z, ry: Math.atan2(p.nx, p.nz) * 180 / Math.PI, tint: light });
      var vv = new VB(); box(0, 0, 0.03, 0.5, 0.35, 0.06, [0.3, 0.3, 0.3], 1, vv);
      for (var q = 0; q < 5; q++) box(0, -0.12 + q * 0.06, 0.065, 0.44, 0.015, 0.01, DARK, 1, vv);
      new GFX.Node({ parent: n, mesh: vv, tex: "metal" });
      self.vents.push([p.x + p.nx * 0.2, p.z + p.nz * 0.2, p.nx, p.nz]);
    }
  });
  var cones = W.props.filter(function (p) { return p.kind === "cone"; });
  cones.forEach(function (a, i) {
    var b = cones[(i + 1) % cones.length], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
    var n = add({ parent: GFX.root, x: (a.x + b.x) / 2, y: 0.45, z: (a.z + b.z) / 2, ry: Math.atan2(dx, dz) * 180 / Math.PI + 90, tint: W.lightAt(a.x, a.z) * 0.6 + 0.2 });
    new GFX.Node({ parent: n, mesh: quadXY(L, 0.08), tex: "tape" });
  });
};

Game.prototype.buildThings = function () {
  var self = this;
  this.thingN = {};
  Object.keys(this.st.things).forEach(function (tid) {
    var t = self.st.things[tid];
    var e = new GFX.Node({ parent: GFX.root, x: t.x, z: t.z, ry: rnd(0, 360), tint: self.world.lightAt(t.x, t.z) * 0.6 + 0.15 });
    var body = new GFX.Node({ parent: e }), glow;
    if (t.kind === "item") {
      new GFX.Node({ parent: body, mesh: itemModel(t.what), tex: "metal" });
      glow = new GFX.Node({ parent: e, mesh: floorQuad(0, 0, 0.8, 0.8, 0.02, [1.6, 1.3, 0.4]), tex: "spark", emissive: 1, blend: 2 });
      glow.cs = [1, 1, 1, 0.8];
    } else {
      new GFX.Node({ parent: body, mesh: thingModel(t.what), tex: "metal" });
      var h = { panel: 1.6, valve: 1.3, generator: 1.3 }[t.what];
      glow = new GFX.Node({ parent: e, mesh: box(0.2, h, 0.2, 0.06, 0.06, 0.06, [1.8, 0.2, 0.1]), tex: "white", emissive: 1 });
    }
    self.thingN[tid] = { e: e, body: body, glow: glow, kind: t.kind, what: t.what };
    self.levelNodes.push(e);
  });
};

// ------------------------------------------------------------------ utilidades
Game.prototype.lightAt = function (x, z) { return this.world.lightAt(x, z) * this.power; };
Game.prototype.msg = function (t, d) { $("msg").textContent = t; $("msg").style.opacity = 1; this.msgT = d || 3; };
Game.prototype.radioSay = function (sp, t) { this.radioQ.push([sp, t]); };
Game.prototype.playerInfo = function (pid) {
  if (pid === this.myId) return [this.name, this.rc.key];
  var v = this.scores[String(pid)];
  if (v) return [v[6], roleKey(v[9])];
  var r = this.remote[pid];
  if (r) return [this.names[pid] || "?", roleKey(r.role)];
  return ["?", ROLE_KEYS[0]];
};
Game.prototype.teammateNear = function (d) {
  for (var k in this.avatars) { var a = this.avatars[k]; if (a.alive && hyp(a.x - this.px, a.z - this.pz) < d) return true; }
  return false;
};
Game.prototype.camVecs = function () {
  var D = Math.PI / 180, cy = Math.cos(this.yaw * D), sy = Math.sin(this.yaw * D), cp = Math.cos(this.pitch * D), sp = Math.sin(this.pitch * D);
  var fwd = [sy * cp, sp, cy * cp], right = [cy, 0, -sy];
  var up = [fwd[1] * right[2] - fwd[2] * right[1], fwd[2] * right[0] - fwd[0] * right[2], fwd[0] * right[1] - fwd[1] * right[0]];
  return { fwd: fwd, right: right, up: up, eye: [this.px, this.headY, this.pz] };
};

// ------------------------------------------------------------------ pausa / salir
Game.prototype.togglePause = function () {
  if (this.ending) return;
  this.paused = !this.paused;
  $("pause").style.display = this.paused ? "block" : "none";
  if (this.paused && document.exitPointerLock) document.exitPointerLock();
  var tt = levelTitle(this.level);
  var info = tt[0] + " · " + tt[1];
  if (this.mode === "host") info += "<br>Código de sala: <b style='font-size:22px;letter-spacing:4px'>" + this.net.code + "</b> · jugadores: " + (1 + Object.keys(this.remote).length);
  else if (this.mode === "client") info += "<br>" + (this.disconnected ? "Sin conexión con el host" : "Conectado como " + this.name);
  else info += "<br>Partida en solitario (pausada)";
  $("pinfo").innerHTML = info;
};
Game.prototype.quit = function () {
  try { VOICE.stop(); } catch (e) { }
  try { if (this.net) this.net.close(); } catch (e) { }
  location.reload();
};

// ------------------------------------------------------------------ niveles
Game.prototype.goNextLevel = function (story) {
  if (this.transit) return;
  if (story !== undefined) this.story = story;
  var n = this.level + 1, seed = (Math.random() * 1073741824) | 0;
  if (this.mode === "host") this.net.broadcast({ t: "lvl", n: n, seed: seed, story: this.story });
  this.beginTransit(n, seed);
};
Game.prototype.beginTransit = function (n, seed) {
  this.transit = { stage: "out", t: 0, n: n, seed: seed };
  this.flashOn = false; this.reloading = false; this.scoped = false; INPUT.aim = false; this.closeNote();
  SFX.play("noclip", 1);
};
Game.prototype.updateTransit = function (dt) {
  var tr = this.transit;
  tr.t += dt;
  if (tr.stage === "out") {
    this.fade = Math.min(1, tr.t / 1.2);
    if (tr.t >= 1.3) {
      var tt = levelTitle(tr.n);
      var title = this.story && tr.n < DATA.STORY.length ? "CAPÍTULO " + (tr.n + 1) + " · " + tt[0] : tt[0];
      $("title").textContent = title + "\n" + tt[1];
      tr.stage = "load"; tr.t = 0;
    }
  } else if (tr.stage === "load") {
    if (tr.t > 0.15) {
      this.loadLevel(tr.n, tr.seed);
      for (var k in this.inv) { var w = DATA.WEAPONS[k]; if (w.kind === "gun") this.inv[k].res += w.gain; }
      this.hp = Math.max(this.hp, this.maxhp * 0.7);
      if (!this.alive) { this.alive = true; this.hp = this.maxhp * 0.7; this.roll = 0; this.headY = 1.62; $("center").textContent = ""; }
      this.battery = 1; this.flares = Math.max(this.flares, 1);
      tr.stage = "in"; tr.t = 0;
    }
  } else {
    this.fade = Math.max(0, 1 - tr.t / 2);
    if (tr.t > 2.5) { $("title").textContent = ""; this.msg(this.world.cfg.desc, 5); this.transit = null; }
  }
};
Game.prototype.startEnding = function () {
  if (this.ending) return;
  if (this.mode === "host") this.net.broadcast({ t: "end" });
  this.ending = { t: 0, line: -1 };
  this.flashOn = false; this.scoped = false; INPUT.aim = false;
  SFX.play("door", 0.8);
  if (document.exitPointerLock) document.exitPointerLock();
  $("end").style.display = "block"; $("endbtns").style.display = "none"; $("endtext").textContent = "";
};
Game.prototype.updateEnding = function (dt) {
  var e = this.ending;
  e.t += dt;
  this.fade = Math.min(1, e.t / 2);
  var line = Math.floor((e.t - 2) / 3.6);
  if (line >= 0 && line < DATA.ENDING.length && line !== e.line) {
    e.line = line; $("endtext").textContent = DATA.ENDING[line];
    if (line === DATA.ENDING.length - 2) SFX.play("static", 0.7);
  }
  if (e.t > 2 + 3.6 * DATA.ENDING.length + 1 && $("endbtns").style.display === "none") {
    $("endtext").textContent = this.mode === "client" ? "Esperando que el host decida..." : "";
    $("endbtns").style.display = "flex";
    $("cont").style.display = this.mode === "client" ? "none" : "block";
  }
};
Game.prototype.continueAfterEnd = function () {
  this.ending = null; $("end").style.display = "none";
  this.goNextLevel(false);
};

// ------------------------------------------------------------------ armas
Game.prototype.giveWeapon = function (k) {
  if (this.inv[k]) return false;
  var w = DATA.WEAPONS[k];
  this.inv[k] = { mag: w.mag || 0, res: w.reserve || 0 };
  this.order.push(k);
  return true;
};
Game.prototype.equip = function (k) {
  if (!this.inv[k]) return;
  this.cur = k;
  for (var j in this.vms) this.vms[j].root.visible = j === k;
  this.reloading = false; this.scoped = false; INPUT.aim = false; this.drawT = 0.35; this.inspectT = 0; this.anim = {};
  var h = this.vms[k].hold; this.vm.x = h[0]; this.vm.y = h[1]; this.vm.z = h[2];
  SFX.play(k === "knife" ? "flip" : "magin", 0.4);
  $("b_aim").style.display = DATA.WEAPONS[k].scope ? "flex" : "none";
};
Game.prototype.startReload = function () {
  var w = DATA.WEAPONS[this.cur];
  if (w.kind !== "gun") return;
  var st = this.inv[this.cur];
  if (this.reloading || st.mag >= w.mag || st.res <= 0 || this.cool > 0.2) return;
  this.reloading = true; this.scoped = false; INPUT.aim = false; this.inspectT = 0;
  if (w.reload === "mag") { this.reloadT = w.reload_t; SFX.play("magout", 0.7); this.anim.mag = 0.001; }
  else { this.reloadT = w.reload_t + (this.cur === "revolver" ? 0.3 : 0); if (this.cur === "revolver") SFX.play("cyl", 0.7); }
};
Game.prototype.fire = function () {
  if (this.cool > 0 || this.drawT > 0) return;
  var w = DATA.WEAPONS[this.cur], self = this;
  this.inspectT = 0;
  if (w.kind === "melee") { this.knifeAttack(w); return; }
  var st = this.inv[this.cur];
  if (st.mag <= 0) {
    SFX.play("empty", 0.7); this.cool = 0.25;
    if (st.res > 0) this.startReload(); else this.msg("Sin munición. Buscá cajas rojas.", 2);
    return;
  }
  if (this.reloading) { if (w.reload === "shell") this.reloading = false; else return; }
  st.mag--;
  this.cool = w.rof;
  this.recoil += w.recoil * (this.scoped ? 0.5 : 1);
  this.vmKick = 1; this.shake = Math.min(0.35, 0.05 * w.recoil); this.muzzleT = this.cur === "glock" ? 0.03 : 0.05;
  var vm = this.vms[this.cur];
  if (vm.muzzle) { vm.muzzle.visible = true; vm.muzzle.rz = rnd(0, 360); }
  SFX.play(w.snd, this.cur === "glock" ? 0.8 : 1, rnd(0.95, 1.05));
  if (this.cur === "shotgun") { setTimeout(function () { SFX.play("pump", 0.6); }, 320); this.anim.pump = 0.001; }
  else if (this.cur === "rifle") { setTimeout(function () { SFX.play("bolt", 0.7); }, 300); this.anim.bolt = 0.001; }
  else if (this.cur === "glock") { this.anim.slide = 0.001; this.eject(); }
  else if (this.cur === "revolver") this.anim.cyl = 0.001;
  var cv = this.camVecs(), o = cv.eye, f = cv.fwd, r = cv.right, u = cv.up;
  var spread = w.spread;
  if (w.scope) spread = (this.scoped && this.fov < 45) ? w.zspread : w.spread;
  if (this.rc.key === "novato") spread += 0.035 * this.nerv;
  var dmgBy = {}, heads = false;
  for (var k = 0; k < w.pellets; k++) {
    var ang = rnd(0, 6.283), rad = Math.sqrt(Math.random()) * spread;
    var d = norm3([f[0] + r[0] * Math.cos(ang) * rad + u[0] * Math.sin(ang) * rad, f[1] + r[1] * Math.cos(ang) * rad + u[1] * Math.sin(ang) * rad,
      f[2] + r[2] * Math.cos(ang) * rad + u[2] * Math.sin(ang) * rad]);
    var hw = this.world.raycast3d(o, d, 120), best = null;
    for (var id in this.monsters) {
      var mv = this.monsters[id];
      if (mv.state === 3) continue;
      var t = rayCyl(o, d, mv.x, mv.z, MONSTER_R, mv.height);
      if (t !== null && t < hw[0] && (!best || t < best[0])) best = [t, mv];
    }
    if (best) {
      var tt = best[0], m = best[1], hy = o[1] + d[1] * tt, head = hy > m.height * 0.84;
      var fa = w.falloff[0], fb = w.falloff[1], fall = tt < fa ? 1 : Math.max(0.2, 1 - (tt - fa) / (fb - fa));
      var dmg = w.dmg * fall * (head ? (this.cur === "rifle" ? 2 : 1.6) : 1);
      if (head) heads = true;
      dmgBy[m.id] = (dmgBy[m.id] || 0) + dmg;
      for (var b = 0; b < (w.pellets > 1 ? 2 : 5); b++)
        this.fx.particle([o[0] + d[0] * tt, hy, o[2] + d[2] * tt], [rnd(-1, 1) - d[0], rnd(0, 1.5), rnd(-1, 1) - d[2]], 0.5, 0.06, 0.2, "blood", [0.25, 0.2, 0.18], { grav: 6 });
    } else if (hw[2] !== "none") {
      var hp = [o[0] + d[0] * hw[0], o[1] + d[1] * hw[0], o[2] + d[2] * hw[0]], n = hw[1];
      this.fx.decal(hp, n, "hole", rnd(0.04, 0.07));
      if (k % 3 === 0) this.fx.particle(hp, [n[0] * 0.6, 0.3 + n[1] * 0.6, n[2] * 0.6], 0.9, 0.08, 0.5, "smoke", [0.9, 0.85, 0.7]);
      if (k % 4 === 0) this.fx.particle(hp, n, 0.08, 0.1, 0.02, "spark", [1.5, 1.2, 0.7], { emissive: true, add: true });
    }
  }
  if (vm.muzzle && this.cur !== "glock") {
    var mp = vm.muzzle.worldPos();
    this.fx.particle(mp, [f[0] * 0.8, 0.25, f[2] * 0.8], 1.2, 0.06, 0.5, "smoke", [0.8, 0.78, 0.72]);
  }
  Object.keys(dmgBy).forEach(function (mid) {
    var m = self.monsters[mid];
    if (m) { m.flinch = 1; self.fx.decal([m.x + f[0] * 0.6 + rnd(-.3, .3), 0, m.z + f[2] * 0.6 + rnd(-.3, .3)], [0, 1, 0], "blood", rnd(0.4, 0.8)); }
    self.hitMonster(+mid, dmgBy[mid]);
  });
  if (heads) SFX.play("mhit", 0.5, 1.3);
  this.onFire(w.noise);
};
Game.prototype.eject = function (delay) {
  var self = this;
  var go = function () {
    var vm = self.vms[self.cur];
    if (!vm || !vm.eject) return;
    var p = vm.eject.worldPos(), r = self.camVecs().right;
    self.fx.casing(p, [r[0] * 1.8 + rnd(-.3, .3), 1.6 + rnd(0, 0.6), r[2] * 1.8 + rnd(-.3, .3)]);
  };
  if (delay) setTimeout(go, delay * 1000); else go();
};
Game.prototype.knifeAttack = function (w) {
  this.cool = w.rof; this.anim.stab = 0.001;
  SFX.play("swish", 0.7, rnd(0.9, 1.15));
  var D = Math.PI / 180, fx = Math.sin(this.yaw * D), fz = Math.cos(this.yaw * D), best = null;
  for (var id in this.monsters) {
    var m = this.monsters[id];
    if (m.state === 3) continue;
    var dx = m.x - this.px, dz = m.z - this.pz, d = hyp(dx, dz);
    if (d < w.range && d > 1e-3 && (dx * fx + dz * fz) / d > 0.55 && (!best || d < best[0])) best = [d, m];
  }
  if (!best) return;
  var dd = best[0], mv = best[1], mr = mv.rot * D;
  var back = (Math.sin(mr) * (this.px - mv.x) / dd + Math.cos(mr) * (this.pz - mv.z) / dd) < -0.2;
  SFX.play("stab", 0.9);
  for (var k = 0; k < 6; k++) this.fx.particle([mv.x, 1.4, mv.z], [rnd(-1, 1), rnd(0, 1.5), rnd(-1, 1)], 0.5, 0.06, 0.2, "blood", [0.25, 0.2, 0.18], { grav: 6 });
  mv.flinch = 1;
  if (back) this.msg("¡Por la espalda!", 1.2);
  this.hitMonster(mv.id, back ? w.back : w.dmg);
};
Game.prototype.throwFlare = function () {
  if (this.flares <= 0) { this.msg("No te quedan bengalas", 1.5); return; }
  this.flares--;
  var cv = this.camVecs(), f = cv.fwd;
  SFX.play("flare", 0.6, 1.2);
  this.flaresLive.push(new Flare(this, [this.px + f[0] * 0.4, this.headY - 0.1, this.pz + f[2] * 0.4], [f[0] * 9, f[1] * 9 + 2.5, f[2] * 9], false, true));
};
Game.prototype.flareLanded = function (fl) {
  if (!fl.mine) return;
  var x = +fl.pos[0].toFixed(2), z = +fl.pos[2].toFixed(2);
  if (this.sim) { this.sim.addLure(x, z, 11); this.pending.push(["flare", this.myId, x, z]); }
  else if (this.net && !this.disconnected) this.net.send({ t: "flare", x: x, z: z, lv: this.level });
};
Game.prototype.hitMonster = function (mid, dmg) {
  dmg = Math.round(dmg * 10) / 10;
  if (this.sim) this.sim.damage(mid, dmg, this.myId);
  else if (this.net && !this.disconnected) this.net.send({ t: "hit", m: mid, d: dmg, lv: this.level });
};
Game.prototype.onFire = function (noise) {
  if (this.sim) { if (noise > 0) this.sim.alert(this.px, this.pz, noise); this.pending.push(["shot", this.myId, this.cur]); }
  else if (this.net && !this.disconnected) this.net.send({ t: "fire", lv: this.level, n: noise, w: this.cur });
};

// ------------------------------------------------------------------ interacción
Game.prototype.interactTarget = function () {
  var best = null, self = this;
  for (var k in this.avatars) {
    var av = this.avatars[k];
    if (!av.alive && !av.doppel) {
      var d = hyp(av.x - this.px, av.z - this.pz);
      if (d < 1.8 && (!best || d < best[0])) best = [d, "rev", +k, "Mantené USAR para levantar a " + av.name, 2.5];
    }
  }
  if (this.st) Object.keys(this.st.things).forEach(function (tid) {
    var t = self.st.things[tid];
    if (t.kind === "thing" && self.st.canUse(tid)) {
      var d = hyp(t.x - self.px, t.z - self.pz);
      if (d < 2.0 && (!best || d < best[0])) best = [d, "use", tid, "Mantené USAR: " + t.name, 3.0];
    }
  });
  this.noteNodes.forEach(function (n, i) {
    var d = hyp(n.x - self.px, n.z - self.pz);
    if (d < 1.6 && (!best || d < best[0])) best = [d, "note", i, "Tocá USAR: leer expediente" + (self.notesRead[i] ? " (leído)" : ""), 0];
  });
  return best;
};
Game.prototype.openNote = function (i) {
  var notes = DATA.NOTES[this.level % DATA.NOTES.length], n = notes[i % notes.length];
  $("notet").textContent = n[0]; $("noteb").textContent = n[1];
  $("note").style.display = "block";
  this.noteOpen = i; this.notesRead[i] = true;
  SFX.play("pickup", 0.4, 0.7);
};
Game.prototype.closeNote = function () { $("note").style.display = "none"; this.noteOpen = null; };
Game.prototype.updateInteract = function (dt) {
  $("prompt").textContent = ""; $("prog").style.display = "none";
  if (!this.alive || this.transit) { this.holdT = 0; return; }
  var t = this.interactTarget();
  if (INPUT.took("useP") && t && t[1] === "note") { if (this.noteOpen === null) this.openNote(t[2]); else this.closeNote(); return; }
  if (!t) { this.holdT = 0; this.holdKey = null; return; }
  $("prompt").textContent = t[3];
  if (t[4] <= 0) return;
  if (INPUT.use) {
    var key = t[1] + ":" + t[2];
    if (this.holdKey !== key) { this.holdKey = key; this.holdT = 0; }
    this.holdT += dt;
    $("prog").style.display = "block"; $("prog").firstChild.style.width = Math.min(100, this.holdT / t[4] * 100) + "%";
    if (this.holdT >= t[4]) {
      this.holdT = 0; this.holdKey = null;
      if (t[1] === "rev") this.sendRevive(t[2]); else this.sendUse(t[2]);
    }
  } else { this.holdT = 0; this.holdKey = null; }
};
Game.prototype.sendUse = function (tid) {
  if (this.sim) this.sim.useThing(tid, this.myId);
  else if (this.net && !this.disconnected) this.net.send({ t: "use", id: tid, lv: this.level });
};
Game.prototype.sendRevive = function (pid) {
  SFX.play("rattle", 0.8);
  if (this.sim) { var ev = ["rev", pid, this.myId]; this.pending.push(ev); this.handleEvent(ev); }
  else if (this.net && !this.disconnected) this.net.send({ t: "rev", p: pid, lv: this.level });
};

// ------------------------------------------------------------------ eventos
Game.prototype.handleEvent = function (e) {
  var kind = e[0], self = this;
  var mv = (["growl", "scream", "swing", "mhit", "mdie", "reveal", "mimic"].indexOf(kind) >= 0) ? this.monsters[e[1]] : null;
  var pos = mv ? [mv.x, mv.z] : null;
  switch (kind) {
    case "hurt":
      if (e[1] === this.myId && this.alive && !this.transit && !this.ending) this.takeDamage(e[2]);
      var m2 = this.monsters[e[3]];
      if (m2) SFX.play("swipe", 0.8, 1, [m2.x, m2.z]);
      break;
    case "growl": if (pos) SFX.play("growl", 0.9, rnd(0.8, 1.15) * (mv.height < 2.3 ? 1.2 : 1), pos, 40); break;
    case "scream": if (pos) SFX.play("scream", 1, rnd(0.9, 1.1), pos, 50); break;
    case "swing": if (mv) { mv.swing = 0.5; SFX.play("swipe", 0.6, 1, pos); } break;
    case "mhit": if (pos) { SFX.play("mhit", 0.8, rnd(0.85, 1.1), pos); mv.flinch = 1; } break;
    case "mdie":
      if (pos) SFX.play("mdie", 1, rnd(0.9, 1.1) * (mv.kind === 1 ? 0.7 : 1), pos, 45);
      if (e[2] === this.myId) { this.kills++; this.msg(mv && mv.kind === 1 ? "Doppelgänger abatido" : "Entidad abatida", 1.5); }
      break;
    case "reveal":
      if (mv) { mv.reveal(); SFX.play("scream", 1, 0.75, pos, 60); }
      var rl = pick(DATA.RADIO_EVENTS.reveal); this.radioSay(rl[0], rl[1]);
      break;
    case "mimic": this.doMimic(mv, e[2]); break;
    case "wave": this.msg("OLEADA " + e[1] + " · se acercan", 4); SFX.play("scream", 0.35, 0.7); break;
    case "clear":
      for (var k in this.inv) { var w = DATA.WEAPONS[k]; if (w.kind === "gun") this.inv[k].res += Math.max(2, (w.gain / 2) | 0); }
      this.msg("Oleada " + e[1] + " superada · +munición", 4);
      break;
    case "obj":
      this.msg("OBJETIVO: " + this.st.text(), 5); SFX.play("beep", 0.6);
      if (this.story) { var l = (DATA.RADIO_OBJ[this.st.step().type] || [])[0]; if (l) this.radioSay(l[0], l[1]); }
      break;
    case "use":
      var th = this.st && this.st.things[e[1]];
      if (th) { SFX.play(th.kind === "item" ? "pickup" : "door", 0.8, 1, [th.x, th.z], 60); this.msg(this.playerInfo(e[2])[0] + ": " + th.name, 3); }
      break;
    case "exit":
      SFX.play("door", 1, 1, this.world.exit, 200); SFX.play("door", 0.5);
      this.msg("SE ABRIÓ LA SALIDA · seguí la flecha verde", 6);
      if (this.story) DATA.RADIO_OBJ.exit.forEach(function (l) { self.radioSay(l[0], l[1]); });
      break;
    case "shot":
      if (e[1] !== this.myId) {
        var av = this.avatars[e[1]], wk = DATA.WEAPONS[e[2]] ? e[2] : "shotgun";
        if (av) {
          var d = hyp(av.x - this.px, av.z - this.pz), snd = DATA.WEAPONS[wk].snd;
          if (snd === "sup") SFX.play("sup", 0.5, 1, [av.x, av.z], 18);
          else if (snd !== "swish") SFX.play(d < 14 ? snd : "shot_far", 0.85, rnd(0.95, 1.05), [av.x, av.z], 80);
          if (snd !== "swish") av.muzzle();
        }
      }
      break;
    case "flare":
      if (e[1] !== this.myId) this.flaresLive.push(new Flare(this, [e[2], 0.03, e[3]], [0, 0, 0], true, false));
      break;
    case "rev":
      if (e[1] === this.myId && !this.alive && !this.transit) {
        this.alive = true; this.hp = this.maxhp * 0.5; this.roll = 0; this.headY = 1.62; $("center").textContent = "";
        SFX.play("rattle", 1); this.msg(this.playerInfo(e[2])[0] + " te juntó los huesos", 3);
      } else if (e[2] !== this.myId) SFX.play("rattle", 0.7);
      break;
    case "join": this.msg(e[2] + " entró a los Backrooms", 3); break;
    case "left": this.msg(e[2] + " se perdió...", 3); break;
  }
};
Game.prototype.doMimic = function (mv, copy) {
  if (!mv) return;
  if (copy === this.myId && VOICE.ok) {
    var ph = VOICE.randomPhrase();
    if (ph) {
      var data = VOICE.encodeClip(ph), msg = { t: "clip", m: mv.id, d: data };
      if (this.mode === "host") { this.net.broadcast(msg); VOICE.playClip(ph, [mv.x, mv.z]); }
      else if (this.net) this.net.send(msg);
      return;
    }
  }
  if (VOICE.ok && copy !== this.myId) return;   // el copiado manda su voz; si no habló, llega texto
  var info = this.playerInfo(copy), short = DATA.ROLES[ROLE_KEYS.indexOf(info[1])].short;
  this.radioSay(short, pick(DATA.RADIO_EVENTS.doppel_fake));
};
Game.prototype.takeDamage = function (dmg) {
  this.hp -= dmg; this.hurtFlash = 1; this.shake = 0.4; this.lastHurt = 0;
  SFX.play("hurt", 0.9);
  if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) { }
  if (this.hp <= 0) {
    this.hp = 0; this.alive = false; this.deaths++; this.flashOn = false; this.reloading = false; this.scoped = false; INPUT.aim = false;
    SFX.play("rattle", 1);
    this.deadSolo = this.mode === "solo" || Object.keys(this.avatars).length === 0;
    this.deadT = this.deadSolo ? 8 : 30;
  }
};
Game.prototype.respawn = function () {
  var W = this.world, best = null, self = this;
  for (var i = 0; i < 40; i++) {
    var L = pick(W.lights);
    if (L.kind !== 0) continue;
    var d = 99;
    for (var k in this.monsters) { var m = this.monsters[k]; if (m.state !== 3) d = Math.min(d, hyp(L.x - m.x, L.z - m.z)); }
    if (!best || d > best[0]) best = [d, L.x, L.z];
  }
  var p = best ? [best[1], best[2]] : W.spawn, c = W.collide(p[0] + rnd(-.8, .8), p[1] + rnd(-.8, .8), PLAYER_R);
  this.px = c[0]; this.pz = c[1]; this.hp = this.maxhp; this.alive = true; this.roll = 0; this.headY = 1.62;
  for (var k2 in this.inv) { var w = DATA.WEAPONS[k2]; if (w.kind === "gun") { this.inv[k2].mag = w.mag; this.inv[k2].res = Math.max(this.inv[k2].res, w.mag * 2); } }
  this.battery = Math.max(this.battery, 0.5);
  $("center").textContent = "";
  this.msg("Te rearmaste en otra habitación...", 3);
};

// ------------------------------------------------------------------ red
Game.prototype.netHost = function () {
  var self = this;
  this.net.poll().forEach(function (it) {
    var cid = it[0], m = it[1], t = m.t, r = self.remote[cid];
    if (t === "hello") {
      var name = String(m.name || "Jugador").slice(0, 14);
      self.names[cid] = name;
      self.remote[cid] = { x: self.world.spawn[0], z: self.world.spawn[1], yaw: 0, pitch: 0, hp: 100, alive: true, deaths: 0, lv: null, role: (+m.role || 0) % 4, rad: 0, l: 0 };
      self.net.send(cid, { t: "welcome", id: cid, seed: self.seed, lvl: self.level, v: PROTO, story: self.story });
      var ev = ["join", cid, name]; self.pending.push(ev); self.handleEvent(ev);
    } else if (t === "p") {
      if (r && m.lv === self.level && !self.transit) {
        r.lv = self.level;
        ["x", "z", "yaw", "pitch", "hp", "alive", "deaths", "rad", "l"].forEach(function (k) { if (k in m) r[k] = m[k]; });
        if (self.sim && r.l > 0.06 && r.alive) self.sim.alert(r.x, r.z, 6 + Math.min(r.l, 0.3) * 60, 6);
      }
    } else if (t === "hit") { if (m.lv === self.level && self.sim) self.sim.damage(+m.m, +m.d, cid); }
    else if (t === "fire") {
      if (m.lv !== self.level) return;
      var n = Math.max(0, Math.min(40, +m.n || 0));
      if (r && self.sim && n > 0) self.sim.alert(r.x, r.z, n);
      var ev2 = ["shot", cid, String(m.w || "shotgun")]; self.pending.push(ev2); self.handleEvent(ev2);
    } else if (t === "use") { if (m.lv === self.level && self.sim) self.sim.useThing(String(m.id), cid); }
    else if (t === "rev") { if (m.lv === self.level) { var ev3 = ["rev", +m.p, cid]; self.pending.push(ev3); self.handleEvent(ev3); } }
    else if (t === "flare") {
      if (m.lv === self.level && self.sim) { self.sim.addLure(+m.x, +m.z, 11); var ev4 = ["flare", cid, +m.x, +m.z]; self.pending.push(ev4); self.handleEvent(ev4); }
    } else if (t === "clip") {
      self.net.broadcast({ t: "clip", m: m.m, d: m.d });
      self.playClipMsg(m);
    } else if (t === "bye") {
      var nm = self.names[cid] || "?";
      delete self.remote[cid]; self.net.drop(cid);
      if (self.avatars[cid]) { self.avatars[cid].destroy(); delete self.avatars[cid]; }
      var ev5 = ["left", cid, nm]; self.pending.push(ev5); self.handleEvent(ev5);
    }
  });
};
Game.prototype.playClipMsg = function (m) {
  var mv = this.monsters[m.m];
  if (!mv || !m.d) return;
  try { VOICE.playClip(VOICE.decodeClip(m.d), [mv.x, mv.z]); } catch (e) { }
};
Game.prototype.playersTable = function () {
  var kills = this.sim ? this.sim.kills : {}, tbl = {};
  tbl[this.myId] = [+this.px.toFixed(2), +this.pz.toFixed(2), +this.yaw.toFixed(1), +this.pitch.toFixed(1), this.hp | 0, this.alive, this.name,
    kills[this.myId] || 0, this.deaths, this.role, VOICE.radio && VOICE.talking ? 1 : 0];
  for (var cid in this.remote) {
    var r = this.remote[cid];
    tbl[cid] = [r.x, r.z, r.yaw, r.pitch, r.hp, r.alive, this.names[cid] || "?", kills[cid] || 0, r.deaths || 0, r.role, r.rad || 0];
  }
  return tbl;
};
Game.prototype.netClient = function () {
  var self = this;
  this.net.poll().forEach(function (m) {
    var t = m.t;
    if (t === "s") {
      if (m.lv !== self.level || self.transit || self.ending) return;
      self.info = m.i || self.info;
      if (self.st && self.info.st) self.st.load(self.info.st);
      self.scores = m.p || {};
      self.applyMonsters(m.m || []);
      var seen = {};
      Object.keys(self.scores).forEach(function (k) {
        var pid = +k;
        if (pid === self.myId) return;
        seen[pid] = 1; self.updateAvatar(pid, self.scores[k]);
      });
      Object.keys(self.avatars).forEach(function (pid) { if (!seen[pid]) { self.avatars[pid].destroy(); delete self.avatars[pid]; } });
      (m.e || []).forEach(function (e) { self.handleEvent(e); });
    } else if (t === "lvl") {
      self.story = m.story !== undefined ? !!m.story : self.story;
      if (self.ending) { self.ending = null; $("end").style.display = "none"; }
      if (!self.transit) self.beginTransit(+m.n, +m.seed);
      else { self.transit.n = +m.n; self.transit.seed = +m.seed; }
    } else if (t === "end") self.startEnding();
    else if (t === "clip") self.playClipMsg(m);
  });
  if (!this.net.alive && !this.disconnected) { this.disconnected = true; this.msg("Se perdió la conexión con el host", 8); }
};
Game.prototype.updateAvatar = function (pid, v) {
  var av = this.avatars[pid];
  if (!av) { av = this.avatars[pid] = new AvatarView(this, pid, v[6], roleKey(v[9])); }
  var was = av.alive;
  av.setTarget(v[0], v[1], v[2], v[3], v[5]);
  av.radio = !!v[10];
  if (was && !av.alive) { var l = pick(DATA.RADIO_EVENTS.down); this.radioSay(l[0], l[1]); }
};
Game.prototype.applyMonsters = function (snap) {
  var seen = {}, self = this;
  snap.forEach(function (en) {
    var mid = en[0], kind = en[6] || 0, copy = en[7] === undefined ? -1 : en[7];
    seen[mid] = 1;
    var mv = self.monsters[mid];
    if (!mv) mv = self.monsters[mid] = kind === 1 ? new DoppelView(self, mid, en[1], en[2], en[3], copy) : new MonsterView(self, mid, en[1], en[2], en[3]);
    mv.setTarget(en[1], en[2], en[3], en[4]);
  });
  Object.keys(this.monsters).forEach(function (mid) { if (!seen[mid]) { self.monsters[mid].destroy(); delete self.monsters[mid]; } });
};
Game.prototype.updateVoice = function (dt) {
  if (!VOICE.ok) return;
  VOICE.radio = INPUT.radio && this.alive;
  VOICE.update(dt);
  this.lastSync -= dt;
  if (this.lastSync <= 0) {
    this.lastSync = 1;
    var ids = Object.keys(this.mode === "host" ? this.remote : this.scores).map(Number);
    if (this.mode === "host") ids.push(this.myId);
    VOICE.sync(ids);
  }
  if (this.mode === "host" && this.sim && VOICE.level > 0.06 && this.alive) this.sim.alert(this.px, this.pz, 6 + Math.min(VOICE.level, 0.3) * 60, 6);
  var cv = this.camVecs();
  for (var pid in this.avatars) {
    var av = this.avatars[pid], dx = av.x - this.px, dz = av.z - this.pz, d = hyp(dx, dz);
    var g = Math.pow(Math.max(0, 1 - d / 28), 1.4);
    if (d > 2 && !this.world.los(this.px, this.pz, av.x, av.z)) g *= 0.45;
    var pan = d > 0.01 ? Math.max(-0.8, Math.min(0.8, (dx * cv.right[0] + dz * cv.right[2]) / d)) : 0;
    VOICE.setPeer(+pid, g * 1.4, pan, av.radio);
    var P = VOICE.peers[pid];
    av.speaking = !!(P && P.gain && (av.radio || g > 0.05));
  }
};

// ------------------------------------------------------------------ bucle
Game.prototype.update = function (dt) {
  if (!this.ready) return;
  if (INPUT.took("pause")) { if (this.noteOpen !== null) this.closeNote(); else this.togglePause(); }
  if (this.mode === "host") this.netHost(); else if (this.mode === "client") this.netClient();
  this.updateVoice(dt);
  if (this.ending) { this.updateEnding(dt); this.render(); return; }
  if (this.transit) {
    this.updateTransit(dt);
    if (this.transit && this.transit.stage !== "in") { this.render(); return; }
  }
  var self = this;
  var simOn = this.sim && !(this.paused && this.mode === "solo") && !this.transit;
  if (simOn) {
    var players = {};
    players[this.myId] = [this.px, this.pz, this.alive];
    for (var cid in this.remote) { var r = this.remote[cid]; if (r.lv === this.level) players[cid] = [r.x, r.z, r.alive]; }
    var evs = this.sim.update(dt, players);
    var tbl = this.playersTable(); this.scores = {};
    Object.keys(tbl).forEach(function (k) { self.scores[String(k)] = tbl[k]; });
    this.applyMonsters(this.sim.snapshot());
    evs.forEach(function (e) { self.handleEvent(e); });
    this.pending = this.pending.concat(evs);
    this.info = this.sim.info();
    if (this.mode === "host") for (var c2 in this.remote) {
      var r2 = this.remote[c2];
      this.updateAvatar(+c2, [r2.x, r2.z, r2.yaw, r2.pitch, r2.hp, r2.alive, this.names[c2] || "?", 0, 0, r2.role, r2.rad]);
    }
    if (this.sim.exitOpen()) {
      var ex = this.world.exit;
      for (var pid in players) {
        var pl = players[pid];
        if (pl[2] && hyp(pl[0] - ex[0], pl[1] - ex[1]) < 1.1) { if (this.st.isFinal()) this.startEnding(); else this.goNextLevel(); break; }
      }
    }
  }
  this.tnet -= dt;
  if (this.tnet <= 0) {
    this.tnet = 0.08;
    if (this.mode === "host") {
      if (!this.transit && !this.ending) this.net.broadcast({ t: "s", lv: this.level, m: this.sim.snapshot(), i: this.info, p: this.playersTable(), e: this.pending });
      this.pending = [];
    } else if (this.mode === "client" && !this.disconnected) {
      if (!this.transit) this.net.send({ t: "p", lv: this.level, x: +this.px.toFixed(2), z: +this.pz.toFixed(2), yaw: +this.yaw.toFixed(1),
        pitch: +this.pitch.toFixed(1), hp: this.hp | 0, alive: this.alive, deaths: this.deaths, rad: VOICE.radio && VOICE.talking ? 1 : 0,
        l: +(VOICE.level || 0).toFixed(3) });
    } else this.pending = [];
  }
  if (this.ending) { this.render(); return; }
  this.exitOpen = !!this.info.ex;
  if (this.door) { this.door.setOpen(this.exitOpen); this.door.update(dt); }
  if (!this.paused && !this.transit) { this.handleInput(); this.updatePlayer(dt); this.updateInteract(dt); }
  this.updateWeapon(dt);
  for (var mid in this.monsters) this.monsters[mid].update(dt);
  for (var aid in this.avatars) this.avatars[aid].update(dt);
  this.flaresLive = this.flaresLive.filter(function (f) { f.update(dt); if (f.landed && f.life <= 0) { f.destroy(); return false; } return true; });
  this.fx.update(dt);
  this.updateThings(dt);
  this.updateWorld(dt);
  this.updateScripted(dt);
  this.updateHud(dt);
  this.render();
};

Game.prototype.handleInput = function () {
  if (this.noteOpen !== null) { INPUT.took("useP"); return; }
  if (!this.alive) return;
  if (INPUT.fire) this.fire();
  if (DATA.WEAPONS[this.cur].scope) this.scoped = !!INPUT.aim; else this.scoped = false;
  if (INPUT.took("reload")) this.startReload();
  if (INPUT.took("flare")) this.throwFlare();
  if (INPUT.took("light") && this.battery > 0.02) { this.flashOn = !this.flashOn; SFX.play("empty", 0.5, 1.6); }
  if (INPUT.took("mute")) VOICE.muted = !VOICE.muted;
  if (INPUT.took("insp") && this.inspectT <= 0 && !this.reloading) { this.inspectT = 1.8; if (this.cur === "knife") SFX.play("flip", 0.7); }
  var sw = INPUT.took("swap");
  if (sw && this.order.length > 1) this.equip(this.order[(this.order.indexOf(this.cur) + 1) % this.order.length]);
  if (INPUT.took("w1")) this.equip(this.order[0]);
  if (INPUT.took("w2") && this.order[1]) this.equip(this.order[1]);
};

Game.prototype.updatePlayer = function (dt) {
  var W = this.world, self = this;
  if (this.alive) {
    var sens = INPUT.sens * (this.scoped ? 0.35 : 1);
    this.yaw += INPUT.lookX * sens; this.pitch -= INPUT.lookY * sens;
    this.pitch = Math.max(-85, Math.min(85, this.pitch));
    var fw = INPUT.mz, st = INPUT.mx, L = Math.hypot(fw, st);
    if (L > 1) { fw /= L; st /= L; L = 1; }
    var sprint = INPUT.sprint && fw > 0.3 && this.stamina > 0.05 && !this.scoped;
    var speed = (sprint ? 5.6 : 3.1) * this.rc.speed * (this.reloading ? 0.8 : 1) * (this.scoped ? 0.5 : 1) * (this.water ? 0.85 : 1);
    var yr = this.yaw * Math.PI / 180;
    var ix = (Math.sin(yr) * fw + Math.cos(yr) * st) * speed, iz = (Math.cos(yr) * fw - Math.sin(yr) * st) * speed;
    var k = Math.min(1, dt * (L > 0.05 ? 10 : 8));
    this.vx += (ix - this.vx) * k; this.vz += (iz - this.vz) * k;
    var c = W.collide(this.px + this.vx * dt, this.pz + this.vz * dt, PLAYER_R);
    var moved = hyp(c[0] - this.px, c[1] - this.pz);
    this.px = c[0]; this.pz = c[1];
    this.stamina = sprint && L > 0.05 ? Math.max(0, this.stamina - dt / 5) : Math.min(1, this.stamina + dt / 7);
    var sp = moved / Math.max(dt, 1e-4);
    this.bob += dt * sp * 2.1; this.stepD += moved;
    if (this.stepD > (sprint ? 2 : 1.6)) {
      this.stepD = 0;
      var quiet = this.rc.key === "detective" ? 0.5 : 1;
      if (this.water) SFX.play("drip", 0.25 * quiet, rnd(1.6, 2.2));
      SFX.play("step" + (Math.random() * 4 | 0), (sprint ? 0.5 : 0.35) * quiet, rnd(0.9, 1.1));
    }
    this.lastHurt += dt;
    if (this.lastHurt > 7 && this.hp < this.maxhp * 0.5) this.hp = Math.min(this.maxhp * 0.5, this.hp + dt * 3);
    this.pickups.forEach(function (p) {
      if (p.respawn > 0 || Math.abs(p.x - self.px) > 0.9 || Math.abs(p.z - self.pz) > 0.9) return;
      if (p.kind === "ammo") {
        var got = false;
        for (var k in self.inv) { var w = DATA.WEAPONS[k]; if (w.kind === "gun" && self.inv[k].res < w.reserve * 3) { self.inv[k].res += w.gain; got = true; } }
        if (!got) return;
        self.msg("+munición", 1.5);
      } else if (p.kind === "med" && self.hp < self.maxhp) { self.hp = Math.min(self.maxhp, self.hp + 45); self.msg("+45 salud", 1.5); }
      else if (p.kind === "flare" && self.flares < 5) { self.flares++; self.msg("+1 bengala", 2); }
      else return;
      SFX.play("pickup", 0.7); p.respawn = 45; p.n.visible = false;
    });
    if (this.shotgunN && hyp(this.shotgunN.x - this.px, this.shotgunN.z - this.pz) < 1.1) {
      this.giveWeapon("shotgun"); this.shotgunN.visible = false; this.shotgunN = null;
      this.equip("shotgun"); SFX.play("pump", 0.8);
      this.msg("Encontraste una ESCOPETA · botón ARMA para cambiar", 4);
    }
    if (this.st) Object.keys(this.st.things).forEach(function (tid) {
      var t = self.st.things[tid];
      if (t.kind === "item" && self.st.canUse(tid) && hyp(t.x - self.px, t.z - self.pz) < 1.1 && !self._sentUse) {
        self.sendUse(tid); self._sentUse = 0.5;
      }
    });
    if (this._sentUse) { this._sentUse -= dt; if (this._sentUse <= 0) this._sentUse = 0; }
    this.headY = 1.62 + Math.sin(this.bob) * 0.035 * Math.min(1, sp / 3);
    this.roll = 0;
  } else {
    this.deadT -= dt;
    this.headY = Math.max(0.25, this.headY - dt * 3);
    this.roll = Math.min(70, this.roll + dt * 120);
    this.vx = this.vz = 0;
    if (this.deadT <= 0) this.respawn();
  }
  INPUT.lookX = INPUT.lookY = 0;
  this.pickups.forEach(function (p) { if (p.respawn > 0) { p.respawn -= dt; if (p.respawn <= 0) p.n.visible = true; } });
  this.recoil = Math.max(0, this.recoil - dt * 18);
  this.shake = Math.max(0, this.shake - dt);
  var n = 0;
  for (var id in this.monsters) { var m = this.monsters[id]; if ((m.state === 1 || m.state === 2) && hyp(m.x - this.px, m.z - this.pz) < 12) n++; }
  var tgt = this.rc.key === "novato" ? Math.min(1, n * 0.35) * (this.teammateNear(6) ? 0.35 : 1) : 0;
  this.nerv += (tgt - this.nerv) * Math.min(1, dt * 2);
  if (this.flashOn) { this.battery -= dt / 150; if (this.battery <= 0) { this.battery = 0; this.flashOn = false; this.msg("La linterna se quedó sin batería", 2); } }
  else this.battery = Math.min(1, this.battery + dt / 90);
};

Game.prototype.updateWeapon = function (dt) {
  var w = DATA.WEAPONS[this.cur], vmo = this.vms[this.cur], self = this;
  if (this.cool > 0) this.cool -= dt;
  if (this.drawT > 0) this.drawT -= dt;
  if (this.inspectT > 0) this.inspectT -= dt;
  if (this.reloading) {
    var st = this.inv[this.cur];
    this.reloadT -= dt;
    if (this.reloadT <= 0) {
      if (w.reload === "mag") {
        var take = Math.min(w.mag - st.mag, st.res);
        st.mag += take; st.res -= take; SFX.play("magin", 0.8); this.reloading = false;
        if (this.cur === "rifle") { setTimeout(function () { SFX.play("bolt", 0.6); }, 150); this.anim.bolt = 0.001; }
      } else {
        if (st.mag < w.mag && st.res > 0) { st.mag++; st.res--; SFX.play("shell", 0.7, rnd(0.95, 1.05)); }
        if (st.mag >= w.mag || st.res <= 0) {
          this.reloading = false;
          if (this.cur === "shotgun") { setTimeout(function () { SFX.play("pump", 0.5); }, 150); this.anim.pump = 0.001; }
          else if (this.cur === "revolver") SFX.play("cyl", 0.6, 1.2);
        } else this.reloadT = w.reload_t;
      }
    }
  }
  if (this.muzzleT > 0) { this.muzzleT -= dt; if (this.muzzleT <= 0 && vmo.muzzle) vmo.muzzle.visible = false; }
  var tf = (this.scoped && this.alive) ? 26 : BASE_FOV;
  this.fov += (tf - this.fov) * Math.min(1, dt * 12);
  var scopedView = this.fov < 40;
  $("scope").style.display = scopedView ? "block" : "none";
  this.vmKick = Math.max(0, this.vmKick - dt * 5);
  var k = this.vmKick, sp = hyp(this.vx, this.vz);
  var bx = Math.cos(this.bob * 0.5) * 0.012 * Math.min(1, sp / 3), by = Math.abs(Math.sin(this.bob * 0.5)) * 0.01 * Math.min(1, sp / 3);
  var rl = this.reloading ? 1 : 0, sprint = INPUT.sprint && sp > 4, h = vmo.hold;
  var drop = this.drawT > 0 ? this.drawT / 0.35 * 0.15 : 0, tr = this.nerv * 0.004;
  this.vm.x = h[0] + bx + rnd(-tr, tr);
  this.vm.y = h[1] - by - rl * 0.04 - (sprint ? 0.05 : 0) - drop + rnd(-tr, tr);
  this.vm.z = h[2] - k * (this.cur === "rifle" ? 0.12 : 0.09);
  this.vm.rx = -k * (this.cur === "glock" ? 8 : 14) + rl * 8 + (sprint ? 12 : 0);
  this.vm.ry = (sprint ? -25 : 0); this.vm.rz = rl * 25 + (sprint ? 10 : 0);
  if (this.inspectT > 0 && this.cur !== "knife") {
    var s_ = Math.sin((1 - this.inspectT / 1.8) * Math.PI);
    this.vm.ry -= 55 * s_; this.vm.rz += 25 * s_; this.vm.x -= 0.05 * s_; this.vm.z -= 0.05 * s_;
  }
  this.vm.visible = this.alive && !this.transit && !scopedView;
  this.vm.tint = this.lightAt(this.px, this.pz) * 0.55 + 0.12;
  this.animParts(dt, vmo);
  this.updateLaser(w);
};
Game.prototype.animParts = function (dt, vmo) {
  var A = this.anim, P = vmo.parts;
  for (var key in A) A[key] += dt;
  if (A.slide !== undefined && P.slide) { P.slide.z = 0.06 - 0.035 * Math.max(0, 1 - A.slide / 0.08); if (A.slide > 0.1) delete A.slide; }
  if (A.pump !== undefined && P.pump) {
    if (A.pump > 0.3) {
      var u = (A.pump - 0.3) / 0.4;
      P.pump.z = 0.36 - 0.09 * Math.sin(Math.min(u, 1) * Math.PI);
      if (u >= 0.5 && !A.pumpEj) { A.pumpEj = 1; this.eject(); }
      if (u >= 1) { delete A.pump; delete A.pumpEj; P.pump.z = 0.36; }
    }
  }
  if (A.bolt !== undefined && P.bolt) {
    if (A.bolt > 0.25) {
      var ub = Math.min(1, (A.bolt - 0.25) / 0.6);
      var up = ub < 0.5 ? Math.sin(Math.min(ub * 2, 1) * Math.PI / 2) : Math.cos((ub - 0.5) * Math.PI);
      P.bolt.rz = -70 * up; P.bolt.z = -0.04 - 0.07 * Math.sin(ub * Math.PI);
      if (ub >= 0.45 && !A.boltEj) { A.boltEj = 1; this.eject(); }
      if (ub >= 1) { delete A.bolt; delete A.boltEj; P.bolt.rz = 0; P.bolt.z = -0.04; }
    }
  }
  if (P.cyl) {
    if (A.cyl !== undefined) {
      if (A.cyl < 0.1) P.cyl.rz += dt * 600;
      else { P.cyl.rz = Math.round(P.cyl.rz / 60) * 60; delete A.cyl; }
    }
    P.cyl.x += (((this.reloading && this.cur === "revolver") ? 0.045 : 0) - P.cyl.x) * Math.min(1, dt * 12);
  }
  if (P.pivot) {
    if (this.inspectT > 0 && this.cur === "knife") {
      var ui = 1 - this.inspectT / 1.8;
      P.pivot.rz = 720 * ui; P.hb.rx = 180 * Math.abs(Math.sin(ui * Math.PI * 3)); P.ha.rx = -P.hb.rx;
    } else { P.pivot.rz = 0; P.ha.rx = P.hb.rx = 0; }
    if (A.stab !== undefined) {
      var us = Math.min(1, A.stab / 0.35), s2 = Math.sin(us * Math.PI);
      vmo.inner.z = 0.14 * s2; vmo.inner.rx = -20 * s2; vmo.inner.x = -0.06 * s2;
      if (us >= 1) { delete A.stab; vmo.inner.z = vmo.inner.x = vmo.inner.rx = 0; }
    }
  }
  if (A.mag !== undefined) {
    var tot = (this.cur === "glock" || this.cur === "rifle") ? DATA.WEAPONS[this.cur].reload_t : 1;
    var um = Math.min(1, A.mag / tot);
    vmo.inner.rz = 30 * Math.sin(um * Math.PI); vmo.inner.y = -0.04 * Math.sin(um * Math.PI);
    if (um >= 1 || !this.reloading) { delete A.mag; vmo.inner.rz = 0; vmo.inner.y = 0; }
  }
};
Game.prototype.updateLaser = function (w) {
  var on = w.laser && this.alive && !this.transit && this.vm.visible;
  this.laserDot.visible = this.laserBeam.visible = !!on;
  if (!on) return;
  var cv = this.camVecs(), o = cv.eye, d = cv.fwd, t = this.world.raycast3d(o, d, 60)[0];
  for (var id in this.monsters) {
    var m = this.monsters[id];
    if (m.state === 3) continue;
    var tm = rayCyl(o, d, m.x, m.z, MONSTER_R, m.height);
    if (tm !== null && tm < t) t = tm;
  }
  var hp = [o[0] + d[0] * (t - 0.02), o[1] + d[1] * (t - 0.02), o[2] + d[2] * (t - 0.02)];
  this.laserDot.setPos(hp[0], hp[1], hp[2]);
  this.laserDot.sx = this.laserDot.sy = this.laserDot.sz = 0.03 + 0.004 * t;
  // la punta del láser (en el espacio de la cámara) a coordenadas del mundo
  var tip = this.vms.glock.laserTip.worldPos();
  var bx = hp[0] - tip[0], by = hp[1] - tip[1], bz = hp[2] - tip[2], L = Math.hypot(bx, by, bz);
  var B = this.laserBeam;
  B.setPos(tip[0], tip[1], tip[2]);
  B.ry = Math.atan2(bx, bz) * 180 / Math.PI;
  B.rx = -Math.atan2(by, Math.hypot(bx, bz)) * 180 / Math.PI;
  B.sx = B.sy = 1; B.sz = Math.max(L, 0.01);
};
Game.prototype.updateThings = function () {
  if (!this.st) return;
  var tn = performance.now() / 1000;
  for (var tid in this.thingN) {
    var te = this.thingN[tid], done = !!this.st.done[tid], pend = this.st.canUse(tid);
    if (te.kind === "item") {
      te.e.visible = !done;
      te.body.y = 0.15 + Math.sin(tn * 2 + tid.length) * 0.05; te.body.ry = (tn * 50) % 360;
      te.glow.cs = [1, 1, 1, pend ? 0.5 + 0.4 * Math.sin(tn * 4) : 0.15];
    } else {
      if (done) te.glow.cs = [0.05, 1, 0.1, 1];
      else { var b = (tn % 1) < 0.5 || !pend ? 1 : 0.3; te.glow.cs = [b, b, b, 1]; }
    }
  }
};
Game.prototype.updateWorld = function (dt) {
  var cfg = this.world.cfg, self = this;
  this.brownT -= dt;
  if (this.brownT <= 0 && !this.brownSeq.length) { this.brownSeq = [0.08, 0.06, 0.12, 0.05, rnd(0.3, 1.8)]; this.brownT = rnd(60, 140); SFX.play("flicker", 0.6); }
  var target = 1;
  if (this.brownSeq.length) { this.brownSeq[0] -= dt; target = this.brownSeq.length % 2 === 1 ? 0.22 : 1; if (this.brownSeq[0] <= 0) this.brownSeq.shift(); }
  this.power += (target - this.power) * Math.min(1, dt * 30);
  this.flickers.forEach(function (f) {
    f.t -= dt;
    if (f.t <= 0) {
      f.on = !f.on; f.t = f.on ? rnd(0.05, 3) : rnd(0.03, 0.15);
      f.n.cs = f.on ? null : [0.15, 0.15, 0.15, 1];
      if (!f.on && Math.random() < 0.3) SFX.play("flicker", 0.35, rnd(0.9, 1.2), [f.L.x, f.L.z], 18);
    }
  });
  this.ambT -= dt;
  if (this.ambT <= 0) { this.ambT = rnd(12, 35); var a = rnd(0, 6.28); SFX.play(cfg.oneshot, 0.6, rnd(0.7, 1.1), [this.px + Math.cos(a) * 12, this.pz + Math.sin(a) * 12], 40); }
  if (this.hum) this.hum.setVolume(cfg.amb_vol * (0.55 + 0.45 * Math.min(1, this.lightAt(this.px, this.pz))));
  if (this.hp < this.maxhp * 0.35 && this.alive) { this.heartT -= dt; if (this.heartT <= 0) { this.heartT = 0.95; SFX.play("heart", 0.7); } }
  var danger = 0;
  for (var id in this.monsters) {
    var m = this.monsters[id];
    if ((m.state === 1 || m.state === 2) && (m.kind === 0 || m.revealed)) danger = Math.max(danger, 1 - hyp(m.x - this.px, m.z - this.pz) / 24);
  }
  this.danger += (Math.max(0, danger) - this.danger) * Math.min(1, dt * (danger > this.danger ? 2 : 0.4));
  if (this.music) this.music.setVolume(0.5 * this.danger);
  var cv = this.camVecs();
  SFX.listener.x = this.px; SFX.listener.z = this.pz; SFX.listener.rx = cv.right[0]; SFX.listener.rz = cv.right[2];
  var gl = GFX.globals;
  gl.flash = this.flashOn ? 1 : 0;
  gl.muzzle = this.muzzleT > 0 ? (this.cur === "glock" ? 0.35 : 1) : 0;
  gl.power = this.power;
  gl.time = (performance.now() / 1000) % 1000;
  var landed = this.flaresLive.filter(function (f) { return f.landed; });
  var best = landed.length ? landed.reduce(function (a, b) { return a.life > b.life ? a : b; }) : this.flaresLive[this.flaresLive.length - 1];
  if (best) { gl.flarepos = [best.pos[0], best.pos[1] + 0.2, best.pos[2]]; gl.flare = best.intensity(); } else gl.flare = 0;
  if (this.water) this.water.uvoff = [Math.sin(gl.time * 0.13) * 0.4, (gl.time * 0.02) % 1];
  // radio
  if (this.radioT > 0) {
    this.radioT -= dt;
    if (this.radioT <= 0) { $("radio").style.display = "none"; SFX.play("beep", 0.35, 0.9); }
  } else if (this.radioQ.length) {
    var l = this.radioQ.shift(), col = DATA.SPEAKER_COLORS[l[0]] || [0.9, 0.9, 0.9];
    var el = $("radio");
    el.style.display = "block";
    el.style.color = "rgb(" + (col[0] * 255 | 0) + "," + (col[1] * 255 | 0) + "," + (col[2] * 255 | 0) + ")";
    el.textContent = "[RADIO] " + l[0] + ": " + l[1];
    this.radioT = 2 + l[1].length * 0.045;
    SFX.play("static", 0.5);
  }
};
Game.prototype.updateScripted = function (dt) {
  var W = this.world, tn = performance.now() / 1000, self = this;
  this.cars.forEach(function (c) { var on = (tn % 0.8) < 0.4; c[0].cs = on ? null : [0.15, 0.15, 0.15, 1]; c[1].cs = on ? [0.15, 0.15, 0.15, 1] : null; });
  this.phantomT -= dt;
  if (this.phantomT <= 0 && this.alive) {
    this.phantomT = rnd(70, 140);
    for (var i = 0; i < 10; i++) {
      var a = (this.yaw + rnd(-35, 35)) * Math.PI / 180, dx = Math.sin(a), dz = Math.cos(a);
      var t = W.raycast2d(this.px, this.pz, dx, dz, 40)[0];
      if (t > 18) {
        var dist = rnd(15, Math.min(t - 2, 26)), cx = this.px + dx * dist, cz = this.pz + dz * dist, side = Math.random() < 0.5 ? -1 : 1;
        var vx = -dz * side * 3.2, vz = dx * side * 3.2;
        var mv = new MonsterView(this, -1, cx - vx * 0.6, cz - vz * 0.6, Math.atan2(vx, vz) * 180 / Math.PI);
        this.phantoms.push({ mv: mv, t: 1.4, vx: vx, vz: vz });
        break;
      }
    }
  }
  this.phantoms = this.phantoms.filter(function (p) {
    p.t -= dt;
    p.mv.setTarget(p.mv.tx + p.vx * dt, p.mv.tz + p.vz * dt, p.mv.trot, 1);
    p.mv.update(dt);
    if (p.t <= 0) { p.mv.destroy(); return false; }
    return true;
  });
  this.sparkT -= dt;
  if (this.sparkT <= 0) {
    this.sparkT = W.cfg.num === "3" ? rnd(3, 7) : rnd(15, 35);
    var near = W.lights.filter(function (L) { return hyp(L.x - self.px, L.z - self.pz) < 16; });
    if (near.length) {
      var L = pick(near);
      for (var k = 0; k < 10; k++) this.fx.particle([L.x, W.h - 0.1, L.z], [rnd(-1.5, 1.5), rnd(-2, 0.5), rnd(-1.5, 1.5)], 0.5, 0.04, 0.01, "spark", [1.8, 1.5, 1], { emissive: true, add: true, grav: 9 });
      SFX.play("zap", 0.6, rnd(0.9, 1.2), [L.x, L.z], 25);
    }
  }
  this.steamT -= dt;
  if (this.steamT <= 0 && this.vents.length) {
    this.steamT = rnd(2, 5);
    var nv = this.vents.filter(function (v) { return hyp(v[0] - self.px, v[1] - self.pz) < 14; });
    if (nv.length) {
      var v = pick(nv);
      for (var q = 0; q < 8; q++) this.fx.particle([v[0], W.h - 0.8, v[1]], [v[2] * rnd(1.5, 3) + rnd(-.3, .3), rnd(-0.2, 0.4), v[3] * rnd(1.5, 3) + rnd(-.3, .3)], 1.6, 0.2, 1.4, "smoke", [1, 1, 1]);
      SFX.play("steam", 0.6, rnd(0.9, 1.1), [v[0], v[1]], 25);
    }
  }
  this.phoneT -= dt;
  if (this.phoneT <= 0) {
    this.phoneT = 5;
    for (var j = 0; j < this.phones.length; j++) {
      var ph = this.phones[j];
      if (!ph[2] && hyp(ph[0] - this.px, ph[1] - this.pz) < 9 && Math.random() < 0.35) {
        ph[2] = true; SFX.play("phone", 0.8, 1, [ph[0], ph[1]], 25);
        setTimeout(function () { SFX.play("phone", 0.8, 1, [ph[0], ph[1]], 25); }, 2100);
        break;
      }
    }
  }
};

Game.prototype.updateHud = function (dt) {
  var w = DATA.WEAPONS[this.cur];
  $("hpbar").style.width = Math.max(0, this.hp / this.maxhp * 100) + "%";
  $("hpbar").style.background = this.hp > this.maxhp * 0.35 ? "#d9cc98" : "#e0402a";
  $("stbar").style.width = this.stamina * 100 + "%";
  $("batbar").style.width = this.battery * 100 + "%";
  $("ammo").textContent = w.kind === "gun" ? this.inv[this.cur].mag + " / " + this.inv[this.cur].res : "--";
  $("wname").textContent = w.name + " · bengalas: " + this.flares;
  var stt = "";
  if (this.reloading) stt = "RECARGANDO";
  else if (w.kind === "gun" && this.inv[this.cur].mag === 0 && this.inv[this.cur].res > 0) stt = "toca REC";
  else if (this.rc.key === "novato" && this.nerv > 0.4) stt = "le tiembla el pulso...";
  $("state").textContent = stt;
  var mic = "";
  if (this.mode !== "solo") {
    if (!VOICE.ok) mic = "sin micrófono";
    else if (VOICE.muted) mic = "MIC SILENCIADO";
    else if (VOICE.radio) mic = "[ RADIO ] te escuchan todos";
    else mic = VOICE.talking ? "MIC )))" : "mic";
  }
  $("mic").textContent = mic;
  $("b_mute").classList.toggle("on", !!VOICE.muted);
  $("cross").style.display = (this.fov < 40 || this.cur === "glock") ? "none" : "block";
  var spread = (w.spread || 0.01) * 0.5 + 0.008 + hyp(this.vx, this.vz) * 0.003 + this.recoil * 0.004 + this.nerv * 0.02;
  var px = Math.round(spread * 600);
  var is = $("cross").children;
  is[0].style.left = (-px - 9) + "px"; is[1].style.left = (px) + "px"; is[2].style.top = (-px - 9) + "px"; is[3].style.top = px + "px";
  var i = this.info, lt = "NIVEL " + this.world.cfg.num + " · " + this.world.cfg.name;
  if (i.ph === "fight") lt += " · OLEADA " + i.w + " · restantes " + i.left;
  else if (i.ph === "break") lt += " · calma... " + (i.t | 0) + "s";
  else lt += " · algo se acerca en " + (i.t | 0) + "s";
  $("wave").textContent = lt;
  var nr = Object.keys(this.notesRead).length;
  $("obj").textContent = this.st ? "OBJETIVO: " + this.st.text() + (this.story ? "  ·  expedientes " + nr + "/3" : "") : "";
  // flecha
  var target = null, self = this;
  if (this.exitOpen) target = [this.world.exit, "#6cf07a", "SALIDA"];
  else if (this.st && (this.st.step().type === "collect" || this.st.step().type === "activate")) {
    var best = null;
    Object.keys(this.st.things).forEach(function (tid) {
      var t = self.st.things[tid];
      if (self.st.canUse(tid)) { var d = hyp(t.x - self.px, t.z - self.pz); if (!best || d < best[0]) best = [d, [t.x, t.z]]; }
    });
    if (best) target = [best[1], "#ffd34d", "OBJETIVO"];
  }
  if (target && !this.transit) {
    var dx = target[0][0] - this.px, dz = target[0][1] - this.pz;
    $("arrowbox").style.display = "block";
    $("arrow").style.transform = "rotate(" + (Math.atan2(dx, dz) * 180 / Math.PI - this.yaw) + "deg)";
    $("arrow").style.borderBottomColor = target[1];
    $("arrowt").style.color = target[1];
    $("arrowt").textContent = target[2] + " " + (hyp(dx, dz) | 0) + " m";
  } else $("arrowbox").style.display = "none";
  if (this.mode !== "solo") {
    var lines = [];
    Object.keys(this.scores).sort(function (a, b) { return a - b; }).forEach(function (k) {
      var v = self.scores[k];
      lines.push(v[6] + (v[5] ? "" : " (caído)"));
    });
    $("players").innerHTML = lines.join("<br>");
  }
  if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) $("msg").style.opacity = 0; }
  if (!this.alive && !this.transit) {
    $("center").textContent = this.deadSolo ? "TE DESARMARON\nte rearmás en " + Math.max(1, Math.ceil(this.deadT))
      : "ESTÁS EN EL PISO\nque te junten los huesos (" + Math.max(1, Math.ceil(this.deadT)) + ")";
  }
  this.hurtFlash = Math.max(0, this.hurtFlash - dt * 1.2);
  var low = Math.max(0, (0.4 - this.hp / this.maxhp) / 0.4) * 0.5;
  $("hurt").style.opacity = Math.min(1, this.hurtFlash + low);
  var dark = this.alive ? 0 : Math.min(0.75, (8 - Math.min(this.deadT, 8)) * 0.2);
  $("dark").style.opacity = Math.max(dark, this.fade);
  $("grain").style.backgroundPosition = (Math.random() * 256 | 0) + "px " + (Math.random() * 256 | 0) + "px";
};

Game.prototype.render = function () {
  var c = GFX.camera;
  c.x = this.px; c.y = this.headY; c.z = this.pz;
  var sh = this.shake, tr = this.nerv * 0.6;
  c.yaw = this.yaw + (Math.random() * 2 - 1) * (sh * 2 + tr * 0.4);
  c.pitch = this.pitch + this.recoil - (Math.random() * 2 - 1) * (sh * 3 + tr * 0.4);
  c.roll = this.roll;
  c.fov = this.fov;
  $("dark").style.opacity = Math.max(+$("dark").style.opacity || 0, this.fade);
  GFX.render();
};

function rayCyl(o, d, cx, cz, r, h) {
  var ox = o[0] - cx, oz = o[2] - cz, a = d[0] * d[0] + d[2] * d[2];
  if (a < 1e-8) return null;
  var b = 2 * (ox * d[0] + oz * d[2]), c = ox * ox + oz * oz - r * r, disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  var t = (-b - Math.sqrt(disc)) / (2 * a);
  if (t < 0) return null;
  var y = o[1] + d[1] * t;
  return (y >= 0 && y <= h) ? t : null;
}

// ===========================================================================
// Menú y arranque
// ===========================================================================
function showGameUI(on) {
  $("hud").style.display = on ? "block" : "none";
  $("touch").style.display = on && INPUT.touch ? "block" : "none";
  $("b_pause").style.display = on ? "flex" : "none";
  $("bl").style.display = on ? "block" : "none";
  document.body.classList.toggle("playing", on);
}
var MENU = { story: true, role: 0, level: 0, client: null, host: null };
function menuRefresh() {
  var c = levelCfg(MENU.level);
  $("mode").textContent = MENU.story ? "MODO: HISTORIA" : "MODO: SUPERVIVENCIA";
  $("lvl").textContent = (MENU.story ? "Capítulo " + (MENU.level + 1) : "Nivel " + c.num) + ": " + c.name + "  ›";
  $("lvldesc").textContent = c.desc;
  var bs = $("roles").children;
  for (var i = 0; i < bs.length; i++) bs[i].classList.toggle("sel", i === MENU.role);
  var r = DATA.ROLES[MENU.role];
  $("roledesc").textContent = r.name + " · " + r.desc;
}
function setupMenu() {
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem("br22") || "{}"); } catch (e) { }
  $("name").value = saved.name || ("Poli" + (10 + Math.random() * 89 | 0));
  MENU.role = saved.role || 0;
  INPUT.sens = saved.sens || 1.2; $("sens").value = INPUT.sens;
  GFX.renderScale = saved.q === "low" ? 0.75 : 1.5;
  DATA.ROLES.forEach(function (r, i) {
    var b = document.createElement("button");
    b.className = "b"; b.textContent = r.short;
    b.onclick = function () { MENU.role = i; menuRefresh(); };
    $("roles").appendChild(b);
  });
  $("mode").onclick = function () { MENU.story = !MENU.story; menuRefresh(); };
  $("lvl").onclick = function () { MENU.level = (MENU.level + 1) % DATA.LEVELS.length; menuRefresh(); };
  $("solo").onclick = function () { start("solo", null, 0, null); };
  $("host").onclick = function () {
    SFX.unlock();
    $("status").textContent = "Creando sala...";
    new NET.Host(function (err, h) {
      if (err) { $("status").textContent = err; return; }
      MENU.host = h;
      $("menu").style.display = "none"; $("lobby").style.display = "block";
      $("roomcode").textContent = h.code;
    });
  };
  $("startgame").onclick = function () { $("lobby").style.display = "none"; start("host", null, 0, MENU.host); };
  $("join").onclick = function () {
    SFX.unlock();
    var code = $("code").value.trim().toUpperCase();
    $("status").textContent = "Conectando...";
    new NET.Client(code, function (err, c) {
      if (err) { $("status").textContent = err; return; }
      MENU.client = c;
      c.send({ t: "hello", name: myName(), v: PROTO, role: MENU.role });
      $("status").textContent = "Conectado. Esperando que el host empiece...";
      var waited = 0;
      var iv = setInterval(function () {
        waited += 0.25;
        var msgs = c.poll();
        for (var i = 0; i < msgs.length; i++) {
          var m = msgs[i];
          if (m.t === "welcome") {
            clearInterval(iv);
            if (m.v !== PROTO) { $("status").textContent = "El host tiene otra versión del juego."; c.close(); return; }
            start("client", m, m.id, c);
            return;
          }
        }
        if (waited % 5 === 0) c.send({ t: "hello", name: myName(), v: PROTO, role: MENU.role });
        if (waited > 120) { clearInterval(iv); $("status").textContent = "El host no respondió. Revisá el código."; c.close(); }
      }, 250);
    });
  };
  $("resume").onclick = function () { if (G) G.togglePause(); };
  $("quit").onclick = $("quit2").onclick = function () { if (G) G.quit(); else location.reload(); };
  $("cont").onclick = function () { if (G) G.continueAfterEnd(); };
  $("sens").oninput = function () { INPUT.sens = +this.value; save(); };
  $("gfxq").onclick = function () { GFX.renderScale = GFX.renderScale > 1 ? 0.75 : 1.5; save(); gfxLabel(); };
  gfxLabel();
  menuRefresh();
}
function gfxLabel() { $("gfxq").textContent = GFX.renderScale > 1 ? "ALTA (tocá para bajar)" : "BAJA (más fluido)"; }
function myName() { return ($("name").value || "Jugador").trim().slice(0, 14) || "Jugador"; }
function save() {
  try { localStorage.setItem("br22", JSON.stringify({ name: myName(), role: MENU.role, sens: INPUT.sens, q: GFX.renderScale > 1 ? "high" : "low" })); } catch (e) { }
}
function start(mode, welcome, myId, net) {
  SFX.unlock(); save();
  $("menu").style.display = "none";
  $("loading").style.display = "flex"; $("ltext").textContent = "Entrando a los Backrooms...";
  try { if (document.documentElement.requestFullscreen && INPUT.touch) document.documentElement.requestFullscreen().catch(function () { }); } catch (e) { }
  try { screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape").catch(function () { }); } catch (e) { }
  setTimeout(function () {
    new Game({
      mode: mode, myId: myId, net: net, name: myName(), role: MENU.role,
      story: welcome ? !!welcome.story : MENU.story,
      level: welcome ? welcome.lvl : MENU.level,
      seed: welcome ? welcome.seed : (Math.random() * 1073741824) | 0
    });
    $("loading").style.display = "none";
  }, 60);
}

// bucle principal
var lastT = 0;
function frame(t) {
  requestAnimationFrame(frame);
  var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  if (G && G.ready) G.update(dt);
}

window.addEventListener("load", function () {
  if ("serviceWorker" in navigator && location.protocol === "https:" && location.hostname.indexOf("appassets") < 0) {
    try { navigator.serviceWorker.register("sw.js"); } catch (e) { }
  }
  if (!GFX.init($("cv"))) {
    document.body.innerHTML = "<p style='color:#eee;padding:20px'>Este dispositivo no soporta WebGL2.</p>";
    return;
  }
  $("loading").style.display = "flex";
  var texNames = ["wallpaper", "carpet", "ceiling", "cwall", "cfloor", "cceil", "mwall", "grate", "dceil", "brick", "tfloor", "pool",
    "poolfloor", "pwall", "lino", "lamp", "base", "metal", "wood", "hole", "blood", "spark", "smoke", "grain", "ammo", "med",
    "skin", "cloth", "water", "crate", "door", "pipe", "bone", "paper", "tape", "chalk"];
  var p1 = 0, p2 = 0;
  var bar = function () { document.querySelector("#lbar > div").style.width = ((p1 + p2) * 50) + "%"; };
  Promise.all([GFX.loadTextures(texNames, function (p) { p1 = p; bar(); }), SFX.load(function (p) { p2 = p; bar(); })]).then(function () {
    $("loading").style.display = "none";
    $("menu").style.display = "block";
    setupMenu();
    var mm = /[?&]lvl=(\d+)/.exec(location.search);
    if (mm) MENU.level = +mm[1];
    if (/[?&]autostart=1/.test(location.search)) start("solo", null, 0, null);
    requestAnimationFrame(frame);
  });
});
