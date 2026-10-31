'use strict';
(() => {
// ================= Datos =================
const T = 40; // tamaño de casilla en px de mundo
const STICK_R = 56, SNEAK = 0.55, FIRE = 0.8;
let LS = 0.5; // escala de la máscara de oscuridad: más fina en PC
const BEAM = 270, HALO_ON = 58, HALO_OFF = 92, LAMP_R = 125; // alcance de la luz (px de mundo)
const CONE = { patrol: '150,195,255', suspicious: '255,181,71', investigate: '255,181,71', search: '255,181,71', combat: '255,84,68' };

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
  // perro: te huele de cerca aunque vayas a oscuras, oye el doble y muerde
  dog:    { hp: 45,  walk: 70, run: 205, dmg: 14, rate: 1.4, spread: 0,    pellets: 0, vision: 160, reward: 25, r: 10, color: '#8a6a4a', melee: true, nose: 95, ears: 2 },
  // francotirador: no deja su puesto, cono largo y estrecho, apunta un segundo antes del tiro
  sniper: { hp: 70,  walk: 45, run: 100, dmg: 45, rate: 0.35, spread: 0,   pellets: 1, vision: 430, reward: 55, r: 13, color: '#6f7f4a', post: true, half: 0.3 },
  // escudo: para las balas de frente y gira despacio: hay que rodearlo
  shield: { hp: 120, walk: 42, run: 90,  dmg: 8,  rate: 1.4, spread: 0.12, pellets: 1, vision: 230, reward: 60, r: 15, color: '#5a6f8f', shield: true },
  boss:   { hp: 1400, walk: 50, run: 110, dmg: 7, rate: 1,   spread: 0.2,  pellets: 1, vision: 380, reward: 1000, r: 24, color: '#7a2e2e', boss: true },
};
const BOSS_EVERY = 8; // sala del jefe; después sigue el modo infinito con un jefe más duro cada 8 salas
function pickFoe(level, roll) {
  const pool = ['guard', 'guard', 'guard', ...(level >= 2 ? ['dog', 'heavy'] : []), ...(level >= 3 ? ['shield', 'sniper'] : []), ...(level >= 4 ? ['elite'] : [])];
  return pool[Math.floor(roll * pool.length)];
}
// Casillas: suelo, muro, caja, mesa/coche (bajo), estantería, ventana, seto, árbol/planta, escalera,
// vacío (fuera de la primera planta), contenedor y barrera de hormigón (cubre de las balas, no de la vista)
const FLOOR = 0, WALL = 1, CRATE = 2, LOW = 3, SHELF = 4, GLASS = 5, BUSH = 6, TREE = 7, STAIRS = 8, VOID = 9, METAL = 10, BARRIER = 11;
const BLOCK_WALK  = [0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1];
const BLOCK_SIGHT = [0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0];
const BLOCK_SHOT  = [0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1];
const DIR4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR8 = [...DIR4, [1, 1], [1, -1], [-1, 1], [-1, -1]];

// ================= Utilidades =================
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random() * (b - a);
const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function angDiff(a, b) { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
function hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function mulberry32(a) { return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const $ = id => document.getElementById(id);
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* sin vibración */ } };

// ================= Estado =================
const cv = $('c'), ctx = cv.getContext('2d');
const lightCv = document.createElement('canvas'), lctx = lightCv.getContext('2d');
const fogCv = document.createElement('canvas');
fogCv.width = fogCv.height = 256;
{ // manchas que tragan luz, repetidas en los bordes para que la textura no tenga costuras
  const f = fogCv.getContext('2d');
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = rnd(35, 95);
    for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) {
      const g = f.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      g.addColorStop(0, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      f.fillStyle = g; f.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
}
let fogPat = null;
let dpr = 1, vw = 0, vh = 0, cw = 0, ch = 0, zoom = 1, ui = 1;
let inset = { t: 0, r: 0, b: 0, l: 0 };
let W = 0, H = 0, map = null, zone = null; // zone: 1 = interior
// Plantas: maps[0] baja, maps[1] primera (si hay). Las funciones de mapa leen `map`, que apunta a la planta en uso
let maps = [], fks = [], curZ = 0;
function useFloor(z) { curZ = z; map = maps[z]; }
let run = null, room = null, state = 'menu';
const cam = { x: 0, y: 0, shake: 0 };
const keys = {}, mouse = { x: 0, y: 0, down: false, active: false };
const sticks = { L: null, R: null };
let touchMode = matchMedia('(pointer: coarse)').matches;

// ================= Mapa =================
const border = (tx, ty) => tx <= 0 || ty <= 0 || tx >= W - 1 || ty >= H - 1;
const solid = (tx, ty) => tx < 0 || ty < 0 || tx >= W || ty >= H || BLOCK_WALK[map[ty * W + tx]] === 1;
const opaque = (tx, ty) => tx < 0 || ty < 0 || tx >= W || ty >= H || BLOCK_SIGHT[map[ty * W + tx]] === 1;
const solidPx = (x, y) => solid(Math.floor(x / T), Math.floor(y / T));
const center = c => ({ x: (c % W) * T + T / 2, y: ((c / W) | 0) * T + T / 2 });
const cellOf = (x, y) => clamp(Math.floor(y / T), 0, H - 1) * W + clamp(Math.floor(x / T), 0, W - 1);

// DDA sobre la rejilla: distancia hasta la primera pared (o max)
function castRay(x, y, dx, dy, max, blocks = opaque) {
  let mx = Math.floor(x / T), my = Math.floor(y / T);
  const sx = dx < 0 ? -1 : 1, sy = dy < 0 ? -1 : 1;
  const ddx = dx ? Math.abs(T / dx) : Infinity, ddy = dy ? Math.abs(T / dy) : Infinity;
  let tx = dx ? (dx > 0 ? (mx + 1) * T - x : x - mx * T) / Math.abs(dx) : Infinity;
  let ty = dy ? (dy > 0 ? (my + 1) * T - y : y - my * T) / Math.abs(dy) : Infinity;
  for (;;) {
    let t;
    if (tx < ty) { t = tx; tx += ddx; mx += sx; } else { t = ty; ty += ddy; my += sy; }
    if (t >= max) return max;
    if (blocks(mx, my)) return t;
  }
}
function los(ax, ay, bx, by, blocks) {
  const d = Math.hypot(bx - ax, by - ay);
  return d < 1 || castRay(ax, ay, (bx - ax) / d, (by - ay) / d, d, blocks) >= d - 0.5;
}
function clearWalk(ax, ay, bx, by, r) {
  const d = Math.hypot(bx - ax, by - ay);
  if (d < 1) return true;
  const nx = -(by - ay) / d * r * 0.9, ny = (bx - ax) / d * r * 0.9;
  return los(ax, ay, bx, by, solid) && los(ax + nx, ay + ny, bx + nx, by + ny, solid) && los(ax - nx, ay - ny, bx - nx, by - ny, solid);
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
  if (BLOCK_WALK[map[g]]) { // destino dentro de una pared: busca la casilla libre más cercana
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

// Rejilla nueva (planta baja); el borde del mapa es la valla exterior y no se puede romper
function newMap(z, fk) {
  maps = [new Uint8Array(W * H)]; fks = [new Uint8Array(W * H).fill(fk)]; zone = new Uint8Array(W * H).fill(z);
  useFloor(0);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (border(x, y)) map[y * W + x] = WALL;
}
// Puerta de 2 casillas, despejando ambos lados (un muro hijo podría taparla)
function carveDoor(dx, dy, v) { for (let k = 0; k < 2; k++) for (let o = -1; o <= 1; o++) map[(v ? dy + k : dy + o) * W + (v ? dx + o : dx + k)] = FLOOR; }
// Partición binaria: cada corte es un muro con una puerta, así todo queda conectado
function splitRooms(x0, y0, x1, y1, leaves, doors, rand, ri) {
  const w = x1 - x0 + 1, h = y1 - y0 + 1, canV = w >= 11, canH = h >= 9;
  if ((!canV && !canH) || (w * h < 90 && rand() < 0.35)) { leaves.push({ x0, y0, x1, y1 }); return; }
  if (canV && (!canH || rand() < w / (w + h))) {
    const sx = x0 + 4 + ri(w - 8);
    for (let y = y0; y <= y1; y++) map[y * W + sx] = WALL;
    doors.push([sx, y0 + ri(h - 1), 1]);
    splitRooms(x0, y0, sx - 1, y1, leaves, doors, rand, ri); splitRooms(sx + 1, y0, x1, y1, leaves, doors, rand, ri);
  } else {
    const sy = y0 + 3 + ri(h - 6);
    for (let x = x0; x <= x1; x++) map[sy * W + x] = WALL;
    doors.push([x0 + ri(w - 1), sy, 0]);
    splitRooms(x0, y0, x1, sy - 1, leaves, doors, rand, ri); splitRooms(x0, sy + 1, x1, y1, leaves, doors, rand, ri);
  }
}
const md = (a, b) => Math.abs(a % W - b % W) + Math.abs(((a / W) | 0) - ((b / W) | 0));
const lcell = L => ((L.y0 + L.y1) >> 1) * W + ((L.x0 + L.x1) >> 1);
const nearDoors = doors => c => doors.some(([dx, dy]) => Math.abs(dx - c % W) <= 2 && Math.abs(dy - ((c / W) | 0)) <= 2);
// Coloca props en la planta actual si caben; si cortarían el paso a alguna zona, se deshacen
function placer(start, avoid) {
  let total = map.reduce((n, v) => n + !BLOCK_WALK[v], 0);
  return (cells, t) => {
    if (!cells.every(c => c > 0 && c < W * H && map[c] === FLOOR && !avoid(c))) return false;
    cells.forEach(c => { map[c] = t; });
    if (!BLOCK_WALK[t]) return true;
    if (bfs(start).reduce((n, v) => n + (v >= 0), 0) === total - cells.length) { total -= cells.length; return true; }
    cells.forEach(c => { map[c] = FLOOR; });
    return false;
  };
}
// Amuebla una sala según su uso y le pone suelo a juego; devuelve el color de su luz
function furnish(L, place, rand, ri, fk) {
  const w = L.x1 - L.x0 + 1, h = L.y1 - L.y0 + 1, cell = () => (L.y0 + ri(h)) * W + L.x0 + ri(w), kind = rand();
  let floor, rgb = '200,220,255';
  if (kind < 0.35) { // oficina: moqueta y filas de mesas
    floor = 5;
    for (let y = L.y0 + 1; y < L.y1; y += 3) for (let x = L.x0 + 1; x + 1 < L.x1; x += 3) if (rand() < 0.7) place([y * W + x, y * W + x + 1], LOW);
  } else if (kind < 0.65) { // almacén: hormigón, estanterías con un hueco y cajas
    floor = 6;
    for (let x = L.x0 + 1; x < L.x1; x += 2) {
      if (rand() > 0.75) continue;
      const gap = L.y0 + 1 + ri(Math.max(1, h - 2)), cells = [];
      for (let y = L.y0 + 1; y < L.y1; y++) if (y !== gap) cells.push(y * W + x);
      place(cells, SHELF);
    }
    for (let i = ri(3); i > 0; i--) place([cell()], CRATE);
  } else if (kind < 0.85) { // sala: parqué, mesa grande y plantas en las esquinas
    floor = 4; rgb = '255,205,150';
    const c = lcell(L);
    if (w >= 5 && h >= 5) place([c, c + 1, c + W, c + W + 1], LOW);
    for (const k of [L.y0 * W + L.x0, L.y0 * W + L.x1, L.y1 * W + L.x0, L.y1 * W + L.x1]) if (rand() < 0.6) place([k], TREE);
  } else { // pasillo o trastero: baldosa y alguna caja
    floor = 3;
    for (let i = 1 + ri(2); i > 0; i--) place([cell()], CRATE);
  }
  for (let y = L.y0; y <= L.y1; y++) for (let x = L.x0; x <= L.x1; x++) fk[y * W + x] = floor;
  return rgb;
}
// Ruido de valor suave (manchas de césped)
function vnoise(x, y, s) {
  const gx = Math.floor(x / s), gy = Math.floor(y / s), fx = x / s - gx, fy = y / s - gy;
  const a = hash(gx, gy), b = hash(gx + 1, gy), c = hash(gx, gy + 1), d = hash(gx + 1, gy + 1);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

function layoutBoss() { // vestíbulo a la izquierda y una gran arena con columnas
  W = 30; H = 22; newMap(1, 6);
  for (let y = 1; y < H - 1; y++) { map[y * W + 6] = WALL; for (let x = 1; x < 6; x++) fks[0][y * W + x] = 3; }
  carveDoor(6, 10, 1);
  for (const [px, py] of [[11, 5], [11, 15], [16, 10], [21, 5], [21, 15]]) for (let k = 0; k < 4; k++) map[(py + (k >> 1)) * W + px + (k & 1)] = WALL;
  return { start: 10 * W + 3, exit: 10 * W + 27, loot: -1, lootZ: 0, stairs: [], spawnOk: i => i % W >= 9,
    lamps: [[9, 10], [19, 3], [19, 18], [25, 6], [25, 15]].map(([x, y]) => [y * W + x, LAMP_R, 0, '255,205,150']) };
}

// Golpe: un edificio (a veces con primera planta) en medio de un patio con aparcamiento, garita,
// contenedores y barreras. Llegas por la izquierda, el botín está en la sala más alejada y la furgoneta espera a la derecha
function layoutHeist(level, rand, ri) {
  W = Math.min(64, 44 + level * 2); H = Math.min(46, 32 + level);
  newMap(0, 0);
  const G = maps[0], FK = fks[0];
  const bx0 = 9 + ri(3), bx1 = W - 10 - ri(3), by0 = 5 + ri(2), by1 = H - 6 - ri(2), bw = bx1 - bx0, bh = by1 - by0;
  const inB = (x, y, m) => x >= bx0 - m && x <= bx1 + m && y >= by0 - m && y <= by1 + m;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const c = y * W + x;
    if (inB(x, y, 0)) { FK[c] = 3; if (x === bx0 || x === bx1 || y === by0 || y === by1) G[c] = WALL; else zone[c] = 1; }
    else if (inB(x, y, 2)) FK[c] = 2; // acera alrededor del edificio
    else FK[c] = vnoise(x, y, 5) > 0.58 ? 1 : 0;
  }
  const leaves = [], doors = [];
  splitRooms(bx0 + 1, by0 + 1, bx1 - 1, by1 - 1, leaves, doors, rand, ri);
  doors.push([bx0, by0 + 2 + ri(bh - 5), 1], [bx1, by0 + 2 + ri(bh - 5), 1], [bx0 + 2 + ri(bw - 5), by0, 0], [bx0 + 2 + ri(bw - 5), by1, 0]);
  for (const [dx, dy, v] of doors) carveDoor(dx, dy, v);
  const nearDoor = nearDoors(doors);
  const windows = (x0, y0, x1, y1, near, n) => { // ventanas en la fachada: dejan ver (y que te vean) y se rompen
    for (let k = n; k > 0; k--) {
      const side = ri(4), t = side < 2 ? y0 + 2 + ri(y1 - y0 - 4) : x0 + 2 + ri(x1 - x0 - 4);
      const cells = side === 0 ? [t * W + x0, (t + 1) * W + x0] : side === 1 ? [t * W + x1, (t + 1) * W + x1] : side === 2 ? [y0 * W + t, y0 * W + t + 1] : [y1 * W + t, y1 * W + t + 1];
      if (cells.every(c => map[c] === WALL && !near(c))) cells.forEach(c => { map[c] = GLASS; });
    }
  };
  windows(bx0, by0, bx1, by1, nearDoor, 6 + ri(5));
  const start = (H >> 1) * W + 2, exit = (by0 + 1 + ri(bh - 2)) * W + W - 3;

  // Primera planta sobre parte del edificio, con escaleras desde la planta baja
  const stairs = [];
  let uleaves = [], nearUDoor = () => false;
  if (rand() < 0.65) {
    const left = rand() < 0.5, ux0 = left ? bx0 : bx0 + Math.floor(bw * 0.4), ux1 = left ? bx0 + Math.ceil(bw * 0.6) : bx1;
    maps.push(new Uint8Array(W * H).fill(VOID)); fks.push(new Uint8Array(W * H).fill(3));
    useFloor(1);
    for (let y = by0; y <= by1; y++) for (let x = ux0; x <= ux1; x++) map[y * W + x] = x === ux0 || x === ux1 || y === by0 || y === by1 ? WALL : FLOOR;
    const udoors = [];
    splitRooms(ux0 + 1, by0 + 1, ux1 - 1, by1 - 1, uleaves, udoors, rand, ri);
    for (const [dx, dy, v] of udoors) carveDoor(dx, dy, v);
    nearUDoor = nearDoors(udoors);
    windows(ux0, by0, ux1, by1, nearUDoor, 4 + ri(4));
    for (let tries = 0; stairs.length < 2 && tries < 400; tries++) {
      const x = ux0 + 2 + ri(ux1 - ux0 - 4), y = by0 + 2 + ri(bh - 4), cells = [y * W + x, y * W + x + 1, (y + 1) * W + x, (y + 1) * W + x + 1];
      if (stairs.some(s => md(s, cells[0]) < 8)) continue;
      if (!cells.every(c => maps[0][c] === FLOOR && maps[1][c] === FLOOR && !nearDoor(c) && !nearUDoor(c))) continue;
      cells.forEach(c => { maps[0][c] = STAIRS; maps[1][c] = STAIRS; });
      stairs.push(cells[0]);
    }
    if (!stairs.length) { maps.pop(); fks.pop(); uleaves = []; }
    useFloor(0);
  }
  const nearStairs = c => stairs.some(s => Math.abs(s % W - c % W) <= 2 && Math.abs(((s / W) | 0) - ((c / W) | 0)) <= 2);

  // El botín: en la sala más alejada, de abajo o (a veces) de arriba
  const lootUp = uleaves.length > 0 && rand() < 0.5;
  let vault;
  if (lootUp) { useFloor(1); const d = bfs(stairs[0]); vault = uleaves.reduce((a, b) => d[lcell(b)] > d[lcell(a)] ? b : a); useFloor(0); }
  else { const d = bfs(start); vault = leaves.reduce((a, b) => d[lcell(b)] > d[lcell(a)] ? b : a); }

  const lamps = [];
  const light = (L, rgb, z) => { // unas salas iluminadas de lleno, otras con un punto de luz, el resto a oscuras
    const lr = rand(), w = L.x1 - L.x0 + 1, h = L.y1 - L.y0 + 1;
    if (lr < 0.35) lamps.push([lcell(L), clamp(Math.max(w, h) * T * 0.6, 110, 240), z, rgb]);
    else if (lr < 0.55) lamps.push([lcell(L), 100, z, '255,205,150']);
  };
  let place = placer(start, c => nearDoor(c) || nearStairs(c) || md(c, start) <= 3 || md(c, exit) <= 2);
  for (const L of leaves) {
    if (L === vault) { place([L.y0 * W + L.x0], CRATE); place([L.y1 * W + L.x1], CRATE); continue; } // la cámara del botín, a oscuras
    light(L, furnish(L, place, rand, ri, FK), 0);
  }

  // Patio: aparcamiento con plazas pintadas junto a la furgoneta
  const px0 = bx1 + 3, px1 = W - 5, py1 = (H >> 1) - 3;
  for (let y = 2; y <= py1; y++) for (let x = px0; x <= px1; x++) FK[y * W + x] = 7;
  for (const row of [2, 6]) if (row + 1 <= py1) for (let x = px0 + 1; x <= px1; x += 2) if (rand() < 0.65) place([row * W + x, (row + 1) * W + x], LOW);
  const yard = (m = 1) => { // casilla libre del patio, lejos de la fachada y del aparcamiento
    const x = 1 + ri(W - 2), y = 1 + ri(H - 2);
    return inB(x, y, m + 2) || (x >= px0 - 1 && y <= py1 + 1) ? -1 : y * W + x;
  };
  // Garita: caseta de 4x4 con puerta y una bombilla dentro
  for (let tries = 0; tries < 30; tries++) {
    const c = yard(2); if (c < 0) continue;
    const x0 = c % W, y0 = (c / W) | 0, ring = [], inner = [];
    for (let y = y0; y < y0 + 4; y++) for (let x = x0; x < x0 + 4; x++) (x === x0 || x === x0 + 3 || y === y0 || y === y0 + 3 ? ring : inner).push(y * W + x);
    if (![...ring, ...inner].every(k => G[k] === FLOOR && md(k, start) > 4 && md(k, exit) > 3)) continue;
    const door = rand() < 0.5 ? [y0 * W + x0 + 1, y0 * W + x0 + 2] : [(y0 + 3) * W + x0 + 1, (y0 + 3) * W + x0 + 2];
    if (!place(ring.filter(k => !door.includes(k)), WALL)) continue;
    inner.forEach(k => { zone[k] = 1; FK[k] = 3; });
    lamps.push([inner[0], 80, 0, '255,205,150']);
    break;
  }
  // Contenedores de mercancías, barreras de hormigón (cubren de las balas, no de la vista), coches, árboles, setos y cajas
  for (let k = 2 + ri(3); k > 0; k--) { const c = yard(); if (c >= 0) place(rand() < 0.5 ? [c, c + 1, c + 2, c + 3, c + W, c + W + 1, c + W + 2, c + W + 3] : [c, c + 1, c + W, c + W + 1, c + 2 * W, c + 2 * W + 1, c + 3 * W, c + 3 * W + 1], METAL); }
  for (let k = 3 + ri(3); k > 0; k--) { const c = yard(); if (c >= 0) place(rand() < 0.5 ? [c, c + 1, c + 2] : [c, c + W, c + 2 * W], BARRIER); }
  for (let k = 2 + ri(3); k > 0; k--) { const c = yard(); if (c >= 0) place(rand() < 0.5 ? [c, c + 1] : [c, c + W], LOW); }
  for (let k = 10 + ri(8); k > 0; k--) { const c = yard(); if (c >= 0) place([c], TREE); }
  for (let k = 8 + ri(6); k > 0; k--) { const c = yard(); if (c >= 0) for (const b of [c, c + 1, c + W, c + W + 1].slice(0, 2 + ri(3))) place([b], BUSH); }
  for (let k = 4; k > 0; k--) { const c = yard(); if (c >= 0) place([c], CRATE); }
  // Farolas de sodio alrededor del edificio y en el aparcamiento; la zona de llegada queda en penumbra
  for (let x = bx0; x <= bx1; x += 8 + ri(4)) lamps.push([(by0 - 2) * W + x, 170, 0, '255,160,80'], [(by1 + 2) * W + x, 170, 0, '255,160,80']);
  for (let y = by0 + 4; y < by1; y += 9 + ri(4)) { lamps.push([y * W + bx1 + 2, 170, 0, '255,160,80']); if (rand() < 0.4) lamps.push([y * W + bx0 - 2, 170, 0, '255,160,80']); }
  lamps.push([4 * W + ((px0 + px1) >> 1), 190, 0, '255,160,80']);

  if (maps[1]) { // amueblar la primera planta
    useFloor(1);
    place = placer(stairs[0], c => nearUDoor(c) || nearStairs(c));
    for (const L of uleaves) {
      if (L === vault) { place([L.y0 * W + L.x0], CRATE); place([L.y1 * W + L.x1], CRATE); continue; }
      light(L, furnish(L, place, rand, ri, fks[1]), 1);
    }
    useFloor(0);
  }
  // el botín, en la casilla libre más cercana al centro de la cámara (nunca sobre la escalera: te cambiaría de planta)
  useFloor(lootUp ? 1 : 0);
  let loot = -1;
  for (let y = vault.y0; y <= vault.y1; y++) for (let x = vault.x0; x <= vault.x1; x++) {
    const c = y * W + x;
    if (map[c] === FLOOR && (loot < 0 || md(c, lcell(vault)) < md(loot, lcell(vault)))) loot = c;
  }
  useFloor(0);
  return { start, exit, loot, lootZ: lootUp ? 1 : 0, stairs, lamps, spawnOk: () => true };
}

function buildRoom(level, seed) {
  const rand = mulberry32(seed), ri = n => Math.floor(rand() * n), boss = level % BOSS_EVERY === 0;
  const L = boss ? layoutBoss() : layoutHeist(level, rand, ri);
  useFloor(0);
  const dist0 = bfs(L.start);
  const r = {
    level, W, H, maps, fks, map: maps[0], stairs: L.stairs, start: center(L.start), exit: center(L.exit),
    loot: L.loot >= 0 ? { ...center(L.loot), z: L.lootZ, taken: false } : null,
    lamps: [], enemies: [], bullets: [], nades: [], parts: [], rings: [], texts: [], bodies: [], decals: [], flashes: [], items: [], warns: [], charges: [], crateHp: {},
    detected: false, kills: 0, silent: 0, time: 0, deathT: 0, exposure: 0, boss: null, banner: null, alarm: false, timer: 0, sirenT: 0,
  };
  for (const [c, lr, z, rgb] of L.lamps) {
    if (c <= 0 || c >= W * H || !maps[z]) continue;
    useFloor(z);
    if (BLOCK_SIGHT[map[c]] || map[c] === VOID) continue;
    const p = center(c);
    r.lamps.push({ x: p.x, y: p.y, r: lr, z, rgb, on: true, poly: visPoly(p.x, p.y, 0, Math.PI, lr, 96) });
  }
  useFloor(0);
  if (boss) {
    const b = makeEnemy('boss', 10 * W + 24, rand);
    b.hp = b.maxHp = Math.round(FOES.boss.hp * (1 + 0.5 * (level / BOSS_EVERY - 1)));
    b.a = Math.PI; b.lookA = b.a; // mira hacia la entrada
    r.enemies.push(b); r.boss = b;
  }
  // Enemigos lejos de la entrada y separados entre sí; los perros vigilan el patio y ~30 % guarda la primera planta
  const count = boss ? 3 + (level >> 2) : Math.min(26, 5 + Math.round(level * 1.8));
  const upCount = maps[1] ? Math.max(1, Math.round(count * 0.3)) : 0;
  const spawn = (z, cands, outside, n) => {
    useFloor(z);
    for (let tries = 0, made = 0; made < n && tries < 600 && cands.length; tries++) {
      let type = boss ? ['guard', 'elite', 'shield'][ri(3)] : pickFoe(level, rand());
      if (z && type === 'dog') type = 'guard';
      const pool = type === 'dog' && outside.length ? outside : cands, c = pool[ri(pool.length)], p = center(c);
      if (r.enemies.some(e => e.z === z && Math.hypot(e.x - p.x, e.y - p.y) < T * 3)) continue;
      r.enemies.push(makeEnemy(type, c, rand)); made++;
    }
  };
  if (upCount) {
    useFloor(1);
    const du = bfs(L.stairs[0]), up = [];
    for (let i = 0; i < du.length; i++) if (du[i] >= 4) up.push(i);
    spawn(1, up, [], upCount);
  }
  const cands = [], outside = [];
  for (let i = 0; i < dist0.length; i++) if (dist0[i] >= 8 && L.spawnOk(i)) { cands.push(i); if (!zone[i]) outside.push(i); }
  spawn(0, cands, outside, count - upCount - (boss ? 1 : 0));
  useFloor(0);
  for (let i = 0; i < 2 + ((level / 3) | 0) && cands.length; i++) r.items.push({ ...center(cands[ri(cands.length)]), z: 0 });
  r.p = { x: r.start.x, y: r.start.y, z: 0, onStairs: false, vx: 0, vy: 0, a: 0, r: 12, speed: 0, sneak: true, stepT: 0, fireT: 0, reloadT: 0, meleeT: 0, nadeT: 0, noiseT: 0, breachT: 0, swingT: 0, hurtT: 0, muzzleT: 0, dead: false };
  const goal = r.loot || r.exit;
  r.p.a = Math.atan2(goal.y - r.start.y, goal.x - r.start.x);
  // Cuenta atrás siempre: hasta dar el golpe (o abatir al jefe); al robar, otra más corta para escapar
  r.timer = boss ? 300 : Math.round(70 + Math.hypot(goal.x - r.start.x, goal.y - r.start.y) / T * 1.6);
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
    type, x: p.x, y: p.y, z: curZ, stepT: 0, r: F.r, hp: F.hp, maxHp: F.hp, a: rand() * Math.PI * 2, state: 'patrol', aware: 0, alertLvl: 0,
    seen: new Set(), fireT: 0, reactT: 0, waitT: rand() * 2, lookT: 0, lookA: 0, dir: 1, wpI: 0, path: null,
    target: null, urgent: false, spts: [], pauseT: 0, last: null, lostT: 0, moveA: null, chkT: 0, chkX: 0, chkY: 0,
    aimT: 0, burstT: 0, gunT: 0, called: false,
  };
  e.lookA = e.a;
  e.wps = F.post || F.boss ? [center(c)] : makePatrol(c, rand);
  e.goal = jitter(e.wps[0]);
  return e;
}

// ================= Partida =================
function newRun() {
  run = { level: 1, money: 0, hp: 100, maxHp: 100, nades: 2, charges: 2, light: true, weapons: [{ id: 'pistol', mods: [], ammo: 12, reserve: 36 }], cur: 0, seed: (Math.random() * 1e9) | 0, snap: null };
}
const curW = () => run.weapons[run.cur];
function wstats(w) { const s = { ...WEAPONS[w.id] }; for (const m of w.mods) MODS[m].apply(s); return s; }

function startRoom() {
  const { snap, ...rest } = run;
  run.snap = JSON.stringify(rest);
  room = buildRoom(run.level, run.seed + run.level * 977);
  bakeAll();
  cam.x = room.p.x; cam.y = room.p.y;
  if (room.boss) banner('Sala final: abate al Alcaide para abrir la salida');
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
let winStats = '';
function completeRoom() {
  const bonus = 80 + 20 * run.level, ghost = room.detected ? 0 : 120, wasBoss = run.level % BOSS_EVERY === 0;
  const loot = room.loot ? 150 + 50 * run.level : 0;
  run.money += bonus + ghost + loot;
  run.hp = Math.min(run.maxHp, run.hp + 20);
  run.level++;
  sfx('buy');
  const stats = (loot ? `Botín <b>+$${loot}</b> · ` : '') + `Bajas ${room.kills} · silenciosas ${room.silent} · bonus de sala <b>+$${bonus}</b>` +
    (ghost ? ` · fantasma (sin ser detectado) <b>+$${ghost}</b>` : '') + ` · +20 de vida`;
  if (!wasBoss) { openShop(stats); return; }
  winStats = stats;
  state = 'win';
  $('winInfo').textContent = `Has abatido al Alcaide en la sala ${run.level - 1}. Puedes seguir en modo infinito: cada ${BOSS_EVERY} salas vuelve un jefe más duro.`;
  show('win');
  save();
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
  try { const { snap, ...rest } = run; localStorage.setItem(SAVE, JSON.stringify({ run: rest, shop: state === 'shop' || state === 'win' })); } catch (e) { /* sin almacenamiento: se juega sin guardar */ }
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
function gameOver(title, msg) {
  state = 'over';
  $('overTitle').textContent = title;
  $('overInfo').textContent = `${msg} Puedes reintentarla con el equipo con el que entraste.`;
  show('over');
}
// Al coger el botín salta la alarma: cuenta atrás para escapar y los guardias se movilizan
function stealLoot() {
  const L = room.loot;
  L.taken = true; room.alarm = true; room.sirenT = 0;
  room.timer = Math.round(32 + Math.hypot(room.exit.x - L.x, room.exit.y - L.y) / T * 0.75); // la nueva cuenta atrás: escapar
  popup(L.x, L.y - 20, '¡BOTÍN!', '#ffd98a');
  banner('¡ALARMA! Escapa antes de que llegue la policía');
  // la mitad acude a la cámara del botín y la otra mitad corta el paso en la salida
  room.enemies.forEach((e, i) => {
    e.alertLvl = 2;
    if (e.state !== 'combat') { const t = i % 2 ? room.exit : L; investigate(e, t.x + rnd(-60, 60), t.y + rnd(-60, 60), true); }
  });
  cam.shake = 6; buzz(120);
}

// ================= Ruido y percepción =================
function noise(x, y, r, kind, src, tx = x, ty = y) {
  const z = curZ;
  room.rings.push({ x, y, z, r, t: 0, kind });
  for (const e of room.enemies) {
    if (e === src) continue;
    const same = e.z === z, d = Math.hypot(e.x - x, e.y - y), R = r * (FOES[e.type].ears || 1) * (same ? 1 : 0.35); // de otra planta llega muy amortiguado
    if (d > R || (same && d > R * 0.6 && !los(x, y, e.x, e.y))) continue; // las paredes amortiguan
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
  } else return;
  if (fromPlayer) warn(e, '#ffb547');
}
// Flecha junto al jugador hacia el guardia: solo la dirección del momento, no lo sigue
function warn(e, c) {
  room.warns = room.warns.filter(w => w.e !== e);
  room.warns.push({ e, a: ang(room.p, e), c, t: 1.6 });
}
function suspicious(e, x, y) {
  if (e.state !== 'suspicious') e.stateT = rnd(0.6, 1.3);
  e.state = 'suspicious'; e.target = { x, y }; e.path = null;
}
function investigate(e, x, y, urgent) {
  if (FOES[e.type].post) { suspicious(e, x, y); e.stateT = 3; return; } // el francotirador no deja su puesto: solo mira
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
  if (e.wps.length > 1 && Math.random() < 0.6) e.wps = makePatrol(cellOf(e.x, e.y), Math.random); // patrulla nueva cerca de donde buscó; los de puesto fijo vuelven a él
  e.wpI = 0; e.goal = jitter(e.wps[0]);
}
function enterCombat(e) {
  const p = room.p;
  if (e.state !== 'combat') {
    e.state = 'combat'; e.reactT = Math.max(0.2, rnd(0.35, 0.7) - run.level * 0.015); e.aware = 1; e.path = null;
    room.detected = true;
    warn(e, '#ff5444');
    if (lit(e.x, e.y, e.z)) popup(e.x, e.y - 24, '!', '#ff5444');
    sfx(FOES[e.type].melee ? 'bark' : 'alert', e.x, e.y);
    noise(e.x, e.y, 340, 'alert', e, p.x, p.y); // avisa a los compañeros de dónde estás
  }
  e.last = { x: p.x, y: p.y }; e.lostT = 0; e.alertLvl = Math.max(e.alertLvl, 1);
}
// ¿Lo alumbra algo que el jugador ve? (linterna, halo o lámpara). Mira el cuerpo, no solo el centro, y con margen:
// la luz pintada tiene bordes suaves y entra un poco en los muros, y así coincide con lo que se ve en pantalla
function lit(x, y, z) {
  const p = room.p;
  if (p.dead || z !== p.z) return false;
  for (const [ox, oy] of [[0, 0], [10, 0], [-10, 0], [0, 10], [0, -10]]) {
    const X = x + ox, Y = y + oy, d = Math.hypot(X - p.x, Y - p.y);
    if (d < (run.light ? HALO_ON : HALO_OFF) + 6 && los(p.x, p.y, X, Y)) return true;
    if (run.light && d < BEAM && Math.abs(angDiff(p.a, Math.atan2(Y - p.y, X - p.x))) < 0.66 && los(p.x, p.y, X, Y)) return true;
    if (room.lamps.some(l => l.on && l.z === z && Math.hypot(l.x - X, l.y - Y) < l.r + 6 && los(l.x, l.y, X, Y))) return true;
  }
  return false;
}
function exposure() {
  const p = room.p;
  let x = 0.45;
  if (run.light) x += 0.55;
  if (p.muzzleT > 0) x += 0.9;
  for (const l of room.lamps) if (l.on && l.z === p.z && Math.hypot(l.x - p.x, l.y - p.y) < l.r * 0.8 && los(l.x, l.y, p.x, p.y)) { x += 0.7; break; }
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
const visionHalf = e => FOES[e.type].half ? (e.state === 'combat' ? 0.45 : FOES[e.type].half) : e.state === 'combat' ? 1.2 : 0.62;
const visionRange = e => FOES[e.type].vision * (1 + 0.15 * e.alertLvl) * (e.state === 'combat' ? 1.4 : 0.6 + 0.4 * Math.min(1, room.exposure));
function lookAround(e, dt, spread) {
  if ((e.lookT -= dt) <= 0) { e.lookT = rnd(0.7, 1.8); e.lookA = e.a + rnd(-spread, spread); }
  return e.lookA;
}
function updateEnemy(e, dt) {
  const p = room.p, F = FOES[e.type], X = room.exposure;
  e.fireT -= dt; e.moveA = null;
  if (F.boss && !e.called && e.hp < e.maxHp / 2) { e.called = true; reinforcements(); } // aunque no te vea en ese momento
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), toP = Math.atan2(dy, dx);
  const combat = e.state === 'combat';
  const range = visionRange(e);
  const same = e.z === p.z && !p.dead;
  const smell = same && F.nose && d < F.nose && los(e.x, e.y, p.x, p.y); // el perro te huele aunque vayas a oscuras
  const sees = smell || same && ((d < range && Math.abs(angDiff(e.a, toP)) < visionHalf(e) && los(e.x, e.y, p.x, p.y)) ||
    (d < e.r + p.r + 20 && !p.sneak) || (combat && d < 130 && los(e.x, e.y, p.x, p.y)));

  if (sees) {
    if (combat) enterCombat(e);
    else {
      e.aware += dt * (smell ? Math.max(X, 1.2) : X) * (0.8 + 2.6 * Math.max(0, 1 - d / range)) * (1 + 0.5 * e.alertLvl);
      if (e.aware >= 1) enterCombat(e);
      else if (e.aware > 0.3 && e.state !== 'investigate') suspicious(e, p.x, p.y);
    }
  } else if (!combat) {
    e.aware = Math.max(0, e.aware - dt * 0.18);
    // la linterna del jugador sobre un guardia de espaldas le hace girarse
    if (run.light && same && d < BEAM && Math.abs(angDiff(p.a, toP + Math.PI)) < 0.6 && los(e.x, e.y, p.x, p.y)) {
      e.aware += dt * 0.35;
      if (e.aware > 0.3 && e.state === 'patrol') suspicious(e, p.x, p.y);
    }
  }
  if (!combat) for (const b of room.bodies) {
    if (e.seen.has(b) || b.z !== e.z) continue;
    const bd = Math.hypot(b.x - e.x, b.y - e.y);
    if (bd < F.vision * 0.9 && Math.abs(angDiff(e.a, Math.atan2(b.y - e.y, b.x - e.x))) < 0.62 && los(e.x, e.y, b.x, b.y)) {
      e.seen.add(b); e.alertLvl = 2;
      if (lit(e.x, e.y, e.z)) popup(e.x, e.y - 24, '?!', '#ffb547');
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
      if ((e.stateT -= dt) <= 0) { if (F.post) backToPatrol(e); else investigate(e, e.target.x, e.target.y, false); }
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
        if (F.melee) { // perro: corre hasta ti y muerde
          moveTo(e, p.x, p.y, F.run, dt);
          if (d < e.r + p.r + 10 && e.fireT <= 0 && e.reactT <= 0) { e.fireT = 1 / F.rate; hurtPlayer(F.dmg); sfx('bite', e.x, e.y); }
        } else if (F.boss) {
          if (d > 240 && e.burstT <= 0) moveTo(e, p.x, p.y, F.walk, dt);
          bossAttack(e, dt, d);
        } else if (F.post) { // francotirador: aviso rojo, un segundo apuntando y un tiro pesado
          if (e.aimT > 0) { if ((e.aimT -= dt) <= 0) snipe(e); }
          else if (e.reactT <= 0 && e.fireT <= 0 && Math.abs(angDiff(e.a, toP)) < 0.15) { e.aimT = 1.1; warn(e, '#ff5444'); sfx('charge', e.x, e.y); }
        } else {
          if (d > 170) moveTo(e, p.x, p.y, F.walk * 1.5, dt);
          if (e.reactT <= 0 && e.fireT <= 0 && Math.abs(angDiff(e.a, toP)) < 0.3) enemyShoot(e);
        }
      } else {
        e.lostT += dt; e.reactT = Math.max(e.reactT, 0.3); e.aimT = 0; e.burstT = 0;
        if (F.post) { face = Math.atan2(e.last.y - e.y, e.last.x - e.x); if (e.lostT > 5) { e.alertLvl = 2; backToPatrol(e); } }
        else if (moveTo(e, e.last.x, e.last.y, F.run, dt) || e.lostT > 8) { e.alertLvl = 2; e.aware = 0.5; search(e); }
      }
      break;
  }
  if (e.moveA !== null && same && d < 340 && (e.stepT -= dt) <= 0) { // pasos que oyes en la oscuridad
    e.stepT = combat || (e.state === 'investigate' && e.urgent) ? 0.3 : 0.5;
    sfx(F.melee ? 'paw' : 'estep', e.x, e.y);
  }
  // apuntando gira muy despacio (corriendo lo esquivas); escudo y jefe también, para poder rodearlos
  const want = face ?? e.moveA ?? e.a, turn = (e.aimT > 0 ? 0.4 : F.boss ? 2.5 : F.shield && combat ? 2 : combat ? 6 : 3.2) * dt;
  e.a += clamp(angDiff(e.a, want), -turn, turn);
}
function snipe(e) {
  const F = FOES[e.type], mx = e.x + Math.cos(e.a) * (e.r + 14), my = e.y + Math.sin(e.a) * (e.r + 14);
  bullet(mx, my, e.a, 1400, F.dmg, false);
  flash(mx, my, 140, 0.09);
  noise(e.x, e.y, 520, 'eshot', e);
  sfx('eshot', e.x, e.y);
  e.fireT = 1 / F.rate;
}
// El Alcaide: ráfagas de ametralladora, granadas y, a media vida, refuerzos
function bossAttack(e, dt, d) {
  const rage = e.hp < e.maxHp / 2;
  if (e.burstT > 0) {
    e.burstT -= dt;
    if ((e.gunT -= dt) <= 0) {
      e.gunT = rage ? 0.07 : 0.1;
      const mx = e.x + Math.cos(e.a) * (e.r + 10), my = e.y + Math.sin(e.a) * (e.r + 10);
      bullet(mx, my, e.a + rnd(-0.2, 0.2), 600, FOES.boss.dmg, false);
      flash(mx, my, 120, 0.06);
      sfx('eshot', e.x, e.y);
    }
  } else if (e.fireT <= 0 && e.reactT <= 0) {
    noise(e.x, e.y, 500, 'eshot', e);
    if (d > 140 && Math.random() < 0.35) { bossNade(e); e.fireT = rage ? 1 : 1.7; }
    else { e.burstT = rage ? 2.2 : 1.5; e.gunT = 0; e.fireT = e.burstT + (rage ? 0.9 : 1.6); }
  }
}
function bossNade(e) {
  const p = room.p, a = ang(e, p), v = Math.min(dist(e, p), 320) * 2.4; // con el rozamiento llega casi justo a ti
  room.nades.push({ z: curZ, x: e.x + Math.cos(a) * 30, y: e.y + Math.sin(a) * 30, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 1.5, foe: true });
  sfx('throw', e.x, e.y);
}
function reinforcements() {
  const d = bfs(cellOf(room.p.x, room.p.y)), far = [];
  for (let i = 0; i < d.length; i++) if (d[i] >= 8) far.push(i);
  for (let k = 0; k < 3 && far.length; k++) {
    const e = makeEnemy(k ? 'guard' : 'elite', far[(Math.random() * far.length) | 0], Math.random);
    room.enemies.push(e);
    enterCombat(e);
  }
  banner('¡El Alcaide pide refuerzos!');
}
function banner(text) { room.banner = { text, t: 3.5 }; }
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
  useFloor(p.z);
  for (const k of ['fireT', 'meleeT', 'nadeT', 'noiseT', 'breachT', 'swingT', 'hurtT', 'muzzleT']) p[k] -= dt;
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
  const onStairs = map[cellOf(p.x, p.y)] === STAIRS; // al pisar la escalera cambias de planta
  if (onStairs && !p.onStairs && maps[1]) { p.z ^= 1; useFloor(p.z); banner(p.z ? 'Primera planta' : 'Planta baja'); sfx('stairs'); }
  p.onStairs = onStairs;
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
    if (e.z === p.z && d < 420 && da < bd && lit(e.x, e.y, e.z)) { best = e; bd = da; }
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
  useFloor(p.z);
  p.meleeT = 0.45; p.swingT = 0.18;
  let best = null, bd = 72;
  for (const e of room.enemies) {
    const d = dist(p, e);
    if (e.z === p.z && d < bd && Math.abs(angDiff(p.a, ang(p, e))) < 1.75 && los(p.x, p.y, e.x, e.y)) { best = e; bd = d; }
  }
  if (best) { // se abalanza hacia el objetivo más cercano
    p.a = ang(p, best);
    const step = Math.max(0, bd - best.r - p.r - 4);
    for (let i = 0; i < 4; i++) { p.x += Math.cos(p.a) * step / 4; p.y += Math.sin(p.a) * step / 4; collide(p); }
  }
  sfx('knife');
  noise(p.x, p.y, 55, 'step');
  let hit = false;
  for (const e of [...room.enemies]) {
    if (e.z === p.z && dist(p, e) < e.r + p.r + 22 && Math.abs(angDiff(p.a, ang(p, e))) < 1.1) {
      const behind = Math.abs(angDiff(e.a, ang(e, p))) > 1.9;
      hurtEnemy(e, e.state !== 'combat' || behind ? (FOES[e.type].boss ? 300 : 999) : 55, p.a); // al jefe no se le remata de un tajo
      hit = true;
    }
  }
  const fx = Math.floor((p.x + Math.cos(p.a) * (p.r + 14)) / T), fy = Math.floor((p.y + Math.sin(p.a) * (p.r + 14)) / T), ft = map[fy * W + fx];
  if (!hit && !border(fx, fy) && (ft === GLASS || ft === CRATE)) breakTile(fx, fy, true);
}
function throwNade() {
  const p = room.p;
  if (run.nades <= 0 || p.nadeT > 0 || p.dead) return;
  useFloor(p.z);
  run.nades--; p.nadeT = 0.6;
  room.nades.push({ z: curZ, x: p.x + Math.cos(p.a) * 14, y: p.y + Math.sin(p.a) * 14, vx: Math.cos(p.a) * 470 + p.vx * 0.5, vy: Math.sin(p.a) * 470 + p.vy * 0.5, t: 1.7 });
  sfx('throw');
}
// C4: se pega a la pared o caja de enfrente (o se deja en el suelo) casi sin ruido; al volver a pulsar, estalla
function breach() {
  const p = room.p;
  if (p.dead || p.breachT > 0) return;
  useFloor(p.z); // las acciones llegan entre fotogramas: siempre en la planta del jugador
  p.breachT = 0.35;
  if (room.charges.length) {
    sfx('click');
    for (const c of room.charges.splice(0)) { useFloor(c.z); explode(c.x, c.y, false, 95, 66); }
    useFloor(p.z);
    return;
  }
  if (run.charges <= 0) { popup(p.x, p.y - 22, 'Sin C4', '#7d8ca0'); return; }
  const c = Math.cos(p.a), s = Math.sin(p.a);
  let x = p.x + c * (p.r + 4), y = p.y + s * (p.r + 4);
  for (let k = p.r + 4; k <= p.r + 30; k += 4) {
    const t = map[Math.floor((p.y + s * k) / T) * W + Math.floor((p.x + c * k) / T)];
    if (BLOCK_WALK[t]) break;
    x = p.x + c * k; y = p.y + s * k;
  }
  run.charges--;
  room.charges.push({ x, y, z: curZ });
  noise(p.x, p.y, 60, 'step');
  sfx('plant');
  popup(p.x, p.y - 22, 'C4 PUESTA · pulsa otra vez para detonar', '#ff5444');
}
function makeNoise() {
  const p = room.p;
  if (p.noiseT > 0 || p.dead) return;
  useFloor(p.z);
  p.noiseT = 1.5;
  noise(p.x, p.y, 300, 'whistle');
  sfx('whistle');
}
function toggleLight() { run.light = !run.light; sfx('empty'); }

// ================= Daño, balas, explosiones =================
function bullet(x, y, a, speed, dmg, mine, bolt = false) {
  room.bullets.push({ x, y, z: curZ, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg, mine, bolt, life: 1.2 });
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
  room.bodies.push({ x: e.x, y: e.y, z: e.z, a, type: e.type });
  room.decals.push({ x: e.x + Math.cos(a) * 8, y: e.y + Math.sin(a) * 8, z: e.z, r: 16 });
  room.enemies.splice(room.enemies.indexOf(e), 1);
  if (!FOES[e.type].melee && Math.random() < 0.65) room.items.push({ x: e.x + rnd(-10, 10), y: e.y + rnd(-10, 10), z: e.z });
  if (e === room.boss) { room.boss = null; banner('¡Alcaide abatido! La salida está abierta'); cam.shake = 14; }
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
    useFloor(b.z);
    const n = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 8);
    for (let i = 0; i < n && !b.dead; i++) {
      b.x += b.vx * dt / n; b.y += b.vy * dt / n;
      const tx = Math.floor(b.x / T), ty = Math.floor(b.y / T), c = ty * W + tx;
      if (border(tx, ty) || BLOCK_SHOT[map[c]]) {
        b.dead = true;
        sparks(b.x - b.vx * 0.004, b.y - b.vy * 0.004, 4);
        if (!border(tx, ty) && map[c] === GLASS) breakTile(tx, ty, b.mine);
        else if (!border(tx, ty) && map[c] === CRATE && (room.crateHp[c] = (room.crateHp[c] ?? 40) - b.dmg) <= 0) breakTile(tx, ty, b.mine);
        else if (b.mine) noise(b.x, b.y, b.bolt ? 60 : 110, 'impact'); // el impacto también distrae
        break;
      }
      if (b.mine) {
        for (const l of room.lamps) if (l.on && l.z === b.z && Math.hypot(l.x - b.x, l.y - b.y) < 12) {
          l.on = false; b.dead = true; sparks(l.x, l.y, 12); lampChanged(l);
          noise(l.x, l.y, 160, 'impact'); sfx('glass', l.x, l.y);
        }
        for (const e of room.enemies) if (e.z === b.z && Math.hypot(e.x - b.x, e.y - b.y) < e.r) {
          b.dead = true;
          if (FOES[e.type].shield && Math.abs(angDiff(e.a, Math.atan2(-b.vy, -b.vx))) < 0.9) { sparks(b.x, b.y, 5); sfx('clank', e.x, e.y); enterCombat(e); }
          else hurtEnemy(e, b.dmg, Math.atan2(b.vy, b.vx));
          break;
        }
      } else if (p.z === b.z && Math.hypot(p.x - b.x, p.y - b.y) < p.r) { hurtPlayer(b.dmg); b.dead = true; }
    }
    if ((b.life -= dt) <= 0) b.dead = true;
  }
  room.bullets = room.bullets.filter(b => !b.dead);
}
function updateNades(dt) {
  for (const n of room.nades) {
    useFloor(n.z);
    const f = Math.exp(-2.4 * dt);
    n.vx *= f; n.vy *= f;
    if (solidPx(n.x + n.vx * dt, n.y)) n.vx *= -0.55; else n.x += n.vx * dt;
    if (solidPx(n.x, n.y + n.vy * dt)) n.vy *= -0.55; else n.y += n.vy * dt;
    if ((n.t -= dt) <= 0) explode(n.x, n.y, n.foe);
  }
  room.nades = room.nades.filter(n => n.t > 0);
}
let lampsDirty = true; // hay que volver a hornear las luces (lámpara rota o pared caída)
function refreshLamps(x, y) { // la luz de las lámparas se recalcula si cae una pared cerca
  for (const l of room.lamps) if (l.z === curZ && Math.hypot(l.x - x, l.y - y) < l.r + 80) { l.poly = visPoly(l.x, l.y, 0, Math.PI, l.r, 96); lampChanged(l); }
  bakeDirty(x, y);
}
function breakTile(tx, ty, mine) {
  const c = ty * W + tx, t = map[c], x = tx * T + T / 2, y = ty * T + T / 2;
  map[c] = FLOOR;
  sparks(x, y, 8);
  room.decals.push({ x, y, z: curZ, r: 12, rubble: true });
  if (mine) noise(x, y, t === GLASS ? 230 : 200, 'impact');
  sfx(t === GLASS ? 'glass' : 'wood', x, y);
  refreshLamps(x, y);
}
function destroyTiles(x, y, rad) {
  let any = false;
  for (let ty = Math.floor((y - rad) / T); ty <= Math.floor((y + rad) / T); ty++)
    for (let tx = Math.floor((x - rad) / T); tx <= Math.floor((x + rad) / T); tx++) {
      const t = map[ty * W + tx];
      if (border(tx, ty) || !t || t === VOID || t === STAIRS || Math.hypot(tx * T + T / 2 - x, ty * T + T / 2 - y) > rad) continue;
      map[ty * W + tx] = FLOOR; any = true;
      room.decals.push({ x: tx * T + T / 2, y: ty * T + T / 2, z: curZ, r: 15, rubble: true });
    }
  if (any) { refreshLamps(x, y); sfx('crumble', x, y); }
}
function explode(x, y, foe, R = 125, breakR = 46) {
  const p = room.p, z = curZ;
  destroyTiles(x, y, breakR);
  for (const e of [...room.enemies]) {
    if (e.z !== z || (foe && FOES[e.type].boss)) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < R && los(x, y, e.x, e.y)) hurtEnemy(e, 170 * (1 - d / R) + 20, Math.atan2(e.y - y, e.x - x));
  }
  const dp = Math.hypot(p.x - x, p.y - y);
  if (p.z === z && dp < R && los(x, y, p.x, p.y)) hurtPlayer((170 * (1 - dp / R) + 20) * 0.6);
  for (const l of room.lamps) if (l.on && l.z === z && Math.hypot(l.x - x, l.y - y) < R) { l.on = false; lampChanged(l); }
  noise(x, y, 800, foe ? 'eshot' : 'boom'); // la granada del jefe no cuenta como ruido tuyo
  flash(x, y, 280, 0.35);
  sparks(x, y, 30);
  room.decals.push({ x, y, z, r: 30, scorch: true });
  cam.shake = 16; buzz(90);
  sfx('boom', x, y);
}

// ================= Efectos =================
function flash(x, y, r, t) { room.flashes.push({ x, y, z: curZ, r, t, max: t, poly: visPoly(x, y, 0, Math.PI, r, 40) }); }
function popup(x, y, text, color) { room.texts.push({ x, y, z: curZ, text, color, t: 1.3 }); }
function sparks(x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, s = rnd(60, 260); room.parts.push({ x, y, z: curZ, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rnd(0.15, 0.4), c: '#ffd98a', s: 2 }); } }
function blood(x, y, a, n) {
  for (let i = 0; i < n; i++) { const b = a + rnd(-0.7, 0.7), s = rnd(40, 200); room.parts.push({ x, y, z: curZ, vx: Math.cos(b) * s, vy: Math.sin(b) * s, t: rnd(0.2, 0.5), c: '#8e1f1f', s: 3 }); }
  if (room.decals.length < 220) room.decals.push({ x: x + Math.cos(a) * rnd(6, 20), y: y + Math.sin(a) * rnd(6, 20), z: curZ, r: rnd(3, 7) });
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
  for (const w of room.warns) w.t -= dt;
  room.warns = room.warns.filter(w => w.t > 0);
  cam.shake *= Math.exp(-9 * dt);
}

