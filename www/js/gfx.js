// BACKROOMS - MÓVIL 22 · Motor 3D WebGL2 propio (sin librerías)
// Convención: mano izquierda, Y arriba, la cámara mira hacia +Z (igual que la versión PC).
"use strict";

var GFX = (function () {
  var gl, prog, U = {}, canvas, aniso = null;
  var textures = {};
  var whiteTex;
  var frame = { vp: new Float32Array(16), camWorld: new Float32Array(16), camPos: [0, 0, 0], camRot: new Float32Array(16) };
  var globals = {
    campos: [0, 0, 0], camdir: [0, 0, 1], flash: 0, muzzle: 0, power: 1, fogcol: [0.21, 0.19, 0.105], fogdens: 0.045,
    time: 0, flarepos: [-999, -999, -999], flare: 0
  };
  var stats = { draws: 0 };

  var VS = "#version 300 es\n" +
    "precision highp float;\n" +
    "uniform mat4 u_vp; uniform mat4 u_model; uniform vec2 u_uvoff;\n" +
    "layout(location=0) in vec3 a_pos; layout(location=1) in vec3 a_col; layout(location=2) in vec2 a_uv;\n" +
    "out vec2 uv; out vec3 vcol; out vec3 wpos;\n" +
    "void main(){ vec4 w = u_model * vec4(a_pos,1.0); wpos = w.xyz; uv = a_uv + u_uvoff; vcol = a_col; gl_Position = u_vp * w; }\n";
  var FS = "#version 300 es\n" +
    "precision mediump float;\n" +
    "uniform sampler2D u_tex; uniform vec4 u_cscale; uniform float u_tint; uniform float u_emissive;\n" +
    "uniform vec3 u_campos; uniform vec3 u_camdir; uniform float u_flash; uniform float u_muzzle; uniform float u_power;\n" +
    "uniform vec3 u_fogcol; uniform float u_fogdens; uniform float u_time; uniform vec3 u_flarepos; uniform float u_flare;\n" +
    "in vec2 uv; in vec3 vcol; in vec3 wpos; out vec4 o;\n" +
    "void main(){\n" +
    " vec4 tex = texture(u_tex, uv); vec4 base = tex * u_cscale;\n" +
    " vec3 v = wpos - u_campos; float d = length(v);\n" +
    " vec3 light = vcol * u_tint * u_power;\n" +
    " float cs = dot(v / max(d, 0.001), u_camdir);\n" +
    " float spot = smoothstep(0.83, 0.96, cs) * 0.6 + smoothstep(0.93, 0.99, cs) * 0.6;\n" +
    " light += vec3(1.0, 0.94, 0.82) * spot * u_flash * 3.2 / (1.0 + 0.05 * d * d);\n" +
    " light += vec3(1.0, 0.78, 0.45) * u_muzzle * 4.0 / (1.0 + 0.10 * d * d);\n" +
    " float df = length(wpos - u_flarepos);\n" +
    " light += vec3(1.0, 0.32, 0.18) * u_flare * 3.0 / (1.0 + 0.22 * df * df);\n" +
    " vec3 col = mix(base.rgb * light, base.rgb * vcol, u_emissive);\n" +
    " float fog = exp(-pow(d * u_fogdens, 1.6));\n" +
    " col = mix(u_fogcol * u_power, col, fog);\n" +
    " float n = fract(sin(dot(gl_FragCoord.xy + vec2(u_time * 61.0, u_time * 17.0), vec2(12.9898, 78.233))) * 43758.5453);\n" +
    " col += (n - 0.5) / 160.0;\n" +
    " o = vec4(col, base.a);\n" +
    "}\n";

  // ------------------------------------------------------------ matrices (column-major)
  function ident(m) { m = m || new Float32Array(16); m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; return m; }
  function mul(out, a, b) {
    var r = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var rr = 0; rr < 4; rr++) {
      r[c * 4 + rr] = a[rr] * b[c * 4] + a[4 + rr] * b[c * 4 + 1] + a[8 + rr] * b[c * 4 + 2] + a[12 + rr] * b[c * 4 + 3];
    }
    out.set(r);
    return out;
  }
  // T * Ry * Rx * Rz * S
  function compose(out, x, y, z, rx, ry, rz, sx, sy, sz) {
    var D = Math.PI / 180;
    var cy = Math.cos(ry * D), syy = Math.sin(ry * D), cx = Math.cos(rx * D), sxx = Math.sin(rx * D), cz = Math.cos(rz * D), szz = Math.sin(rz * D);
    // Rx*Rz
    // Rx = [1 0 0;0 cx -sx;0 sx cx]  Rz = [cz sz 0;-sz cz 0;0 0 1]  Ry = [cy 0 sy;0 1 0;-sy 0 cy]
    var a00 = cz, a01 = szz, a02 = 0;
    var a10 = -cx * szz, a11 = cx * cz, a12 = -sxx;
    var a20 = -sxx * szz, a21 = sxx * cz, a22 = cx;
    // nota: filas de (Rx*Rz): fila1 = [cz, sz, 0]; fila2 = [-cx*sz, cx*cz, -sx]; fila3 = [-sx*sz, sx*cz, cx]
    var b00 = cy * a00 + syy * a20, b01 = cy * a01 + syy * a21, b02 = cy * a02 + syy * a22;
    var b10 = a10, b11 = a11, b12 = a12;
    var b20 = -syy * a00 + cy * a20, b21 = -syy * a01 + cy * a21, b22 = -syy * a02 + cy * a22;
    out[0] = b00 * sx; out[1] = b10 * sx; out[2] = b20 * sx; out[3] = 0;
    out[4] = b01 * sy; out[5] = b11 * sy; out[6] = b21 * sy; out[7] = 0;
    out[8] = b02 * sz; out[9] = b12 * sz; out[10] = b22 * sz; out[11] = 0;
    out[12] = x; out[13] = y; out[14] = z; out[15] = 1;
    return out;
  }
  function invRigid(out, m) {
    // inversa de rotación+traslación (sin escala)
    var r00 = m[0], r10 = m[1], r20 = m[2], r01 = m[4], r11 = m[5], r21 = m[6], r02 = m[8], r12 = m[9], r22 = m[10];
    var tx = m[12], ty = m[13], tz = m[14];
    out[0] = r00; out[1] = r01; out[2] = r02; out[3] = 0;
    out[4] = r10; out[5] = r11; out[6] = r12; out[7] = 0;
    out[8] = r20; out[9] = r21; out[10] = r22; out[11] = 0;
    out[12] = -(r00 * tx + r10 * ty + r20 * tz);
    out[13] = -(r01 * tx + r11 * ty + r21 * tz);
    out[14] = -(r02 * tx + r12 * ty + r22 * tz);
    out[15] = 1;
    return out;
  }
  function persp(out, fovyDeg, aspect, near, far) {
    var f = 1 / Math.tan(fovyDeg * Math.PI / 360);
    out.fill(0);
    out[0] = f / aspect; out[5] = f;
    out[10] = (far + near) / (far - near); out[11] = 1;
    out[14] = -2 * far * near / (far - near);
    return out;
  }
  function xform(m, p) {
    return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
      m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
  }

  // ------------------------------------------------------------ mallas
  function Mesh(data) {
    if (data && data.a) data = new Float32Array(data.a);
    this.count = data.length / 8;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
    gl.bindVertexArray(null);
  }
  Mesh.prototype.dispose = function () { gl.deleteBuffer(this.vbo); gl.deleteVertexArray(this.vao); };

  // ------------------------------------------------------------ nodos
  function Node(o) {
    o = o || {};
    this.x = o.x || 0; this.y = o.y || 0; this.z = o.z || 0;
    this.rx = o.rx || 0; this.ry = o.ry || 0; this.rz = o.rz || 0;
    this.sx = this.sy = this.sz = o.s || 1;
    this.children = [];
    this.parent = null;
    this.mesh = o.mesh ? (o.mesh instanceof Mesh ? o.mesh : new Mesh(o.mesh)) : null;
    this.tex = o.tex || null;
    this.cs = o.cs || null;          // escala de color [r,g,b,a]
    this.tint = o.tint === undefined ? null : o.tint;
    this.emissive = o.emissive === undefined ? null : o.emissive;
    this.flashOff = false;
    this.uvoff = o.uvoff || null;
    this.blend = o.blend || 0;       // 0 opaco, 1 alfa, 2 aditivo
    this.billboard = !!o.billboard;
    this.visible = true;
    this.layer = o.layer || 0;       // 0 mundo, 1 arma en primera persona
    this.bias = o.bias || 0;
    this.world = ident();
    this.ownMesh = !!o.mesh && !(o.mesh instanceof Mesh);
    if (o.parent) o.parent.add(this);
  }
  Node.prototype.add = function (c) { c.parent = this; this.children.push(c); return c; };
  Node.prototype.remove = function () {
    if (this.parent) { var i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); }
    this.parent = null;
  };
  Node.prototype.dispose = function () {
    this.remove();
    (function rec(n) { if (n.mesh && n.ownMesh) n.mesh.dispose(); n.children.forEach(rec); })(this);
  };
  Node.prototype.setPos = function (x, y, z) { this.x = x; this.y = y; this.z = z; return this; };
  Node.prototype.worldPos = function () { return [this.world[12], this.world[13], this.world[14]]; };

  var root, vmRoot, camera = { x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0, roll: 0, fov: 90, near: 0.05, far: 120 };

  // ------------------------------------------------------------ texturas
  function makeTex(img, repeat, mip) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    var w = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, w);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, w);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (mip) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
    } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return t;
  }
  var CLAMP = { lamp: 1, hole: 1, blood: 1, spark: 1, smoke: 1, chalk: 1 };
  function loadTextures(names, onProgress) {
    var done = 0;
    return Promise.all(names.map(function (n) {
      return new Promise(function (res) {
        var img = new Image();
        img.onload = function () {
          textures[n] = makeTex(img, !CLAMP[n], n !== "white" && n !== "grain");
          done++; if (onProgress) onProgress(done / names.length);
          res();
        };
        img.onerror = function () { console.warn("textura", n); textures[n] = whiteTex; done++; res(); };
        img.src = "assets/tex/" + n + ".png";
      });
    }));
  }

  // ------------------------------------------------------------ init
  function init(cv) {
    canvas = cv;
    gl = canvas.getContext("webgl2", { antialias: true, alpha: false, powerPreference: "high-performance" });
    if (!gl) return false;
    aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    ["u_vp", "u_model", "u_uvoff", "u_tex", "u_cscale", "u_tint", "u_emissive", "u_campos", "u_camdir", "u_flash", "u_muzzle",
      "u_power", "u_fogcol", "u_fogdens", "u_time", "u_flarepos", "u_flare"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1i(U.u_tex, 0);
    var px = new Uint8Array([255, 255, 255, 255]);
    whiteTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, whiteTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
    textures.white = whiteTex;
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    root = new Node();
    vmRoot = new Node();
    return true;
  }

  function resize(scale) {
    var dpr = Math.min(window.devicePixelRatio || 1, scale || 1.5);
    var w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  // ------------------------------------------------------------ dibujo
  var drawList = [], transList = [], vmList = [], vmTrans = [];
  function collect(n, parentWorld, tint, emis, tex, flashOff, layer) {
    if (!n.visible) return;
    if (n.billboard) {
      var w = n.world;
      var px = parentWorld[0] * n.x + parentWorld[4] * n.y + parentWorld[8] * n.z + parentWorld[12];
      var py = parentWorld[1] * n.x + parentWorld[5] * n.y + parentWorld[9] * n.z + parentWorld[13];
      var pz = parentWorld[2] * n.x + parentWorld[6] * n.y + parentWorld[10] * n.z + parentWorld[14];
      var cr = frame.camRot, D = Math.PI / 180, c = Math.cos(n.rz * D), s = Math.sin(n.rz * D);
      // rotación de cámara * Rz * escala
      for (var k = 0; k < 3; k++) {
        w[k] = (cr[k] * c - cr[4 + k] * s) * n.sx;
        w[4 + k] = (cr[k] * s + cr[4 + k] * c) * n.sy;
        w[8 + k] = cr[8 + k] * n.sz;
      }
      w[3] = w[7] = w[11] = 0; w[12] = px; w[13] = py; w[14] = pz; w[15] = 1;
    } else {
      compose(n.world, n.x, n.y, n.z, n.rx, n.ry, n.rz, n.sx, n.sy, n.sz);
      mul(n.world, parentWorld, n.world);
    }
    if (n.tint !== null) tint = n.tint;
    if (n.emissive !== null) emis = n.emissive;
    if (n.tex) tex = n.tex;
    if (n.flashOff) flashOff = true;
    if (n.layer) layer = n.layer;
    if (n.mesh) {
      var item = { n: n, tint: tint, emis: emis, tex: tex, flashOff: flashOff };
      if (layer === 1) (n.blend ? vmTrans : vmList).push(item);
      else if (n.blend) {
        var dx = n.world[12] - frame.camPos[0], dy = n.world[13] - frame.camPos[1], dz = n.world[14] - frame.camPos[2];
        item.d = dx * dx + dy * dy + dz * dz;
        transList.push(item);
      } else drawList.push(item);
    }
    for (var i = 0; i < n.children.length; i++) collect(n.children[i], n.world, tint, emis, tex, flashOff, layer);
  }
  var lastTex = null;
  function drawItem(it) {
    var n = it.n;
    gl.uniformMatrix4fv(U.u_model, false, n.world);
    var cs = n.cs || [1, 1, 1, 1];
    gl.uniform4f(U.u_cscale, cs[0], cs[1], cs[2], cs[3]);
    gl.uniform1f(U.u_tint, it.tint);
    gl.uniform1f(U.u_emissive, it.emis);
    gl.uniform1f(U.u_flash, it.flashOff ? 0 : globals.flash);
    var uo = n.uvoff || [0, 0];
    gl.uniform2f(U.u_uvoff, uo[0], uo[1]);
    var t = textures[it.tex] || whiteTex;
    if (t !== lastTex) { gl.bindTexture(gl.TEXTURE_2D, t); lastTex = t; }
    if (n.bias) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-n.bias, -n.bias); }
    gl.bindVertexArray(n.mesh.vao);
    gl.drawArrays(gl.TRIANGLES, 0, n.mesh.count);
    if (n.bias) gl.disable(gl.POLYGON_OFFSET_FILL);
    stats.draws++;
  }
  function setBlend(b) {
    if (b === 0) { gl.disable(gl.BLEND); gl.depthMask(true); }
    else {
      gl.enable(gl.BLEND); gl.depthMask(false);
      if (b === 2) gl.blendFunc(gl.SRC_ALPHA, gl.ONE); else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
  }
  function render() {
    resize(GFX.renderScale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    var fc = globals.fogcol;
    gl.clearColor(fc[0] * globals.power, fc[1] * globals.power, fc[2] * globals.power, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // cámara
    var cw = compose(frame.camWorld, camera.x, camera.y, camera.z, -camera.pitch, camera.yaw, camera.roll, 1, 1, 1);
    frame.camRot.set(cw); frame.camRot[12] = frame.camRot[13] = frame.camRot[14] = 0;
    frame.camPos = [camera.x, camera.y, camera.z];
    var view = invRigid(new Float32Array(16), cw);
    // camera.fov es el ángulo HORIZONTAL; se pasa a vertical según la forma de la pantalla
    var aspect = canvas.width / canvas.height;
    var vfov = function (h) { return 2 * Math.atan(Math.tan(h * Math.PI / 360) / aspect) * 180 / Math.PI; };
    var proj = persp(new Float32Array(16), vfov(camera.fov), aspect, camera.near, camera.far);
    mul(frame.vp, proj, view);
    gl.useProgram(prog);
    gl.uniformMatrix4fv(U.u_vp, false, frame.vp);
    gl.uniform3fv(U.u_campos, frame.camPos);
    gl.uniform3f(U.u_camdir, cw[8], cw[9], cw[10]);
    gl.uniform1f(U.u_muzzle, globals.muzzle);
    gl.uniform1f(U.u_power, globals.power);
    gl.uniform3fv(U.u_fogcol, globals.fogcol);
    gl.uniform1f(U.u_fogdens, globals.fogdens);
    gl.uniform1f(U.u_time, globals.time);
    gl.uniform3fv(U.u_flarepos, globals.flarepos);
    gl.uniform1f(U.u_flare, globals.flare);
    drawList.length = transList.length = vmList.length = vmTrans.length = 0;
    stats.draws = 0;
    lastTex = null;
    collect(root, ident(new Float32Array(16)), 1, 0, "white", false, 0);
    vmRoot.layer = 1;
    collect(vmRoot, cw, 1, 0, "white", false, 1);
    setBlend(0);
    drawList.forEach(drawItem);
    transList.sort(function (a, b) { return b.d - a.d; });
    transList.forEach(function (it) { setBlend(it.n.blend); drawItem(it); });
    // arma en primera persona: encima de todo (hay que reactivar la escritura de profundidad
    // antes de limpiarla, si no el clear no hace nada y el arma se corta contra las paredes)
    setBlend(0);
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    var proj2 = persp(new Float32Array(16), 66, aspect, 0.01, 10);
    var vp2 = mul(new Float32Array(16), proj2, view);
    gl.uniformMatrix4fv(U.u_vp, false, vp2);
    setBlend(0);
    vmList.forEach(drawItem);
    vmTrans.forEach(function (it) { setBlend(it.n.blend); drawItem(it); });
    setBlend(0);
    gl.bindVertexArray(null);
  }

  // proyección de un punto del mundo a coordenadas de pantalla (CSS px) o null
  function project(p) {
    var m = frame.vp;
    var x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
    var y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
    var w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    if (w <= 0.05) return null;
    return [(x / w * 0.5 + 0.5) * canvas.clientWidth, (1 - (y / w * 0.5 + 0.5)) * canvas.clientHeight];
  }
  function camVectors() {
    var c = frame.camWorld;
    return { right: [c[0], c[1], c[2]], up: [c[4], c[5], c[6]], fwd: [c[8], c[9], c[10]] };
  }

  return {
    init: init, render: render, loadTextures: loadTextures, Node: Node, Mesh: Mesh, camera: camera, globals: globals,
    get root() { return root; }, get vmRoot() { return vmRoot; }, project: project, camVectors: camVectors, xform: xform,
    stats: stats, renderScale: 1.5, compose: compose, ident: ident, mul: mul
  };
})();
