// BACKROOMS - MÓVIL 22 · Modelos: policías esqueleto, entidades, armas y objetos
"use strict";

var BONE = [0.88, 0.85, 0.76], NAVY = [0.12, 0.15, 0.3], DARK = [0.06, 0.06, 0.07], GOLD = [1.3, 1.05, 0.4];
var PLAYER_COLORS = [[0.25, 0.45, 0.9], [0.85, 0.25, 0.2], [0.25, 0.75, 0.3], [0.9, 0.75, 0.2],
  [0.65, 0.35, 0.8], [0.25, 0.75, 0.8], [0.85, 0.5, 0.25], [0.6, 0.6, 0.62]];
var ROLE_OUTFIT = {
  comisario: { shirt: NAVY, pants: NAVY },
  sargento: { shirt: [0.16, 0.19, 0.22], pants: [0.14, 0.16, 0.18] },
  novato: { shirt: [0.45, 0.58, 0.75], pants: NAVY },
  detective: { shirt: [0.42, 0.32, 0.2], pants: [0.2, 0.18, 0.16] }
};
var N = function (o) { return new GFX.Node(o); };

function skull(v, x, y, z) {
  box(x, y + 0.14, z, 0.21, 0.22, 0.23, BONE, 0.92, v);
  box(x, y + 0.01, z + 0.02, 0.15, 0.07, 0.17, BONE, 1, v);
  box(x - 0.05, y + 0.14, z + 0.112, 0.06, 0.05, 0.02, DARK, 1, v);
  box(x + 0.05, y + 0.14, z + 0.112, 0.06, 0.05, 0.02, DARK, 1, v);
  box(x, y + 0.085, z + 0.112, 0.025, 0.03, 0.02, DARK, 1, v);
  box(x, y + 0.045, z + 0.112, 0.11, 0.012, 0.02, DARK, 1, v);
  return v;
}
function hat(v, role, x, y, z) {
  if (role === "comisario") {
    box(x, y + 0.05, z, 0.25, 0.08, 0.27, NAVY, 1, v); box(x, y + 0.1, z - 0.01, 0.27, 0.04, 0.29, NAVY, 1, v);
    box(x, y + 0.02, z + 0.16, 0.22, 0.015, 0.1, DARK, 1, v); box(x, y + 0.05, z + 0.137, 0.08, 0.04, 0.01, GOLD, 1, v);
  } else if (role === "sargento") box(x, y + 0.06, z, 0.27, 0.13, 0.29, [0.2, 0.23, 0.2], 0.75, v);
  else if (role === "novato") {
    box(x, y + 0.05, z, 0.24, 0.08, 0.26, [0.2, 0.3, 0.55], 1, v); box(x, y + 0.02, z + 0.16, 0.2, 0.015, 0.1, [0.2, 0.3, 0.55], 1, v);
  } else {
    box(x, y + 0.01, z, 0.42, 0.015, 0.42, [0.3, 0.22, 0.14], 1, v); box(x, y + 0.08, z, 0.24, 0.13, 0.24, [0.3, 0.22, 0.14], 0.9, v);
    box(x, y + 0.035, z, 0.25, 0.03, 0.25, DARK, 1, v);
  }
  return v;
}