// ================= Bucle =================
function update(dt) {
  const p = room.p;
  room.time += dt;
  if (p.dead) { if ((room.deathT -= dt) <= 0) gameOver('TE HAN ABATIDO', `Caíste en la sala ${run.level}.`); }
  else updatePlayer(dt);
  useFloor(p.z);
  room.exposure = exposure();
  for (const e of [...room.enemies]) { useFloor(e.z); updateEnemy(e, dt); }
  const all = [...room.enemies, p];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
    if (a.z !== b.z) continue;
    if (d > 0 && d < m) { const k = (m - d) / d / 2; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; }
  }
  for (const o of all) { useFloor(o.z); collide(o); }
  updateBullets(dt);
  updateNades(dt);
  useFloor(p.z);
  updateFx(dt);
  const look = sticks.R || mouse.active ? 70 : 40;
  const k = Math.min(1, dt * 6);
  cam.x += (p.x + Math.cos(p.a) * look - cam.x) * k;
  cam.y += (p.y + Math.sin(p.a) * look - cam.y) * k;
  for (const it of room.items) if (!p.dead && it.z === p.z && !ammoFull() && dist(p, it) < 24) {
    it.got = true; addAmmo(0.25);
    popup(it.x, it.y - 16, '+MUNICIÓN', '#ffd98a'); sfx('reload');
  }
  room.items = room.items.filter(it => !it.got);
  if (room.banner && (room.banner.t -= dt) <= 0) room.banner = null;
  ambience(true);
  if (room.loot && !room.loot.taken && !p.dead && room.loot.z === p.z && dist(p, room.loot) < 24) stealLoot();
  if (!p.dead && room.timer > 0) {
    if (room.alarm && (room.sirenT -= dt) <= 0) { room.sirenT = 1; sfx('siren'); }
    if ((room.timer -= dt) <= 0) {
      room.timer = 0;
      gameOver('TE HAN ATRAPADO', room.alarm ? `Llegó la policía antes de que escaparas de la sala ${run.level}.` : `Se acabó el tiempo: la policía llegó antes de que dieras el golpe en la sala ${run.level}.`);
      return;
    }
  }
  const locked = room.boss || (room.loot && !room.loot.taken);
  if (!p.dead && p.z === 0 && dist(p, room.exit) < 26) { if (!locked) completeRoom(); else if (!room.banner) banner(room.boss ? 'Salida bloqueada: abate al Alcaide' : 'Primero roba el botín'); }
}

