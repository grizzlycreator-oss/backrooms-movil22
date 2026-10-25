// BACKROOMS - MÓVIL 22 · Objetivos e IA de las entidades (corre en el host)
"use strict";

// ---------------------------------------------------------------------------
// Objetivos del nivel
// ---------------------------------------------------------------------------
function Story(world, storyMode) {
  var lv = world.level;
  this.storyMode = storyMode;
  this.steps = (storyMode && lv < DATA.STORY.length) ? DATA.STORY[lv] : DATA.SURVIVAL;
  this.idx = 0;
  this.progress = 0;
  this.done = {};
  this.things = {};
  var spots = world.objSpots, k = 0, self = this;
  this.steps.forEach(function (st, si) {
    var n = st.count || 0, c;
    if (st.type === "collect") {
      for (c = 0; c < n; c++) {
        var p = spots[k++ % spots.length];
        self.things[st.item + c] = { kind: "item", what: st.item, x: p[0], z: p[1], step: si, name: DATA.ITEM_NAMES[st.item] || st.item };
      }
    } else if (st.type === "activate") {
      for (c = 0; c < n; c++) {
        var p2 = spots[k++ % spots.length];
        self.things[st.thing + c] = { kind: "thing", what: st.thing, x: p2[0], z: p2[1], step: si, name: DATA.THING_NAMES[st.thing] || st.thing };
      }
    }
  });
}
Story.prototype.step = function () { return this.steps[Math.min(this.idx, this.steps.length - 1)]; };
Story.prototype.exitOpen = function () { return this.step().type === "exit"; };
Story.prototype.isFinal = function () { return this.exitOpen() && !!this.step().final; };
Story.prototype.needed = function () {
  var st = this.step();
  if (st.type === "collect" || st.type === "activate") return st.count;
  if (st.type === "survive") return st.waves;
  return 0;
};
Story.prototype.text = function () {
  var n = this.needed();
  return n > 1 ? this.step().text + "  (" + this.progress + "/" + n + ")" : this.step().text;
};
Story.prototype._advance = function () {
  if (this.progress >= this.needed() && this.step().type !== "exit") { this.idx++; this.progress = 0; return true; }
  return false;
};
Story.prototype.canUse = function (tid) {
  var t = this.things[tid];
  return !!t && !this.done[tid] && t.step === this.idx;
};
Story.prototype.use = function (tid) {
  if (!this.canUse(tid)) return null;
  this.done[tid] = 1;
  this.progress++;
  return this._advance();
};
Story.prototype.onWaveClear = function () {
  if (this.step().type === "survive") { this.progress++; return this._advance(); }
  return false;
};
Story.prototype.toJSON = function () { return { i: this.idx, p: this.progress, d: Object.keys(this.done) }; };
Story.prototype.load = function (d) {
  this.idx = d.i || 0; this.progress = d.p || 0; this.done = {};
  var self = this;
  (d.d || []).forEach(function (k) { self.done[k] = 1; });
};

// ---------------------------------------------------------------------------
// Entidades
// ---------------------------------------------------------------------------
function Mon(id, x, z, hp, speed, kind, copy) {
  this.id = id; this.kind = kind || 0; this.copy = copy === undefined ? -1 : copy;
  this.x = x; this.z = z; this.rot = 0; this.hp = this.maxhp = hp; this.speed = speed;
  this.state = 0; this.atk = 0; this.cd = 0; this.aggro = 0; this.wt = 0; this.wx = x; this.wz = z;
  this.growl = 3 + Math.random() * 6; this.screamCd = 0; this.deadT = 0; this.vx = 0; this.vz = 0;
  this.stuck = 0; this.detour = 0; this.dx = 0; this.dz = 0;
  this.revealed = this.kind === 0; this.actT = 0; this.mimicT = 5 + Math.random() * 4;
}