function buildCop(parent, role, pid, doppel) {
  var o = ROLE_OUTFIT[role], acc = PLAYER_COLORS[pid % PLAYER_COLORS.length];
  var root = N({ parent: parent, tex: "cloth" });
  var legs = [], arms = [], v;
  [-1, 1].forEach(function (sx) {
    var p = N({ parent: root, x: 0.1 * sx, y: 0.92 });
    v = new VB(); box(0, -0.22, 0, 0.15, 0.44, 0.16, o.pants, 1, v); box(0, -0.66, 0, 0.05, 0.44, 0.05, BONE, 1, v);
    box(0, -0.88, 0.05, 0.13, 0.08, 0.26, DARK, 1, v);
    N({ parent: p, mesh: v }); legs.push(p);
  });
  v = new VB();
  box(0, 1.22, 0, 0.42, 0.62, 0.24, o.shirt, 1, v);
  if (role === "detective") box(0, 0.7, 0, 0.44, 0.5, 0.26, o.shirt, 0.92, v);
  box(0, 1.25, 0.121, 0.2, 0.34, 0.01, DARK, 1, v);
  for (var k = 0; k < 4; k++) box(0, 1.12 + k * 0.075, 0.13, 0.17, 0.02, 0.01, BONE, 1, v);
  box(0, 0.93, 0, 0.44, 0.06, 0.26, DARK, 1, v);
  if (role === "sargento") box(0, 1.2, 0, 0.46, 0.5, 0.28, [0.08, 0.09, 0.08], 1, v);
  box(-0.25, 1.48, 0, 0.1, 0.06, 0.2, acc, 1, v); box(0.25, 1.48, 0, 0.1, 0.06, 0.2, acc, 1, v);
  N({ parent: root, mesh: v });
  N({ parent: root, mesh: box(-0.12, 1.36, 0.128, 0.06, 0.07, 0.01, GOLD), tex: "white", emissive: doppel ? null : 1 });
  [-1, 1].forEach(function (sx) {
    var p = N({ parent: root, x: 0.27 * sx, y: 1.48 });
    var a = new VB(); box(0, -0.16, 0, 0.11, 0.32, 0.11, o.shirt, 1, a); box(0, -0.45, 0.04, 0.035, 0.3, 0.035, BONE, 1, a);
    box(0, -0.62, 0.06, 0.06, 0.07, 0.04, BONE, 1, a);
    N({ parent: p, mesh: a }); arms.push(p);
  });
  var head = N({ parent: root, y: 1.56 });
  v = new VB(); box(0, 0, 0, 0.05, 0.08, 0.05, BONE, 1, v); skull(v, 0, 0.02, 0); hat(v, role, 0, 0.27, 0);
  N({ parent: head, mesh: v });
  var ev = new VB(); box(-0.05, 0.16, 0.123, 0.03, 0.02, 0.01, [1.8, 0.1, 0.05], 1, ev); box(0.05, 0.16, 0.123, 0.03, 0.02, 0.01, [1.8, 0.1, 0.05], 1, ev);
  var eyes = N({ parent: head, mesh: ev, tex: "white", emissive: 1 }); eyes.visible = false;
  var wk = DATA.ROLES.filter(function (r) { return r.key === role; })[0].weapon;
  var gl = { glock: 0.22, rifle: 0.85, revolver: 0.25, knife: 0.2, shotgun: 0.75 }[wk];
  var gun = N({ parent: root, x: 0.16, y: 1.15, z: 0.28 });
  N({ parent: gun, mesh: box(0, 0, gl / 2, 0.05, 0.07, gl, [0.12, 0.12, 0.13]) });
  var flash = N({ parent: gun, mesh: quadXY(0.35, 0.35, [1.6, 1.3, 0.8]), tex: "spark", emissive: 1, blend: 2, billboard: true, z: gl + 0.05 });
  flash.visible = false;
  var pile = new VB(), rr = new RNG(pid * 13 + 7);
  for (k = 0; k < 14; k++) {
    var a2 = rr.uniform(0, 6.28), d = rr.uniform(0, 0.45);
    box(Math.cos(a2) * d, 0.03, Math.sin(a2) * d, rr.uniform(0.04, 0.07), 0.04, rr.uniform(0.15, 0.35), BONE, 1, pile);
  }
  skull(pile, 0.25, 0, 0.1); hat(pile, role, 0.25, 0.25, 0.1);
  var pileN = N({ parent: parent, mesh: pile, tex: "cloth" }); pileN.visible = false;
  return { root: root, head: head, legs: legs, arms: arms, gun: gun, flash: flash, pile: pileN, eyes: eyes };
}

