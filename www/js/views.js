// BACKROOMS - MÓVIL 22 · Partículas, entidades, jugadores remotos y bengalas
"use strict";

var QUAD = null;
function quadMesh() { if (!QUAD) QUAD = new GFX.Mesh(quadXY(1, 1)); return QUAD; }

// ---------------------------------------------------------------- partículas y marcas
function FX() {
  this.parts = []; this.decals = [];
  this.root = new GFX.Node({ parent: GFX.root });
  this.clinkT = 0;
}
FX.prototype.particle = function (pos, vel, life, s0, s1, tex, rgb, opts) {
  opts = opts || {};
  var n = new GFX.Node({ parent: this.root, mesh: quadMesh(), tex: tex, billboard: true, blend: opts.add ? 2 : 1,
    emissive: opts.emissive ? 1 : null, x: pos[0], y: pos[1], z: pos[2], rz: Math.random() * 360 });
  n.sx = n.sy = n.sz = s0;
  n.cs = [rgb[0], rgb[1], rgb[2], 1];
  this.parts.push({ n: n, v: vel.slice(), life: life, max: life, s0: s0, s1: s1, g: opts.grav || 0, bounce: !!opts.bounce, rgb: rgb });
  if (this.parts.length > 220) this.parts.shift().n.remove();
};
FX.prototype.casing = function (pos, vel) {
  this.particle(pos, vel, 6, 0.014, 0.014, "white", [0.85, 0.65, 0.25], { grav: 9.8, bounce: true });
};
FX.prototype.decal = function (pos, nrm, tex, size) {
  // orientar un quad (plano XY, normal +Z) hacia la normal
  var ry = 0, rx = 0;
  if (Math.abs(nrm[1]) > 0.5) rx = nrm[1] > 0 ? -90 : 90;
  else ry = Math.atan2(nrm[0], nrm[2]) * 180 / Math.PI;
  var n = new GFX.Node({ parent: this.root, mesh: quadMesh(), tex: tex, blend: 1, bias: 2,
    x: pos[0] + nrm[0] * 0.01, y: pos[1] + nrm[1] * 0.01, z: pos[2] + nrm[2] * 0.01, rx: rx, ry: ry, rz: Math.random() * 360 });
  n.sx = n.sy = n.sz = size;
  this.decals.push(n);
  if (this.decals.length > 160) this.decals.shift().remove();
  return n;
};
FX.prototype.clear = function () {
  this.parts.forEach(function (p) { p.n.remove(); });
  this.decals.forEach(function (d) { d.remove(); });
  this.parts = []; this.decals = [];
};
FX.prototype.update = function (dt, tintFn) {
  this.clinkT -= dt;
  var keep = [];
  for (var i = 0; i < this.parts.length; i++) {
    var p = this.parts[i], n = p.n;
    p.life -= dt;
    if (p.life <= 0) { n.remove(); continue; }
    p.v[1] -= p.g * dt;
    n.x += p.v[0] * dt; n.y += p.v[1] * dt; n.z += p.v[2] * dt;
    if (p.bounce && n.y < 0.01) {
      n.y = 0.01;
      if (Math.abs(p.v[1]) > 0.6 && this.clinkT <= 0) { SFX.play("casing", 0.4, 0.85 + Math.random() * 0.35, [n.x, n.z], 12); this.clinkT = 0.05; }
      p.v[1] = -p.v[1] * 0.3; p.v[0] *= 0.5; p.v[2] *= 0.5;
    }
    var t = 1 - p.life / p.max;
    if (p.bounce) n.cs[3] = Math.min(1, p.life);
    else { var s = p.s0 + (p.s1 - p.s0) * t; n.sx = n.sy = n.sz = s; n.cs[3] = 1 - t; }
    keep.push(p);
  }
  this.parts = keep;
};

