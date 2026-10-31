// Prueba del mando con un Gamepad simulado: node test/pad.js (requiere Playwright con Chromium)
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => {
    const g = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    window.__pad = g; navigator.getGamepads = () => [g];
    window.__press = async (i, ms = 120) => { g.buttons[i] = { pressed: true, value: 1 }; await new Promise(r => setTimeout(r, ms)); g.buttons[i] = { pressed: false, value: 0 }; await new Promise(r => setTimeout(r, 120)); };
  });
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  await pg.evaluate(() => dispatchEvent(Object.assign(new Event('gamepadconnected'), { gamepad: __pad })));
  assert.match(await pg.textContent('#padNote'), /Mando conectado: Xbox Wireless Controller/);
  await pg.evaluate(() => __press(0)); // A salta la carga
  await pg.waitForSelector('#boot', { state: 'detached', timeout: 4000 });
  // menú: abajo enfoca algo; navegar hasta Jugar y aceptar
  await pg.evaluate(() => __press(13));
  let f = await pg.evaluate(() => document.activeElement.id);
  for (let i = 0; i < 6 && f !== 'bPlay'; i++) { await pg.evaluate(() => __press(12)); f = await pg.evaluate(() => document.activeElement.id); }
  assert.strictEqual(f, 'bPlay', 'se llega a Jugar con la cruceta');
  await pg.evaluate(() => __press(0));
  await pg.waitForSelector('#bStGo', { state: 'visible' });
  await pg.evaluate(() => __press(0)); await pg.evaluate(() => __press(0)); // foco en Continuar y aceptar
  await pg.waitForSelector('#bGo', { state: 'visible' });
  await pg.evaluate(() => __press(0)); await pg.evaluate(() => __press(0));
  await pg.waitForFunction(() => __apagon.state === 'play', null, { timeout: 4000 });
  assert(await pg.evaluate(() => __apagon.padMode && document.getElementById('acts').hidden), 'con mando no salen los botones táctiles');
  // moverse con el stick izquierdo
  const x0 = await pg.evaluate(() => { __apagon.room.enemies.length = 0; return __apagon.room.p.x; });
  await pg.evaluate(() => { __pad.axes[0] = 1; }); await pg.waitForTimeout(600); await pg.evaluate(() => { __pad.axes[0] = 0; });
  const x1 = await pg.evaluate(() => __apagon.room.p.x);
  assert(x1 - x0 > 20, 'el stick izquierdo mueve');
  // apuntar con el stick derecho y disparar con RT
  await pg.evaluate(() => { __pad.axes[2] = 0; __pad.axes[3] = -1; }); await pg.waitForTimeout(300);
  const a = await pg.evaluate(() => __apagon.room.p.a); assert(Math.abs(a + Math.PI / 2) < 0.3, 'el stick derecho apunta: ' + a);
  const ammo0 = await pg.evaluate(() => __apagon.run.weapons[0].ammo);
  await pg.evaluate(() => { __pad.buttons[7] = { pressed: true, value: 1 }; }); await pg.waitForTimeout(400); await pg.evaluate(() => { __pad.buttons[7] = { pressed: false, value: 0 }; __pad.axes[3] = 0; });
  assert((await pg.evaluate(() => __apagon.run.weapons[0].ammo)) < ammo0, 'RT dispara');
  // B sigilo, Start pausa, B vuelve
  await pg.evaluate(() => __press(1)); assert(await pg.evaluate(() => document.getElementById('bSneak').classList.contains('on')), 'B activa el sigilo');
  await pg.evaluate(() => __press(9)); assert.strictEqual(await pg.evaluate(() => __apagon.state), 'pause');
  await pg.evaluate(() => __press(1)); assert.strictEqual(await pg.evaluate(() => __apagon.state), 'play', 'B reanuda');
  // la pausa: ajustes con el deslizador
  await pg.evaluate(() => __press(9)); await pg.evaluate(() => document.getElementById('bPauseSet').focus());
  await pg.evaluate(() => __press(0)); await pg.waitForSelector('#settings', { state: 'visible' });
  await pg.evaluate(() => document.getElementById('sMusic').focus()); const v0 = await pg.evaluate(() => +document.getElementById('sMusic').value);
  await pg.evaluate(() => __press(15)); const v1 = await pg.evaluate(() => +document.getElementById('sMusic').value);
  assert(v1 > v0, `la cruceta sube el volumen ${v0}→${v1}`);
    await pg.evaluate(() => __press(1)); assert(await pg.isHidden('#settings'), 'B vuelve de ajustes');
  // persecución: el stick derecho mueve la mira y RT dispara
  await pg.evaluate(() => { const A = __apagon; A.run.level = 4; A.startRoom(); const r = A.room; r.enemies.length = 0; r.p.x = r.loot.x; r.p.y = r.loot.y; r.p.z = r.loot.z; });
  await pg.waitForTimeout(200);
  await pg.evaluate(() => { const r = __apagon.room; if (r.exitCar) Object.assign(r.exitCar, { state: 'wait', x: r.exit.x }); r.p.x = r.exit.x; r.p.y = r.exit.y; r.p.z = 0; });
  await pg.waitForFunction(() => !!__apagon.room.chase, null, { timeout: 4000 });
  const aim0 = await pg.evaluate(() => __apagon.room.chase.aim.x);
  await pg.evaluate(() => { __pad.axes[2] = 1; }); await pg.waitForTimeout(300); await pg.evaluate(() => { __pad.axes[2] = 0; });
  assert(await pg.evaluate(a => __apagon.room.chase.aim.x > a + 20, aim0), 'en la persecución el stick derecho mueve la mira');
  const am = await pg.evaluate(() => __apagon.run.weapons[__apagon.run.cur].ammo);
  await pg.evaluate(() => { __pad.buttons[7] = { pressed: true, value: 1 }; }); await pg.waitForTimeout(400); await pg.evaluate(() => { __pad.buttons[7] = { pressed: false, value: 0 }; });
  assert(await pg.evaluate(a => __apagon.run.weapons[__apagon.run.cur].ammo < a, am), 'RT dispara desde el techo');
  assert.deepStrictEqual(errs, [], 'errores en consola');
  console.log('mando OK');
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