function buildMonster(parent, mc) {
  var root = N({ parent: parent, tex: "skin", s: mc.scale });
  var k = mc.skin, sk = [k, k * 0.97, k * 0.93], eye = mc.eye;
  var mouth = (eye[0] + eye[1] + eye[2]) > 0.3 ? [0.95, 0.92, 0.85] : eye;
  var legs = [], arms = [];
  [-1, 1].forEach(function (sx) {
    var p = N({ parent: root, x: 0.11 * sx, y: 1.15 });
    N({ parent: p, mesh: box(0, -0.58, 0, 0.11, 1.16, 0.12, sk, 1.4) }); legs.push(p);
  });
  var torso = N({ parent: root, y: 1.15 });
  var tv = new VB(); box(0, 0.42, 0, 0.36, 0.84, 0.2, sk, 1.35, tv); box(0, 0.05, 0, 0.30, 0.14, 0.18, sk, 1, tv);
  N({ parent: torso, mesh: tv });
  var head = N({ parent: torso, y: 0.88, z: 0.02 });
  var hv = new VB(); box(0, 0.07, 0, 0.07, 0.16, 0.07, sk, 1, hv); box(0, 0.30, 0.02, 0.22, 0.34, 0.24, sk, 0.8, hv);
  N({ parent: head, mesh: hv });
  var g = new VB(); box(-0.055, 0.34, 0.142, 0.045, 0.028, 0.02, eye, 1, g); box(0.055, 0.34, 0.142, 0.045, 0.028, 0.02, eye, 1, g);
  for (var q = 0; q < 9; q++) { var t = (q - 4) / 4; box(t * 0.075, 0.2 + 0.035 * t * t, 0.142, 0.016, 0.03, 0.02, mouth, 1, g); }
  N({ parent: head, mesh: g, tex: "white", emissive: 1 });
  [-1, 1].forEach(function (sx) {
    var p = N({ parent: torso, x: 0.25 * sx, y: 0.78 });
    var a = new VB(); box(0, -0.63, 0, 0.075, 1.26, 0.075, sk, 1.3, a); box(0, -1.3, 0.02, 0.1, 0.12, 0.05, sk, 1, a);
    [-1, 0, 1].forEach(function (f) { box(f * 0.03, -1.43, 0.03, 0.014, 0.17, 0.014, sk, 1, a); });
    N({ parent: p, mesh: a }); arms.push(p);
  });
  return { root: root, torso: torso, head: head, legs: legs, arms: arms };
}

