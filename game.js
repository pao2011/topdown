'use strict';
(() => {
// ================= Datos =================
const T = 40; // tamaño de casilla en px de mundo
const STICK_R = 56, SNEAK = 0.55, FIRE = 0.8;

const WEAPONS = {
  pistol:   { name: 'Pistola',  price: 0,   dmg: 26,  rate: 3.5, mag: 12, reload: 1.0, spread: 0.05,  noise: 420, speed: 1000, reserve: 48, pellets: 1 },
  smg:      { name: 'Subfusil', price: 350, dmg: 15,  rate: 11,  mag: 32, reload: 1.4, spread: 0.10,  noise: 460, speed: 1000, reserve: 128, pellets: 1 },
  shotgun:  { name: 'Escopeta', price: 450, dmg: 15,  rate: 1.3, mag: 6,  reload: 1.9, spread: 0.22,  noise: 620, speed: 900,  reserve: 24, pellets: 8 },
  crossbow: { name: 'Ballesta', price: 500, dmg: 120, rate: 0.9, mag: 1,  reload: 1.1, spread: 0.01,  noise: 40,  speed: 760,  reserve: 10, pellets: 1, bolt: true },
  rifle:    { name: 'Fusil',    price: 750, dmg: 32,  rate: 7.5, mag: 26, reload: 1.6, spread: 0.045, noise: 560, speed: 1150, reserve: 104, pellets: 1 },
};
const MODS = {
  silencer: { name: 'Silenciador',       desc: 'Ruido −70 %, daño −10 %',            price: 180, apply: s => { s.noise *= 0.3; s.dmg *= 0.9; s.silenced = true; } },
  mag:      { name: 'Cargador ampliado', desc: '+50 % de munición',                  price: 120, apply: s => { s.mag = Math.ceil(s.mag * 1.5); } },
  laser:    { name: 'Mira láser',        desc: 'Dispersión −50 % y línea de tiro',   price: 140, apply: s => { s.spread *= 0.5; s.laser = true; } },
  barrel:   { name: 'Cañón pesado',      desc: '+30 % de daño',                      price: 200, apply: s => { s.dmg *= 1.3; } },
  trigger:  { name: 'Gatillo ligero',    desc: '+25 % cadencia, recarga −25 %',      price: 160, apply: s => { s.rate *= 1.25; s.reload *= 0.75; } },
};
const FOES = {
  guard: { hp: 60,  walk: 58, run: 125, dmg: 9,  rate: 1.7, spread: 0.13, pellets: 1, vision: 250, reward: 30, r: 13, color: '#c9584a' },
  heavy: { hp: 160, walk: 45, run: 95,  dmg: 6,  rate: 0.9, spread: 0.28, pellets: 5, vision: 220, reward: 60, r: 16, color: '#9e3f36' },
  elite: { hp: 90,  walk: 66, run: 145, dmg: 11, rate: 4.2, spread: 0.08, pellets: 1, vision: 290, reward: 50, r: 13, color: '#e0843a' },
};
const LIGHT = { patrol: '150,195,255', suspicious: '255,181,71', investigate: '255,181,71', search: '255,181,71', combat: '255,84,68' };
const DIR4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR8 = [...DIR4, [1, 1], [1, -1], [-1, 1], [-1, -1]];

// ================= Utilidades =================
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random() * (b - a);
const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function angDiff(a, b) { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
function mulberry32(a) { return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const $ = id => document.getElementById(id);
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* sin vibración */ } };

// ================= Estado =================
const cv = $('c'), ctx = cv.getContext('2d');
const lightCv = document.createElement('canvas'), lctx = lightCv.getContext('2d');
let dpr = 1, vw = 0, vh = 0, cw = 0, ch = 0, zoom = 1, ui = 1;
let inset = { t: 0, r: 0, b: 0, l: 0 };
let W = 0, H = 0, map = null;
let run = null, room = null, state = 'menu';
const cam = { x: 0, y: 0, shake: 0 };
const keys = {}, mouse = { x: 0, y: 0, down: false, active: false };
const sticks = { L: null, R: null };
let touchMode = matchMedia('(pointer: coarse)').matches;

// ================= Mapa =================
const solid = (tx, ty) => tx < 0 || ty < 0 || tx >= W || ty >= H || map[ty * W + tx] !== 0;
const solidPx = (x, y) => solid(Math.floor(x / T), Math.floor(y / T));
const center = c => ({ x: (c % W) * T + T / 2, y: ((c / W) | 0) * T + T / 2 });
const cellOf = (x, y) => clamp(Math.floor(y / T), 0, H - 1) * W + clamp(Math.floor(x / T), 0, W - 1);

// DDA sobre la rejilla: distancia hasta la primera pared (o max)
function castRay(x, y, dx, dy, max) {
  let mx = Math.floor(x / T), my = Math.floor(y / T);
  const sx = dx < 0 ? -1 : 1, sy = dy < 0 ? -1 : 1;
  const ddx = dx ? Math.abs(T / dx) : Infinity, ddy = dy ? Math.abs(T / dy) : Infinity;
  let tx = dx ? (dx > 0 ? (mx + 1) * T - x : x - mx * T) / Math.abs(dx) : Infinity;
  let ty = dy ? (dy > 0 ? (my + 1) * T - y : y - my * T) / Math.abs(dy) : Infinity;
  for (;;) {
    let t;
    if (tx < ty) { t = tx; tx += ddx; mx += sx; } else { t = ty; ty += ddy; my += sy; }
    if (t >= max) return max;
    if (solid(mx, my)) return t;
  }
}
function los(ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay);
  return d < 1 || castRay(ax, ay, (bx - ax) / d, (by - ay) / d, d) >= d - 0.5;
}
function clearWalk(ax, ay, bx, by, r) {
  const d = Math.hypot(bx - ax, by - ay);
  if (d < 1) return true;
  const nx = -(by - ay) / d * r * 0.9, ny = (bx - ax) / d * r * 0.9;
  return los(ax, ay, bx, by) && los(ax + nx, ay + ny, bx + nx, by + ny) && los(ax - nx, ay - ny, bx - nx, by - ny);
}
// Polígono de visibilidad (cono si half < PI, círculo si no)
function visPoly(x, y, a, half, range, n) {
  const pts = half < Math.PI ? [x, y] : [];
  for (let i = 0; i <= n; i++) {
    const t = a - half + 2 * half * i / n, dx = Math.cos(t), dy = Math.sin(t);
    const d = castRay(x, y, dx, dy, range);
    const e = d < range ? d + 8 : d; // la luz baña el borde de la pared
    pts.push(x + dx * e, y + dy * e);
  }
  return pts;
}
function bfs(start) {
  const d = new Int16Array(W * H).fill(-1), q = new Int32Array(W * H);
  let h = 0, t = 0;
  d[start] = 0; q[t++] = start;
  while (h < t) {
    const c = q[h++], cx = c % W, cy = (c / W) | 0;
    for (const [ox, oy] of DIR4) {
      const nx = cx + ox, ny = cy + oy, n = ny * W + nx;
      if (!solid(nx, ny) && d[n] < 0) { d[n] = d[c] + 1; q[t++] = n; }
    }
  }
  return d;
}
function findPath(ax, ay, bx, by) {
  const s = cellOf(ax, ay);
  let g = cellOf(bx, by);
  if (map[g]) { // destino dentro de una pared: busca la casilla libre más cercana
    const gx = g % W, gy = (g / W) | 0;
    g = -1;
    for (let r = 1; r <= 2 && g < 0; r++) for (const [ox, oy] of DIR8) if (!solid(gx + ox * r, gy + oy * r)) { g = (gy + oy * r) * W + gx + ox * r; break; }
    if (g < 0) return null;
  }
  const prev = new Int32Array(W * H).fill(-1), q = new Int32Array(W * H);
  let h = 0, t = 0;
  prev[s] = s; q[t++] = s;
  while (h < t) {
    const c = q[h++];
    if (c === g) break;
    const cx = c % W, cy = (c / W) | 0;
    for (const [ox, oy] of DIR8) {
      const nx = cx + ox, ny = cy + oy, n = ny * W + nx;
      if (solid(nx, ny) || prev[n] >= 0) continue;
      if (ox && oy && (solid(cx + ox, cy) || solid(cx, cy + oy))) continue; // sin cortar esquinas
      prev[n] = c; q[t++] = n;
    }
  }
  if (prev[g] < 0) return null;
  const path = [];
  for (let c = g; c !== s; c = prev[c]) path.push(center(c));
  path.reverse();
  if (!path.length) path.push(center(g));
  return path;
}

function buildRoom(level, seed) {
  const rand = mulberry32(seed), ri = n => Math.floor(rand() * n);
  W = Math.min(40, 20 + level * 2); H = Math.min(28, 14 + level);
  map = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!x || !y || x === W - 1 || y === H - 1) map[y * W + x] = 1;
  // Partición binaria: cada corte es un muro con una puerta, así todo queda conectado
  const leaves = [], doors = [];
  (function split(x0, y0, x1, y1) {
    const w = x1 - x0 + 1, h = y1 - y0 + 1, canV = w >= 11, canH = h >= 9;
    if ((!canV && !canH) || (w * h < 90 && rand() < 0.35)) { leaves.push({ x0, y0, x1, y1 }); return; }
    if (canV && (!canH || rand() < w / (w + h))) {
      const sx = x0 + 4 + ri(w - 8);
      for (let y = y0; y <= y1; y++) map[y * W + sx] = 1;
      doors.push([sx, y0 + ri(h - 1), 1]);
      split(x0, y0, sx - 1, y1); split(sx + 1, y0, x1, y1);
    } else {
      const sy = y0 + 3 + ri(h - 6);
      for (let x = x0; x <= x1; x++) map[sy * W + x] = 1;
      doors.push([x0 + ri(w - 1), sy, 0]);
      split(x0, y0, x1, sy - 1); split(x0, sy + 1, x1, y1);
    }
  })(1, 1, W - 2, H - 2);
  // Puertas de 2 casillas, despejando ambos lados (un muro hijo podría taparlas)
  for (const [dx, dy, v] of doors) for (let k = 0; k < 2; k++) for (let o = -1; o <= 1; o++) map[(v ? dy + k : dy + o) * W + (v ? dx + o : dx + k)] = 0;

  const L0 = leaves[0], start = ((L0.y0 + L0.y1) >> 1) * W + ((L0.x0 + L0.x1) >> 1);
  const floorCount = () => map.reduce((n, v) => n + (v === 0), 0);
  const connected = () => bfs(start).reduce((n, v) => n + (v >= 0), 0) === floorCount();
  // Cajas: cobertura que bloquea paso y visión; se descartan si aíslan alguna zona
  for (const L of leaves) for (let i = ri(4); i > 0; i--) {
    const x = L.x0 + 1 + ri(Math.max(1, L.x1 - L.x0 - 1)), y = L.y0 + 1 + ri(Math.max(1, L.y1 - L.y0 - 1));
    const c = y * W + x;
    if (map[c] || Math.abs(x - start % W) + Math.abs(y - ((start / W) | 0)) < 3) continue;
    if (doors.some(([dx, dy]) => Math.abs(dx - x) < 3 && Math.abs(dy - y) < 3)) continue;
    const cells = [c];
    if (rand() < 0.5 && !map[c + 1] && x + 1 < L.x1) cells.push(c + 1);
    cells.forEach(k => { map[k] = 2; });
    if (!connected()) cells.forEach(k => { map[k] = 0; });
  }

  const dist0 = bfs(start);
  let exit = start;
  for (let i = 0; i < dist0.length; i++) if (dist0[i] > dist0[exit]) exit = i;

  const r = {
    level, W, H, map, leaves, start: center(start), exit: center(exit),
    lamps: [], enemies: [], bullets: [], nades: [], parts: [], rings: [], texts: [], bodies: [], decals: [], flashes: [], items: [],
    detected: false, kills: 0, silent: 0, time: 0, deathT: 0, exposure: 0,
  };
  for (const L of leaves) {
    const c = ((L.y0 + L.y1) >> 1) * W + ((L.x0 + L.x1) >> 1);
    if (L !== L0 && !map[c] && rand() < 0.55) {
      const p = center(c);
      r.lamps.push({ x: p.x, y: p.y, r: 150, on: true, poly: visPoly(p.x, p.y, 0, Math.PI, 150, 48) });
    }
  }
  // Enemigos lejos de la entrada y separados entre sí
  const count = Math.min(18, 3 + Math.round(level * 1.5));
  const cands = [];
  for (let i = 0; i < dist0.length; i++) if (dist0[i] >= 8) cands.push(i);
  for (let tries = 0; r.enemies.length < count && tries < 400 && cands.length; tries++) {
    const c = cands[ri(cands.length)], p = center(c);
    if (r.enemies.some(e => Math.hypot(e.x - p.x, e.y - p.y) < T * 3)) continue;
    const roll = rand();
    const type = level >= 4 && roll < 0.1 + level * 0.02 ? 'elite' : level >= 2 && roll > 0.68 ? 'heavy' : 'guard';
    r.enemies.push(makeEnemy(type, c, rand));
  }
  for (let i = 0; i < 1 + (level >> 2) && cands.length; i++) r.items.push(center(cands[ri(cands.length)]));
  r.p = { x: r.start.x, y: r.start.y, vx: 0, vy: 0, a: 0, r: 12, speed: 0, sneak: true, stepT: 0, fireT: 0, reloadT: 0, meleeT: 0, nadeT: 0, noiseT: 0, swingT: 0, hurtT: 0, muzzleT: 0, dead: false };
  r.p.a = Math.atan2(r.exit.y - r.start.y, r.exit.x - r.start.x);
  return r;
}

