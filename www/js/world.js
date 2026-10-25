// BACKROOMS - MÓVIL 22 · Lógica del mundo: generación, colisión, rayos, luz horneada
"use strict";

// ---------------------------------------------------------------------------
// RNG determinista (todas las máquinas generan el mismo nivel con la misma semilla)
// ---------------------------------------------------------------------------
function RNG(seed) {
  this.s = (seed >>> 0) || 1;
}
RNG.prototype.random = function () {
  var t = (this.s += 0x6D2B79F5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
RNG.prototype.uniform = function (a, b) { return a + (b - a) * this.random(); };
RNG.prototype.randrange = function (n) { return Math.floor(this.random() * n); };
RNG.prototype.randint = function (a, b) { return a + Math.floor(this.random() * (b - a + 1)); };
RNG.prototype.choice = function (arr) { return arr[Math.floor(this.random() * arr.length)]; };
RNG.prototype.shuffle = function (arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(this.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
};

var PLAYER_R = 0.32, MONSTER_R = 0.38;

function levelCfg(i) { return DATA.LEVELS[i % DATA.LEVELS.length]; }
function levelTier(i) { return Math.floor(i / DATA.LEVELS.length); }
function levelTitle(i) {
  var c = levelCfg(i), t = levelTier(i);
  return ["NIVEL " + c.num + (t === 0 ? "" : " (ciclo " + (t + 1) + ")"), c.name];
}

// ---------------------------------------------------------------------------
// Mundo
// ---------------------------------------------------------------------------
function World(seed, level) {
  var cfg = this.cfg = levelCfg(level);
  this.level = level;
  this.seed = seed;
  this.wall = cfg.wall; this.room = cfg.room; this.step = this.wall + this.room; this.h = cfg.h;
  var n = this.n = cfg.n;
  var G = this.G = 2 * n + 1;
  var rng = new RNG(seed * 7 + level + 1);
  var s = this.solid = new Uint8Array(G * G);
  var i, j, a, b;
  for (i = 0; i < G * G; i++) s[i] = 1;
  for (i = 1; i < G; i += 2) for (j = 1; j < G; j += 2) s[i * G + j] = 0;
  var S = function (i, j) { return s[i * G + j]; };
  var set = function (i, j, v) { s[i * G + j] = v; };

  // laberinto base
  var vis = new Uint8Array(n * n);
  var st = [[rng.randrange(n), rng.randrange(n)]];
  vis[st[0][0] * n + st[0][1]] = 1;
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (st.length) {
    var cur = st[st.length - 1];
    var nb = [];
    for (var d = 0; d < 4; d++) {
      var c = cur[0] + dirs[d][0], e = cur[1] + dirs[d][1];
      if (c >= 0 && c < n && e >= 0 && e < n && !vis[c * n + e]) nb.push([c, e, dirs[d][0], dirs[d][1]]);
    }
    if (!nb.length) { st.pop(); continue; }
    var p = rng.choice(nb);
    set(2 * cur[0] + 1 + p[2], 2 * cur[1] + 1 + p[3], 0);
    vis[p[0] * n + p[1]] = 1;
    st.push([p[0], p[1]]);
  }
  for (i = 1; i < G - 1; i++) for (j = 1; j < G - 1; j++)
    if ((i % 2) !== (j % 2) && S(i, j) && rng.random() < cfg.braid) set(i, j, 0);
  for (var k = 0; k < cfg.halls; k++) {
    var w = rng.randint(2, 4), h = rng.randint(2, 4);
    a = rng.randrange(n - w + 1); b = rng.randrange(n - h + 1);
    for (i = 2 * a + 1; i < 2 * (a + w); i++) for (j = 2 * b + 1; j < 2 * (b + h); j++)
      if ((i % 2) !== (j % 2)) set(i, j, 0);
  }
  for (i = 2; i < G - 1; i += 2) for (j = 2; j < G - 1; j += 2)
    if (!(S(i - 1, j) || S(i + 1, j) || S(i, j - 1) || S(i, j + 1))) set(i, j, rng.random() < cfg.pillar ? 1 : 0);

  this.xb = new Float64Array(G + 1);
  for (i = 0; i < G; i++) this.xb[i + 1] = this.xb[i] + (i % 2 ? this.room : this.wall);
  this.size = this.xb[G];

  // luces
  this.lights = [];
  var dark = [];
  for (k = 0; k < cfg.dark; k++) dark.push([rng.randrange(n), rng.randrange(n)]);
  for (a = 0; a < n; a++) for (b = 0; b < n; b++) {
    i = 2 * a + 1; j = 2 * b + 1;
    var cc = this.cellCenter(i, j);
    var inDark = dark.some(function (q) { return Math.max(Math.abs(a - q[0]), Math.abs(b - q[1])) <= 1; });
    var r = rng.random(), kind = -1;
    if (inDark) { if (r < 0.6) kind = 2; else if (r < 0.75) kind = 1; }
    else if (r < cfg.flick) kind = 1;
    else if (r < cfg.flick + cfg.dead) kind = 2;
    else if (r < cfg.flick + cfg.dead + cfg.lit) kind = 0;
    if (kind >= 0) this.lights.push({ x: cc[0], z: cc[1], kind: kind, i: i, j: j });
  }
  var best = null, self = this;
  this.lights.forEach(function (L) {
    if (L.kind !== 0) return;
    var dd = Math.abs(L.i - (G >> 1)) + Math.abs(L.j - (G >> 1));
    if (!best || dd < best[0]) best = [dd, L.i, L.j];
  });
  if (!best) best = [0, (G >> 1) | 1, (G >> 1) | 1];
  this.spawnCell = [best[1], best[2]];
  this.spawn = this.cellCenter(best[1], best[2]);

  // salida
  var fl = this.flowField([this.spawnCell]);
  var far = null;
  for (i = 1; i < G; i += 2) for (j = 1; j < G; j += 2)
    if (fl[i * G + j] > 0 && (!far || fl[i * G + j] > far[0])) far = [fl[i * G + j], i, j];
  this.exitCell = far ? [far[1], far[2]] : this.spawnCell;
  this.exit = this.cellCenter(this.exitCell[0], this.exitCell[1]);
  var ei = this.exitCell[0], ej = this.exitCell[1], bb = null;
  this.openNeighbors(ei, ej).forEach(function (q) {
    var v = fl[q[0] * G + q[1]];
    if (!bb || v < bb[0]) bb = [v, q[0] - ei, q[1] - ej];
  });
  this.exitRot = bb ? Math.atan2(bb[1], bb[2]) * 180 / Math.PI : 0;
  this.lights = this.lights.filter(function (L) { return !(L.i === ei && L.j === ej); });
  this.lights.push({ x: this.exit[0], z: this.exit[1], kind: 0, i: ei, j: ej });

  // lugares
  var rooms = [];
  for (i = 1; i < G; i += 2) for (j = 1; j < G; j += 2)
    if (!(i === this.spawnCell[0] && j === this.spawnCell[1]) && !(i === ei && j === ej)) rooms.push([i, j]);
  rng.shuffle(rooms);
  var fmax = 1;
  for (i = 0; i < fl.length; i++) fmax = Math.max(fmax, fl[i]);
  var cand = rooms.filter(function (q) { return fl[q[0] * G + q[1]] >= fmax * 0.3; });
  var spots = [];
  while (cand.length && spots.length < 6) {
    var pick;
    if (!spots.length) pick = cand[0];
    else {
      var bs = -1;
      cand.forEach(function (q) {
        var m = 1e9;
        spots.forEach(function (sp) { m = Math.min(m, Math.abs(q[0] - sp[0]) + Math.abs(q[1] - sp[1])); });
        if (m > bs) { bs = m; pick = q; }
      });
    }
    spots.push(pick);
    cand.splice(cand.indexOf(pick), 1);
  }
  spots.forEach(function (q) { rooms.splice(rooms.indexOf(q), 1); });
  this.objSpots = spots.map(function (q) { return self.cellCenter(q[0], q[1]); });
  this.noteSpots = [];
  for (k = 0; k < 3; k++) {
    var c3 = this.cellCenter(rooms[k][0], rooms[k][1]);
    this.noteSpots.push([c3[0] + rng.uniform(-1, 1), c3[1] + rng.uniform(-1, 1), rng.uniform(0, 360)]);
  }
  rooms = rooms.slice(3);
  var c4 = this.cellCenter(rooms[0][0], rooms[0][1]);
  this.shotgunSpot = [c4[0], c4[1], rng.uniform(0, 360)];
  rooms = rooms.slice(1);

  this.pickups = [];
  var off = Math.max(0.3, this.room / 2 - 0.7);
  var kinds = ["ammo", "ammo", "med", "ammo", "flare"];
  var npk = Math.max(10, Math.floor(n * 2.2));
  for (k = 0; k < npk && k < rooms.length; k++) {
    var c5 = this.cellCenter(rooms[k][0], rooms[k][1]);
    this.pickups.push([k, kinds[k % kinds.length], c5[0] + rng.uniform(-off, off), c5[1] + rng.uniform(-off, off), rng.uniform(0, 360)]);
  }
  rooms = rooms.slice(npk);

  // decorado y obstáculos [cx, cz, hx, hz, alto]
  this.obstacles = [];
  this.crates = [];
  this.props = [];
  var room = this.room;
  function againstWall(i, j, depth) {
    var opts = [[-1, 0], [1, 0], [-1, 1], [1, 1]];
    rng.shuffle(opts);
    for (var q = 0; q < 4; q++) {
      var sd = opts[q][0], al = opts[q][1];
      var ni = al === 0 ? i + sd : i, nj = al === 0 ? j : j + sd;
      if (S(ni, nj)) {
        var cc = self.cellCenter(i, j);
        var dd = room / 2 - depth;
        var sl = rng.uniform(-room / 2 + 1.2, room / 2 - 1.2);
        return al === 0 ? [cc[0] + sd * dd, cc[1] + sl, al, sd] : [cc[0] + sl, cc[1] + sd * dd, al, sd];
      }
    }
    return null;
  }
  if (cfg.crates) {
    rooms.slice(0, n * 2).forEach(function (q) {
      var w = againstWall(q[0], q[1], 0.75);
      if (!w) return;
      var hg = rng.choice([1, 2, 2, 3]);
      self.crates.push([w[0], w[1], hg]);
      self.obstacles.push([w[0], w[1], 0.62, 0.62, hg * 1.1]);
    });
    rooms.slice(n * 2, n * 3).forEach(function (q) {
      var cc = self.cellCenter(q[0], q[1]);
      self.props.push({ kind: "puddle", x: cc[0] + rng.uniform(-1.5, 1.5), z: cc[1] + rng.uniform(-1.5, 1.5), r: rng.uniform(0.7, 1.6) });
    });
  }
  var ndesk = cfg.desks || 0;
  rooms.slice(0, ndesk).forEach(function (q) {
    var w = againstWall(q[0], q[1], 0.5);
    if (!w) return;
    var rot = w[2] === 0 ? -90 * w[3] : (w[3] < 0 ? 0 : 180);
    var hx = w[2] === 0 ? 0.4 : 0.8, hz = w[2] === 0 ? 0.8 : 0.4;
    self.obstacles.push([w[0], w[1], hx, hz, 0.8]);
    self.props.push({ kind: "desk", x: w[0], z: w[1], rot: rot, monitor: rng.random() < 0.7, phone: rng.random() < 0.35 });
  });
  var nlock = cfg.lockers || 0;
  rooms.slice(ndesk, ndesk + nlock).forEach(function (q) {
    var w = againstWall(q[0], q[1], 0.3);
    if (!w) return;
    var hx = w[2] === 0 ? 0.28 : 0.95, hz = w[2] === 0 ? 0.95 : 0.28;
    self.obstacles.push([w[0], w[1], hx, hz, 1.95]);
    self.props.push({ kind: "lockers", x: w[0], z: w[1], rot: w[2] === 0 ? -90 * w[3] : (w[3] < 0 ? 0 : 180) });
  });
  if (cfg.vents) {
    var vr = rooms.filter(function (_, ix) { return ix % 3 === 0; }).slice(0, cfg.vents);
    vr.forEach(function (q) {
      var w = againstWall(q[0], q[1], 0.02);
      if (!w) return;
      var nx = w[2] === 0 ? -w[3] : 0, nz = w[2] === 0 ? 0 : -w[3];
      self.props.push({ kind: "vent", x: w[0], z: w[1], nx: nx, nz: nz });
    });
  }
  if (cfg.car) {
    var si = this.spawnCell[0], sj = this.spawnCell[1];
    var nbs = this.openNeighbors(si, sj);
    for (k = 0; k < nbs.length; k++) {
      var ci = si + 2 * (nbs[k][0] - si), cj = sj + 2 * (nbs[k][1] - sj);
      if (ci > 0 && ci < G && cj > 0 && cj < G && !S(ci, cj) && !(ci === ei && cj === ej)) {
        var cc6 = this.cellCenter(ci, cj);
        var alongX = nbs[k][0] !== si;
        this.obstacles.push([cc6[0], cc6[1], alongX ? 2.25 : 0.95, alongX ? 0.95 : 2.25, 1.5]);
        this.props.push({ kind: "car", x: cc6[0], z: cc6[1], rot: (alongX ? 90 : 0) + rng.uniform(-6, 6) });
        for (var q2 = 0; q2 < 4; q2++) {
          var a2 = q2 * Math.PI / 2 + 0.4;
          this.props.push({ kind: "cone", x: cc6[0] + Math.cos(a2) * 2.0, z: cc6[1] + Math.sin(a2) * 2.0 });
        }
        this.props.push({ kind: "chalk", x: cc6[0] + (alongX ? 0 : 1.6), z: cc6[1] + (alongX ? 1.6 : 0), rot: rng.uniform(0, 360) });
        break;
      }
    }
  }
  this.objSpots.slice(0, 3).forEach(function (sp) {
    self.props.push({ kind: "chalk", x: sp[0] + rng.uniform(-1, 1), z: sp[1] + rng.uniform(-1, 1), rot: rng.uniform(0, 360) });
  });
  this._raster = null;
}

World.prototype.cellCenter = function (i, j) {
  return [(this.xb[i] + this.xb[i + 1]) * 0.5, (this.xb[j] + this.xb[j + 1]) * 0.5];
};
World.prototype.idx = function (x) {
  if (x <= 0) return 0;
  var k = Math.floor(x / this.step), r = x - k * this.step;
  var i = r < this.wall ? 2 * k : 2 * k + 1;
  return Math.min(i, this.G - 1);
};
World.prototype.isSolid = function (i, j) { return this.solid[i * this.G + j] === 1; };
World.prototype.solidAt = function (x, z) {
  if (x < 0 || z < 0 || x >= this.size || z >= this.size) return true;
  return this.isSolid(this.idx(x), this.idx(z));
};
World.prototype.openNeighbors = function (i, j) {
  var G = this.G, out = [];
  var c = [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]];
  for (var k = 0; k < 4; k++) {
    var a = c[k][0], b = c[k][1];
    if (a >= 0 && a < G && b >= 0 && b < G && !this.solid[a * G + b]) out.push([a, b]);
  }
  return out;
};
World.prototype.flowField = function (sources) {
  var G = this.G, dist = new Int32Array(G * G).fill(-1), q = new Int32Array(G * G * 2), qh = 0, qt = 0;
  for (var k = 0; k < sources.length; k++) {
    var i = sources[k][0], j = sources[k][1];
    if (i >= 0 && i < G && j >= 0 && j < G && !this.solid[i * G + j] && dist[i * G + j] < 0) {
      dist[i * G + j] = 0; q[qt++] = i; q[qt++] = j;
    }
  }
  var s = this.solid;
  while (qh < qt) {
    var a = q[qh++], b = q[qh++], d = dist[a * G + b] + 1;
    if (a + 1 < G && !s[(a + 1) * G + b] && dist[(a + 1) * G + b] < 0) { dist[(a + 1) * G + b] = d; q[qt++] = a + 1; q[qt++] = b; }
    if (a > 0 && !s[(a - 1) * G + b] && dist[(a - 1) * G + b] < 0) { dist[(a - 1) * G + b] = d; q[qt++] = a - 1; q[qt++] = b; }
    if (b + 1 < G && !s[a * G + b + 1] && dist[a * G + b + 1] < 0) { dist[a * G + b + 1] = d; q[qt++] = a; q[qt++] = b + 1; }
    if (b > 0 && !s[a * G + b - 1] && dist[a * G + b - 1] < 0) { dist[a * G + b - 1] = d; q[qt++] = a; q[qt++] = b - 1; }
  }
  return dist;
};

World.prototype.collide = function (x, z, r) {
  var obs = this.obstacles, k;
  for (k = 0; k < obs.length; k++) {
    var o = obs[k], ex = o[2] + r, ez = o[3] + r, dx = x - o[0], dz = z - o[1];
    if (Math.abs(dx) < ex && Math.abs(dz) < ez) {
      var px = ex - Math.abs(dx), pz = ez - Math.abs(dz);
      if (px < pz) x += dx < 0 ? -px : px; else z += dz < 0 ? -pz : pz;
    }
  }
  var xb = this.xb, G = this.G, s = this.solid;
  for (var it = 0; it < 3; it++) {
    var moved = false;
    var i0 = this.idx(x - r), i1 = this.idx(x + r), j0 = this.idx(z - r), j1 = this.idx(z + r);
    for (var i = i0; i <= i1; i++) for (var j = j0; j <= j1; j++) {
      if (!s[i * G + j]) continue;
      var ax0 = xb[i], ax1 = xb[i + 1], az0 = xb[j], az1 = xb[j + 1];
      var cx = Math.min(Math.max(x, ax0), ax1), cz = Math.min(Math.max(z, az0), az1);
      var dx2 = x - cx, dz2 = z - cz, d2 = dx2 * dx2 + dz2 * dz2;
      if (d2 >= r * r) continue;
      if (d2 > 1e-10) {
        var d = Math.sqrt(d2), push = r - d;
        x += dx2 / d * push; z += dz2 / d * push;
      } else {
        var opts = [[x - ax0 + r, -1, 0], [ax1 - x + r, 1, 0], [z - az0 + r, 0, -1], [az1 - z + r, 0, 1]];
        opts.sort(function (p, q) { return p[0] - q[0]; });
        x += opts[0][1] * opts[0][0]; z += opts[0][2] * opts[0][0];
      }
      moved = true;
    }
    if (!moved) break;
  }
  x = Math.min(Math.max(x, r), this.size - r);
  z = Math.min(Math.max(z, r), this.size - r);
  return [x, z];
};

World.prototype.raycast2d = function (ox, oz, dx, dz, maxd) {
  var G = this.G, xb = this.xb, s = this.solid;
  var i = this.idx(ox), j = this.idx(oz);
  if (s[i * G + j]) return [0, 0, 0];
  var sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  var tx = dx !== 0 ? ((dx > 0 ? xb[i + 1] : xb[i]) - ox) / dx : Infinity;
  var tz = dz !== 0 ? ((dz > 0 ? xb[j + 1] : xb[j]) - oz) / dz : Infinity;
  for (var n = 0; n < 4 * G; n++) {
    var t;
    if (tx < tz) {
      t = tx;
      if (t > maxd) return [maxd, 0, 0];
      i += sx;
      if (i < 0 || i >= G || s[i * G + j]) return [t, -sx, 0];
      tx = ((dx > 0 ? xb[i + 1] : xb[i]) - ox) / dx;
    } else {
      t = tz;
      if (t > maxd) return [maxd, 0, 0];
      j += sz;
      if (j < 0 || j >= G || s[i * G + j]) return [t, 0, -sz];
      tz = ((dz > 0 ? xb[j + 1] : xb[j]) - oz) / dz;
    }
  }
  return [maxd, 0, 0];
};
World.prototype.los = function (ax, az, bx, bz) {
  var dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz);
  if (d < 1e-4) return true;
  return this.raycast2d(ax, az, dx / d, dz / d, d)[0] >= d - 1e-3;
};
function rayBox(o, d, x0, y0, z0, x1, y1, z1) {
  var tmin = 0, tmax = 1e9, nrm = [0, 0, 0];
  var lo = [x0, y0, z0], hi = [x1, y1, z1];
  for (var ax = 0; ax < 3; ax++) {
    if (Math.abs(d[ax]) < 1e-9) { if (o[ax] < lo[ax] || o[ax] > hi[ax]) return null; continue; }
    var t1 = (lo[ax] - o[ax]) / d[ax], t2 = (hi[ax] - o[ax]) / d[ax], n1 = -1;
    if (t1 > t2) { var tt = t1; t1 = t2; t2 = tt; n1 = 1; }
    if (t1 > tmin) { tmin = t1; nrm = [0, 0, 0]; nrm[ax] = n1; }
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (tmin <= 0) return null;
  return [tmin, nrm];
}
World.prototype.raycast3d = function (o, d, maxd) {
  maxd = maxd || 80;
  var t = maxd, normal = [0, 0, 0], kind = "none";
  if (Math.hypot(d[0], d[2]) > 1e-6) {
    var r = this.raycast2d(o[0], o[2], d[0], d[2], maxd);
    t = r[0]; normal = [r[1], 0, r[2]]; kind = (r[1] || r[2]) ? "wall" : "none";
  }
  for (var k = 0; k < this.obstacles.length; k++) {
    var ob = this.obstacles[k];
    var tb = rayBox(o, d, ob[0] - ob[2], 0, ob[1] - ob[3], ob[0] + ob[2], ob[4], ob[1] + ob[3]);
    if (tb && tb[0] < t) { t = tb[0]; normal = tb[1]; kind = "wall"; }
  }
  if (d[1] < -1e-6) { var tf = -o[1] / d[1]; if (tf < t) { t = tf; normal = [0, 1, 0]; kind = "floor"; } }
  else if (d[1] > 1e-6) { var tc = (this.h - o[1]) / d[1]; if (tc < t) { t = tc; normal = [0, -1, 0]; kind = "ceil"; } }
  return [t, normal, kind];
};

// ---------------------------------------------------------------------------
// Iluminación horneada
// ---------------------------------------------------------------------------
World.prototype.raster = function () {
  if (this._raster) return this._raster;
  var res = 0.1, N = Math.round(this.size / res), G = this.G, xb = this.xb;
  var ix = new Int32Array(N);
  for (var k = 0, c = 0; k < N; k++) {
    var x = (k + 0.5) * res;
    while (c < G - 1 && xb[c + 1] <= x) c++;
    ix[k] = c;
  }
  var r = new Uint8Array(N * N);
  for (var a = 0; a < N; a++) for (var b = 0; b < N; b++) r[a * N + b] = this.solid[ix[a] * G + ix[b]];
  this.obstacles.forEach(function (o) {
    if (o[4] < 1.8) return;
    var a0 = Math.max(0, Math.floor((o[0] - o[2]) / res)), a1 = Math.min(N, Math.floor((o[0] + o[2]) / res));
    var b0 = Math.max(0, Math.floor((o[1] - o[3]) / res)), b1 = Math.min(N, Math.floor((o[1] + o[3]) / res));
    for (var a = a0; a < a1; a++) for (var b = b0; b < b1; b++) r[a * N + b] = 1;
  });
  this._raster = { r: r, res: res, N: N };
  return this._raster;
};

// pts: Float32Array (P*3), nrm: Float32Array (P*3) o null
World.prototype.bake = function (pts, nrm) {
  var R = this.raster(), rast = R.r, res = R.res, N = R.N;
  var Ls = this.lights.filter(function (L) { return L.kind !== 2; });
  var P = pts.length / 3, out = new Float32Array(P);
  var I = this.cfg.light_i, RAD = 11 + (this.h - 3) * 2, RAD2 = RAD * RAD, K = 40, ly = this.h - 0.05;
  // grilla de luces
  var cs = 6, gw = Math.ceil(this.size / cs) + 1, grid = [];
  for (var g = 0; g < gw * gw; g++) grid.push([]);
  Ls.forEach(function (L, idx) { grid[Math.floor(L.x / cs) * gw + Math.floor(L.z / cs)].push(idx); });
  var reach = Math.ceil(RAD / cs);
  for (var p = 0; p < P; p++) {
    var px = pts[p * 3], py = pts[p * 3 + 1], pz = pts[p * 3 + 2];
    var nx = 0, ny = 0, nz = 0, hasN = !!nrm;
    if (hasN) { nx = nrm[p * 3]; ny = nrm[p * 3 + 1]; nz = nrm[p * 3 + 2]; }
    var gx = Math.floor(px / cs), gz = Math.floor(pz / cs), acc = 0;
    for (var a = gx - reach; a <= gx + reach; a++) {
      if (a < 0 || a >= gw) continue;
      for (var b = gz - reach; b <= gz + reach; b++) {
        if (b < 0 || b >= gw) continue;
        var cell = grid[a * gw + b];
        for (var q = 0; q < cell.length; q++) {
          var L = Ls[cell[q]];
          var dx = L.x - px, dy = ly - py, dz = L.z - pz, d2 = dx * dx + dy * dy + dz * dz;
          if (d2 >= RAD2) continue;
          var dd = Math.sqrt(d2) + 1e-6;
          var sx = px + nx * 0.06, sz = pz + nz * 0.06, ex = L.x, ez = L.z;
          var t0 = Math.min(0.16 / dd, 0.5), t1 = 1 - 0.05 / dd, blocked = false;
          for (var s = 0; s < K; s++) {
            var t = t0 + (t1 - t0) * s / (K - 1);
            var cx = (sx + (ex - sx) * t) / res | 0, cz = (sz + (ez - sz) * t) / res | 0;
            if (cx < 0) cx = 0; else if (cx >= N) cx = N - 1;
            if (cz < 0) cz = 0; else if (cz >= N) cz = N - 1;
            if (rast[cx * N + cz]) { blocked = true; break; }
          }
          if (blocked) continue;
          var ux = dx / dd, uy = dy / dd, uz = dz / dd;
          var lam = hasN ? Math.max(0, Math.min(1, nx * ux + ny * uy + nz * uz)) : 1;
          var emit = 0.3 + 0.7 * Math.max(0, Math.min(1, uy));
          var c = I * lam * emit / (1 + 0.13 * d2) + 0.34 * I / (1 + 0.09 * d2);
          acc += L.kind === 1 ? c * 0.55 : c;
        }
      }
    }
    out[p] = 0.05 + acc;
  }
  return out;
};
World.prototype.aoFloor = function (pts) {
  var R = this.raster(), rast = R.r, res = R.res, N = R.N, P = pts.length / 3, out = new Float32Array(P);
  for (var p = 0; p < P; p++) {
    var acc = 0, cnt = 0;
    for (var ri = 0; ri < 2; ri++) {
      var rad = ri ? 0.5 : 0.22, w = ri ? 0.6 : 1;
      for (var k = 0; k < 8; k++) {
        var a = k * Math.PI / 4;
        var cx = Math.max(0, Math.min(N - 1, ((pts[p * 3] + Math.cos(a) * rad) / res) | 0));
        var cz = Math.max(0, Math.min(N - 1, ((pts[p * 3 + 2] + Math.sin(a) * rad) / res) | 0));
        acc += rast[cx * N + cz] * w; cnt += w;
      }
    }
    out[p] = 1 - 0.55 * acc / cnt;
  }
  return out;
};
World.prototype.lightmap = function () {
  var N = Math.ceil(this.size), pts = new Float32Array(N * N * 3);
  for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
    var k = (i * N + j) * 3; pts[k] = i + 0.5; pts[k + 1] = 1.4; pts[k + 2] = j + 0.5;
  }
  this.lm = this.bake(pts, null);
  this.lmN = N;
  return this.lm;
};
World.prototype.lightAt = function (x, z) {
  var N = this.lmN, i = Math.max(0, Math.min(N - 1, x | 0)), j = Math.max(0, Math.min(N - 1, z | 0));
  return Math.min(Math.max(this.lm[i * N + j] * 0.5, 0.06), 1.4);
};

// ---------------------------------------------------------------------------
// Geometría: vértices de 8 floats  x y z  r g b  u v
// ---------------------------------------------------------------------------
function VB() { this.a = []; }
VB.prototype.v = function (x, y, z, r, g, b, u, w) { this.a.push(x, y, z, r, g, b, u, w); };
VB.prototype.quad = function (P, rgb, uv) {
  var o = [0, 1, 2, 0, 2, 3];
  for (var k = 0; k < 6; k++) { var i = o[k]; this.v(P[i][0], P[i][1], P[i][2], rgb[0], rgb[1], rgb[2], uv[i][0], uv[i][1]); }
};
VB.prototype.f32 = function () { return new Float32Array(this.a); };

var SHADE = { "0,1,0": 1.0, "0,-1,0": 0.42, "1,0,0": 0.78, "-1,0,0": 0.66, "0,0,1": 0.88, "0,0,-1": 0.58 };

// caja con sombreado falso (taper escala la cara superior)
function box(cx, cy, cz, sx, sy, sz, rgb, taper, out) {
  taper = taper || 1;
  out = out || new VB();
  var hx = sx / 2, hy = sy / 2, hz = sz / 2, tx = hx * taper, tz = hz * taper;
  var c = [[cx - hx, cy - hy, cz - hz], [cx + hx, cy - hy, cz - hz], [cx + hx, cy - hy, cz + hz], [cx - hx, cy - hy, cz + hz],
  [cx - tx, cy + hy, cz - tz], [cx + tx, cy + hy, cz - tz], [cx + tx, cy + hy, cz + tz], [cx - tx, cy + hy, cz + tz]];
  var faces = [[[4, 5, 6, 7], "0,1,0"], [[3, 2, 1, 0], "0,-1,0"], [[1, 2, 6, 5], "1,0,0"], [[3, 0, 4, 7], "-1,0,0"],
  [[2, 3, 7, 6], "0,0,1"], [[0, 1, 5, 4], "0,0,-1"]];
  var uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (var f = 0; f < 6; f++) {
    var sh = SHADE[faces[f][1]], idx = faces[f][0];
    out.quad([c[idx[0]], c[idx[1]], c[idx[2]], c[idx[3]]], [rgb[0] * sh, rgb[1] * sh, rgb[2] * sh], uv);
  }
  return out;
}
function cylinder(cx, cy, cz, r, len, rgb, axis, seg, out) {
  axis = axis || "z"; seg = seg || 12; out = out || new VB();
  var h = len / 2;
  function P(c, s, t) {
    if (axis === "z") return [cx + c * r, cy + s * r, cz + t];
    if (axis === "x") return [cx + t, cy + s * r, cz + c * r];
    return [cx + c * r, cy + t, cz + s * r];
  }
  for (var k = 0; k < seg; k++) {
    var a0 = 2 * Math.PI * k / seg, a1 = 2 * Math.PI * (k + 1) / seg;
    var c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    var sh = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin((a0 + a1) / 2));
    out.quad([P(c0, s0, -h), P(c1, s1, -h), P(c1, s1, h), P(c0, s0, h)], [rgb[0] * sh, rgb[1] * sh, rgb[2] * sh],
      [[k / seg, 0], [(k + 1) / seg, 0], [(k + 1) / seg, 1], [k / seg, 1]]);
    [[-h, 0.5], [h, 0.9]].forEach(function (e) {
      var ctr = P(0, 0, e[0]), p1 = P(c0, s0, e[0]), p2 = P(c1, s1, e[0]);
      [ctr, p1, p2].forEach(function (p) { out.v(p[0], p[1], p[2], rgb[0] * e[1], rgb[1] * e[1], rgb[2] * e[1], 0.5, 0.5); });
    });
  }
  return out;
}
function quadXY(w, h, rgb) {
  var o = new VB(); rgb = rgb || [1, 1, 1];
  o.quad([[-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0]], rgb, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  return o;
}
function floorQuad(x, z, w, l, y, rgb, uvs) {
  var o = new VB(); rgb = rgb || [1, 1, 1]; uvs = uvs || 1; y = y || 0;
  o.quad([[x - w / 2, y, z - l / 2], [x + w / 2, y, z - l / 2], [x + w / 2, y, z + l / 2], [x - w / 2, y, z + l / 2]], rgb,
    [[0, 0], [uvs, 0], [uvs, uvs], [0, uvs]]);
  return o;
}

World.prototype.buildMeshes = function () {
  var G = this.G, xb = this.xb, H = this.h, cfg = this.cfg, self = this;
  var uw = cfg.uv[0], uf = cfg.uv[1], uc = cfg.uv[2];
  var rngd = new RNG(this.seed + 99);
  // vértices crudos por grupo: x y z nx ny nz u v ao
  var raw = { floor: [], ceil: [], wall: [], base: [], pipe: [], crate: [] };
  function q(g, P, n, uv, ao) {
    var o = [0, 1, 2, 0, 2, 3], A = raw[g];
    for (var k = 0; k < 6; k++) { var i = o[k]; A.push(P[i][0], P[i][1], P[i][2], n[0], n[1], n[2], uv[i][0], uv[i][1], ao[i]); }
  }
  function splits(a, b, step) {
    var m = Math.max(1, Math.ceil((b - a) / step - 1e-6)), out = [];
    for (var k = 0; k <= m; k++) out.push(a + (b - a) * k / m);
    return out;
  }
  var water = new VB();
  var i, j, a, b;
  for (i = 0; i < G; i++) for (j = 0; j < G; j++) {
    if (this.solid[i * G + j]) continue;
    var xs = splits(xb[i], xb[i + 1], 1.0), zs = splits(xb[j], xb[j + 1], 1.0);
    for (a = 0; a < xs.length - 1; a++) for (b = 0; b < zs.length - 1; b++) {
      var x0 = xs[a], x1 = xs[a + 1], z0 = zs[b], z1 = zs[b + 1];
      var P = [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]];
      q("floor", P, [0, 1, 0], P.map(function (p) { return [p[0] / uf, p[2] / uf]; }), [1, 1, 1, 1]);
      P = [[x0, H, z0], [x1, H, z0], [x1, H, z1], [x0, H, z1]];
      q("ceil", P, [0, -1, 0], P.map(function (p) { return [p[0] / uc, p[2] / uc]; }), [1, 1, 1, 1]);
    }
    if (cfg.water) {
      var X0 = xb[i], X1 = xb[i + 1], Z0 = xb[j], Z1 = xb[j + 1];
      water.quad([[X0, 0.14, Z0], [X1, 0.14, Z0], [X1, 0.14, Z1], [X0, 0.14, Z1]], [1, 1, 1],
        [[X0 / 3, Z0 / 3], [X1 / 3, Z0 / 3], [X1 / 3, Z1 / 3], [X0 / 3, Z1 / 3]]);
    }
  }
  var ry = [0, 0.12, 0.45, H * 0.5, H - 0.45, H - 0.12, H], rao = [0.62, 0.78, 0.94, 1.0, 0.96, 0.86, 0.72];
  function wallAo(y) {
    for (var k = 0; k < ry.length - 1; k++) if (y <= ry[k + 1]) return rao[k] + (rao[k + 1] - rao[k]) * (y - ry[k]) / (ry[k + 1] - ry[k]);
    return rao[rao.length - 1];
  }
  function pipe(axis, c, a0, a1, ns, y, r, off) {
    var seg = splits(a0, a1, 1.0), ring = 8;
    for (var k = 0; k < seg.length - 1; k++) {
      var u0 = seg[k], u1 = seg[k + 1];
      for (var qq = 0; qq < ring; qq++) {
        var t0 = 2 * Math.PI * qq / ring, t1 = 2 * Math.PI * (qq + 1) / ring, tm = (t0 + t1) / 2;
        var pt = function (u, t) {
          var dn = off + Math.cos(t) * r, dy = y + Math.sin(t) * r;
          return axis === "x" ? [c + ns * dn, dy, u] : [u, dy, c + ns * dn];
        };
        var nn = axis === "x" ? [ns * Math.cos(tm), Math.sin(tm), 0] : [0, Math.sin(tm), ns * Math.cos(tm)];
        q("pipe", [pt(u0, t0), pt(u1, t0), pt(u1, t1), pt(u0, t1)], nn,
          [[u0, qq / ring], [u1, qq / ring], [u1, (qq + 1) / ring], [u0, (qq + 1) / ring]], [0.9, 0.9, 0.9, 0.9]);
      }
    }
  }
  function wallFace(axis, c, a0, a1, ns) {
    var seg = splits(a0, a1, 1.0), n = axis === "x" ? [ns, 0, 0] : [0, 0, ns];
    for (var k = 0; k < seg.length - 1; k++) {
      var u0 = seg[k], u1 = seg[k + 1];
      for (var r = 0; r < ry.length - 1; r++) {
        var y0 = ry[r], y1 = ry[r + 1];
        var P = axis === "x" ? [[c, y0, u0], [c, y0, u1], [c, y1, u1], [c, y1, u0]] : [[u0, y0, c], [u1, y0, c], [u1, y1, c], [u0, y1, c]];
        q("wall", P, n, [[u0 / uw, y0 / uw], [u1 / uw, y0 / uw], [u1 / uw, y1 / uw], [u0 / uw, y1 / uw]],
          [wallAo(y0), wallAo(y0), wallAo(y1), wallAo(y1)]);
      }
      if (cfg.base) {
        var bh = 0.11, cc = c + 0.012 * ns, P2, T;
        if (axis === "x") { P2 = [[cc, 0, u0], [cc, 0, u1], [cc, bh, u1], [cc, bh, u0]]; T = [[c, bh, u0], [c, bh, u1], [cc, bh, u1], [cc, bh, u0]]; }
        else { P2 = [[u0, 0, cc], [u1, 0, cc], [u1, bh, cc], [u0, bh, cc]]; T = [[u0, bh, c], [u1, bh, c], [u1, bh, cc], [u0, bh, cc]]; }
        q("base", P2, n, [[u0, 0], [u1, 0], [u1, 1], [u0, 1]], [0.75, 0.75, 0.95, 0.95]);
        q("base", T, [0, 1, 0], [[u0, 0.9], [u1, 0.9], [u1, 1], [u0, 1]], [1, 1, 1, 1]);
      }
    }
    if (cfg.pipes && a1 - a0 > 1.0 && rngd.random() < 0.7) {
      pipe(axis, c, a0, a1, ns, H - 0.32, 0.075, 0.1);
      if (rngd.random() < 0.5) pipe(axis, c, a0, a1, ns, H - 0.55, 0.035, 0.06);
    }
  }
  for (i = 0; i < G; i++) for (j = 0; j < G; j++) {
    if (!this.solid[i * G + j]) continue;
    if (i + 1 < G && !this.solid[(i + 1) * G + j]) wallFace("x", xb[i + 1], xb[j], xb[j + 1], 1);
    if (i > 0 && !this.solid[(i - 1) * G + j]) wallFace("x", xb[i], xb[j], xb[j + 1], -1);
    if (j + 1 < G && !this.solid[i * G + j + 1]) wallFace("z", xb[j + 1], xb[i], xb[i + 1], 1);
    if (j > 0 && !this.solid[i * G + j - 1]) wallFace("z", xb[j], xb[i], xb[i + 1], -1);
  }
  this.crates.forEach(function (cr) {
    var cx = cr[0], cz = cr[1];
    for (var k = 0; k < cr[2]; k++) {
      var sz = k === 0 ? 1.2 : 1.1, y0 = k * 1.1, y1 = y0 + 1.05;
      var x0 = cx - sz / 2, x1 = cx + sz / 2, z0 = cz - sz / 2, z1 = cz + sz / 2, uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
      var ao = k === 0 ? [0.7, 0.7, 1, 1] : [0.9, 0.9, 1, 1];
      q("crate", [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], uv, [1, 1, 1, 1]);
      q("crate", [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [1, 0, 0], uv, ao);
      q("crate", [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], [-1, 0, 0], uv, ao);
      q("crate", [[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], [0, 0, 1], uv, ao);
      q("crate", [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1], uv, ao);
    }
  });

  var lr = cfg.light_rgb[0], lg = cfg.light_rgb[1], lb = cfg.light_rgb[2];
  var out = {};
  Object.keys(raw).forEach(function (g) {
    var A = raw[g];
    if (!A.length) return;
    var nv = A.length / 9;
    // vértices únicos para hornear
    var map = new Map(), upts = [], unrm = [], inv = new Int32Array(nv);
    for (var v = 0; v < nv; v++) {
      var o = v * 9;
      var key = Math.round(A[o] * 100) + "," + Math.round(A[o + 1] * 100) + "," + Math.round(A[o + 2] * 100) + "," +
        Math.round(A[o + 3] * 10) + "," + Math.round(A[o + 4] * 10) + "," + Math.round(A[o + 5] * 10);
      var id = map.get(key);
      if (id === undefined) {
        id = upts.length / 3; map.set(key, id);
        upts.push(A[o], A[o + 1], A[o + 2]); unrm.push(A[o + 3], A[o + 4], A[o + 5]);
      }
      inv[v] = id;
    }
    var up = new Float32Array(upts), un = new Float32Array(unrm);
    var bk = self.bake(up, un);
    if (g === "floor" || g === "ceil") {
      var ao = self.aoFloor(up);
      for (var k = 0; k < bk.length; k++) bk[k] *= ao[k];
    }
    var arr = new Float32Array(nv * 8);
    for (v = 0; v < nv; v++) {
      var o2 = v * 9, br = Math.min(bk[inv[v]] * A[o2 + 8], 1.7), w = v * 8;
      arr[w] = A[o2]; arr[w + 1] = A[o2 + 1]; arr[w + 2] = A[o2 + 2];
      arr[w + 3] = br * lr; arr[w + 4] = br * lg; arr[w + 5] = br * lb;
      arr[w + 6] = A[o2 + 6]; arr[w + 7] = A[o2 + 7];
    }
    out[g] = arr;
  });
  if (water.a.length) out.water = water.f32();
  var on = new VB(), dead = new VB(), flick = [];
  var lw = cfg.lamp[0], ll = cfg.lamp[1], lc = cfg.lamp_rgb;
  this.lights.forEach(function (L) {
    var y = H - 0.012, x0 = L.x - lw / 2, x1 = L.x + lw / 2, z0 = L.z - ll / 2, z1 = L.z + ll / 2;
    var P = [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
    if (L.kind === 0) on.quad(P, lc, uv);
    else if (L.kind === 2) dead.quad(P, [lc[0] * 0.12, lc[1] * 0.12, lc[2] * 0.12], uv);
    else { var f = new VB(); f.quad(P, lc, uv); flick.push([L, f.f32()]); }
  });
  out.lamp_on = on.f32();
  if (dead.a.length) out.lamp_dead = dead.f32();
  out.flicker = flick;
  return out;
};

if (typeof module !== "undefined") module.exports = { RNG: RNG, World: World, levelCfg: levelCfg, levelTier: levelTier, levelTitle: levelTitle, box: box, cylinder: cylinder, VB: VB, quadXY: quadXY, floorQuad: floorQuad, PLAYER_R: PLAYER_R, MONSTER_R: MONSTER_R };