function HostSim(world, seed, kills, storyMode) {
  this.w = world;
  var cfg = world.cfg, tier = levelTier(world.level), m = cfg.mon;
  this.mHp = m.hp * (1 + 0.45 * tier); this.mSp = m.sp * (1 + 0.08 * tier);
  this.mDmg = m.dmg * (1 + 0.2 * tier); this.mCount = m.count * (1 + 0.25 * tier);
  this.story = new Story(world, storyMode);
  this.rng = new RNG(seed);
  this.mons = {}; this.nextId = 1; this.wave = 0; this.phase = "calm"; this.timer = cfg.calm;
  this.toSpawn = 0; this.spawnT = 0; this.flow = null; this.flowT = 0;
  this.kills = Object.assign({}, kills || {}); this.events = []; this.lures = [];
  this.dopT = this.rng.uniform(70, 130) / (cfg.doppel_rate || 1);
}
HostSim.prototype.exitOpen = function () { return this.story.exitOpen(); };
HostSim.prototype.ev = function () { this.events.push(Array.prototype.slice.call(arguments)); };
HostSim.prototype.aliveCount = function () {
  var n = 0; for (var k in this.mons) { var m = this.mons[k]; if (m.state !== 3 && m.kind === 0) n++; } return n;
};
HostSim.prototype.recomputeFlow = function (players) {
  var src = [], w = this.w;
  for (var k in players) { var p = players[k]; if (p[2]) src.push([w.idx(p[0]), w.idx(p[1])]); }
  this.flow = src.length ? w.flowField(src) : null;
};
HostSim.prototype.spawnPos = function (players) {
  var w = this.w, G = w.G, alive = [];
  for (var k in players) if (players[k][2]) alive.push(players[k]);
  if (!this.flow) this.recomputeFlow(players);
  var cand = [], i, j;
  for (i = 1; i < G; i += 2) for (j = 1; j < G; j += 2) {
    var c = w.cellCenter(i, j), fd = this.flow ? this.flow[i * G + j] : 99;
    if (fd < 9) continue;
    var bad = alive.some(function (p) { return Math.hypot(c[0] - p[0], c[1] - p[1]) < 16 || w.los(c[0], c[1], p[0], p[1]); });
    if (!bad) cand.push([fd, c[0], c[1]]);
  }
  if (!cand.length) {
    var best = null;
    for (i = 1; i < G; i += 2) for (j = 1; j < G; j += 2) {
      var c2 = w.cellCenter(i, j), d = 99;
      alive.forEach(function (p) { d = Math.min(d, Math.hypot(c2[0] - p[0], c2[1] - p[1])); });
      if (!best || d > best[0]) best = [d, c2[0], c2[1]];
    }
    cand = [[0, best[1], best[2]]];
  }
  cand.sort(function (a, b) { return a[0] - b[0]; });
  var pick = this.rng.choice(cand.slice(0, Math.max(1, Math.floor(cand.length / 3))));
  return w.collide(pick[1] + this.rng.uniform(-1.2, 1.2), pick[2] + this.rng.uniform(-1.2, 1.2), MONSTER_R);
};
HostSim.prototype.spawnOne = function (players) {
  var p = this.spawnPos(players);
  var m = new Mon(this.nextId++, p[0], p[1], (100 + 18 * (this.wave - 1)) * this.mHp, Math.min(3.3 + 0.12 * this.wave, 4.9) * this.mSp);
  this.mons[m.id] = m;
  return m;
};
HostSim.prototype.spawnDoppel = function (players) {
  var alive = [];
  for (var k in players) if (players[k][2]) alive.push(+k);
  if (!alive.length) return null;
  var p = this.spawnPos(players);
  var m = new Mon(this.nextId++, p[0], p[1], 160 * this.mHp, 5.2, 1, this.rng.choice(alive));
  this.mons[m.id] = m;
  return m;
};
HostSim.prototype.alert = function (x, z, radius, amount) {
  radius = radius || 26; amount = amount || 10;
  for (var k in this.mons) {
    var m = this.mons[k];
    if (m.state !== 3 && m.kind === 0 && Math.hypot(m.x - x, m.z - z) < radius) m.aggro = Math.max(m.aggro, amount);
  }
};
HostSim.prototype.addLure = function (x, z, dur) { this.lures.push([x, z, dur || 10]); };
HostSim.prototype.reveal = function (m) { m.revealed = true; m.state = 1; m.aggro = 30; this.ev("reveal", m.id); };
HostSim.prototype.damage = function (mid, dmg, pid) {
  var m = this.mons[mid];
  if (!m || m.state === 3) return false;
  m.hp -= dmg; m.aggro = 14;
  this.ev("mhit", mid);
  if (m.kind === 1 && !m.revealed) this.reveal(m);
  if (m.hp <= 0) {
    m.state = 3; m.deadT = 2.5;
    this.kills[pid] = (this.kills[pid] || 0) + 1;
    this.ev("mdie", mid, pid);
    if (m.kind === 1) this.dopT = this.rng.uniform(110, 170) / (this.w.cfg.doppel_rate || 1);
    return true;
  }
  return false;
};
HostSim.prototype.useThing = function (tid, pid) {
  var adv = this.story.use(tid);
  if (adv === null) return false;
  this.ev("use", tid, pid);
  if (adv) this.stepChanged();
  return true;
};
HostSim.prototype.stepChanged = function () {
  this.ev("obj", this.story.idx);
  if (this.story.step().type === "survive" && this.phase === "break") this.timer = Math.min(this.timer, 6);
  if (this.story.exitOpen()) this.ev("exit");
};
HostSim.prototype.toward = function (m, ci, cj, fd, px, pz, direct) {
  if (direct) return [px - m.x, pz - m.z];
  var w = this.w, G = w.G, best = null, self = this;
  w.openNeighbors(ci, cj).forEach(function (q) {
    var dv = self.flow ? self.flow[q[0] * G + q[1]] : -1;
    if (dv >= 0 && (!best || dv < best[0])) best = [dv, q[0], q[1]];
  });
  if (best && (fd < 0 || best[0] < fd)) { var c = w.cellCenter(best[1], best[2]); return [c[0] - m.x, c[1] - m.z]; }
  return [px - m.x, pz - m.z];
};

