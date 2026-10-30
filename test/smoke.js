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
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await shot('menu');

  // Generación: la salida y todos los enemigos son alcanzables desde la entrada
  const gen = await ev(() => {
    const A = window.__apagon, out = [];
    for (let lvl = 1; lvl <= 12; lvl++) for (let k = 0; k < 8; k++) {
      const r = A.buildRoom(lvl, lvl * 1000 + k), d = A.bfs(A.cellOf(r.start.x, r.start.y));
      out.push({ lvl, k, n: r.enemies.length, exit: d[A.cellOf(r.exit.x, r.exit.y)] > 5, foes: r.enemies.every(e => d[A.cellOf(e.x, e.y)] >= 0), path: !!A.findPath(r.start.x, r.start.y, r.exit.x, r.exit.y) });
    }
    return out;
  });
  for (const g of gen) assert(g.exit && g.foes && g.path && g.n >= 3, 'mapa inválido ' + JSON.stringify(g));
  // castRay: desde el centro de la casilla (1,1) hacia el muro exterior izquierdo hay 20 px
  assert.strictEqual(await ev(() => __apagon.castRay(60, 60, -1, 0, 500)), 20);

  await page.tap('#bPlay');
  await page.waitForTimeout(300);
  assert.strictEqual(await ev(() => __apagon.state), 'play');
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
  await shot('play');

  // Oído: un ruido leve da sospecha; un disparo, investigación urgente
  const heard = await ev(() => {
    const A = __apagon, e = A.room.enemies[0]; e.state = 'patrol';
    A.noise(e.x + 20, e.y, 100, 'whistle'); const s1 = e.state;
    A.noise(e.x + 20, e.y, 500, 'shot');
    return { s1, s2: e.state, urgent: e.urgent };
  });
  assert.deepStrictEqual(heard, { s1: 'suspicious', s2: 'investigate', urgent: true });

  // Vista: plantado delante de un guardia, acaba detectándote
  const placed = await ev(() => {
    const A = __apagon, r = A.room;
    for (const e of r.enemies) {
      const c = Math.cos(e.a), s = Math.sin(e.a);
      if (A.castRay(e.x, e.y, c, s, 90) >= 90) {
        r.p.x = e.x + c * 70; r.p.y = e.y + s * 70;
        Object.assign(e, { state: 'patrol', aware: 0, path: null, waitT: 5, lookA: e.a, lookT: 5 });
        window.__target = e;
        return r.enemies.indexOf(e);
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
      if (A.castRay(e.x, e.y, -c, -s, 50) >= 50) { r.p.x = e.x - c * 30; r.p.y = e.y - s * 30; r.p.a = e.a; e.waitT = 5; e.lookT = 5; e.lookA = e.a; return r.enemies.length; }
    }
    return -1;
  });
  if (behind >= 0) {
    await page.tap('#bKnife');
    assert(await ev(() => __apagon.room.silent === 1), 'el cuchillo por la espalda debe eliminar en silencio');
  } else console.warn('aviso: ningún guardia con hueco detrás; se omite la prueba de cuchillo');

  await page.tap('#bNade');
  await page.tap('#bNoise');
  await page.waitForTimeout(2200); // deja explotar la granada

  // Salida → tienda → comprar arma y mejora → siguiente sala
  await ev(() => { const r = __apagon.room; r.p.dead = false; __apagon.run.hp = 100; r.p.x = r.exit.x; r.p.y = r.exit.y; });
  await page.waitForTimeout(200);
  assert.strictEqual(await ev(() => __apagon.state), 'shop');
  await ev(() => { __apagon.run.money = 1000; });
  await page.click('.tabs button[data-tab="arm"]');
  await page.click('[data-act="buyW:smg"]');
  await page.click('.tabs button[data-tab="mod"]');
  await page.click('[data-act="mod:silencer"]');
  const bought = await ev(() => ({ money: __apagon.run.money, w: __apagon.run.weapons.map(w => w.id + ':' + w.mods.join(',')) }));
  assert.deepStrictEqual(bought, { money: 1000 - 350 - 180, w: ['pistol:', 'smg:silencer'] });
  await shot('shop');
  await page.click('#bNext');
  assert.deepStrictEqual(await ev(() => [__apagon.state, __apagon.run.level]), ['play', 2]);
  await page.waitForTimeout(1500);

  assert.deepStrictEqual(errors, [], 'errores en consola');
  await browser.close();
  console.log('smoke OK');
})().catch(e => { console.error(e); process.exit(1); });
