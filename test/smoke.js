// Prueba de humo en un móvil emulado: node test/smoke.js  (SHOTS=carpeta guarda capturas)
const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  // el 3D se dibuja en calidad baja: el WebGL por software de las pruebas va justo de relleno (la lógica es la misma)
  const lowGfx = () => { try { const k = 'apagon-ajustes', q = JSON.parse(localStorage.getItem(k) || '{}'); if (!q.gfx) localStorage.setItem(k, JSON.stringify({ ...q, gfx: 'baja', shadows: false })); } catch (e) { /* sin almacenamiento */ } };
  await ctx.addInitScript(lowGfx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_/.test(m.text())) errors.push(m.text()); });
  const shot = name => process.env.SHOTS && page.screenshot({ path: path.join(process.env.SHOTS, name + '.png') });
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const story = async pg => { if (await pg.isVisible('#bStGo')) await pg.click('#bStGo'); }; // escena de historia antes de algunas misiones
  const server = await require('./serve')(), url = server.url;
  await page.goto(url);
  assert(await page.isVisible('#boot'), 'al abrir sale la pantalla de carga');
  await page.waitForSelector('#boot', { state: 'detached', timeout: 8000 });
  assert.strictEqual(await page.evaluate(() => { const p = document.querySelector('#menu .panel'); return p.scrollHeight - p.clientHeight; }), 0, 'el menú cabe en la pantalla del móvil sin desplazarse');
  await shot('menu');

  // Generación: la salida, los enemigos y el botín son alcanzables desde la entrada (el botín de una cámara, solo con la puerta abierta)
  const gen = await ev(() => {
    const A = window.__apagon, out = [];
    for (let lvl = 1; lvl <= 17; lvl++) for (let k = 0; k < 6; k++) {
      const r = A.buildRoom(lvl, lvl * 1000 + k);
      const reach = () => {
        const d = A.bfs(A.cellOf(r.start.x, r.start.y));
        let du = null;
        if (r.maps[1]) { A.useFloor(1); du = A.bfs(r.stairs[0]); A.useFloor(0); }
        return { d, ok: (o, z) => z ? du && du[A.cellOf(o.x, o.y)] >= 0 && d[r.stairs[0]] > 0 : d[A.cellOf(o.x, o.y)] >= 0 };
      };
      const shut = reach(), sealed = !r.doors.length || !shut.ok(r.loot, r.loot.z), out0 = shut.d[A.cellOf(r.exit.x, r.exit.y)] > 5; // la salida nunca exige pasar por la cámara
      for (const dr of r.doors) for (const c of dr.cells) r.maps[dr.z][c] = 0; // abierta con el código o hackeada
      const { d, ok } = reach(), vault = ['banco', 'datos'].includes(r.mission.scene);
      out.push({ lvl, k, n: r.enemies.length, exit: out0 && d[A.cellOf(r.exit.x, r.exit.y)] > 5, foes: r.enemies.every(e => ok(e, e.z)), path: !!A.findPath(r.start.x, r.start.y, r.exit.x, r.exit.y),
        loot: r.mission.boss ? !r.loot : ok(r.loot, r.loot.z) && r.maps[r.loot.z][A.cellOf(r.loot.x, r.loot.y)] === 0, upper: !!r.maps[1],
        sealed, vault: !vault || (r.doors.length > 0 && /^\d{4}$/.test(r.code)), name: r.mission.name });
    }
    return out;
  });
  for (const g of gen) assert(g.exit && g.foes && g.path && g.loot && g.sealed && g.vault && g.n >= 3, 'mapa inválido ' + JSON.stringify(g));
  assert(gen.some(g => g.upper), 'algunas salas deben tener primera planta');
  // castRay: desde el centro de la casilla (1,1) hacia el muro exterior izquierdo hay 20 px
  assert.strictEqual(await ev(() => __apagon.castRay(60, 60, -1, 0, 500)), 20);
  // Salen los 9 tipos de enemigo en las primeras salas y la sala 8 es la del jefe
  const kinds = await ev(() => {
    const A = __apagon, seen = new Set();
    for (let lvl = 1; lvl <= 7; lvl++) for (let k = 0; k < 4; k++) A.buildRoom(lvl, lvl * 31 + k).enemies.forEach(e => e.type !== 'civil' && seen.add(e.type));
    const b = A.buildRoom(8, 5);
    return { seen: [...seen].sort(), bosses: b.enemies.filter(e => e.type === 'boss').length, boss: b.boss && b.boss.type };
  });
  for (const t of ['dog', 'elite', 'guard', 'heavy', 'shield', 'sniper', 'taser', 'drone', 'agent']) assert(kinds.seen.includes(t), `debe aparecer el enemigo ${t}: ${kinds.seen}`);
  assert.deepStrictEqual([kinds.bosses, kinds.boss], [1, 'boss']);

  // Menú → briefing de la misión 1 → a jugar
  await page.tap('#bPlay');
  assert.deepStrictEqual(await ev(() => [__apagon.state, document.getElementById('stTitle').textContent]), ['story', 'Primer trabajo'], 'la historia empieza antes de la primera misión');
  await shot('story');
  await story(page);
  assert.deepStrictEqual(await ev(() => [__apagon.state, document.getElementById('bfName').textContent]), ['brief', 'POLILLA']);
  await shot('brief');
  await page.tap('#bGo');
  await page.waitForTimeout(300);
  assert.strictEqual(await ev(() => __apagon.state), 'play');
  const t0 = await ev(() => __apagon.room.timer);
  await page.waitForTimeout(1100);
  assert(t0 > 60 && await ev(() => __apagon.room.timer) < t0 - 0.5, 'la cuenta atrás corre desde que entras');
  // Regresión: un fogonazo casi apagado (alfa 1e-12) congelaba el juego al dibujarse
  await page.keyboard.press('Escape');
  await ev(() => { const p = __apagon.room.p; __apagon.room.flashes.push({ x: p.x, y: p.y, r: 50, t: 1e-12, max: 0.08, poly: [p.x, p.y, p.x + 40, p.y, p.x, p.y + 40] }); });
  await page.waitForTimeout(150);
  assert.deepStrictEqual(errors, [], 'dibujar un fogonazo casi apagado no debe fallar');
  await page.click('#bResume');
  const cdp = await ctx.newCDPSession(page);
  const touch = async (id, x0, y0, x1, y1, ms) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id }] });
    for (let i = 1; i <= 5; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / 5, y: y0 + (y1 - y0) * i / 5, id }] });
    await page.waitForTimeout(ms);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };

  // Primera persona: el stick izquierdo mueve (hacia donde miras), arrastrar a la derecha gira la vista y el botón dispara
  assert(await ev(() => __apagon.fps3d), 'el juego va en 3D (WebGL)');
  const p0 = await ev(() => ({ ...__apagon.room.p }));
  await touch(1, 120, 300, 120, 240, 700); // stick hacia arriba: adelante
  const p1 = await ev(() => ({ ...__apagon.room.p }));
  assert(Math.hypot(p1.x - p0.x, p1.y - p0.y) > 20, 'el stick izquierdo debe mover al jugador');
  assert((p1.x - p0.x) * Math.cos(p0.a) + (p1.y - p0.y) * Math.sin(p0.a) > 10, 'stick arriba: avanza hacia donde mira');
  const a0 = await ev(() => __apagon.room.p.a);
  await touch(2, 560, 200, 640, 200, 150);
  const turned = await ev(a => __apagon.room.p.a - a, a0);
  assert(turned > 0.2, 'arrastrar a la derecha gira la vista: ' + turned);
  const fireAt = async ms => { const b = await page.$eval('#bFire', e => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b[0], y: b[1], id: 5 }] }); await page.waitForTimeout(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  await fireAt(500);
  assert(await ev(() => __apagon.run.weapons[0].ammo < 12 || __apagon.room.p.reloadT > 0), 'el botón de disparo debe disparar');
  // Botón de sigilo: con él activado, el stick a fondo no pasa de sigilo
  await page.tap('#bSneak');
  await ev(() => { const A = __apagon, p = A.room.p; A.useFloor(p.z); let best = 0, ba = p.a; for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, d = A.castRay(p.x, p.y, Math.cos(a), Math.sin(a), 400); if (d > best) { best = d; ba = a; } } p.a = ba; }); // mirando a un sitio despejado
  const sneakMove = await (async () => { const t = touch(1, 120, 300, 120, 230, 500); await page.waitForTimeout(350); const r = await ev(() => [__apagon.room.p.sneak, Math.round(__apagon.room.p.speed)]); await t; return r; })();
  await page.tap('#bSneak');
  assert(sneakMove[0] && sneakMove[1] > 5 && sneakMove[1] <= 80, 'con el sigilo activado se mueve en sigilo (sin pasar de su velocidad): ' + sneakMove);
  await shot('play');

  // Munición limitada: recargar gasta reserva, sin reserva no dispara, las cajas la reponen
  await ev(() => { const w = __apagon.run.weapons[0]; w.ammo = 0; w.reserve = 5; __apagon.room.p.reloadT = 0; });
  await page.keyboard.press('KeyR');
  await page.waitForFunction(() => __apagon.room.p.reloadT <= 0, null, { timeout: 6000 }); await page.waitForTimeout(100);
  assert.deepStrictEqual(await ev(() => { const w = __apagon.run.weapons[0]; return [w.ammo, w.reserve]; }), [5, 0]);
  await ev(() => { __apagon.run.weapons[0].ammo = 0; });
  await fireAt(400);
  assert.strictEqual(await ev(() => __apagon.room.bullets.filter(b => b.mine).length), 0, 'sin munición no debe disparar');
  const got = await ev(async () => { const r = __apagon.room; r.items.push({ x: r.p.x, y: r.p.y, z: r.p.z }); await new Promise(f => setTimeout(f, 150)); return __apagon.run.weapons[0].reserve; });
  assert.strictEqual(got, 12, 'una caja da el 25 % de la reserva máxima');

  // Oído: un ruido leve da sospecha; un disparo, investigación urgente
  const heard = await ev(() => {
    const A = __apagon, e = A.room.enemies.find(e => e.type !== 'civil'); e.state = 'patrol';
    A.room.warns.length = 0;
    A.noise(e.x + 20, e.y, 100, 'whistle'); const s1 = e.state, warned = A.room.warns.some(w => w.e === e);
    A.noise(e.x + 20, e.y, 500, 'shot');
    return { s1, warned, s2: e.state, urgent: e.urgent };
  });
  assert.deepStrictEqual(heard, { s1: 'suspicious', warned: true, s2: 'investigate', urgent: true });

  // Todo oscuro: un guardia delante, lejos de las lámparas y con la linterna apagada, apenas se ve; la linterna lo ilumina
  const dark = await ev(() => {
    const A = __apagon, r = A.room;
    const light = ['guard', 'police', 'heavy', 'shield', 'taser'], cand = r.enemies.filter(e => !['civil', 'drone', 'dog', 'elite', 'sniper'].includes(e.type)).sort((a, b) => light.indexOf(b.type) - light.indexOf(a.type) < 0 ? -1 : 1); // ropa clara primero: la linterna se nota más
    for (const e of cand) for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
      A.useFloor(e.z);
      if (r.loot && Math.hypot(e.x - r.loot.x, e.y - r.loot.y) < 120) continue; // el botín brilla
      if (A.castRay(e.x, e.y, c, s, 150) < 150) continue;
      if (r.lamps.some(l => l.on && l.z === e.z && Math.hypot(l.x - e.x, l.y - e.y) < l.r + 40)) continue;
      r.p.x = e.x + c * 110; r.p.y = e.y + s * 110; r.p.z = e.z; r.p.a = a + Math.PI; // mirándolo de frente
      Object.assign(e, { state: 'patrol', aware: 0, a: a + Math.PI, lookA: a + Math.PI, waitT: 99, lookT: 99, path: null });
      window.__dark = e; r.enemies.splice(0, r.enemies.length, e); r.flashes.length = 0; r.copCars.length = 0; window.__loot = r.loot; r.loot = null; // nada más que dé luz
      A.run.light = false; A.G3.pitch = 0;
      return true;
    }
    return false;
  });
  if (dark) {
    await page.waitForTimeout(700);
    const lum = () => ev(() => { // dibuja y lee el píxel del pecho del guardia en el lienzo 3D
      const A = __apagon, G = A.G3, e = window.__dark, r = A.room; e.x = e.x; r.p.a = Math.atan2(e.y - r.p.y, e.x - r.p.x);
      G.cam.rotation.y = -r.p.a - Math.PI / 2; G.cam.rotation.x = 0; G.cam.updateMatrixWorld();
      const v = new THREE.Vector3(e.x, e.z * 134 + 47, e.y).project(G.cam), gl = G.R.getContext(), cvs = G.R.domElement;
      G.R.clear(); G.R.render(G.S, G.cam);
      const x = Math.round((v.x + 1) / 2 * cvs.width), y = Math.round((v.y + 1) / 2 * cvs.height), px = new Uint8Array(4 * 25);
      gl.readPixels(x - 2, y - 2, 5, 5, gl.RGBA, gl.UNSIGNED_BYTE, px); // media de 5×5 en el pecho
      let t = 0; for (let i = 0; i < 25; i++) t += (px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2]) / 3;
      return Math.round(t / 25);
    });
    const off = await lum();
    await ev(() => { __apagon.run.light = true; });
    await page.waitForTimeout(300);
    const on = await lum();
    await ev(() => { __apagon.room.loot = window.__loot; });
    if (!(off < 50 && on > off + 10)) await shot('darkfail');
    const why = await ev(() => { const A = __apagon, G = A.G3, e = window.__dark, r = A.room; return JSON.stringify({ alive: r.enemies.includes(e), st: e.state, type: e.type, dead: r.p.dead, z: [e.z, r.p.z], rig: G.rigs.has(e), cam: [Math.round(G.cam.position.x - r.p.x), Math.round(G.cam.position.y), Math.round(G.cam.position.z - r.p.y)], d: Math.round(Math.hypot(e.x - r.p.x, e.y - r.p.y)), state: A.state }); });
    assert(off < 50 && on > off + 10, `a oscuras el guardia apenas se ve y con la linterna sí (sin luz ${off}, con luz ${on}) ${why}`);
  } else console.warn('aviso: ningún guardia apto; se omite la prueba de oscuridad');

  // Vista: plantado delante de un guardia, acaba detectándote
  const placed = await ev(() => {
    const A = __apagon, r = A.room;
    for (const e of r.enemies.filter(e => !['civil', 'agent', 'drone', 'dog'].includes(e.type))) for (let k = 0; k < 8; k++) {
      const t = k * Math.PI / 4, c = Math.cos(t), s = Math.sin(t);
      A.useFloor(e.z);
      if (A.castRay(e.x, e.y, c, s, 90) >= 90) {
        r.p.x = e.x + c * 70; r.p.y = e.y + s * 70; r.p.z = e.z;
        Object.assign(e, { state: 'patrol', aware: 0, path: null, a: t, waitT: 5, lookA: t, lookT: 5 });
        window.__target = e;
        r.enemies.splice(0, r.enemies.length, e); // solo él: que no lo distraigan los disparos de otros
        return 0;
      }
    }
    return -1;
  });
  if (placed >= 0) {
    await page.waitForFunction(() => window.__target.state === 'combat', null, { timeout: 5000 }).catch(() => {});
    assert.strictEqual(await ev(() => window.__target.state), 'combat', 'el guardia debe detectar al jugador');
    await shot('combat');
  } else console.warn('aviso: ningún guardia con hueco delante; se omite la prueba de vista');

  // Muerte y reintento restauran el estado con el que se entró
  await ev(() => __apagon.hurtPlayer(999));
  await page.waitForTimeout(1600);
  assert.strictEqual(await ev(() => __apagon.state), 'over');
  await page.click('#bRetry');
  assert.strictEqual(await ev(() => __apagon.run.hp), 100);

  // Cuchillo por la espalda: eliminación silenciosa
  const behind = await ev(() => {
    const A = __apagon, r = A.room;
    for (const e of r.enemies.filter(e => e.type !== 'civil')) {
      const c = Math.cos(e.a), s = Math.sin(e.a);
      A.useFloor(e.z);
      if (A.castRay(e.x, e.y, -c, -s, 50) >= 50) { r.p.x = e.x - c * 30; r.p.y = e.y - s * 30; r.p.z = e.z; r.p.a = e.a; e.waitT = 5; e.lookT = 5; e.lookA = e.a; return r.enemies.length; }
    }
    return -1;
  });
  if (behind >= 0) {
    await page.tap('#bKnife');
    assert(await ev(() => __apagon.room.silent === 1), 'el cuchillo por la espalda debe eliminar en silencio');
  } else console.warn('aviso: ningún guardia con hueco detrás; se omite la prueba de cuchillo');

  // Escudo: para las balas de frente, no las de la espalda
  const shield = await ev(async () => {
    const A = __apagon, r = A.room, wait = ms => new Promise(f => setTimeout(f, ms));
    A.run.hp = 1000; // el escudo dispara al jugador; aquí solo importan las balas que recibe él
    for (const e of r.enemies.filter(e => e.type !== 'civil')) for (let k = 0; k < 8; k++) {
      const t = k * Math.PI / 4;
      A.useFloor(e.z);
      if (A.castRay(e.x, e.y, Math.cos(t), Math.sin(t), 45) < 45 || A.castRay(e.x, e.y, -Math.cos(t), -Math.sin(t), 45) < 45) continue;
      r.enemies.splice(0, r.enemies.length, e);
      Object.assign(e, { type: 'shield', r: 15, hp: 120, state: 'patrol', a: t, lookA: t, waitT: 9, lookT: 9 });
      const shoot = back => { const a = e.a + (back ? Math.PI : 0); r.bullets.push({ z: e.z, x: e.x + Math.cos(a) * 32, y: e.y + Math.sin(a) * 32, vx: -Math.cos(a) * 900, vy: -Math.sin(a) * 900, dmg: 26, mine: true, life: 1 }); };
      const settle = async () => { for (let i = 0; i < 20 && r.bullets.some(b => b.mine); i++) await wait(50); };
      shoot(false); await settle();
      const front = e.hp;
      Object.assign(e, { state: 'patrol', aware: 0, a: t, lookA: t, waitT: 9, lookT: 9 }); // el golpe le hace girarse: otra vez de espaldas
      shoot(true); await settle();
      return [front, e.hp];
    }
    return null;
  });
  if (shield) assert.deepStrictEqual(shield, [120, 94], 'el escudo para de frente y no de espaldas');
  else console.warn('aviso: ningún guardia con hueco; se omite la prueba de escudo');

  // Perro: te huele aunque vayas a oscuras y en sigilo, por la espalda
  const dog = await ev(async () => {
    const A = __apagon, r = A.room, e = r.enemies.find(e => e.type !== 'civil');
    for (let k = 0; e && k < 8; k++) {
      const t = k * Math.PI / 4;
      A.useFloor(e.z);
      if (A.castRay(e.x, e.y, -Math.cos(t), -Math.sin(t), 75) < 75 || r.maps[e.z][A.cellOf(e.x - Math.cos(t) * 60, e.y - Math.sin(t) * 60)] === 8) continue; // sobre una escalera cambiarías de planta
      Object.assign(e, { type: 'dog', r: 10, hp: 45, state: 'patrol', aware: 0, alertLvl: 0, a: t, lookA: t, waitT: 9, lookT: 9 });
      A.run.light = false; r.p.x = e.x - Math.cos(t) * 60; r.p.y = e.y - Math.sin(t) * 60; r.p.z = e.z; r.p.vx = r.p.vy = 0;
      await new Promise(f => setTimeout(f, 1200));
      A.run.light = true; A.run.hp = 100;
      return e.state === 'combat' ? e.state : JSON.stringify({ st: e.state, aware: e.aware, d: Math.hypot(e.x - r.p.x, e.y - r.p.y), ez: e.z, pz: r.p.z, dead: r.p.dead, alive: r.enemies.includes(e), state: A.state });
    }
    return null;
  });
  if (dog) assert.strictEqual(dog, 'combat', 'el perro debe olerte');
  else console.warn('aviso: sin hueco para el perro; se omite su prueba');

  // C4: plantada junto a un muro interior, no estalla sola; al volver a pulsar, abre un hueco
  const wall = await ev(() => {
    const A = __apagon, r = A.room, W = r.W;
    for (let c = 0; c < r.map.length; c++) {
      const x = c % W, y = (c / W) | 0;
      if (r.map[c] !== 1 || x < 3 || y < 2 || x > W - 3 || y > r.H - 3 || r.map[c - 1] !== 0 || r.map[c - 2] !== 0) continue;
      r.p.x = (x - 1) * 40 + 20; r.p.y = y * 40 + 20; r.p.z = 0; r.p.a = 0; r.p.breachT = 0;
      A.run.hp = 1000; // la onda le alcanza: aquí solo importa la pared
      const before = A.run.charges; A.breach();
      return { c, used: before - A.run.charges, planted: r.charges.length };
    }
    return null;
  });
  assert(wall && wall.used === 1 && wall.planted === 1, 'debe plantarse una C4');
  await page.waitForTimeout(1500);
  assert.strictEqual(await page.evaluate(c => __apagon.room.map[c], wall.c), 1, 'la C4 no estalla sola');
  await ev(() => { __apagon.room.p.breachT = 0; __apagon.breach(); });
  await page.waitForTimeout(200);
  assert.strictEqual(await page.evaluate(c => __apagon.room.map[c], wall.c), 0, 'al detonarla debe abrir la pared');
  await ev(() => { __apagon.run.hp = 100; });

  // Una bala rompe una ventana
  const glass = await ev(async () => {
    const r = __apagon.room, W = r.W;
    for (let c = 0; c < r.map.length; c++) if (r.map[c] === 5 && r.map[c - 1] === 0) {
      const x = (c % W - 1) * 40 + 20, y = ((c / W) | 0) * 40 + 20;
      r.bullets.push({ x, y, z: 0, vx: 900, vy: 0, dmg: 26, mine: true, life: 1 });
      await new Promise(f => setTimeout(f, 150));
      return r.map[c];
    }
    return -1;
  });
  if (glass >= 0) assert.strictEqual(glass, 0, 'la bala debe romper la ventana'); else console.warn('aviso: sin ventana accesible');

  // Armas nuevas: la carabina dispara ráfagas de 3 y el lanzagranadas abre una pared
  const guns = await ev(async () => {
    const A = __apagon, r = A.room, p = r.p, wait = ms => new Promise(f => setTimeout(f, ms)), keep = [A.run.weapons, A.run.cur, p.x, p.y, p.z], out = {};
    A.run.hp = 1000;
    A.run.weapons = [{ id: 'burst', mods: [], ammo: 30, reserve: 0, at: 'normal', ats: ['normal'] }]; A.run.cur = 0; p.fireT = 0; p.reloadT = 0; p.burstLeft = 0;
    A.shoot(); for (let i = 0; i < 20 && A.run.weapons[0].ammo > 27; i++) await wait(50); await wait(200); out.burst = 30 - A.run.weapons[0].ammo;
    const W = r.W; let wall = -1;
    for (let c = 0; c < r.map.length && wall < 0; c++) { const x = c % W, y = (c / W) | 0; if (r.map[c] === 1 && x > 4 && y > 2 && x < W - 3 && y < r.H - 3 && [1, 2, 3].every(k => r.map[c - k] === 0)) wall = c; }
    A.run.weapons = [{ id: 'gl', mods: [], ammo: 4, reserve: 0, at: 'normal', ats: ['normal'] }]; p.fireT = 0;
    Object.assign(p, { x: (wall % W - 3) * 40 + 20, y: ((wall / W) | 0) * 40 + 20, z: 0, a: 0 });
    A.shoot(); await wait(500); out.wall = r.map[wall];
    [A.run.weapons, A.run.cur, p.x, p.y, p.z] = keep; A.run.hp = 100;
    return out;
  });
  assert.deepStrictEqual(guns, { burst: 3, wall: 0 });

  await page.tap('#bNade');
  await page.tap('#bNoise');
  await page.waitForTimeout(2200); // deja explotar la granada

  // Golpe: la salida está cerrada sin botín; en las oficinas el maletín no tiene sensor: cogerlo no da la alarma
  await ev(() => { const r = __apagon.room; r.enemies.length = 0; r.bodies.length = 0; r.camsOff = true; r.alarm = false; r.p.dead = false; __apagon.run.hp = 100; r.p.x = r.exit.x; r.p.y = r.exit.y; r.p.z = 0; }); // sin nadie que dé el aviso (ni cámaras que graben un cuerpo)
  await page.waitForTimeout(200);
  assert.strictEqual(await ev(() => __apagon.state), 'play', 'sin botín la salida está cerrada');
  await ev(() => { const r = __apagon.room; r.p.x = r.loot.x; r.p.y = r.loot.y; r.p.z = r.loot.z; });
  await page.waitForTimeout(200);
  const alarm = await ev(() => { const r = __apagon.room; return { alarm: r.alarm, taken: r.loot.taken, timer: r.timer > 20, car: r.exitCar.state }; });
  assert.deepStrictEqual(alarm, { alarm: false, taken: true, timer: true, car: 'coming' }, 'con el botín, el coche de extracción viene de camino');
  await shot('alarm');
  // Salida → resultados (rango, objetivos) → tienda → comprar arma y mejora → siguiente sala (con la vida llena aunque acabaras herido)
  await ev(() => { const r = __apagon.room; r.p.dead = false; __apagon.run.hp = 23; if (r.exitCar) Object.assign(r.exitCar, { state: 'wait', x: r.exit.x }); r.p.x = r.exit.x; r.p.y = r.exit.y; r.p.z = 0; });
  await page.waitForTimeout(200);
  assert.strictEqual(await ev(() => __apagon.state), 'results');
  assert.match(await page.textContent('#rsRank'), /^[SABC]$/);
  assert((await page.textContent('#rsObj')).includes('Escapa en el vehículo de extracción'), 'los objetivos salen en los resultados');
  assert(await ev(() => document.getElementById('bRsGo').disabled && !document.getElementById('rsRank').classList.contains('stamp')), 'los resultados se van mostrando: el sello aún no ha caído');
  await page.waitForSelector('#rsRank.stamp', { timeout: 10000 });
  await page.waitForSelector('#bRsGo:not([disabled])', { timeout: 3000 });
  await page.click('#bRsGo');
  assert.strictEqual(await ev(() => __apagon.state), 'shop');
  await ev(() => { __apagon.run.money = 1000; });
  await page.click('.tabs button[data-tab="arm"]');
  await page.click('[data-act="buyW:smg"]');
  await page.click('.tabs button[data-tab="mod"]');
  await page.click('[data-act="mod:silencer"]');
  const bought = await ev(() => ({ money: __apagon.run.money, w: __apagon.run.weapons.map(w => w.id + ':' + w.mods.join(',')) }));
  assert.deepStrictEqual(bought, { money: 1000 - 350 - 180, w: ['pistol:', 'smg:silencer'] });

  // Guardado: tras recargar la página, «Nueva partida» pide confirmación y «Continuar» recupera la tienda
  const before = await ev(() => [window.__saveErr || '', Object.keys(localStorage).join(',')]);
  await page.reload();
  await page.waitForSelector('#boot', { state: 'detached', timeout: 15000 });
  assert.match(await page.textContent('#bCont'), /misión 2: Marea Baja/, 'antes de recargar: ' + before + ' · errores: ' + errors + ' ' + await ev(() => JSON.stringify(Object.entries(localStorage).map(([k, v]) => [k, v.slice(0, 120)]))));
  assert(await page.isVisible('#bShop'), 'con partida guardada, el menú ofrece la tienda');
  await page.click('#bPlay');
  assert.deepStrictEqual(await ev(() => [__apagon.state, document.getElementById('bPlay').textContent]), ['menu', '¿Borrar la partida guardada?']);
  await page.click('#bCont');
  assert.deepStrictEqual(await ev(() => [__apagon.state, __apagon.run.money, __apagon.run.weapons.length]), ['shop', 470, 2]);
  await shot('shop');
  await page.click('#bNext');
  await page.click('#bGo');
  assert.deepStrictEqual(await ev(() => [__apagon.state, __apagon.run.level, __apagon.run.hp]), ['play', 2, 100], 'la sala nueva empieza con la vida llena');
  await page.waitForTimeout(1500);

  // Si se acaba el tiempo antes del golpe, también te atrapan
  await ev(() => { __apagon.room.timer = 0.05; });
  await page.waitForTimeout(300);
  assert.deepStrictEqual(await ev(() => [__apagon.state, document.getElementById('overTitle').textContent, /Se acabó el tiempo/.test(document.getElementById('overInfo').textContent)]), ['over', 'TE HAN ATRAPADO', true]);
  // Tras caer se puede pasar por la tienda antes de reintentar (con el equipo con el que entraste)
  await ev(() => { __apagon.run.charges = 0; });
  await page.click('#bOverShop');
  assert.deepStrictEqual(await ev(() => [__apagon.state, __apagon.run.level, __apagon.run.charges > 0, document.getElementById('shopTitle').textContent]), ['shop', 2, true, 'Prepárate: Marea Baja']);
  await page.click('#bNext');
  await page.click('#bGo');
  assert.deepStrictEqual(await ev(() => [__apagon.state, __apagon.run.level]), ['play', 2]);
  // Si se acaba el tiempo tras la alarma, te atrapan
  await ev(() => { const r = __apagon.room; r.p.x = r.loot.x; r.p.y = r.loot.y; r.p.z = r.loot.z; });
  await page.waitForTimeout(200);
  await ev(() => { __apagon.room.timer = 0.05; __apagon.run.hp = 100; __apagon.room.p.dead = false; });
  await page.waitForTimeout(300);
  assert.deepStrictEqual(await ev(() => [__apagon.state, document.getElementById('overTitle').textContent]), ['over', 'TE HAN ATRAPADO']);
  await page.click('#bRetry');
  assert.deepStrictEqual(await ev(() => [__apagon.state, __apagon.room.alarm]), ['play', false]);

  // Civiles (misión 1, oficinas): si uno te ve, huye y llama; la policía llega tras su cuenta atrás, con uniforme propio
  const civ = await ev(async () => {
    const A = __apagon; A.run.level = 1; A.startRoom(); const r = A.room, wait = ms => new Promise(f => setTimeout(f, ms));
    const c = r.enemies.find(e => e.type === 'civil'); if (!c) return null;
    r.enemies.splice(0, r.enemies.length, c); A.run.hp = 999; A.useFloor(c.z);
    for (let k = 0; k < 8; k++) { const t = k * Math.PI / 4; if (A.castRay(c.x, c.y, Math.cos(t), Math.sin(t), 90) >= 90) { Object.assign(r.p, { x: c.x + Math.cos(t) * 70, y: c.y + Math.sin(t) * 70, z: c.z }); Object.assign(c, { a: t, lookA: t, waitT: 9, lookT: 9 }); break; } }
    A.run.light = true; for (let i = 0; i < 20 && c.state !== "panic"; i++) await wait(250); const seen = c.state;
    r.enemies.forEach(e => { if (e.callT > 0) e.callT = 0.05; }); await wait(200);
    const called = r.alarm && !r.police;
    r.policeT = 0.05; await wait(300);
    const car = r.copCars.length > 0; r.copCars.forEach(c => { c.x = c.tx; }); await wait(200); // llegan en coche patrulla: que aparque ya
    window.__civ = { ped: !!c.ped, aware: c.aware, exp: r.exposure, d: Math.hypot(c.x - r.p.x, c.y - r.p.y), disg: !!r.disguise, z: [c.z, r.p.z] };
    return { seen, called, police: r.police && car, cops: r.enemies.some(e => e.type === 'police' || e.type === 'swatp') };
  });
  if (civ) assert.deepStrictEqual(civ, { seen: 'panic', called: true, police: true, cops: true }, JSON.stringify(await ev(() => window.__civ))); else console.warn('aviso: sin civiles en la misión 1');

  // Sigilo (misión 2, almacén): puertas que tapan la vista, cámaras (te graban → aviso; de un tiro se rompen),
  // cuerpos que se arrastran y se esconden, y una moneda que atrae a un guardia
  const stealth = await ev(async () => {
    const A = __apagon, wait = ms => new Promise(f => setTimeout(f, ms)), out = {};
    A.run.level = 2; A.startRoom(); const r = A.room, guard = r.enemies.find(e => e.z === 0 && e.type === 'guard'), foe = r.enemies.find(e => e.z === 0 && !e.type.startsWith('civ'));
    r.enemies.length = 0; A.run.hp = 999; A.run.light = true;
    const d = r.idoors.find(d => d.z === 0);
    if (d) {
      const o = d.v ? [1, 0] : [0, 1], sx = d.x - o[0] * 60, sy = d.y - o[1] * 60;
      const shut = A.castRay(sx, sy, o[0], o[1], 120);
      Object.assign(r.p, { x: d.x - o[0] * 30, y: d.y - o[1] * 30, z: 0 }); await wait(300);
      out.door = [shut < 70, A.castRay(sx, sy, o[0], o[1], 120) > 100];
    }
    const k = r.cams[0];
    if (k) {
      Object.assign(r.p, { x: k.x + Math.cos(k.a0) * 120, y: k.y + Math.sin(k.a0) * 120, z: 0 });
      const hold = setInterval(() => { k.t = 0; }, 50); await wait(1800); clearInterval(hold); // que no barra hacia otro lado
      const alarm = r.alarm, a = Math.atan2(k.y - r.p.y, k.x - r.p.x);
      r.bullets.push({ x: r.p.x + Math.cos(a) * 20, y: r.p.y + Math.sin(a) * 20, z: 0, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, dmg: 26, mine: true, life: 1 });
      await wait(300); out.cam = [alarm, !k.on];
    }
    if (foe) {
      r.enemies.push(foe); A.hurtEnemy(foe, 999, 0); r.enemies.length = 0; await wait(800);
      const b = r.bodies[0]; Object.assign(r.p, { x: b.x, y: b.y, z: 0 });
      A.use(); await wait(1400); A.use(); await wait(100); const dragging = r.drag === b;
      let spot = null;
      for (let c = 0; c < r.map.length && !spot; c++) if (r.map[c] === 4 || r.map[c] === 2 || r.map[c] === 6) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!spot && r.map[c + dy * r.W + dx] === 0) spot = [(c % r.W + dx) * 40 + 20, (((c / r.W) | 0) + dy) * 40 + 20];
      Object.assign(r.p, { x: spot[0], y: spot[1] }); await wait(200);
      A.use(); await wait(1100); out.body = [dragging, !!b.hidden];
    }
    if (guard) {
      r.enemies.push(guard); Object.assign(guard, { state: 'patrol', waitT: 9, lookT: 9, aware: 0 });
      for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; if (A.castRay(guard.x, guard.y, Math.cos(t), Math.sin(t), 260) >= 250) { Object.assign(r.p, { x: guard.x + Math.cos(t) * 240, y: guard.y + Math.sin(t) * 240, z: 0, a: t + Math.PI, noiseT: 0 }); break; } }
      document.getElementById('bNoise').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      const pa = r.p.a; let land = null; const spy = setInterval(() => { const c = (r.coins || [])[0]; if (c) land = [Math.round(Math.hypot(c.tx - guard.x, c.ty - guard.y)), c.done]; }, 20);
      for (let i = 0; i < 12 && guard.state === 'patrol'; i++) await wait(250); // la moneda tarda en caer
      clearInterval(spy); out.coin = guard.state !== 'patrol';
      if (!out.coin) window.__coin = { pa: pa.toFixed(2), now: r.p.a.toFixed(2), land, st: guard.state, gz: guard.z, alive: r.enemies.includes(guard), alarm: r.alarm, d: Math.round(Math.hypot(guard.x - r.p.x, guard.y - r.p.y)) };
    }
    return out;
  });
  if (!stealth.coin && 'coin' in stealth) console.log('moneda:', JSON.stringify(await ev(() => window.__coin)));
  assert.deepStrictEqual(stealth, { ...(stealth.door && { door: [true, true] }), ...(stealth.cam && { cam: [true, true] }), ...(stealth.body && { body: [true, true] }), ...('coin' in stealth && { coin: true }) });
  assert(stealth.door && stealth.cam && stealth.body, 'deben probarse puertas, cámaras y cuerpos: ' + JSON.stringify(stealth));

  // Plan del golpe: alcantarilla + ganzúa + disfraz se pagan en el briefing y empiezas dentro del edificio
  const planned = await ev(() => { const A = __apagon; A.run.level = 3; A.run.money = 1000; A.run.plan = { entry: 'sewer', tools: ['pick', 'disguise'], paid: [] }; return true; });
  await ev(() => document.getElementById('bfPlan')); // el briefing se abre desde la tienda en el flujo normal; aquí se arranca directo
  const plan = await ev(() => { const A = __apagon, c = A.run.plan, cost = [c.entry, ...c.tools].reduce((a, k) => a + ({ sewer: 120, pick: 120, disguise: 200 }[k] || 0), 0); A.run.money -= cost; c.paid = [c.entry, ...c.tools]; A.startRoom(); const r = A.room; return { money: A.run.money, inside: A.zoneAt(Math.floor(r.p.y / 40) * r.W + Math.floor(r.p.x / 40)) === 1, pick: r.pick, disguise: r.disguise }; });
  assert.deepStrictEqual(plan, { money: 560, inside: true, pick: true, disguise: true });

  // Primera planta: al pisar la escalera subes; al volver a pisarla, bajas
  const upSeed = await ev(() => { const A = __apagon; for (let s = 1; s < 300; s++) if (A.buildRoom(3, s + 3 * 977).maps.length === 2) return s; return -1; });
  assert(upSeed > 0, 'debe haber salas con primera planta');
  await page.evaluate(s => { const A = __apagon; A.run.level = 3; A.run.seed = s; A.startRoom(); }, upSeed);
  const climb = await ev(async () => {
    const r = __apagon.room, c = r.stairs[0], wait = ms => new Promise(f => setTimeout(f, ms));
    r.enemies.length = 0;
    r.p.x = (c % r.W) * 40 + 20; r.p.y = ((c / r.W) | 0) * 40 + 20; r.p.onStairs = false;
    await wait(150); const z1 = r.p.z;
    r.p.onStairs = false; await wait(150);
    return [z1, r.p.z];
  });
  assert.deepStrictEqual(climb, [1, 0], 'la escalera lleva arriba y abajo');

  // Persecución (misión 4): al subir al coche te persiguen; el stick derecho dispara a sus coches; al perderlos, tienda
  await ev(() => { const A = __apagon; A.run.level = 4; A.startRoom(); const r = A.room; r.enemies.length = 0; r.p.x = r.loot.x; r.p.y = r.loot.y; r.p.z = r.loot.z; });
  await page.waitForTimeout(200);
  await ev(() => { const r = __apagon.room; if (r.exitCar) Object.assign(r.exitCar, { state: 'wait', x: r.exit.x }); r.p.x = r.exit.x; r.p.y = r.exit.y; r.p.z = 0; });
  await page.waitForTimeout(300);
  assert(await ev(() => !!__apagon.room.chase && __apagon.state === 'play'), 'en la misión 4 te persiguen al huir');
  // Caer en la persecución solo la repite a ella, con el botín y la bolsa
  await ev(() => { __apagon.room.cash = 77; __apagon.hurtPlayer(9999); });
  await page.waitForFunction(() => __apagon.state === 'over', null, { timeout: 5000 });
  assert.strictEqual(await page.textContent('#bRetry'), 'Repetir persecución');
  await page.click('#bRetry');
  assert.deepStrictEqual(await ev(() => [__apagon.state, !!__apagon.room.chase, __apagon.room.chase.t < 1, __apagon.room.cash, __apagon.run.level, __apagon.run.hp]), ['play', true, true, 0, 4, 100]);
  await ev(() => { const C = __apagon.room.chase; C.trafT = 1e9; C.traffic.length = 0; window.__near = f => !f.dead && f.mode === 'follow' && Math.abs(f.vx) < 25 && Math.abs(f.y - C.car.y - f.dy) < 4; }); // sin tráfico que tape; ya colocado a tu lado
  await page.waitForFunction(() => __apagon.room.chase.foes.some(__near), null, { timeout: 8000 });
  const onFoe = await ev(() => { // la mira sobre el perseguidor (lo ves de frente, desde tu techo)
    const A = __apagon, C = A.room.chase, f = C.foes.find(__near), c = document.getElementById('c');
    A.run.hp = 5000; A.run.weapons[A.run.cur].ammo = 12; A.room.p.reloadT = 0; window.__f = C.foes.slice(); window.__h = __f.map(f => f.hp);
    for (let y = 0; y < c.height; y += 6) for (let x = 0; x < c.width; x += 6) { const t = A.pickAt(x, y); if (t && t.o === f) { C.aim.x = x; C.aim.y = y; return true; } }
    return false;
  });
  assert(onFoe, 'el perseguidor debe verse en pantalla');
  await touch(2, 560, 300, 560, 300, 1500); // con el stick derecho pulsado y la mira encima, dispara sola
  assert(await page.waitForFunction(() => __f.some((f, i) => f.dead || f.hp < __h[i]), null, { timeout: 1500 }).then(() => true, () => false), 'las balas deben dañar a los coches perseguidores');
  await shot('chase');
  // Una granada que toca un coche perseguidor estalla al momento
  const nade = await ev(async () => { const A = __apagon, C = A.room.chase, f = C.foes.find(f => !f.dead), hp = f.hp; A.room.nades.push({ z: 0, x: f.x, y: f.y, vx: 0, vy: 0, t: 1.5, h: 5, vh: 0 }); await new Promise(r => setTimeout(r, 120)); return [A.room.nades.length, f.dead || f.hp < hp]; });
  assert.deepStrictEqual(nade, [0, true], 'la granada estalla al tocar un coche');
  // El vehículo tiene su propia vida: pasar por encima de unos pinchos lo daña
  const spikes = await ev(async () => { const C = __apagon.room.chase, hp = C.car.hp; C.obst.push({ kind: 'spikes', y: C.car.y, x0: C.car.x - 60, x1: C.car.x + 60 }); await new Promise(r => setTimeout(r, 250)); return [C.car.maxHp > 0, C.car.hp < hp]; });
  assert.deepStrictEqual(spikes, [true, true], 'los pinchos dañan el vehículo');
  await ev(() => { const C = __apagon.room.chase; C.t = C.len; for (const f of C.foes) Object.assign(f, { dead: true, spin: 0, vx: 0 }); });
  await page.waitForTimeout(2000);
  assert.strictEqual(await ev(() => __apagon.state), 'results');
  await page.click('#bRsGo');
  assert.deepStrictEqual(await ev(() => [__apagon.state, __apagon.run.level]), ['shop', 5], 'al perderlos, a la tienda');

  // Cámara (misión 5): la puerta se hackea (cancelar guarda el progreso) o se abre con el código; registrar cuerpos llena la bolsa
  await page.click('#bNext');
  await story(page);
  assert.strictEqual(await page.textContent('#bfName'), 'BÓVEDA NORTE');
  const cash0 = await ev(() => __apagon.run.money);
  await page.click('[data-plan="tool:jammer"]'); // el plan se compra en el briefing
  await page.click('#bGo');
  assert.deepStrictEqual(await ev(() => [__apagon.run.money, __apagon.room.jams]), [cash0 - 150, 2], 'el inhibidor se paga y llega a la misión');
  const vault = await ev(async () => {
    const A = __apagon, r = A.room, d = r.doors[0], wait = ms => new Promise(f => setTimeout(f, ms)), out = {};
    if (!d) return null;
    A.run.hp = 5000;
    const sup = r.enemies.find(e => e.keycard);
    if (sup) A.hurtEnemy(sup, 1e6, 0);
    r.enemies.length = 0;
    const W = r.W, M = r.maps[d.z], fl = [];
    for (const c of d.cells) for (const n of [c - 1, c + 1, c - W, c + W]) if (M[n] === 0) fl.push({ x: (n % W) * 40 + 20, y: ((n / W) | 0) * 40 + 20 });
    fl.sort((a, b) => Math.hypot(a.x - d.x, a.y - d.y) - Math.hypot(b.x - d.x, b.y - d.y));
    const at = o => { Object.assign(r.p, { x: o.x, y: o.y, z: o.z ?? d.z, vx: 0, vy: 0 }); };
    at(fl[0]); await wait(50);
    A.use(); out.hack = r.act && [r.act.kind, r.act.label, r.act.time];
    await wait(500); A.use(); out.kept = d.hack > 0.3 && !r.act;
    if (sup) { // el código, en la tarjeta del supervisor
      await wait(700); // el cuerpo termina de deslizarse
      const b = r.bodies.find(b => b.keycard), cash = r.cash;
      at(b); await wait(50); A.use(); out.src = r.act && r.act.kind;
      await wait(1400); out.cash = r.cash > cash;
    } else { // o en la terminal
      const c = r.terminal;
      at({ x: (c % W) * 40 + 20, y: ((c / W) | 0) * 40 + 60, z: 0 }); await wait(50); A.use(); out.src = r.act && r.act.label;
      await wait(6500); out.cash = true;
    }
    out.code = r.hasCode;
    at(fl[0]); await wait(50); A.use(); out.type = r.act && /Teclear el código \d{4}/.test(r.act.label);
    await wait(1800);
    out.open = d.open && d.cells.every(c => M[c] === 0);
    return out;
  });
  assert(vault, 'la misión del banco debe tener puerta de cámara');
  assert.deepStrictEqual(vault, { hack: ['door', 'Hackear la puerta', 18], kept: true, src: vault.src, cash: true, code: true, type: true, open: true }, JSON.stringify(vault));
  assert(['body', 'Hackear la terminal (código y cámaras)'].includes(vault.src), 'el código sale del supervisor o de la terminal');
  await shot('vault');
  // Lo saqueado se cobra al escapar
  const bag = await ev(() => __apagon.room.cash);
  await ev(() => { const r = __apagon.room; r.p.x = r.loot.x; r.p.y = r.loot.y; r.p.z = r.loot.z; });
  await page.waitForTimeout(200);
  await ev(() => { const r = __apagon.room; if (r.exitCar) Object.assign(r.exitCar, { state: 'wait', x: r.exit.x }); r.p.x = r.exit.x; r.p.y = r.exit.y; r.p.z = 0; });
  await page.waitForTimeout(300);
  assert.strictEqual(await ev(() => __apagon.state), 'results');
  await page.click('#bRsGo');
  assert.strictEqual(await ev(() => __apagon.state), 'shop');
  assert((await page.innerHTML('#shopStats')).includes(`saqueo <b>+$${bag}</b>`), 'la bolsa se cobra al escapar');

  // Jefe: con él vivo la salida está bloqueada; al abatirlo, victoria y luego tienda
  await ev(() => { __apagon.run.level = 8; __apagon.startRoom(); });
  assert.strictEqual(await ev(() => __apagon.room.boss && __apagon.room.boss.type), 'boss');
  await ev(() => { const r = __apagon.room; r.p.x = r.exit.x; r.p.y = r.exit.y; r.p.z = 0; });
  await page.waitForTimeout(300);
  assert.strictEqual(await ev(() => __apagon.state), 'play', 'con el jefe vivo la salida está bloqueada');
  await shot('boss');
  await ev(() => { const A = __apagon; A.run.hp = 100; A.room.p.dead = false; A.hurtEnemy(A.room.boss, 1e6, 0); });
  await page.waitForTimeout(300);
  assert.strictEqual(await ev(() => __apagon.state), 'results');
  await page.click('#bRsGo');
  assert.strictEqual(await ev(() => __apagon.state), 'win');
  await page.click('#bWinGo');
  assert.deepStrictEqual(await ev(() => [__apagon.state, __apagon.run.level]), ['shop', 9]);

  // PC: sin botones táctiles, HUD escalado, ratón apunta y dispara; una partida corrupta se ignora
  await ctx.close(); // la página del móvil ya no hace falta (y su 3D le quitaría tiempo a la de PC)
  const desk = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await desk.addInitScript(lowGfx);
  const dp = await desk.newPage();
  dp.on('pageerror', e => errors.push(e.message));
  await dp.goto(url);
  await dp.evaluate(() => localStorage.setItem('apagon-partida-v1', '{"run":{"level":"x"}}'));
  await dp.reload();
  assert(await dp.isHidden('#bCont'), 'una partida corrupta no debe ofrecer continuar');
  // Tutorial: diez pasos guiados (aquí se completan a mano) y vuelta al menú sin tocar la partida
  await dp.click('#bTutorial'); await dp.waitForTimeout(300);
  assert.deepStrictEqual(await dp.evaluate(() => [__apagon.state, __apagon.room.tutorial, __apagon.room.tut]), ['play', true, 0]);
  const tut = await dp.evaluate(async () => {
    const A = __apagon, r = A.room, p = r.p, wait = ms => new Promise(f => setTimeout(f, ms)), log = [];
    Object.assign(p, { x: 260, y: 140 }); for (let i = 0; i < 30 && r.tut < 1; i++) await wait(100); log.push(r.tut);
    const g = r.tutGuard; A.hurtEnemy(g, 999, 0); r.tut = 3; await wait(800);
    const bd = r.bodies[0]; Object.assign(p, { x: bd.x, y: bd.y }); A.use(); for (let i = 0; i < 60 && !r.hasCode; i++) await wait(100); log.push(r.hasCode);
    Object.assign(p, { x: r.loot.x, y: r.loot.y }); await wait(300);
    Object.assign(p, { x: r.exit.x, y: r.exit.y }); for (let i = 0; i < 40 && A.state === 'play'; i++) await wait(100);
    return { log, state: A.state, saved: !!(localStorage.getItem('apagon-ranura-1') && JSON.parse(localStorage.getItem('apagon-ranura-1')).run.tutorial) };
  });
  assert.deepStrictEqual(tut, { log: [1, true], state: 'menu', saved: false });
  assert(await dp.isVisible('#menuNote'), 'al acabar el tutorial, aviso en el menú');
  await dp.click('#bPlay');
  await story(dp);
  await dp.click('#bGo');
  await dp.waitForTimeout(300);
  assert(await dp.isHidden('#acts'), 'en PC no se muestran los botones táctiles');
  assert.strictEqual(await dp.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--hud').trim()), '1.5');
  await dp.mouse.move(960, 540); await dp.waitForTimeout(100);
  const pa0 = await dp.evaluate(() => __apagon.room.p.a);
  await dp.mouse.move(1160, 540, { steps: 8 }); await dp.waitForTimeout(100);
  assert(await dp.evaluate(a => __apagon.room.p.a - a > 0.2, pa0), 'mover el ratón gira la vista');
  await dp.mouse.down(); await dp.waitForTimeout(400); await dp.mouse.up();
  assert(await dp.evaluate(() => __apagon.run.weapons[0].ammo < 12), 'el clic debe disparar');
  if (process.env.SHOTS) await dp.screenshot({ path: path.join(process.env.SHOTS, 'desktop.png') });
  // Consumibles: con vendas y herido, H cura poco a poco
  await dp.evaluate(() => { const A = __apagon; A.room.enemies.length = 0; A.run.items = { vendas: 1 }; A.run.hp = 50; });
  await dp.keyboard.press('KeyH');
  await dp.waitForFunction(() => !__apagon.room.heal && __apagon.run.hp > 50, null, { timeout: 6000 }).catch(() => {});
  assert.deepStrictEqual(await dp.evaluate(() => [Math.round(__apagon.run.hp), __apagon.run.items.vendas]), [75, 0], 'las vendas curan 25');
  // Ajustes desde la pausa (se guardan) y una partida nueva en la ranura 2 que no pisa la 1
  await dp.keyboard.press('Escape'); await dp.click('#bPauseSet');
  await dp.fill('#sMusic', '30'); await dp.dispatchEvent('#sMusic', 'input');
  assert.strictEqual(await dp.evaluate(() => JSON.parse(localStorage.getItem('apagon-ajustes')).music), 0.3);
  await dp.click('#bSetBack'); await dp.click('#bQuit'); await dp.click('#bSlots');
  assert.match(await dp.textContent('#slotList'), /Ranura 1 · actual.*Misión 1/);
  await dp.click('[data-slot="new:2"]'); await story(dp); await dp.click('#bGo');
  assert.deepStrictEqual(await dp.evaluate(() => [!!localStorage.getItem('apagon-ranura-1'), !!localStorage.getItem('apagon-ranura-2'), localStorage.getItem('apagon-ranura-actual')]), [true, true, '2']);
  await desk.close();

  assert.deepStrictEqual(errors, [], 'errores en consola');
  await browser.close();
  server.close();
  console.log('smoke OK');
})().catch(e => { console.error(e); process.exit(1); });