function makePatrol(c, rand) {
  const d = bfs(c), cands = [];
  for (let i = 0; i < d.length; i++) if (d[i] >= 3 && d[i] <= 11) cands.push(i);
  const wps = [center(c)];
  const n = rand() < 0.2 ? 0 : 1 + Math.floor(rand() * 3); // 0 = centinela que vigila en el sitio
  for (let k = 0; k < n && cands.length; k++) wps.push(center(cands[Math.floor(rand() * cands.length)]));
  return wps;
}
const jitter = p => ({ x: p.x + rnd(-13, 13), y: p.y + rnd(-13, 13) });
function makeEnemy(type, c, rand) {
  const F = FOES[type], p = center(c);
  const e = {
    type, x: p.x, y: p.y, r: F.r, hp: F.hp, a: rand() * Math.PI * 2, state: 'patrol', aware: 0, alertLvl: 0,
    seen: new Set(), fireT: 0, reactT: 0, waitT: rand() * 2, lookT: 0, lookA: 0, dir: 1, wpI: 0, path: null,
    target: null, urgent: false, spts: [], pauseT: 0, last: null, lostT: 0, moveA: null, chkT: 0, chkX: 0, chkY: 0,
  };
  e.lookA = e.a;
  e.wps = makePatrol(c, rand);
  e.goal = jitter(e.wps[0]);
  return e;
}

// ================= Partida =================
function newRun() {
  run = { level: 1, money: 0, hp: 100, maxHp: 100, nades: 2, light: true, weapons: [{ id: 'pistol', mods: [], ammo: 12, reserve: 36 }], cur: 0, seed: (Math.random() * 1e9) | 0, snap: null };
}
const curW = () => run.weapons[run.cur];
function wstats(w) { const s = { ...WEAPONS[w.id] }; for (const m of w.mods) MODS[m].apply(s); return s; }

function startRoom() {
  const { snap, ...rest } = run;
  run.snap = JSON.stringify(rest);
  room = buildRoom(run.level, run.seed + run.level * 977);
  cam.x = room.p.x; cam.y = room.p.y;
  sticks.L = sticks.R = null; mouse.down = false;
  state = 'play';
  show(null);
  save();
}
function retryRoom() {
  const snap = run.snap;
  run = { ...JSON.parse(snap), snap };
  startRoom();
}
function completeRoom() {
  const bonus = 80 + 20 * run.level, ghost = room.detected ? 0 : 120;
  run.money += bonus + ghost;
  run.hp = Math.min(run.maxHp, run.hp + 20);
  run.level++;
  sfx('buy');
  openShop(`Bajas ${room.kills} · silenciosas ${room.silent} · bonus de sala <b>+$${bonus}</b>` +
    (ghost ? ` · fantasma (sin ser detectado) <b>+$${ghost}</b>` : '') + ` · +20 de vida`);
}
function openShop(stats) {
  state = 'shop';
  $('shopTitle').textContent = `Sala ${run.level - 1} superada`;
  $('shopStats').innerHTML = stats;
  shopTab = 'arm';
  renderShop();
  show('shop');
  save();
}
// Guardado automático al entrar en cada sala y en la tienda
const SAVE = 'apagon-partida-v1';
function save() {
  try { const { snap, ...rest } = run; localStorage.setItem(SAVE, JSON.stringify({ run: rest, shop: state === 'shop' })); } catch (e) { /* sin almacenamiento: se juega sin guardar */ }
}
function loadSave() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE)), r = d && d.run;
    // lo guardado puede estar corrupto o venir de otra versión: solo se acepta si encaja
    if (r && Number.isInteger(r.level) && r.level > 0 && r.hp > 0 && [r.money, r.nades, r.maxHp, r.seed].every(Number.isFinite) &&
        Array.isArray(r.weapons) && r.weapons.length && Number.isInteger(r.cur) && r.weapons[r.cur] &&
        r.weapons.every(w => WEAPONS[w.id] && Array.isArray(w.mods) && w.mods.every(m => MODS[m]) && Number.isFinite(w.ammo) && Number.isFinite(w.reserve))) return d;
  } catch (e) { /* partida ilegible: se ignora */ }
  return null;
}
function refreshMenu() {
  const d = loadSave(), b = $('bPlay');
  $('bCont').hidden = !d;
  if (d) $('bCont').textContent = `Continuar · sala ${d.run.level}`;
  delete b.dataset.sure;
  b.textContent = d ? 'Nueva partida' : 'Jugar';
  b.className = d ? 'ghost' : 'cta';
}
function gameOver() {
  state = 'over';
  $('overInfo').textContent = `Caíste en la sala ${run.level}. Puedes reintentarla con el equipo con el que entraste.`;
  show('over');
}