// ---------------------------------------------------------------- entidades
function MonsterView(game, mid, x, z, rot) {
  this.g = game; this.id = mid; this.kind = 0;
  var mc = game.world.cfg.mon;
  this.height = 2.45 * mc.scale;
  var m = buildMonster(GFX.root, mc);
  this.root = m.root; this.torso = m.torso; this.head = m.head; this.legs = m.legs; this.arms = m.arms;
  this.root.x = x; this.root.z = z; this.root.ry = rot;
  this.tx = x; this.tz = z; this.trot = rot;
  this.state = 0; this.phase = Math.random() * 6; this.flinch = 0; this.swing = 0; this.death = 0;
  this.twitch = 0; this.tw = [0, 0]; this.speed = 0;
}
Object.defineProperty(MonsterView.prototype, "x", { get: function () { return this.root.x; } });
Object.defineProperty(MonsterView.prototype, "z", { get: function () { return this.root.z; } });
Object.defineProperty(MonsterView.prototype, "rot", { get: function () { return this.root.ry; } });
MonsterView.prototype.setTarget = function (x, z, rot, st) {
  this.tx = x; this.tz = z; this.trot = rot;
  if (st === 3 && this.state !== 3) this.death = 0.001;
  this.state = st;
};
MonsterView.prototype.update = function (dt) {
  var r = this.root, ox = r.x, oz = r.z, k = Math.min(1, dt * 12);
  r.x += (this.tx - r.x) * k; r.z += (this.tz - r.z) * k;
  r.ry += (((this.trot - r.ry + 540) % 360) - 180) * Math.min(1, dt * 10);
  var sp = Math.hypot(r.x - ox, r.z - oz) / Math.max(dt, 1e-4);
  this.speed += (sp - this.speed) * Math.min(1, dt * 8);
  r.tint = this.g.lightAt(r.x, r.z) * 0.55;
  if (this.death > 0) {
    this.death += dt;
    var t = Math.min(1, this.death / 0.7);
    this.torso.rx = -15 - 70 * t; r.y = -0.9 * t * t;
    this.arms.forEach(function (a) { a.rx = -60 * t; });
    return;
  }
  this.phase += dt * (1.5 + this.speed * 2.2);
  var sw = Math.sin(this.phase), amp = Math.min(1, this.speed / 3);
  this.legs[0].rx = sw * 32 * amp; this.legs[1].rx = -sw * 32 * amp;
  var lean = 8 + 18 * amp;
  this.flinch = Math.max(0, this.flinch - dt * 4);
  this.torso.rx = lean - this.flinch * 30;
  this.torso.y = 1.15 + Math.abs(Math.cos(this.phase)) * 0.05 * amp;
  // espacio libre adelante (para que los brazos no atraviesen paredes)
  var D = Math.PI / 180, fr = this.g.world.raycast2d(r.x, r.z, Math.sin(r.ry * D), Math.cos(r.ry * D), 2)[0];
  var room = Math.max(0.25, Math.min(1, (fr - 0.35) / 1.1));
  if (this.swing > 0) {
    this.swing -= dt;
    var u = 1 - Math.max(this.swing, 0) / 0.5;
    var ang = (u < 0.6 ? -150 * Math.sin(u * Math.PI * 0.6) : -150 + (u - 0.6) / 0.4 * 170) * room;
    this.arms.forEach(function (a) { a.rx = ang; });
  } else {
    var b = (this.state === 1 ? -25 * amp : 0) * room;
    this.arms[0].rx = b - sw * 22 * amp * room; this.arms[1].rx = b + sw * 22 * amp * room;
    this.arms[0].rz = -6; this.arms[1].rz = 6;
  }
  this.twitch -= dt;
  if (this.twitch <= 0) { this.twitch = 0.15 + Math.random() * 1.45; this.tw = [Math.random() * 36 - 18, Math.random() * 70 - 35]; }
  this.head.rx += (this.tw[0] - lean - this.head.rx) * Math.min(1, dt * 18);
  this.head.rz += (this.tw[1] * 0.6 - this.head.rz) * Math.min(1, dt * 18);
};
MonsterView.prototype.reveal = function () { };
MonsterView.prototype.destroy = function () { this.root.dispose(); };