// ---------------------------------------------------------------- armas en primera persona
function boneHand(v, x, y, z, sleeve, left) {
  box(x, y, z - 0.3, 0.07, 0.07, 0.42, sleeve, 1, v);
  box(x - 0.008, y, z - 0.06, 0.012, 0.012, 0.1, BONE, 1, v);
  box(x + 0.008, y, z - 0.06, 0.012, 0.012, 0.1, BONE, 1, v);
  box(x, y, z + 0.015, 0.048, 0.016, 0.045, BONE, 1, v);
  for (var f = 0; f < 4; f++) box(x - 0.018 + f * 0.012, y - 0.016, z + 0.045, 0.008, 0.03, 0.008, BONE, 1, v);
  box(x + (left ? -0.03 : 0.03), y + 0.005, z + 0.03, 0.008, 0.008, 0.035, BONE, 1, v);
  return v;
}
function muzzleNode(parent, pos, size) {
  var m = N({ parent: parent, x: pos[0], y: pos[1], z: pos[2] });
  N({ parent: m, mesh: quadXY(size, size, [1.8, 1.4, 0.8]), tex: "spark", emissive: 1, blend: 2 });
  N({ parent: m, mesh: quadXY(size * 0.7, size * 0.7, [2.0, 1.7, 1.2]), tex: "spark", emissive: 1, blend: 2, ry: 90 });
  m.visible = false;
  return m;
}
function VM(key, parent, sleeve) {
  this.key = key;
  this.root = N({ parent: parent });
  this.inner = N({ parent: this.root });
  this.parts = {};
  this.muzzle = null; this.eject = null; this.laserTip = null;
  var I = this.inner, P = this.parts, v;
  if (key === "glock") {
    N({ parent: I, mesh: box(0, -0.06, -0.02, 0.03, 0.11, 0.05, [0.09, 0.09, 0.1], 1.1), tex: "metal" });
    N({ parent: I, mesh: box(0, -0.008, 0.05, 0.03, 0.025, 0.16, [0.09, 0.09, 0.1]), tex: "metal" });
    P.slide = N({ parent: I, y: 0.018, z: 0.06 });
    v = new VB(); box(0, 0, 0, 0.032, 0.03, 0.19, [0.13, 0.13, 0.14], 1, v); box(0, 0.019, -0.08, 0.008, 0.008, 0.01, [0.9, 0.9, 0.9], 1, v);
    box(0, 0.019, 0.085, 0.006, 0.01, 0.006, [0.9, 0.9, 0.9], 1, v);
    N({ parent: P.slide, mesh: v, tex: "metal" });
    N({ parent: I, mesh: cylinder(0, 0.018, 0.24, 0.019, 0.17, [0.1, 0.1, 0.11]), tex: "metal" });
    N({ parent: I, mesh: box(0, -0.032, 0.115, 0.024, 0.022, 0.055, [0.05, 0.05, 0.05]) });
    N({ parent: I, mesh: box(0, -0.032, 0.144, 0.01, 0.01, 0.004, [2.0, 0.1, 0.05]), tex: "white", emissive: 1 });
    this.laserTip = N({ parent: I, y: -0.032, z: 0.15 });
    v = new VB(); boneHand(v, 0, -0.05, -0.02, sleeve); boneHand(v, -0.03, -0.075, 0, sleeve, true);
    N({ parent: I, mesh: v, tex: "bone" });
    this.muzzle = muzzleNode(I, [0, 0.018, 0.34], 0.25);
    this.eject = N({ parent: I, x: 0.02, y: 0.03, z: 0.05 });
    this.hold = [0.13, -0.15, 0.45];
  } else if (key === "rifle") {
    N({ parent: I, mesh: box(0, -0.045, -0.25, 0.045, 0.1, 0.34, [1, 1, 1], 0.85), tex: "wood" });
    N({ parent: I, mesh: box(0, -0.02, 0.27, 0.05, 0.045, 0.3, [1, 1, 1]), tex: "wood" });
    N({ parent: I, mesh: box(0, 0, 0.02, 0.042, 0.055, 0.24, [0.25, 0.25, 0.27]), tex: "metal" });
    N({ parent: I, mesh: cylinder(0, 0.008, 0.5, 0.013, 0.52, [0.22, 0.22, 0.24]), tex: "metal" });
    v = new VB(); cylinder(0, 0.07, 0.03, 0.021, 0.27, [0.1, 0.1, 0.11], "z", 12, v); cylinder(0, 0.07, 0.17, 0.028, 0.05, [0.1, 0.1, 0.11], "z", 12, v);
    cylinder(0, 0.07, -0.11, 0.025, 0.04, [0.1, 0.1, 0.11], "z", 12, v); box(0, 0.045, -0.03, 0.02, 0.03, 0.02, DARK, 1, v); box(0, 0.045, 0.09, 0.02, 0.03, 0.02, DARK, 1, v);
    N({ parent: I, mesh: v, tex: "metal" });
    N({ parent: I, mesh: box(0, 0.07, 0.196, 0.04, 0.04, 0.004, [0.25, 0.35, 0.6]), tex: "white", emissive: 1 });
    P.bolt = N({ parent: I, x: 0.025, y: 0.02, z: -0.04 });
    v = new VB(); box(0.03, 0, 0, 0.06, 0.012, 0.012, [0.3, 0.3, 0.32], 1, v); box(0.065, -0.005, 0, 0.022, 0.022, 0.022, DARK, 1, v);
    N({ parent: P.bolt, mesh: v, tex: "metal" });
    v = new VB(); boneHand(v, 0, -0.07, -0.08, sleeve); boneHand(v, -0.01, -0.055, 0.3, sleeve, true);
    N({ parent: I, mesh: v, tex: "bone" });
    this.muzzle = muzzleNode(I, [0, 0.008, 0.78], 0.5);
    this.eject = N({ parent: I, x: 0.03, y: 0.02, z: 0.02 });
    this.hold = [0.13, -0.16, 0.36];
  } else if (key === "revolver") {
    N({ parent: I, mesh: box(0, -0.06, -0.03, 0.032, 0.1, 0.045, [1, 1, 1], 1.15), tex: "wood" });
    v = new VB(); box(0, 0, 0.03, 0.034, 0.05, 0.1, [0.3, 0.3, 0.33], 1, v); box(0, 0.03, -0.02, 0.012, 0.02, 0.025, [0.25, 0.25, 0.27], 1, v);
    N({ parent: I, mesh: v, tex: "metal" });
    P.cyl = N({ parent: I, y: 0.002, z: 0.05 });
    N({ parent: P.cyl, mesh: cylinder(0, 0, 0, 0.027, 0.055, [0.34, 0.34, 0.37], "z", 6), tex: "metal" });
    v = new VB(); cylinder(0, 0.012, 0.16, 0.011, 0.16, [0.3, 0.3, 0.33], "z", 12, v); box(0, 0.026, 0.16, 0.01, 0.008, 0.16, [0.3, 0.3, 0.33], 1, v);
    N({ parent: I, mesh: v, tex: "metal" });
    v = new VB(); boneHand(v, 0, -0.05, -0.03, sleeve); boneHand(v, -0.03, -0.075, -0.01, sleeve, true);
    N({ parent: I, mesh: v, tex: "bone" });
    this.muzzle = muzzleNode(I, [0, 0.012, 0.26], 0.3);
    this.hold = [0.13, -0.15, 0.43];
  } else if (key === "knife") {
    P.pivot = N({ parent: I });
    v = new VB(); box(0, 0, 0.085, 0.005, 0.026, 0.15, [0.85, 0.87, 0.9], 1, v); box(0, 0.006, 0.17, 0.005, 0.012, 0.03, [0.85, 0.87, 0.9], 1, v);
    N({ parent: P.pivot, mesh: v, tex: "metal" });
    P.ha = N({ parent: P.pivot, x: -0.007 }); N({ parent: P.ha, mesh: box(0, 0, -0.065, 0.011, 0.024, 0.13, [0.15, 0.1, 0.08]), tex: "wood" });
    P.hb = N({ parent: P.pivot, x: 0.007 }); N({ parent: P.hb, mesh: box(0, 0, -0.065, 0.011, 0.024, 0.13, [0.15, 0.1, 0.08]), tex: "wood" });
    N({ parent: I, mesh: boneHand(new VB(), 0, -0.012, -0.08, sleeve), tex: "bone" });
    this.hold = [0.17, -0.18, 0.42];
  } else {
    var m = [0.32, 0.32, 0.34];
    v = new VB(); box(0, 0, 0.06, 0.058, 0.075, 0.30, m, 1, v); cylinder(0, 0.022, 0.48, 0.017, 0.56, [0.25, 0.25, 0.27], "z", 12, v);
    cylinder(0, -0.016, 0.42, 0.014, 0.44, [0.28, 0.28, 0.3], "z", 12, v); box(0, 0.046, 0.76, 0.008, 0.012, 0.01, [0.8, 0.75, 0.6], 1, v);
    box(0, -0.055, 0.02, 0.012, 0.05, 0.06, m, 1, v);
    N({ parent: I, mesh: v, tex: "metal" });
    v = new VB(); box(0, -0.035, -0.20, 0.05, 0.10, 0.30, [1, 1, 1], 0.9, v); box(0, -0.07, -0.03, 0.045, 0.10, 0.06, [1, 1, 1], 1, v);
    N({ parent: I, mesh: v, tex: "wood" });
    P.pump = N({ parent: I, z: 0.36 });
    N({ parent: P.pump, mesh: box(0, -0.018, 0, 0.056, 0.05, 0.17, [1, 1, 1]), tex: "wood" });
    N({ parent: P.pump, mesh: boneHand(new VB(), -0.01, -0.05, 0, sleeve, true), tex: "bone" });
    N({ parent: I, mesh: boneHand(new VB(), 0, -0.08, -0.05, sleeve), tex: "bone" });
    this.muzzle = muzzleNode(I, [0, 0.022, 0.8], 0.45);
    this.eject = N({ parent: I, x: 0.035, y: 0.02, z: 0.08 });
    this.hold = [0.15, -0.18, 0.38];
  }
  this.root.visible = false;
}