// ================= Ruido y percepción =================
function noise(x, y, r, kind, src, tx = x, ty = y) {
  room.rings.push({ x, y, r, t: 0, kind });
  for (const e of room.enemies) {
    if (e === src) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d > r || (d > r * 0.6 && !los(x, y, e.x, e.y))) continue; // las paredes amortiguan
    hear(e, tx, ty, kind, d);
  }
}
function hear(e, x, y, kind, d) {
  const fromPlayer = kind !== 'alert' && kind !== 'eshot';
  if (e.state === 'combat') { if (fromPlayer && kind !== 'impact') e.last = { x, y }; return; }
  const err = Math.min(60, d * 0.15); // no saben exactamente de dónde vino
  const tx = x + rnd(-err, err), ty = y + rnd(-err, err);
  if (kind === 'shot' || kind === 'boom' || kind === 'alert' || kind === 'eshot') {
    e.alertLvl = Math.max(e.alertLvl, 1);
    investigate(e, tx, ty, true);
  } else if (!(e.state === 'investigate' && e.urgent)) {
    suspicious(e, tx, ty);
  }
}
function suspicious(e, x, y) {
  if (e.state !== 'suspicious') e.stateT = rnd(0.6, 1.3);
  e.state = 'suspicious'; e.target = { x, y }; e.path = null;
}
function investigate(e, x, y, urgent) {
  e.state = 'investigate'; e.target = { x, y }; e.urgent = urgent; e.path = null;
}
function search(e) {
  e.state = 'search'; e.pauseT = rnd(1.2, 2.2); e.lookT = 0; e.path = null;
  const d = bfs(cellOf(e.x, e.y)), near = [];
  for (let i = 0; i < d.length; i++) if (d[i] >= 2 && d[i] <= 5) near.push(i);
  e.spts = [];
  for (let k = 0; k < 2 && near.length; k++) e.spts.push(center(near[(Math.random() * near.length) | 0]));
}
function backToPatrol(e) {
  e.state = 'patrol'; e.aware = 0; e.path = null; e.waitT = 0.6;
  if (Math.random() < 0.6) e.wps = makePatrol(cellOf(e.x, e.y), Math.random); // patrulla nueva cerca de donde buscó
  e.wpI = 0; e.goal = jitter(e.wps[0]);
}
function enterCombat(e) {
  const p = room.p;
  if (e.state !== 'combat') {
    e.state = 'combat'; e.reactT = Math.max(0.2, rnd(0.35, 0.7) - run.level * 0.015); e.aware = 1; e.path = null;
    room.detected = true;
    popup(e.x, e.y - 24, '!', '#ff5444');
    sfx('alert', e.x, e.y);
    noise(e.x, e.y, 340, 'alert', e, p.x, p.y); // avisa a los compañeros de dónde estás
  }
  e.last = { x: p.x, y: p.y }; e.lostT = 0; e.alertLvl = Math.max(e.alertLvl, 1);
}
function exposure() {
  const p = room.p;
  let x = 0.45;
  if (run.light) x += 0.55;
  if (p.muzzleT > 0) x += 0.9;
  for (const l of room.lamps) if (l.on && Math.hypot(l.x - p.x, l.y - p.y) < l.r * 0.8 && los(l.x, l.y, p.x, p.y)) { x += 0.7; break; }
  if (p.sneak) x *= 0.6;
  return x;
}

// ================= IA enemiga =================
function moveTo(e, tx, ty, speed, dt) {
  if (Math.hypot(tx - e.x, ty - e.y) < 12) return true;
  if (!e.path || Math.hypot(e.goalX - tx, e.goalY - ty) > 30) {
    e.path = findPath(e.x, e.y, tx, ty); e.pathI = 0; e.goalX = tx; e.goalY = ty;
    e.chkX = e.x; e.chkY = e.y; e.chkT = 0.7;
    if (!e.path) return true;
  }
  const P = e.path;
  while (e.pathI < P.length - 1 && clearWalk(e.x, e.y, P[e.pathI + 1].x, P[e.pathI + 1].y, e.r)) e.pathI++;
  const n = P[e.pathI], dx = n.x - e.x, dy = n.y - e.y, d = Math.hypot(dx, dy);
  if (d < 4) { if (++e.pathI >= P.length) { e.path = null; return true; } return false; }
  const s = Math.min(speed * dt, d);
  e.x += dx / d * s; e.y += dy / d * s; e.moveA = Math.atan2(dy, dx);
  if ((e.chkT -= dt) <= 0) { // atascado contra algo: se rinde con este destino
    if (Math.hypot(e.x - e.chkX, e.y - e.chkY) < 4) { e.path = null; return true; }
    e.chkX = e.x; e.chkY = e.y; e.chkT = 0.7;
  }
  return false;
}
function lookAround(e, dt, spread) {
  if ((e.lookT -= dt) <= 0) { e.lookT = rnd(0.7, 1.8); e.lookA = e.a + rnd(-spread, spread); }
  return e.lookA;
}
function updateEnemy(e, dt) {
  const p = room.p, F = FOES[e.type], X = room.exposure;
  e.fireT -= dt; e.moveA = null;
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), toP = Math.atan2(dy, dx);
  const combat = e.state === 'combat';
  const range = F.vision * (1 + 0.15 * e.alertLvl) * (combat ? 1.4 : 0.6 + 0.4 * Math.min(1, X));
  const sees = !p.dead && ((d < range && Math.abs(angDiff(e.a, toP)) < (combat ? 1.2 : 0.62) && los(e.x, e.y, p.x, p.y)) ||
    (d < e.r + p.r + 20 && !p.sneak) || (combat && d < 130 && los(e.x, e.y, p.x, p.y)));

  if (sees) {
    if (combat) enterCombat(e);
    else {
      e.aware += dt * X * (0.8 + 2.6 * (1 - d / range)) * (1 + 0.5 * e.alertLvl);
      if (e.aware >= 1) enterCombat(e);
      else if (e.aware > 0.3 && e.state !== 'investigate') suspicious(e, p.x, p.y);
    }
  } else if (!combat) {
    e.aware = Math.max(0, e.aware - dt * 0.18);
    // la linterna del jugador sobre un guardia de espaldas le hace girarse
    if (run.light && !p.dead && d < 330 && Math.abs(angDiff(p.a, toP + Math.PI)) < 0.6 && los(e.x, e.y, p.x, p.y)) {
      e.aware += dt * 0.35;
      if (e.aware > 0.3 && e.state === 'patrol') suspicious(e, p.x, p.y);
    }
  }
  if (!combat) for (const b of room.bodies) {
    if (e.seen.has(b)) continue;
    const bd = Math.hypot(b.x - e.x, b.y - e.y);
    if (bd < F.vision * 0.9 && Math.abs(angDiff(e.a, Math.atan2(b.y - e.y, b.x - e.x))) < 0.62 && los(e.x, e.y, b.x, b.y)) {
      e.seen.add(b); e.alertLvl = 2;
      popup(e.x, e.y - 24, '?!', '#ffb547');
      investigate(e, b.x, b.y, true);
      noise(e.x, e.y, 260, 'alert', e, b.x, b.y);
    }
  }

  let face = null;
  switch (e.state) {
    case 'patrol':
      if (e.waitT > 0) { e.waitT -= dt; face = lookAround(e, dt, 1.5); }
      else if (moveTo(e, e.goal.x, e.goal.y, F.walk * (1 + 0.1 * e.alertLvl), dt)) {
        e.waitT = rnd(0.8, 3.2); e.lookT = 0.4; e.lookA = e.a;
        if (Math.random() < 0.15) e.dir = -e.dir; // la ruta varía: a veces da media vuelta
        e.wpI = ((e.wpI + e.dir) % e.wps.length + e.wps.length) % e.wps.length;
        e.goal = jitter(e.wps[e.wpI]);
      }
      break;
    case 'suspicious':
      face = Math.atan2(e.target.y - e.y, e.target.x - e.x);
      if ((e.stateT -= dt) <= 0) investigate(e, e.target.x, e.target.y, false);
      break;
    case 'investigate':
      if (moveTo(e, e.target.x, e.target.y, e.urgent ? F.run : F.walk * 1.25, dt)) search(e);
      break;
    case 'search':
      if (e.pauseT > 0) { e.pauseT -= dt; face = lookAround(e, dt, 2.4); }
      else if (e.spts.length) { if (moveTo(e, e.spts[0].x, e.spts[0].y, F.walk * 1.3, dt)) { e.spts.shift(); e.pauseT = rnd(0.8, 1.8); } }
      else backToPatrol(e);
      break;
    case 'combat':
      if (sees) {
        face = toP;
        e.reactT -= dt;
        if (d > 170) moveTo(e, p.x, p.y, F.walk * 1.5, dt);
        if (e.reactT <= 0 && e.fireT <= 0 && Math.abs(angDiff(e.a, toP)) < 0.3) enemyShoot(e);
      } else {
        e.lostT += dt; e.reactT = Math.max(e.reactT, 0.3);
        if (moveTo(e, e.last.x, e.last.y, F.run, dt) || e.lostT > 8) { e.alertLvl = 2; e.aware = 0.5; search(e); }
      }
      break;
  }
  const want = face ?? e.moveA ?? e.a, turn = (combat ? 6 : 3.2) * dt;
  e.a += clamp(angDiff(e.a, want), -turn, turn);
}
function enemyShoot(e) {
  const F = FOES[e.type];
  e.fireT = rnd(0.8, 1.3) / F.rate;
  const mx = e.x + Math.cos(e.a) * (e.r + 6), my = e.y + Math.sin(e.a) * (e.r + 6);
  for (let i = 0; i < F.pellets; i++) bullet(mx, my, e.a + rnd(-F.spread, F.spread), 620, F.dmg, false);
  flash(mx, my, 110, 0.07);
  noise(e.x, e.y, 420, 'eshot', e);
  sfx('eshot', e.x, e.y);
}

