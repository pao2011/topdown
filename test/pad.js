// Prueba del mando con un Gamepad simulado: node test/pad.js (requiere Playwright con Chromium)
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => { try { if (!localStorage.getItem('apagon-ajustes')) localStorage.setItem('apagon-ajustes', JSON.stringify({ gfx: 'baja', shadows: false })); } catch (e) { /* sin almacenamiento */ } }); // 3D en calidad baja: WebGL por software
  await pg.addInitScript(() => {
    const g = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    window.__pad = g; navigator.getGamepads = () => [g];
    window.__press = async (i, ms = 120) => { g.buttons[i] = { pressed: true, value: 1 }; await new Promise(r => setTimeout(r, ms)); g.buttons[i] = { pressed: false, value: 0 }; await new Promise(r => setTimeout(r, 120)); };
  });
  const server = await require('./serve')();
  await pg.goto(server.url);
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
  // moverse con el stick izquierdo (hacia delante: adonde miras, en primera persona)
  const p0 = await pg.evaluate(() => { const A = __apagon, p = A.room.p; A.room.enemies.length = 0; A.useFloor(p.z); let best = 0, ba = p.a; for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, d = A.castRay(p.x, p.y, Math.cos(a), Math.sin(a), 400); if (d > best) { best = d; ba = a; } } p.a = ba; return { x: p.x, y: p.y, a: p.a }; });
  await pg.evaluate(() => { __pad.axes[1] = -1; }); await pg.waitForTimeout(600); await pg.evaluate(() => { __pad.axes[1] = 0; });
  const p1 = await pg.evaluate(() => ({ x: __apagon.room.p.x, y: __apagon.room.p.y }));
  assert((p1.x - p0.x) * Math.cos(p0.a) + (p1.y - p0.y) * Math.sin(p0.a) > 20, 'el stick izquierdo mueve hacia delante');
  // mirar con el stick derecho y disparar con RT
  const a0 = await pg.evaluate(() => __apagon.room.p.a);
  await pg.evaluate(() => { __pad.axes[2] = 1; __pad.axes[3] = 0; }); await pg.waitForTimeout(300); await pg.evaluate(() => { __pad.axes[2] = 0; });
  const a = await pg.evaluate(() => __apagon.room.p.a); assert(a - a0 > 0.3, 'el stick derecho gira la vista: ' + (a - a0));
  const ammo0 = await pg.evaluate(() => __apagon.run.weapons[0].ammo);
  await pg.evaluate(() => { __pad.buttons[7] = { pressed: true, value: 1 }; }); await pg.waitForTimeout(400); await pg.evaluate(() => { __pad.buttons[7] = { pressed: false, value: 0 }; });
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
    // reasignar: Disparar pasa a RB (5) y el cuchillo, que lo tenía, se queda con RT (7)
  await pg.evaluate(() => document.getElementById('bPadMap').focus()); await pg.evaluate(() => __press(0));
  await pg.waitForSelector('#padmap', { state: 'visible' });
  assert.strictEqual(await pg.evaluate(() => { const p = document.querySelector('#padmap .panel'); return p.scrollHeight - p.clientHeight; }), 0, 'la lista de botones cabe en pantalla');
  await pg.evaluate(() => document.querySelector('.pm-row[data-act="fire"]').focus()); await pg.evaluate(() => __press(0));
  assert.match(await pg.textContent('.pm-row[data-act="fire"]'), /Pulsa/);
  await pg.evaluate(() => __press(5));
  assert.deepStrictEqual(await pg.evaluate(() => [__apagon.padBtn('fire'), __apagon.padBtn('knife'), JSON.parse(localStorage.getItem('apagon-ajustes')).padMap.fire]), [5, 7, 5], 'se intercambian y se guardan');
  assert.match(await pg.textContent('.pm-row[data-act="fire"]'), /RB/);
  await pg.evaluate(() => __press(1)); assert(await pg.isVisible('#settings'), 'B vuelve a ajustes');
  await pg.evaluate(() => __press(1)); assert(await pg.isHidden('#settings'), 'B vuelve de ajustes');
  await pg.evaluate(() => __press(9)); // reanudar
  const am2 = await pg.evaluate(() => __apagon.run.weapons[__apagon.run.cur].ammo);
  await pg.evaluate(() => { __pad.buttons[5] = { pressed: true, value: 1 }; }); await pg.waitForTimeout(400); await pg.evaluate(() => { __pad.buttons[5] = { pressed: false, value: 0 }; });
  assert(await pg.evaluate(a => __apagon.run.weapons[__apagon.run.cur].ammo < a, am2), 'con la nueva asignación, RB dispara');
  await pg.evaluate(() => { __apagon.settings.padMap = {}; });
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
  server.close();
  console.log('mando OK');
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