// ---------------------------------------------------------------- objetos
function itemModel(what) {
  var v = new VB();
  if (what === "radio") { box(0, 0.12, 0, 0.12, 0.22, 0.07, [0.12, 0.12, 0.13], 1, v); box(0.04, 0.3, 0, 0.012, 0.16, 0.012, DARK, 1, v); box(0, 0.16, 0.036, 0.08, 0.05, 0.005, [0.3, 0.5, 0.3], 1, v); }
  else if (what === "fuse") { cylinder(0, 0.06, 0, 0.03, 0.14, [0.9, 0.5, 0.1], "x", 12, v); cylinder(0, 0.06, 0, 0.033, 0.03, [0.8, 0.8, 0.8], "x", 12, v); }
  else if (what === "badge") box(0, 0.05, 0, 0.1, 0.12, 0.02, GOLD, 1, v);
  else { box(0, 0.03, 0, 0.3, 0.04, 0.22, [0.8, 0.72, 0.45], 1, v); box(0, 0.055, 0, 0.26, 0.01, 0.18, [0.95, 0.93, 0.85], 1, v); }
  return v;
}
function thingModel(what) {
  var v = new VB();
  if (what === "panel") { box(0, 0.9, 0, 0.7, 1.8, 0.35, [0.35, 0.38, 0.36], 1, v); box(0, 1.2, 0.18, 0.5, 0.6, 0.02, [0.2, 0.2, 0.2], 1, v); }
  else if (what === "valve") { cylinder(0, 0.6, 0, 0.09, 1.2, [0.4, 0.3, 0.25], "y", 12, v); cylinder(0, 1.1, 0.12, 0.05, 0.25, [0.4, 0.3, 0.25], "z", 12, v); }
  else { box(0, 0.55, 0, 1.4, 1.1, 0.8, [0.75, 0.6, 0.12], 1, v); box(0, 1.15, 0, 1.0, 0.1, 0.6, [0.2, 0.2, 0.2], 1, v); cylinder(0.5, 1.4, 0.2, 0.06, 0.5, [0.2, 0.2, 0.2], "y", 12, v); }
  return v;
}
function carModel() {
  var W = [0.92, 0.92, 0.94], B = [0.1, 0.25, 0.65], v = new VB();
  box(0, 0.55, 0, 1.8, 0.55, 4.4, W, 1, v); box(0, 0.6, 0, 1.82, 0.12, 4.42, B, 1, v);
  box(0, 1.05, -0.2, 1.6, 0.48, 2.2, W, 0.88, v); box(0, 1.08, -0.2, 1.62, 0.32, 2.0, [0.08, 0.1, 0.12], 0.88, v);
  [-1, 1].forEach(function (sx) { [-1.35, 1.35].forEach(function (sz) { cylinder(sx * 0.85, 0.33, sz, 0.33, 0.24, DARK, "x", 12, v); }); });
  box(0, 0.4, 2.21, 1.4, 0.2, 0.04, [0.3, 0.3, 0.3], 1, v);
  return v;
}
function deskModel(monitor, phone) {
  var top = box(0, 0.75, 0, 1.6, 0.06, 0.8, [1, 1, 1]), rest = new VB();
  [-0.74, 0.74].forEach(function (sx) { box(sx, 0.36, 0, 0.06, 0.72, 0.72, [0.3, 0.3, 0.32], 1, rest); });
  if (monitor) box(0.2, 1.0, -0.1, 0.45, 0.38, 0.38, [0.75, 0.72, 0.65], 1, rest);
  if (phone) box(-0.45, 0.82, 0.1, 0.2, 0.08, 0.15, [0.08, 0.08, 0.08], 1, rest);
  return [top, rest];
}
function lockersModel() {
  var v = new VB();
  [-0.62, 0, 0.62].forEach(function (k) {
    box(k, 0.97, 0, 0.6, 1.94, 0.5, [0.35, 0.42, 0.38], 1, v);
    for (var s = 0; s < 3; s++) box(k, 1.6 + s * 0.06, 0.252, 0.3, 0.015, 0.01, DARK, 1, v);
  });
  return v;
}