// ================= Jugador =================
function stickVec(s) {
  if (!s) return { x: 0, y: 0, m: 0 };
  const dx = (s.x - s.ox) / STICK_R, dy = (s.y - s.oy) / STICK_R, m = Math.hypot(dx, dy);
  if (m < 0.12) return { x: 0, y: 0, m: 0 };
  const k = Math.min(1, (m - 0.12) / 0.88);
  return { x: dx / m * k, y: dy / m * k, m: k };
}
function updatePlayer(dt) {
  const p = room.p;
  for (const k of ['fireT', 'meleeT', 'nadeT', 'noiseT', 'swingT', 'hurtT', 'muzzleT']) p[k] -= dt;
  // Movimiento: el recorrido del stick decide entre sigilo y carrera
  const L = stickVec(sticks.L);
  let mx = L.x, my = L.y, mag = L.m;
  const kx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const ky = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  if (kx || ky) { mag = keys.ShiftLeft || keys.ShiftRight ? 0.45 : 1; const k = Math.hypot(kx, ky); mx = kx / k * mag; my = ky / k * mag; }
  const speed = mag <= SNEAK ? 78 * mag / SNEAK : 78 + 97 * (mag - SNEAK) / (1 - SNEAK);
  const tvx = mag ? mx / mag * speed : 0, tvy = mag ? my / mag * speed : 0;
  const acc = Math.min(1, dt * 12);
  p.vx += (tvx - p.vx) * acc; p.vy += (tvy - p.vy) * acc;
  p.speed = Math.hypot(p.vx, p.vy);
  p.sneak = mag < SNEAK + 0.01;
  const steps = Math.max(1, Math.ceil(p.speed * dt / 6));
  for (let i = 0; i < steps; i++) { p.x += p.vx * dt / steps; p.y += p.vy * dt / steps; collide(p); }
  if (!p.sneak && p.speed > 90 && (p.stepT -= dt) <= 0) {
    p.stepT = 0.3;
    noise(p.x, p.y, 50 + p.speed * 0.85, 'step');
    sfx('step');
  }
  // Apuntado: stick derecho > ratón > dirección de marcha
  const R = stickVec(sticks.R);
  let aim = null, firing = false;
  if (R.m > 0) {
    aim = Math.atan2(R.y, R.x); firing = R.m > FIRE;
    if (firing) aim = assist(aim);
  } else if (mouse.active && !touchMode) {
    aim = Math.atan2(mouse.y - (vh / 2 + (p.y - cam.y) * zoom), mouse.x - (vw / 2 + (p.x - cam.x) * zoom));
    firing = mouse.down;
  } else if (mag > 0.1) aim = Math.atan2(my, mx);
  if (aim !== null) p.a += angDiff(p.a, aim) * Math.min(1, dt * 18);
  if (p.reloadT > 0 && (p.reloadT -= dt) <= 0) { const w = curW(), n = Math.min(wstats(w).mag - w.ammo, w.reserve); w.ammo += n; w.reserve -= n; }
  if (firing) shoot();
}
function assist(a) { // ayuda de apuntado suave para pantallas táctiles
  const p = room.p;
  let best = null, bd = 0.22;
  for (const e of room.enemies) {
    const d = dist(p, e), da = Math.abs(angDiff(a, ang(p, e)));
    if (d < 420 && da < bd && los(p.x, p.y, e.x, e.y)) { best = e; bd = da; }
  }
  return best ? ang(p, best) : a;
}
function collide(o) {
  const r = o.r;
  for (let ty = Math.floor((o.y - r) / T); ty <= Math.floor((o.y + r) / T); ty++)
    for (let tx = Math.floor((o.x - r) / T); tx <= Math.floor((o.x + r) / T); tx++) {
      if (!solid(tx, ty)) continue;
      const dx = o.x - clamp(o.x, tx * T, tx * T + T), dy = o.y - clamp(o.y, ty * T, ty * T + T), d2 = dx * dx + dy * dy;
      if (d2 < r * r && d2 > 0) { const d = Math.sqrt(d2), k = (r - d) / d; o.x += dx * k; o.y += dy * k; }
    }
}
function shoot() {
  const p = room.p, w = curW(), s = wstats(w);
  if (p.reloadT > 0 || p.fireT > 0 || p.dead) return;
  if (w.ammo <= 0) { if (w.reserve) reload(); else { p.fireT = 0.35; sfx('empty'); } return; }
  w.ammo--;
  p.fireT = 1 / s.rate;
  const mx = p.x + Math.cos(p.a) * 18, my = p.y + Math.sin(p.a) * 18;
  for (let i = 0; i < s.pellets; i++) bullet(mx, my, p.a + rnd(-s.spread, s.spread), s.speed * rnd(0.94, 1.06), s.dmg, true, s.bolt);
  const quiet = s.silenced || s.bolt;
  noise(p.x, p.y, s.noise, s.noise < 200 ? 'step' : 'shot'); // un disparo silenciado solo despierta sospechas
  if (!quiet) { flash(mx, my, 150, 0.08); p.muzzleT = 0.15; }
  cam.shake = Math.max(cam.shake, s.pellets > 1 ? 7 : quiet ? 1 : 2.5);
  sfx(s.bolt ? 'bolt' : s.silenced ? 'sil' : s.pellets > 1 ? 'shotgun' : 'shot');
  if (!w.ammo) reload();
}
function reload() {
  const p = room.p, w = curW(), s = wstats(w);
  if (p.reloadT > 0 || w.ammo >= s.mag || !w.reserve) return;
  p.reloadT = s.reload;
  sfx('reload');
}
function selectWeapon(i) {
  i = (i + run.weapons.length) % run.weapons.length;
  if (i === run.cur) return;
  run.cur = i;
  room.p.reloadT = 0; room.p.fireT = 0.25;
  sfx('reload');
}
const cycleWeapon = () => selectWeapon(run.cur + 1);
function addAmmo(k) { for (const w of run.weapons) { const m = WEAPONS[w.id].reserve; w.reserve = Math.min(m, w.reserve + Math.ceil(m * k)); } }
const ammoFull = () => run.weapons.every(w => w.reserve >= WEAPONS[w.id].reserve);
function melee() {
  const p = room.p;
  if (p.meleeT > 0 || p.dead) return;
  p.meleeT = 0.45; p.swingT = 0.18;
  let best = null, bd = 72;
  for (const e of room.enemies) {
    const d = dist(p, e);
    if (d < bd && Math.abs(angDiff(p.a, ang(p, e))) < 1.75 && los(p.x, p.y, e.x, e.y)) { best = e; bd = d; }
  }
  if (best) { // se abalanza hacia el objetivo más cercano
    p.a = ang(p, best);
    const step = Math.max(0, bd - best.r - p.r - 4);
    for (let i = 0; i < 4; i++) { p.x += Math.cos(p.a) * step / 4; p.y += Math.sin(p.a) * step / 4; collide(p); }
  }
  sfx('knife');
  noise(p.x, p.y, 55, 'step');
  for (const e of [...room.enemies]) {
    if (dist(p, e) < e.r + p.r + 22 && Math.abs(angDiff(p.a, ang(p, e))) < 1.1) {
      const behind = Math.abs(angDiff(e.a, ang(e, p))) > 1.9;
      hurtEnemy(e, e.state !== 'combat' || behind ? 999 : 55, p.a);
    }
  }
}
function throwNade() {
  const p = room.p;
  if (run.nades <= 0 || p.nadeT > 0 || p.dead) return;
  run.nades--; p.nadeT = 0.6;
  room.nades.push({ x: p.x + Math.cos(p.a) * 14, y: p.y + Math.sin(p.a) * 14, vx: Math.cos(p.a) * 470 + p.vx * 0.5, vy: Math.sin(p.a) * 470 + p.vy * 0.5, t: 1.7 });
  sfx('throw');
}
function makeNoise() {
  const p = room.p;
  if (p.noiseT > 0 || p.dead) return;
  p.noiseT = 1.5;
  noise(p.x, p.y, 300, 'whistle');
  sfx('whistle');
}
function toggleLight() { run.light = !run.light; sfx('empty'); }