// ---------------------------------------------------------------- jugadores
function AvatarView(game, pid, name, role, doppel) {
  this.g = game; this.id = pid; this.name = name; this.role = role; this.doppel = !!doppel;
  this.m = buildCop(GFX.root, role, pid, doppel);
  this.root = this.m.root;
  this.tx = 0; this.tz = 0; this.tyaw = 0; this.tpitch = 0; this.alive = true;
  this.phase = 0; this.speed = 0; this.flashT = 0; this.speaking = false; this.first = true; this.height = 1.85;
  this.tag = document.createElement("div");
  this.tag.className = "tag";
  document.getElementById("tags").appendChild(this.tag);
}
Object.defineProperty(AvatarView.prototype, "x", { get: function () { return this.root.x; } });
Object.defineProperty(AvatarView.prototype, "z", { get: function () { return this.root.z; } });
AvatarView.prototype.setTarget = function (x, z, yaw, pitch, alive) {
  this.tx = x; this.tz = z; this.tyaw = yaw; this.tpitch = pitch; this.alive = alive;
  if (this.first) { this.root.x = x; this.root.z = z; this.first = false; }
};
AvatarView.prototype.update = function (dt) {
  var r = this.root, ox = r.x, oz = r.z, k = Math.min(1, dt * 12);
  r.x += (this.tx - r.x) * k; r.z += (this.tz - r.z) * k;
  r.ry += (((this.tyaw - r.ry + 540) % 360) - 180) * Math.min(1, dt * 14);
  this.m.head.rx = -this.tpitch * 0.7; this.m.gun.rx = -this.tpitch;
  var sp = Math.hypot(r.x - ox, r.z - oz) / Math.max(dt, 1e-4);
  this.speed += (sp - this.speed) * Math.min(1, dt * 8);
  this.phase += dt * (2 + this.speed * 2.4);
  var amp = Math.min(1, this.speed / 3), ph = this.phase;
  this.m.legs.forEach(function (l, i) { l.rx = Math.sin(ph) * 30 * amp * (i ? 1 : -1); });
  var D = Math.PI / 180, fr = this.g.world.raycast2d(r.x, r.z, Math.sin(r.ry * D), Math.cos(r.ry * D), 1.5)[0];
  var low = Math.max(0, Math.min(1, (1.15 - fr) / 0.7));
  this.m.arms.forEach(function (a, i) { a.rx = -60 + 45 * low + (i === 0 ? Math.sin(ph) * 8 * amp : 0); });
  this.m.gun.rx += 45 * low;
  r.visible = this.alive;
  this.m.pile.visible = !this.alive;
  if (!this.alive) { this.m.pile.x = r.x; this.m.pile.z = r.z; }
  var light = this.g.lightAt(r.x, r.z) * 0.5 + 0.08;
  r.tint = light; this.m.pile.tint = light;
  if (this.flashT > 0) { this.flashT -= dt; if (this.flashT <= 0) this.m.flash.visible = false; }
  this.updateTag();
};
AvatarView.prototype.updateTag = function () {
  var r = this.root, g = this.g;
  var p = GFX.project([r.x, this.alive ? 2.15 : 0.6, r.z]);
  var cam = GFX.camera, d = Math.hypot(r.x - cam.x, r.z - cam.z);
  var show = p && d < 40 && g.world.los(cam.x, cam.z, r.x, r.z) && !(this.doppel && this.revealed);
  this.tag.style.display = show ? "block" : "none";
  if (!show) return;
  this.tag.style.transform = "translate(" + (p[0] | 0) + "px," + (p[1] | 0) + "px) translate(-50%,-100%)";
  var t = (this.speaking ? "🔊 " : "") + this.name;
  if (!this.alive) t += "<br><small>[caído · mantené USAR]</small>";
  if (this.tag._t !== t) { this.tag.innerHTML = t; this.tag._t = t; }
};
AvatarView.prototype.muzzle = function () { this.m.flash.visible = true; this.m.flash.rz = Math.random() * 360; this.flashT = 0.06; };
AvatarView.prototype.destroy = function () { this.root.dispose(); this.m.pile.dispose(); this.tag.remove(); };