function ExitDoor(game, x, z, rot) {
  this.x = x; this.z = z;
  this.root = N({ parent: GFX.root, x: x, z: z, ry: rot, tex: "metal", tint: game.world.lightAt(x, z) * 0.6 + 0.15 });
  var fr = [0.55, 0.52, 0.48], v = new VB();
  box(-0.56, 1.07, 0, 0.1, 2.14, 0.2, fr, 1, v); box(0.56, 1.07, 0, 0.1, 2.14, 0.2, fr, 1, v); box(0, 2.19, 0, 1.22, 0.1, 0.2, fr, 1, v);
  N({ parent: this.root, mesh: v });
  this.glow = N({ parent: this.root, mesh: quadXY(1.02, 2.12, [1.6, 1.55, 1.4]), tex: "white", emissive: 1, y: 1.07, z: -0.02 });
  this.glow.visible = false;
  this.hinge = N({ parent: this.root, x: -0.5 });
  N({ parent: this.hinge, mesh: box(0.5, 1.06, 0, 0.99, 2.1, 0.05, [1, 1, 1]), tex: "door" });
  N({ parent: this.hinge, mesh: box(0.86, 1.0, 0.05, 0.08, 0.04, 0.05, [0.8, 0.75, 0.5]) });
  N({ parent: this.root, mesh: box(0, 2.42, 0.02, 0.5, 0.16, 0.05, [0.15, 1.6, 0.35]), tex: "white", emissive: 1 });
  this.lamp = N({ parent: this.root, mesh: box(0.3, 2.42, 0.06, 0.08, 0.08, 0.05, [1.8, 0.1, 0.05]), tex: "white", emissive: 1 });
  this.open = false; this.ang = 0; this.t = 0;
}
ExitDoor.prototype.setOpen = function (v) {
  if (v && !this.open) { this.glow.visible = true; this.lamp.cs = [0.05, 1, 0.08, 1]; }
  this.open = v;
};
ExitDoor.prototype.update = function (dt) {
  this.t += dt;
  this.ang += ((this.open ? -105 : 0) - this.ang) * Math.min(1, dt * 1.6);
  this.hinge.ry = this.ang;
  if (!this.open) { var b = (this.t % 1.2) < 0.6 ? 1 : 0.25; this.lamp.cs = [b, b, b, 1]; }
  else { var p = 0.85 + 0.15 * Math.sin(this.t * 3); this.glow.cs = [p, p, p, 1]; }
};
ExitDoor.prototype.destroy = function () { this.root.dispose(); };