// ================= Daño, balas, explosiones =================
function bullet(x, y, a, speed, dmg, mine, bolt = false) {
  room.bullets.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg, mine, bolt, life: 1.2 });
}
function hurtEnemy(e, dmg, a) {
  e.hp -= dmg;
  e.x += Math.cos(a) * 4; e.y += Math.sin(a) * 4;
  blood(e.x, e.y, a, 8);
  if (e.hp > 0) { enterCombat(e); return; }
  const unaware = e.state !== 'combat';
  const reward = Math.round(FOES[e.type].reward * (unaware ? 1.5 : 1));
  run.money += reward; room.kills++;
  if (unaware) room.silent++;
  popup(e.x, e.y - 20, unaware ? `SIGILO +$${reward}` : `+$${reward}`, unaware ? '#62d6ad' : '#ffd98a');
  room.bodies.push({ x: e.x, y: e.y, a, type: e.type });
  room.decals.push({ x: e.x + Math.cos(a) * 8, y: e.y + Math.sin(a) * 8, r: 16 });
  room.enemies.splice(room.enemies.indexOf(e), 1);
  if (Math.random() < 0.65) room.items.push({ x: e.x + rnd(-10, 10), y: e.y + rnd(-10, 10) });
  sfx('gore', e.x, e.y);
}
function hurtPlayer(dmg) {
  const p = room.p;
  if (p.dead) return;
  run.hp -= dmg; p.hurtT = 0.35;
  cam.shake = Math.max(cam.shake, 5);
  blood(p.x, p.y, Math.random() * 6.3, 5);
  sfx('hit'); buzz(35);
  if (run.hp <= 0) { run.hp = 0; p.dead = true; room.deathT = 1.3; buzz(200); }
}
function updateBullets(dt) {
  const p = room.p;
  for (const b of room.bullets) {
    const n = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 8);
    for (let i = 0; i < n && !b.dead; i++) {
      b.x += b.vx * dt / n; b.y += b.vy * dt / n;
      if (solidPx(b.x, b.y)) {
        b.dead = true;
        sparks(b.x - b.vx * 0.004, b.y - b.vy * 0.004, 4);
        if (b.mine) noise(b.x, b.y, b.bolt ? 60 : 110, 'impact'); // el impacto también distrae
        break;
      }
      if (b.mine) {
        for (const l of room.lamps) if (l.on && Math.hypot(l.x - b.x, l.y - b.y) < 12) {
          l.on = false; b.dead = true; sparks(l.x, l.y, 12);
          noise(l.x, l.y, 160, 'impact'); sfx('glass', l.x, l.y);
        }
        for (const e of room.enemies) if (Math.hypot(e.x - b.x, e.y - b.y) < e.r) { hurtEnemy(e, b.dmg, Math.atan2(b.vy, b.vx)); b.dead = true; break; }
      } else if (Math.hypot(p.x - b.x, p.y - b.y) < p.r) { hurtPlayer(b.dmg); b.dead = true; }
    }
    if ((b.life -= dt) <= 0) b.dead = true;
  }
  room.bullets = room.bullets.filter(b => !b.dead);
}
function updateNades(dt) {
  for (const n of room.nades) {
    const f = Math.exp(-2.4 * dt);
    n.vx *= f; n.vy *= f;
    if (solidPx(n.x + n.vx * dt, n.y)) n.vx *= -0.55; else n.x += n.vx * dt;
    if (solidPx(n.x, n.y + n.vy * dt)) n.vy *= -0.55; else n.y += n.vy * dt;
    if ((n.t -= dt) <= 0) explode(n.x, n.y);
  }
  room.nades = room.nades.filter(n => n.t > 0);
}
function explode(x, y) {
  const R = 125, p = room.p;
  for (const e of [...room.enemies]) {
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < R && los(x, y, e.x, e.y)) hurtEnemy(e, 170 * (1 - d / R) + 20, Math.atan2(e.y - y, e.x - x));
  }
  const dp = Math.hypot(p.x - x, p.y - y);
  if (dp < R && los(x, y, p.x, p.y)) hurtPlayer((170 * (1 - dp / R) + 20) * 0.6);
  for (const l of room.lamps) if (l.on && Math.hypot(l.x - x, l.y - y) < R) l.on = false;
  noise(x, y, 800, 'boom');
  flash(x, y, 280, 0.35);
  sparks(x, y, 30);
  room.decals.push({ x, y, r: 30, scorch: true });
  cam.shake = 16; buzz(90);
  sfx('boom', x, y);
}

// ================= Efectos =================
function flash(x, y, r, t) { room.flashes.push({ x, y, r, t, max: t, poly: visPoly(x, y, 0, Math.PI, r, 28) }); }
function popup(x, y, text, color) { room.texts.push({ x, y, text, color, t: 1.3 }); }
function sparks(x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, s = rnd(60, 260); room.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rnd(0.15, 0.4), c: '#ffd98a', s: 2 }); } }
function blood(x, y, a, n) {
  for (let i = 0; i < n; i++) { const b = a + rnd(-0.7, 0.7), s = rnd(40, 200); room.parts.push({ x, y, vx: Math.cos(b) * s, vy: Math.sin(b) * s, t: rnd(0.2, 0.5), c: '#8e1f1f', s: 3 }); }
  if (room.decals.length < 220) room.decals.push({ x: x + Math.cos(a) * rnd(6, 20), y: y + Math.sin(a) * rnd(6, 20), r: rnd(3, 7) });
}
function updateFx(dt) {
  for (const q of room.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.9; q.vy *= 0.9; q.t -= dt; }
  room.parts = room.parts.filter(q => q.t > 0);
  for (const r of room.rings) r.t += dt;
  room.rings = room.rings.filter(r => r.t < 0.7);
  for (const t of room.texts) { t.t -= dt; t.y -= 18 * dt; }
  room.texts = room.texts.filter(t => t.t > 0);
  for (const f of room.flashes) f.t -= dt;
  room.flashes = room.flashes.filter(f => f.t > 0);
  cam.shake *= Math.exp(-9 * dt);
}

// ================= Bucle =================
function update(dt) {
  const p = room.p;
  room.time += dt;
  if (p.dead) { if ((room.deathT -= dt) <= 0) gameOver(); }
  else updatePlayer(dt);
  room.exposure = exposure();
  for (const e of [...room.enemies]) updateEnemy(e, dt);
  const all = [...room.enemies, p];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
    if (d > 0 && d < m) { const k = (m - d) / d / 2; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; }
  }
  for (const o of all) collide(o);
  updateBullets(dt);
  updateNades(dt);
  updateFx(dt);
  const look = sticks.R || mouse.active ? 70 : 40;
  const k = Math.min(1, dt * 6);
  cam.x += (p.x + Math.cos(p.a) * look - cam.x) * k;
  cam.y += (p.y + Math.sin(p.a) * look - cam.y) * k;
  for (const it of room.items) if (!p.dead && !ammoFull() && dist(p, it) < 24) {
    it.got = true; addAmmo(0.25);
    popup(it.x, it.y - 16, '+MUNICIÓN', '#ffd98a'); sfx('reload');
  }
  room.items = room.items.filter(it => !it.got);
  if (!p.dead && dist(p, room.exit) < 26) completeRoom();
}

