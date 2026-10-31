// Prueba de humo en un móvil emulado: node test/smoke.js  (SHOTS=carpeta guarda capturas)
const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_/.test(m.text())) errors.push(m.text()); });
  const shot = name => process.env.SHOTS && page.screenshot({ path: path.join(process.env.SHOTS, name + '.png') });
  const ev = fn => page.evaluate(fn);
  const url = 'file://' + path.resolve(__dirname, '../index.html');
  await page.goto(url);
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
  // Salen los 6 tipos de enemigo en las salas 1-7 y la sala 8 es la del jefe
  const kinds = await ev(() => {
    const A = __apagon, seen = new Set();
    for (let lvl = 1; lvl <= 7; lvl++) for (let k = 0; k < 4; k++) A.buildRoom(lvl, lvl * 31 + k).enemies.forEach(e => seen.add(e.type));
    const b = A.buildRoom(8, 5);
    return { seen: [...seen].sort(), bosses: b.enemies.filter(e => e.type === 'boss').length, boss: b.boss && b.boss.type };
  });
  assert.deepStrictEqual(kinds, { seen: ['dog', 'elite', 'guard', 'heavy', 'shield', 'sniper'], bosses: 1, boss: 'boss' });

  // Menú → briefing de la misión 1 → a jugar
  await page.tap('#bPlay');
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

  // Stick izquierdo mueve; stick derecho a fondo dispara
  const p0 = await ev(() => ({ ...__apagon.room.p }));
  await touch(1, 120, 300, 180, 300, 700);
  const p1 = await ev(() => ({ ...__apagon.room.p }));
  assert(Math.hypot(p1.x - p0.x, p1.y - p0.y) > 20, 'el stick izquierdo debe mover al jugador');
  await touch(2, 560, 300, 620, 300, 500);
  assert(await ev(() => __apagon.run.weapons[0].ammo < 12 || __apagon.room.p.reloadT > 0), 'el stick derecho a fondo debe disparar');
  // Botón de sigilo: con él activado, el stick a fondo no pasa de sigilo
  await page.tap('#bSneak');
  const sneakMove = await (async () => { const t = touch(1, 120, 300, 190, 300, 500); await page.waitForTimeout(350); const r = await ev(() => [__apagon.room.p.sneak, Math.round(__apagon.room.p.speed)]); await t; return r; })();
  await page.tap('#bSneak');
  assert(sneakMove[0] && sneakMove[1] > 20 && sneakMove[1] <= 80, 'con el sigilo activado se mueve en sigilo: ' + sneakMove);
  await shot('play');

  // Munición limitada: recargar gasta reserva, sin reserva no dispara, las cajas la reponen
  await ev(() => { const w = __apagon.run.weapons[0]; w.ammo = 0; w.reserve = 5; __apagon.room.p.reloadT = 0; });
  await page.keyboard.press('KeyR');
  await page.waitForTimeout(1200);
  assert.deepStrictEqual(await ev(() => { const w = __apagon.run.weapons[0]; return [w.ammo, w.reserve]; }), [5, 0]);
  await ev(() => { __apagon.run.weapons[0].ammo = 0; });
  await touch(2, 560, 300, 620, 300, 400);
  assert.strictEqual(await ev(() => __apagon.room.bullets.filter(b => b.mine).length), 0, 'sin munición no debe disparar');
  const got = await ev(async () => { const r = __apagon.room; r.items.push({ x: r.p.x, y: r.p.y, z: r.p.z }); await new Promise(f => setTimeout(f, 150)); return __apagon.run.weapons[0].reserve; });
  assert.strictEqual(got, 12, 'una caja da el 25 % de la reserva máxima');

  // Oído: un ruido leve da sospecha; un disparo, investigación urgente
  const heard = await ev(() => {
    const A = __apagon, e = A.room.enemies[0]; e.state = 'patrol';
    A.room.warns.length = 0;
    A.noise(e.x + 20, e.y, 100, 'whistle'); const s1 = e.state, warned = A.room.warns.some(w => w.e === e);
    A.noise(e.x + 20, e.y, 500, 'shot');
    return { s1, warned, s2: e.state, urgent: e.urgent };
  });
  assert.deepStrictEqual(heard, { s1: 'suspicious', warned: true, s2: 'investigate', urgent: true });

  // Todo oscuro: un guardia a tu espalda, fuera de la linterna, es un píxel negro
  const dark = await ev(() => {
    const A = __apagon, r = A.room;
    for (const e of r.enemies) for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
      A.useFloor(e.z);
      if (r.loot && Math.hypot(e.x - r.loot.x, e.y - r.loot.y) < 90) continue; // el botín brilla por encima de la oscuridad a propósito
      if (A.castRay(e.x, e.y, c, s, 150) < 150) continue;
      r.p.x = e.x + c * 130; r.p.y = e.y + s * 130; r.p.z = e.z; r.p.a = a; // de espaldas al guardia
      if (A.lit(e.x, e.y, e.z)) continue;
      Object.assign(e, { state: 'patrol', aware: 0, a: a + Math.PI, lookA: a + Math.PI, waitT: 5, lookT: 5 });
      window.__dark = e; r.enemies.splice(0, r.enemies.length, e); return true; // solo él: nada lo atrae hacia tu luz
    }
    return false;
  });
  if (dark) {
    await page.waitForTimeout(700);
    let px;
    for (let i = 0; i < 6 && !(px && px.every(v => v < 10)); i++) { // un fogonazo ajeno sí ilumina: se reintenta
      await page.waitForTimeout(80);
      px = await ev(() => {
        const { cam, S, cw, ch } = __apagon.view, e = window.__dark;
        const x = Math.round(cw / 2 + (e.x - cam.x) * S), y = Math.round(ch / 2 + (e.y - cam.y) * S);
        return [...document.getElementById('c').getContext('2d').getImageData(x, y, 1, 1).data].slice(0, 3);
      });
    }
    const dbg = await ev(() => { const A = __apagon, r = A.room, e = window.__dark; return { st: e.state, d: Math.round(Math.hypot(e.x - r.p.x, e.y - r.p.y)), lit: A.lit(e.x, e.y, e.z), fl: r.flashes.length, alive: r.enemies.includes(e), pa: r.p.a.toFixed(2), ez: e.z, pz: r.p.z, floors: r.maps.length,
      lamps: r.lamps.filter(l => Math.hypot(l.x - e.x, l.y - e.y) < l.r + 60).map(l => [l.z, Math.round(Math.hypot(l.x - e.x, l.y - e.y)), l.r]), tile: r.maps[e.z][A.cellOf(e.x, e.y)] }; });
    if (!px.every(v => v < 10)) await shot('darkfail');
    assert(px.every(v => v < 10), 'un guardia fuera de tu luz debe quedar a oscuras, píxel: ' + px + ' ' + JSON.stringify(dbg));
  } else console.warn('aviso: ningún guardia apto; se omite la prueba de oscuridad');

  // Vista: plantado delante de un guardia, acaba detectándote
  const placed = await ev(() => {
    const A = __apagon, r = A.room;
    for (const e of r.enemies) for (let k = 0; k < 8; k++) {
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
    await page.waitForTimeout(1500);
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
    for (const e of r.enemies) {
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
    for (const e of r.enemies) for (let k = 0; k < 8; k++) {
      const t = k * Math.PI / 4;
      A.useFloor(e.z);
      if (A.castRay(e.x, e.y, Math.cos(t), Math.sin(t), 45) < 45 || A.castRay(e.x, e.y, -Math.cos(t), -Math.sin(t), 45) < 45) continue;
      r.enemies.splice(0, r.enemies.length, e);
      Object.assign(e, { type: 'shield', r: 15, hp: 120, state: 'patrol', a: t, lookA: t, waitT: 9, lookT: 9 });
      const shoot = back => { const a = e.a + (back ? Math.PI : 0); r.bullets.push({ z: e.z, x: e.x + Math.cos(a) * 32, y: e.y + Math.sin(a) * 32, vx: -Math.cos(a) * 900, vy: -Math.sin(a) * 900, dmg: 26, mine: true, life: 1 }); };
      shoot(false); await wait(150);
      const front = e.hp;
      e.a = t; shoot(true); await wait(150);
      return [front, e.hp];
    }
    return null;
  });
  if (shield) assert.deepStrictEqual(shield, [120, 94], 'el escudo para de frente y no de espaldas');
  else console.warn('aviso: ningún guardia con hueco; se omite la prueba de escudo');

  // Perro: te huele aunque vayas a oscuras y en sigilo, por la espalda
  const dog = await ev(async () => {
    const A = __apagon, r = A.room, e = r.enemies[0];
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
    A.shoot(); await wait(400); out.burst = 30 - A.run.weapons[0].ammo;
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

  // Golpe: la salida está cerrada sin botín; al cogerlo salta la alarma con cuenta atrás
  await ev(() => { const r = __apagon.room; r.p.dead = false; __apagon.run.hp = 100; r.p.x = r.exit.x; r.p.y = r.exit.y; r.p.z = 0; });
  await page.waitForTimeout(200);
  assert.strictEqual(await ev(() => __apagon.state), 'play', 'sin botín la salida está cerrada');
  await ev(() => { const r = __apagon.room; r.p.x = r.loot.x; r.p.y = r.loot.y; r.p.z = r.loot.z; });
  await page.waitForTimeout(200);
  const alarm = await ev(() => { const r = __apagon.room; return { alarm: r.alarm, taken: r.loot.taken, timer: r.timer > 20 }; });
  assert.deepStrictEqual(alarm, { alarm: true, taken: true, timer: true });
  await shot('alarm');
  // Salida → tienda → comprar arma y mejora → siguiente sala (y se empieza con la vida llena aunque acabaras herido)
  await ev(() => { const r = __apagon.room; r.p.dead = false; __apagon.run.hp = 23; r.p.x = r.exit.x; r.p.y = r.exit.y; r.p.z = 0; });
  await page.waitForTimeout(200);
  assert.strictEqual(await ev(() => __apagon.state), 'shop');
  await ev(() => { __apagon.run.money = 1000; });
  await page.click('.tabs button[data-tab="arm"]');
  await page.click('[data-act="buyW:smg"]');
  await page.click('.tabs button[data-tab="mod"]');
  await page.click('[data-act="mod:silencer"]');
  const bought = await ev(() => ({ money: __apagon.run.money, w: __apagon.run.weapons.map(w => w.id + ':' + w.mods.join(',')) }));
  assert.deepStrictEqual(bought, { money: 1000 - 350 - 180, w: ['pistol:', 'smg:silencer'] });

  // Guardado: tras recargar la página, «Nueva partida» pide confirmación y «Continuar» recupera la tienda
  await page.reload();
  assert.match(await page.textContent('#bCont'), /misión 2: Marea Baja/);
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
  await ev(() => { const r = __apagon.room; r.p.x = r.exit.x; r.p.y = r.exit.y; r.p.z = 0; });
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
  await ev(() => { const C = __apagon.room.chase; C.t = C.len; for (const f of C.foes) Object.assign(f, { dead: true, spin: 0, vx: 0 }); });
  await page.waitForTimeout(2000);
  assert.deepStrictEqual(await ev(() => [__apagon.state, __apagon.run.level]), ['shop', 5], 'al perderlos, a la tienda');

  // Cámara (misión 5): la puerta se hackea (cancelar guarda el progreso) o se abre con el código; registrar cuerpos llena la bolsa
  await page.click('#bNext');
  assert.strictEqual(await page.textContent('#bfName'), 'BÓVEDA NORTE');
  await page.click('#bGo');
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
    const at = o => { Object.assign(r.p, { x: o.x, y: o.y, z: o.z || d.z, vx: 0, vy: 0 }); };
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
  assert.deepStrictEqual(vault, { hack: ['door', 'Hackear la puerta', 18], kept: true, src: vault.src, cash: true, code: true, type: true, open: true });
  assert(['body', 'Hackear la terminal'].includes(vault.src), 'el código sale del supervisor o de la terminal');
  await shot('vault');
  // Lo saqueado se cobra al escapar
  const bag = await ev(() => __apagon.room.cash);
  await ev(() => { const r = __apagon.room; r.p.x = r.loot.x; r.p.y = r.loot.y; r.p.z = r.loot.z; });
  await page.waitForTimeout(200);
  await ev(() => { const r = __apagon.room; r.p.x = r.exit.x; r.p.y = r.exit.y; r.p.z = 0; });
  await page.waitForTimeout(300);
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
  assert.strictEqual(await ev(() => __apagon.state), 'win');
  await page.click('#bWinGo');
  assert.deepStrictEqual(await ev(() => [__apagon.state, __apagon.run.level]), ['shop', 9]);

  // PC: sin botones táctiles, HUD escalado, ratón apunta y dispara; una partida corrupta se ignora
  const desk = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const dp = await desk.newPage();
  dp.on('pageerror', e => errors.push(e.message));
  await dp.goto(url);
  await dp.evaluate(() => localStorage.setItem('apagon-partida-v1', '{"run":{"level":"x"}}'));
  await dp.reload();
  assert(await dp.isHidden('#bCont'), 'una partida corrupta no debe ofrecer continuar');
  await dp.click('#bPlay');
  await dp.click('#bGo');
  await dp.waitForTimeout(300);
  assert(await dp.isHidden('#acts'), 'en PC no se muestran los botones táctiles');
  assert.strictEqual(await dp.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--hud').trim()), '1.5');
  await dp.mouse.move(1500, 540);
  await dp.mouse.down(); await dp.waitForTimeout(400); await dp.mouse.up();
  assert(await dp.evaluate(() => __apagon.run.weapons[0].ammo < 12), 'el clic debe disparar');
  assert(await dp.evaluate(() => Math.abs(__apagon.room.p.a) < 0.3), 'debe apuntar hacia el ratón');
  if (process.env.SHOTS) await dp.screenshot({ path: path.join(process.env.SHOTS, 'desktop.png') });
  await desk.close();

  assert.deepStrictEqual(errors, [], 'errores en consola');
  await browser.close();
  console.log('smoke OK');
})().catch(e => { console.error(e); process.exit(1); });