// ================= Horneado del mapa =================
// Suelos, muros y props se dibujan con detalle una vez por sala en lienzos; cada fotograma solo copia lo visible.
// Cada planta se hornea en su caja de casillas ocupadas (la primera planta es más pequeña: ahorra memoria)
const bakes = [], lampMask = [], sprites = { tree: [], bush: [] };
const lampQueue = []; // lámparas que cambiaron (rotas o con la sombra recalculada): su zona se rehornea
let BS = 1;
const LBS = 0.5; // escala de las capas de luz horneadas
const TALL = [0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0]; // proyectan oclusión sobre el suelo vecino
function bakeAll() {
  BS = Math.min(touchMode ? 1.25 : 1.5, Math.sqrt((touchMode ? 5e6 : 9e6) / (W * T * H * T)));
  for (let z = 0; z < maps.length; z++) {
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (maps[z][y * W + x] !== VOID) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const b = bakes[z] || (bakes[z] = { cv: document.createElement('canvas') });
    Object.assign(b, { x0, y0, s: BS });
    b.cv.width = Math.ceil((x1 - x0 + 1) * T * BS); b.cv.height = Math.ceil((y1 - y0 + 1) * T * BS);
    bakeRegion(z, 0, 0, W - 1, H - 1);
  }
  bakes.length = maps.length;
  makeSprites();
  lampQueue.length = 0;
  bakeLamps();
}
function bakeDirty(x, y) { // tras romper algo: rehornea las casillas de alrededor
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  bakeRegion(curZ, tx - 3, ty - 3, tx + 3, ty + 3);
}
function lampChanged(l) { lampsDirty = true; if (!lampQueue.includes(l)) lampQueue.push(l); }
// Aclara la región horneada sumándola sobre sí misma: los colores base son casi negros y con luz no se veía el detalle
function brighten(g, b, x0, y0, x1, y1, k) {
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = k;
  g.drawImage(b.cv, (x0 - b.x0) * T * b.s, (y0 - b.y0) * T * b.s, (x1 - x0 + 1) * T * b.s, (y1 - y0 + 1) * T * b.s, x0 * T, y0 * T, (x1 - x0 + 1) * T, (y1 - y0 + 1) * T);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
}
function layerCtx(b, x0, y0, x1, y1) { // contexto con recorte a la región, en coordenadas de mundo
  const g = b.cv.getContext('2d');
  g.setTransform(b.s, 0, 0, b.s, -b.x0 * T * b.s, -b.y0 * T * b.s);
  g.save(); g.beginPath(); g.rect(x0 * T, y0 * T, (x1 - x0 + 1) * T, (y1 - y0 + 1) * T); g.clip();
  g.clearRect(x0 * T, y0 * T, (x1 - x0 + 1) * T, (y1 - y0 + 1) * T);
  return g;
}
function bakeRegion(z, x0, y0, x1, y1) {
  x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W - 1, x1); y1 = Math.min(H - 1, y1);
  const g = layerCtx(bakes[z], x0, y0, x1, y1), M = maps[z], F = fks[z];
  const X0 = Math.max(0, x0 - 1), Y0 = Math.max(0, y0 - 1), X1 = Math.min(W - 1, x1 + 1), Y1 = Math.min(H - 1, y1 + 1);
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) if (M[y * W + x] !== VOID) drawFloor(g, x, y, F[y * W + x], z);
  // sombras: oclusión al pie de muros y estanterías, y sombra proyectada de cada prop
  const ao = [g.createLinearGradient(0, 0, 0, 12), g.createLinearGradient(0, 0, 12, 0)];
  for (const a of ao) { a.addColorStop(0, 'rgba(0,0,0,0.5)'); a.addColorStop(1, 'rgba(0,0,0,0)'); }
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
    const c = y * W + x, t = M[c], X = x * T, Y = y * T;
    if (t === VOID) continue;
    if (!BLOCK_WALK[t] || t === LOW || t === BARRIER) { // suelo: oscurece los bordes junto a algo alto
      const edge = (n, rot) => { if (!TALL[M[n]]) return; g.save(); g.translate(X + T / 2, Y + T / 2); g.rotate(rot); g.translate(-T / 2, -T / 2); g.fillStyle = ao[0]; g.fillRect(0, 0, T, 12); g.restore(); };
      edge(c - W, 0); edge(c + 1, Math.PI / 2); edge(c + W, Math.PI); edge(c - 1, -Math.PI / 2);
    }
    if (t === CRATE || t === SHELF || t === METAL || t === LOW || t === BARRIER) { g.fillStyle = 'rgba(0,0,0,0.32)'; g.fillRect(X + 5, Y + 7, T - 2, T - 3); }
    if (t === TREE && !zone[c] && z === 0) { g.fillStyle = 'rgba(0,0,0,0.38)'; g.beginPath(); g.ellipse(X + T / 2 + 9, Y + T / 2 + 11, 27, 22, 0, 0, 7); g.fill(); }
    if (t === BUSH) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(X + T / 2 + 5, Y + T / 2 + 6, 20, 16, 0, 0, 7); g.fill(); }
  }
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) drawTile(g, M, x, y, z);
  brighten(g, bakes[z], x0, y0, x1, y1, 0.8);
  // color de las luces horneado sobre suelos y muros (sodio fuera, fluorescente o cálida dentro), con penumbra
  g.globalCompositeOperation = 'lighter';
  if ('filter' in g) g.filter = 'blur(2px)';
  for (const l of room.lamps) {
    if (!l.on || l.z !== z || l.x + l.r < x0 * T || l.x - l.r > (x1 + 1) * T || l.y + l.r < y0 * T || l.y - l.r > (y1 + 1) * T) continue;
    g.fillStyle = glow(g, l.x, l.y, l.r, l.rgb, 0.24); fillPoly(g, l.poly);
  }
  g.restore(); // también deshace el filtro y el modo de mezcla
}
function drawFloor(g, x, y, k, z) {
  const X = x * T, Y = y * T, h = hash(x, y, 7);
  const dots = (n, c1, c2, s = 1.5) => { for (let i = 0; i < n; i++) { g.fillStyle = hash(x, y, i) < 0.5 ? c1 : c2; g.fillRect(X + hash(x, y, i + 31) * T, Y + hash(x, y, i + 57) * T, s, s); } };
  if (k === 0 || k === 7) { // asfalto con grava y alguna grieta
    g.fillStyle = '#13181e'; g.fillRect(X, Y, T, T); dots(9, '#1b2128', '#0d1115');
    if (h < 0.07) { g.strokeStyle = '#0b0e12'; g.lineWidth = 1; g.beginPath(); g.moveTo(X + 6, Y + hash(x, y, 3) * T); g.lineTo(X + T / 2, Y + hash(x, y, 4) * T); g.lineTo(X + T - 4, Y + hash(x, y, 5) * T); g.stroke(); }
    if (k === 7) { g.fillStyle = 'rgba(215,212,190,0.32)'; g.fillRect(X, Y + 3, 2, T - 6); if (y % 4 === 1) g.fillRect(X, Y, T, 2); } // plazas pintadas
  } else if (k === 1) { // césped con briznas
    g.fillStyle = h < 0.5 ? '#14231a' : '#132119'; g.fillRect(X, Y, T, T);
    g.lineWidth = 1;
    for (let i = 0; i < 14; i++) { const bx = X + hash(x, y, i + 3) * T, byy = Y + hash(x, y, i + 40) * T; g.strokeStyle = hash(x, y, i + 80) < 0.5 ? '#1d3424' : '#0f1a12'; g.beginPath(); g.moveTo(bx, byy); g.lineTo(bx + (hash(x, y, i) - 0.5) * 4, byy - 4); g.stroke(); }
  } else if (k === 2) { // acera de losetas desplazadas
    g.fillStyle = '#20252b'; g.fillRect(X, Y, T, T);
    g.fillStyle = `rgba(255,255,255,${(h * 0.035).toFixed(3)})`; g.fillRect(X, Y, T, T);
    g.fillStyle = '#161a1f'; g.fillRect(X, Y, T, 1); g.fillRect(X, Y + T / 2, T, 1);
    g.fillRect(X + (y % 2 ? T / 2 : 0), Y, 1, T / 2); g.fillRect(X + (y % 2 ? 0 : T / 2), Y + T / 2, 1, T / 2);
  } else if (k === 3) { // baldosa: cuatro piezas con junta
    g.fillStyle = '#10141a'; g.fillRect(X, Y, T, T);
    for (let s = 0; s < 4; s++) { const sx = s & 1, sy = s >> 1; g.fillStyle = (sx + sy + x + y) % 2 ? '#1f252e' : '#1a2028'; g.fillRect(X + sx * 20 + 1, Y + sy * 20 + 1, 18, 18); }
    g.fillStyle = 'rgba(255,255,255,0.03)'; g.fillRect(X + 2, Y + 2, 8, 2);
  } else if (k === 4) { // parqué de tablas
    for (let r = 0; r < 4; r++) {
      g.fillStyle = (r + y) % 2 ? '#2b2119' : '#271e17'; g.fillRect(X, Y + r * 10, T, 10);
      g.fillStyle = '#1b140f'; g.fillRect(X, Y + r * 10, T, 1); g.fillRect(X + Math.floor(hash(x, y, r) * T), Y + r * 10, 1, 10);
      g.fillStyle = 'rgba(255,220,170,0.03)'; g.fillRect(X + 3, Y + r * 10 + 4, T - 8, 1);
    }
  } else if (k === 5) { // moqueta
    g.fillStyle = '#1c2130'; g.fillRect(X, Y, T, T); dots(16, '#232a3b', '#171b27', 1);
  } else { // hormigón con manchas y juntas
    g.fillStyle = '#1d2024'; g.fillRect(X, Y, T, T); dots(6, '#23272c', '#17191c', 2);
    if (h < 0.25) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.arc(X + hash(x, y, 2) * T, Y + hash(x, y, 9) * T, 6 + h * 30, 0, 7); g.fill(); }
    g.fillStyle = '#15171a'; if (x % 2 === 0) g.fillRect(X, Y, 1, T); if (y % 2 === 0) g.fillRect(X, Y, T, 1);
  }
}
const CAR_COLORS = ['#3b2a2f', '#2b3848', '#3d3e44', '#43392a', '#24383b', '#4a4d52'];
function drawTile(g, M, x, y, z) {
  const c = y * W + x, t = M[c], X = x * T, Y = y * T;
  const tall = v => v === WALL || v === GLASS;
  if (t === WALL || t === GLASS) {
    const fence = border(x, y);
    const facade = z === 0 && !fence && [c - 1, c + 1, c - W, c + W].some(n => !BLOCK_WALK[M[n]] && !zone[n]);
    const top = fence ? '#1c2128' : facade ? '#3b3431' : '#2d3745', face = fence ? '#121519' : facade ? '#271f1d' : '#1b222c';
    g.fillStyle = top; g.fillRect(X, Y, T, T);
    if (facade && t === WALL) { // ladrillo visto
      g.fillStyle = 'rgba(0,0,0,0.2)';
      for (let r = 0; r < T; r += 8) { g.fillRect(X, Y + r, T, 1); for (let j = (r / 8) % 2 ? 8 : 0; j < T; j += 16) g.fillRect(X + j, Y + r, 1, 8); }
    } else if (!fence) { g.fillStyle = 'rgba(255,255,255,0.035)'; g.fillRect(X + 4, Y + 5, T - 8, 1); }
    if (!tall(M[c - W])) { g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(X, Y, T, 2); }
    if (!tall(M[c - 1])) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(X, Y, 2, T); }
    if (!tall(M[c + 1])) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X + T - 2, Y, 2, T); }
    if (!tall(M[c + W])) { g.fillStyle = face; g.fillRect(X, Y + T - 11, T, 11); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(X, Y + T - 11, T, 1); } // cara frontal: da altura
    if (t === GLASS) { // ventana: marco, cristal con reflejos y parteluz
      const horiz = BLOCK_WALK[M[c - 1]] && BLOCK_WALK[M[c + 1]];
      g.save(); g.translate(X + T / 2, Y + T / 2); if (!horiz) g.rotate(Math.PI / 2);
      g.fillStyle = '#11161c'; g.fillRect(-T / 2, -6, T, 12);
      const gl = g.createLinearGradient(0, -5, 0, 5); gl.addColorStop(0, 'rgba(150,200,240,0.65)'); gl.addColorStop(1, 'rgba(80,130,180,0.45)');
      g.fillStyle = gl; g.fillRect(-T / 2, -4, T, 8);
      g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-12, 3); g.lineTo(-6, -3); g.moveTo(4, 3); g.lineTo(8, -1); g.stroke();
      g.fillStyle = '#11161c'; g.fillRect(-1, -5, 2, 10);
      g.restore();
    }
  } else if (t === CRATE) { // caja de tablas con refuerzo en X
    g.fillStyle = '#5b4530'; g.fillRect(X + 2, Y + 2, T - 4, T - 4);
    g.fillStyle = '#463522'; for (let k = 11; k < T - 4; k += 9) g.fillRect(X + 2, Y + k, T - 4, 1);
    g.strokeStyle = '#6f553a'; g.lineWidth = 3; g.strokeRect(X + 3.5, Y + 3.5, T - 7, T - 7);
    g.strokeStyle = '#3d2e1d'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X + 6, Y + 6); g.lineTo(X + T - 6, Y + T - 6); g.stroke();
    g.fillStyle = '#a89a80'; for (const [dx, dy] of [[5, 5], [T - 6, 5], [5, T - 6], [T - 6, T - 6]]) g.fillRect(X + dx, Y + dy, 1.5, 1.5);
  } else if (t === LOW && (zone[c] || z === 1)) { // mesa: superficie continua si es grande; con silla y cosas encima si es de despacho
    const l = M[c - 1] === LOW, r = M[c + 1] === LOW, u = M[c - W] === LOW, d = M[c + W] === LOW, table = u || d;
    const x0 = X + (l ? 0 : 3), x1 = X + T - (r ? 0 : 3), y0 = Y + (u ? 0 : 3), y1 = Y + T - (d ? 0 : table ? 3 : 13);
    if (!table) { g.fillStyle = '#23272f'; g.beginPath(); g.arc(X + T / 2, Y + T - 6, 6, 0, 7); g.fill(); }
    g.fillStyle = '#4a3a2b'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.fillStyle = 'rgba(255,230,190,0.08)'; g.fillRect(x0, y0, x1 - x0, 2);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0, y1 - 2, x1 - x0, 2);
    const hh = hash(x, y, 11);
    if (!table && hh < 0.5) { g.fillStyle = '#15181d'; g.fillRect(X + 12, Y + 6, 16, 9); g.fillStyle = '#35587a'; g.fillRect(X + 13, Y + 7, 14, 7); }
    else if (!table) { g.fillStyle = 'rgba(225,222,210,0.55)'; g.fillRect(X + 8, Y + 8, 11, 8); g.fillRect(X + 21, Y + 10, 9, 7); }
    if (hh > 0.7) { g.fillStyle = '#d8d2c4'; g.beginPath(); g.arc(X + 30, Y + 20, 2.5, 0, 7); g.fill(); }
  } else if (t === LOW) { // coche: carrocería, techo, lunas y faros según el lado del que esté la otra mitad
    const vert = M[c - W] === LOW || M[c + W] === LOW, first = vert ? M[c + W] === LOW : M[c + 1] === LOW;
    const ax = vert ? x : first ? x : x - 1, ay = vert ? (first ? y : y - 1) : y;
    g.save(); g.translate(X + T / 2, Y + T / 2); g.rotate(vert ? 0 : -Math.PI / 2); if (!first) g.rotate(Math.PI);
    g.fillStyle = CAR_COLORS[Math.floor(hash(ax, ay, 5) * CAR_COLORS.length)];
    g.beginPath(); g.moveTo(-15, 20); g.lineTo(-15, -12); g.quadraticCurveTo(-15, -19, -8, -19); g.lineTo(8, -19); g.quadraticCurveTo(15, -19, 15, -12); g.lineTo(15, 20); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(-11, 8, 22, 12); // techo
    g.fillStyle = '#6f8fae'; g.fillRect(-11, 2, 22, 6); // parabrisas
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(-15, -12, 2, 30);
    g.fillStyle = '#f2ecd0'; g.fillRect(-13, -19, 6, 2); g.fillRect(7, -19, 6, 2); // faros
    g.restore();
    if (!first) { g.save(); g.translate(X + T / 2, Y + T / 2); g.rotate(vert ? Math.PI : Math.PI / 2); g.fillStyle = '#6f8fae'; g.fillRect(-10, 6, 20, 4); g.fillStyle = '#b8352c'; g.fillRect(-13, 17, 5, 2); g.fillRect(8, 17, 5, 2); g.restore(); }
  } else if (t === SHELF) { // estantería con cajas de colores
    g.fillStyle = '#2a2a33'; g.fillRect(X + 3, Y + 1, T - 6, T - 2);
    const cols = ['#5b4630', '#3f4b5c', '#5c3b3b', '#4b5c3b', '#6a6a70'];
    for (let r = 0; r < 3; r++) {
      g.fillStyle = '#3c3c48'; g.fillRect(X + 3, Y + 2 + r * 12 + 10, T - 6, 2);
      let bx = X + 5;
      while (bx < X + T - 8) { const w = 5 + hash(x * 3 + r, y, bx) * 8; if (hash(x, y * 3 + r, bx) > 0.2) { g.fillStyle = cols[Math.floor(hash(bx, r, y) * cols.length)]; g.fillRect(bx, Y + 4 + r * 12, Math.min(w, X + T - 5 - bx), 8); } bx += w + 1; }
    }
  } else if (t === STAIRS) { // escalera: peldaños y barandilla; flecha hacia donde lleva
    g.fillStyle = '#272c35'; g.fillRect(X, Y, T, T);
    for (let k = 0; k < 5; k++) { g.fillStyle = z ? `rgba(0,0,0,${(0.08 * k).toFixed(2)})` : `rgba(255,255,255,${(0.025 * k).toFixed(3)})`; g.fillRect(X, Y + k * 8, T, 8); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X, Y + k * 8 + 7, T, 1); }
    g.fillStyle = '#4a5260'; if (M[c - 1] !== STAIRS) g.fillRect(X, Y, 3, T); if (M[c + 1] !== STAIRS) g.fillRect(X + T - 3, Y, 3, T);
    if (M[c + W] !== STAIRS && M[c + 1] !== STAIRS) { // en la última casilla, centrada en la escalera: arriba en planta baja, abajo en la primera
      const d = z ? 1 : -1; g.fillStyle = 'rgba(143,184,255,0.6)';
      g.beginPath(); g.moveTo(X, Y + 9 * d); g.lineTo(X - 9, Y - 5 * d); g.lineTo(X + 9, Y - 5 * d); g.closePath(); g.fill();
    }
  } else if (t === METAL) { // contenedor de chapa ondulada
    let ax = x, ay = y;
    while (M[ay * W + ax - 1] === METAL) ax--;
    while (M[(ay - 1) * W + ax] === METAL) ay--;
    const vert = M[(ay + 2) * W + ax] === METAL;
    g.fillStyle = ['#5a2b23', '#1f3a55', '#284a33', '#5a4a1f'][Math.floor(hash(ax, ay, 3) * 4)]; g.fillRect(X, Y, T, T);
    g.fillStyle = 'rgba(0,0,0,0.28)'; for (let k = 2; k < T; k += 5) vert ? g.fillRect(X, Y + k, T, 2) : g.fillRect(X + k, Y, 2, T);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    if (M[c - W] !== METAL) g.fillRect(X, Y, T, 2); if (M[c - 1] !== METAL) g.fillRect(X, Y, 2, T);
    g.fillStyle = 'rgba(0,0,0,0.35)'; if (M[c + W] !== METAL) g.fillRect(X, Y + T - 3, T, 3); if (M[c + 1] !== METAL) g.fillRect(X + T - 3, Y, 3, T);
  } else if (t === BARRIER) { // barrera de hormigón
    const h2 = M[c - 1] === BARRIER || M[c + 1] === BARRIER;
    g.save(); g.translate(X + T / 2, Y + T / 2); if (!h2) g.rotate(Math.PI / 2);
    g.fillStyle = '#3a3d42'; g.fillRect(-T / 2, -9, T, 18); g.fillStyle = '#4c5056'; g.fillRect(-T / 2, -3, T, 6);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(T / 2 - 1, -9, 1, 18); g.fillStyle = '#c9a227'; g.fillRect(-T / 2 + 4, -9, 6, 2); g.fillRect(4, -9, 6, 2);
    g.restore();
  } else if (t === TREE && (zone[c] || z === 1)) { // planta en maceta
    g.fillStyle = '#4a3324'; g.fillRect(X + 12, Y + 12, 16, 16); g.fillStyle = '#2a1d14'; g.fillRect(X + 14, Y + 14, 12, 12);
    for (const [dx, dy, r] of [[0, -6, 8], [-6, 2, 7], [6, 3, 7], [0, 0, 6]]) { g.fillStyle = '#2f5a36'; g.beginPath(); g.arc(X + T / 2 + dx, Y + T / 2 + dy, r, 0, 7); g.fill(); }
    g.fillStyle = '#3f7547'; g.beginPath(); g.arc(X + T / 2 - 3, Y + T / 2 - 7, 3, 0, 7); g.fill();
  } else if (t === TREE) { g.fillStyle = '#2c1f16'; g.beginPath(); g.arc(X + T / 2, Y + T / 2, 5, 0, 7); g.fill(); } // tronco (la copa va en la capa de encima)
}
// Copas de árboles y setos: sprites pequeños (tres variantes) que se pintan por encima de las personas (te esconden)
function makeSprites() {
  for (const kind of ['tree', 'bush']) for (let v = 0; v < 3; v++) {
    const R = kind === 'tree' ? 34 : 26, cv = sprites[kind][v] || (sprites[kind][v] = document.createElement('canvas'));
    cv.width = cv.height = Math.ceil(R * 2 * BS);
    const g = cv.getContext('2d');
    g.setTransform(BS, 0, 0, BS, R * BS, R * BS);
    g.clearRect(-R, -R, R * 2, R * 2);
    if (kind === 'tree') {
      g.fillStyle = '#152618'; g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill();
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + v, r = 13; g.fillStyle = '#1c3823'; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 11 + hash(v, i, 1) * 3, 0, 7); g.fill(); }
      for (let i = 0; i < 4; i++) { g.fillStyle = '#285034'; g.beginPath(); g.arc(-8 + hash(v, i, 9) * 10, -9 + hash(v, i, 4) * 8, 4 + hash(v, i, 2) * 3, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(6, 6, 16, 0, 7); g.fill();
    } else {
      for (let i = 0; i < 5; i++) { g.fillStyle = '#1a3322'; g.beginPath(); g.arc(-10 + hash(v, i, 3) * 20, -10 + hash(v, i, 5) * 20, 10 + hash(v, i, 8) * 4, 0, 7); g.fill(); }
      for (let i = 0; i < 4; i++) { g.fillStyle = '#29523a'; g.beginPath(); g.arc(-9 + hash(v, i, 20) * 16, -10 + hash(v, i, 30) * 14, 3, 0, 7); g.fill(); }
    }
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6; g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(cv, 0, 0); // mismo aclarado que el suelo
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
}
// Luz de las lámparas horneada con sombras suaves: una capa para recortar la oscuridad y otra de color
function bakeLamps() {
  for (let z = 0; z < maps.length; z++) {
    const b = lampMask[z] || (lampMask[z] = { cv: document.createElement('canvas') });
    Object.assign(b, { x0: 0, y0: 0, s: LBS });
    if (b.cv.width !== Math.ceil(W * T * LBS) || b.cv.height !== Math.ceil(H * T * LBS)) { b.cv.width = Math.ceil(W * T * LBS); b.cv.height = Math.ceil(H * T * LBS); }
    const m = layerCtx(b, 0, 0, W - 1, H - 1);
    if ('filter' in m) m.filter = 'blur(3px)'; // penumbra en los bordes de las sombras
    for (const l of room.lamps) if (l.on && l.z === z) { m.fillStyle = glow(m, l.x, l.y, l.r, '255,255,255', 0.6); fillPoly(m, l.poly); }
    m.restore();
  }
  lampMask.length = maps.length;
  for (const l of lampQueue.splice(0)) { // su zona del suelo, con o sin su color
    const r = Math.ceil(l.r / T) + 1, tx = Math.floor(l.x / T), ty = Math.floor(l.y / T);
    bakeRegion(l.z, tx - r, ty - r, tx + r, ty + r);
  }
  lampsDirty = false;
}

// ================= Render =================
function fillPoly(c, pts) {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath(); c.fill();
}
// alfa como número + toFixed: un alfa diminuto (1e-11) en texto rompe addColorStop y congelaba el juego
function glow(c, x, y, r, rgb, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a.toFixed(3)})`); g.addColorStop(0.4, `rgba(${rgb},${(a * 0.7).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  return g;
}
function render() {
  const S = zoom * dpr, p = room.p, up = p.z === 1;
  useFloor(p.z);
  if (lampsDirty) bakeLamps();
  const cx = cam.x + rnd(-cam.shake, cam.shake), cy = cam.y + rnd(-cam.shake, cam.shake);
  const ox = cw / 2 - cx * S, oy = ch / 2 - cy * S;
  const hw = cw / 2 / S, hh = ch / 2 / S;
  const onScreen = (x, y, m) => Math.abs(x - cx) < hw + m && Math.abs(y - cy) < hh + m;
  const here = o => o.z === p.z;
  // copia de una capa horneada: solo la parte visible
  const blit = (c, b) => {
    if (!b || !b.cv) return;
    const bx = b.x0 * T, by = b.y0 * T, bw = b.cv.width / b.s, bh = b.cv.height / b.s;
    const x0 = Math.max(bx, cx - hw), y0 = Math.max(by, cy - hh), x1 = Math.min(bx + bw, cx + hw), y1 = Math.min(by + bh, cy + hh);
    if (x1 > x0 && y1 > y0) c.drawImage(b.cv, (x0 - bx) * b.s, (y0 - by) * b.s, (x1 - x0) * b.s, (y1 - y0) * b.s, x0, y0, x1 - x0, y1 - y0);
  };

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, cw, ch);
  ctx.setTransform(S, 0, 0, S, ox, oy);
  const tx0 = Math.max(0, Math.floor((cx - hw) / T) - 1), tx1 = Math.min(W - 1, Math.floor((cx + hw) / T) + 1);
  const ty0 = Math.max(0, Math.floor((cy - hh) / T) - 1), ty1 = Math.min(H - 1, Math.floor((cy + hh) / T) + 1);
  const canopies = () => { // árboles y setos de la planta baja
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      const t = maps[0][y * W + x];
      if (t !== BUSH && (t !== TREE || zone[y * W + x])) continue;
      const sp = sprites[t === TREE ? 'tree' : 'bush'][Math.floor(hash(x, y, 2) * 3)], R = t === TREE ? 34 : 26;
      ctx.drawImage(sp, x * T + T / 2 - R, y * T + T / 2 - R, R * 2, R * 2);
    }
  };
  if (up) { ctx.globalAlpha = 0.28; blit(ctx, bakes[0]); canopies(); ctx.globalAlpha = 1; } // desde arriba, la planta baja se ve apagada
  blit(ctx, bakes[p.z]);
  for (const d of room.decals) if (here(d)) { ctx.fillStyle = d.scorch ? 'rgba(0,0,0,0.5)' : d.rubble ? 'rgba(80,86,96,0.7)' : 'rgba(110,20,20,0.75)'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); }
  for (const e of room.enemies) {
    const rr = visionRange(e);
    if (!here(e) || !onScreen(e.x, e.y, rr)) continue;
    ctx.fillStyle = `rgba(${CONE[e.state]},${e.state === 'combat' ? 0.2 : 0.14})`;
    fillPoly(ctx, visPoly(e.x, e.y, e.a, visionHalf(e), rr, 24));
  }
  // cuerpos
  for (const b of room.bodies) if (here(b)) {
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
    ctx.fillStyle = '#3a1716'; ctx.beginPath(); ctx.ellipse(4, 0, FOES[b.type].r + 3, FOES[b.type].r - 3, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  for (const it of room.items) if (here(it)) { ctx.fillStyle = '#5d5b2c'; ctx.fillRect(it.x - 8, it.y - 6, 16, 12); ctx.fillStyle = '#ffd98a'; ctx.fillRect(it.x - 8, it.y - 1, 16, 2); }
  for (const c of room.charges) if (here(c)) { ctx.fillStyle = '#3b3f2a'; ctx.fillRect(c.x - 5, c.y - 4, 10, 8); ctx.fillStyle = '#c9b48a'; ctx.fillRect(c.x - 5, c.y - 1, 10, 2); }
  // granadas
  for (const n of room.nades) if (here(n)) { ctx.fillStyle = '#4b5a3a'; ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, 7); ctx.fill(); }
  // enemigos
  for (const e of room.enemies) {
    if (!here(e) || !onScreen(e.x, e.y, 30)) continue;
    const F = FOES[e.type];
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(3, 4, e.r, 0, 7); ctx.fill();
    ctx.fillStyle = '#222';
    if (F.boss) ctx.fillRect(e.r - 6, -5, 26, 10);
    else if (F.post) ctx.fillRect(e.r - 4, -2, 26, 4);
    else if (!F.melee) ctx.fillRect(e.r - 4, -2.5, 14, 5);
    ctx.fillStyle = F.color; ctx.strokeStyle = '#1a0d0c'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (F.melee) ctx.ellipse(0, 0, e.r * 1.4, e.r * 0.8, 0, 0, 7); else ctx.arc(0, 0, e.r, 0, 7);
    ctx.fill(); ctx.stroke();
    if (F.shield) { ctx.fillStyle = '#9fb3cf'; ctx.fillRect(e.r - 1, -e.r - 2, 5, e.r * 2 + 4); }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(-3, 0, e.r * 0.5, 0, 7); ctx.fill();
    if (e.type === 'elite') { ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, e.r - 4, -1, 1); ctx.stroke(); }
    ctx.restore();
  }
  for (const e of room.enemies) if (e.aimT > 0 && here(e)) { // láser del francotirador: solo se ve donde llega tu luz
    const c = Math.cos(e.a), sn = Math.sin(e.a), L = castRay(e.x, e.y, c, sn, 700);
    ctx.strokeStyle = 'rgba(255,50,50,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + c * L, e.y + sn * L); ctx.stroke();
  }
  // jugador
  if (!p.dead) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(3, 4, p.r, 0, 7); ctx.fill();
    ctx.fillStyle = '#20262e'; ctx.fillRect(8, -3, 16, 6);
    ctx.fillStyle = p.hurtT > 0 ? '#ff8f80' : '#62d6ad'; ctx.strokeStyle = '#0b2a22'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(-3, 0, 6, 0, 7); ctx.fill();
    if (p.swingT > 0) {
      ctx.strokeStyle = `rgba(230,240,255,${(p.swingT / 0.18).toFixed(3)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 30, -1 + (1 - p.swingT / 0.18) * 1.2, 0.4 + (1 - p.swingT / 0.18) * 1.2); ctx.stroke();
    }
    ctx.restore();
  }
  if (!up) { // copas por encima de las personas; la primera planta apenas se intuye desde abajo
    ctx.globalAlpha = 0.93; canopies();
    if (maps[1]) { ctx.globalAlpha = 0.14; blit(ctx, bakes[1]); }
    ctx.globalAlpha = 1;
  }
  // balas
  ctx.lineCap = 'round';
  for (const b of room.bullets) {
    if (!here(b)) continue;
    ctx.strokeStyle = b.mine ? (b.bolt ? '#c9d6e3' : '#ffe9b0') : '#ff9a7a'; ctx.lineWidth = b.bolt ? 2.5 : 2;
    ctx.beginPath(); ctx.moveTo(b.x - b.vx * 0.018, b.y - b.vy * 0.018); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (const q of room.parts) if (here(q)) { ctx.fillStyle = q.c; ctx.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s); }

  // ---- Oscuridad: luz horneada de las lámparas + linterna, halo y fogonazos ----
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.globalCompositeOperation = 'source-over';
  lctx.fillStyle = '#000'; lctx.fillRect(0, 0, lightCv.width, lightCv.height);
  lctx.setTransform(S * LS, 0, 0, S * LS, ox * LS, oy * LS);
  lctx.globalCompositeOperation = 'destination-out';
  blit(lctx, lampMask[p.z]);
  let cone = null;
  if (!p.dead) {
    if (run.light) {
      cone = visPoly(p.x, p.y, p.a, 0.62, BEAM, 150);
      lctx.fillStyle = glow(lctx, p.x, p.y, BEAM, '0,0,0', 0.85); fillPoly(lctx, cone);
    }
    const amb = run.light ? HALO_ON : HALO_OFF;
    lctx.fillStyle = glow(lctx, p.x, p.y, amb, '0,0,0', run.light ? 0.7 : 0.45);
    fillPoly(lctx, visPoly(p.x, p.y, 0, Math.PI, amb, 48));
  }
  for (const f of room.flashes) if (here(f)) { lctx.fillStyle = glow(lctx, f.x, f.y, f.r, '0,0,0', f.t / f.max); fillPoly(lctx, f.poly); }
  // niebla: se pinta sobre la máscara, así solo enturbia lo que está iluminado
  fogPat = fogPat || lctx.createPattern(fogCv, 'repeat');
  const fx = (room.time * 9) % 256, fy = (room.time * 4) % 256;
  lctx.globalCompositeOperation = 'source-over';
  lctx.save(); lctx.translate(fx, fy); lctx.fillStyle = fogPat;
  lctx.fillRect(cx - hw - fx - 256, cy - hh - fy - 256, hw * 2 + 512, hh * 2 + 512);
  lctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(lightCv, 0, 0, cw, ch);
  ctx.setTransform(S, 0, 0, S, ox, oy);
  ctx.globalCompositeOperation = 'lighter'; // tono cálido de la linterna (el de las lámparas va horneado en el suelo)
  if (cone) { ctx.fillStyle = glow(ctx, p.x, p.y, BEAM, '255,217,138', 0.06); fillPoly(ctx, cone); }
  ctx.globalCompositeOperation = 'source-over';

  // ---- Lo que brilla por encima de la oscuridad ----
  const pulse = 0.6 + 0.4 * Math.sin(room.time * 4);
  ctx.font = '700 10px "Saira Semi Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (!up) {
    const locked = room.boss || (room.loot && !room.loot.taken), ec = !locked ? '70,230,140' : room.boss ? '255,84,68' : '125,140,160';
    ctx.fillStyle = `rgba(${ec},${(0.18 + 0.12 * pulse).toFixed(3)})`; ctx.fillRect(room.exit.x - 18, room.exit.y - 18, 36, 36);
    ctx.strokeStyle = ctx.fillStyle = `rgb(${ec})`; ctx.lineWidth = 2; ctx.strokeRect(room.exit.x - 18, room.exit.y - 18, 36, 36);
    ctx.fillText(room.boss ? 'BLOQUEADA' : 'SALIDA', room.exit.x, room.exit.y);
  }
  for (const l of room.lamps) if (l.on && here(l)) { ctx.fillStyle = `rgb(${l.rgb})`; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(l.x, l.y, 9, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#fff6e0'; ctx.beginPath(); ctx.arc(l.x, l.y, 4, 0, 7); ctx.fill(); }
  if (room.loot && !room.loot.taken && here(room.loot)) { // el botín brilla: se ve desde lejos para que sepas adónde ir
    const L = room.loot, k = 8 + 2 * pulse;
    ctx.fillStyle = `rgba(255,217,138,${(0.2 + 0.15 * pulse).toFixed(3)})`; ctx.beginPath(); ctx.arc(L.x, L.y, 20, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.moveTo(L.x, L.y - k); ctx.lineTo(L.x + k, L.y); ctx.lineTo(L.x, L.y + k); ctx.lineTo(L.x - k, L.y); ctx.closePath(); ctx.fill();
    ctx.fillText('BOTÍN', L.x, L.y - 26);
  }
  for (const c of room.charges) if (here(c) && Math.sin(room.time * 6) > 0) { ctx.fillStyle = '#ff5444'; ctx.beginPath(); ctx.arc(c.x, c.y, 2.5, 0, 7); ctx.fill(); } // C4 armada
  for (const n of room.nades) if (here(n) && Math.sin(n.t * (n.t < 0.6 ? 40 : 14)) > 0) { ctx.fillStyle = '#ff5444'; ctx.beginPath(); ctx.arc(n.x, n.y, 2.5, 0, 7); ctx.fill(); }
  const s = wstats(curW());
  if (s.laser && !p.dead) {
    const d = castRay(p.x, p.y, Math.cos(p.a), Math.sin(p.a), 600);
    ctx.strokeStyle = 'rgba(255,60,60,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.x + Math.cos(p.a) * 22, p.y + Math.sin(p.a) * 22); ctx.lineTo(p.x + Math.cos(p.a) * d, p.y + Math.sin(p.a) * d); ctx.stroke();
  }
  if (!p.dead) for (const w of room.warns) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(w.a);
    ctx.globalAlpha = Math.min(1, w.t * 1.5);
    ctx.fillStyle = ctx.strokeStyle = w.c; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 40, -0.32, 0.32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(56, 0); ctx.lineTo(45, -7); ctx.lineTo(48, 0); ctx.lineTo(45, 7); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  for (const r of room.rings) { // tu ruido se ve: así sabes cuánto has hecho
    if (r.kind === 'alert' || r.kind === 'eshot' || !here(r)) continue; // el de los guardias delataría dónde están
    const k = r.t / 0.7;
    ctx.strokeStyle = `rgba(200,225,255,${(0.45 * (1 - k)).toFixed(3)})`;
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (0.25 + 0.75 * k), 0, 7); ctx.stroke();
  }
  ctx.font = '700 18px "Saira Semi Condensed", sans-serif';
  for (const e of room.enemies) {
    if ((e.state === 'patrol' && e.aware < 0.05) || !lit(e.x, e.y, e.z)) continue;
    const yy = e.y - e.r - 14;
    if (e.state === 'combat') { ctx.fillStyle = '#ff5444'; ctx.fillText('!', e.x, yy); continue; }
    ctx.strokeStyle = 'rgba(255,181,71,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, yy, 9, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#ffb547'; ctx.beginPath(); ctx.arc(e.x, yy, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(e.aware, e.state === 'patrol' ? 0 : 0.35)); ctx.stroke();
    ctx.fillStyle = '#ffb547'; ctx.font = '700 12px "Saira Semi Condensed", sans-serif'; ctx.fillText('?', e.x, yy + 1);
    ctx.font = '700 18px "Saira Semi Condensed", sans-serif';
  }
  ctx.font = '700 13px "Saira Semi Condensed", sans-serif';
  for (const t of room.texts) if (here(t)) { ctx.globalAlpha = Math.min(1, t.t * 2); ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y); }
  ctx.globalAlpha = 1;
  drawHud();
}

function drawHud() {
  const p = room.p;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (p.hurtT > 0 || run.hp < 30 || room.alarm) {
    const a = Math.max(p.hurtT / 0.35 * 0.5, run.hp < 30 ? 0.2 + 0.1 * Math.sin(room.time * 5) : 0, room.alarm ? 0.13 + 0.1 * Math.sin(room.time * 7) : 0);
    const g = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.3, vw / 2, vh / 2, Math.max(vw, vh) * 0.7);
    g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(200,20,20,${a.toFixed(3)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
  }
  let goal = room.loot && !room.loot.taken ? [room.loot, '#ffd98a'] : !room.boss ? [{ ...room.exit, z: 0 }, '#46e68c'] : null;
  if (goal && goal[0].z !== p.z && room.stairs.length) {
    const st = room.stairs.map(c => ({ x: (c % W + 1) * T, y: (((c / W) | 0) + 1) * T })).reduce((a, b) => dist(a, p) < dist(b, p) ? a : b);
    goal = [st, '#8fb8ff'];
  }
  if (goal && !p.dead) { // si el objetivo está fuera de pantalla, una flecha en el borde
    const [g, col] = goal, sx = vw / 2 + (g.x - cam.x) * zoom, sy = vh / 2 + (g.y - cam.y) * zoom, m = 44;
    if (sx < m || sx > vw - m || sy < m || sy > vh - m) {
      const a = Math.atan2(sy - vh / 2, sx - vw / 2);
      const k = Math.min((vw / 2 - m) / (Math.abs(Math.cos(a)) || 1e-6), (vh / 2 - m) / (Math.abs(Math.sin(a)) || 1e-6));
      ctx.save(); ctx.translate(vw / 2 + Math.cos(a) * k, vh / 2 + Math.sin(a) * k); ctx.rotate(a);
      ctx.globalAlpha = 0.85; ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-7, -9); ctx.lineTo(-3, 0); ctx.lineTo(-7, 9); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
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
  if (room.boss) {
    const b = room.boss, bw2 = Math.min(300, uw - 320);
    ctx.font = '700 12px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#ff5444';
    ctx.fillText('EL ALCAIDE', uw / 2, y + 38);
    ctx.fillStyle = 'rgba(14,19,26,0.7)'; ctx.fillRect(uw / 2 - bw2 / 2, y + 54, bw2, 7);
    ctx.fillStyle = '#ff5444'; ctx.fillRect(uw / 2 - bw2 / 2, y + 54, bw2 * Math.max(0, b.hp) / b.maxHp, 7);
  }
  let by = y + (room.boss ? 70 : 40);
  const ts = Math.ceil(room.timer), clock = `${Math.floor(ts / 60)}:${String(ts % 60).padStart(2, '0')}`;
  if (room.alarm) {
    ctx.font = '700 22px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = Math.sin(room.time * 8) > 0 ? '#ff5444' : '#ffb547';
    ctx.fillText(`ALARMA ${clock}`, uw / 2, y + 36);
    by = y + 66;
  } else if (room.loot) {
    ctx.font = '700 18px "Saira Semi Condensed", sans-serif';
    ctx.fillStyle = ts <= 10 && Math.sin(room.time * 8) > 0 ? '#ff5444' : ts <= 30 ? '#ffb547' : '#ffd98a';
    ctx.fillText(`TIEMPO ${clock}`, uw / 2, y + 34);
    ctx.font = '600 11px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#ffd98a';
    ctx.fillText('ROBA EL BOTÍN Y ESCAPA', uw / 2, y + 56);
    by = y + 74;
  } else if (room.boss) {
    ctx.font = '700 12px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = ts <= 30 ? '#ff5444' : '#7d8ca0';
    ctx.fillText(`TIEMPO ${clock}`, uw / 2 + Math.min(300, uw - 320) / 2 + 40, y + 52);
  }
  if (room.banner) {
    ctx.globalAlpha = Math.min(1, room.banner.t * 2);
    ctx.font = '700 15px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#ffd98a';
    ctx.fillText(room.banner.text, uw / 2, by);
    ctx.globalAlpha = 1;
  }

  if (!touchMode && run.level === 1 && room.time < 16) {
    ctx.font = '600 13px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = 'rgba(217,226,236,0.6)';
    ctx.fillText('WASD mover · Mayús sigilo · ratón apunta y dispara · E cuchillo · G granada · B C4 · Q ruido · F linterna · R recargar · 1-5 arma', uw / 2, uh - 86);
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
  const key = `${s.name}|${w.ammo}|${w.reserve}|${run.nades}|${run.charges}|${room.charges.length}|${run.light}|${p.reloadT > 0}|${touchMode}|${run.weapons.length}`;
  if (p.reloadT > 0) $('bWeapon').style.setProperty('--p', `${100 * (1 - p.reloadT / s.reload)}%`);
  if (key === hudKey) return;
  hudKey = key;
  $('wName').textContent = (s.name + (run.weapons.length > 1 ? ' ⇄' : '')).toUpperCase();
  $('wAmmo').textContent = p.reloadT > 0 ? 'RECARGANDO' : w.ammo || w.reserve ? `${w.ammo} / ${w.reserve}` : 'SIN MUNICIÓN';
  $('acts').hidden = !touchMode;
  if (p.reloadT <= 0) $('bWeapon').style.setProperty('--p', '0%');
  $('nadeN').textContent = run.nades;
  $('bNade').classList.toggle('off', !run.nades);
  $('chargeN').textContent = run.charges;
  $('bBreach').classList.toggle('off', !run.charges && !room.charges.length);
  $('bBreach').querySelector('small').textContent = room.charges.length ? 'Detonar' : 'C4';
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
    html += item('C4', `Se planta casi sin ruido y estalla cuando la detonas: abre paredes y cajas, o sirve de trampa. Tienes ${run.charges} (máx. 4)`, 'charge', '$70', run.money < 70 || run.charges >= 4);
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
  else if (k === 'charge') { pay(70); run.charges++; }
  else if (k === 'med') { pay(50); run.hp = Math.min(run.maxHp, run.hp + 40); }
  else if (k === 'maxhp') { pay(220); run.maxHp += 25; run.hp += 25; }
  renderShop();
  save();
}

// ================= Audio (sintetizado, sin archivos) =================
// Reverberación (más dentro que fuera), panorama según dónde suena y ambiente: viento fuera, zumbido eléctrico dentro
let ac = null, noiseBuf = null, master = null, verb = null, amb = null, out = null, rvAmt = 0;
function initAudio() {
  if (ac) { ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6; comp.attack.value = 0.002; comp.release.value = 0.2;
    comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = 0.8; master.connect(comp);
    out = master;
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const len = Math.floor(ac.sampleRate * 1.6), ir = ac.createBuffer(2, len, ac.sampleRate); // respuesta de una sala: ruido que se apaga
    for (let c = 0; c < 2; c++) { const b = ir.getChannelData(c); for (let i = 0; i < len; i++) b[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    const conv = ac.createConvolver(); conv.buffer = ir;
    verb = ac.createGain(); verb.connect(conv);
    const wet = ac.createGain(); wet.gain.value = 0.55; conv.connect(wet).connect(comp);
    const wind = ac.createBufferSource(); wind.buffer = noiseBuf; wind.loop = true;
    const wf = ac.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 360;
    const wg = ac.createGain(); wg.gain.value = 0;
    wind.connect(wf).connect(wg).connect(master); wind.start();
    const hum = ac.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 50;
    const hf = ac.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 150;
    const hg = ac.createGain(); hg.gain.value = 0;
    hum.connect(hf).connect(hg).connect(master); hum.start();
    amb = { wg, hg };
  } catch (e) { ac = null; }
}
const indoors = () => room && (room.p.z === 1 || zone[cellOf(room.p.x, room.p.y)] === 1);
function ambience(on) {
  if (!amb) return;
  const t = ac.currentTime, inside = on && indoors();
  amb.wg.gain.setTargetAtTime(!on ? 0 : inside ? 0.01 : 0.045 + 0.03 * Math.sin(t * 0.6) * Math.sin(t * 0.23), t, 0.4); // rachas
  amb.hg.gain.setTargetAtTime(inside ? 0.018 : 0, t, 0.4);
}
function send(g) {
  g.connect(out);
  if (rvAmt > 0) { const s = ac.createGain(); s.gain.value = rvAmt; g.connect(s).connect(verb); }
}
function burst(dur, vol, freq, type = 'lowpass', q = 0.8, delay = 0, f1 = 0) {
  const t = ac.currentTime + delay, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf; src.loop = true; f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g); send(g);
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
}
function tone(f0, f1, dur, vol, type = 'square', delay = 0) {
  const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); send(g);
  o.start(t); o.stop(t + dur + 0.02);
}
function gunshot(vol, pitch) {
  pitch *= rnd(0.92, 1.08); // que dos tiros seguidos no suenen idénticos
  rvAmt *= 1.5;
  burst(0.045, 1.3 * vol, 3200 * pitch, 'highpass');
  burst(0.25, 1.2 * vol, 1500 * pitch);
  tone(180 * pitch, 38, 0.22, 1.1 * vol, 'sine');
  burst(0.8, 0.32 * vol, 650 * pitch);
  tone(2600, 1900, 0.025, 0.12 * vol, 'square', 0.05); // corredera
}
const clatter = (n, v, t0) => { for (let i = 0; i < n; i++) burst(0.05, v * rnd(0.4, 1), rnd(900, 2600), 'bandpass', 2.5, t0 + rnd(0, 0.5)); };
function sfx(k, x, y) {
  if (!ac || ac.state !== 'running') return;
  const p = room && room.p;
  let v = 1, pan = 0;
  if (x !== undefined && p) { v = clamp(1 - Math.hypot(x - p.x, y - p.y) / 900, 0.05, 1); pan = clamp((x - p.x) / 500, -0.85, 0.85); }
  rvAmt = indoors() ? 0.4 : 0.14;
  out = master;
  if (pan && ac.createStereoPanner) { out = ac.createStereoPanner(); out.pan.value = pan; out.connect(master); }
  switch (k) {
    case 'shot': gunshot(1, 1); break;
    case 'sil': burst(0.06, 0.35, 2600, 'bandpass', 1.4); tone(1800, 1400, 0.03, 0.12, 'square', 0.02); break;
    case 'shotgun': gunshot(1.3, 0.7); burst(0.5, 0.8, 500); break;
    case 'bolt': tone(900, 300, 0.08, 0.12, 'triangle'); burst(0.05, 0.2, 5000, 'highpass'); break;
    case 'eshot': gunshot(0.9 * v, 0.95); break;
    case 'knife': burst(0.14, 0.35, 900, 'bandpass', 1.5, 0, 4500); tone(150, 70, 0.08, 0.2, 'sine', 0.08); break;
    case 'boom':
      rvAmt *= 1.6;
      burst(0.08, 1.4 * v, 2500, 'highpass'); burst(1.6, 1.4 * v, 320); tone(70, 22, 1.2, 1.2 * v, 'sine');
      clatter(7, 0.3 * v, 0.25); break;
    case 'crumble': burst(0.9, 0.6 * v, 260); clatter(6, 0.35 * v, 0.1); break;
    case 'wood': burst(0.06, 0.6 * v, 1800, 'bandpass', 2); burst(0.25, 0.35 * v, 600); clatter(3, 0.25 * v, 0.08); break;
    case 'glass': burst(0.2, 0.5 * v, 6000, 'highpass'); for (let i = 0; i < 8; i++) { const f = rnd(2600, 7000); tone(f, f * 0.97, 0.16, 0.05 * v, 'sine', i * 0.035 + rnd(0, 0.05)); } break;
    case 'step':
      if (indoors()) { burst(0.03, 0.12, 1100, 'bandpass', 1.2); burst(0.04, 0.08, 500, 'lowpass', 1, 0.07); }
      else burst(0.06, 0.1, 2200, 'bandpass', 0.6); // grava
      break;
    case 'estep': burst(0.035, 0.11 * v, rnd(700, 1100), 'bandpass', 1.2); burst(0.04, 0.07 * v, 450, 'lowpass', 1, 0.06); break;
    case 'paw': burst(0.025, 0.07 * v, 1600, 'bandpass', 1.5); break;
    case 'stairs': for (let i = 0; i < 4; i++) burst(0.04, 0.1, 900 - i * 80, 'bandpass', 1.2, i * 0.09); break;
    case 'whistle': tone(1400, 2100, 0.14, 0.15, 'sine'); tone(1500, 2300, 0.22, 0.15, 'sine', 0.17); break;
    case 'alert': burst(0.12, 0.2 * v, 1800, 'bandpass', 3); tone(1200, 900, 0.08, 0.1 * v, 'square', 0.1); burst(0.05, 0.15 * v, 2500, 'bandpass', 3, 0.2); break; // radio
    case 'bark': for (const t0 of [0, 0.2]) { tone(520, 260, 0.12, 0.3 * v, 'sawtooth', t0); burst(0.1, 0.3 * v, 900, 'bandpass', 2, t0); } break;
    case 'hit': tone(200, 60, 0.15, 0.35, 'sawtooth'); burst(0.08, 0.3, 500); break;
    case 'reload': burst(0.04, 0.3, 2200, 'bandpass', 4); burst(0.05, 0.4, 1600, 'bandpass', 4, 0.35); burst(0.08, 0.3, 3000, 'bandpass', 2, 0.55); break;
    case 'empty': tone(1200, 1100, 0.03, 0.1); break;
    case 'buy': tone(660, 990, 0.12, 0.15, 'triangle'); tone(990, 1320, 0.15, 0.12, 'triangle', 0.1); break;
    case 'throw': burst(0.15, 0.25, 700, 'bandpass', 1.2, 0, 2400); break;
    case 'gore': burst(0.12, 0.3 * v, 400); tone(90, 50, 0.1, 0.2 * v, 'sine'); break;
    case 'bite': burst(0.09, 0.5 * v, 900); tone(240, 90, 0.12, 0.35 * v, 'sawtooth'); break;
    case 'clank': tone(1900, 1300, 0.07, 0.25 * v); burst(0.05, 0.3 * v, 4500, 'highpass'); break;
    case 'charge': tone(300, 1100, 0.9, 0.07 * v, 'sine'); break;
    case 'plant': burst(0.03, 0.2, 2500, 'bandpass', 3); tone(1800, 1800, 0.05, 0.08, 'square', 0.12); break;
    case 'click': tone(1600, 1600, 0.03, 0.12); tone(800, 800, 0.05, 0.1, 'square', 0.05); break;
    case 'siren':
      for (const det of [0, 9]) { tone(620 + det, 1080 + det, 0.5, 0.07, 'sawtooth'); tone(1080 + det, 620 + det, 0.5, 0.07, 'sawtooth', 0.5); }
      break;
  }
}

// ================= Entrada =================
function show(id) {
  ambience(id === null);
  for (const o of ['menu', 'shop', 'pause', 'over', 'win']) $(o).hidden = o !== id;
  $('hud').hidden = id !== null;
}
function resize() {
  vw = innerWidth; vh = innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, touchMode ? 1.5 : 2, Math.sqrt(4e6 / (vw * vh))); // tope de píxeles: los móviles van justos de relleno
  cw = cv.width = Math.round(vw * dpr);
  ch = cv.height = Math.round(vh * dpr);
  LS = touchMode ? 0.5 : 0.75;
  lightCv.width = Math.round(cw * LS); lightCv.height = Math.round(ch * LS);
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
press('bBreach', breach);
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
  const act = { KeyE: melee, KeyG: throwNade, KeyB: breach, KeyQ: makeNoise, KeyR: reload, KeyF: toggleLight, Tab: cycleWeapon }[e.code];
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
  run = { charges: 2, ...d.run, snap: null }; // las partidas de antes de las cargas empiezan con 2
  if (d.shop) openShop('Partida guardada. Prepárate para la siguiente sala.'); else startRoom();
});
refreshMenu();
$('bResume').addEventListener('click', () => { state = 'play'; show(null); });
$('bRestart').addEventListener('click', retryRoom);
$('bQuit').addEventListener('click', () => { state = 'menu'; room = null; refreshMenu(); show('menu'); });
$('bRetry').addEventListener('click', () => { initAudio(); retryRoom(); });
$('bNew').addEventListener('click', () => { initAudio(); newRun(); startRoom(); });
$('bNext').addEventListener('click', () => { initAudio(); startRoom(); });
$('bWinGo').addEventListener('click', () => openShop(winStats));
$('bWinNew').addEventListener('click', () => { begin(); newRun(); startRoom(); });
document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { shopTab = b.dataset.tab; modSel = run.cur; renderShop(); } });
$('shopList').addEventListener('click', e => { const b = e.target.closest('button[data-act]'); if (b && !b.disabled) shopAct(b.dataset.act); });

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame); // primero: si algo falla en este fotograma, el juego no se congela
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (state === 'play') update(dt);
  if (room) render();
  else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#07090d'; ctx.fillRect(0, 0, cw, ch); }
}
requestAnimationFrame(frame);

// Gancho para las pruebas automáticas (test/smoke.js)
window.__apagon = { get run() { return run; }, get room() { return room; }, get state() { return state; }, buildRoom, castRay, bfs, findPath, cellOf, noise, hurtPlayer, hurtEnemy, startRoom, breach, useFloor, lit, get view() { return { cam, S: zoom * dpr, cw, ch }; } };
})();