// ================= Render =================
function fillPoly(c, pts) {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath(); c.fill();
}
function glow(c, x, y, r, rgba0) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba0); g.addColorStop(0.65, rgba0.replace(/[\d.]+\)$/, m => parseFloat(m) * 0.7 + ')')); g.addColorStop(1, 'rgba(0,0,0,0)');
  return g;
}
function render() {
  const S = zoom * dpr, p = room.p;
  const cx = cam.x + rnd(-cam.shake, cam.shake), cy = cam.y + rnd(-cam.shake, cam.shake);
  const ox = cw / 2 - cx * S, oy = ch / 2 - cy * S;
  const hw = cw / 2 / S, hh = ch / 2 / S;
  const x0 = Math.max(0, Math.floor((cx - hw) / T)), x1 = Math.min(W - 1, Math.floor((cx + hw) / T));
  const y0 = Math.max(0, Math.floor((cy - hh) / T)), y1 = Math.min(H - 1, Math.floor((cy + hh) / T));
  const onScreen = (x, y, m) => Math.abs(x - cx) < hw + m && Math.abs(y - cy) < hh + m;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, cw, ch);
  ctx.setTransform(S, 0, 0, S, ox, oy);
  // suelo
  ctx.fillStyle = '#151b23'; ctx.fillRect(0, 0, W * T, H * T);
  ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = x0; x <= x1 + 1; x++) { ctx.moveTo(x * T, y0 * T); ctx.lineTo(x * T, (y1 + 1) * T); }
  for (let y = y0; y <= y1 + 1; y++) { ctx.moveTo(x0 * T, y * T); ctx.lineTo((x1 + 1) * T, y * T); }
  ctx.stroke();
  for (const d of room.decals) { ctx.fillStyle = d.scorch ? 'rgba(0,0,0,0.5)' : 'rgba(110,20,20,0.75)'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); }
  // cuerpos
  for (const b of room.bodies) {
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
    ctx.fillStyle = '#3a1716'; ctx.beginPath(); ctx.ellipse(4, 0, FOES[b.type].r + 3, FOES[b.type].r - 3, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  for (const it of room.items) { ctx.fillStyle = '#5d5b2c'; ctx.fillRect(it.x - 8, it.y - 6, 16, 12); ctx.fillStyle = '#ffd98a'; ctx.fillRect(it.x - 8, it.y - 1, 16, 2); }
  // granadas
  for (const n of room.nades) { ctx.fillStyle = '#4b5a3a'; ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, 7); ctx.fill(); }
  // enemigos
  for (const e of room.enemies) {
    if (!onScreen(e.x, e.y, 30)) continue;
    const F = FOES[e.type];
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a);
    ctx.fillStyle = '#222'; ctx.fillRect(e.r - 4, -2.5, 14, 5);
    ctx.fillStyle = F.color; ctx.strokeStyle = '#1a0d0c'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, e.r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(-3, 0, e.r * 0.5, 0, 7); ctx.fill();
    if (e.type === 'elite') { ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, e.r - 4, -1, 1); ctx.stroke(); }
    ctx.restore();
  }
  // jugador
  if (!p.dead) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
    ctx.fillStyle = '#20262e'; ctx.fillRect(8, -3, 16, 6);
    ctx.fillStyle = p.hurtT > 0 ? '#ff8f80' : '#62d6ad'; ctx.strokeStyle = '#0b2a22'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(-3, 0, 6, 0, 7); ctx.fill();
    if (p.swingT > 0) {
      ctx.strokeStyle = `rgba(230,240,255,${p.swingT / 0.18})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 30, -1 + (1 - p.swingT / 0.18) * 1.2, 0.4 + (1 - p.swingT / 0.18) * 1.2); ctx.stroke();
    }
    ctx.restore();
  }
  // muros y cajas
  ctx.fillStyle = '#273140'; ctx.beginPath();
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (map[y * W + x] === 1) ctx.rect(x * T, y * T, T, T);
  ctx.fill();
  ctx.fillStyle = '#323e50'; ctx.beginPath();
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (map[y * W + x] === 1) ctx.rect(x * T + 3, y * T + 3, T - 6, T - 6);
  ctx.fill();
  ctx.fillStyle = '#4a3b2a'; ctx.strokeStyle = '#2c2218'; ctx.lineWidth = 2;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (map[y * W + x] === 2) {
    ctx.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
    ctx.beginPath(); ctx.rect(x * T + 5, y * T + 5, T - 10, T - 10); ctx.moveTo(x * T + 5, y * T + 5); ctx.lineTo(x * T + T - 5, y * T + T - 5); ctx.stroke();
  }
  // balas
  ctx.lineCap = 'round';
  for (const b of room.bullets) {
    ctx.strokeStyle = b.mine ? (b.bolt ? '#c9d6e3' : '#ffe9b0') : '#ff9a7a'; ctx.lineWidth = b.bolt ? 2.5 : 2;
    ctx.beginPath(); ctx.moveTo(b.x - b.vx * 0.018, b.y - b.vy * 0.018); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (const q of room.parts) { ctx.fillStyle = q.c; ctx.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s); }

  // ---- Oscuridad: se recortan los polígonos de luz ----
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.globalCompositeOperation = 'source-over';
  lctx.fillStyle = '#000'; lctx.fillRect(0, 0, cw, ch);
  lctx.setTransform(S, 0, 0, S, ox, oy);
  lctx.globalCompositeOperation = 'destination-out';
  const tints = [];
  if (!p.dead) {
    if (run.light) {
      const cone = visPoly(p.x, p.y, p.a, 0.62, 340, 90);
      lctx.fillStyle = glow(lctx, p.x, p.y, 340, 'rgba(0,0,0,1)'); fillPoly(lctx, cone);
      tints.push([cone, p.x, p.y, 340, 'rgba(255,217,138,0.08)']);
    }
    const amb = run.light ? 75 : 120;
    lctx.fillStyle = glow(lctx, p.x, p.y, amb, `rgba(0,0,0,${run.light ? 0.9 : 0.6})`);
    fillPoly(lctx, visPoly(p.x, p.y, 0, Math.PI, amb, 36));
  }
  for (const l of room.lamps) if (l.on && onScreen(l.x, l.y, l.r)) {
    lctx.fillStyle = glow(lctx, l.x, l.y, l.r, 'rgba(0,0,0,0.75)'); fillPoly(lctx, l.poly);
    tints.push([l.poly, l.x, l.y, l.r, 'rgba(255,200,120,0.06)']);
  }
  for (const e of room.enemies) {
    const rr = FOES[e.type].vision * 0.9;
    if (!onScreen(e.x, e.y, rr)) continue;
    const cone = visPoly(e.x, e.y, e.a, 0.55, rr, 30);
    lctx.fillStyle = glow(lctx, e.x, e.y, rr, 'rgba(0,0,0,0.5)'); fillPoly(lctx, cone);
    tints.push([cone, e.x, e.y, rr, `rgba(${LIGHT[e.state]},${e.state === 'combat' ? 0.16 : 0.1})`]);
  }
  for (const f of room.flashes) { lctx.fillStyle = glow(lctx, f.x, f.y, f.r, `rgba(0,0,0,${f.t / f.max})`); fillPoly(lctx, f.poly); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.95; ctx.drawImage(lightCv, 0, 0); ctx.globalAlpha = 1;
  ctx.setTransform(S, 0, 0, S, ox, oy);
  ctx.globalCompositeOperation = 'lighter';
  for (const [poly, x, y, r, c] of tints) { ctx.fillStyle = glow(ctx, x, y, r, c); fillPoly(ctx, poly); }
  ctx.globalCompositeOperation = 'source-over';

  // ---- Lo que brilla por encima de la oscuridad ----
  const pulse = 0.6 + 0.4 * Math.sin(room.time * 4);
  ctx.fillStyle = `rgba(70,230,140,${0.18 + 0.12 * pulse})`; ctx.fillRect(room.exit.x - 18, room.exit.y - 18, 36, 36);
  ctx.strokeStyle = '#46e68c'; ctx.lineWidth = 2; ctx.strokeRect(room.exit.x - 18, room.exit.y - 18, 36, 36);
  ctx.fillStyle = '#46e68c'; ctx.font = '700 10px "Saira Semi Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('SALIDA', room.exit.x, room.exit.y);
  for (const l of room.lamps) if (l.on) { ctx.fillStyle = '#fff3d6'; ctx.beginPath(); ctx.arc(l.x, l.y, 5, 0, 7); ctx.fill(); }
  for (const n of room.nades) if (Math.sin(n.t * (n.t < 0.6 ? 40 : 14)) > 0) { ctx.fillStyle = '#ff5444'; ctx.beginPath(); ctx.arc(n.x, n.y, 2.5, 0, 7); ctx.fill(); }
  const s = wstats(curW());
  if (s.laser && !p.dead) {
    const d = castRay(p.x, p.y, Math.cos(p.a), Math.sin(p.a), 600);
    ctx.strokeStyle = 'rgba(255,60,60,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.x + Math.cos(p.a) * 22, p.y + Math.sin(p.a) * 22); ctx.lineTo(p.x + Math.cos(p.a) * d, p.y + Math.sin(p.a) * d); ctx.stroke();
  }
  for (const r of room.rings) { // el ruido se ve: así sabes cuánto has hecho
    const k = r.t / 0.7;
    ctx.strokeStyle = r.kind === 'alert' || r.kind === 'eshot' ? `rgba(255,84,68,${0.5 * (1 - k)})` : `rgba(200,225,255,${0.45 * (1 - k)})`;
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (0.25 + 0.75 * k), 0, 7); ctx.stroke();
  }
  ctx.font = '700 18px "Saira Semi Condensed", sans-serif';
  for (const e of room.enemies) {
    if (e.state === 'patrol' && e.aware < 0.05) continue;
    const yy = e.y - e.r - 14;
    if (e.state === 'combat') { ctx.fillStyle = '#ff5444'; ctx.fillText('!', e.x, yy); continue; }
    ctx.strokeStyle = 'rgba(255,181,71,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, yy, 9, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#ffb547'; ctx.beginPath(); ctx.arc(e.x, yy, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(e.aware, e.state === 'patrol' ? 0 : 0.35)); ctx.stroke();
    ctx.fillStyle = '#ffb547'; ctx.font = '700 12px "Saira Semi Condensed", sans-serif'; ctx.fillText('?', e.x, yy + 1);
    ctx.font = '700 18px "Saira Semi Condensed", sans-serif';
  }
  ctx.font = '700 13px "Saira Semi Condensed", sans-serif';
  for (const t of room.texts) { ctx.globalAlpha = Math.min(1, t.t * 2); ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y); }
  ctx.globalAlpha = 1;
  drawHud();
}

function drawHud() {
  const p = room.p;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (p.hurtT > 0 || run.hp < 30) {
    const a = Math.max(p.hurtT / 0.35 * 0.5, run.hp < 30 ? 0.2 + 0.1 * Math.sin(room.time * 5) : 0);
    const g = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.3, vw / 2, vh / 2, Math.max(vw, vh) * 0.7);
    g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(200,20,20,${a})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
  }
  if (touchMode) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    drawStick(sticks.L, 70 + inset.l, vh - 80 - inset.b, false);
    drawStick(sticks.R, vw / 2 + (vw / 2 - 150 - inset.r) / 2, vh - 80 - inset.b, true);
    if (sticks.L && (p.speed > 8)) {
      ctx.font = '600 11px "Saira Semi Condensed", sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = p.sneak ? '#62d6ad' : '#ffb547';
      ctx.fillText(p.sneak ? 'SIGILO' : 'CORRIENDO', sticks.L.ox, sticks.L.oy - STICK_R - 18);
    }
    if (run.level === 1 && room.time < 14) {
      ctx.font = '600 12px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = 'rgba(217,226,236,0.6)';
      ctx.fillText('MOVER · suave = sigilo', 70 + inset.l, vh - 80 - inset.b - STICK_R - 16);
      ctx.fillText('APUNTAR · al borde dispara', vw / 2 + (vw / 2 - 150 - inset.r) / 2, vh - 80 - inset.b - STICK_R - 16);
    }
  }
  // el resto del HUD crece en pantallas grandes (PC)
  ctx.setTransform(dpr * ui, 0, 0, dpr * ui, 0, 0);
  const uw = vw / ui, uh = vh / ui, x = 14 + inset.l / ui, y = 12 + inset.t / ui, bw = Math.min(150, uw / 2 - 80);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(14,19,26,0.6)'; ctx.fillRect(x, y + 14, bw, 9);
  ctx.fillStyle = run.hp < 30 ? '#ff5444' : '#62d6ad'; ctx.fillRect(x, y + 14, bw * run.hp / run.maxHp, 9);
  ctx.font = '600 11px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#7d8ca0';
  ctx.fillText(`VIDA ${Math.ceil(run.hp)}`, x, y);
  ctx.font = '700 18px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#ffd98a';
  ctx.fillText(`$${run.money}`, x, y + 28);
  // medidor de visibilidad (cuánto te expones)
  ctx.font = '600 11px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#7d8ca0';
  ctx.fillText('VISIBILIDAD', x, y + 52);
  const vis = clamp(room.exposure / 2.2, 0, 1);
  ctx.fillStyle = 'rgba(14,19,26,0.6)'; ctx.fillRect(x, y + 66, 90, 6);
  ctx.fillStyle = vis < 0.3 ? '#62d6ad' : vis < 0.6 ? '#ffb547' : '#ff5444'; ctx.fillRect(x, y + 66, 90 * vis, 6);

  let worst = 0;
  for (const e of room.enemies) worst = Math.max(worst, e.state === 'combat' ? 2 : e.state === 'patrol' ? 0 : 1);
  const label = ['OCULTO', 'ALERTA', 'DETECTADO'][worst], col = ['#62d6ad', '#ffb547', '#ff5444'][worst];
  ctx.textAlign = 'center';
  ctx.font = '600 11px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#7d8ca0';
  ctx.fillText(`SALA ${run.level} · ${room.enemies.length} HOSTILES`, uw / 2, y);
  ctx.font = '700 16px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = col;
  ctx.fillText(label, uw / 2, y + 14);

  if (!touchMode && run.level === 1 && room.time < 16) {
    ctx.font = '600 13px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = 'rgba(217,226,236,0.6)';
    ctx.fillText('WASD mover · Mayús sigilo · ratón apunta y dispara · E cuchillo · G granada · Q ruido · F linterna · R recargar · 1-5 / rueda arma', uw / 2, uh - 86);
  }
  syncHud();
}
function drawStick(s, gx, gy, aim) {
  const ox = s ? s.ox : gx, oy = s ? s.oy : gy;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = s ? 'rgba(217,226,236,0.35)' : 'rgba(217,226,236,0.12)';
  ctx.beginPath(); ctx.arc(ox, oy, STICK_R, 0, 7); ctx.stroke();
  ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(ox, oy, STICK_R * (0.12 + 0.88 * (aim ? FIRE : SNEAK)), 0, 7); ctx.stroke(); ctx.setLineDash([]);
  if (!s) return;
  const v = stickVec(s);
  ctx.fillStyle = aim && v.m > FIRE ? 'rgba(255,84,68,0.7)' : 'rgba(217,226,236,0.45)';
  ctx.beginPath(); ctx.arc(ox + v.x * STICK_R, oy + v.y * STICK_R, 22, 0, 7); ctx.fill();
}
let hudKey = '';
function syncHud() {
  const p = room.p, w = curW(), s = wstats(w);
  const key = `${s.name}|${w.ammo}|${w.reserve}|${run.nades}|${run.light}|${p.reloadT > 0}|${touchMode}|${run.weapons.length}`;
  if (p.reloadT > 0) $('bWeapon').style.setProperty('--p', `${100 * (1 - p.reloadT / s.reload)}%`);
  if (key === hudKey) return;
  hudKey = key;
  $('wName').textContent = (s.name + (run.weapons.length > 1 ? ' ⇄' : '')).toUpperCase();
  $('wAmmo').textContent = p.reloadT > 0 ? 'RECARGANDO' : w.ammo || w.reserve ? `${w.ammo} / ${w.reserve}` : 'SIN MUNICIÓN';
  $('acts').hidden = !touchMode;
  if (p.reloadT <= 0) $('bWeapon').style.setProperty('--p', '0%');
  $('nadeN').textContent = run.nades;
  $('bNade').classList.toggle('off', !run.nades);
  $('bLight').classList.toggle('off', !run.light);
}

// ================= Tienda =================
let shopTab = 'arm', modSel = 0;
const noiseLabel = n => n < 120 ? 'mínimo' : n < 300 ? 'bajo' : n < 500 ? 'medio' : 'alto';
function item(name, info, act, label, disabled, own) {
  return `<div class="item"><div class="info"><b>${name}</b><span>${info}</span></div><button data-act="${act}" ${disabled ? 'disabled' : ''} class="${own ? 'own' : ''}">${label}</button></div>`;
}
function renderShop() {
  $('shopCash').textContent = `$${run.money}`;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === shopTab));
  let html = '';
  if (shopTab === 'arm') {
    for (const id in WEAPONS) {
      const s = WEAPONS[id], i = run.weapons.findIndex(w => w.id === id);
      const info = `Daño ${s.dmg}${s.pellets > 1 ? '×' + s.pellets : ''} · ${s.rate}/s · ${s.mag} bal. · ruido ${noiseLabel(s.noise)}`;
      if (i < 0) html += item(s.name, `${info} · reserva máx. ${s.reserve}`, `buyW:${id}`, `$${s.price}`, run.money < s.price);
      else html += item(s.name, `${info} · reserva ${run.weapons[i].reserve}/${s.reserve}`, `equip:${i}`, i === run.cur ? 'En mano' : 'Equipar', i === run.cur, true);
    }
  } else if (shopTab === 'mod') {
    modSel = Math.min(modSel, run.weapons.length - 1);
    const w = run.weapons[modSel];
    html += `<div class="chips">${run.weapons.map((x, i) => `<button data-act="sel:${i}" class="${i === modSel ? 'on' : ''}">${WEAPONS[x.id].name}</button>`).join('')}</div>`;
    const s = wstats(w);
    html += `<span style="font-size:13px;color:var(--dim)">Ahora: daño ${Math.round(s.dmg)} · ${s.rate.toFixed(1)}/s · ${s.mag} bal. · ruido ${noiseLabel(s.noise)}</span>`;
    for (const id in MODS) {
      const m = MODS[id], has = w.mods.includes(id);
      html += item(m.name, m.desc, `mod:${id}`, has ? 'Instalada' : `$${m.price}`, has || run.money < m.price, has);
    }
  } else {
    html += item('Caja de munición', `+50 % de reserva en todas tus armas${ammoFull() ? ' (ya están llenas)' : ''}`, 'ammo', '$45', run.money < 45 || ammoFull());
    html += item('Granada', `Radio enorme, ruido enorme. Tienes ${run.nades} (máx. 5)`, 'nade', '$60', run.money < 60 || run.nades >= 5);
    html += item('Botiquín', `+40 de vida (${Math.ceil(run.hp)}/${run.maxHp})`, 'med', '$50', run.money < 50 || run.hp >= run.maxHp);
    html += item('Placas de blindaje', '+25 de vida máxima (tope 200)', 'maxhp', '$220', run.money < 220 || run.maxHp >= 200);
  }
  $('shopList').innerHTML = html;
  $('bNext').textContent = `Entrar en la sala ${run.level}`;
}
function shopAct(act) {
  const [k, v] = act.split(':');
  const pay = n => { run.money -= n; sfx('buy'); };
  if (k === 'buyW') { pay(WEAPONS[v].price); run.weapons.push({ id: v, mods: [], ammo: WEAPONS[v].mag, reserve: Math.ceil(WEAPONS[v].reserve / 2) }); run.cur = run.weapons.length - 1; }
  else if (k === 'equip') run.cur = +v;
  else if (k === 'sel') modSel = +v;
  else if (k === 'mod') { pay(MODS[v].price); run.weapons[modSel].mods.push(v); }
  else if (k === 'ammo') { pay(45); addAmmo(0.5); }
  else if (k === 'nade') { pay(60); run.nades++; }
  else if (k === 'med') { pay(50); run.hp = Math.min(run.maxHp, run.hp + 40); }
  else if (k === 'maxhp') { pay(220); run.maxHp += 25; run.hp += 25; }
  renderShop();
  save();
}

// ================= Audio (sintetizado, sin archivos) =================
let ac = null, noiseBuf = null, master = null;
function initAudio() {
  if (ac) { ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.45; master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ac = null; }
}
function burst(dur, vol, freq, type = 'lowpass', q = 0.8) {
  const t = ac.currentTime, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf; src.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(master); src.start(t, Math.random() * 0.5); src.stop(t + dur);
}
function tone(f0, f1, dur, vol, type = 'square', delay = 0) {
  const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur);
}
function sfx(k, x, y) {
  if (!ac || ac.state !== 'running') return;
  const v = x === undefined ? 1 : clamp(1 - Math.hypot(x - room.p.x, y - room.p.y) / 900, 0.05, 1);
  switch (k) {
    case 'shot': burst(0.18, 0.7, 1800); tone(160, 50, 0.12, 0.3); break;
    case 'sil': burst(0.07, 0.3, 3200, 'bandpass', 1.5); break;
    case 'shotgun': burst(0.35, 0.9, 1100); tone(120, 40, 0.2, 0.4); break;
    case 'bolt': tone(900, 300, 0.08, 0.12, 'triangle'); burst(0.05, 0.2, 5000, 'highpass'); break;
    case 'eshot': burst(0.16, 0.5 * v, 1400); break;
    case 'knife': burst(0.12, 0.3, 6000, 'highpass'); break;
    case 'boom': burst(1.0, v, 380); tone(90, 30, 0.6, 0.6 * v, 'sine'); break;
    case 'step': burst(0.04, 0.1, 600); break;
    case 'whistle': tone(1400, 2100, 0.14, 0.15, 'sine'); tone(1500, 2300, 0.22, 0.15, 'sine', 0.17); break;
    case 'alert': tone(700, 1100, 0.15, 0.18 * v); break;
    case 'hit': tone(200, 60, 0.15, 0.35, 'sawtooth'); break;
    case 'reload': burst(0.05, 0.25, 2500, 'bandpass', 3); break;
    case 'empty': tone(1200, 1100, 0.03, 0.1); break;
    case 'glass': burst(0.25, 0.4 * v, 7000, 'highpass'); break;
    case 'buy': tone(660, 990, 0.12, 0.15, 'triangle'); break;
    case 'throw': burst(0.1, 0.2, 1200, 'bandpass'); break;
    case 'gore': burst(0.12, 0.3 * v, 400); break;
  }
}

// ================= Entrada =================
function show(id) {
  for (const o of ['menu', 'shop', 'pause', 'over']) $(o).hidden = o !== id;
  $('hud').hidden = id !== null;
}
function resize() {
  vw = innerWidth; vh = innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(5e6 / (vw * vh))); // tope de píxeles en monitores grandes
  cw = cv.width = lightCv.width = Math.round(vw * dpr);
  ch = cv.height = lightCv.height = Math.round(vh * dpr);
  // móvil: zoom por el lado corto; monitores grandes: se ven unos 720 px de mundo en vertical
  zoom = Math.max(clamp(Math.min(vw, vh) / 430, 0.62, 1.5), Math.min(vw, vh) / 720);
  ui = Math.max(1, Math.min(vw, vh) / 720);
  document.documentElement.style.setProperty('--hud', ui);
  const cs = getComputedStyle($('safe'));
  inset = { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
}
addEventListener('resize', resize);
resize();

cv.addEventListener('pointerdown', e => {
  if (state !== 'play') return;
  if (e.pointerType === 'mouse') {
    touchMode = false; mouse.active = true; mouse.x = e.clientX; mouse.y = e.clientY;
    if (e.button === 2) melee(); else mouse.down = true;
    return;
  }
  touchMode = true;
  const side = e.clientX < vw / 2 ? 'L' : 'R';
  if (!sticks[side]) sticks[side] = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
});
addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; if (state === 'play') { mouse.active = true; touchMode = false; } return; }
  for (const k in sticks) {
    const s = sticks[k];
    if (!s || s.id !== e.pointerId) continue;
    s.x = e.clientX; s.y = e.clientY;
    const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), m = STICK_R * 1.1;
    if (d > m) { s.ox = s.x - dx / d * m; s.oy = s.y - dy / d * m; } // la base sigue al dedo
  }
});
const release = e => {
  if (e.pointerType === 'mouse') mouse.down = false;
  for (const k in sticks) if (sticks[k] && sticks[k].id === e.pointerId) sticks[k] = null;
};
addEventListener('pointerup', release);
addEventListener('pointercancel', release);
cv.addEventListener('contextmenu', e => e.preventDefault());

const press = (id, fn) => $(id).addEventListener('pointerdown', e => {
  e.preventDefault(); e.stopPropagation();
  if (state !== 'play') return;
  fn();
  const b = $(id); b.classList.add('press'); setTimeout(() => b.classList.remove('press'), 120);
});
press('bKnife', melee);
press('bNade', throwNade);
press('bNoise', makeNoise);
press('bReload', reload);
press('bLight', toggleLight);
press('bWeapon', cycleWeapon);
$('bPause').addEventListener('click', () => pause());

function pause() {
  if (state !== 'play') return;
  state = 'pause';
  $('pauseInfo').textContent = `Sala ${run.level} · $${run.money} · vida ${Math.ceil(run.hp)}`;
  show('pause');
}
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Tab') e.preventDefault();
  if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play') pause(); else if (state === 'pause') { state = 'play'; show(null); } }
  if (state !== 'play' || e.repeat) return;
  const act = { KeyE: melee, KeyG: throwNade, KeyQ: makeNoise, KeyR: reload, KeyF: toggleLight, Tab: cycleWeapon }[e.code];
  if (act) act();
  else if (/^Digit[1-5]$/.test(e.code) && run.weapons[e.code[5] - 1]) selectWeapon(e.code[5] - 1);
});
let wheelT = 0;
addEventListener('wheel', e => {
  if (state !== 'play' || e.timeStamp - wheelT < 250) return; // los touchpads disparan muchos eventos por gesto
  wheelT = e.timeStamp;
  selectWeapon(run.cur + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.down = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

function begin() {
  initAudio();
  try { document.documentElement.requestFullscreen?.().catch(() => {}); screen.orientation?.lock?.('landscape').catch(() => {}); } catch (e) { /* opcional */ }
}
$('bPlay').addEventListener('click', () => {
  const b = $('bPlay');
  if (loadSave() && !b.dataset.sure) { b.dataset.sure = '1'; b.textContent = '¿Borrar la partida guardada?'; return; }
  begin(); newRun(); startRoom();
});
$('bCont').addEventListener('click', () => {
  const d = loadSave();
  if (!d) { refreshMenu(); return; }
  begin();
  run = { ...d.run, snap: null };
  if (d.shop) openShop('Partida guardada. Prepárate para la siguiente sala.'); else startRoom();
});
refreshMenu();
$('bResume').addEventListener('click', () => { state = 'play'; show(null); });
$('bRestart').addEventListener('click', retryRoom);
$('bQuit').addEventListener('click', () => { state = 'menu'; room = null; refreshMenu(); show('menu'); });
$('bRetry').addEventListener('click', () => { initAudio(); retryRoom(); });
$('bNew').addEventListener('click', () => { initAudio(); newRun(); startRoom(); });
$('bNext').addEventListener('click', () => { initAudio(); startRoom(); });
document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { shopTab = b.dataset.tab; modSel = run.cur; renderShop(); } });
$('shopList').addEventListener('click', e => { const b = e.target.closest('button[data-act]'); if (b && !b.disabled) shopAct(b.dataset.act); });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (state === 'play') update(dt);
  if (room) render();
  else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#07090d'; ctx.fillRect(0, 0, cw, ch); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Gancho para las pruebas automáticas (test/smoke.js)
window.__apagon = { get run() { return run; }, get room() { return room; }, get state() { return state; }, buildRoom, castRay, bfs, findPath, cellOf, noise, hurtPlayer };
})();