function DoppelView(game, mid, x, z, rot, copy) {
  var info = game.playerInfo(copy);
  AvatarView.call(this, game, copy, info[0], info[1], true);
  this.copy = copy; this.id = mid; this.kind = 1;
  this.root.x = x; this.root.z = z; this.first = false;
  this.tx = x; this.tz = z; this.tyaw = rot;
  this.state = 0; this.flinch = 0; this.swing = 0; this.death = 0; this.revealed = false; this.height = 1.9;
}
DoppelView.prototype = Object.create(AvatarView.prototype);
Object.defineProperty(DoppelView.prototype, "rot", { get: function () { return this.root.ry; } });
DoppelView.prototype.setTarget = function (x, z, rot, st) {
  this.tx = x; this.tz = z; this.tyaw = rot;
  if (st === 3 && this.state !== 3) this.death = 0.001;
  if ((st === 1 || st === 2) && !this.revealed) this.reveal();
  this.state = st;
};
DoppelView.prototype.reveal = function () { this.revealed = true; this.m.eyes.visible = true; this.name = "???"; };
DoppelView.prototype.update = function (dt) {
  if (this.death > 0) { this.death += dt; this.alive = false; }
  AvatarView.prototype.update.call(this, dt);
  if (this.revealed && this.death === 0) {
    this.m.head.rz = Math.random() * 50 - 25; this.m.head.rx = Math.random() * 40 - 20;
    var sw = this.swing > 0;
    if (sw) this.swing -= dt;
    this.m.arms.forEach(function (a) { a.rx = sw ? -160 : -100 + Math.random() * 20 - 10; });
  }
};

// ---------------------------------------------------------------- bengalas
function Flare(game, pos, vel, landed, mine) {
  this.g = game; this.mine = !!mine;
  this.node = new GFX.Node({ parent: GFX.root, x: pos[0], y: pos[1], z: pos[2] });
  new GFX.Node({ parent: this.node, mesh: cylinder(0, 0, 0, 0.02, 0.16, [0.8, 0.1, 0.05], "z") });
  new GFX.Node({ parent: this.node, mesh: box(0, 0, 0.085, 0.03, 0.03, 0.02, [2.0, 0.6, 0.3]), tex: "white", emissive: 1 });
  this.pos = pos.slice(); this.vel = vel.slice(); this.landed = !!landed; this.life = 12; this.emitT = 0;
  if (landed) { this.pos[1] = 0.03; SFX.play("flare", 0.8, 1, [this.pos[0], this.pos[2]], 25); }
}
Flare.prototype.update = function (dt) {
  var W = this.g.world, p = this.pos, v = this.vel;
  if (!this.landed) {
    v[1] -= 9.8 * dt;
    var nx = p[0] + v[0] * dt, nz = p[2] + v[2] * dt;
    if (W.solidAt(nx, p[2])) { v[0] *= -0.4; nx = p[0]; }
    if (W.solidAt(p[0], nz)) { v[2] *= -0.4; nz = p[2]; }
    p[0] = nx; p[2] = nz; p[1] += v[1] * dt;
    if (p[1] >= W.h - 0.05) v[1] = -Math.abs(v[1]) * 0.3;
    if (p[1] <= 0.03) {
      p[1] = 0.03;
      if (Math.abs(v[1]) < 1.5) { this.landed = true; this.g.flareLanded(this); SFX.play("flare", 0.8, 1, [p[0], p[2]], 25); }
      this.vel = [v[0] * 0.4, Math.abs(v[1]) * 0.3, v[2] * 0.4];
    }
    this.node.x = p[0]; this.node.y = p[1]; this.node.z = p[2];
    this.node.ry += 600 * dt;
  } else {
    this.life -= dt; this.emitT -= dt;
    if (this.emitT <= 0) {
      this.emitT = 0.07;
      this.g.fx.particle([p[0], 0.1, p[2]], [Math.random() * 0.6 - 0.3, 0.6 + Math.random() * 0.8, Math.random() * 0.6 - 0.3],
        0.6, 0.05, 0.12, "spark", [1.8, 0.5, 0.25], { emissive: true, add: true, grav: 1 });
      if (Math.random() < 0.3) this.g.fx.particle([p[0], 0.2, p[2]], [0, 0.5, 0], 2.5, 0.2, 1.0, "smoke", [0.9, 0.5, 0.45]);
    }
  }
};
Flare.prototype.intensity = function () { return this.landed ? Math.min(1, this.life / 2) * (0.85 + 0.15 * Math.random()) : 0.5; };
Flare.prototype.destroy = function () { this.node.dispose(); };