HostSim.prototype.update = function (dt, players) {
  var w = this.w, G = w.G, alive = {}, k, self = this;
  for (k in players) if (players[k][2]) alive[k] = players[k];
  var anyAlive = Object.keys(alive).length > 0;

  this.timer -= dt;
  if (this.phase === "calm" || this.phase === "break") {
    if (this.timer <= 0) {
      this.wave++; this.phase = "fight";
      this.toSpawn = Math.max(1, Math.round(Math.min(2 + 2 * this.wave, 20) * this.mCount));
      this.spawnT = 0.5;
      this.ev("wave", this.wave);
    }
  } else if (this.phase === "fight") {
    this.spawnT -= dt;
    if (this.toSpawn > 0 && this.spawnT <= 0 && this.aliveCount() < 10 && anyAlive) {
      var nm = this.spawnOne(players);
      this.toSpawn--;
      this.spawnT = Math.max(0.9, 3.0 - 0.15 * this.wave);
      if (this.rng.random() < 0.5) this.ev("growl", nm.id);
    }
    if (this.toSpawn === 0 && this.aliveCount() === 0) {
      this.phase = "break"; this.timer = 14;
      this.ev("clear", this.wave);
      if (this.story.onWaveClear()) this.stepChanged();
    }
  }
  if (this.phase !== "calm" && anyAlive) {
    var hasDop = false;
    for (k in this.mons) if (this.mons[k].kind === 1 && this.mons[k].state !== 3) hasDop = true;
    if (!hasDop) { this.dopT -= dt; if (this.dopT <= 0) { this.spawnDoppel(players); this.dopT = 9999; } }
  }
  this.lures.forEach(function (L) { L[2] -= dt; });
  this.lures = this.lures.filter(function (L) { return L[2] > 0; });
  this.flowT -= dt;
  if (this.flowT <= 0) { this.recomputeFlow(players); this.flowT = 0.35; }

  var mons = Object.keys(this.mons).map(function (k) { return self.mons[k]; }), dead = [];
  mons.forEach(function (m) {
    if (m.state === 3) { m.deadT -= dt; if (m.deadT <= 0) dead.push(m.id); return; }
    m.cd = Math.max(0, m.cd - dt); m.aggro = Math.max(0, m.aggro - dt); m.screamCd = Math.max(0, m.screamCd - dt);
    var tgt = null, td = 1e9;
    for (var pid in alive) { var d = Math.hypot(alive[pid][0] - m.x, alive[pid][1] - m.z); if (d < td) { td = d; tgt = pid; } }
    var ci = w.idx(m.x), cj = w.idx(m.z), fd = self.flow ? self.flow[ci * G + cj] : -1;
    var see = tgt !== null && td < 24 && w.los(m.x, m.z, alive[tgt][0], alive[tgt][1]);
    var chasing = tgt !== null && (see || m.aggro > 0 || (fd >= 0 && fd <= 9) || (self.phase === "fight" && fd >= 0));
    var lure = null;
    if (m.kind === 0 && m.state !== 2) {
      self.lures.forEach(function (L) {
        var dl = Math.hypot(L[0] - m.x, L[1] - m.z);
        if (dl < 18 && (!lure || dl < lure[0]) && w.los(m.x, m.z, L[0], L[1])) lure = [dl, L[0], L[1]];
      });
      if (lure && td < 3.5) lure = null;
    }
    var dir = [0, 0], speed = 0, px, pz;
    if (m.kind === 1 && !m.revealed) {
      if (tgt !== null) {
        px = alive[tgt][0]; pz = alive[tgt][1];
        if (td < 2.4 || m.actT > 28) self.reveal(m);
        else if (td > 6) { m.state = 0; dir = self.toward(m, ci, cj, fd, px, pz, see); speed = 2.3; }
        else { m.state = 4; m.actT += dt; dir = [px - m.x, pz - m.z]; speed = 0; }
        m.mimicT -= dt;
        if (m.mimicT <= 0 && td < 40) { self.ev("mimic", m.id, m.copy); m.mimicT = self.rng.uniform(9, 16); }
      }
    } else if (m.state === 2) {
      m.atk -= dt;
      if (m.atk <= 0) {
        if (tgt !== null && td < 2.0) self.ev("hurt", +tgt, Math.round((m.kind === 1 ? 35 : 22 + 2 * self.wave) * self.mDmg), m.id);
        m.state = 1; m.cd = 1.15;
      }
      speed = 0.6;
      if (tgt !== null) dir = [alive[tgt][0] - m.x, alive[tgt][1] - m.z];
    } else if (lure) {
      m.state = 0; dir = [lure[1] - m.x, lure[2] - m.z]; speed = lure[0] > 1.6 ? m.speed * 0.8 : 0;
    } else if (chasing) {
      if (m.state === 0 && m.screamCd <= 0 && see) { self.ev("scream", m.id); m.screamCd = 12; }
      m.state = 1;
      px = alive[tgt][0]; pz = alive[tgt][1];
      dir = self.toward(m, ci, cj, fd, px, pz, see || td < 3);
      speed = m.speed;
      if (td < 1.45 && m.cd <= 0 && see) { m.state = 2; m.atk = 0.42; self.ev("swing", m.id); }
      m.growl -= dt;
      if (m.growl <= 0 && m.kind === 0) { self.ev("growl", m.id); m.growl = self.rng.uniform(4, 10); }
    } else {
      m.state = 0; m.wt -= dt;
      if (m.wt <= 0 || Math.hypot(m.wx - m.x, m.wz - m.z) < 0.6) {
        var nb = w.openNeighbors(ci, cj);
        if (nb.length) { var q = self.rng.choice(nb), cc = w.cellCenter(q[0], q[1]); m.wx = cc[0]; m.wz = cc[1]; }
        m.wt = self.rng.uniform(2.5, 6);
      }
      dir = [m.wx - m.x, m.wz - m.z]; speed = 1.1;
    }
    var L = Math.hypot(dir[0], dir[1]), dx = 0, dz = 0;
    if (L > 1e-4) { dx = dir[0] / L; dz = dir[1] / L; }
    var face = L > 1e-4 ? Math.atan2(dx, dz) * 180 / Math.PI : m.rot;
    if (m.detour > 0) { m.detour -= dt; dx = dx * 0.3 + m.dx * 0.9; dz = dz * 0.3 + m.dz * 0.9; }
    mons.forEach(function (o) {
      if (o === m || o.state === 3) return;
      var ex = m.x - o.x, ez = m.z - o.z, d2 = ex * ex + ez * ez;
      if (d2 > 1e-6 && d2 < 0.9) { var d = Math.sqrt(d2); dx += ex / d * 0.8; dz += ez / d * 0.8; }
    });
    var kk = Math.min(1, dt * 6);
    m.vx += (dx * speed - m.vx) * kk; m.vz += (dz * speed - m.vz) * kk;
    var ox = m.x, oz = m.z;
    var np = w.collide(m.x + m.vx * dt, m.z + m.vz * dt, MONSTER_R);
    m.x = np[0]; m.z = np[1];
    var moved = Math.hypot(m.x - ox, m.z - oz);
    if (speed > 1 && moved < speed * dt * 0.2) {
      m.stuck += dt;
      if (m.stuck > 0.5) {
        var sg = self.rng.random() < 0.5 ? -1 : 1;
        m.dx = -dz * sg; m.dz = dx * sg; m.detour = self.rng.uniform(0.5, 1.1); m.stuck = 0;
      }
    } else m.stuck = 0;
    var dr = ((face - m.rot + 540) % 360) - 180;
    m.rot += dr * Math.min(1, dt * 8);
  });
  dead.forEach(function (id) { delete self.mons[id]; });
  var ev = this.events; this.events = [];
  return ev;
};
HostSim.prototype.snapshot = function () {
  var out = [];
  for (var k in this.mons) {
    var m = this.mons[k];
    out.push([m.id, +m.x.toFixed(2), +m.z.toFixed(2), +m.rot.toFixed(1), m.state, +(Math.max(m.hp, 0) / m.maxhp).toFixed(2), m.kind, m.copy]);
  }
  return out;
};
HostSim.prototype.info = function () {
  return { w: this.wave, ph: this.phase, t: +Math.max(this.timer, 0).toFixed(1), left: this.toSpawn + this.aliveCount(),
    ex: this.exitOpen(), st: this.story.toJSON() };
};

if (typeof module !== "undefined") module.exports = { Story: Story, HostSim: HostSim };
