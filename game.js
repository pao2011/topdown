'use strict';
(() => {
// ================= Datos =================
const T = 40; // tamaño de casilla en px de mundo
const STICK_R = 56, SNEAK = 0.55, FIRE = 0.8;
let LS = 0.5; // escala de la máscara de oscuridad: más fina en PC
const BEAM = 270, HALO_ON = 58, HALO_OFF = 92, LAMP_R = 125; // alcance de la luz (px de mundo)
const CONE = { patrol: '150,195,255', suspicious: '255,181,71', investigate: '255,181,71', search: '255,181,71', combat: '255,84,68' };

const WEAPONS = { // kick: cuánto sacude la cámara cada disparo
  pistol:   { name: 'Pistola',              price: 0,    dmg: 26,  rate: 3.5, mag: 12, reload: 1.0, spread: 0.05,  noise: 420, speed: 1000, reserve: 48,  pellets: 1, kick: 2 },
  revolver: { name: 'Revólver',             price: 300,  dmg: 70,  rate: 1.6, mag: 6,  reload: 1.8, spread: 0.03,  noise: 520, speed: 1100, reserve: 30,  pellets: 1, kick: 6 },
  smg:      { name: 'Subfusil',             price: 350,  dmg: 15,  rate: 11,  mag: 32, reload: 1.4, spread: 0.10,  noise: 460, speed: 1000, reserve: 128, pellets: 1, kick: 1.5 },
  shotgun:  { name: 'Escopeta',             price: 450,  dmg: 15,  rate: 1.3, mag: 6,  reload: 1.9, spread: 0.22,  noise: 620, speed: 900,  reserve: 24,  pellets: 8, kick: 7 },
  crossbow: { name: 'Ballesta',             price: 500,  dmg: 120, rate: 0.9, mag: 1,  reload: 1.1, spread: 0.01,  noise: 40,  speed: 760,  reserve: 10,  pellets: 1, bolt: true, kick: 1 },
  smgs:     { name: 'Subfusil silenciado',  price: 600,  dmg: 13,  rate: 10,  mag: 30, reload: 1.4, spread: 0.09,  noise: 130, speed: 950,  reserve: 120, pellets: 1, silenced: true, kick: 1 },
  rifle:    { name: 'Fusil',                price: 750,  dmg: 32,  rate: 7.5, mag: 26, reload: 1.6, spread: 0.045, noise: 560, speed: 1150, reserve: 104, pellets: 1, kick: 2.5 },
  autosg:   { name: 'Escopeta automática',  price: 900,  dmg: 13,  rate: 3.2, mag: 10, reload: 2.4, spread: 0.24,  noise: 640, speed: 900,  reserve: 40,  pellets: 7, kick: 6 },
  dmr:      { name: 'Rifle de tirador',     price: 1000, dmg: 85,  rate: 1.8, mag: 10, reload: 2.0, spread: 0.008, noise: 600, speed: 1500, reserve: 40,  pellets: 1, kick: 5 },
  mpistol:  { name: 'Pistola automática',   price: 220,  dmg: 14,  rate: 13,  mag: 20, reload: 1.1, spread: 0.12,  noise: 430, speed: 950,  reserve: 100, pellets: 1, kick: 1.2 },
  burst:    { name: 'Carabina de ráfaga',   price: 650,  dmg: 30,  rate: 2.6, mag: 30, reload: 1.5, spread: 0.035, noise: 520, speed: 1150, reserve: 120, pellets: 1, kick: 2, burst: 3, note: 'ráfagas de 3' },
  gl:       { name: 'Lanzagranadas',        price: 1100, dmg: 30,  rate: 1.1, mag: 4,  reload: 2.6, spread: 0.02,  noise: 700, speed: 620,  reserve: 16,  pellets: 1, kick: 6, boom: true, note: 'proyectil explosivo: también abre paredes' },
  amr:      { name: 'Rifle antimaterial',   price: 1600, dmg: 220, rate: 0.7, mag: 5,  reload: 2.8, spread: 0.004, noise: 760, speed: 1800, reserve: 20,  pellets: 1, kick: 10, pierce: true, note: 'atraviesa escudos y enemigos' },
  lmg:      { name: 'Ametralladora ligera', price: 1300, dmg: 24,  rate: 12,  mag: 80, reload: 3.4, spread: 0.08,  noise: 640, speed: 1100, reserve: 240, pellets: 1, kick: 2.5 },
};
const MODS = {
  silencer: { name: 'Silenciador',       desc: 'Ruido −70 %, daño −10 %',            price: 180, apply: s => { s.noise *= 0.3; s.dmg *= 0.9; s.silenced = true; } },
  mag:      { name: 'Cargador ampliado', desc: '+50 % de munición',                  price: 120, apply: s => { s.mag = Math.ceil(s.mag * 1.5); } },
  laser:    { name: 'Mira láser',        desc: 'Dispersión −50 % y línea de tiro',   price: 140, apply: s => { s.spread *= 0.5; s.laser = true; } },
  barrel:   { name: 'Cañón pesado',      desc: '+30 % de daño',                      price: 200, apply: s => { s.dmg *= 1.3; } },
  trigger:  { name: 'Gatillo ligero',    desc: '+25 % cadencia, recarga −25 %',      price: 160, apply: s => { s.rate *= 1.25; s.reload *= 0.75; } },
  comp:     { name: 'Compensador',       desc: 'Menos retroceso: la dispersión crece menos al disparar seguido', price: 150, apply: s => { s.bloom = 0.4; s.kick *= 0.6; } },
  drum:     { name: 'Tambor',            desc: '+120 % de munición, recarga +40 %',  price: 240, apply: s => { s.mag = Math.ceil(s.mag * 2.2); s.reload *= 1.4; } },
  thermal:  { name: 'Mira térmica',      desc: 'Ves la silueta de los guardias hacia los que apuntas, aunque estén a oscuras', price: 320, apply: s => { s.thermal = true; } },
};
const AMMO = {
  normal: { name: 'Normal',      desc: 'Sin efectos',                                      price: 0 },
  ap:     { name: 'Perforante',  desc: 'Atraviesa escudos y un enemigo; daño −10 %',       price: 220 },
  hp:     { name: 'Expansiva',   desc: '+35 % de daño; los escudos la paran igual',         price: 180 },
  inc:    { name: 'Incendiaria', desc: 'Prende fuego: 8 de daño por segundo durante 3 s',   price: 260 },
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
  boss:   { hp: 1400, walk: 50, run: 110, dmg: 7, rate: 1,   spread: 0.2,  pellets: 1, vision: 380, reward: 1000, r: 24, color: '#7a2e2e', boss: true, title: 'El Alcaide' },
  // el Coronel: armadura (la mitad de daño de frente), proyectiles explosivos y, a media vida, drones y refuerzos
  coronel: { hp: 1800, walk: 55, run: 115, dmg: 9, rate: 1,  spread: 0.15, pellets: 1, vision: 400, reward: 1500, r: 25, color: '#3a4a2e', boss: true, title: 'El Coronel', armor: true },
  // la Viuda: francotiradora; apunta con láser, dispara fuerte y cambia de posición tras cada tiro
  viuda:  { hp: 1100, walk: 75, run: 150, dmg: 38, rate: 0.6, spread: 0,   pellets: 1, vision: 560, reward: 1500, r: 20, color: '#3a1a2a', boss: true, title: 'La Viuda' },
  // guardia con táser: corre hacia ti y, de cerca, te deja aturdido un momento
  taser:  { hp: 70,  walk: 60, run: 140, dmg: 5,  rate: 0.8, spread: 0,    pellets: 0, vision: 250, reward: 40, r: 13, color: '#c9a64a', taser: true },
  // dron de vigilancia: vuela, ve con infrarrojos (también a oscuras) y da la alarma; no dispara
  drone:  { hp: 35,  walk: 80, run: 130, dmg: 0,  rate: 0,   spread: 0,    pellets: 0, vision: 320, reward: 50, r: 11, color: '#5a6a7a', drone: true, half: 0.85 },
  // agente de paisano: parece un civil hasta que te ve; entonces saca la pistola
  agent:  { hp: 80,  walk: 40, run: 150, dmg: 10, rate: 2.4, spread: 0.1,  pellets: 1, vision: 260, reward: 60, r: 12, color: '#6b4a3a', agent: true },
  // civiles: desarmados; si te ven armado, ven un cuerpo u oyen disparos, huyen y llaman a la policía
  civil:  { hp: 30,  walk: 40, run: 150, dmg: 0,  rate: 0,   spread: 0,    pellets: 0, vision: 230, reward: 0,  r: 12, color: '#8a8f99', civil: true },
  // policía: llega un rato después del aviso, con uniforme azul y placa dorada; los GEO, en las misiones avanzadas
  police: { hp: 75,  walk: 62, run: 140, dmg: 8,  rate: 2.2, spread: 0.12, pellets: 1, vision: 290, reward: 40, r: 13, color: '#2a4f9e', cop: true },
  swatp:  { hp: 150, walk: 55, run: 120, dmg: 9,  rate: 4,   spread: 0.1,  pellets: 1, vision: 300, reward: 70, r: 14, color: '#1b2a4a', cop: true },
};
const PUBLIC = { banco: 5, galeria: 4, oficinas: 2, casino: 8, joyeria: 3, museo: 4, yate: 5 }; // civiles por escenario (lugares públicos)
const LOOT_ALARM = { banco: true, galeria: true, datos: true, joyeria: true, museo: true, casino: true }; // ahí el botín tiene sensor: cogerlo hace saltar la alarma
const POLICE_DELAY = { sigilo: 30, mixta: 42, asalto: 22 }; // segundos que tarda la policía desde el aviso
const BOSS_EVERY = 8; // misión del jefe; tras la campaña sigue el modo infinito con un jefe más duro cada 8 misiones
// Campaña: cada misión tiene nombre, escenario, tipo de operación, vehículo de huida y, a veces, persecución
const MISSIONS = [
  { name: 'Polilla',         scene: 'oficinas', op: 'mixta',  car: 'van',     brief: 'Una gestoría guarda un maletín con documentos que valen una fortuna. Entra de noche, cógelo y vuelve a la furgoneta.' },
  { name: 'Marea Baja',      scene: 'almacen',  op: 'sigilo', car: 'van',     brief: 'Un almacén del puerto esconde sacos de dinero negro. Si te ven, llamarán a la policía: mejor que no te vean.' },
  { name: 'Cristal',         scene: 'galeria',  op: 'sigilo', car: 'sedan',   brief: 'La galería expone un diamante legendario. Sin ruido: la alarma de la sala salta al primer disparo.' },
  { name: 'Hierro Fundido',  scene: 'almacen',  op: 'asalto', car: 'suv',     chase: true, brief: 'Asalto a un depósito armado hasta los dientes. Entra con todo, coge la carga y aguanta la persecución.' },
  { name: 'Bóveda Norte',    scene: 'banco',    op: 'sigilo', car: 'sedan',   brief: 'La cámara del banco tiene puerta de seguridad. Consigue el código (cajones, el supervisor o la terminal) o hackéala.' },
  { name: 'Destello',        scene: 'joyeria',  op: 'sigilo', car: 'sedan',   brief: 'La joyería más cara de la ciudad cierra a medianoche. Las vitrinas tienen sensor, pero la caja fuerte guarda lo mejor.' },
  { name: 'Lluvia de Plomo', scene: 'banco',    op: 'asalto', car: 'armored', chase: true, brief: 'A plena alarma: revienta la cámara con C4, llévate el oro y quítate de encima a los que te persigan.' },
  { name: 'El Alcaide',      boss: 'boss',      car: 'armored', brief: 'El hombre que controla la ciudad te espera en su fortaleza. Ábrete paso y sal con vida.' },
  { name: 'Silicio',         scene: 'datos',    op: 'mixta',  car: 'suv',     brief: 'Un centro de datos guarda un disco cifrado en su sala blindada. Los racks también llevan discos que se venden bien.' },
  { name: 'Terciopelo',      scene: 'galeria',  op: 'sigilo', car: 'sedan',   brief: 'Subasta privada: la galería está llena de seguridad privada. Que nadie sepa que has estado allí.' },
  { name: 'Doble o Nada',    scene: 'casino',   op: 'mixta',  car: 'suv',     chase: true, brief: 'La sala de recuento del casino. Mesas llenas, cámaras por todas partes y agentes de paisano entre los jugadores.' },
  { name: 'Faraón',          scene: 'museo',    op: 'sigilo', car: 'sedan',   brief: 'Una máscara funeraria de oro de paso por la ciudad. El museo está vigilado por drones de noche.' },
  { name: 'Vía Muerta',      scene: 'tren',     op: 'asalto', car: 'armored', chase: true, brief: 'Un tren de mercancías parado en la playa de vías lleva un vagón blindado con oro. Ábrelo y sal antes de que llegue la caballería.' },
  { name: 'Caja Negra',      scene: 'oficinas', op: 'sigilo', car: 'van',     brief: 'Las oficinas de una aseguradora. Los cajones están llenos de secretos y de dinero.' },
  { name: 'Marea Alta',      scene: 'yate',     op: 'mixta',  car: 'suv',     brief: 'Fiesta en el yate del rival del Alcaide: un cuadro robado cuelga en su camarote. Entra por la pasarela y sal sin hacer olas.' },
  { name: 'Ajuste de Cuentas', boss: 'coronel', car: 'armored', brief: 'El Coronel, el mercenario que heredó el imperio del Alcaide, te espera con su armadura y sus drones.' },
  { name: 'Apagón Total',    scene: 'datos',    op: 'asalto', car: 'suv',     chase: true, brief: 'Tumba el centro de datos a lo grande y escapa con el disco. Te van a seguir.' },
  { name: 'Lingote',         scene: 'banco',    op: 'mixta',  car: 'armored', chase: true, brief: 'La reserva de oro del banco central. Más guardias, más cámaras, más oro.' },
  { name: 'Nube Negra',      scene: 'datos',    op: 'sigilo', car: 'sedan',   brief: 'Los servidores de un cártel. Hackea la sala blindada sin dejar rastro.' },
  { name: 'Gran Premio',     scene: 'casino',   op: 'sigilo', car: 'sedan',   brief: 'Noche de gala en el casino. Mézclate, encuentra la sala de recuento y que nadie lo note hasta mañana.' },
  { name: 'Puerto Franco',   scene: 'almacen',  op: 'asalto', car: 'armored', chase: true, brief: 'El cártel mueve su dinero esta noche. Asalta el almacén y huye con los sacos.' },
  { name: 'Corona',          scene: 'museo',    op: 'mixta',  car: 'armored', chase: true, brief: 'Las joyas de la corona, una sola noche en el museo. Está todo el mundo esperándote.' },
  { name: 'Última Cifra',    scene: 'banco',    op: 'asalto', car: 'armored', chase: true, brief: 'El golpe final antes de retirarte: la cámara más grande de la ciudad.' },
  { name: 'La Viuda',        boss: 'viuda',     car: 'armored', brief: 'La Viuda, la tiradora que nunca falla, quiere cobrarse lo que le debes. Su azotea está llena de puestos de tiro.' },
];
const SCENES = { oficinas: 'Oficinas', almacen: 'Almacén del puerto', galeria: 'Galería de arte', banco: 'Banco', datos: 'Centro de datos', joyeria: 'Joyería', casino: 'Casino', museo: 'Museo', tren: 'Tren de mercancías', yate: 'Yate', fortaleza: 'Fortaleza' };
const OPS = {
  sigilo: { name: 'Sigilo', desc: 'Si alguien da el aviso, la policía llega enseguida. Sin que nadie te vea, el botín vale el doble.' },
  asalto: { name: 'Asalto', desc: 'La alarma suena desde el principio, la policía llega pronto y hay más guardias, pero llevas granadas y C4 de más, y la C4 revienta las puertas de seguridad.' },
  mixta:  { name: 'Mixta',  desc: 'Tú decides: entrar en silencio o a tiros. Si dan el aviso, la policía tarda algo más en llegar.' },
};
// Habilidades permanentes (3 niveles cada una), consumibles reales y estilo del personaje
const SKILLS = {
  hands: ['Manos rápidas', 'Registras y hackeas un 18 % más rápido por nivel'], feet: ['Pies ligeros', 'Tus pasos hacen un 20 % menos de ruido por nivel'],
  lungs: ['Fondo físico', 'Corres más tiempo: +30 % de aguante por nivel'], steady: ['Pulso firme', 'Un 10 % menos de dispersión por nivel'],
  tough: ['Piel dura', 'Recibes un 8 % menos de daño por nivel'], contacts: ['Contactos', 'La policía tarda un 15 % más en llegar por nivel'],
};
const SKILL_COST = [350, 700, 1200];
const ITEMS = {
  vendas: ['Vendas', 'Recuperas 25 de vida poco a poco (2 s)', 40], botiquin: ['Botiquín', 'Recuperas 60 de vida (3 s)', 120],
  energia: ['Bebida energética', 'Aguante lleno y no te cansas durante 20 s', 60], analgesico: ['Analgésicos', 'Recibes un 30 % menos de daño durante 25 s', 90],
};
const OUTFITS = { tactico: ['Táctico', 0, '#24473f', '#173029', '#18211f'], urbano: ['Urbano', 150, '#4a4f57', '#2e3238', '#1d2025'], bosque: ['Bosque', 150, '#3f5233', '#2a3822', '#20281a'], noche: ['Noche', 200, '#1c1f26', '#101216', '#0c0e11'], rojo: ['Rojo', 250, '#7a2a2a', '#4a1818', '#1e1416'] };
const MASKS = { ninguna: ['Sin máscara', 0], pasamontanas: ['Pasamontañas', 100], hockey: ['Máscara de hockey', 200], calavera: ['Calavera', 300], payaso: ['Payaso', 350] };
const CAMOS = { negro: ['Negro', 0, '#1b1f24'], desierto: ['Desierto', 150, '#8a7550'], bosque: ['Bosque', 150, '#4a5a3a'], urbano: ['Urbano', 150, '#6a6f78'], oro: ['Oro', 800, '#c9a23a'] };
const sk = k => (run && run.skills && run.skills[k]) || 0;
const style = () => ({ outfit: 'tactico', mask: 'ninguna', camo: 'negro', owned: [], ...(run && run.style) });
function playerLook() { // con disfraz, uniforme de guardia; si no, tu ropa y tu máscara
  if (room && room.disguise) return LOOK.guard;
  const st = style(), o = OUTFITS[st.outfit] || OUTFITS.tactico;
  return { ...LOOK.player, body: o[2], trim: o[3], legs: o[4], mask: st.mask };
}
const gunColor = () => (CAMOS[style().camo] || CAMOS.negro)[2];
// Ajustes (se guardan aparte de la partida): volúmenes, vibración, sensibilidad de la mira y láser
const SETTINGS_KEY = 'apagon-ajustes';
const settings = { music: 0.7, sfx: 0.9, vib: true, sens: 1, laser: true, padMap: {} };
try { const q = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; for (const k in settings) if (q[k] !== null && typeof q[k] === typeof settings[k]) settings[k] = q[k]; } catch (e) { /* sin ajustes guardados */ }
const lim = (v, a, b) => Math.min(b, Math.max(a, v)); settings.music = lim(settings.music, 0, 1); settings.sfx = lim(settings.sfx, 0, 1); settings.sens = lim(settings.sens, 0.5, 2);
const LOOTS = { maletin: ['maletín', 1], carga: ['sacos de dinero', 1.15], diamante: ['diamante', 1.6], lingotes: ['lingotes de oro', 1.4], disco: ['disco cifrado', 1.3], joyas: ['joyas', 1.5], efectivo: ['maletines de efectivo', 1.35], reliquia: ['máscara de oro', 1.8], cuadro: ['cuadro robado', 1.7], oro: ['oro del vagón blindado', 1.6] };
const SCENE_LOOT = { oficinas: 'maletin', almacen: 'carga', galeria: 'diamante', banco: 'lingotes', datos: 'disco', joyeria: 'joyas', casino: 'efectivo', museo: 'reliquia', yate: 'cuadro', tren: 'oro' };
const CARS = { van: 'Furgoneta', sedan: 'Berlina', suv: 'Todoterreno', armored: 'Furgón blindado' };
function mission(level) {
  if (level <= MISSIONS.length) return { scene: 'fortaleza', op: 'mixta', rain: [3, 7, 10, 14, 18, 22].includes(level), ...MISSIONS[level - 1], n: level };
  const r = mulberry32(level * 7919), pick = a => a[Math.floor(r() * a.length)], boss = level % BOSS_EVERY === 0;
  const bt = ['boss', 'coronel', 'viuda'][(level / BOSS_EVERY - 1) % 3];
  return { n: level, name: boss ? `${FOES[bt].title} · ${level / BOSS_EVERY}` : `Contrato ${level}`, boss: boss && bt, scene: boss ? 'fortaleza' : pick(['oficinas', 'almacen', 'galeria', 'banco', 'datos', 'joyeria', 'casino', 'museo', 'tren', 'yate']),
    op: pick(['sigilo', 'asalto', 'mixta']), car: pick(['van', 'sedan', 'suv', 'armored']), chase: !boss && r() < 0.45, rain: !boss && r() < 0.3, brief: 'Un contrato más en la ciudad. Cada vez pagan más y vigilan mejor.' };
}
// Objetivos: primarios (obligatorios) y secundarios (dan dinero y estrellas). Salen de la misión, así el briefing ya los conoce
function missionObjectives(level) {
  const M = mission(level), r = mulberry32(level * 7349 + 11), L = LOOTS[SCENE_LOOT[M.scene]] || ['el botín'];
  const prim = M.boss ? [{ id: 'boss', text: `Abate a ${(FOES[M.boss] || FOES.boss).title}` }, { id: 'escape', text: 'Sal de la fortaleza' }]
    : [{ id: 'loot', text: `Roba ${L[0]}` }, { id: 'escape', text: 'Escapa en el vehículo de extracción' }];
  const stealth = M.op !== 'asalto' && !M.boss, pool = [];
  if (stealth && !LOOT_ALARM[M.scene]) pool.push({ id: 'noalarm', text: 'Que no salte la alarma' });
  if (stealth && LOOT_ALARM[M.scene]) pool.push({ id: 'noalarmPre', text: 'Que no salte la alarma antes de coger el botín' });
  if (stealth) pool.push({ id: 'ghost', text: 'Que nadie te detecte' }, { id: 'silent', n: 3, text: 'Elimina a 3 guardias con el cuchillo sin que te vean' });
  if (PUBLIC[M.scene] && !M.boss) pool.push({ id: 'nocivil', text: 'Ningún civil muerto' });
  if (!M.boss) pool.push({ id: 'cash', n: 120 + level * 35, text: `Saquea al menos $${120 + level * 35}` });
  pool.push({ id: 'fast', n: Math.round(3.5 + level * 0.15), text: `Termina en menos de ${Math.round(3.5 + level * 0.15)} minutos` });
  if (M.scene === 'banco' || M.scene === 'datos') pool.push({ id: 'code', text: 'Abre la cámara con el código, sin hackearla' });
  if (!stealth) pool.push({ id: 'kills', n: 6 + Math.round(level * 0.8), text: `Abate a ${6 + Math.round(level * 0.8)} enemigos` });
  const sec = [];
  while (sec.length < 2 && pool.length) sec.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return [...prim.map(o => ({ ...o, primary: true, state: 0 })), ...sec.map(o => ({ ...o, primary: false, state: 0, reward: 100 + 25 * level }))];
}
function objState(o) { // 1 cumplido, -1 fallido, 0 pendiente; los de «que no pase X» se cumplen al escapar si no fallaron
  const R = room, end = R.escaped;
  switch (o.id) {
    case 'loot': return R.loot && R.loot.taken ? 1 : 0;
    case 'vault': return R.doors.some(d => d.open) ? 1 : 0;
    case 'boss': return R.boss ? 0 : 1;
    case 'escape': return end ? 1 : 0;
    case 'noalarm': return R.alarm ? -1 : end ? 1 : 0;
    case 'noalarmPre': return R.alarmBeforeLoot ? -1 : R.loot && R.loot.taken ? 1 : 0;
    case 'ghost': return R.detected ? -1 : end ? 1 : 0;
    case 'nocivil': return R.civKilled ? -1 : end ? 1 : 0;
    case 'cash': return R.cash >= o.n ? 1 : end ? -1 : 0;
    case 'fast': return R.time > o.n * 60 ? -1 : end ? 1 : 0;
    case 'code': return R.vaultBy === 'code' ? 1 : R.vaultBy || end ? -1 : 0;
    case 'silent': return R.silent >= o.n ? 1 : end ? -1 : 0;
    case 'kills': return R.kills >= o.n ? 1 : end ? -1 : 0;
  }
  return 0;
}
function updateObjectives() { // lo cumplido o fallido ya no cambia
  for (const o of room.obj) {
    if (o.state) continue;
    const st = objState(o);
    if (!st) continue;
    o.state = st; room.objV = (room.objV || 0) + 1;
    if (!room.escaped) { banner(`${st > 0 ? 'Objetivo cumplido' : 'Objetivo fallido'}: ${o.text}`); sfx(st > 0 ? 'objective' : 'fail'); }
  }
}
function policeDelay() {
  return Math.max(12, (room.boss ? 25 : POLICE_DELAY[room.op] || 40) - run.level * 0.7 - room.civKilled * 6) * (1 + 0.15 * sk('contacts'));
}
function pickFoe(level, roll) {
  const pool = ['guard', 'guard', 'guard', ...(level >= 2 ? ['dog', 'heavy'] : []), ...(level >= 3 ? ['shield', 'sniper'] : []), ...(level >= 4 ? ['elite', 'taser'] : []), ...(level >= 6 ? ['drone'] : [])];
  return pool[Math.floor(roll * pool.length)];
}
// Casillas: suelo, muro, caja, mesa/coche (bajo), estantería, ventana, seto, árbol/planta, escalera,
// vacío (fuera de la primera planta), contenedor y barrera de hormigón (cubre de las balas, no de la vista)
// puerta de seguridad (se hackea o se abre con código), rack de servidores, cajas de seguridad, terminal y muro blindado de la cámara
const FLOOR = 0, WALL = 1, CRATE = 2, LOW = 3, SHELF = 4, GLASS = 5, BUSH = 6, TREE = 7, STAIRS = 8, VOID = 9, METAL = 10, BARRIER = 11;
const SECURE = 12, RACK = 13, DEPOSIT = 14, TERMINAL = 15, VWALL = 16, DOOR = 17, WATER = 18; // puerta normal: se abre al acercarse; cerrada tapa la vista
const BLOCK_WALK  = [0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1];
const BLOCK_SIGHT = [0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0];
const BLOCK_SHOT  = [0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0];
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
const buzz = ms => { if (typeof settings !== 'undefined' && !settings.vib) return; try { navigator.vibrate && navigator.vibrate(ms); padRumble(ms); } catch (e) { /* sin vibración */ } };

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
const lampAt = (c, r, z, rgb, kind, oy = 0) => ({ x: (c % W) * T + T / 2, y: ((c / W) | 0) * T + T / 2 + oy, r, z, rgb, kind });
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
const KINDS = {
  oficinas: [['office', 0.55], ['lounge', 0.2], ['storage', 0.12], ['corridor', 0.13]],
  almacen:  [['storage', 0.45], ['warehouse', 0.35], ['office', 0.1], ['corridor', 0.1]],
  galeria:  [['gallery', 0.6], ['lounge', 0.2], ['office', 0.1], ['corridor', 0.1]],
  banco:    [['lobby', 0.35], ['office', 0.35], ['lounge', 0.1], ['storage', 0.1], ['corridor', 0.1]],
  datos:    [['servers', 0.55], ['office', 0.25], ['storage', 0.1], ['corridor', 0.1]],
  joyeria:  [['jewelry', 0.5], ['office', 0.25], ['storage', 0.15], ['corridor', 0.1]],
  casino:   [['casino', 0.6], ['lounge', 0.15], ['office', 0.15], ['corridor', 0.1]],
  museo:    [['museum', 0.45], ['gallery', 0.3], ['corridor', 0.15], ['office', 0.1]],
  tren:     [['wagon', 1]],
  yate:     [['cabin', 0.5], ['lounge', 0.35], ['corridor', 0.15]],
};
function furnish(L, place, rand, ri, fk, scene) {
  const w = L.x1 - L.x0 + 1, h = L.y1 - L.y0 + 1, cell = () => (L.y0 + ri(h)) * W + L.x0 + ri(w);
  let roll = rand(), kind = 'corridor';
  for (const [k, p] of KINDS[scene] || KINDS.oficinas) { if (roll < p) { kind = k; break; } roll -= p; }
  let floor, rgb = '200,220,255';
  if (kind === 'warehouse') { // nave: hormigón, contenedores y palés de cajas
    floor = 6;
    for (let i = 0; i < 2; i++) { const c = cell(); place(rand() < 0.5 ? [c, c + 1, c + 2, c + W, c + W + 1, c + W + 2] : [c, c + 1, c + W, c + W + 1, c + 2 * W, c + 2 * W + 1], METAL); }
    for (let i = 1 + ri(3); i > 0; i--) { const c = cell(); place([c, c + 1, c + W, c + W + 1], CRATE); }
  } else if (kind === 'gallery') { // galería: mármol, peanas con obras en cuadrícula (y cuadros en las paredes)
    floor = 8; rgb = '255,225,190';
    for (let y = L.y0 + 1; y < L.y1; y += 3) for (let x = L.x0 + 1; x < L.x1; x += 3) if (rand() < 0.75) place([y * W + x], LOW);
  } else if (kind === 'jewelry') { // joyería: madera oscura, vitrinas iluminadas a lo largo de las paredes y una isla
    floor = 16; rgb = '255,235,200';
    for (let x = L.x0 + 1; x < L.x1; x += 2) { place([L.y0 * W + x], LOW); if (h > 4) place([L.y1 * W + x], LOW); }
    if (w >= 6 && h >= 5) { const c = lcell(L); place([c - 1, c, c + 1], LOW); }
  } else if (kind === 'casino') { // casino: moqueta roja, filas de tragaperras y mesas de juego
    floor = 12; rgb = '255,200,150';
    for (let x = L.x0 + 1; x < L.x1; x++) if (x % 3) place([L.y0 * W + x], RACK);
    for (let y = L.y0 + 2; y < L.y1; y += 3) for (let x = L.x0 + 1; x + 1 < L.x1; x += 4) if (rand() < 0.8) place([y * W + x, y * W + x + 1], LOW);
  } else if (kind === 'museum') { // museo: mármol, vitrinas grandes en el centro y peanas
    floor = 8; rgb = '255,228,195';
    const c = lcell(L); if (w >= 6 && h >= 5) place([c, c + 1, c + W, c + W + 1], LOW);
    for (const k of [(L.y0 + 1) * W + L.x0 + 1, (L.y0 + 1) * W + L.x1 - 1, (L.y1 - 1) * W + L.x0 + 1, (L.y1 - 1) * W + L.x1 - 1]) if (rand() < 0.8) place([k], LOW);
  } else if (kind === 'wagon') { // vagón de mercancías: cajas y palés
    floor = 6; rgb = '210,200,170';
    for (let i = 2 + ri(3); i > 0; i--) { const c = cell(); place(rand() < 0.5 ? [c] : [c, c + 1], CRATE); }
  } else if (kind === 'cabin') { // camarote: parqué, cama y mesilla
    floor = 4; rgb = '255,210,160';
    const c = L.y0 * W + L.x0 + 1; place([c, c + 1, c + W, c + W + 1], LOW);
    if (rand() < 0.6) place([(L.y1) * W + L.x1], TREE);
  } else if (kind === 'lobby') { // vestíbulo del banco: mármol, mostrador con hueco y columnas
    floor = 8; rgb = '255,230,200';
    const cy = L.y0 + Math.max(1, Math.floor(h * 0.35)), gap = L.x0 + 1 + ri(Math.max(1, w - 2)), cells = [];
    for (let x = L.x0 + 1; x < L.x1; x++) if (Math.abs(x - gap) > 0) cells.push(cy * W + x);
    if (cells.length > 1) place(cells, LOW);
    for (const c of [(L.y1 - 1) * W + L.x0 + 1, (L.y1 - 1) * W + L.x1 - 1]) if (w >= 6 && h >= 5) place([c], WALL);
  } else if (kind === 'servers') { // sala de servidores: suelo técnico y filas de racks
    floor = 9; rgb = '170,210,255';
    for (let y = L.y0 + 1; y < L.y1; y += 2) {
      const gap = L.x0 + ri(w), cells = [];
      for (let x = L.x0 + 1; x < L.x1; x++) if (x !== gap) cells.push(y * W + x);
      if (rand() < 0.85) place(cells, RACK);
    }
  } else if (kind === 'office') { // oficina: moqueta y filas de mesas
    floor = 5;
    for (let y = L.y0 + 1; y < L.y1; y += 3) for (let x = L.x0 + 1; x + 1 < L.x1; x += 3) if (rand() < 0.7) place([y * W + x, y * W + x + 1], LOW);
  } else if (kind === 'storage') { // almacén: hormigón, estanterías con un hueco y cajas
    floor = 6;
    for (let x = L.x0 + 1; x < L.x1; x += 2) {
      if (rand() > 0.75) continue;
      const gap = L.y0 + 1 + ri(Math.max(1, h - 2)), cells = [];
      for (let y = L.y0 + 1; y < L.y1; y++) if (y !== gap) cells.push(y * W + x);
      place(cells, SHELF);
    }
    for (let i = ri(3); i > 0; i--) place([cell()], CRATE);
  } else if (kind === 'lounge') { // sala: parqué, mesa grande y plantas en las esquinas
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
    lamps: [[9, 10], [19, 3], [19, 18], [25, 6], [25, 15]].map(([x, y]) => lampAt(y * W + x, LAMP_R, 0, '255,205,150', 'floor')) };
}

// Tutorial: cuatro salas en fila. Entrada con una marca, el guardia de espaldas y la mesa, la cámara con el botín
// (puerta de seguridad) y, tras un muro que se abre con C4, el coche
function layoutTutorial() {
  W = 34; H = 14; newMap(1, 5);
  for (const x of [9, 18, 26]) for (let y = 1; y < H - 1; y++) map[y * W + x] = WALL;
  for (let y = 1; y < H - 1; y++) for (let x = 19; x < 26; x++) fks[0][y * W + x] = 10; // la cámara, de acero
  for (let y = 1; y < H - 1; y++) for (let x = 27; x < W - 1; x++) { fks[0][y * W + x] = 0; zone[y * W + x] = 0; } // fuera, asfalto
  map[6 * W + 9] = DOOR; map[7 * W + 9] = DOOR;
  map[6 * W + 18] = SECURE; map[7 * W + 18] = SECURE;
  map[3 * W + 13] = LOW; map[3 * W + 14] = LOW; // la mesa con el cajón
  return { start: 7 * W + 3, exit: 7 * W + 30, loot: 7 * W + 22, lootZ: 0, stairs: [], spawnOk: () => false, terminal: -1,
    secure: [{ cells: [6 * W + 18, 7 * W + 18], z: 0, v: 1 }], idoors: [{ cells: [6 * W + 9, 7 * W + 9], z: 0, v: 1 }], vault: { x0: 19, y0: 1, x1: 25, y1: H - 2, z: 0 },
    lamps: [[4, 1], [13, 1], [22, 1], [30, 2]].map(([x, y]) => lampAt(y * W + x, 150, 0, '255,215,170', 'wallN', -T / 2 + 4)) };
}
const TUT = [ // pasos del tutorial: texto y dónde señala la flecha
  ['Muévete hasta la marca (stick izquierdo o WASD)', () => ({ x: 6 * T + 20, y: 3 * T + 20 })],
  ['Activa el sigilo (botón SIGILO o tecla C) y cruza la puerta', () => ({ x: 9 * T + 20, y: 7 * T })],
  ['Acércate al guardia por la espalda y usa el CUCHILLO (E)', () => room.tutGuard],
  ['Registra el cuerpo con USAR (Espacio): lleva una tarjeta con el código', () => room.bodies[0]],
  ['Registra el cajón de la mesa con USAR', () => ({ x: 13 * T + 40, y: 3 * T + 20 })],
  ['Abre la puerta de la cámara con el código (USAR junto a ella)', () => room.doors[0]],
  ['Coge el botín', () => room.loot],
  ['Planta C4 en la pared marcada (botón C4 o B)', () => ({ x: 26 * T, y: 9 * T + 20 })],
  ['Apártate y vuelve a pulsar C4 para detonarla', () => ({ x: 26 * T, y: 9 * T + 20 })],
  ['Sube al coche de extracción', () => room.exit],
];
function tutorialStep(dt) { // avanza cuando se cumple el paso actual
  const p = room.p, k = room.tut, done = [
    () => dist(p, { x: 6 * T + 20, y: 3 * T + 20 }) < 40,
    () => sneakOn && p.x > 10 * T,
    () => !room.enemies.length,
    () => room.hasCode,
    () => room.searched.has('0:' + (3 * W + 13)) || room.searched.has('0:' + (3 * W + 14)),
    () => room.doors[0].open,
    () => room.loot.taken,
    () => room.charges.length > 0,
    () => { for (let y = 1; y < H - 1; y++) if (map[y * W + 26] !== WALL) return true; return false; }, // un hueco en el muro, donde sea
    () => false,
  ][k];
  if (done && done()) { room.tut++; sfx('objective'); }
}
// Golpe: un edificio (a veces con primera planta) en medio de un patio con aparcamiento, garita,
// contenedores y barreras. Llegas por la izquierda, el botín está en la sala más alejada y la furgoneta espera a la derecha
function layoutHeist(level, rand, ri, M) {
  W = Math.min(64, 44 + level * 2); H = Math.min(52, 38 + level); // abajo, 6 filas de calle con sus aceras
  newMap(0, 0);
  const G = maps[0], FK = fks[0];
  const bx0 = 9 + ri(3), bx1 = W - 10 - ri(3), by0 = 5 + ri(2), by1 = H - 12 - ri(2), bw = bx1 - bx0, bh = by1 - by0;
  const inB = (x, y, m) => x >= bx0 - m && x <= bx1 + m && y >= by0 - m && y <= by1 + m;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const c = y * W + x;
    if (y >= H - 8) FK[c] = y >= H - 6 && y <= H - 3 ? 11 : 2; // calzada (dos carriles por sentido) y aceras
    else if (inB(x, y, 0)) { FK[c] = 3; if (x === bx0 || x === bx1 || y === by0 || y === by1) G[c] = WALL; else zone[c] = 1; }
    else if (inB(x, y, 2)) FK[c] = 2; // acera alrededor del edificio
    else FK[c] = vnoise(x, y, 5) > 0.58 ? 1 : 0;
  }
  const leaves = [], doors = [], scene0 = M.scene;
  let inner;
  if (scene0 === 'tren') { // tren de mercancías: vagones en fila sobre la vía, cada uno una sala con puertas a los lados
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) { const c = y * W + x; G[c] = FLOOR; zone[c] = 0; FK[c] = 17; }
    const wy0 = ((by0 + by1) >> 1) - 2, wy1 = wy0 + 4;
    for (let y = wy0 - 1; y <= wy1 + 1; y++) for (let x = 1; x < W - 1; x++) FK[y * W + x] = 13; // la vía cruza todo el patio
    for (let x = bx0, n = 0; x + 7 <= bx1; n++) {
      const x1 = Math.min(bx1, x + 8 + ri(3));
      for (let y = wy0; y <= wy1; y++) for (let xx = x; xx <= x1; xx++) { const c = y * W + xx; if (xx === x || xx === x1 || y === wy0 || y === wy1) G[c] = METAL; else { zone[c] = 1; FK[c] = 6; } }
      leaves.push({ x0: x + 1, y0: wy0 + 1, x1: x1 - 1, y1: wy1 - 1 });
      const dx = x + 2 + ri(Math.max(1, x1 - x - 4)); doors.push([dx, wy0, 0], [dx, wy1, 0]);
      x = x1 + 3;
    }
    inner = doors.length;
    doors.push([bx0, by0 + 2, 1], [bx1, by0 + 2, 1], [bx0 + 2, by0, 0], [bx0 + 2 + ri(bw - 5), by1, 0]); // en el tren no hay fachada: huecos sin efecto
  } else if (scene0 === 'yate') { // yate amarrado: casco blanco, cubierta de teca alrededor y camarotes dentro; agua alrededor
    for (let y = 1; y < H - 9; y++) for (let x = 1; x < W - 1; x++) { const c = y * W + x; if (!inB(x, y, 0)) { G[c] = WATER; FK[c] = 14; } }
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
      const c = y * W + x, edge = x === bx0 || x === bx1 || y === by0 || y === by1, ring = x === bx0 + 3 || x === bx1 - 3 || y === by0 + 3 || y === by1 - 3, cab = x > bx0 + 3 && x < bx1 - 3 && y > by0 + 3 && y < by1 - 3;
      FK[c] = 15; zone[c] = cab ? 1 : 0;
      G[c] = edge || (ring && x >= bx0 + 3 && x <= bx1 - 3 && y >= by0 + 3 && y <= by1 - 3) ? WALL : FLOOR;
      if (x > bx1 - 3 && (y === by0 || y === by1)) G[c] = WATER; // proa afilada
    }
    splitRooms(bx0 + 4, by0 + 4, bx1 - 4, by1 - 4, leaves, doors, rand, ri);
    inner = doors.length;
    const gx = bx0 + 3 + ri(bw - 8); // pasarela desde el muelle
    for (let y = by1 + 1; y < H - 8; y++) for (let x = gx - 1; x <= gx + 2; x++) { const c = y * W + x; G[c] = FLOOR; FK[c] = 15; }
    doors.push([bx0 + 3, by0 + 5, 1], [bx1 - 3, by0 + 5, 1], [bx0 + 5 + ri(bw - 12), by0 + 3, 0], [gx, by1, 0], [bx0 + 5 + ri(bw - 12), by1 - 3, 0]);
  } else {
    splitRooms(bx0 + 1, by0 + 1, bx1 - 1, by1 - 1, leaves, doors, rand, ri);
    inner = doors.length; // las que siguen son las de la fachada
    doors.push([bx0, by0 + 2 + ri(bh - 5), 1], [bx1, by0 + 2 + ri(bh - 5), 1], [bx0 + 2 + ri(bw - 5), by0, 0], [bx0 + 2 + ri(bw - 5), by1, 0]);
  }
  for (const [dx, dy, v] of doors) carveDoor(dx, dy, v);
  const nearDoor = nearDoors(doors);
  const windows = (x0, y0, x1, y1, near, n) => { // ventanas en la fachada: dejan ver (y que te vean) y se rompen
    for (let k = n; k > 0; k--) {
      const side = ri(4), t = side < 2 ? y0 + 2 + ri(y1 - y0 - 4) : x0 + 2 + ri(x1 - x0 - 4);
      const cells = side === 0 ? [t * W + x0, (t + 1) * W + x0] : side === 1 ? [t * W + x1, (t + 1) * W + x1] : side === 2 ? [y0 * W + t, y0 * W + t + 1] : [y1 * W + t, y1 * W + t + 1];
      if (cells.every(c => map[c] === WALL && !near(c))) cells.forEach(c => { map[c] = GLASS; });
    }
  };
  if (scene0 !== 'tren') windows(bx0, by0, bx1, by1, nearDoor, scene0 === 'yate' ? 8 : 6 + ri(5));
  const front = doors[inner + 3][0], start = (H - 7) * W + front, exit = (H - 7) * W + (front < W / 2 ? W - 5 : 4); // te dejan en la acera frente a la puerta; te recogen al otro extremo de la calle

  // Primera planta sobre parte del edificio, con escaleras desde la planta baja
  const stairs = [];
  let uleaves = [], udoors = [], nearUDoor = () => false;
  if (scene0 !== 'tren' && scene0 !== 'yate' && rand() < 0.65) {
    const left = rand() < 0.5, ux0 = left ? bx0 : bx0 + Math.floor(bw * 0.4), ux1 = left ? bx0 + Math.ceil(bw * 0.6) : bx1;
    maps.push(new Uint8Array(W * H).fill(VOID)); fks.push(new Uint8Array(W * H).fill(3));
    useFloor(1);
    for (let y = by0; y <= by1; y++) for (let x = ux0; x <= ux1; x++) map[y * W + x] = x === ux0 || x === ux1 || y === by0 || y === by1 ? WALL : FLOOR;
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
  // Unas salas iluminadas de lleno (tubo fluorescente en la pared), otras con una lámpara de pie en una esquina, el resto a oscuras
  const light = (L, rgb, z) => {
    const lr = rand(), w = L.x1 - L.x0 + 1, h = L.y1 - L.y0 + 1;
    if (lr < 0.35) {
      const R = clamp(Math.max(w, h) * T * 0.85, 140, 300);
      for (const [row, wall, kind] of [[L.y0, L.y0 - 1, 'wallN'], [L.y1, L.y1 + 1, 'wallS']]) for (const dx of [0, 1, -1, 2, -2]) {
        const cx = ((L.x0 + L.x1) >> 1) + dx, c = row * W + cx;
        if (cx < L.x0 || cx > L.x1 || map[c] !== FLOOR || map[wall * W + cx] !== WALL) continue;
        lamps.push(lampAt(c, R, z, rgb, kind, kind === 'wallN' ? -T / 2 + 4 : T / 2 - 4));
        return;
      }
    }
    if (lr < 0.55) for (const c of [L.y0 * W + L.x0, L.y0 * W + L.x1, L.y1 * W + L.x0, L.y1 * W + L.x1, lcell(L)]) {
      if (map[c] === FLOOR) { lamps.push(lampAt(c, lr < 0.35 ? clamp(Math.max(w, h) * T * 0.7, 120, 240) : 100, z, '255,205,150', 'floor')); return; }
    }
  };
  let place = placer(start, c => nearDoor(c) || nearStairs(c) || md(c, start) <= 3 || md(c, exit) <= 2);
  const scene = M.scene, hasVault = ['banco', 'datos', 'joyeria', 'casino', 'tren'].includes(scene) || ((scene === 'galeria' || scene === 'museo') && rand() < 0.5);
  const vaultProps = place => { // la cámara del botín, a oscuras: cajas de seguridad en el banco, racks en los datos
    const L = vault, row = [];
    if (hasVault) for (let y = L.y0; y <= L.y1; y++) for (let x = L.x0; x <= L.x1; x++) fks[lootUp ? 1 : 0][y * W + x] = 10;
    if (scene === 'banco') { for (let x = L.x0; x <= L.x1; x++) row.push(L.y0 * W + x, L.y1 * W + x); for (const c of row) place([c], DEPOSIT); }
    else if (scene === 'datos') { for (let x = L.x0; x <= L.x1; x++) place([L.y0 * W + x], RACK); }
    else { place([L.y0 * W + L.x0], CRATE); place([L.y1 * W + L.x1], CRATE); }
  };
  for (const L of leaves) {
    if (L === vault) { if (!lootUp) vaultProps(place); continue; }
    light(L, furnish(L, place, rand, ri, FK, scene), 0);
  }

  // Patio: aparcamiento con plazas pintadas junto a la furgoneta
  const px0 = bx1 + 3, px1 = W - 5, py1 = (H >> 1) - 3;
  if (scene0 !== 'yate') for (let y = 2; y <= py1; y++) for (let x = px0; x <= px1; x++) if (G[y * W + x] === FLOOR && FK[y * W + x] !== 13) FK[y * W + x] = 7;
  for (const row of [2, 6]) if (row + 1 <= py1) for (let x = px0 + 1; x <= px1; x += 2) if (rand() < 0.65) place([row * W + x, (row + 1) * W + x], LOW);
  const yard = (m = 1) => { // casilla libre del patio, lejos de la fachada y del aparcamiento
    const x = 1 + ri(W - 2), y = 1 + ri(H - 2);
    return inB(x, y, m + 2) || (x >= px0 - 1 && y <= py1 + 1) || y >= H - 9 || FK[y * W + x] === 13 ? -1 : y * W + x; // ni en la calle ni sobre la vía
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
    const topDoor = door[0] === y0 * W + x0 + 1; // bombilla en la pared sin puerta
    lamps.push(topDoor ? lampAt(inner[2], 80, 0, '255,205,150', 'wallS', T / 2 - 4) : lampAt(inner[0], 80, 0, '255,205,150', 'wallN', -T / 2 + 4));
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
  const street = c => lampAt(c, 170, 0, '255,160,80', 'street');
  for (let x = bx0; x <= bx1; x += 8 + ri(4)) lamps.push(street((by0 - 2) * W + x), street((by1 + 2) * W + x));
  for (let y = by0 + 4; y < by1; y += 9 + ri(4)) { lamps.push(street(y * W + bx1 + 2)); if (rand() < 0.4) lamps.push(street(y * W + bx0 - 2)); }
  lamps.push({ ...street(4 * W + ((px0 + px1) >> 1)), r: 190 });
  for (let x = 3 + ri(3); x < W - 3; x += 8 + ri(3)) lamps.push({ ...street((H - 8) * W + x), r: 230 }); // farolas de la calle: alumbran la calzada
  if (scene0 === 'yate') { // farolillos en cubierta y tumbonas
    for (const c of [(by0 + 1) * W + bx0 + 1, (by0 + 1) * W + bx1 - 4, (by1 - 1) * W + bx0 + 1, (by1 - 1) * W + bx1 - 4]) lamps.push(lampAt(c, 140, 0, '255,215,160', 'floor', -12));
    for (let k = 0; k < 8; k++) { const x = bx0 + 1 + ri(bw - 2), y = rand() < 0.5 ? by0 + 1 + ri(2) : by1 - 1 - ri(2); place([y * W + x], LOW); }
  }

  if (maps[1]) { // amueblar la primera planta
    useFloor(1);
    place = placer(stairs[0], c => nearUDoor(c) || nearStairs(c));
    for (const L of uleaves) {
      if (L === vault) { vaultProps(place); continue; }
      light(L, furnish(L, place, rand, ri, fks[1], scene), 1);
    }
    useFloor(0);
  }
  // Terminal de seguridad (apaga las cámaras y, si hay cámara acorazada, da su código) en otra sala de la planta baja
  let terminal = -1;
  {
    useFloor(0);
    place = placer(start, c => nearDoor(c) || nearStairs(c) || md(c, start) <= 3 || md(c, exit) <= 2);
    for (let tries = 0; tries < 60 && terminal < 0; tries++) {
      const L = leaves[ri(leaves.length)];
      if (L === vault && !lootUp) continue;
      const c = (L.y0 + ri(L.y1 - L.y0 + 1)) * W + L.x0 + ri(L.x1 - L.x0 + 1);
      if (map[c - W] === WALL && place([c], TERMINAL)) terminal = c;
    }
  }
  // el botín, en la casilla libre más cercana al centro de la cámara (nunca sobre la escalera: te cambiaría de planta)
  useFloor(lootUp ? 1 : 0);
  let loot = -1;
  for (let y = vault.y0; y <= vault.y1; y++) for (let x = vault.x0; x <= vault.x1; x++) {
    const c = y * W + x;
    if (map[c] === FLOOR && (loot < 0 || md(c, lcell(vault)) < md(loot, lcell(vault)))) loot = c;
  }
  // Cámara blindada: sus muros no se rompen y sus puertas son de seguridad (código, hackeo o, en asalto, C4)
  const secure = [];
  if (hasVault) {
    const z = lootUp ? 1 : 0, ring = (x, y) => { const c = y * W + x; if (map[c] !== SECURE && !border(x, y)) map[c] = VWALL; };
    for (const [dx, dy, v] of lootUp ? udoors : doors) {
      const cells = v ? [dy * W + dx, (dy + 1) * W + dx] : [dy * W + dx, dy * W + dx + 1];
      const touches = v ? (dx === vault.x0 - 1 || dx === vault.x1 + 1) && dy >= vault.y0 - 1 && dy + 1 <= vault.y1 + 1
        : (dy === vault.y0 - 1 || dy === vault.y1 + 1) && dx >= vault.x0 - 1 && dx + 1 <= vault.x1 + 1;
      if (touches) { cells.forEach(c => { map[c] = SECURE; }); secure.push({ cells, z, v }); }
    }
    // todo el contorno es muro blindado: también tapa los huecos que abren las puertas vecinas al tallarse
    for (let x = vault.x0 - 1; x <= vault.x1 + 1; x++) { ring(x, vault.y0 - 1); ring(x, vault.y1 + 1); }
    for (let y = vault.y0; y <= vault.y1; y++) { ring(vault.x0 - 1, y); ring(vault.x1 + 1, y); }
  }
  // puertas de las salas: en cada hueco interior que siga libre (las de la cámara ya son de seguridad)
  const idoors = [];
  for (const [list, z, n] of [[doors, 0, inner], [udoors, 1, udoors.length]]) {
    if (!maps[z]) continue;
    for (let i = 0; i < n; i++) {
      const [dx, dy, v] = list[i], cells = v ? [dy * W + dx, (dy + 1) * W + dx] : [dy * W + dx, dy * W + dx + 1];
      if (cells.every(c => maps[z][c] === FLOOR)) { cells.forEach(c => { maps[z][c] = DOOR; }); idoors.push({ cells, z, v }); }
    }
  }
  useFloor(0);
  return { start, exit, loot, lootZ: lootUp ? 1 : 0, stairs, lamps, secure, terminal, idoors, vault: { ...vault, z: lootUp ? 1 : 0 },
    road: { y0: H - 6, east: (H - 5) * T, west: (H - 3) * T },
    spawnOk: i => ((i / W) | 0) < H - 9 && (!hasVault || lootUp || !(i % W >= vault.x0 && i % W <= vault.x1 && ((i / W) | 0) >= vault.y0 && ((i / W) | 0) <= vault.y1)) };
}

function buildRoom(level, seed) {
  const tut = !!(run && run.tutorial), rand = mulberry32(seed), ri = n => Math.floor(rand() * n), boss = !tut && level % BOSS_EVERY === 0;
  const M = tut ? { name: 'Entrenamiento', scene: 'oficinas', op: 'mixta', car: 'van', n: 0 } : mission(level);
  const L = tut ? layoutTutorial() : boss ? layoutBoss() : layoutHeist(level, rand, ri, M);
  useFloor(0);
  const dist0 = bfs(L.start);
  const r = {
    level, W, H, maps, fks, map: maps[0], stairs: L.stairs, start: center(L.start), exit: center(L.exit),
    loot: L.loot >= 0 ? { ...center(L.loot), z: L.lootZ, taken: false } : null,
    lamps: [], enemies: [], bullets: [], nades: [], parts: [], rings: [], texts: [], bodies: [], decals: [], flashes: [], items: [], warns: [], charges: [], crateHp: {}, fx: [],
    detected: false, kills: 0, silent: 0, time: 0, deathT: 0, exposure: 0, boss: null, banner: null, alarm: false, timer: 0, sirenT: 0, zone, introT: 1.6,
    mission: M, op: M.op, cash: 0, shownCash: 0, searched: new Set(), act: null, reinfT: 20, code: null, hasCode: false, codeDrawer: -1,
    doors: (L.secure || []).map(d => ({ ...d, x: (d.cells[0] % W + (d.v ? 0.5 : 1)) * T, y: (((d.cells[0] / W) | 0) + (d.v ? 1 : 0.5)) * T, open: false, hack: 0 })),
    vault: L.vault || null, idoors: (L.idoors || []).map(d => ({ ...d, x: (d.cells[0] % W + (d.v ? 0.5 : 1)) * T, y: (((d.cells[0] / W) | 0) + (d.v ? 1 : 0.5)) * T, open: false, t: 0, swing: 0 })), cams: [], camsOff: false, jams: 0, jamT: 0, drag: null,
    rain: !!M.rain && !boss, puddles: [], road: L.road || null, traffic: [], trafT: 2, copCars: [], dropCar: null, exitCar: null,
    obj: missionObjectives(level), civKilled: 0, subdued: 0, policeT: 0, police: false, alarmBeforeLoot: false, vaultBy: null, escaped: false,
  };
  if (r.loot) r.loot.type = SCENE_LOOT[M.scene] || 'lingotes';
  for (const s of L.lamps) {
    if (!maps[s.z]) continue;
    useFloor(s.z);
    const c = cellOf(s.x, s.y);
    if (BLOCK_SIGHT[map[c]] || map[c] === VOID || map[c] === WATER) continue;
    // hx/hy: dónde está la luminaria dibujada (en perspectiva, por encima de la base); ahí se le dispara
    const [hx, hy] = s.kind === 'street' ? [6, -30] : s.kind === 'floor' ? [0, -20] : s.kind === 'wallN' ? [0, -2] : [0, 2];
    r.lamps.push({ ...s, hx: s.x + hx, hy: s.y + hy, on: true, poly: visPoly(s.x, s.y, 0, Math.PI, s.r, 96) });
  }
  if (r.loot) { useFloor(r.loot.z); r.loot.poly = visPoly(r.loot.x, r.loot.y, 0, Math.PI, 80, 40); } // su propio brillo dorado
  useFloor(0);
  if (boss) {
    const bt = FOES[M.boss] ? M.boss : 'boss', b = makeEnemy(bt, 10 * W + 24, rand);
    b.hp = b.maxHp = Math.round(FOES[bt].hp * (1 + 0.35 * (level / BOSS_EVERY - 1)));
    b.a = Math.PI; b.lookA = b.a; // mira hacia la entrada
    r.enemies.push(b); r.boss = b;
  }
  // Enemigos lejos de la entrada y separados entre sí; los perros vigilan el patio y ~30 % guarda la primera planta
  // asalto: más y más duros; sigilo: algo menos
  const count = tut ? 0 : boss ? 3 + (level >> 2) : Math.min(28, Math.round((5 + level * 1.8) * (M.op === 'asalto' ? 1.4 : M.op === 'sigilo' ? 0.85 : 1)));
  const upCount = maps[1] ? Math.max(1, Math.round(count * 0.3)) : 0;
  const spawn = (z, cands, outside, n) => {
    useFloor(z);
    for (let tries = 0, made = 0; made < n && tries < 600 && cands.length; tries++) {
      let type = boss ? ['guard', 'elite', 'shield'][ri(3)] : pickFoe(level + (M.op === 'asalto' ? 2 : 0), rand());
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
  for (let i = 0; i < (tut ? 0 : 2 + ((level / 3) | 0)) && cands.length; i++) r.items.push({ ...center(cands[ri(cands.length)]), z: 0 });
  if (r.doors.length) { // el código de la cámara: en un cajón, en el bolsillo del supervisor o en la terminal
    r.code = String(1000 + ri(9000));
    const desks = [];
    for (let c = 0; c < W * H; c++) if (maps[0][c] === LOW && zone[c] && fks[0][c] !== 8 && L.spawnOk(c)) desks.push(c);
    if (desks.length) r.codeDrawer = desks[ri(desks.length)];
    const sup = r.enemies.filter(e => e.z === 0 && !FOES[e.type].melee && !FOES[e.type].post && !FOES[e.type].boss);
    if (sup.length) sup[ri(sup.length)].keycard = true;
  }
  r.terminal = L.terminal;
  if (PUBLIC[M.scene] && !boss && !tut) { // civiles: empleados y clientes que pasean por las salas (nunca en la cámara)
    const V = r.vault, civ = cands.filter(c => zone[c] && dist0[c] >= 4 && !(V && V.z === 0 && c % W >= V.x0 && c % W <= V.x1 && ((c / W) | 0) >= V.y0 && ((c / W) | 0) <= V.y1));
    for (let k = PUBLIC[M.scene] + Math.floor(level / 5), tries = 0; k > 0 && civ.length && tries < 200; tries++) {
      const c = civ[ri(civ.length)], q = center(c);
      if (r.enemies.some(e => Math.hypot(e.x - q.x, e.y - q.y) < T * 2)) continue;
      const e = makeEnemy(level >= 5 && k <= 1 + (level > 12) && rand() < 0.6 ? 'agent' : 'civil', c, rand); // algún agente de paisano entre ellos
      e.look = CIV_LOOKS[ri(CIV_LOOKS.length)]; e.skin = ri(SKIN.length);
      r.enemies.push(e); k--;
    }
  }
  if (!boss && !tut) { // cámaras de seguridad en las paredes de dentro, mirando hacia la sala; más en bancos, galerías y centros de datos
    const want = Math.min(7, ({ banco: 4, datos: 4, galeria: 3, joyeria: 3, museo: 4, casino: 4, oficinas: 2, almacen: 1 }[M.scene] || 2) + (level >> 2));
    for (let tries = 0; r.cams.length < want && tries < 800; tries++) {
      const c = cands[ri(cands.length)]; if (!c || !zone[c] || dist0[c] < 6) continue;
      const q = center(c), dirs = DIR4.filter(([dx, dy]) => maps[0][c + dy * W + dx] === WALL);
      if (!dirs.length) continue;
      const [dx, dy] = dirs[ri(dirs.length)], a0 = Math.atan2(-dy, -dx);
      if (castRay(q.x, q.y, -dx, -dy, 200) < 140 || r.cams.some(k => Math.hypot(k.x - q.x, k.y - q.y) < T * 7)) continue;
      r.cams.push({ x: q.x + dx * 17, y: q.y + dy * 17, z: 0, a0, a: a0, t: rand() * 6, on: true, spot: 0 });
    }
  }
  if (r.road) { // te deja un coche en la acera; el de extracción llegará cuando tengas el botín; peatones por las aceras
    const R = r.road, east = r.exit.x > r.start.x;
    r.dropCar = { x: r.start.x, y: R.east, a: Math.PI / 2, v: 0, t: 1.4, kind: 'sedan', paint: '#3a3f48' };
    r.exitCar = { state: 'away', x: east ? -80 : W * T + 80, y: R.east, a: east ? Math.PI / 2 : -Math.PI / 2, kind: M.car || 'van' };
    for (let k = 2 + ri(3) + Math.floor(level / 5), tries = 0; k > 0 && tries < 60; tries++) {
      const row = rand() < 0.6 ? H - 8 : H - 2, x = 3 + ri(W - 6);
      if (Math.abs(x - r.start.x / T) < 8) continue;
      const e = makeEnemy('civil', row * W + x, rand), x2 = clamp(x + (rand() < 0.5 ? -1 : 1) * (6 + ri(10)), 2, W - 3);
      Object.assign(e, { ped: true, look: CIV_LOOKS[ri(CIV_LOOKS.length)], skin: ri(SKIN.length), wps: [center(row * W + x), center(row * W + x2)], fleeTo: { x: x < W / 2 ? T : (W - 1) * T, y: (row + 0.5) * T } });
      e.goal = jitter(e.wps[1]);
      r.enemies.push(e); k--;
    }
  }
  if (!boss && !tut && (r.rain || rand() < 0.4)) for (let k = r.rain ? 22 : 10, tries = 0; k > 0 && tries < 400; tries++) { // charcos en el asfalto y las aceras (con lluvia, más)
    const c = ri(W * H), f = fks[0][c];
    if (maps[0][c] !== FLOOR || zone[c] || ![0, 2, 7, 11, 13, 17].includes(f)) continue;
    const q = center(c); r.puddles.push({ x: q.x + rnd(-10, 10), y: q.y + rnd(-10, 10), rx: 14 + rand() * 22, ry: 9 + rand() * 12, seed: rand() }); k--;
  }
  if (r.doors.length) r.obj.splice(0, 0, { id: 'vault', text: 'Abre la cámara acorazada', primary: true, state: 0 });
  if (M.op === 'asalto') { // entrar con todo: la alarma suena desde el principio y la policía ya está en camino
    r.alarm = true; r.detected = true; r.alarmBeforeLoot = true; r.policeT = POLICE_DELAY.asalto;
    for (const e of r.enemies) e.alertLvl = 1;
  }
  if (tut) { // el guardia del tutorial: de espaldas a la puerta, quieto y con la tarjeta
    r.tutorial = true; r.tut = 0; r.obj = []; r.code = '2580'; r.codeDrawer = -1;
    const g = makeEnemy('guard', 9 * W + 14, rand); Object.assign(g, { a: 0, lookA: 0, waitT: 1e9, lookT: 1e9, wps: [center(9 * W + 14)], keycard: true });
    r.enemies.push(g); r.tutGuard = g;
  }
  r.p = { x: r.start.x, y: r.start.y, z: 0, onStairs: false, vx: 0, vy: 0, a: 0, r: 12, speed: 0, sneak: true, stepT: 0, fireT: 0, reloadT: 0, meleeT: 0, nadeT: 0, noiseT: 0, breachT: 0, swingT: 0, hurtT: 0, muzzleT: 0, dead: false, stam: 100, restT: 0, tired: false, sprint: false, bloom: 0 };
  const goal = r.loot || r.exit;
  r.p.a = Math.atan2(goal.y - r.start.y, goal.x - r.start.x);
  // Cuenta atrás siempre: hasta dar el golpe (o abatir al jefe); al robar, otra más corta para escapar
  r.timer = tut ? 3600 : boss ? 480 : Math.round(240 + Math.hypot(goal.x - r.start.x, goal.y - r.start.y) / T * 3.5 + (r.doors.length ? 60 : 0));
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
  run = { level: 1, money: 0, hp: 100, maxHp: 100, nades: 2, charges: 2, light: true, weapons: [{ id: 'pistol', mods: [], ammo: 12, reserve: 36, at: 'normal', ats: ['normal'] }], cur: 0, seed: (Math.random() * 1e9) | 0, snap: null };
}
const curW = () => run.weapons[run.cur];
function wstats(w) {
  const s = { ...WEAPONS[w.id] };
  for (const m of w.mods) MODS[m].apply(s);
  if (w.at === 'ap') { s.dmg *= 0.9; s.pierce = true; } else if (w.at === 'hp') s.dmg *= 1.35; else if (w.at === 'inc') s.burn = true;
  return s;
}

// ---- Plan del golpe: por dónde entras y qué herramientas llevas (se pagan una vez por misión, en el briefing)
const ENTRIES = { door: ['Puerta principal', 0, 'Desde la calle'], sewer: ['Alcantarilla', 120, 'Sales por una arqueta dentro del edificio'], roof: ['Tejado', 90, 'Bajas a la primera planta (o por un tragaluz)'] };
const TOOLS = { jammer: ['Inhibidor de cámaras', 150, 'Ciega las cámaras cercanas 20 s · 2 usos'], pick: ['Ganzúa electrónica', 120, 'Hackeas el doble de rápido y sin pitidos'], disguise: ['Disfraz de guardia', 200, 'Te detectan mucho más despacio si no haces nada raro'] };
const freshPlan = () => ({ entry: 'door', tools: [], paid: [] });
const okPlan = q => q && ENTRIES[q.entry] && Array.isArray(q.tools) && q.tools.every(t => TOOLS[t]) && Array.isArray(q.paid) ? q : freshPlan(); // partidas de antes o corruptas
function planCost(plan) { return [plan.entry, ...plan.tools].filter(k => !plan.paid.includes(k)).reduce((a, k) => a + (ENTRIES[k] || TOOLS[k])[1], 0); }
function renderPlan() {
  const plan = run.plan, left = run.money - planCost(plan);
  const chip = (k, [name, price, desc], on, kind) => { const paid = plan.paid.includes(k), can = on || paid || price <= left;
    return `<button class="chip${on ? ' on' : ''}" data-plan="${kind}:${k}" ${can ? '' : 'disabled'} title="${desc}">${name}<small>${paid ? 'pagado' : price ? '$' + price : 'gratis'}</small></button>`; };
  $('bfPlan').innerHTML = `<p class="bf-h">Plan del golpe · te quedan $${left}</p><div class="chips">${Object.entries(ENTRIES).map(([k, v]) => chip(k, v, plan.entry === k, 'entry')).join('')}</div>` +
    `<div class="chips">${Object.entries(TOOLS).map(([k, v]) => chip(k, v, plan.tools.includes(k), 'tool')).join('')}</div>`;
}
function applyPlan(r) { // entrada elegida y herramientas: en un sitio de dentro lejos de los guardias (nunca encima del botín ni en la cámara)
  const plan = okPlan(run.plan);
  r.disguise = plan.tools.includes('disguise'); r.pick = plan.tools.includes('pick'); r.jams = plan.tools.includes('jammer') ? 2 : 0;
  if (plan.entry === 'door' || r.boss) return;
  const z = plan.entry === 'roof' && r.maps[1] ? 1 : 0, V = r.vault, M = r.maps[z], good = [];
  let far = null, fd = 0;
  for (let c = 0; c < W * H; c++) {
    if (M[c] !== FLOOR || (z === 0 && !zone[c])) continue;
    const q = center(c);
    if ((r.loot && Math.hypot(q.x - r.loot.x, q.y - r.loot.y) < 3 * T) || (V && V.z === z && c % W >= V.x0 - 1 && c % W <= V.x1 + 1 && ((c / W) | 0) >= V.y0 - 1 && ((c / W) | 0) <= V.y1 + 1)) continue;
    const d = r.enemies.reduce((m, e) => FOES[e.type].civil || e.z !== z ? m : Math.min(m, Math.hypot(e.x - q.x, e.y - q.y)), 1e9);
    if (d > 6 * T) good.push(q); if (d > fd) { fd = d; far = q; }
  }
  const q = good.length ? good[Math.floor(Math.random() * good.length)] : far;
  if (!q) return;
  Object.assign(r.p, { x: q.x, y: q.y, z, onStairs: false });
  const g = r.loot || r.exit; r.p.a = Math.atan2(g.y - q.y, g.x - q.x);
  r.entryHatch = { x: q.x, y: q.y, z };
}
function useItem() { // usa lo que haga falta: botiquín si estás muy herido, vendas si poco, bebida si vas sin aguante, analgésicos en combate
  if (state !== 'play' || !room || room.p.dead || room.heal) return;
  const I = run.items || {}, miss = run.maxHp - run.hp, p = room.p;
  const k = miss >= 45 && I.botiquin ? 'botiquin' : miss > 0 && I.vendas ? 'vendas' : miss > 0 && I.botiquin ? 'botiquin' : p.stam < 60 && I.energia ? 'energia' : I.analgesico && room.enemies.some(e => e.state === 'combat') ? 'analgesico' : null;
  if (!k) { banner('Ahora no te hace falta nada'); return; }
  I[k]--;
  if (k === 'vendas') room.heal = { amt: 25, t: 2, T: 2 }; else if (k === 'botiquin') room.heal = { amt: 60, t: 3, T: 3 };
  else if (k === 'energia') room.energyT = 20; else room.painT = 25;
  popup(p.x, p.y - 22, ITEMS[k][0].toUpperCase(), '#7fe0a8'); sfx('heal');
}
function tickItems(dt) { // curación poco a poco y efectos que duran (también en la persecución)
  if (room.heal) { const H = room.heal, k = Math.min(dt, H.t); run.hp = Math.min(run.maxHp, run.hp + H.amt * k / H.T); if ((H.t -= dt) <= 0) room.heal = null; }
  if (room.energyT > 0) room.energyT -= dt; if (room.painT > 0) room.painT -= dt;
}
function giveItem(k, x, y) { run.items = run.items || {}; if ((run.items[k] || 0) >= 5) return false; run.items[k] = (run.items[k] || 0) + 1; popup(x, y - 16, `+${ITEMS[k][0].toUpperCase()}`, '#7fe0a8'); sfx('reload'); return true; }
function useJammer() {
  if (state !== 'play' || !room || room.chase || room.jams <= 0 || room.jamT > 0) return;
  room.jams--; room.jamT = 20; room.jamX = room.p.x; room.jamY = room.p.y;
  banner('Inhibidor activado: las cámaras cercanas quedan ciegas 20 s'); sfx('radio');
}
function startRoom() {
  document.body.classList.remove('chase');
  run.plan = okPlan(run.plan);
  run.hp = run.maxHp; // cada sala (y cada reintento) empieza con la vida llena
  const { snap, ...rest } = run;
  run.snap = JSON.stringify(rest);
  room = buildRoom(run.level, run.seed + run.level * 977);
  if (room.op === 'asalto') { run.nades++; run.charges++; } // entrar con todo: una granada y una C4 de más
  applyPlan(room);
  bakeAll();
  if (room.tutorial) { decal({ x: 6 * T + 20, y: 3 * T + 20, r: 14, hatch: true }); decal({ x: 25 * T + 20, y: 9 * T + 20, r: 10, scorch: true }); } // la marca y la pared del C4
  if (room.entryHatch) { useFloor(room.entryHatch.z); decal({ ...room.entryHatch, r: 13, hatch: true }); useFloor(0); }
  cam.x = room.p.x; cam.y = room.p.y;
  if (room.boss) banner(`Sala final: abate a ${FOES[room.boss.type].title.replace(/^El /, 'el ').replace(/^La /, 'la ')} para abrir la salida`);
  sticks.L = sticks.R = null; mouse.down = false;
  state = 'play';
  show(null);
  save();
}
function retryRoom() {
  if (room.chase) { // caer en la persecución solo repite la persecución, con lo que llevabas al subir al coche
    const { cash, run: r } = room.chaseSnap;
    run = { ...JSON.parse(r), snap: run.snap, hp: run.maxHp };
    room.cash = cash;
    startChase(); state = 'play'; show(null);
    return;
  }
  const snap = run.snap;
  run = { ...JSON.parse(snap), snap };
  startRoom();
}
let winStats = '';
// ================= Persecución =================
// Tras subir al coche, en algunas misiones te persiguen. Vas asomado por el techo mirando hacia atrás: ves a los
// perseguidores de frente y los abates con la mira (stick derecho o ratón). Con el izquierdo le indicas al conductor
// que cambie de carril o acelere/frene; él solo esquiva el tráfico que tenéis delante. A los perseguidores se les derriba
// a tiros, con granadas (estallan al tocar un coche), embistiéndolos contra el quitamiedos o haciendo que choquen con el tráfico
const CAR_TOUGH = { van: 1, sedan: 1.15, suv: 0.85, armored: 0.6 }; // daño que recibe tu vehículo (y al revés, lo fuerte que embiste)
const LANES = [-210, -70, 70, 210], LANE_V = [300, 340, 380, 420]; // cuatro carriles; velocidad del tráfico en cada uno
// Perseguidores: ancho, largo (para chocar), alto (para dibujarlos y apuntar), vida y nivel desde el que salen
const PURSUERS = {
  moto:    { w: 12, h: 34, tall: 30, hp: 55,  col: '#1d2026', burst: [1, 2], weave: true, from: 1 },
  sedan:   { w: 28, h: 54, tall: 24, hp: 140, col: '#d9dce2', police: true, from: 1 },
  suv:     { w: 32, h: 58, tall: 30, hp: 175, col: '#1f2b23', from: 1 },
  pickup:  { w: 32, h: 60, tall: 28, hp: 165, col: '#5a3b2a', burst: [5, 8], gunner: true, from: 4 },
  swat:    { w: 38, h: 66, tall: 38, hp: 270, col: '#1d2638', police: true, ram: 0.85, from: 6 },
  armored: { w: 38, h: 68, tall: 34, hp: 330, col: '#3a3f36', from: 9 },
  rhino:   { w: 46, h: 92, tall: 46, hp: 900, col: '#2a2e33', gunner: true, burst: [6, 9], ram: 0.9, from: 999 }, // jefe de persecución: el Rinoceronte
};
const CAR_HP = { van: 240, sedan: 200, suv: 280, armored: 420 }; // vida de tu vehículo en la persecución
const CIVIL = { sedan: { w: 28, h: 54, tall: 24 }, van: { w: 34, h: 64, tall: 36 }, truck: { w: 40, h: 92, tall: 48 } };
function startChase() {
  const lv = run.level;
  if (!room.chaseSnap) { const { snap, ...rest } = run; room.chaseSnap = { cash: room.cash, run: JSON.stringify(rest) }; }
  room.chase = { t: 0, len: Math.min(95, 55 + lv * 2.5), speed: 520, roadW: 560, scroll: 0, car: { x: 0, y: 0, vx: 0, vy: 0 }, foes: [], traffic: [], spawnT: 1.5, trafT: 0.5, killed: 0, crashT: 0, done: false, doneT: 0,
    aim: { x: cw / 2, y: ch * 0.62 }, heli: null, heliT: lv >= 5 ? 14 : 1e9, shots: [], bend: 0, bendTo: 0, bendT: 4, sections: [], nextSec: 700, obst: [], obT: 10, bossDone: lv < 12 };
  room.chase.car.hp = room.chase.car.maxHp = CAR_HP[room.mission.car] || 240;
  Object.assign(room, { bullets: [], nades: [], fx: [], parts: [], flashes: [], texts: [], rings: [], warns: [], enemies: [], act: null, introT: 0 });
  document.body.classList.add('chase'); // en la carretera sobran C4, ruido, cuchillo y sigilo
  Object.assign(room.p, { x: 0, y: 0, z: 0, vx: 0, vy: 0, a: Math.PI / 2, dead: false });
  useFloor(0);
  banner('¡Te persiguen! Apunta hacia atrás y derríbalos');
  sfx('vault');
}
// Cámara en tu techo mirando hacia atrás: proyecta un punto del mundo (x lateral, y longitudinal, h altura) a la pantalla
function chaseCam() { const C = room.chase; return { x: C.car.x, y: C.car.y - 10, h: 62, F: ch * 0.95, yH: ch * 0.36, cx: cw / 2, bend: C.bend }; }
function proj(K, x, y, h) { const z = y - K.y; if (z < 30) return null; const s = K.F / z; return { x: K.cx + (x - K.x + K.bend * z * z) * s, y: K.yH + (K.h - h) * s, s, z }; }
function chaseTargets() {
  const C = room.chase, H = C.heli;
  return [...C.traffic.map(o => ({ o, civ: true })), ...C.foes.filter(f => !f.dead).map(o => ({ o })), ...(H && !H.dead ? [{ o: H, heli: true }] : [])];
}
function pickAt(sx, sy) { // el blanco más cercano bajo la mira: el tráfico tapa a los que van detrás
  const K = chaseCam(); let best = null;
  for (const t of chaseTargets()) {
    const o = t.o, q = t.heli ? proj(K, o.x, o.y, o.h - 16) : proj(K, o.x, o.y - o.h / 2, 0); if (!q) continue;
    const top = q.y - (t.heli ? 36 : o.tall) * q.s;
    if (Math.abs(sx - q.x) < o.w * q.s / 2 && sy > top && sy < q.y && (!best || q.z < best.z)) best = { ...t, z: q.z, wx: o.x + (sx - q.x) / q.s, wh: (q.y - sy) / q.s + (t.heli ? o.h - 16 : 0) };
  }
  return best;
}
function carDamage(n, msg) { // daño a tu vehículo; a cero, avería y os atrapan
  const C = room.chase, car = C.car;
  car.hp -= n * CAR_TOUGH[room.mission.car];
  if (msg) popup(car.x, car.y - 40, msg, '#ff8a5c');
  if (car.hp <= 0 && !room.p.dead) { car.hp = 0; room.p.dead = true; room.deathT = 1.4; C.wrecked = true; chaseBoom(car.x, car.y + 40); banner('¡El coche ha quedado destrozado!'); }
}
function chaseBoom(x, y) {
  const C = room.chase, R = 125;
  fx({ k: 'fire', x, y, life: 0.42, r: R * 0.85 }); fx({ k: 'ring', x, y, life: 0.3, r: R * 1.3 });
  for (let i = 0; i < 6; i++) { const a = rnd(0, 6.3), v = rnd(10, 50); fx({ k: 'smoke', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 200, life: rnd(1, 1.8), r0: rnd(12, 20), r1: rnd(40, 60), g: Math.floor(rnd(60, 90)) }); }
  for (let i = 0; i < 16; i++) { const a = rnd(0, 6.3), v = rnd(80, 300); room.parts.push({ x, y, z: 0, h: rnd(5, 40), vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: rnd(0.4, 0.9), c: '#ffb04a', s: 2, glow: true }); }
  for (const f of C.foes) { const d = Math.hypot(f.x - x, f.y - y); if (!f.dead && d < R) { hitCar(f, 260 * (1 - d / R) + 60); f.vx += Math.sign(f.x - x || 1) * 160; } }
  for (const t of C.traffic) if (!t.wreck && Math.hypot(t.x - x, t.y - y) < R * 0.6) wreck(t);
  const p = room.p, dp = Math.hypot(p.x - x, p.y - y);
  if (dp < R && !room.p.dead) { carDamage(45 * (1 - dp / R) + 8); hurtPlayer((12 * (1 - dp / R) + 3) * CAR_TOUGH[room.mission.car], Math.atan2(p.y - y, p.x - x)); } // la carrocería se lleva casi todo
  cam.shake = 14; buzz(80); sfx('boom', x, y);
}
function hitCar(f, dmg, why) {
  const C = room.chase;
  f.hp -= dmg; f.hitT = 0.1;
  if (f.hp > 0 || f.dead) return;
  f.dead = true; f.spin = rnd(-4, 4); f.vx = rnd(-120, 120); C.killed++;
  const reward = f.kind === 'rhino' ? 600 + run.level * 20 : Math.round((70 + run.level * 6) * (why ? 1.5 : 1)); // derribarlos con el coche paga más
  room.cash += reward; popup(f.x, f.y - f.h / 2, `${why ? why + ' ' : ''}+$${reward}`, '#7fe0a8');
  chaseBoom(f.x, f.y);
}
function hitHeli(dmg) {
  const C = room.chase, H = C.heli;
  if (!H || H.dead) return;
  H.hp -= dmg; H.hitT = 0.1;
  if (H.hp > 0) return;
  H.dead = true; H.spin = (Math.random() < 0.5 ? -1 : 1) * rnd(2, 3.5); C.killed++;
  const reward = 300 + run.level * 20;
  room.cash += reward; popup(H.x, H.y, `¡Helicóptero derribado! +$${reward}`, '#7fe0a8');
  sfx('boom', H.x, H.y); cam.shake = 10;
}
function wreck(t) { // un coche del tráfico queda siniestrado y se queda atrás
  t.wreck = true; t.spin = rnd(-3, 3); t.vx = rnd(-60, 60);
}
const overlap = (a, b, pad = 0) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + pad && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + pad;
function tickReload(dt) {
  const p = room.p;
  if (p.reloadT > 0 && (p.reloadT -= dt) <= 0) { const w = curW(), n = Math.min(wstats(w).mag - w.ammo, w.reserve); w.ammo += n; w.reserve -= n; }
  if (p.burstLeft > 0 && p.fireT <= 0) { if (wstats(curW()).burst) shoot(); else p.burstLeft = 0; } // lo que queda de la ráfaga (si sigues con esa arma)
}
function updateChase(dt) {
  const C = room.chase, p = room.p, lv = run.level, rw = C.roadW, car = C.car, kind = room.mission.car, tough = CAR_TOUGH[kind], U = ch / 390;
  [car.w, car.h] = CAR_DIM[kind];
  room.time += dt; C.t += dt; C.scroll += C.speed * dt; C.crashT -= dt;
  if (p.dead) { if ((room.deathT -= dt) <= 0) gameOver('TE HAN ATRAPADO', C.wrecked ? `El coche quedó destrozado en la persecución de ${room.mission.name}.` : `Te alcanzaron en la persecución de ${room.mission.name}.`); }
  else {
    for (const k of ['fireT', 'meleeT', 'nadeT', 'noiseT', 'breachT', 'swingT', 'hurtT', 'muzzleT']) p[k] -= dt;
    p.bloom = Math.max(0, p.bloom - dt * 1.6);
    // conductor: lo que le pides con el stick izquierdo (o WASD) y, si no le pides nada, esquiva el tráfico de delante
    const L = stickVec(sticks.L), kx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), ky = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
    let steer = kx || L.x || pad.L.x;
    if (Math.abs(steer) < 0.5) for (const t of C.traffic) if (!t.wreck && t.y < car.y && car.y - t.y < 280 && Math.abs(t.x - car.x) < (t.w + car.w) / 2 + 14) steer = Math.sign(car.x - t.x || -car.x || 1) * (Math.abs(car.x) > rw / 2 - 70 ? -1 : 1);
    for (const o of C.obst) if (o.y < car.y && car.y - o.y < 480 && car.x + car.w / 2 + 16 > o.x0 && car.x - car.w / 2 - 16 < o.x1) { // control o pinchos delante: el conductor se aparta sí o sí
      const free = LANES.filter(x => x + 40 < o.x0 || x - 40 > o.x1);
      if (free.length) { const tx = free.reduce((a, b) => Math.abs(b - car.x) < Math.abs(a - car.x) ? b : a); steer = clamp((tx - car.x) / 40, -1, 1); }
    }
    car.vx += (steer * 260 - car.vx) * Math.min(1, dt * 6);
    car.vy += ((ky || L.y || pad.L.y) * 210 - car.vy) * Math.min(1, dt * 4);
    car.x += car.vx * dt; car.y = clamp(car.y + car.vy * dt, -120, 160);
    const edge = rw / 2 - car.w / 2 - 4;
    if (Math.abs(car.x) > edge) { if (Math.abs(car.vx) > 90) sfx('clank', car.x, car.y); car.x = Math.sign(car.x) * edge; car.vx *= -0.3; }
    p.x = car.x; p.y = car.y; p.speed = 0; p.sneak = false; p.a = Math.PI / 2; // disparas hacia atrás; la dispersión se aplica en la mira
    // mira: el stick derecho la desplaza (y dispara sola sobre un perseguidor); en PC va con el ratón
    const R = stickVec(sticks.R);
    let firing = false;
    if (sticks.R) { C.aim.x += R.x * 1150 * settings.sens * U * dt; C.aim.y += R.y * 1150 * settings.sens * U * dt; firing = R.m > FIRE; }
    else if (padMode) { C.aim.x += pad.R.x * 1000 * settings.sens * U * dt; C.aim.y += pad.R.y * 1000 * settings.sens * U * dt; firing = pad.fire; }
    else if (mouse.active && !touchMode) { C.aim.x = mouse.x * cw / vw; C.aim.y = mouse.y * ch / vh; firing = mouse.down; }
    C.aim.x = clamp(C.aim.x, 0, cw); C.aim.y = clamp(C.aim.y, ch * 0.06, ch * 0.92);
    const tgt = pickAt(C.aim.x, C.aim.y);
    C.onTarget = !!tgt && !tgt.civ;
    if ((touchMode && sticks.R) || (padMode && pad.R.m > 0)) {
      if (!padMode) firing = firing || C.onTarget;
      const K = chaseCam(); let best = null, bd = 80 * U; // ayuda de apuntado: la mira se deja llevar hacia el perseguidor más cercano
      for (const t of chaseTargets()) if (!t.civ) { const o = t.o, q = t.heli ? proj(K, o.x, o.y, o.h) : proj(K, o.x, o.y - o.h / 2, o.tall / 2); if (q) { const d = Math.hypot(q.x - C.aim.x, q.y - C.aim.y); if (d < bd) { bd = d; best = q; } } }
      if (best) { C.aim.x += (best.x - C.aim.x) * Math.min(1, dt * 3); C.aim.y += (best.y - C.aim.y) * Math.min(1, dt * 3); }
    }
    tickReload(dt);
    if (firing) shoot();
  }
  for (const b of room.bullets) if (b.mine && !b.dead) { // cada perdigón se resuelve en la mira, con su dispersión
    b.dead = true;
    const dev = angDiff(Math.PI / 2, Math.atan2(b.vy, b.vx)), sx = C.aim.x + dev * ch * 1.1, sy = C.aim.y + rnd(-1, 1) * Math.abs(dev) * ch * 0.5;
    const hit = pickAt(sx, sy);
    C.shots.push({ x: sx, y: sy, t: 0.07, hit: !!hit });
    if (!hit) continue;
    const hy = hit.heli ? hit.o.y : hit.o.y - hit.o.h / 2;
    for (let i = 0; i < 3; i++) { const a = rnd(0, 6.3), v = rnd(40, 160); room.parts.push({ x: hit.wx, y: hy, z: 0, h: hit.wh, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.3, t: rnd(0.12, 0.3), c: '#ffd98a', s: 2 }); }
    if (b.boom) chaseBoom(hit.wx, hy);
    else if (hit.heli) hitHeli(b.dmg);
    else if (!hit.civ) hitCar(hit.o, b.dmg);
  }
  for (const q of C.shots) q.t -= dt;
  C.shots = C.shots.filter(q => q.t > 0);
  // Curvas, túneles y puentes (por coordenada de carretera: lo que ya has pasado se va quedando atrás)
  if ((C.bendT -= dt) <= 0) { C.bendT = rnd(5, 10); C.bendTo = [-0.00022, -0.0001, 0, 0, 0.0001, 0.00022][Math.floor(Math.random() * 6)]; }
  C.bend += (C.bendTo - C.bend) * Math.min(1, dt * 0.6);
  const Rc = C.scroll - car.y + 10;
  if (Rc > C.nextSec) { const kind = C.sections.length % 2 ? 'bridge' : 'tunnel', len = kind === 'tunnel' ? rnd(1400, 2400) : rnd(900, 1500); C.sections.push({ kind, R0: Rc + 40, R1: Rc + 40 + len }); C.nextSec = Rc + 40 + len + rnd(1600, 3000); }
  C.sections = C.sections.filter(sc => Rc - sc.R1 < 2400);
  // Controles policiales y pinchos: vienen de delante (no los ves) y el conductor los esquiva; a los perseguidores les cuesta más
  if (C.t > 8 && C.t < C.len && (C.obT -= dt) <= 0) {
    C.obT = rnd(13, 22);
    const kind = Math.random() < 0.55 ? 'block' : 'spikes', i = Math.floor(Math.random() * 3), x0 = LANES[i] - 60, x1 = LANES[i + (kind === 'block' ? 1 : 0)] + 60;
    C.obst.push({ kind, y: car.y - 900, x0, x1 });
    banner(kind === 'block' ? '¡Control policial más adelante! El conductor intenta esquivarlo' : '¡Pinchos en la carretera!');
  }
  for (const o of C.obst) {
    o.y += C.speed * dt;
    const box = { x: (o.x0 + o.x1) / 2, y: o.y, w: o.x1 - o.x0, h: o.kind === 'block' ? 36 : 14 };
    if (!o.hit && overlap(car, box)) { o.hit = true; carDamage(o.kind === 'block' ? 45 : 30, o.kind === 'block' ? '¡Os habéis comido el control!' : '¡Pinchazo!'); if (o.kind === 'block') { car.vy = 260; cam.shake = 12; } sfx('clank', car.x, car.y); }
    for (const f of C.foes) if (!f.dead && !f.spiked && overlap(f, box)) { if (o.kind === 'block') hitCar(f, 9999, '¡Contra el control!'); else { f.spiked = true; hitCar(f, 90, '¡Pinchazo!'); } }
  }
  C.obst = C.obst.filter(o => o.y < car.y + 2400);
  if (!C.bossDone && C.t > C.len * 0.5) { // el Rinoceronte: un camión blindado con torreta que embiste
    C.bossDone = true; const P = PURSUERS.rhino, hp = P.hp + lv * 30;
    C.foes.push({ kind: 'rhino', w: P.w, h: P.h, tall: P.tall, x: 0, y: car.y + 1100, vx: 0, rot: 0, hp, maxHp: hp, side: 1, off: 0, dy: 260, mode: 'follow', modeT: 4, skill: 0.95, shootT: 1.5, gunT: 0, burst: 0, police: false, ph: 0 });
    banner('¡El Rinoceronte! Un camión blindado viene a por vosotros');
  }
  if (car.hp < car.maxHp * 0.5 && Math.random() < dt * (car.hp < car.maxHp * 0.25 ? 16 : 6)) fx({ k: 'smoke', x: car.x + rnd(-10, 10), y: car.y + car.h / 2 + 6, h: 30, vx: rnd(-10, 10), vy: 260, life: 1, r0: 5, r1: 22, g: car.hp < car.maxHp * 0.25 ? 30 : 75 }); // el coche echa humo
  // Tráfico: más lento que tú, cada carril a su velocidad; lo adelantas y se va quedando atrás
  if ((C.trafT -= dt) <= 0) {
    C.trafT = rnd(0.8, 1.7);
    const i = Math.floor(Math.random() * 4), y = car.y - 700;
    if (!C.traffic.some(t => t.lane === i && Math.abs(t.y - y) < 260)) {
      const k = Math.random() < 0.18 ? 'truck' : Math.random() < 0.35 ? 'van' : 'sedan', D = CIVIL[k];
      C.traffic.push({ kind: k, lane: i, x: LANES[i] + rnd(-12, 12), y, w: D.w, h: D.h, tall: D.tall, v: LANE_V[i], vx: 0, rot: 0, col: ['#7a2f2a', '#c8c2b0', '#2f5d7a', '#6b6f75', '#3d6b3f', '#a07a2a'][Math.floor(Math.random() * 6)] });
    }
  }
  for (const t of C.traffic) {
    if (t.wreck) { t.y += C.speed * dt; t.x += t.vx * dt; t.vx *= Math.exp(-2 * dt); t.rot += t.spin * dt; t.spin *= Math.exp(-1.5 * dt); if (Math.random() < dt * 8) fx({ k: 'smoke', x: t.x, y: t.y, vx: 0, vy: 200, life: 1, r0: 6, r1: 20, g: 50 }); }
    else { t.y += (C.speed - t.v) * dt; t.x += (LANES[t.lane] - t.x) * Math.min(1, dt * 0.8) + t.vx * dt; t.vx *= Math.exp(-3 * dt); t.rot = t.vx * 0.002; }
    if (!p.dead && overlap(car, t) && C.crashT <= 0) { // os coméis un coche: daño, frenazo y volantazo
      C.crashT = 0.6; car.vy = 260; car.vx = Math.sign(car.x - t.x || 1) * 200; t.vx -= Math.sign(car.x - t.x || 1) * 120;
      carDamage(18); hurtPlayer(3 * tough, -Math.PI / 2); sfx('clank', t.x, t.y); cam.shake = 9; buzz(40);
      if (!t.wreck && tough < 0.7) wreck(t); // el blindado se los lleva por delante
    }
  }
  C.traffic = C.traffic.filter(t => t.y < car.y + 1800);
  // Perseguidores: llegan desde lejos, se abren por la calzada y disparan; de vez en cuando se lanzan a embestirte
  const alive = C.foes.filter(f => !f.dead);
  if (C.t < C.len && alive.length < Math.min(5, 2 + (lv >> 2)) && (C.spawnT -= dt) <= 0) {
    C.spawnT = rnd(2.2, 4.2);
    const pool = Object.keys(PURSUERS).filter(k => lv >= PURSUERS[k].from), fk = pool[Math.floor(Math.random() * pool.length)], P = PURSUERS[fk], hp = P.hp + lv * 8;
    C.foes.push({ kind: fk, w: P.w, h: P.h, tall: P.tall, x: rnd(-rw / 2 + 40, rw / 2 - 40), y: car.y + 1100, vx: 0, rot: 0, hp, maxHp: hp, side: Math.random() < 0.5 ? -1 : 1, off: 0, dy: rnd(150, 420), mode: 'follow', modeT: rnd(3, 6), skill: rnd(0.45, 0.95), shootT: rnd(1, 2), gunT: 0, burst: 0, police: !!P.police, ph: rnd(0, 6.3) });
  }
  for (const f of C.foes) {
    const P = PURSUERS[f.kind];
    if (f.dead) { f.y += 340 * dt; f.x += f.vx * dt; f.rot += f.spin * dt; if (Math.random() < dt * 20) fx({ k: 'smoke', x: f.x, y: f.y, vx: 0, vy: 260, life: 1, r0: 8, r1: 26, g: 40 }); continue; }
    f.hitT = Math.max(0, (f.hitT || 0) - dt);
    if ((f.modeT -= dt) <= 0) { // cambia de táctica: seguirte o lanzarse contra ti
      if (f.mode === 'follow' && lv >= 3 && Math.random() < (P.ram || 0.45)) { f.mode = 'ram'; f.modeT = 2.2; }
      else { f.mode = 'follow'; f.modeT = rnd(3, 6); f.side = Math.random() < 0.5 ? -1 : 1; f.dy = rnd(150, 420); f.off = rnd(0, Math.min(200, f.dy * 0.8)); } // siempre a la vista: de cerca, no muy abiertos
    }
    f.off = Math.min(f.off, Math.max(0, (f.y - car.y) * 0.8)); // si se acerca, se cierra hacia el centro para no salirse de la vista
    let tx = f.mode === 'ram' ? car.x : car.x + f.side * f.off, ty = car.y + (f.mode === 'ram' ? (f.h + car.h) / 2 - 6 : f.dy);
    if (P.weave) tx += Math.sin(C.t * 2.6 + f.ph) * 70;
    for (const t of C.traffic) { // esquivan el tráfico que tienen delante, unos mejor que otros
      if (t.y < f.y && f.y - t.y < 170 && Math.abs(t.x - f.x) < (t.w + f.w) / 2 + 14) tx = f.x + Math.sign(f.x - t.x || f.side) * 120 * f.skill;
    }
    tx = clamp(tx, -rw / 2 + 30, rw / 2 - 30);
    const vmax = f.mode === 'ram' ? 260 : P.weave ? 220 : 170;
    f.vx += (clamp((tx - f.x) / 40, -1, 1) * vmax - f.vx) * Math.min(1, dt * 2.5);
    f.x += f.vx * dt;
    f.y += clamp(ty - f.y, -260 * dt, 260 * dt);
    const fe = rw / 2 - f.w / 2 - 3;
    if (Math.abs(f.x) > fe) { // contra el quitamiedos
      if (Math.abs(f.vx) > 140) { hitCar(f, Math.abs(f.vx) * 0.25, '¡Al quitamiedos!'); sfx('clank', f.x, f.y); }
      f.x = Math.sign(f.x) * fe; f.vx *= -0.3;
    }
    for (const g of C.foes) { // no se montan unos encima de otros
      if (g === f || g.dead) continue;
      const ox = (f.w + g.w) / 2 + 4 - Math.abs(f.x - g.x), oy = (f.h + g.h) / 2 + 4 - Math.abs(f.y - g.y);
      if (ox <= 0 || oy <= 0) continue;
      if (ox < oy) f.x += Math.sign(f.x - g.x || 1) * ox / 2;
      else { f.y += Math.sign(f.y - g.y || 1) * oy / 2; f.dy = clamp(f.y - car.y, 120, 520); }
    }
    for (const t of C.traffic) if (!t.wreck && overlap(f, t)) { wreck(t); hitCar(f, 9999, '¡Estrellado!'); break; }
    if (f.dead) continue;
    f.rot = f.vx * 0.0016;
    if (!p.dead && overlap(f, car, 2)) { // embestida: el golpe lateral daña a los dos; el que va más rápido gana
      const push = Math.sign(f.x - car.x) || 1, rel = Math.abs(car.vx - f.vx);
      const mine = (car.vx - f.vx) * push > 0; // sois vosotros quienes empujáis
      f.vx = push * (mine ? 260 / tough : 160); car.vx = -push * (mine ? 80 : 200 * tough);
      if (Math.abs(f.y - car.y) > (f.h + car.h) / 2 - 10) { car.vy -= 140; f.y += 30; } // por detrás: os empuja hacia delante
      hitCar(f, (12 + rel * 0.12) / tough, mine ? '¡Embestido!' : null);
      if (!mine || f.mode === 'ram') { carDamage(f.kind === 'rhino' ? 30 : f.mode === 'ram' ? 14 : 6); hurtPlayer((f.mode === 'ram' ? 3 : 1) * tough, 0); }
      sfx('clank', f.x, f.y); cam.shake = 8; buzz(30);
      if (f.mode === 'ram') { f.mode = 'follow'; f.modeT = rnd(2, 4); f.dy = rnd(200, 400); }
    }
    if (!p.dead && f.y - car.y < 750 && (f.shootT -= dt) <= 0) { f.shootT = rnd(1.4, 2.4); f.burst = P.burst ? P.burst[0] + Math.floor(Math.random() * (P.burst[1] - P.burst[0] + 1)) : 3 + Math.floor(Math.random() * 3); }
    if (f.burst > 0 && (f.gunT -= dt) <= 0) {
      f.gunT = P.gunner ? 0.09 : 0.13; f.burst--;
      const my = f.y - f.h / 2, a = Math.atan2(p.y - my, p.x - f.x);
      bullet(f.x, my, a + rnd(-0.15, 0.15), 680, 5 + lv * 0.3, false); // disparan desde un coche en marcha: fallan bastante
      Object.assign(room.bullets[room.bullets.length - 1], { life: 2.5, hh: f.tall * 0.8, d0: Math.hypot(p.x - f.x, p.y - my) });
      fx({ k: 'muzzle', x: f.x, y: my, h: f.tall * 0.8, life: 0.06, s: 1 });
      sfx('eshot', f.x, f.y);
    }
    if (f.hp < f.maxHp * 0.5 && Math.random() < dt * (f.hp < f.maxHp * 0.25 ? 18 : 7)) fx({ k: 'smoke', x: f.x, y: f.y - f.h / 2, h: f.tall, vx: 0, vy: 220, life: 0.9, r0: 5, r1: 18, g: f.hp < f.maxHp * 0.25 ? 30 : 70 }); // tocado: echa humo
  }
  C.foes = C.foes.filter(f => !(f.dead && f.y > car.y + 1800));
  // Helicóptero (desde la misión 5): ronda por detrás, os ilumina con el foco y barre con la ametralladora
  if (!C.heli && C.t > C.heliT && C.t < C.len) { const hp = 520 + lv * 25; C.heli = { x: rnd(-200, 200), y: car.y + 1300, h: 125, w: 64, hp, maxHp: hp, t: 0, shootT: 3, burst: 0, gunT: 0, hitT: 0 }; banner('¡Helicóptero! Dispárale al fuselaje'); }
  const H = C.heli;
  if (H) {
    H.t += dt; H.hitT = Math.max(0, H.hitT - dt);
    if (H.dead) {
      H.h -= 110 * dt; H.y += 150 * dt; H.x += H.spin * 25 * dt;
      if (Math.random() < dt * 25) fx({ k: 'smoke', x: H.x, y: H.y, h: H.h, vx: 0, vy: 150, life: 1.2, r0: 8, r1: 30, g: 35 });
      if (H.h <= 0) { chaseBoom(H.x, H.y); C.heli = null; C.heliT = C.t + 30; }
    } else {
      const tx = car.x + Math.sin(H.t * 0.5) * 200, ty = car.y + 380 + Math.sin(H.t * 0.31) * 80;
      H.x += clamp(tx - H.x, -130 * dt, 130 * dt); H.y += clamp(ty - H.y, -300 * dt, 300 * dt);
      if (!p.dead && H.y - car.y < 800 && (H.shootT -= dt) <= 0) { H.shootT = rnd(2.4, 3.6); H.burst = 9; }
      if (H.burst > 0 && (H.gunT -= dt) <= 0) {
        H.gunT = 0.08; H.burst--;
        bullet(H.x, H.y, Math.atan2(p.y - H.y, p.x - H.x) + rnd(-0.1, 0.1), 700, 4 + lv * 0.3, false);
        Object.assign(room.bullets[room.bullets.length - 1], { life: 2.5, hh: H.h - 20, d0: Math.hypot(p.x - H.x, p.y - H.y) });
        fx({ k: 'muzzle', x: H.x, y: H.y, h: H.h - 20, life: 0.05, s: 1.2 });
        sfx('eshot', H.x, H.y);
      }
    }
  }
  for (const b of room.bullets) if (!b.dead) { // balas de ellos: vuelan hacia vosotros; el tráfico hace de parapeto
    const n = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 10);
    for (let i = 0; i < n && !b.dead; i++) {
      b.x += b.vx * dt / n; b.y += b.vy * dt / n;
      if (!b.hh || b.hh < 60) for (const t of C.traffic) if (Math.abs(b.x - t.x) < t.w / 2 && Math.abs(b.y - t.y) < t.h / 2) { b.dead = true; break; }
      if (!b.dead && !p.dead && Math.abs(b.x - car.x) < car.w / 2 && Math.abs(b.y - car.y) < car.h / 2) { b.dead = true; carDamage(b.dmg * 0.4); hurtPlayer(b.dmg * 0.12 * tough, Math.atan2(b.vy, b.vx)); }
    }
    if ((b.life -= dt) <= 0 || Math.abs(b.x) > 900 || Math.abs(b.y - car.y) > 1900) b.dead = true;
  }
  room.bullets = room.bullets.filter(b => !b.dead);
  for (const n of room.nades) { // la granada vuela en arco hacia la mira, rueda hacia atrás con la carretera y estalla al tocar un coche
    n.vh -= 520 * dt; n.h += n.vh * dt;
    if (n.h <= 0) { n.h = 0; n.vh = n.vh < -40 ? n.vh * -0.42 : 0; n.vy += (C.speed - n.vy) * Math.min(1, dt * 6); n.vx *= Math.exp(-4 * dt); }
    n.x += n.vx * dt; n.y += n.vy * dt;
    const box = { x: n.x, y: n.y, w: 8, h: 8 };
    if (n.t < 1.55 && [...C.foes.filter(f => !f.dead), ...C.traffic].some(c => n.h < c.tall && overlap(box, c))) n.t = 0;
    if ((n.t -= dt) <= 0) chaseBoom(n.x, n.y);
  }
  room.nades = room.nades.filter(n => n.t > 0);
  for (const f of room.fx) if (f.k === 'smoke' || f.k === 'puff') f.y += C.speed * 0.6 * dt; // el humo se queda atrás
  updateFx(dt);
  if (room.banner && (room.banner.t -= dt) <= 0) room.banner = null;
  room.shownCash += (room.cash - room.shownCash) * Math.min(1, dt * 5);
  tickItems(dt);
  ambience(true);
  if (!C.done && C.t >= C.len && C.foes.every(f => f.dead) && !C.heli) { C.done = true; C.doneT = 1.6; banner('¡Los has perdido! Rumbo a la guarida'); }
  if (C.done && (C.doneT -= dt) <= 0) { room.chaseWon = true; completeRoom(); }
}
// ---- Vista trasera: coches de frente, helicóptero, carretera en perspectiva con farolas y faros
function drawFront(c, kind, x, y, s, col, o = {}) { // (x, y) = suelo bajo el parachoques delantero; s = escala
  const D = PURSUERS[kind] || CIVIL[kind], w = D.w * s, h = D.tall * s;
  c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot);
  c.fillStyle = 'rgba(0,0,0,0.55)'; c.beginPath(); c.ellipse(0, 0, w * 0.65, Math.max(1, w * 0.1), 0, 0, 7); c.fill();
  if (kind === 'moto') {
    c.fillStyle = '#0b0c0e'; c.beginPath(); c.ellipse(0, -h * 0.17, w * 0.28, h * 0.18, 0, 0, 7); c.fill(); // rueda
    c.fillStyle = '#2a2d33'; c.fillRect(-w * 0.12, -h * 0.5, w * 0.24, h * 0.3); // horquilla
    c.strokeStyle = '#15171a'; c.lineWidth = Math.max(1, h * 0.04); c.beginPath(); c.moveTo(-w * 0.9, -h * 0.58); c.lineTo(w * 0.9, -h * 0.58); c.stroke(); // manillar
    c.fillStyle = col; c.beginPath(); c.moveTo(-w * 0.55, -h * 0.55); c.lineTo(w * 0.55, -h * 0.55); c.lineTo(w * 0.42, -h * 0.85); c.lineTo(-w * 0.42, -h * 0.85); c.fill(); // piloto
    c.fillStyle = '#121418'; c.beginPath(); c.arc(0, -h * 0.93, w * 0.38, 0, 7); c.fill(); // casco
    c.fillStyle = 'rgba(140,170,200,0.45)'; c.fillRect(-w * 0.26, -h * 0.96, w * 0.52, h * 0.06); // visera
    c.fillStyle = o.lights === false ? '#333' : '#fff6d8'; c.beginPath(); c.arc(0, -h * 0.44, w * 0.16, 0, 7); c.fill();
    if (o.hit) { c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(-w / 2, -h, w, h); }
    c.restore(); return;
  }
  const tall = kind === 'swat' || kind === 'truck' || kind === 'van' || kind === 'rhino', cab = tall ? 0.94 : kind === 'armored' ? 0.86 : 0.74;
  c.fillStyle = '#0b0c0e'; c.fillRect(-w * 0.5, -h * 0.2, w * 0.17, h * 0.22); c.fillRect(w * 0.33, -h * 0.2, w * 0.17, h * 0.22); // ruedas
  c.fillStyle = col; rrect(c, -w / 2, -h * 0.58, w, h * 0.45, Math.max(1, h * 0.07)); c.fill(); // carrocería
  c.beginPath(); c.moveTo(-w * cab / 2, -h * 0.56); c.lineTo(w * cab / 2, -h * 0.56); c.lineTo(w * cab * 0.43, -h); c.lineTo(-w * cab * 0.43, -h); c.closePath(); c.fill(); // cabina
  c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(-w / 2, -h * 0.58, w, h * 0.04); // brillo del capó
  c.fillStyle = kind === 'armored' || kind === 'rhino' ? '#0a0d10' : '#1a2838';
  if (kind === 'armored' || kind === 'rhino') c.fillRect(-w * cab * 0.36, -h * 0.82, w * cab * 0.72, h * 0.07); // tronera
  else { c.beginPath(); c.moveTo(-w * cab * 0.45, -h * 0.6); c.lineTo(w * cab * 0.45, -h * 0.6); c.lineTo(w * cab * 0.37, -h * 0.95); c.lineTo(-w * cab * 0.37, -h * 0.95); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(170,200,230,0.22)'; c.lineWidth = Math.max(1, w * 0.04); c.beginPath(); c.moveTo(-w * cab * 0.25, -h * 0.62); c.lineTo(-w * cab * 0.05, -h * 0.92); c.stroke(); } // reflejo
  if (o.police && kind === 'sedan') { c.fillStyle = '#15171b'; c.fillRect(-w / 2, -h * 0.34, w, h * 0.13); }
  c.fillStyle = '#0e0f11'; c.fillRect(-w * 0.22, -h * 0.4, w * 0.44, h * 0.12); // rejilla
  if (kind === 'armored' || kind === 'swat' || kind === 'rhino') { c.fillStyle = kind === 'rhino' ? '#8a6a1a' : '#2a2d31'; c.fillRect(-w * 0.52, -h * 0.26, w * 1.04, h * 0.08); } // defensa
  c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(-w / 2, -h * 0.16, w, h * 0.04); // parachoques
  c.fillStyle = o.lights === false ? '#333' : '#fff6d8'; c.fillRect(-w * 0.46, -h * 0.48, w * 0.17, h * 0.08); c.fillRect(w * 0.29, -h * 0.48, w * 0.17, h * 0.08); // faros
  if (o.police) { const on = Math.sin(room.time * 14 + (o.ph || 0)) > 0; c.fillStyle = on ? '#ff3a3a' : '#4a1010'; c.fillRect(-w * 0.32, -h * 1.08, w * 0.3, h * 0.08); c.fillStyle = on ? '#1a2a55' : '#4a7aff'; c.fillRect(w * 0.02, -h * 1.08, w * 0.3, h * 0.08); }
  if (o.gunner) { c.fillStyle = '#2b2f26'; c.beginPath(); c.moveTo(-w * 0.18, -h * 1.0); c.lineTo(w * 0.18, -h * 1.0); c.lineTo(w * 0.13, -h * 1.22); c.lineTo(-w * 0.13, -h * 1.22); c.fill(); c.fillStyle = '#16181b'; c.beginPath(); c.arc(0, -h * 1.3, w * 0.1, 0, 7); c.fill(); c.fillStyle = '#0d0e10'; c.fillRect(-w * 0.03, -h * 1.2, w * 0.06, h * 0.16); } // tirador en la caja
  if (o.hit) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-w / 2, -h, w, h); }
  c.restore();
}
function drawSideCar(c, x, y, s) { // patrulla cruzada en la calzada (control policial), vista de lado
  const w = 54 * s, h = 24 * s;
  c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.ellipse(x, y, w * 0.55, Math.max(1, h * 0.12), 0, 0, 7); c.fill();
  c.fillStyle = '#0b0c0e'; for (const k of [-0.3, 0.3]) { c.beginPath(); c.arc(x + k * w, y - h * 0.12, h * 0.2, 0, 7); c.fill(); }
  c.fillStyle = '#e4e6ea'; rrect(c, x - w / 2, y - h * 0.62, w, h * 0.45, Math.max(1, h * 0.1)); c.fill();
  c.fillStyle = '#15171b'; c.fillRect(x - w / 2, y - h * 0.36, w, h * 0.1);
  c.fillStyle = '#e4e6ea'; c.beginPath(); c.moveTo(x - w * 0.3, y - h * 0.6); c.lineTo(x + w * 0.22, y - h * 0.6); c.lineTo(x + w * 0.12, y - h); c.lineTo(x - w * 0.22, y - h); c.closePath(); c.fill();
  c.fillStyle = '#1a2838'; c.fillRect(x - w * 0.2, y - h * 0.92, w * 0.3, h * 0.26);
  const on = Math.sin(room.time * 14) > 0; c.fillStyle = on ? '#ff3a3a' : '#2a4aff'; c.fillRect(x - w * 0.12, y - h * 1.08, w * 0.24, h * 0.08);
}
function drawHeli(c, x, y, s, H) { // (x, y) = centro del fuselaje
  const w = 64 * s;
  c.save(); c.translate(x, y); c.rotate(H.dead ? H.t * H.spin : Math.sin(H.t * 1.3) * 0.08);
  c.strokeStyle = '#121418'; c.lineWidth = Math.max(1, 2.2 * s);
  c.beginPath(); for (const sd of [-1, 1]) { c.moveTo(sd * w * 0.18, w * 0.18); c.lineTo(sd * w * 0.3, w * 0.36); c.moveTo(sd * w * 0.38, w * 0.36); c.lineTo(sd * w * 0.22, w * 0.36); } c.stroke(); // patines
  c.fillStyle = H.hitT > 0 ? '#5a5f66' : '#262b31'; c.beginPath(); c.ellipse(0, 0, w * 0.32, w * 0.25, 0, 0, 7); c.fill();
  c.fillStyle = '#4d6a85'; c.beginPath(); c.ellipse(0, -w * 0.02, w * 0.24, w * 0.17, 0, Math.PI, 0); c.closePath(); c.fill(); // cabina
  c.fillStyle = 'rgba(210,235,255,0.28)'; c.beginPath(); c.ellipse(-w * 0.08, -w * 0.1, w * 0.07, w * 0.04, -0.4, 0, 7); c.fill();
  c.fillStyle = '#121418'; c.fillRect(-w * 0.03, -w * 0.38, w * 0.06, w * 0.14); c.fillRect(-w * 0.05, w * 0.2, w * 0.1, w * 0.07); // rotor y ametralladora
  c.fillStyle = `rgba(160,170,180,${(0.22 + 0.12 * Math.sin(room.time * 55)).toFixed(3)})`; c.beginPath(); c.ellipse(0, -w * 0.39, w * 1.15, Math.max(1, w * 0.035), 0, 0, 7); c.fill();
  c.fillStyle = Math.sin(room.time * 6) > 0.6 ? '#ff3030' : '#3a0d0d'; c.beginPath(); c.arc(0, w * 0.25, Math.max(1, w * 0.025), 0, 7); c.fill();
  c.restore();
}
let skylineCv = null, skyCv = null;
function skyline() { // silueta de la ciudad en el horizonte, con ventanas encendidas (se dibuja una vez)
  if (skylineCv) return skylineCv;
  skylineCv = document.createElement('canvas'); skylineCv.width = 1200; skylineCv.height = 120;
  const g = skylineCv.getContext('2d');
  for (let x = 0; x < 1200;) {
    const w = 30 + hash(x, 1, 9) * 70, h = 25 + hash(x, 2, 9) * 90;
    g.fillStyle = '#0b0f17'; g.fillRect(x, 120 - h, w, h);
    g.fillStyle = 'rgba(255,210,140,0.55)';
    for (let wy = 120 - h + 6; wy < 116; wy += 7) for (let wx = x + 4; wx < x + w - 4; wx += 6) if (hash(wx, wy, 4) < 0.18) g.fillRect(wx, wy, 2, 3);
    x += w + 2;
  }
  return skylineCv;
}
function renderChase() {
  const C = room.chase, p = room.p, K = chaseCam(), U = ch / 390, rw = C.roadW, sh = cam.shake;
  ctx.setTransform(1, 0, 0, 1, rnd(-sh, sh) * U * 0.6, rnd(-sh, sh) * U * 0.6);
  // cielo, ciudad y estrellas
  if (!skyCv || skyCv.width !== cw + 80 || skyCv.height !== Math.ceil(K.yH) + 20) { // cielo, estrellas y ciudad: se dibujan una vez por tamaño de pantalla
    skyCv = document.createElement('canvas'); skyCv.width = cw + 80; skyCv.height = Math.ceil(K.yH) + 20;
    const g = skyCv.getContext('2d'), sky = g.createLinearGradient(0, 0, 0, skyCv.height); sky.addColorStop(0, '#04060c'); sky.addColorStop(1, '#16202e');
    g.fillStyle = sky; g.fillRect(0, 0, skyCv.width, skyCv.height);
    g.fillStyle = 'rgba(220,230,255,0.6)'; for (let i = 0; i < 40; i++) g.fillRect(hash(i, 1, 5) * skyCv.width, hash(i, 2, 5) * K.yH * 0.7, 1.5 * U, 1.5 * U);
    const skw = skyCv.width * 1.3, skh = skw / 10; g.drawImage(skyline(), skyCv.width / 2 - skw / 2, K.yH + 20 - skh + 1, skw, skh);
  }
  ctx.drawImage(skyCv, -40 - clamp(K.x * U * 0.12 + C.bend * 120000, -40, 40), -20); // el cielo gira al revés en las curvas
  // suelo, arcén, asfalto y líneas (la carretera es recta: un trapecio)
  ctx.fillStyle = '#0d140f'; ctx.fillRect(-20, K.yH, cw + 40, ch - K.yH + 20);
  const zN = 40, zF = 2200, phase = ((C.scroll - K.y) % 4000 + 4000) % 4000;
  const quad = (x0, x1, z0, z1, h = 0) => { const a = proj(K, x0, K.y + z0, h), b = proj(K, x1, K.y + z0, h), c2 = proj(K, x1, K.y + z1, h), d = proj(K, x0, K.y + z1, h); if (!a || !c2) return; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill(); };
  ctx.fillStyle = '#121a14'; for (let z = zN + ((-phase % 240) + 240) % 240; z < zF; z += 240) { quad(-rw / 2 - 900, -rw / 2 - 40, z, z + 120); quad(rw / 2 + 40, rw / 2 + 900, z, z + 120); } // franjas del campo
  ctx.fillStyle = '#26292e'; quad(-rw / 2 - 40, rw / 2 + 40, zN, zF); // arcén
  ctx.fillStyle = '#17191d'; quad(-rw / 2, rw / 2, zN, zF); // asfalto
  ctx.fillStyle = '#1c1f24'; for (let z = zN + ((-phase % 160) + 160) % 160; z < zF; z += 160) quad(-rw / 2, rw / 2, z, z + 80); // textura de velocidad
  ctx.fillStyle = 'rgba(235,228,200,0.75)'; quad(-rw / 2 + 4, -rw / 2 + 10, zN, zF); quad(rw / 2 - 10, rw / 2 - 4, zN, zF);
  for (let z = zN + ((-phase % 90) + 90) % 90; z < zF; z += 90) for (const lx of [-140, 0, 140]) quad(lx - 3, lx + 3, z, z + 40); // marcas de carril
  ctx.fillStyle = '#9a2a24'; for (let z = zN + ((-phase % 60) + 60) % 60; z < zF; z += 60) { quad(-rw / 2 - 30, -rw / 2 - 8, z, z + 30); quad(rw / 2 + 8, rw / 2 + 30, z, z + 30); } // bordillo
  ctx.fillStyle = '#5b6068'; quad(-rw / 2 - 26, -rw / 2 - 22, zN, zF, 14); quad(rw / 2 + 22, rw / 2 + 26, zN, zF, 14); // quitamiedos
  // farolas: poste, brazo sobre la calzada y luminaria
  const posts = [];
  for (let z = zN + ((-phase % 420) + 420) % 420; z < zF; z += 420) for (const sd of [-1, 1]) posts.push({ x: sd * (rw / 2 + 34), z: z + (sd > 0 ? 210 : 0), sd });
  const Rc = C.scroll - K.y, inTunnel = z => C.sections.some(sc => sc.kind === 'tunnel' && z > Rc - sc.R1 - 40 && z < Rc - sc.R0 + 40);
  for (let i = posts.length - 1; i >= 0; i--) if (inTunnel(posts[i].z)) posts.splice(i, 1); // en el túnel no hay farolas
  posts.sort((a, b) => b.z - a.z);
  for (const L of posts) {
    const g0 = proj(K, L.x, K.y + L.z, 0), g1 = proj(K, L.x, K.y + L.z, 110), g2 = proj(K, L.x - L.sd * 60, K.y + L.z, 112);
    if (!g0) continue;
    ctx.strokeStyle = '#2c3037'; ctx.lineWidth = Math.max(1, 5 * g0.s); ctx.beginPath(); ctx.moveTo(g0.x, g0.y); ctx.lineTo(g1.x, g1.y); ctx.lineTo(g2.x, g2.y); ctx.stroke();
  }
  // túneles (boca, paredes, techo) y puentes (agua y barandillas)
  const poly = pts => { const q = pts.map(([x, z, h]) => proj(K, x, K.y + z, h)); if (q.some(v => !v)) return; ctx.beginPath(); q.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.fill(); };
  let portal = null; const tunnelLights = [], TH = 150, wx = rw / 2 + 44;
  for (const sc of C.sections) {
    const za = Rc - sc.R1, zb = Rc - sc.R0, zA = Math.max(za, zN), zB = Math.min(zb, zF);
    if (zA >= zB) continue;
    if (sc.kind === 'bridge') {
      ctx.fillStyle = '#081420'; quad(-rw / 2 - 1600, -rw / 2 - 40, zA, zB); quad(rw / 2 + 40, rw / 2 + 1600, zA, zB);
      ctx.fillStyle = 'rgba(120,170,210,0.1)'; for (let z = zA - (zA % 70) + 70; z < zB; z += 70) { quad(-rw / 2 - 600, -rw / 2 - 200, z, z + 8); quad(rw / 2 + 260, rw / 2 + 700, z + 30, z + 36); }
      ctx.fillStyle = '#6a7078'; quad(-rw / 2 - 38, -rw / 2 - 32, zA, zB, 24); quad(rw / 2 + 32, rw / 2 + 38, zA, zB, 24);
      ctx.fillStyle = '#4a5058'; for (let z = zA - (zA % 50) + 50; z < zB; z += 50) for (const sx of [-1, 1]) poly([[sx * (rw / 2 + 35) - 2, z, 0], [sx * (rw / 2 + 35) + 2, z, 0], [sx * (rw / 2 + 35) + 2, z, 24], [sx * (rw / 2 + 35) - 2, z, 24]]);
      continue;
    }
    const face = (z, inside) => { // boca del túnel: el monte alrededor y, por el hueco, lo de detrás
      const a = proj(K, -wx, K.y + z, TH), b = proj(K, wx, K.y + z, 0); if (!a || !b) return;
      ctx.fillStyle = '#2e3136'; ctx.beginPath(); ctx.rect(-20, -20, cw + 40, b.y + 20); ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y); ctx.fill('evenodd');
      ctx.strokeStyle = '#4a4e55'; ctx.lineWidth = Math.max(2, 8 * a.s); ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      if (!inside) { ctx.fillStyle = '#060708'; ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); }
      portal = { z, x0: a.x, y0: a.y, x1: b.x, y1: b.y };
    };
    if (za > zN) face(za, false); // ya fuera: la boca se aleja
    else { // dentro: la entrada queda atrás; paredes, techo y luces
      face(zB, true);
      ctx.fillStyle = '#24272c'; poly([[-wx, zA, 0], [-wx, zB, 0], [-wx, zB, TH], [-wx, zA, TH]]); poly([[wx, zA, 0], [wx, zB, 0], [wx, zB, TH], [wx, zA, TH]]);
      ctx.fillStyle = '#16181b'; poly([[-wx, zA, TH], [wx, zA, TH], [wx, zB, TH], [-wx, zB, TH]]);
      for (let z = zA - (zA % 140) + 140; z < zB; z += 140) for (const sx of [-1, 1]) tunnelLights.push([sx * (wx - 4), z]);
    }
  }
  // objetos de lejos a cerca: tráfico, perseguidores, helicóptero, granadas, controles
  const items = [];
  for (const o of C.obst) items.push({ z: o.y - K.y, d: () => {
    const q0 = proj(K, o.x0, o.y, 0), q1 = proj(K, o.x1, o.y, 0); if (!q0 || !q1) return;
    if (o.kind === 'spikes') { ctx.fillStyle = '#15171a'; ctx.fillRect(q0.x, q0.y - 3 * q0.s, q1.x - q0.x, 4 * q0.s); ctx.fillStyle = '#a0a6ae'; for (let x = q0.x; x < q1.x; x += 9 * q0.s) { ctx.beginPath(); ctx.moveTo(x, q0.y - 3 * q0.s); ctx.lineTo(x + 3 * q0.s, q0.y - 9 * q0.s); ctx.lineTo(x + 6 * q0.s, q0.y - 3 * q0.s); ctx.fill(); } return; }
    for (const k of [0.25, 0.75]) { const q = proj(K, o.x0 + (o.x1 - o.x0) * k, o.y, 0); if (q) drawSideCar(ctx, q.x, q.y, q.s); }
  } });
  for (const t of C.traffic) items.push({ z: t.y - t.h / 2 - K.y, d: () => { const q = proj(K, t.x, t.y - t.h / 2, 0); if (q) drawFront(ctx, t.kind, q.x, q.y, q.s, t.col, { rot: t.wreck ? t.rot : 0, lights: !t.wreck }); } });
  for (const f of C.foes) items.push({ z: f.y - f.h / 2 - K.y, d: () => {
    const q = proj(K, f.x, f.y - f.h / 2, 0); if (!q) return;
    drawFront(ctx, f.kind, q.x, q.y, q.s, PURSUERS[f.kind].col, { rot: f.dead ? f.rot : f.rot * 0.3, lights: !f.dead, police: f.police && !f.dead, gunner: PURSUERS[f.kind].gunner && !f.dead, hit: f.hitT > 0, ph: f.ph });
    if (f.mode === 'ram' && !f.dead) { ctx.strokeStyle = `rgba(255,70,60,${(0.5 + 0.4 * Math.sin(room.time * 20)).toFixed(3)})`; ctx.lineWidth = 2 * U; ctx.strokeRect(q.x - f.w * q.s * 0.6, q.y - f.tall * q.s * 1.15, f.w * q.s * 1.2, f.tall * q.s * 1.25); } // va a embestiros
  } });
  if (C.heli) { const H = C.heli; items.push({ z: H.y - K.y, d: () => { const q = proj(K, H.x, H.y, H.h); if (q) { const g = proj(K, H.x, H.y, 0); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(g.x, g.y, 30 * g.s, 6 * g.s, 0, 0, 7); ctx.fill(); drawHeli(ctx, q.x, q.y, q.s, H); } } }); }
  for (const n of room.nades) items.push({ z: n.y - K.y, d: () => { const q = proj(K, n.x, n.y, n.h), g = proj(K, n.x, n.y, 0); if (!q) return; ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(g.x, g.y, 5 * g.s, 2 * g.s, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#4b5a3a'; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(1.5, 5 * q.s), 0, 7); ctx.fill(); } });
  for (const f of room.fx) if (f.k === 'smoke') items.push({ z: f.y - K.y - 1, d: () => { const k = f.t / f.life, q = proj(K, f.x, f.y, (f.h || 15) + k * 50); if (!q) return; ctx.fillStyle = `rgba(${f.g},${f.g},${f.g + 6},${(0.5 * (1 - k)).toFixed(3)})`; ctx.beginPath(); ctx.arc(q.x, q.y, (f.r0 + (f.r1 - f.r0) * k) * q.s, 0, 7); ctx.fill(); } });
  items.sort((a, b) => b.z - a.z);
  for (const it of items) if (it.z > 30) { // lo que queda tras la boca del túnel solo se ve por el hueco
    if (portal && it.z > portal.z) { ctx.save(); ctx.beginPath(); ctx.rect(portal.x0, portal.y0, portal.x1 - portal.x0, portal.y1 - portal.y0); ctx.clip(); it.d(); ctx.restore(); } else it.d();
  }
  // niebla en el horizonte
  const fog = ctx.createLinearGradient(0, K.yH - 30 * U, 0, K.yH + 70 * U); fog.addColorStop(0, 'rgba(22,30,42,0)'); fog.addColorStop(0.35, 'rgba(22,30,42,0.85)'); fog.addColorStop(1, 'rgba(22,30,42,0)');
  ctx.fillStyle = fog; ctx.fillRect(-20, K.yH - 30 * U, cw + 40, 100 * U);
  // balas de ellos: trazadoras que vienen hacia ti
  ctx.lineCap = 'round';
  for (const b of room.bullets) {
    const h = 15 + ((b.hh || 20) - 15) * Math.min(1, Math.hypot(b.x - p.x, b.y - p.y) / (b.d0 || 1)), q = proj(K, b.x, b.y, h), q2 = proj(K, b.x - b.vx * 0.03, b.y - b.vy * 0.03, h);
    if (!q || !q2) continue;
    ctx.strokeStyle = 'rgba(255,190,120,0.85)'; ctx.lineWidth = Math.max(1, 2.5 * q.s); ctx.beginPath(); ctx.moveTo(q2.x, q2.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  }
  // luces (aditivas): farolas, faros con su haz sobre el asfalto, sirenas, fuego y chispas
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, z] of tunnelLights) { const q = proj(K, x, K.y + z, TH - 12); if (q) { const r = Math.min(70 * U, 30 * q.s); ctx.fillStyle = glow(ctx, q.x, q.y, r, '255,170,80', 0.7); ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 7); ctx.fill(); } }
  for (const L of posts) {
    if (portal && L.z > portal.z) continue; // tapadas por el monte
    const g2 = proj(K, L.x - L.sd * 60, K.y + L.z, 112), pool = proj(K, L.x - L.sd * 90, K.y + L.z, 0);
    if (!g2 || !pool || L.z < 120 || L.z > 1500) continue; // las de encima de la cámara llenarían la pantalla entera de degradado (caro)
    const lr = Math.min(26 * g2.s, 70 * U), pr = Math.min(170 * pool.s, cw * 0.45);
    ctx.fillStyle = glow(ctx, g2.x, g2.y, lr, '255,180,100', 0.8); ctx.beginPath(); ctx.arc(g2.x, g2.y, lr, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(pool.x, pool.y); ctx.scale(1, 0.32); ctx.fillStyle = glow(ctx, 0, 0, pr, '255,160,80', 0.22); ctx.beginPath(); ctx.arc(0, 0, pr, 0, 7); ctx.fill(); ctx.restore();
  }
  const beams = (x, y, w, tall, rot) => { // faros: destello y haz hacia la cámara sobre el asfalto
    const q = proj(K, x, y, tall * 0.44); if (!q) return;
    for (const sd of [-1, 1]) {
      const hx = q.x + sd * w * 0.37 * q.s * Math.cos(rot), hy = q.y + sd * w * 0.37 * q.s * Math.sin(rot);
      const gr2 = Math.min(40 * U, 9 * q.s); ctx.fillStyle = glow(ctx, hx, hy, gr2, '255,245,215', 0.75); ctx.beginPath(); ctx.arc(hx, hy, gr2, 0, 7); ctx.fill();
    }
    const a = proj(K, x - w * 0.4, y, 0), b = proj(K, x + w * 0.4, y, 0), z2 = Math.max(45, y - K.y - 260), c2 = proj(K, x + w * 1.6, K.y + z2, 0), d = proj(K, x - w * 1.6, K.y + z2, 0);
    if (!a || !c2) return;
    const gr = ctx.createLinearGradient(0, a.y, 0, c2.y); gr.addColorStop(0, 'rgba(255,240,200,0.16)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
  };
  for (const t of C.traffic) if (!t.wreck) beams(t.x, t.y - t.h / 2, t.w, t.tall, 0);
  for (const f of C.foes) if (!f.dead) {
    beams(f.x, f.y - f.h / 2, f.w, f.tall, f.rot * 0.3);
    if (f.police) { const q = proj(K, f.x, f.y - f.h / 2, f.tall * 1.05); if (q) { const on = Math.sin(room.time * 14 + f.ph) > 0; ctx.fillStyle = glow(ctx, q.x, q.y, 70 * q.s, on ? '255,40,40' : '50,100,255', 0.35); ctx.beginPath(); ctx.arc(q.x, q.y, 70 * q.s, 0, 7); ctx.fill(); } }
  }
  if (C.heli && !C.heli.dead) { // foco del helicóptero sobre vuestro coche
    const H = C.heli, q = proj(K, H.x, H.y, H.h - 10), g = proj(K, (H.x + C.car.x) / 2, K.y + 140, 0);
    if (q && g) { const gr = ctx.createLinearGradient(q.x, q.y, g.x, g.y); gr.addColorStop(0, 'rgba(230,240,255,0.22)'); gr.addColorStop(1, 'rgba(230,240,255,0.04)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(q.x - 4 * q.s, q.y); ctx.lineTo(q.x + 4 * q.s, q.y); ctx.lineTo(g.x + 120 * g.s, g.y); ctx.lineTo(g.x - 120 * g.s, g.y); ctx.closePath(); ctx.fill(); }
  }
  for (const f of room.fx) {
    const k = f.t / f.life;
    if (f.k === 'fire') { const q = proj(K, f.x, f.y, 25); if (q) { ctx.fillStyle = glow(ctx, q.x, q.y, f.r * q.s * (0.6 + k), '255,150,60', 1 - k); ctx.beginPath(); ctx.arc(q.x, q.y, f.r * q.s * (0.6 + k), 0, 7); ctx.fill(); } }
    else if (f.k === 'ring') { const q = proj(K, f.x, f.y, 0); if (q) { ctx.strokeStyle = `rgba(255,220,160,${(0.6 * (1 - k)).toFixed(3)})`; ctx.lineWidth = 3 * U; ctx.beginPath(); ctx.ellipse(q.x, q.y, f.r * k * q.s, f.r * k * q.s * 0.3, 0, 0, 7); ctx.stroke(); } }
    else if (f.k === 'muzzle') { const q = proj(K, f.x, f.y, f.h || 20); if (q) { const r = Math.max(4 * U, 16 * q.s); ctx.fillStyle = glow(ctx, q.x, q.y, r, '255,210,120', 1); ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 7); ctx.fill(); } }
  }
  for (const q0 of room.parts) { const q = proj(K, q0.x, q0.y, q0.h ?? 15); if (q) { ctx.fillStyle = q0.c; ctx.fillRect(q.x - 1, q.y - 1, Math.max(1.5, q0.s * q.s * 1.5), Math.max(1.5, q0.s * q.s * 1.5)); } }
  for (const f of C.foes) if (f.dead) { const q = proj(K, f.x, f.y - f.h / 2, f.tall * 0.6); if (q) { ctx.fillStyle = glow(ctx, q.x, q.y, 40 * q.s, '255,120,40', 0.5 + 0.2 * Math.sin(room.time * 20)); ctx.beginPath(); ctx.arc(q.x, q.y, 40 * q.s, 0, 7); ctx.fill(); } } // siniestros en llamas
  // tus disparos: trazadoras desde el cañón a la mira
  const gx = cw * 0.66, gy = ch * 1.0, ang = Math.atan2(C.aim.y - gy, C.aim.x - gx), gs = GUN_SHAPE[curW().id] || [16, 6], gl = ch * (0.26 + gs[0] / 28 * 0.16);
  const mx = gx + Math.cos(ang) * gl * (wstats(curW()).silenced ? 1.18 : 1), my = gy + Math.sin(ang) * gl * (wstats(curW()).silenced ? 1.18 : 1);
  for (const q of C.shots) { ctx.strokeStyle = `rgba(255,225,150,${(q.t / 0.07).toFixed(3)})`; ctx.lineWidth = 2 * U; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(q.x, q.y); ctx.stroke(); }
  if (p.muzzleT > 0) { ctx.fillStyle = glow(ctx, mx, my, 40 * U, '255,210,120', 1); ctx.beginPath(); ctx.arc(mx, my, 40 * U, 0, 7); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over';
  // textos (+$) sobre los coches
  ctx.font = `700 ${Math.round(13 * U)}px "Saira Semi Condensed", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t of room.texts) { const q = proj(K, t.x, t.y, 50); if (!q) continue; ctx.globalAlpha = Math.min(1, t.t * 2); ctx.fillStyle = t.color; ctx.fillText(t.text, q.x, q.y); }
  ctx.globalAlpha = 1;
  for (const f of C.foes) if (!f.dead && f.hp < f.maxHp) { const q = proj(K, f.x, f.y - f.h / 2, f.tall * 1.2); if (q) { const bw = Math.max(24 * U, f.w * q.s); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(q.x - bw / 2, q.y - 5 * U, bw, 4 * U); ctx.fillStyle = f.hp < f.maxHp * 0.3 ? '#ff5a4a' : '#ffb547'; ctx.fillRect(q.x - bw / 2, q.y - 5 * U, bw * f.hp / f.maxHp, 4 * U); } }
  if (C.heli && !C.heli.dead) { const H = C.heli, q = proj(K, H.x, H.y, H.h + 30); if (q) { const bw = Math.max(40 * U, 60 * q.s); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(q.x - bw / 2, q.y, bw, 4 * U); ctx.fillStyle = '#ff5a4a'; ctx.fillRect(q.x - bw / 2, q.y, bw * H.hp / H.maxHp, 4 * U); } }
  // tu coche (maletero y luna trasera) y el arma asomando por el techo
  const col = { van: '#bdb8aa', sedan: '#2a3a52', suv: '#1f2b23', armored: '#3a3f36' }[room.mission.car];
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cw * 0.14, ch + 2); ctx.lineTo(cw * 0.86, ch + 2); ctx.lineTo(cw * 0.72, ch * 0.86); ctx.lineTo(cw * 0.28, ch * 0.86); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(cw * 0.2, ch + 2); ctx.lineTo(cw * 0.8, ch + 2); ctx.lineTo(cw * 0.7, ch * 0.9); ctx.lineTo(cw * 0.3, ch * 0.9); ctx.closePath(); ctx.fill(); // hueco entre maletero y luna
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(cw * 0.28, ch * 0.86, cw * 0.44, 2 * U); // canto del maletero
  ctx.fillStyle = '#b3241a'; ctx.fillRect(cw * 0.16, ch * 0.9, cw * 0.1, ch * 0.05); ctx.fillRect(cw * 0.74, ch * 0.9, cw * 0.1, ch * 0.05); // pilotos
  ctx.fillStyle = '#ff6a50'; ctx.fillRect(cw * 0.17, ch * 0.91, cw * 0.08, ch * 0.012); ctx.fillRect(cw * 0.75, ch * 0.91, cw * 0.08, ch * 0.012);
  ctx.save(); ctx.translate(gx, gy); ctx.rotate(ang); // el arma, vista desde detrás y por encima: culata, cajón, cargador y cañón
  const gw = Math.max(6 * U, ch * 0.03 * gs[1] / 5);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-gl * 0.05, -gw * 0.9 + gw, gl * 1.0, gw * 1.8); // sombra
  ctx.fillStyle = '#3d444d'; rrect(ctx, -gl * 0.12, -gw * 1.2, gl * 0.34, gw * 2.4, gw * 0.5); ctx.fill(); // culata
  ctx.fillStyle = gunColor() === '#1b1f24' ? '#4a525c' : gunColor(); ctx.fillRect(gl * 0.18, -gw * 1.0, gl * 0.36, gw * 2.0); // cajón (con su camuflaje)
  ctx.fillStyle = '#2a2f36'; ctx.fillRect(gl * 0.3, gw * 0.9, gl * 0.1, gw * 1.4); // cargador
  ctx.fillStyle = '#353b43'; ctx.fillRect(gl * 0.52, -gw * 0.45, gl * 0.48, gw * 0.9); // cañón
  ctx.fillStyle = '#20252b'; ctx.fillRect(gl * 0.95, -gw * 0.6, gl * 0.05, gw * 1.2); // bocacha
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-gl * 0.12, -gw * 1.2, gl * 1.1, gw * 0.3); // brillo de arriba
  if (wstats(curW()).silenced) { ctx.fillStyle = '#1b1f24'; ctx.fillRect(gl, -gw * 0.55, gl * 0.18, gw * 1.1); }
  ctx.fillStyle = playerLook().body; ctx.beginPath(); ctx.arc(gl * 0.05, gw * 2.2, gw * 1.6, 0, 7); ctx.arc(gl * 0.5, -gw * 2.0, gw * 1.3, 0, 7); ctx.fill(); // mangas
  ctx.fillStyle = SKIN[0]; ctx.beginPath(); ctx.arc(gl * 0.24, gw * 1.0, gw * 0.95, 0, 7); ctx.arc(gl * 0.58, -gw * 0.9, gw * 0.9, 0, 7); ctx.fill(); // manos
  ctx.restore();
  // mira: roja cuando hay un perseguidor debajo
  const cr = 15 * U, on = C.onTarget;
  ctx.strokeStyle = on ? '#ff5a4a' : 'rgba(235,240,245,0.9)'; ctx.lineWidth = 2 * U;
  ctx.beginPath(); ctx.arc(C.aim.x, C.aim.y, cr, 0, 7); ctx.stroke();
  ctx.beginPath(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.moveTo(C.aim.x + dx * cr * 0.5, C.aim.y + dy * cr * 0.5); ctx.lineTo(C.aim.x + dx * cr * 1.5, C.aim.y + dy * cr * 1.5); } ctx.stroke();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawHud();
}
function completeRoom() {
  if (room.tutorial) { run = null; showMenu(); $('menuNote').hidden = false; sfx('objective'); return; } // tutorial superado: a jugar la campaña
  if (room.mission.chase && !room.chaseWon) { startChase(); return; } // primero hay que despistarlos
  const M = room.mission, bonus = 80 + 20 * run.level, wasBoss = run.level % BOSS_EVERY === 0, lv = run.level;
  room.escaped = true; updateObjectives(); run.plan = freshPlan();
  const loot = room.loot ? Math.round((150 + 60 * lv) * (LOOTS[room.loot.type] || [0, 1])[1]) : 0;
  const ghost = room.detected ? 0 : M.op === 'sigilo' ? loot : 120; // en sigilo, sin ser visto, el botín vale el doble
  const sec = room.obj.filter(o => !o.primary), secDone = sec.filter(o => o.state > 0), objPay = secDone.reduce((a, o) => a + o.reward, 0);
  const civPen = room.civKilled * (80 + 10 * lv), total = Math.max(0, room.cash + bonus + ghost + loot + objPay - civPen);
  run.money += total;
  const stars = 1 + secDone.length, rank = stars === 3 && !room.alarm ? 'S' : stars === 3 ? 'A' : stars === 2 ? 'B' : 'C';
  const score = total + secDone.length * 200 + (room.alarm ? 0 : 300) + (room.detected ? 0 : 300) + Math.round(Math.max(0, room.timer) * 2);
  run.best = run.best || {};
  const prev = run.best[lv] || 0; if (score > prev) run.best[lv] = score;
  run.level++;
  sfx('buy');
  const stats = (loot ? `${LOOTS[room.loot.type][0]} <b>+$${loot}</b> · ` : '') + `saqueo <b>+$${room.cash}</b> · objetivos <b>+$${objPay}</b> · bajas ${room.kills} · silenciosas ${room.silent} · bonus de sala <b>+$${bonus}</b>` +
    (ghost ? ` · fantasma (sin ser detectado) <b>+$${ghost}</b>` : '') + (civPen ? ` · civiles abatidos <b class="bad">−$${civPen}</b>` : '');
  showResults({ M, lv, rank, stars, score, prev, total, rows: [[loot && LOOTS[room.loot.type][0].replace(/^./, c => c.toUpperCase()), loot], ['Saqueo', room.cash], ['Bonus de misión', bonus], [ghost && 'Fantasma', ghost], ['Objetivos secundarios', objPay], [civPen && `Civiles abatidos (${room.civKilled})`, -civPen]].filter(r => r[0]) },
    () => { if (!wasBoss) openShop(stats); else winScreen(stats); });
}
function showResults(R, next) { // rango, estrellas, objetivos y desglose; luego, la tienda
  state = 'results';
  $('rsName').textContent = R.M.name.toUpperCase();
  $('rsRank').textContent = R.rank; $('rsRank').className = 'rank r' + R.rank;
  $('rsStars').innerHTML = [0, 1, 2].map(() => '<i>★</i>').join('');
  $('rsObj').innerHTML = room.obj.map(o => `<li class="rv ${o.state > 0 ? 'ok' : 'ko'}">${o.state > 0 ? '✓' : '✗'} ${o.text}${o.primary ? '' : ` <em>+$${o.reward}</em>`}</li>`).join('');
  $('rsRows').innerHTML = R.rows.map(([k, v]) => `<div class="rv"><span>${k}</span><b class="${v < 0 ? 'bad' : ''}" data-v="${v}">${v < 0 ? '−' : '+'}$${Math.abs(v)}</b></div>`).join('') + `<div class="tot rv"><span>Total</span><b data-v="${R.total}">+$${R.total}</b></div>`;
  $('rsScore').className = 'rs-score rv';
  $('rsScore').innerHTML = `Puntuación <b>${R.score}</b>` + (R.score > R.prev ? (R.prev ? ` · <span class="rec">¡nuevo récord! (antes ${R.prev})</span>` : '') : ` · mejor marca ${R.prev}`);
  resultsNext = next;
  show('results');
  playResults(R);
}
let resultsNext = null, rsTimers = [], rsSkip = null;
// Coreografía de los resultados: la escena se oscurece, entran los objetivos y las cifras (contando), las estrellas una a una
// y al final se estampa el rango. Tocar la ficha lo adelanta todo.
function playResults(R) {
  const ov = $('results'), card = ov.querySelector('.results'), rank = $('rsRank'), go = $('bRsGo');
  rsTimers.forEach(clearTimeout); rsTimers = [];
  ov.classList.remove('anim'); card.classList.remove('shake'); void ov.offsetWidth; ov.classList.add('anim');
  go.disabled = true;
  const at = (t, f) => rsTimers.push(setTimeout(f, t));
  const count = b => { const v = +b.dataset.v, sign = v < 0 ? '−' : '+', t0 = performance.now(), dur = Math.min(700, 250 + Math.abs(v) / 4);
    const step = () => { const k = Math.min(1, (performance.now() - t0) / dur), n = Math.round(Math.abs(v) * (1 - (1 - k) ** 3)); b.textContent = `${sign}$${n}`; if (k < 1 && !rsDone) requestAnimationFrame(step); else b.textContent = `${sign}$${Math.abs(v)}`; };
    step(); };
  let rsDone = false, t = 1150;
  const objs = [...$('rsObj').children], rows = [...$('rsRows').children], stars = [...$('rsStars').children];
  for (const li of objs) { at(t, () => { li.classList.add('in'); sfx(li.classList.contains('ok') ? 'tick' : 'tickBad'); }); t += 200; }
  t += 150;
  for (const row of rows) { const tot = row.classList.contains('tot'); at(t, () => { row.classList.add('in'); count(row.querySelector('b')); sfx(tot ? 'buy' : 'tick'); }); t += tot ? 750 : 190; }
  for (let i = 0; i < R.stars; i++) { at(t, () => { stars[i].classList.add('on'); sfx('star' + i); }); t += 330; }
  at(t, () => $('rsScore').classList.add('in')); t += 450;
  const stamp = quiet => { rank.classList.add('stamp'); if (!quiet) at(330, () => { card.classList.add('shake'); sfx('stamp'); buzz(40); }); };
  const finish = () => { rsDone = true; go.disabled = false; rsSkip = null; };
  at(t, () => stamp(false)); at(t + 700, finish);
  rank.classList.remove('stamp');
  rsSkip = () => { // todo de golpe: lo que faltaba aparece y el sello cae ya
    rsTimers.forEach(clearTimeout); rsTimers = []; rsDone = true;
    ov.classList.remove('anim');
    for (const el of [...objs, ...rows, $('rsScore')]) el.classList.add('in');
    for (const b of $('rsRows').querySelectorAll('b')) b.textContent = `${+b.dataset.v < 0 ? '−' : '+'}$${Math.abs(+b.dataset.v)}`;
    stars.slice(0, R.stars).forEach(s => s.classList.add('on'));
    if (!rank.classList.contains('stamp')) { stamp(true); sfx('stamp'); }
    finish();
  };
}
function winScreen(stats) {
  winStats = stats;
  state = 'win';
  $('winInfo').textContent = run.level - 1 >= MISSIONS.length ? `Campaña completada: has acabado con la Viuda, el último cabo suelto. Puedes seguir en modo infinito: cada ${BOSS_EVERY} misiones vuelve un jefe más duro.` : `Has abatido a ${FOES[mission(run.level - 1).boss || 'boss'].title} en «${mission(run.level - 1).name}». La campaña sigue: quedan ${MISSIONS.length - run.level + 1} misiones.`;
  show('win');
  save();
}
function openShop(stats, title) {
  state = 'shop';
  $('shopTitle').textContent = title || `${mission(run.level - 1).name}: completada`;
  $('shopStats').innerHTML = stats;
  shopTab = 'arm';
  renderShop();
  show('shop');
  save();
}
// Guardado automático al entrar en cada sala y en la tienda
const SLOT_KEY = n => `apagon-ranura-${n}`;
let slot = 1;
try {
  slot = Math.min(3, Math.max(1, +localStorage.getItem('apagon-ranura-actual') || 1));
  const old = localStorage.getItem('apagon-partida-v1'); // la partida de versiones anteriores pasa a la ranura 1
  if (old && !localStorage.getItem(SLOT_KEY(1))) localStorage.setItem(SLOT_KEY(1), old);
} catch (e) { /* sin almacenamiento */ }
function setSlot(n) { slot = n; try { localStorage.setItem('apagon-ranura-actual', n); } catch (e) { /* sin almacenamiento */ } }
function save() {
  if (run && run.tutorial) return; // el tutorial no toca tu partida
  try { const { snap, ...rest } = run; localStorage.setItem(SLOT_KEY(slot), JSON.stringify({ run: rest, shop: state === 'shop' || state === 'win', t: Date.now() })); } catch (e) { /* sin almacenamiento: se juega sin guardar */ }
}
function loadSave(n = slot) {
  try {
    const d = JSON.parse(localStorage.getItem(SLOT_KEY(n))), r = d && d.run;
    // lo guardado puede estar corrupto o venir de otra versión: solo se acepta si encaja
    if (r && Number.isInteger(r.level) && r.level > 0 && r.hp > 0 && [r.money, r.nades, r.maxHp, r.seed].every(Number.isFinite) &&
        Array.isArray(r.weapons) && r.weapons.length && Number.isInteger(r.cur) && r.weapons[r.cur] &&
        r.weapons.every(w => WEAPONS[w.id] && Array.isArray(w.mods) && w.mods.every(m => MODS[m]) && Number.isFinite(w.ammo) && Number.isFinite(w.reserve) &&
          (!w.ats || (Array.isArray(w.ats) && w.ats.every(a => AMMO[a]))) && (!w.at || AMMO[w.at])) &&
        (!r.skills || Object.entries(r.skills).every(([k, v]) => SKILLS[k] && Number.isInteger(v) && v >= 0 && v <= 3)) &&
        (!r.items || Object.entries(r.items).every(([k, v]) => ITEMS[k] && Number.isInteger(v) && v >= 0)) &&
        (!r.style || (OUTFITS[r.style.outfit] && MASKS[r.style.mask] && CAMOS[r.style.camo] && Array.isArray(r.style.owned)))) return d;
  } catch (e) { /* partida ilegible: se ignora */ }
  return null;
}
function refreshMenu() {
  const d = loadSave(), b = $('bPlay');
  $('bCont').hidden = $('bShop').hidden = !d;
  if (d) $('bCont').textContent = `Continuar · ranura ${slot} · misión ${d.run.level}: ${mission(d.run.level).name}`;
  const lv = d ? d.run.level : 1;
  $('camp').innerHTML = MISSIONS.map((m, i) => `<span class="${i + 1 < lv ? 'done' : i + 1 === lv ? 'next' : ''}">${String(i + 1).padStart(2, '0')} ${m.name}</span>`).join('') +
    (lv > MISSIONS.length ? `<span class="next">${String(lv).padStart(2, '0')} ${mission(lv).name}</span>` : '');
  delete b.dataset.sure;
  b.textContent = d ? 'Nueva partida' : 'Jugar';
  b.className = d ? 'ghost' : 'cta';
}
function showMenu() { // de fondo, un mapa de verdad con sus luces y la cámara recorriéndolo despacio
  state = 'menu';
  document.body.classList.remove('chase');
  try { room = buildRoom(5, 4242); room.demo = true; room.p.dead = true; bakeAll(); } catch (e) { room = null; }
  refreshMenu(); show('menu');
}
// ---- Briefing: tarjeta animada antes de cada misión
// ---- Historia: escenas cortas antes de algunas misiones, con una ilustración dibujada y un rival (Darío Vela)
const STORY = {
  1: ['Primer trabajo', 'city', ['La ciudad lleva semanas a oscuras: cortes de luz cada noche y nadie hace preguntas.', 'Marta, al teléfono: «Te he conseguido algo fácil. Un maletín en una gestoría. Si sale bien, habrá más».', '«Y recuerda: si nadie te ve, nadie te busca».']],
  3: ['Un nombre', 'figure', ['Alguien ha preguntado por ti en el puerto: Darío Vela, un ladrón que trabaja para el Alcaide.', 'Marta: «Dice que esta ciudad es suya y que los golpes los da él. Ten cuidado: no es de los que perdonan».']],
  5: ['El banco Norte', 'bank', ['Darío intentó este mismo golpe la semana pasada. Salió con las manos vacías y dos hombres menos.', 'Marta: «Si lo consigues tú, lo vas a humillar delante del Alcaide. Me gusta la idea».']],
  8: ['Precio por tu cabeza', 'fortress', ['Darío le ha dado tu nombre al Alcaide. Ahora hay precio por tu cabeza.', 'Marta: «Solo hay una forma de que dejen de buscarte. Entra en su fortaleza y termina con esto».']],
  9: ['Un trono vacío', 'heli', ['El Alcaide ha caído. Darío escapó con sus contactos y su dinero.', 'Un mercenario, el Coronel, ocupa el sitio del Alcaide. Y Darío ya trabaja para él.']],
  13: ['El oro del Alcaide', 'train', ['Darío ha cargado lo que queda del oro del Alcaide en un tren de mercancías.', 'Marta: «Si pierde ese oro, el Coronel lo mata. No me digas que no te tienta».']],
  15: ['La fiesta', 'yacht', ['El Coronel celebra en su yate. Darío estará allí, y en un camarote cuelga un cuadro que vale una fortuna.', 'Marta: «Entra, coge el cuadro y sal. Ni se te ocurra hacer una locura con Darío».']],
  16: ['Vendido otra vez', 'soldiers', ['Darío te ha vuelto a vender: el Coronel sabe dónde estás y te espera con todos sus hombres.', '«Pues que espere sentado», dices. Y cargas el arma.']],
  17: ['Cabos sueltos', 'city', ['Con el Coronel fuera de juego, Darío desaparece del mapa.', 'Marta: «Alguien está limpiando la ciudad. Los que trabajaban para el Coronel aparecen muertos».']],
  22: ['Ochocientos metros', 'scope', ['Encuentran a Darío en una azotea. Un solo disparo, desde ochocientos metros.', 'Marta: «La Viuda. Ella es quien limpia. Y tú eres el último cabo suelto».']],
  24: ['El último trabajo', 'rooftop', ['La azotea de la Viuda, en lo alto de la torre más alta de la ciudad.', 'Marta: «Es ella o tú. Cuando acabe, nos vamos de esta ciudad. Te lo prometo».']],
};
function drawStory(kind) { // ilustración nocturna: cielo, luna, ciudad y una silueta según la escena
  const cv = $('stCanvas'), g = cv.getContext('2d'), w = cv.width, h = cv.height, r = mulberry32(kind.length * 977 + 3);
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#05070d'); sky.addColorStop(1, '#1c2533'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(220,230,255,0.7)'; for (let i = 0; i < 50; i++) g.fillRect(r() * w, r() * h * 0.5, 1.2, 1.2);
  g.fillStyle = 'rgba(255,240,210,0.9)'; g.beginPath(); g.arc(w * 0.8, h * 0.22, 18, 0, 7); g.fill(); g.fillStyle = glow(g, w * 0.8, h * 0.22, 60, '255,230,190', 0.25); g.beginPath(); g.arc(w * 0.8, h * 0.22, 60, 0, 7); g.fill();
  const sil = '#06080c', city = (base, hmax, col) => { for (let x = 0; x < w;) { const bw = 18 + r() * 40, bh = 20 + r() * hmax; g.fillStyle = col; g.fillRect(x, base - bh, bw, bh); g.fillStyle = 'rgba(255,200,120,0.55)'; for (let y = base - bh + 5; y < base - 4; y += 7) for (let xx = x + 3; xx < x + bw - 3; xx += 6) if (r() < 0.15) g.fillRect(xx, y, 2, 3); x += bw + 2; } };
  city(h * 0.82, h * 0.45, '#0c111a'); g.fillStyle = '#05070a'; g.fillRect(0, h * 0.82, w, h * 0.18);
  g.fillStyle = sil;
  if (kind === 'figure' || kind === 'scope') { // silueta con abrigo bajo una farola, con lluvia
    g.fillStyle = glow(g, w * 0.3, h * 0.42, 90, '255,170,90', 0.35); g.beginPath(); g.arc(w * 0.3, h * 0.42, 90, 0, 7); g.fill();
    g.fillStyle = sil; g.fillRect(w * 0.3 - 2, h * 0.35, 4, h * 0.5); g.fillRect(w * 0.3 - 2, h * 0.35, 22, 4);
    g.beginPath(); g.moveTo(w * 0.42, h * 0.86); g.lineTo(w * 0.44, h * 0.55); g.lineTo(w * 0.5, h * 0.5); g.lineTo(w * 0.56, h * 0.55); g.lineTo(w * 0.58, h * 0.86); g.fill(); g.beginPath(); g.arc(w * 0.5, h * 0.44, 9, 0, 7); g.fill(); g.fillRect(w * 0.46, h * 0.385, 16, 4);
    if (kind === 'scope') { g.strokeStyle = 'rgba(255,60,60,0.8)'; g.lineWidth = 2; g.beginPath(); g.arc(w * 0.5, h * 0.45, 40, 0, 7); g.moveTo(w * 0.5 - 50, h * 0.45); g.lineTo(w * 0.5 + 50, h * 0.45); g.moveTo(w * 0.5, h * 0.45 - 50); g.lineTo(w * 0.5, h * 0.45 + 50); g.stroke(); }
    g.strokeStyle = 'rgba(160,190,220,0.25)'; g.lineWidth = 1; for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 12); g.stroke(); }
  } else if (kind === 'bank') { g.fillStyle = '#0e131c'; g.fillRect(w * 0.3, h * 0.38, w * 0.4, h * 0.44); for (let i = 0; i < 5; i++) { g.fillStyle = '#1a2230'; g.fillRect(w * 0.33 + i * w * 0.07, h * 0.46, 10, h * 0.36); } g.fillStyle = '#141b26'; g.beginPath(); g.moveTo(w * 0.28, h * 0.38); g.lineTo(w * 0.5, h * 0.26); g.lineTo(w * 0.72, h * 0.38); g.fill(); }
  else if (kind === 'fortress' || kind === 'rooftop') { g.fillStyle = sil; g.fillRect(w * 0.35, h * 0.3, w * 0.3, h * 0.55); g.fillRect(w * 0.3, h * 0.22, w * 0.06, h * 0.63); g.fillRect(w * 0.64, h * 0.22, w * 0.06, h * 0.63);
    g.fillStyle = 'rgba(230,240,255,0.12)'; for (const [x, a] of [[0.33, -0.5], [0.67, 0.6]]) { g.beginPath(); g.moveTo(w * x, h * 0.22); g.lineTo(w * x + Math.sin(a) * 300 - 30, -10); g.lineTo(w * x + Math.sin(a) * 300 + 30, -10); g.fill(); } }
  else if (kind === 'heli') { g.save(); g.translate(w * 0.45, h * 0.32); g.fillStyle = sil; g.beginPath(); g.ellipse(0, 0, 34, 14, 0, 0, 7); g.fill(); g.fillRect(20, -4, 50, 6); g.fillRect(-50, -18, 100, 3); g.fillStyle = 'rgba(230,240,255,0.15)'; g.beginPath(); g.moveTo(-6, 10); g.lineTo(-70, h * 0.6); g.lineTo(40, h * 0.6); g.fill(); g.restore(); }
  else if (kind === 'train') { g.fillStyle = sil; for (let i = 0; i < 5; i++) g.fillRect(20 + i * 92, h * 0.64, 86, h * 0.16); g.fillStyle = '#2a2f36'; g.fillRect(0, h * 0.8, w, 3); }
  else if (kind === 'yacht') { g.fillStyle = '#0a1622'; g.fillRect(0, h * 0.72, w, h * 0.28); g.fillStyle = '#d8dde3'; g.beginPath(); g.moveTo(w * 0.18, h * 0.72); g.lineTo(w * 0.78, h * 0.72); g.lineTo(w * 0.86, h * 0.62); g.lineTo(w * 0.24, h * 0.62); g.fill(); g.fillStyle = '#9aa2ab'; g.fillRect(w * 0.32, h * 0.52, w * 0.36, h * 0.1); g.fillStyle = 'rgba(255,210,140,0.8)'; for (let i = 0; i < 8; i++) g.fillRect(w * 0.34 + i * w * 0.04, h * 0.56, 8, 4); }
  else if (kind === 'soldiers') { g.fillStyle = sil; for (let i = 0; i < 7; i++) { const x = w * 0.15 + i * w * 0.11, y = h * 0.86; g.fillRect(x - 7, y - 40, 14, 40); g.beginPath(); g.arc(x, y - 46, 8, 0, 7); g.fill(); g.fillRect(x + 5, y - 32, 18, 3); } }
  else { g.fillStyle = sil; g.fillRect(w * 0.42, h * 0.74, 60, 22); g.fillStyle = 'rgba(255,240,210,0.5)'; g.fillRect(w * 0.42 + 56, h * 0.76, 4, 4); } // la furgoneta
}
let storyT = 0;
function showStory(n, next) {
  const [title, kind, lines] = STORY[n];
  $('stTitle').textContent = title; drawStory(kind);
  const el = $('stText'); el.innerHTML = ''; let i = 0;
  clearInterval(storyT);
  const add = () => { if (i >= lines.length) { clearInterval(storyT); return; } const p = document.createElement('p'); p.textContent = lines[i++]; el.appendChild(p); };
  add(); storyT = setInterval(add, 1400);
  storyNext = () => { clearInterval(storyT); next(); };
  state = 'story'; show('story');
}
let storyNext = null;
let goAfter = null, typeT = 0;
function brief(after) {
  run.seen = Array.isArray(run.seen) ? run.seen : [];
  if (STORY[run.level] && !run.seen.includes(run.level)) { run.seen.push(run.level); showStory(run.level, () => brief(after)); return; } // la escena va antes del briefing, una vez por partida
  const M = mission(run.level), car = CARS[M.car] || 'Furgoneta', vault = M.scene === 'banco' || M.scene === 'datos';
  $('bfNum').textContent = `MISIÓN ${String(M.n).padStart(2, '0')} / ${MISSIONS.length}${M.n > MISSIONS.length ? ' · MODO INFINITO' : ''} · ${(SCENES[M.scene] || '').toUpperCase()}`;
  $('bfName').textContent = M.name.toUpperCase();
  $('bfTags').innerHTML = [`<span class="tag op-${M.op}">${M.boss ? 'Jefe' : OPS[M.op].name}</span>`, `<span class="tag">${car}</span>`, M.chase ? '<span class="tag">Persecución</span>' : '', vault ? '<span class="tag">Cámara blindada</span>' : ''].join('');
  const objs = missionObjectives(run.level), info = M.boss ? [`La salida está bloqueada mientras ${(FOES[M.boss] || FOES.boss).title} siga en pie; a media vida pide refuerzos.`, M.boss === 'coronel' ? 'Su armadura aguanta de frente: rodéalo. Lanza proyectiles explosivos y suelta drones.' : M.boss === 'viuda' ? 'Apunta un segundo con el láser antes de disparar y cambia de puesto tras cada tiro: muévete en perpendicular.' : 'Lanza ráfagas de ametralladora y granadas.']
    : [vault ? 'La cámara tiene puerta de seguridad: busca el código en los cajones, en el supervisor o en la terminal, o hackéala.' : M.scene === 'galeria' ? 'Puede que la pieza esté en una cámara cerrada.' : 'Registra cajones, estanterías y cuerpos: lo que saquees va a la bolsa.',
      OPS[M.op].desc, LOOT_ALARM[M.scene] ? 'El botín tiene sensor: al cogerlo saltará la alarma.' : 'El botín no tiene alarma: si nadie te ve, nadie sabrá que te lo has llevado.',
      PUBLIC[M.scene] ? 'Hay civiles: si te ven armado o ven un cuerpo, huirán a llamar a la policía. Con el cuchillo se les reduce sin hacerles daño.' : '',
      M.chase ? 'Al huir te perseguirán: derriba sus coches o aguanta hasta perderlos.' : '', M.rain ? 'Llueve: tus pasos se oyen menos y fuera se ve peor.' : ''].filter(Boolean);
  let i = 0; const li = t => `<li style="--i:${i++}">${t}</li>`;
  $('bfObj').innerHTML = `<li class="bf-h">Objetivos principales</li>${objs.filter(o => o.primary).map(o => li(o.text)).join('')}<li class="bf-h">Secundarios</li>${objs.filter(o => !o.primary).map(o => li(`${o.text} <em>+$${o.reward}</em>`)).join('')}<li class="bf-h">Información</li>${info.map(li).join('')}`;
  const card = $('bfCard'); card.classList.remove('anim'); void card.offsetWidth; card.classList.add('anim');
  const text = M.brief || '', el = $('bfBrief'); let n = 0; el.textContent = '';
  clearInterval(typeT);
  typeT = setInterval(() => { n += 2; el.textContent = text.slice(0, n); if (n >= text.length) clearInterval(typeT); }, 18); // a máquina
  run.plan = okPlan(run.plan);
  $('bfPlan').hidden = !!M.boss; if (!M.boss) renderPlan();
  goAfter = after; state = 'brief'; show('brief');
}
function gameOver(title, msg) {
  state = 'over';
  $('overTitle').textContent = title;
  const chase = !!(room && room.chase);
  $('overInfo').textContent = chase ? `${msg} Puedes repetir la persecución con el botín y lo que llevabas al subir al coche.` : `${msg} Puedes reintentarla con el equipo con el que entraste.`;
  $('bRetry').textContent = chase ? 'Repetir persecución' : 'Reintentar';
  $('bOverShop').hidden = chase || !!run.tutorial; // la tienda reinicia la misión entera
  show('over');
}
// ---- Usar: registrar cajones, estanterías, cuerpos, cajas de seguridad y racks; hackear la terminal o la puerta de la cámara
const LOOTABLE = { [LOW]: ['Registrar cajones', 1], [SHELF]: ['Registrar estantería', 1.2], [DEPOSIT]: ['Forzar caja de seguridad', 2], [RACK]: ['Extraer disco duro', 1.5], [TERMINAL]: ['Hackear la terminal', 6] };
function nearUse() {
  const p = room.p;
  if (!p || p.dead || room.chase) return null;
  let best = null, bd = 48;
  const consider = o => { const d = Math.hypot(o.x - p.x, o.y - p.y); if (d < bd) { bd = d; best = o; } };
  if (room.drag) { // arrastrando: soltarlo o, junto a un seto, un contenedor, una caja o una estantería, esconderlo
    const spot = hideSpot(p.x, p.y, p.z);
    return { kind: 'drop', x: p.x, y: p.y, spot, label: spot ? 'Esconder el cuerpo' : 'Soltar el cuerpo', time: spot ? 0.8 : 0 };
  }
  for (const b of room.bodies) if (b.z === p.z && !b.hidden) consider({ kind: b.looted ? 'drag' : 'body', ref: b, x: b.x, y: b.y, label: b.looted ? 'Arrastrar el cuerpo' : 'Registrar el cuerpo', time: b.looted ? 0 : 1.1 });
  for (const d of room.doors) if (d.z === p.z && !d.open) consider({ kind: 'door', ref: d, x: d.x, y: d.y, label: room.hasCode ? `Teclear el código ${room.code}` : 'Hackear la puerta', time: room.hasCode ? 1.5 : room.pick ? 9 : 18 });
  const cx = Math.floor(p.x / T), cy = Math.floor(p.y / T), M = maps[p.z];
  for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) {
    const c = y * W + x, t = M[c], info = LOOTABLE[t];
    if (!info || room.searched.has(p.z + ':' + c) || (t === TERMINAL && (room.hasCode || !room.doors.length) && room.camsOff)) continue;
    if (t === LOW && ((p.z === 0 && !zone[c]) || (fks[p.z][c] === 8 && M[c - 1] !== LOW && M[c + 1] !== LOW))) continue; // coches y peanas no tienen cajones
    consider({ kind: 'tile', ref: c, tt: t, x: x * T + T / 2, y: y * T + T / 2, label: t === TERMINAL ? (room.doors.length && !room.hasCode ? 'Hackear la terminal (código y cámaras)' : 'Apagar las cámaras') : info[0], time: t === TERMINAL && room.pick ? info[1] / 2 : info[1] });
  }
  return best;
}
function use() {
  if (state !== 'play' || !room || room.chase) return;
  if (room.act) { if (room.act.kind === 'door') room.act.ref.hack = room.act.t; room.act = null; return; } // volver a pulsar: cancelar
  const o = nearUse();
  if (o) { room.act = { ...o, t: o.kind === 'door' && !room.hasCode ? o.ref.hack : 0, beep: 0 }; sfx('click'); }
}
function updateUse(dt) {
  const A = room.act, p = room.p;
  if (!A) return;
  if (p.dead || Math.hypot(A.x - p.x, A.y - p.y) > 62 || (A.kind === 'body' && A.ref.looted)) { if (A.kind === 'door') A.ref.hack = A.t; room.act = null; return; }
  A.t += dt * (1 + 0.18 * sk('hands')); // manos rápidas
  const hacking = ((A.kind === 'door' && !room.hasCode) || A.tt === TERMINAL) && !room.pick; // con la ganzúa electrónica no pita
  if (hacking && (A.beep -= dt) <= 0) { A.beep = 2.5; useFloor(p.z); noise(A.x, A.y, 150, 'step'); sfx('beep', A.x, A.y); } // el aparato pita: algún guardia puede oírlo
  if (A.t >= A.time) { room.act = null; finishUse(A); }
}
function finishUse(A) {
  const k = 1 + run.level * 0.12, p = room.p;
  useFloor(p.z);
  if (A.kind === 'body') {
    A.ref.looted = true;
    gainCash(Math.round(rnd(12, 40) * k), A.x, A.y);
    if (Math.random() < 0.5) addAmmo(0.15);
    if (Math.random() < 0.18) giveItem(Math.random() < 0.6 ? 'vendas' : 'analgesico', A.x, A.y - 14); // los guardias llevan algo de botiquín
    if (A.ref.keycard) gotCode('la tarjeta del supervisor');
  } else if (A.kind === 'door') { room.vaultBy = room.vaultBy || (room.hasCode ? 'code' : 'hack'); openDoor(A.ref); }
  else if (A.kind === 'drag') { room.drag = A.ref; popup(A.x, A.y - 16, 'ARRASTRANDO', '#d9e2ec'); }
  else if (A.kind === 'drop') { const b = room.drag; room.drag = null; if (A.spot) { b.hidden = true; popup(b.x, b.y - 16, 'ESCONDIDO', '#62d6ad'); sfx('wood', b.x, b.y); } }
  else {
    room.searched.add(p.z + ':' + A.ref);
    const nothing = () => popup(A.x, A.y - 16, 'Nada', '#7d8ca0'), ammo = () => { addAmmo(0.14); popup(A.x, A.y - 16, '+MUNICIÓN', '#ffd98a'); sfx('reload'); };
    if (A.tt === LOW) { if (room.tutorial) giveItem('vendas', A.x, A.y); else if (p.z === 0 && A.ref === room.codeDrawer) gotCode('una nota en un cajón'); else if (Math.random() < 0.12 && giveItem(Math.random() < 0.7 ? 'vendas' : 'energia', A.x, A.y)) { /* botiquín de oficina */ } else if (Math.random() < 0.6) gainCash(Math.round(rnd(8, 35) * k), A.x, A.y); else if (Math.random() < 0.5) ammo(); else nothing(); }
    else if (A.tt === SHELF) { const r = Math.random(); if (r < 0.1 && giveItem('botiquin', A.x, A.y)) return; r < 0.35 ? ammo() : r < 0.65 ? gainCash(Math.round(rnd(5, 20) * k), A.x, A.y) : nothing(); }
    else if (A.tt === DEPOSIT) { gainCash(Math.round(rnd(40, 110) * k), A.x, A.y); bakeDirty(A.x, A.y); }
    else if (A.tt === RACK) gainCash(Math.round(rnd(25, 70) * k), A.x, A.y);
    else if (A.tt === TERMINAL) { if (room.doors.length) gotCode('la terminal de seguridad'); room.camsOff = true; banner('Cámaras de seguridad apagadas'); }
  }
}
function hideSpot(x, y, z) { // escondites para cuerpos: setos y contenedores fuera, cajas y estanterías dentro
  const cx = Math.floor(x / T), cy = Math.floor(y / T), M = maps[z];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = M[(cy + dy) * W + cx + dx]; if (t === BUSH || t === METAL || t === CRATE || t === SHELF) return true; }
  return false;
}
function gainCash(n, x, y) { room.cash += n; popup(x, y - 18, `+$${n}`, '#7fe0a8'); sfx('cash', x, y); }
function gotCode(src) { if (room.hasCode) return; room.hasCode = true; banner(`Código de la cámara: ${room.code} (${src})`); sfx('buy'); }
function openDoor(d) {
  const z0 = curZ;
  d.open = true;
  useFloor(d.z);
  for (const c of d.cells) map[c] = FLOOR;
  refreshLamps(d.x, d.y); // también rehornea la zona
  noise(d.x, d.y, 220, 'step');
  sfx('vault', d.x, d.y); banner('Puerta de la cámara abierta'); cam.shake = 4;
  useFloor(z0);
}
// Sigilo: si te detectan, llaman a la policía; asalto: suena desde el principio. Con alarma llegan refuerzos
// Alguien da el aviso (un guardia por radio, un civil por teléfono, el sensor del botín): la policía tarda un rato en llegar;
// con ella en la zona empieza el cerco y llegan oleadas
function triggerAlarm(msg) {
  if (room.alarm || room.tutorial) return;
  const p = room.p, g = room.loot && !room.loot.taken ? room.loot : room.exit;
  room.alarm = true; room.sirenT = 0; room.policeT = policeDelay();
  room.alarmBeforeLoot = !(room.loot && room.loot.taken);
  room.timer = Math.min(room.timer, Math.round(room.policeT + 50 + (Math.hypot(g.x - p.x, g.y - p.y) + Math.hypot(room.exit.x - g.x, room.exit.y - g.y)) / T * 1.2));
  banner(`${msg} · Policía en ${Math.round(room.policeT)} s`);
  sfx('radio');
}
function spawnPolice(n) {
  if (room.road) { // en coche patrulla: entra por un extremo de la calle, frena cerca de la entrada y bajan los agentes
    for (let i = 0; i < Math.ceil(n / 3); i++) {
      const fromLeft = Math.random() < 0.5, tx = clamp(room.start.x + rnd(-160, 160) + i * 70, 2 * T, (W - 2) * T);
      room.copCars.push({ x: fromLeft ? -70 - i * 90 : W * T + 70 + i * 90, y: room.road.east, a: fromLeft ? Math.PI / 2 : -Math.PI / 2, tx, n: Math.min(3, n - i * 3), v: 320, parked: false, ph: Math.random() * 6 });
    }
    return;
  }
  const cells = [];
  for (let y = 2; y < H - 2; y++) for (let x = 1; x <= 3; x++) if (!BLOCK_WALK[maps[0][y * W + x]]) cells.push(y * W + x);
  const z0 = curZ;
  useFloor(0);
  for (let i = 0; i < n && cells.length; i++) {
    const e = makeEnemy(run.level > 7 && Math.random() < 0.35 ? 'swatp' : 'police', cells[(Math.random() * cells.length) | 0], Math.random);
    Object.assign(e, { state: 'investigate', target: { x: room.p.x, y: room.p.y }, urgent: true, alertLvl: 2 });
    room.enemies.push(e);
  }
  useFloor(z0);
}
// Al coger el botín salta la alarma: cuenta atrás para escapar y los guardias se movilizan
function stealLoot() {
  const L = room.loot;
  L.taken = true;
  popup(L.x, L.y - 20, '¡BOTÍN!', '#ffd98a');
  if (!LOOT_ALARM[room.mission.scene] && !room.alarm) { // sin sensor: nadie se entera si nadie te ve
    banner('Botín en la bolsa. Llega al vehículo de extracción sin que te vean'); sfx('cash'); buzz(60);
    return;
  }
  const escape = Math.round(50 + Math.hypot(room.exit.x - L.x, room.exit.y - L.y) / T * 1.0);
  triggerAlarm('¡El botín tenía sensor y ha saltado la alarma!');
  room.timer = Math.max(room.timer, escape);
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
  if (hidden(e)) { // los civiles no investigan: si suenan tiros o gritos, huyen; si no, miran (el agente de paisano se descubre)
    if (e.state === 'subdued' || e.state === 'panic') return;
    if (kind === 'shot' || kind === 'boom' || kind === 'eshot' || kind === 'alert') panic(e, x, y); else if (e.state === 'patrol') suspicious(e, x, y);
    return;
  }
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
    if (!room.alarm && !FOES[e.type].melee && !(e.radioT > 0)) { e.radioT = 2.6; e.radioMsg = 'Un guardia te ha visto y ha dado el aviso por radio'; } // si lo abates antes, no llega a avisar
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
    const L = room.loot; // el botín también da luz
    if (L && !L.taken && L.z === z && Math.hypot(L.x - X, L.y - Y) < 86 && los(L.x, L.y, X, Y)) return true;
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
const visionRange = e => FOES[e.type].vision * (room.rain && !zone[cellOf(e.x, e.y)] ? 0.85 : 1) * (1 + 0.15 * e.alertLvl) * (e.state === 'combat' ? 1.4 : 0.6 + 0.4 * Math.min(1, room.exposure));
function lookAround(e, dt, spread) {
  if ((e.lookT -= dt) <= 0) { e.lookT = rnd(0.7, 1.8); e.lookA = e.a + rnd(-spread, spread); }
  return e.lookA;
}
function updateEnemy(e, dt) {
  const p = room.p, F = FOES[e.type], X = room.exposure;
  if (e.burnT > 0) { // munición incendiaria: arde unos segundos
    e.burnT -= dt; e.hp -= 8 * dt;
    if (Math.random() < dt * 25) room.parts.push({ x: e.x + rnd(-6, 6), y: e.y + rnd(-6, 6), z: e.z, vx: rnd(-20, 20), vy: rnd(-40, -10), t: rnd(0.3, 0.6), c: '#ffb04a', s: 2, glow: true });
    if (e.hp <= 0) { hurtEnemy(e, 0, e.a); return; }
  }
  if (e.radioT > 0 && (e.radioT -= dt) <= 0 && !room.alarm) triggerAlarm(e.radioMsg || 'Han dado el aviso');
  if (F.civil || (F.agent && !e.revealed)) { updateCivil(e, dt); return; }
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
      e.aware += dt * (smell ? Math.max(X, 1.2) : F.drone ? Math.max(X, 0.9) : X) * (0.8 + 2.6 * Math.max(0, 1 - d / range)) * (1 + 0.5 * e.alertLvl) * (disguised() && d > 45 && !smell ? 0.3 : 1);
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
  if (!combat) for (const b of found()) { // un cuerpo o un civil maniatado: lo investiga y da el aviso por radio
    if (e.seen.has(b) || b.z !== e.z) continue;
    const bd = Math.hypot(b.x - e.x, b.y - e.y);
    if (bd < F.vision * 0.9 && Math.abs(angDiff(e.a, Math.atan2(b.y - e.y, b.x - e.x))) < 0.62 && los(e.x, e.y, b.x, b.y)) {
      e.seen.add(b); e.alertLvl = 2;
      if (lit(e.x, e.y, e.z)) popup(e.x, e.y - 24, '?!', '#ffb547');
      investigate(e, b.x, b.y, true);
      noise(e.x, e.y, 260, 'alert', e, b.x, b.y);
      if (!room.alarm && !F.melee && !(e.radioT > 0)) { e.radioT = F.drone ? 0.2 : 3.5; e.radioMsg = b.state === 'subdued' ? 'Han encontrado a un civil maniatado y avisan a la policía' : 'Han encontrado un cuerpo y avisan a la policía'; }
      for (const g of room.enemies) if (!FOES[g.type].civil && g !== e) g.alertLvl = Math.max(g.alertLvl, 1); // todos más atentos
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
          if (d < e.r + p.r + 10 && e.fireT <= 0 && e.reactT <= 0) { e.fireT = 1 / F.rate; hurtPlayer(F.dmg, toP); sfx('bite', e.x, e.y); }
        } else if (F.boss) {
          if (e.type === 'viuda') viudaAttack(e, dt, d);
          else { if (d > 240 && e.burstT <= 0) moveTo(e, p.x, p.y, F.walk, dt); bossAttack(e, dt, d); }
        } else if (F.post) { // francotirador: aviso rojo, un segundo apuntando y un tiro pesado
          if (e.aimT > 0) { if ((e.aimT -= dt) <= 0) snipe(e); }
          else if (e.reactT <= 0 && e.fireT <= 0 && Math.abs(angDiff(e.a, toP)) < 0.15) { e.aimT = 1.1; warn(e, '#ff5444'); sfx('charge', e.x, e.y); }
        } else if (F.taser) { // se acerca corriendo y, a menos de 110, dispara los dardos: te deja aturdido
          if (d > 95) moveTo(e, p.x, p.y, F.run, dt);
          if (d < 110 && e.reactT <= 0 && e.fireT <= 0 && Math.abs(angDiff(e.a, toP)) < 0.35) {
            e.fireT = 1 / F.rate; p.stunT = 1.2; hurtPlayer(F.dmg, toP); sfx('zap', e.x, e.y);
            fx({ k: 'zap', x: e.x, y: e.y, tx: p.x, ty: p.y, life: 0.25 }); popup(p.x, p.y - 24, 'ATURDIDO', '#ffd98a');
          }
        } else if (F.drone) { // te sigue a distancia y avisa a los guardias de dónde estás
          if (d > 140) moveTo(e, p.x, p.y, F.run, dt);
          if ((e.fireT -= dt) <= 0) { e.fireT = 1.2; noise(e.x, e.y, 360, 'alert', e, p.x, p.y); if (!room.alarm) triggerAlarm('Un dron de vigilancia te ha localizado'); }
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
function reveal(e) {
  if (e.revealed) return;
  e.revealed = true; e.look = { ...e.look, gun: [12, 4.5] }; e.state = 'patrol';
  if (lit(e.x, e.y, e.z)) popup(e.x, e.y - 26, '¡AGENTE DE PAISANO!', '#ff5444');
  enterCombat(e);
}
const hidden = e => FOES[e.type].civil || (FOES[e.type].agent && !e.revealed); // los que no cuentan (aún) como enemigos
const found = () => room.bodies.filter(b => !b.hidden).concat(room.enemies.filter(c => c.state === 'subdued'));
// Civiles: pasean; si te ven armado (poco a poco, según lo expuesto que vayas) o ven un cuerpo, gritan, huyen hacia la calle y llaman
function panic(e, x, y) {
  if (FOES[e.type].agent) { reveal(e); return; } // el agente de paisano no huye: saca la pistola
  if (e.state === 'panic' || e.state === 'subdued') return;
  e.state = 'panic'; e.callT = 4.5; e.path = null; e.aware = 1;
  if (!e.ped) { const p = room.p; e.fleeTo = dist(room.start, p) > dist(room.exit, p) ? room.start : room.exit; } // huye por la salida que le pille lejos de ti
  if (lit(e.x, e.y, e.z)) popup(e.x, e.y - 24, '¡!', '#ff8a5c');
  sfx('scream', e.x, e.y);
  noise(e.x, e.y, 230, 'alert', e, x ?? room.p.x, y ?? room.p.y); // los gritos atraen a los guardias
}
function updateCivil(e, dt) {
  const p = room.p, F = FOES.civil, same = e.z === p.z && !p.dead, d = dist(e, p);
  e.moveA = null;
  if (e.state === 'subdued') return;
  if (e.state === 'patrol' || e.state === 'suspicious') {
    const R = F.vision * (0.6 + 0.4 * Math.min(1, room.exposure)) * (e.ped ? 0.6 : 1);
    if (same && d < R && !disguised() && Math.abs(angDiff(e.a, ang(e, p))) < 1.05 && los(e.x, e.y, p.x, p.y)) {
      e.aware += dt * Math.max(0.6, room.exposure) * (1 + 1.5 * (1 - d / R));
      if (e.aware >= 1) panic(e, p.x, p.y); else if (e.aware > 0.35) suspicious(e, p.x, p.y);
    } else e.aware = Math.max(0, e.aware - dt * 0.25);
    for (const b of found()) if (b.z === e.z && dist(e, b) < 210 && Math.abs(angDiff(e.a, ang(e, b))) < 1.05 && los(e.x, e.y, b.x, b.y)) { panic(e, b.x, b.y); break; }
  }
  let face = null;
  if (e.state === 'patrol') {
    if (e.waitT > 0) { e.waitT -= dt; face = lookAround(e, dt, 1.2); }
    else if (moveTo(e, e.goal.x, e.goal.y, F.walk, dt)) { e.waitT = rnd(1.5, 5); e.wpI = (e.wpI + 1) % e.wps.length; e.goal = jitter(e.wps[e.wpI]); }
  } else if (e.state === 'suspicious') {
    face = Math.atan2(e.target.y - e.y, e.target.x - e.x);
    if ((e.stateT -= dt) <= 0) { e.state = 'patrol'; e.waitT = 1; }
  } else if (e.state === 'panic') { // corre a la calle con el móvil en la mano
    if (e.callT > 0 && (e.callT -= dt) <= 0 && !room.alarm) triggerAlarm('Un civil ha llamado a la policía');
    if ((e.ringT = (e.ringT || 0) - dt) <= 0 && e.callT > 0) { e.ringT = 1.2; sfx('phone', e.x, e.y); }
    const fl = e.fleeTo || room.start;
    if (moveTo(e, fl.x, fl.y, F.run, dt) || dist(e, fl) < 40) { // ha escapado: si no había llamado, llama ahora
      if (!room.alarm) triggerAlarm('Un testigo ha escapado y ha llamado a la policía');
      room.enemies.splice(room.enemies.indexOf(e), 1);
      return;
    }
  }
  const want = face ?? e.moveA ?? e.a;
  e.a += clamp(angDiff(e.a, want), -4 * dt, 4 * dt);
}
// Puertas de las salas: se abren cuando alguien se acerca y se cierran solas al rato; cerradas tapan la vista
// La calle: el coche que te dejó se va, el de extracción llega con el botín, tráfico que para si te pones delante y patrullas
function updateStreet(dt) {
  const R = room.road; if (!R) return;
  const p = room.p, D = room.dropCar, X = room.exitCar;
  if (D) { if ((D.t -= dt) <= 0) { D.v = Math.min(300, D.v + 260 * dt); D.x += D.v * dt; if (D.x > W * T + 120) room.dropCar = null; } }
  if (X.state === 'away' && room.loot && room.loot.taken) { X.state = 'coming'; banner('El vehículo de extracción viene de camino'); }
  if (X.state === 'coming') {
    const dx = room.exit.x - X.x, v = clamp(Math.abs(dx) * 1.6, 40, 340);
    X.x += Math.sign(dx) * Math.min(Math.abs(dx), v * dt);
    if (Math.abs(dx) < 2) { X.state = 'wait'; banner('¡El vehículo de extracción te espera!'); sfx('horn', X.x, X.y); }
  }
  if ((room.trafT -= dt) <= 0 && room.traffic.length < 3) { // tráfico de vez en cuando, en los dos sentidos
    room.trafT = rnd(5, 11);
    const east = Math.random() < 0.5, kind = ['sedan', 'van', 'suv'][Math.floor(Math.random() * 3)];
    room.traffic.push({ x: east ? -80 : W * T + 80, y: east ? R.east : R.west, a: east ? Math.PI / 2 : -Math.PI / 2, dir: east ? 1 : -1, v: rnd(170, 230), kind, paint: ['#7a2f2a', '#c8c2b0', '#2f5d7a', '#6b6f75', '#3d6b3f'][Math.floor(Math.random() * 5)], honkT: 0 });
  }
  const blockers = [p, ...room.enemies.filter(e => e.ped || e.cop || FOES[e.type].cop), ...room.copCars, X, D].filter(Boolean);
  for (const c of room.traffic) { // frena si tiene algo delante en su carril (y pita)
    const ahead = blockers.some(o => o !== c && (o.z === undefined || o.z === 0) && Math.abs(o.y - c.y) < 34 && (o.x - c.x) * c.dir > 0 && (o.x - c.x) * c.dir < 90);
    if (ahead) { c.honkT -= dt; if (c.honkT <= 0) { c.honkT = 2.5; sfx('horn', c.x, c.y); } }
    else c.x += c.dir * c.v * dt;
  }
  room.traffic = room.traffic.filter(c => c.x > -150 && c.x < W * T + 150);
  for (const c of room.copCars) { // la patrulla frena y aparca; bajan los agentes
    if (c.parked) continue;
    const dx = c.tx - c.x; c.x += Math.sign(dx) * Math.min(Math.abs(dx), clamp(Math.abs(dx) * 2, 60, c.v) * dt);
    if (Math.abs(dx) < 3) {
      c.parked = true; useFloor(0);
      for (let i = 0; i < c.n; i++) {
        const e = makeEnemy(run.level > 7 && Math.random() < 0.35 ? 'swatp' : 'police', cellOf(c.x + (i - 1) * 26, (H - 7) * T + 20), Math.random);
        Object.assign(e, { state: 'investigate', target: { x: p.x, y: p.y }, urgent: true, alertLvl: 2 });
        room.enemies.push(e);
      }
      useFloor(p.z);
    }
  }
}
function drawStreetCars(c) { // coches de la calle, el que te dejó, el de extracción y las patrullas (con su barra de luces)
  if (!room.road) return;
  for (const t of room.traffic) drawCar(c, t.kind, t.x, t.y, t.a, t.paint);
  if (room.dropCar) drawCar(c, room.dropCar.kind, room.dropCar.x, room.dropCar.y, room.dropCar.a, room.dropCar.paint);
  if (room.exitCar.state !== 'away') drawCar(c, room.exitCar.kind, room.exitCar.x, room.exitCar.y, room.exitCar.a);
  for (const k of room.copCars) {
    drawCar(c, 'sedan', k.x, k.y, k.a, '#e4e6ea');
    c.save(); c.translate(k.x, k.y); c.rotate(k.a); c.fillStyle = '#15171b'; c.fillRect(-14, -6, 28, 10); // capó y techo con la barra
    const on = Math.sin(room.time * 14 + k.ph) > 0; c.fillStyle = on ? '#ff3a3a' : '#4a1010'; c.fillRect(-9, 2, 8, 4); c.fillStyle = on ? '#1a2a55' : '#4a7aff'; c.fillRect(1, 2, 8, 4);
    c.restore();
  }
}
function streetLights(c) { // faros y sirenas (emisivos, se ven a oscuras)
  if (!room.road) return;
  for (const t of room.traffic) carLights(c, t.kind, t.x, t.y, true, t.a);
  if (room.dropCar) carLights(c, room.dropCar.kind, room.dropCar.x, room.dropCar.y, true, room.dropCar.a);
  if (room.exitCar.state !== 'away') carLights(c, room.exitCar.kind, room.exitCar.x, room.exitCar.y, true, room.exitCar.a);
  for (const k of room.copCars) { carLights(c, 'sedan', k.x, k.y, !k.parked, k.a); const on = Math.sin(room.time * 14 + k.ph) > 0; c.fillStyle = glow(c, k.x, k.y, 90, on ? '255,40,40' : '50,100,255', 0.45); c.beginPath(); c.arc(k.x, k.y, 90, 0, 7); c.fill(); }
}
function updateDoors(dt) {
  for (const d of room.idoors) {
    const near = (room.p.z === d.z && !room.p.dead && Math.hypot(room.p.x - d.x, room.p.y - d.y) < 38) || room.enemies.some(e => e.z === d.z && e.state !== 'subdued' && Math.hypot(e.x - d.x, e.y - d.y) < 34);
    d.swing += ((d.open ? 1 : 0) - d.swing) * Math.min(1, dt * 9);
    if (near) d.t = 0; else d.t += dt;
    if (near && !d.open) { d.open = true; for (const c of d.cells) maps[d.z][c] = FLOOR; sfx('door', d.x, d.y); }
    else if (d.open && d.t > 2.5) { d.open = false; for (const c of d.cells) maps[d.z][c] = DOOR; sfx('door', d.x, d.y); }
  }
}
// Cámaras de seguridad: barren a un lado y a otro; si te graban un rato (o graban un cuerpo), seguridad avisa a la policía.
// Se rompen de un tiro, se apagan desde la terminal y el inhibidor las ciega un rato
function camBlind(k) { return !k.on || room.camsOff || (room.jamT > 0 && Math.hypot(k.x - room.jamX, k.y - room.jamY) < 340); }
function updateCams(dt) {
  if (room.jamT > 0) room.jamT -= dt;
  const p = room.p;
  for (const k of room.cams) {
    if (camBlind(k)) { k.spot = 0; continue; }
    k.t += dt; k.a = k.a0 + Math.sin(k.t * 0.55) * 0.75;
    const d = Math.hypot(p.x - k.x, p.y - k.y), R = 260;
    const sees = !p.dead && p.z === k.z && d < R && Math.abs(angDiff(k.a, Math.atan2(p.y - k.y, p.x - k.x))) < 0.45 && los(k.x, k.y, p.x, p.y);
    if (sees) k.spot += dt * Math.max(0.5, room.exposure) * (1.2 + (1 - d / R)) * (disguised() ? 0.3 : 1);
    else k.spot = Math.max(0, k.spot - dt * 0.4);
    const body = found().some(b => b.z === k.z && Math.hypot(b.x - k.x, b.y - k.y) < R && Math.abs(angDiff(k.a, Math.atan2(b.y - k.y, b.x - k.x))) < 0.45 && los(k.x, k.y, b.x, b.y));
    if ((k.spot >= 1 || body) && !room.alarm) {
      room.detected = room.detected || k.spot >= 1;
      triggerAlarm(body ? 'Una cámara ha grabado un cuerpo: seguridad avisa a la policía' : 'Una cámara te ha grabado: seguridad avisa a la policía');
      for (const e of room.enemies) if (!FOES[e.type].civil && e.z === k.z && e.state !== 'combat') investigate(e, p.x + rnd(-40, 40), p.y + rnd(-40, 40), true);
    }
  }
}
// Disfraz de guardia: te detectan mucho más despacio mientras no hagas nada raro (disparar, correr, arrastrar un cuerpo o llevar el botín)
function disguised() { const p = room.p; return !!room.disguise && !(p.muzzleT > 0 || p.sprint || room.drag || (room.loot && room.loot.taken)); }
function snipe(e) {
  const F = FOES[e.type], mx = e.x + Math.cos(e.a) * (e.r + 14), my = e.y + Math.sin(e.a) * (e.r + 14);
  bullet(mx, my, e.a, 1400, F.dmg, false);
  flash(mx, my, 140, 0.09);
  fx({ k: 'muzzle', x: mx, y: my, a: e.a, life: 0.06, s: 1.3 });
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
      fx({ k: 'muzzle', x: mx, y: my, a: e.a, life: 0.05, s: 1.3 });
      sfx('eshot', e.x, e.y);
    }
  } else if (e.fireT <= 0 && e.reactT <= 0) {
    noise(e.x, e.y, 500, 'eshot', e);
    if (d > 140 && Math.random() < (e.type === 'coronel' ? 0.55 : 0.35)) { bossNade(e); if (e.type === 'coronel' && rage) bossNade(e); e.fireT = rage ? 1 : 1.7; }
    else { e.burstT = rage ? 2.2 : 1.5; e.gunT = 0; e.fireT = e.burstT + (rage ? 0.9 : 1.6); }
  }
}
function bossNade(e) {
  const p = room.p, a = ang(e, p), v = Math.min(dist(e, p), 320) * 1.45; // la parábola cae cerca de ti
  room.nades.push({ z: curZ, x: e.x + Math.cos(a) * 30, y: e.y + Math.sin(a) * 30, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 1.5, foe: true, h: 10, vh: 150 });
  sfx('throw', e.x, e.y);
}
function reinforcements() {
  const d = bfs(cellOf(room.p.x, room.p.y)), far = [], B = room.boss;
  for (let i = 0; i < d.length; i++) if (d[i] >= 8) far.push(i);
  const kinds = B && B.type === 'coronel' ? ['drone', 'drone', 'elite', 'heavy'] : B && B.type === 'viuda' ? ['elite', 'taser', 'guard'] : ['elite', 'guard', 'guard'];
  for (const k of kinds) {
    if (!far.length) break;
    const e = makeEnemy(k, far[(Math.random() * far.length) | 0], Math.random);
    room.enemies.push(e);
    enterCombat(e);
  }
  banner(`¡${B ? FOES[B.type].title : 'El jefe'} pide refuerzos!`);
}
// La Viuda: apunta un segundo con el láser, dispara fuerte y se va a otro puesto; si la hieren, también se mueve
function viudaAttack(e, dt, d) {
  if (e.relocT > 0) { e.relocT -= dt; if (e.spot && moveTo(e, e.spot.x, e.spot.y, FOES.viuda.run, dt)) e.relocT = 0; return; }
  if (e.aimT > 0) { if ((e.aimT -= dt) <= 0) { snipe(e); relocate(e); } return; }
  if (e.reactT <= 0 && e.fireT <= 0 && Math.abs(angDiff(e.a, ang(e, room.p))) < 0.12) { e.aimT = 1; warn(e, '#ff5444'); sfx('charge', e.x, e.y); }
}
function relocate(e) {
  const d = bfs(cellOf(e.x, e.y)), far = [];
  for (let i = 0; i < d.length; i++) if (d[i] >= 5 && d[i] <= 14) far.push(i);
  if (far.length) { e.spot = center(far[(Math.random() * far.length) | 0]); e.relocT = 3; e.path = null; }
}
function banner(text) { room.banner = { text, t: 3.5 }; }
function enemyShoot(e) {
  const F = FOES[e.type];
  e.fireT = rnd(0.8, 1.3) / F.rate;
  const mx = e.x + Math.cos(e.a) * (e.r + 6), my = e.y + Math.sin(e.a) * (e.r + 6);
  for (let i = 0; i < F.pellets; i++) bullet(mx, my, e.a + rnd(-F.spread, F.spread), 620, F.dmg, false);
  flash(mx, my, 110, 0.07);
  fx({ k: 'muzzle', x: mx, y: my, a: e.a, life: 0.05, s: F.pellets > 1 ? 1.4 : 1 });
  noise(e.x, e.y, 420, 'eshot', e);
  sfx('eshot', e.x, e.y);
}

// ================= Jugador =================
function stickVec(s) {
  if (!s) return { x: 0, y: 0, m: 0 };
  const dx = (s.x - s.ox) / STICK_R, dy = (s.y - s.oy) / STICK_R, m = Math.hypot(dx, dy);
  if (m < 0.12) return { x: 0, y: 0, m: 0 };
  const k = Math.min(1, (m - 0.12) / 0.88);
  return { x: dx / m * k, y: dy / m * k, m: k, over: m > 1.3, raw: m }; // over: más allá del borde, esprint
}
function updatePlayer(dt) {
  const p = room.p;
  useFloor(p.z);
  for (const k of ['fireT', 'meleeT', 'nadeT', 'noiseT', 'breachT', 'swingT', 'hurtT', 'muzzleT']) p[k] -= dt;
  p.bloom = Math.max(0, p.bloom - dt * 1.6);
  // Movimiento: poco recorrido = sigilo, a fondo = andar, más allá del borde (o Mayús) = esprintar, que gasta resistencia
  const L = stickVec(sticks.L);
  let mx = L.x, my = L.y, mag = L.m, sprint = !!L.over;
  if (sneakOn && !sprint && mag > SNEAK) { const k = SNEAK / mag; mx *= k; my *= k; mag = SNEAK; } // sigilo activado: el stick no pasa de sigilo
  const kx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const ky = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  if (kx || ky) {
    sprint = !!(keys.ShiftLeft || keys.ShiftRight); mag = sneakOn && !sprint ? 0.45 : 1; // Mayús corre aunque el sigilo esté activado
    const k = Math.hypot(kx, ky); mx = kx / k * mag; my = ky / k * mag;
  } else if (pad.L.m > 0) { // mando: poco recorrido es sigilo, a fondo andas, con el gatillo izquierdo corres
    mx = pad.L.x; my = pad.L.y; mag = pad.L.m; sprint = pad.run;
    if (sneakOn && !sprint && mag > SNEAK) { const k = SNEAK / mag; mx *= k; my *= k; mag = SNEAK; }
    if (sprint) { mx /= mag; my /= mag; mag = 1; }
  }
  if (p.stunT > 0) { p.stunT -= dt; mag = 0; mx = my = 0; } // aturdido por el táser
  if (p.tired || !mag || room.drag) sprint = false;
  const speed = (room.drag ? 0.55 : 1) * (sprint ? 235 : mag <= SNEAK ? 78 * mag / SNEAK : 78 + 72 * (mag - SNEAK) / (1 - SNEAK));
  if (room.energyT > 0) { p.stam = 100; p.tired = false; } // bebida energética
  if (sprint && p.speed > 120) { p.stam -= 28 * dt / (1 + 0.3 * sk('lungs')); p.restT = 0.9; if (p.stam <= 0) { p.stam = 0; p.tired = true; } }
  else if ((p.restT -= dt) <= 0) { p.stam = Math.min(100, p.stam + 18 * dt); if (p.stam >= 30) p.tired = false; }
  p.sprint = sprint;
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
    p.stepT = p.sprint ? 0.24 : 0.34;
    noise(p.x, p.y, (p.sprint ? 280 : 40 + p.speed * 0.6) * (1 - 0.2 * sk('feet')) * (room.rain ? 0.75 : 1), 'step');
    sfx('step');
  }
  aimAndFire(dt, mx, my, mag, assist);
}
// Apuntado: stick derecho > ratón > dirección de marcha; recarga y disparo
function aimAndFire(dt, mx, my, mag, help) {
  const p = room.p, R = stickVec(sticks.R);
  let aim = null, firing = false;
  if (R.m > 0) {
    aim = Math.atan2(R.y, R.x); firing = R.m > FIRE;
    if (firing) aim = help(aim);
  } else if (padMode && (pad.R.m > 0 || pad.fire)) { // mando: el stick derecho apunta y el gatillo derecho dispara (con ayuda de apuntado)
    aim = pad.R.m > 0 ? Math.atan2(pad.R.y, pad.R.x) : mag > 0.1 ? Math.atan2(my, mx) : p.a;
    firing = pad.fire; if (firing) aim = help(aim);
  } else if (mouse.active && !touchMode) {
    aim = Math.atan2(mouse.y - (vh / 2 + (p.y - cam.y) * zoom), mouse.x - (vw / 2 + (p.x - cam.x) * zoom));
    firing = mouse.down;
  } else if (mag > 0.1) aim = Math.atan2(my, mx);
  if (aim !== null) p.a += angDiff(p.a, aim) * Math.min(1, dt * 18 * settings.sens);
  tickReload(dt);
  if (firing && !(p.stunT > 0)) shoot();
}
function assist(a) { // ayuda de apuntado suave para pantallas táctiles
  const p = room.p;
  let best = null, bd = 0.22;
  for (const e of room.enemies) {
    const d = dist(p, e), da = Math.abs(angDiff(a, ang(p, e)));
    if (e.z === p.z && !hidden(e) && d < 420 && da < bd && lit(e.x, e.y, e.z)) { best = e; bd = da; }
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
  if (w.ammo <= 0) { p.burstLeft = 0; if (w.reserve) reload(); else { p.fireT = 0.35; sfx('empty'); } return; }
  w.ammo--;
  if (s.burst) { p.burstLeft = p.burstLeft > 0 ? p.burstLeft - 1 : s.burst - 1; p.fireT = p.burstLeft > 0 ? 0.07 : 1 / s.rate; } // ráfaga: el resto sale solo
  else p.fireT = 1 / s.rate;
  const mx = p.x + Math.cos(p.a) * 18, my = p.y + Math.sin(p.a) * 18;
  // la dispersión crece al disparar seguido (retroceso) y al esprintar; quieto en sigilo, más precisa
  const spread = s.spread * (1 - 0.1 * sk('steady')) * (1 + p.bloom * 1.5) * (p.sprint ? 1.8 : 1) * (p.sneak && p.speed < 10 ? 0.7 : 1);
  for (let i = 0; i < s.pellets; i++) bullet(mx, my, p.a + rnd(-spread, spread), s.speed * rnd(0.94, 1.06), s.dmg, true, s.bolt, { pierce: s.pierce, burn: s.burn, boom: s.boom, life: s.boom ? 0.9 : 1.2 });
  p.bloom = Math.min(1.5, p.bloom + 0.18 * (s.bloom ?? 1) * (s.pellets > 1 ? 0.5 : 1));
  cam.x -= Math.cos(p.a) * s.kick; cam.y -= Math.sin(p.a) * s.kick; // la cámara retrocede con el disparo
  const quiet = s.silenced || s.bolt;
  noise(p.x, p.y, s.noise, s.noise < 200 ? 'step' : 'shot'); // un disparo silenciado solo despierta sospechas
  if (!quiet) { flash(mx, my, 150, 0.08); p.muzzleT = 0.15; }
  if (!s.bolt) { // fogonazo y casquillo que sale despedido hacia un lado
    fx({ k: 'muzzle', x: mx, y: my, a: p.a, life: 0.05, s: s.silenced ? 0.45 : s.pellets > 1 ? 1.5 : 1 });
    const side = p.a + Math.PI / 2 + rnd(-0.3, 0.3), v = rnd(70, 120);
    room.parts.push({ x: p.x + Math.cos(p.a) * 6, y: p.y + Math.sin(p.a) * 6, z: curZ, vx: Math.cos(side) * v + p.vx, vy: Math.sin(side) * v + p.vy, t: 0.45, c: '#c9a64a', s: 2.5, shell: true });
  }
  cam.shake = Math.max(cam.shake, s.kick * (quiet ? 0.5 : 1));
  sfx(s.bolt ? 'bolt' : s.silenced ? 'sil' : s.pellets > 1 || s.boom || s.kick >= 10 ? 'shotgun' : 'shot');
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
    if (e.z === p.z && e.state !== 'subdued' && d < bd && Math.abs(angDiff(p.a, ang(p, e))) < 1.75 && los(p.x, p.y, e.x, e.y)) { best = e; bd = d; }
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
      hit = true;
      if (FOES[e.type].civil) { if (e.state !== 'subdued') { e.state = 'subdued'; e.callT = 0; room.subdued++; popup(e.x, e.y - 22, 'REDUCIDO', '#62d6ad'); sfx('click', e.x, e.y); } continue; }
      const behind = Math.abs(angDiff(e.a, ang(e, p))) > 1.9;
      hurtEnemy(e, e.state !== 'combat' || behind ? (FOES[e.type].boss ? 300 : 999) : 55, p.a); // al jefe no se le remata de un tajo
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
  if (room.chase) { // la lanzas hacia atrás, en arco, al punto de la carretera bajo la mira
    const C = room.chase, K = chaseCam(), sy = Math.max(C.aim.y, K.yH + 8), z = clamp(K.h * K.F / (sy - K.yH), 90, 700), tx = K.x + (C.aim.x - K.cx) * z / K.F - K.bend * z * z, ty = K.y + z, T = 0.8;
    room.nades.push({ z: 0, x: p.x, y: p.y, vx: (tx - p.x) / T, vy: (ty - p.y) / T, t: 1.7, h: 40, vh: 260 * T - 40 / T });
    sfx('throw'); return;
  }
  room.nades.push({ z: curZ, x: p.x + Math.cos(p.a) * 14, y: p.y + Math.sin(p.a) * 14, vx: Math.cos(p.a) * 340 + p.vx * 0.5, vy: Math.sin(p.a) * 340 + p.vy * 0.5, t: 1.7, h: 8, vh: 150 });
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
function makeNoise() { // lanza una moneda hacia donde apuntas: al caer, suena y los guardias cercanos van a mirar allí
  const p = room.p;
  if (p.noiseT > 0 || p.dead) return;
  useFloor(p.z);
  p.noiseT = 1.2;
  const L = Math.min(230, castRay(p.x, p.y, Math.cos(p.a), Math.sin(p.a), 240) - 8);
  room.coins = room.coins || [];
  room.coins.push({ x: p.x, y: p.y, z: p.z, tx: p.x + Math.cos(p.a) * L, ty: p.y + Math.sin(p.a) * L, t: 0, T: 0.45 + L / 900 });
  sfx('throw');
}
function updateCoins(dt) {
  for (const c of room.coins || []) {
    c.t += dt;
    if (c.t >= c.T && !c.done) { c.done = true; useFloor(c.z); noise(c.tx, c.ty, 260, 'whistle'); sfx('tink', c.tx, c.ty); decal({ x: c.tx, y: c.ty, r: 1.6, shell: true }); }
  }
  if (room.coins) room.coins = room.coins.filter(c => !c.done);
}
function toggleLight() { run.light = !run.light; sfx('empty'); }

// ================= Daño, balas, explosiones =================
function bullet(x, y, a, speed, dmg, mine, bolt = false, extra) {
  room.bullets.push({ x, y, sx: x, sy: y, z: curZ, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg, mine, bolt, life: 1.2, ...extra });
}
function hurtEnemy(e, dmg, a) {
  if (FOES[e.type].armor && Math.abs(angDiff(e.a, a + Math.PI)) < 1.2) { dmg *= 0.5; sparks(e.x, e.y, 3); } // la armadura del Coronel aguanta de frente
  e.hp -= dmg;
  e.x += Math.cos(a) * Math.min(10, 2 + dmg * 0.08); e.y += Math.sin(a) * Math.min(10, 2 + dmg * 0.08);
  blood(e.x, e.y, a, 8);
  const civ = FOES[e.type].civil;
  if (e.hp > 0) { if (civ) panic(e, room.p.x, room.p.y); else { if (FOES[e.type].agent) e.revealed = true; enterCombat(e); if (e.type === 'viuda' && !(e.relocT > 0) && Math.random() < 0.3) relocate(e); } return; }
  if (civ) { // matar civiles: penaliza, acelera a la policía y aterroriza a los que lo ven
    room.civKilled++;
    if (room.alarm && !room.police) room.policeT = Math.max(3, room.policeT - 8);
    popup(e.x, e.y - 20, 'CIVIL ABATIDO', '#ff5444');
    for (const c of room.enemies) if (c !== e && FOES[c.type].civil && dist(c, e) < 320 && los(c.x, c.y, e.x, e.y)) panic(c, e.x, e.y);
  } else {
    const unaware = e.state !== 'combat';
    const reward = Math.round(FOES[e.type].reward * (unaware ? 1.5 : 1));
    room.cash += reward; room.kills++;
    if (unaware) room.silent++;
    popup(e.x, e.y - 20, unaware ? `SIGILO +$${reward}` : `+$${reward}`, unaware ? '#62d6ad' : '#ffd98a');
  }
  const slide = Math.min(280, 60 + dmg * 1.5); // el cuerpo sale despedido según el golpe y se desliza hasta pararse
  room.bodies.push({ x: e.x, y: e.y, z: e.z, a, type: e.type, look: e.look, keycard: e.keycard, seed: Math.random(), t: 0, vx: Math.cos(a) * slide, vy: Math.sin(a) * slide });
  for (let i = 0; i < 3; i++) decal({ x: e.x + Math.cos(a) * (6 + i * 14), y: e.y + Math.sin(a) * (6 + i * 14), z: e.z, r: 6 - i, a, seed: Math.random(), splat: true }); // rastro hacia donde sale despedido
  room.enemies.splice(room.enemies.indexOf(e), 1);
  if (!FOES[e.type].melee && !civ && Math.random() < 0.65) room.items.push({ x: e.x + rnd(-10, 10), y: e.y + rnd(-10, 10), z: e.z });
  if (e === room.boss) { room.boss = null; banner(`¡${FOES[e.type].title} abatido! La salida está abierta`); cam.shake = 14; }
  if (e.keycard) popup(e.x, e.y - 34, 'Lleva una tarjeta', '#8fb8ff');
  sfx('gore', e.x, e.y);
}
function hurtPlayer(dmg, a) {
  const p = room.p;
  if (p.dead) return;
  dmg *= (1 - 0.08 * sk('tough')) * (room.painT > 0 ? 0.7 : 1); // piel dura y analgésicos
  run.hp -= dmg; p.hurtT = 0.35;
  if (a !== undefined) { p.vx += Math.cos(a) * dmg * 6; p.vy += Math.sin(a) * dmg * 6; } // el impacto te empuja
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
        const ix = b.x - b.vx * 0.004, iy = b.y - b.vy * 0.004; // punto de impacto, justo antes del muro
        sparks(ix, iy, 4);
        fx({ k: 'puff', x: ix, y: iy, life: 0.4, r: 9 });
        decal({ x: ix, y: iy, r: 1.8, hole: true });
        if (!border(tx, ty) && map[c] === GLASS) breakTile(tx, ty, b.mine);
        else if (!border(tx, ty) && map[c] === CRATE && (room.crateHp[c] = (room.crateHp[c] ?? 40) - b.dmg) <= 0) breakTile(tx, ty, b.mine);
        else if (b.mine) noise(b.x, b.y, b.bolt ? 60 : 110, 'impact'); // el impacto también distrae
        break;
      }
      if (b.mine) {
        for (const k of room.cams) if (k.on && k.z === b.z && Math.hypot(k.x - b.x, k.y - b.y) < 10) { k.on = false; b.dead = true; sparks(k.x, k.y, 10); sfx('glass', k.x, k.y); noise(k.x, k.y, 140, 'impact'); }
        for (const l of room.lamps) if (l.on && l.z === b.z && Math.hypot(l.hx - b.x, l.hy - b.y) < 11) {
          l.on = false; b.dead = true; sparks(l.hx, l.hy, 12); lampChanged(l);
          noise(l.x, l.y, 160, 'impact'); sfx('glass', l.x, l.y);
        }
        for (const e of room.enemies) if (e.z === b.z && e !== b.hitE && Math.hypot(e.x - b.x, e.y - b.y) < e.r) {
          b.dead = true;
          if (!b.pierce && FOES[e.type].shield && Math.abs(angDiff(e.a, Math.atan2(-b.vy, -b.vx))) < 0.9) { sparks(b.x, b.y, 5); sfx('clank', e.x, e.y); enterCombat(e); break; }
          if (b.burn) e.burnT = 3;
          if (b.pierce && !b.hitE) { b.dead = false; b.hitE = e; } // la perforante sigue hasta el siguiente
          hurtEnemy(e, b.dmg, Math.atan2(b.vy, b.vx));
          break;
        }
      } else if (p.z === b.z && Math.hypot(p.x - b.x, p.y - b.y) < p.r) { hurtPlayer(b.dmg, Math.atan2(b.vy, b.vx)); b.dead = true; }
    }
    if ((b.life -= dt) <= 0) b.dead = true;
    if (b.dead && b.boom) explode(b.x - b.vx * 0.006, b.y - b.vy * 0.006, false, 105, 40); // al tocar algo o al final del recorrido
  }
  room.bullets = room.bullets.filter(b => !b.dead);
}
function updateNades(dt) {
  for (const n of room.nades) {
    useFloor(n.z);
    n.vh -= 520 * dt; n.h += n.vh * dt; // en el aire apenas frena; en el suelo rueda y se para
    if (n.h <= 0) { n.h = 0; if (n.vh < -40) { n.vh *= -0.42; sfx('tick', n.x, n.y); } else n.vh = 0; }
    const f = Math.exp((n.h > 0 ? -0.3 : -4) * dt);
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
  if (room.loot && room.loot.z === curZ && Math.hypot(room.loot.x - x, room.loot.y - y) < 160) room.loot.poly = visPoly(room.loot.x, room.loot.y, 0, Math.PI, 80, 40);
  bakeDirty(x, y);
}
function breakTile(tx, ty, mine) {
  const c = ty * W + tx, t = map[c], x = tx * T + T / 2, y = ty * T + T / 2;
  map[c] = FLOOR;
  sparks(x, y, 8);
  decal({ x, y, r: 12, rubble: true });
  if (mine) noise(x, y, t === GLASS ? 230 : 200, 'impact');
  sfx(t === GLASS ? 'glass' : 'wood', x, y);
  refreshLamps(x, y);
}
function destroyTiles(x, y, rad) {
  let any = false;
  for (let ty = Math.floor((y - rad) / T); ty <= Math.floor((y + rad) / T); ty++)
    for (let tx = Math.floor((x - rad) / T); tx <= Math.floor((x + rad) / T); tx++) {
      const t = map[ty * W + tx];
      if (border(tx, ty) || !t || t === VOID || t === STAIRS || t === VWALL || Math.hypot(tx * T + T / 2 - x, ty * T + T / 2 - y) > rad) continue;
      if (t === SECURE) { // la C4 de asalto revienta la puerta de seguridad; en otras misiones no le hace nada
        const z = curZ, d = room.doors.find(d => d.z === z && d.cells.includes(ty * W + tx));
        if (room.op === 'asalto' && d && !d.open) { room.vaultBy = room.vaultBy || 'c4'; openDoor(d); useFloor(z); }
        continue;
      }
      map[ty * W + tx] = FLOOR; any = true;
      decal({ x: tx * T + T / 2, y: ty * T + T / 2, r: 15, rubble: true });
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
  if (p.z === z && dp < R && los(x, y, p.x, p.y)) hurtPlayer((170 * (1 - dp / R) + 20) * 0.6, Math.atan2(p.y - y, p.x - x));
  for (const l of room.lamps) if (l.on && l.z === z && Math.hypot(l.x - x, l.y - y) < R) { l.on = false; lampChanged(l); }
  noise(x, y, 800, foe ? 'eshot' : 'boom'); // la granada del jefe no cuenta como ruido tuyo
  flash(x, y, 280, 0.35);
  fx({ k: 'fire', x, y, life: 0.42, r: R * 0.85 }); // bola de fuego
  fx({ k: 'ring', x, y, life: 0.3, r: R * 1.3 }); // onda expansiva
  for (let i = 0; i < 8; i++) { const a = rnd(0, 6.3), v = rnd(10, 60); fx({ k: 'smoke', x: x + Math.cos(a) * rnd(0, 20), y: y + Math.sin(a) * rnd(0, 20), vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(1.4, 2.4), r0: rnd(12, 22), r1: rnd(40, 70), g: Math.floor(rnd(62, 92)) }); }
  for (let i = 0; i < 18; i++) { const a = rnd(0, 6.3), v = rnd(80, 320); room.parts.push({ x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: rnd(0.4, 0.9), c: '#ffb04a', s: 2, glow: true }); } // brasas
  for (let i = 0; i < 14; i++) { const a = rnd(0, 6.3), v = rnd(120, 360); room.parts.push({ x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: rnd(0.35, 0.7), c: Math.random() < 0.5 ? '#5a5f68' : '#4a3b2a', s: rnd(2.5, 4.5), debris: true }); } // cascotes
  decal({ x, y, z, r: 38, scorch: true });
  cam.shake = 16; buzz(90);
  sfx('boom', x, y);
}

// ================= Efectos =================
function flash(x, y, r, t) { room.flashes.push({ x, y, z: curZ, r, t, max: t, poly: visPoly(x, y, 0, Math.PI, r, 40) }); }
function fx(o) { room.fx.push({ z: curZ, t: 0, ...o }); }
// Manchas en el suelo (sangre, casquillos, agujeros, cascotes, quemaduras): se pintan una vez sobre el suelo horneado
// en vez de redibujarse en cada fotograma; si esa zona se rehornea, se vuelven a pintar desde esta lista
function decal(d) {
  d = { z: curZ, ...d };
  room.decals.push(d); if (room.decals.length > 600) room.decals.splice(0, 1);
  const b = bakes[d.z];
  if (b && b.cv) { const g = b.cv.getContext('2d'); g.setTransform(b.s, 0, 0, b.s, -b.x0 * T * b.s, -b.y0 * T * b.s); drawDecal(g, d); }
}
function drawDecal(c, d) {
  if (d.splat) { // salpicadura: mancha alargada y gotas que se alejan en la dirección del golpe
    const cs = Math.cos(d.a), sn = Math.sin(d.a), h = i => hash(Math.floor(d.seed * 1e6), i, 3);
    c.fillStyle = 'rgba(80,6,9,0.88)'; c.beginPath(); c.ellipse(d.x, d.y, d.r * 1.5, d.r * 0.8, d.a, 0, 7); c.fill();
    for (let i = 1; i <= 4; i++) { const t = d.r * (1.2 + i * 0.85), o = (h(i) - 0.5) * d.r * 1.4; c.beginPath(); c.arc(d.x + cs * t - sn * o, d.y + sn * t + cs * o, d.r * (0.5 - i * 0.09) + h(i + 5), 0, 7); c.fill(); }
    c.fillStyle = 'rgba(55,4,6,0.55)'; c.beginPath(); c.ellipse(d.x - cs * d.r * 0.3, d.y - sn * d.r * 0.3, d.r * 0.8, d.r * 0.45, d.a, 0, 7); c.fill();
    return;
  }
  if (d.hatch) { c.fillStyle = '#20252b'; c.beginPath(); c.arc(d.x, d.y, d.r, 0, 7); c.fill(); c.strokeStyle = '#4a525c'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#0b0d10'; for (let i = -1; i <= 1; i++) c.fillRect(d.x - d.r * 0.7, d.y + i * 4 - 1, d.r * 1.4, 2); return; } // arqueta o trampilla por la que entraste
  if (d.scorch) c.fillStyle = glow(c, d.x, d.y, d.r, '0,0,0', 0.75);
  else c.fillStyle = d.shell ? '#a88a3a' : d.hole ? '#0b0c0e' : d.rubble ? 'rgba(80,86,96,0.75)' : 'rgba(100,14,16,0.8)';
  if (d.shell) c.fillRect(d.x - 1.6, d.y - 0.8, 3.2, 1.6);
  else { c.beginPath(); c.arc(d.x, d.y, d.r, 0, 7); c.fill(); }
}
function popup(x, y, text, color) { room.texts.push({ x, y, z: curZ, text, color, t: 1.3 }); }
function sparks(x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, s = rnd(60, 260); room.parts.push({ x, y, z: curZ, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rnd(0.15, 0.4), c: '#ffd98a', s: 2 }); } }
function blood(x, y, a, n) {
  for (let i = 0; i < n; i++) { const b = a + rnd(-0.6, 0.6), s = rnd(60, 240); room.parts.push({ x, y, z: curZ, vx: Math.cos(b) * s, vy: Math.sin(b) * s, t: rnd(0.15, 0.45), c: i % 2 ? '#8e1f1f' : '#6a1214', s: rnd(1.6, 3.4), blood: true }); }
  decal({ x: x + Math.cos(a) * rnd(8, 18), y: y + Math.sin(a) * rnd(8, 18), r: rnd(4, 7), a, seed: Math.random(), splat: true }); // salpicadura alargada hacia donde va el golpe
}
function updateFx(dt) {
  for (const q of room.parts) {
    q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.9; q.vy *= 0.9;
    if (q.t - dt <= 0 && q.t > 0 && q.shell && room.p && Math.hypot(q.x - room.p.x, q.y - room.p.y) < 500 && !(room.tinkT > room.time)) { room.tinkT = room.time + 0.07; sfx('shell', q.x, q.y); } // tintineo del casquillo al caer
    if ((q.t -= dt) <= 0 && (q.shell || q.debris || q.blood)) decal({ x: q.x, y: q.y, z: q.z, r: q.shell ? 1.6 : q.blood ? q.s * 0.55 : q.s * 0.6, shell: q.shell, rubble: q.debris, drop: q.blood }); // quedan en el suelo
  }
  room.parts = room.parts.filter(q => q.t > 0);
  for (const f of room.fx) { f.t += dt; if (f.vx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.97; f.vy *= 0.97; } }
  for (const b of room.bodies) b.t = (b.t || 0) + dt; // el charco crece
  for (const b of room.bodies) if (b.vx || b.vy) {
    useFloor(b.z);
    if (solidPx(b.x + b.vx * dt, b.y)) b.vx *= -0.3; else b.x += b.vx * dt;
    if (solidPx(b.x, b.y + b.vy * dt)) b.vy *= -0.3; else b.y += b.vy * dt;
    const f = Math.exp(-6 * dt); b.vx *= f; b.vy *= f;
    if (Math.hypot(b.vx, b.vy) < 4) b.vx = b.vy = 0;
  }
  useFloor(room.p.z);
  room.fx = room.fx.filter(f => f.t < f.life);
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
  bindRoom();
  if (room.chase) { updateChase(dt); return; }
  room.introT = Math.max(0, room.introT - dt);
  const p = room.p;
  room.time += dt;
  if (p.dead) { if ((room.deathT -= dt) <= 0) gameOver('TE HAN ABATIDO', `Caíste en la misión ${run.level}: ${room.mission.name}.`); }
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
  updateUse(dt);
  room.shownCash += (room.cash - room.shownCash) * Math.min(1, dt * 5);
  if (room.alarm && !room.boss) { // la policía llega un rato después del aviso y luego sigue mandando oleadas
    if (!room.police) { if ((room.policeT -= dt) <= 0) { room.police = true; room.reinfT = 22; spawnPolice(3 + (run.level >> 2)); banner('¡Ha llegado la policía!'); sfx('siren'); } }
    else if (room.enemies.length < 30 && (room.reinfT -= dt) <= 0) { room.reinfT = Math.max(12, 26 - run.level); spawnPolice(run.level > 6 ? 3 : 2); }
  }
  updateDoors(dt); updateCams(dt); updateCoins(dt); updateStreet(dt);
  if (room.tutorial) tutorialStep(dt);
  tickItems(dt);
  if (room.drag) { // el cuerpo que arrastras va detrás de ti y deja un rastro de sangre
    const b = room.drag, tx = p.x - Math.cos(p.a) * 22, ty = p.y - Math.sin(p.a) * 22;
    useFloor(b.z);
    if (!solidPx(tx, ty)) { if (Math.hypot(tx - b.x, ty - b.y) > 14 && Math.random() < 0.3) decal({ x: b.x, y: b.y, r: rnd(1.5, 3), drop: true }); b.x += (tx - b.x) * Math.min(1, dt * 10); b.y += (ty - b.y) * Math.min(1, dt * 10); }
    b.a = p.a + Math.PI; b.vx = b.vy = 0;
    useFloor(p.z);
  }
  updateObjectives();
  if (room.loot && room.loot.taken && (room.exhaustT = (room.exhaustT || 0) - dt) <= 0) { // el coche de huida, en marcha
    room.exhaustT = 0.18; useFloor(0);
    const X = room.exitCar, ca = X ? X.a : 0, cx = X ? X.x : room.exit.x, cy = X ? X.y : room.exit.y, back = CAR_DIM[room.mission.car][1] / 2 + 4; // humo del tubo de escape, detrás del coche
    if (!X || X.state !== 'away') fx({ k: 'smoke', x: cx - Math.sin(ca) * back + rnd(-4, 4), y: cy + Math.cos(ca) * back, vx: -Math.sin(ca) * 20 + rnd(-8, 8), vy: Math.cos(ca) * 20, life: 0.9, r0: 3, r1: 11, g: 95 });
    useFloor(p.z);
  }
  if (room.loot && !room.loot.taken && !p.dead && room.loot.z === p.z && dist(p, room.loot) < 24) stealLoot();
  if (!p.dead && room.timer > 0) {
    if (room.alarm && (room.sirenT -= dt) <= 0) { room.sirenT = 1; sfx('siren'); }
    if ((room.timer -= dt) <= 0) {
      room.timer = 0;
      gameOver('TE HAN ATRAPADO', room.alarm ? `Llegó la policía antes de que escaparas (${room.mission.name}).` : `Se acabó el tiempo: la policía llegó antes de que dieras el golpe (${room.mission.name}).`);
      return;
    }
  }
  const locked = room.boss || (room.loot && !room.loot.taken) || (room.road && room.exitCar.state !== 'wait');
  if (!p.dead && p.z === 0 && dist(p, room.exit) < 40) { if (!locked) completeRoom(); else if (!room.banner) banner(room.boss ? `Salida bloqueada: abate a ${FOES[room.boss.type].title}` : room.loot && !room.loot.taken ? 'Primero roba el botín' : 'Espera: el vehículo de extracción está llegando'); }
}

// ================= Horneado del mapa =================
// Suelos, muros y props se dibujan con detalle una vez por sala en lienzos; cada fotograma solo copia lo visible.
// Cada planta se hornea en su caja de casillas ocupadas (la primera planta es más pequeña: ahorra memoria)
const bakes = [], lampMask = [], sprites = { tree: [], bush: [] };
const lampQueue = []; // lámparas que cambiaron (rotas o con la sombra recalculada): su zona se rehornea
let BS = 1;
const LBS = 0.5; // escala de las capas de luz horneadas
const grainCv = document.createElement('canvas');
grainCv.width = grainCv.height = 128;
{ const g = grainCv.getContext('2d'); for (let i = 0; i < 2600; i++) { const v = Math.random() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${(0.03 + Math.random() * 0.05).toFixed(3)})`; g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random(), 1 + Math.random()); } }
const TALL = [0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0]; // proyectan oclusión sobre el suelo vecino
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
  g.globalCompositeOperation = 'source-atop'; // grano solo sobre lo pintado: rompe lo plano de cada superficie
  g.fillStyle = g.createPattern(grainCv, 'repeat'); g.fillRect(X0 * T, Y0 * T, (X1 - X0 + 1) * T, (Y1 - Y0 + 1) * T);
  g.globalCompositeOperation = 'source-over';
  if (z === 0 && room && room.puddles) for (const d of room.puddles) { // charcos: oscuros y brillantes; reflejan las farolas cercanas
    if (d.x < (X0 - 1) * T || d.x > (X1 + 2) * T || d.y < (Y0 - 1) * T || d.y > (Y1 + 2) * T) continue;
    const h = i => hash(Math.floor(d.seed * 1e6), i, 5), blob = () => { g.beginPath(); for (let i = 0; i < 4; i++) g.ellipse(d.x + (h(i) - 0.5) * d.rx * 0.8, d.y + (h(i + 4) - 0.5) * d.ry * 0.7, d.rx * (0.5 + h(i + 8) * 0.4), d.ry * (0.5 + h(i + 12) * 0.4), 0, 0, 7); };
    g.save(); blob(); g.clip();
    g.fillStyle = 'rgba(4,10,20,0.55)'; g.fillRect(d.x - d.rx * 1.5, d.y - d.ry * 1.5, d.rx * 3, d.ry * 3);
    for (const l of room.lamps) { const dd = Math.hypot(l.x - d.x, l.y - d.y); if (l.z === 0 && dd < 260) { g.fillStyle = glow(g, d.x + (l.x - d.x) * 0.15, d.y + (l.y - d.y) * 0.15, d.rx, l.rgb, 0.45 * (1 - dd / 260)); g.fillRect(d.x - d.rx * 1.5, d.y - d.ry * 1.5, d.rx * 3, d.ry * 3); } }
    g.fillStyle = 'rgba(200,220,240,0.12)'; g.fillRect(d.x - d.rx, d.y - d.ry * 0.6, d.rx * 1.2, 1.5);
    g.restore();
  }
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
  }
  // sombras proyectadas hacia abajo a la derecha, en dos capas: una corta, oscura y nítida al pie (contacto) y otra larga y
  // muy difuminada que se desvanece (penumbra); más largas cuanto más alto es el objeto y con un tinte azulado de noche
  // (una pasada difuminada por capa: difuminar cada casilla por separado haría muy lento el horneado)
  const near = new Path2D(), far = new Path2D(), leafN = new Path2D(), leafF = new Path2D();
  const extrude = (P, X, Y, o) => { P.moveTo(X + T, Y); P.lineTo(X + T + o, Y + o); P.lineTo(X + T + o, Y + T + o); P.lineTo(X + o, Y + T + o); P.lineTo(X, Y + T); P.lineTo(X + T, Y + T); P.closePath(); };
  const disc = (P, x, y, rx, ry = rx) => { P.moveTo(x + rx, y); P.ellipse(x, y, rx, ry, 0, 0, 7); };
  const prop = (X, Y, hgt) => { extrude(near, X, Y, hgt * 0.45); extrude(far, X, Y, hgt * 1.7); };
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
    const c = y * W + x, t = M[c], X = x * T, Y = y * T;
    if (t === SHELF || t === METAL || t === WALL || t === SECURE || t === RACK || t === VWALL) prop(X, Y, 16);
    else if (t === CRATE || t === DEPOSIT) prop(X, Y, 10);
    else if (t === LOW || t === BARRIER || t === TERMINAL) prop(X, Y, 6);
    else if (t === TREE && !zone[c] && z === 0) { // copa: sombra amplia y, dentro, manchas más oscuras de las ramas (luz moteada)
      for (const [dx, dy, r] of [[18, 22, 27], [6, 15, 18], [27, 13, 16], [13, 31, 16]]) disc(leafF, X + T / 2 + dx, Y + T / 2 + dy, r);
      for (let k = 0; k < 7; k++) disc(leafN, X + T / 2 + 6 + hash(x, y, k + 60) * 26, Y + T / 2 + 6 + hash(x, y, k + 70) * 28, 4 + hash(x, y, k + 80) * 7);
      disc(near, X + T / 2 + 4, Y + T / 2 + 5, 7); // el tronco
    }
    else if (t === BUSH) { disc(leafF, X + T / 2 + 9, Y + T / 2 + 11, 21, 16); disc(leafN, X + T / 2 + 5, Y + T / 2 + 6, 14, 10); }
    else if (t === TREE) disc(near, X + T / 2 + 6, Y + T / 2 + 8, 12);
  }
  g.save();
  if ('filter' in g) g.filter = 'blur(9px)';
  g.fillStyle = 'rgba(4,8,22,0.4)'; g.fill(far); g.fillStyle = 'rgba(4,10,18,0.45)'; g.fill(leafF);
  if ('filter' in g) g.filter = 'blur(2px)';
  g.fillStyle = 'rgba(2,4,12,0.5)'; g.fill(near); g.fillStyle = 'rgba(2,6,10,0.35)'; g.fill(leafN);
  g.restore();
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) drawTile(g, M, x, y, z);
  for (const l of room.lamps) if (l.z === z && l.x > (X0 - 1) * T && l.x < (X1 + 2) * T && l.y > (Y0 - 1) * T && l.y < (Y1 + 2) * T) drawFixture(g, l);
  brighten(g, bakes[z], x0, y0, x1, y1, 0.8);
  // color de las luces horneado sobre suelos y muros (sodio fuera, fluorescente o cálida dentro), con penumbra
  g.globalCompositeOperation = 'lighter';
  if ('filter' in g) g.filter = 'blur(2px)';
  for (const l of room.lamps) {
    if (!l.on || l.z !== z || l.x + l.r < x0 * T || l.x - l.r > (x1 + 1) * T || l.y + l.r < y0 * T || l.y - l.r > (y1 + 1) * T) continue;
    g.fillStyle = glow(g, l.x, l.y, l.r, l.rgb, 0.24); fillPoly(g, l.poly);
  }
  g.globalCompositeOperation = 'source-over'; if ('filter' in g) g.filter = 'none';
  for (const d of room.decals) if (d.z === z && d.x > (x0 - 1) * T && d.x < (x1 + 2) * T && d.y > (y0 - 1) * T && d.y < (y1 + 2) * T) drawDecal(g, d);
  g.restore(); // también deshace el recorte
}
function drawFloor(g, x, y, k, z) {
  const X = x * T, Y = y * T, h = hash(x, y, 7);
  if (k === 12) { // moqueta de casino: roja con rombos dorados
    g.fillStyle = '#3a0f16'; g.fillRect(X, Y, T, T);
    g.fillStyle = 'rgba(201,166,74,0.35)'; for (const [dx, dy] of [[10, 10], [30, 30], [30, 10], [10, 30]]) { g.beginPath(); g.moveTo(X + dx, Y + dy - 4); g.lineTo(X + dx + 4, Y + dy); g.lineTo(X + dx, Y + dy + 4); g.lineTo(X + dx - 4, Y + dy); g.fill(); }
    return;
  }
  if (k === 13 || k === 17) { // grava de la playa de vías; en la vía, traviesas y raíles
    g.fillStyle = '#23211e'; g.fillRect(X, Y, T, T);
    for (let i = 0; i < 12; i++) { g.fillStyle = hash(x, y, i) < 0.5 ? '#2e2b27' : '#181614'; g.fillRect(X + hash(x, y, i + 31) * T, Y + hash(x, y, i + 57) * T, 2, 2); }
    if (k === 13) { g.fillStyle = '#3a2a1c'; for (let i = 0; i < 4; i++) g.fillRect(X + i * 10 + 2, Y + 4, 5, T - 8); g.fillStyle = '#7a7f86'; g.fillRect(X, Y + 9, T, 3); g.fillRect(X, Y + T - 12, T, 3); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(X, Y + 9, T, 1); g.fillRect(X, Y + T - 12, T, 1); }
    return;
  }
  if (k === 14) { // agua del puerto: oscura, con reflejos que cambian por casilla
    g.fillStyle = '#081420'; g.fillRect(X, Y, T, T);
    g.strokeStyle = 'rgba(120,170,210,0.18)'; g.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { const yy = Y + 6 + hash(x, y, i) * 28, xx = X + hash(x, y, i + 9) * 24; g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + 6, yy - 2, xx + 12, yy); g.stroke(); }
    return;
  }
  if (k === 15) { // cubierta de teca: tablas con juntas
    g.fillStyle = '#6a4a2e'; g.fillRect(X, Y, T, T);
    g.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 5; i++) g.fillRect(X, Y + i * 8 + 7, T, 1);
    g.fillStyle = 'rgba(255,220,170,0.06)'; g.fillRect(X + (hash(x, y, 2) * 30 | 0), Y, 10, T);
    return;
  }
  if (k === 16) { // madera oscura y pulida de la joyería
    g.fillStyle = '#24170f'; g.fillRect(X, Y, T, T);
    g.fillStyle = 'rgba(255,200,140,0.05)'; g.fillRect(X, Y, T, T / 2);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(X + (y % 2 ? 20 : 0), Y, 1, T); g.fillRect(X, Y + T - 1, T, 1);
    return;
  }
  if (k === 11) { // calzada
    g.fillStyle = '#121519'; g.fillRect(X, Y, T, T);
    for (let i = 0; i < 8; i++) { g.fillStyle = hash(x, y, i) < 0.5 ? '#1a1e24' : '#0c0f12'; g.fillRect(X + hash(x, y, i + 31) * T, Y + hash(x, y, i + 57) * T, 1.5, 1.5); }
    if (y === H - 5 && x % 2) { g.fillStyle = 'rgba(230,220,170,0.55)'; g.fillRect(X + 4, Y + T - 1.5, T - 8, 3); } // línea discontinua
    if (y === H - 6) { g.fillStyle = '#3a3f46'; g.fillRect(X, Y, T, 3); } if (y === H - 3) { g.fillStyle = '#3a3f46'; g.fillRect(X, Y + T - 3, T, 3); } // bordillos
    return;
  }
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
  } else if (k === 8) { // mármol con vetas
    g.fillStyle = (x + y) % 2 ? '#2c2f35' : '#292c32'; g.fillRect(X, Y, T, T);
    g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X, Y + hash(x, y, 1) * T); g.quadraticCurveTo(X + T / 2, Y + hash(x, y, 2) * T, X + T, Y + hash(x, y, 3) * T); g.stroke();
    g.fillStyle = '#1c1e22'; g.fillRect(X, Y, T, 1); g.fillRect(X, Y, 1, T);
  } else if (k === 9) { // suelo técnico: losas con rejilla de ventilación
    g.fillStyle = '#12161b'; g.fillRect(X, Y, T, T);
    for (let q = 0; q < 4; q++) { const sx = X + (q & 1) * 20, sy = Y + (q >> 1) * 20; g.fillStyle = '#262c34'; g.fillRect(sx + 1, sy + 1, 18, 18); if (hash(x * 2 + (q & 1), y * 2 + (q >> 1), 4) < 0.3) { g.fillStyle = '#161a20'; for (let i = 3; i < 18; i += 4) for (let j = 3; j < 18; j += 4) g.fillRect(sx + i, sy + j, 1.5, 1.5); } }
  } else if (k === 10) { // chapa de acero estriada (cámara)
    g.fillStyle = '#2b3036'; g.fillRect(X, Y, T, T);
    g.fillStyle = '#383e46'; for (let i = 2; i < T; i += 8) for (let j = (i / 8) % 2 ? 6 : 2; j < T; j += 8) { g.save(); g.translate(X + j, Y + i); g.rotate(((i + j) / 8) % 2 ? 0.7 : -0.7); g.fillRect(-2.5, -0.7, 5, 1.4); g.restore(); }
  } else if (k === 5) { // moqueta
    g.fillStyle = '#1c2130'; g.fillRect(X, Y, T, T); dots(16, '#232a3b', '#171b27', 1);
  } else { // hormigón con manchas y juntas
    g.fillStyle = '#1d2024'; g.fillRect(X, Y, T, T); dots(6, '#23272c', '#17191c', 2);
    if (h < 0.25) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.arc(X + hash(x, y, 2) * T, Y + hash(x, y, 9) * T, 6 + h * 30, 0, 7); g.fill(); }
    g.fillStyle = '#15171a'; if (x % 2 === 0) g.fillRect(X, Y, 1, T); if (y % 2 === 0) g.fillRect(X, Y, T, 1);
  }
}
// Soportes de las lámparas, en perspectiva: lo vertical sube hacia la parte de arriba de la pantalla
function drawFixture(g, l) {
  const { x, y } = l;
  g.lineCap = 'round';
  if (l.kind === 'street') { // farola: zapata en la acera, poste y brazo con la luminaria
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x + 9, y + 3, 13, 4, 0.25, 0, 7); g.fill();
    g.fillStyle = '#3a3e45'; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
    g.fillStyle = '#4e545c'; g.beginPath(); g.arc(x - 1, y - 1, 3, 0, 7); g.fill();
    g.strokeStyle = '#2b2f35'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 28); g.lineTo(x + 6, y - 30); g.stroke();
    g.strokeStyle = '#5b626c'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 1, y - 2); g.lineTo(x - 1, y - 27); g.stroke();
    g.fillStyle = '#22262b'; g.fillRect(x + 1, y - 33, 11, 5);
  } else if (l.kind === 'floor') { // lámpara de pie: base, varilla y pantalla
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x + 5, y + 3, 9, 3, 0, 0, 7); g.fill();
    g.fillStyle = '#2b2a30'; g.beginPath(); g.ellipse(x, y, 6, 3.5, 0, 0, 7); g.fill();
    g.strokeStyle = '#8a7f6a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 18); g.stroke();
    g.fillStyle = '#b9a77e'; g.beginPath(); g.moveTo(x - 7, y - 17); g.lineTo(x + 7, y - 17); g.lineTo(x + 5, y - 26); g.lineTo(x - 5, y - 26); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x - 7, y - 18, 14, 2);
  } else { // tubo fluorescente atornillado a la pared
    const n = l.kind === 'wallN';
    g.fillStyle = '#2e333b'; g.fillRect(x - 14, n ? y - 5 : y + 1, 28, 4);
    g.fillStyle = '#7d8691'; g.fillRect(x - 12, n ? y - 2 : y, 24, 2);
  }
}
// ---- Personas vistas desde arriba: piernas que se mueven al andar, brazos sujetando el arma, chaleco y casco o gorra
const LOOK = {
  guard:  { body: '#34466a', trim: '#1f2a40', legs: '#1d222d', head: 'cap',    hat: '#1b2335', gun: [14, 4.5] },
  heavy:  { body: '#465238', trim: '#2b3324', legs: '#252a20', head: 'helmet', hat: '#38422e', gun: [19, 6], pads: true },
  elite:  { body: '#202329', trim: '#c9a64a', legs: '#141619', head: 'mask',   hat: '#111214', gun: [20, 5] },
  sniper: { body: '#4f5e3c', trim: '#36412a', legs: '#2d3424', head: 'hood',   hat: '#43512f', gun: [28, 4.5] },
  shield: { body: '#28344a', trim: '#141a24', legs: '#191e27', head: 'visor',  hat: '#1c2430', gun: [10, 4] },
  boss:   { body: '#5e2020', trim: '#2a0f0f', legs: '#1c1414', head: 'helmet', hat: '#2c2c2e', gun: [27, 9], pads: true },
  player: { body: '#24473f', trim: '#173029', legs: '#18211f', head: 'beanie', hat: '#14191b' },
  police: { body: '#2b55a8', trim: '#183066', legs: '#141c33', head: 'police', hat: '#15214a', gun: [12, 4.5], star: true },
  taser:  { body: '#34466a', trim: '#c9a64a', legs: '#1d222d', head: 'cap', hat: '#1b2335', gun: [9, 5] },
  coronel: { body: '#3f4a30', trim: '#232b1a', legs: '#1c2016', head: 'helmet', hat: '#2a3320', gun: [24, 8], pads: true },
  viuda:  { body: '#1c1218', trim: '#7a1a2a', legs: '#120c10', head: 'hood', hat: '#1a1016', gun: [32, 4] },
  swatp:  { body: '#1e2a45', trim: '#0f1629', legs: '#0e1322', head: 'helmet', hat: '#162038', gun: [20, 5], star: true, pads: true },
};
// civiles: ropa de calle o de oficina, sin arma; pelo en vez de gorra
const CIV_LOOKS = [
  { body: '#6b4a3a', trim: '#4a3226', legs: '#23262c', head: 'hair', hat: '#2a1a12' }, { body: '#3a5a7a', trim: '#e8e4da', legs: '#1f2430', head: 'hair', hat: '#121212' },
  { body: '#7a2f3a', trim: '#5a1f28', legs: '#2a2a30', head: 'hair', hat: '#8a6a3a' }, { body: '#4a6a4a', trim: '#2f4a2f', legs: '#3a3020', head: 'hair', hat: '#3a2a1a' },
  { body: '#8a8a90', trim: '#d9d4c8', legs: '#25272c', head: 'hair', hat: '#5a5a5a' }, { body: '#c9a64a', trim: '#8a6a2a', legs: '#2a2a30', head: 'hair', hat: '#1a1210' },
];
const SKIN = ['#c99a78', '#8d5e3f', '#e3bc98', '#6b4430'];
function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
function drawHead(c, r, L, skin) {
  const R = r * 0.42;
  c.fillStyle = skin; c.beginPath(); c.arc(r * 0.06, 0, R, 0, 7); c.fill();
  c.fillStyle = L.hat;
  if (L.head === 'cap') { c.beginPath(); c.arc(r * 0.02, 0, R * 0.98, Math.PI * 0.45, Math.PI * 1.55); c.fill(); c.beginPath(); c.ellipse(r * 0.34, 0, R * 0.55, R * 0.82, 0, -Math.PI / 2, Math.PI / 2); c.fill(); }
  else if (L.head === 'helmet' || L.head === 'visor') {
    c.beginPath(); c.arc(r * 0.04, 0, R * 1.12, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.13)'; c.lineWidth = 1.4; c.beginPath(); c.arc(r * 0.04, 0, R * 0.75, Math.PI * 0.9, Math.PI * 1.5); c.stroke();
    if (L.head === 'visor') { c.fillStyle = 'rgba(150,190,230,0.55)'; c.beginPath(); c.arc(r * 0.04, 0, R * 1.12, -0.9, 0.9); c.lineTo(r * 0.04 + R * 0.5, 0); c.fill(); }
  } else if (L.head === 'mask') { c.beginPath(); c.arc(r * 0.06, 0, R, 0, 7); c.fill(); c.fillStyle = skin; c.fillRect(r * 0.06 + R * 0.45, -R * 0.55, R * 0.4, R * 1.1); }
  else if (L.head === 'hood') { c.beginPath(); c.arc(r * 0.02, 0, R * 1.22, Math.PI * 0.3, Math.PI * 1.7); c.fill(); for (let i = 0; i < 6; i++) { const t = Math.PI * (0.4 + i * 0.25); c.fillRect(Math.cos(t) * R * 1.2 - 1, Math.sin(t) * R * 1.2 - 1, 2.5, 2.5); } }
  else if (L.head === 'police') { c.beginPath(); c.arc(r * 0.02, 0, R * 1.05, 0, 7); c.fill(); c.fillStyle = '#0c1226'; c.beginPath(); c.ellipse(r * 0.38, 0, R * 0.5, R * 0.9, 0, -Math.PI / 2, Math.PI / 2); c.fill(); c.fillStyle = '#e8c45a'; c.beginPath(); c.arc(r * 0.24, 0, R * 0.22, 0, 7); c.fill(); }
  else if (L.head === 'hair') { c.beginPath(); c.arc(r * 0.0, 0, R * 1.02, Math.PI * 0.55, Math.PI * 1.45); c.fill(); }
  else if (L.head === 'beanie') { c.beginPath(); c.arc(r * 0.02, 0, R * 1.02, Math.PI * 0.42, Math.PI * 1.58); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1.5; c.beginPath(); c.arc(r * 0.02, 0, R * 0.8, Math.PI * 0.55, Math.PI * 1.45); c.stroke(); }
  if (L.mask && L.mask !== 'ninguna') { // máscara sobre la cara (la mitad de delante, vista desde arriba)
    const fx = r * 0.06, face = col => { c.fillStyle = col; c.beginPath(); c.arc(fx, 0, R * 1.04, -Math.PI / 2, Math.PI / 2); c.fill(); };
    if (L.mask === 'pasamontanas') { c.fillStyle = '#121316'; c.beginPath(); c.arc(fx, 0, R * 1.06, 0, 7); c.fill(); c.fillStyle = skin; c.fillRect(fx + R * 0.45, -R * 0.55, R * 0.35, R * 1.1); }
    else if (L.mask === 'hockey') { face('#e8e6de'); c.fillStyle = '#2a2a2a'; for (const [dx, dy] of [[0.5, -0.35], [0.5, 0.35], [0.75, 0], [0.3, 0]]) { c.beginPath(); c.arc(fx + R * dx, R * dy, R * 0.09, 0, 7); c.fill(); } }
    else if (L.mask === 'calavera') { face('#ded8c8'); c.fillStyle = '#151515'; for (const dy of [-0.38, 0.38]) { c.beginPath(); c.arc(fx + R * 0.45, R * dy, R * 0.2, 0, 7); c.fill(); } c.fillRect(fx + R * 0.75, -R * 0.08, R * 0.2, R * 0.16); }
    else if (L.mask === 'payaso') { face('#f2efe8'); c.fillStyle = '#e04a2a'; c.beginPath(); c.arc(fx + R * 0.95, 0, R * 0.2, 0, 7); c.fill(); c.fillStyle = '#ff8a2a'; for (const dy of [-1, 1]) { c.beginPath(); c.arc(fx - R * 0.2, dy * R * 0.95, R * 0.35, 0, 7); c.fill(); } }
  }
  c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1.2; c.beginPath(); c.arc(r * 0.05, 0, R * (L.head === 'helmet' || L.head === 'visor' ? 1.12 : L.head === 'hood' ? 1.22 : 1), 0, 7); c.stroke();
}
// o: { gun: [largo, ancho], walk: fase de la zancada, mv: 0-1 cuánto anda, skin, hurt, silenced, shield }
function drawHuman(c, x, y, a, r, L, o) {
  const sw = Math.sin(o.walk || 0) * (o.mv || 0), g = o.gun;
  c.save(); c.translate(x, y); c.rotate(a);
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(3, 4, r * 0.9, r * 1.08, 0, 0, 7); c.fill();
  for (const sd of [-1, 1]) { // piernas: una adelante y otra atrás al andar
    const lx = sw * sd * r * 0.75;
    c.fillStyle = L.legs; rrect(c, lx - r * 0.34, sd * r * 0.44 - r * 0.21, r * 0.68, r * 0.42, r * 0.2); c.fill();
    c.fillStyle = '#0f1012'; rrect(c, lx + r * 0.12, sd * r * 0.44 - r * 0.19, r * 0.24, r * 0.38, r * 0.12); c.fill(); // bota
  }
  if (g) { // arma por debajo de las manos
    c.fillStyle = o.gunCol || '#1b1f24'; c.fillRect(r * 0.55, -g[1] / 2 + r * 0.05, g[0], g[1]);
    c.fillStyle = '#3a414c'; c.fillRect(r * 0.55, -g[1] / 2 + r * 0.05, g[0], 1.2);
    if (o.silenced) { c.fillStyle = '#121519'; c.fillRect(r * 0.55 + g[0], -g[1] / 2 + r * 0.05 + 0.5, 6, g[1] - 1); }
  }
  const hand = o.tied ? [[-r * 0.55, r * 0.2], [-r * 0.55, -r * 0.2]] : o.phone ? [[r * 0.2, r * 0.42], [r * 0.25 + sw * r * 0.5, -r * 0.8]] : g ? [[r * 0.72, r * 0.16], [r * 0.55 + Math.min(g[0], 18) * 0.62, -r * 0.02 + r * 0.05]] : [[r * 0.25 - sw * r * 0.5, r * 0.8], [r * 0.25 + sw * r * 0.5, -r * 0.8]];
  c.lineCap = 'round'; c.strokeStyle = L.body; c.lineWidth = r * 0.38; // brazos
  c.beginPath(); c.moveTo(0, r * 0.62); c.lineTo(hand[0][0], hand[0][1]); c.moveTo(0, -r * 0.62); c.lineTo(hand[1][0], hand[1][1]); c.stroke();
  c.fillStyle = o.skin; for (const [hx, hy] of hand) { c.beginPath(); c.arc(hx, hy, r * 0.17, 0, 7); c.fill(); }
  if (o.phone) { c.fillStyle = '#9fd0ff'; c.fillRect(r * 0.12, r * 0.22, r * 0.2, r * 0.32); } // pantalla del móvil
  if (o.tied) { c.strokeStyle = '#d9c9a0'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-r * 0.55, r * 0.3); c.lineTo(-r * 0.55, -r * 0.3); c.stroke(); } // bridas
  // torso con chaleco, hombreras y un brillo arriba a la izquierda
  c.fillStyle = o.hurt ? '#ff8f80' : L.body; c.beginPath(); c.ellipse(-r * 0.05, 0, r * 0.56, r * 0.95, 0, 0, 7); c.fill();
  c.fillStyle = L.trim; rrect(c, -r * 0.32, -r * 0.55, r * 0.58, r * 1.1, r * 0.2); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(-r * 0.05, -r * 0.42, r * 0.22, r * 0.3); c.fillRect(-r * 0.05, r * 0.12, r * 0.22, r * 0.3); // bolsillos
  if (L.pads) { c.fillStyle = L.trim; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(-r * 0.05, sd * r * 0.8, r * 0.3, r * 0.24, 0, 0, 7); c.fill(); } }
  if (L.star) { // placa dorada de policía
    c.fillStyle = '#e8c45a'; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.09 : r * 0.22; c.lineTo(r * 0.12 + Math.cos(a) * rr, -r * 0.42 + Math.sin(a) * rr); }
    c.closePath(); c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,0.09)'; c.beginPath(); c.ellipse(-r * 0.2, -r * 0.35, r * 0.28, r * 0.42, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(-r * 0.05, 0, r * 0.56, r * 0.95, 0, 0, 7); c.stroke();
  drawHead(c, r, L, o.skin);
  if (o.shield) { c.fillStyle = 'rgba(160,180,207,0.85)'; rrect(c, r * 0.95, -r * 1.25, 6, r * 2.5, 3); c.fill(); c.fillStyle = 'rgba(30,40,55,0.8)'; c.fillRect(r * 0.95 + 1.5, -r * 0.35, 3, r * 0.7); }
  c.restore();
}
function drawDog(c, x, y, a, r, walk, mv) {
  const sw = Math.sin(walk) * mv;
  c.save(); c.translate(x, y); c.rotate(a);
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(3, 4, r * 1.6, r * 0.8, 0, 0, 7); c.fill();
  c.fillStyle = '#2a1e14';
  for (const [lx, sd] of [[r * 0.8, -1], [r * 0.8, 1], [-r * 0.8, -1], [-r * 0.8, 1]]) { c.beginPath(); c.ellipse(lx + sw * sd * (lx > 0 ? 1 : -1) * r * 0.45, sd * r * 0.55, r * 0.3, r * 0.17, 0, 0, 7); c.fill(); }
  c.strokeStyle = '#5a4230'; c.lineWidth = r * 0.22; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 1.3, 0); c.quadraticCurveTo(-r * 1.8, Math.sin(walk * 2) * r * 0.5, -r * 2.1, Math.sin(walk * 2 + 1) * r * 0.6); c.stroke(); // cola
  c.fillStyle = '#6b4f35'; c.beginPath(); c.ellipse(0, 0, r * 1.35, r * 0.62, 0, 0, 7); c.fill();
  c.fillStyle = '#3d2c1e'; c.beginPath(); c.ellipse(-r * 0.1, 0, r * 1.05, r * 0.28, 0, 0, 7); c.fill(); // lomo
  c.fillStyle = '#8a2a22'; c.fillRect(r * 0.95, -r * 0.42, r * 0.18, r * 0.84); // collar
  c.fillStyle = '#6b4f35'; c.beginPath(); c.arc(r * 1.4, 0, r * 0.52, 0, 7); c.fill();
  c.fillStyle = '#4a3624'; c.beginPath(); c.ellipse(r * 1.95, 0, r * 0.36, r * 0.26, 0, 0, 7); c.fill(); // hocico
  c.fillStyle = '#111'; c.beginPath(); c.arc(r * 2.25, 0, r * 0.11, 0, 7); c.fill();
  c.fillStyle = '#3d2c1e'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(r * 1.2, sd * r * 0.25); c.lineTo(r * 1.05, sd * r * 0.75); c.lineTo(r * 1.45, sd * r * 0.45); c.fill(); } // orejas
  c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1.3; c.beginPath(); c.ellipse(0, 0, r * 1.35, r * 0.62, 0, 0, 7); c.stroke();
  c.restore();
}
// Cadáver tendido: brazos y piernas abiertos (según su semilla), el arma caída al lado y un charco que se extiende
function drawDrone(c, x, y, a, broken) { // dron: cuatro rotores, cuerpo con cámara y luces (de lado, roto en el suelo)
  c.save(); c.translate(x, y); c.rotate(a);
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(6, 10, 14, 10, 0, 0, 7); c.fill(); // sombra: vuela
  c.strokeStyle = '#2a2f36'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-9, -9); c.lineTo(9, 9); c.moveTo(-9, 9); c.lineTo(9, -9); c.stroke();
  for (const [dx, dy] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) {
    c.fillStyle = broken ? 'rgba(60,64,70,0.9)' : `rgba(170,180,190,${(0.25 + 0.15 * Math.sin(room.time * 50 + dx)).toFixed(3)})`; c.beginPath(); c.arc(dx, dy, broken ? 3 : 7, 0, 7); c.fill();
  }
  c.fillStyle = '#3a414a'; c.fillRect(-6, -5, 12, 10); c.fillStyle = '#0a0c0e'; c.beginPath(); c.arc(6, 0, 2.5, 0, 7); c.fill();
  if (!broken) { c.fillStyle = Math.sin(room.time * 8) > 0 ? '#ff3a3a' : '#3a0d0d'; c.fillRect(-7, -1, 2, 2); }
  c.restore();
}
function drawCorpse(c, b) {
  if (b.type === 'drone') { drawDrone(c, b.x, b.y, b.a, true); return; }
  const L = b.look || LOOK[b.type], r = FOES[b.type].r, k = Math.min(1, (b.t || 0) / 6), h = i => hash(Math.floor(b.seed * 1e6), i, 7);
  c.save(); c.translate(b.x, b.y); c.rotate(b.a);
  const pr = (b.type === 'dog' ? 12 : 19) * (0.35 + 0.65 * k); // charco
  c.fillStyle = 'rgba(62,3,5,0.92)';
  for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-r * 0.2 + (h(i) - 0.5) * pr, (h(i + 9) - 0.5) * pr * 1.1, pr * (0.45 + h(i + 20) * 0.4), 0, 7); c.fill(); }
  c.fillStyle = 'rgba(45,3,5,0.6)'; c.beginPath(); c.arc(-r * 0.1, 0, pr * 0.5, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,190,190,0.13)'; c.beginPath(); c.ellipse(-r * 0.4, -pr * 0.3, pr * 0.3, pr * 0.12, -0.5, 0, 7); c.fill(); // brillo
  if (b.type === 'dog') { c.rotate(Math.PI / 2 * (h(1) < 0.5 ? 1 : -1) * 0.3); drawDog(c, 0, 0, 0, r, 0, 0); c.restore(); return; }
  c.lineCap = 'round';
  const limb = (x0, y0, ang, len, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len); c.stroke(); return [x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len]; };
  limb(-r * 0.5, -r * 0.35, Math.PI + 0.15 + h(2) * 0.5, r * 1.15, r * 0.42, L.legs); limb(-r * 0.5, r * 0.35, Math.PI - 0.15 - h(3) * 0.5, r * 1.15, r * 0.42, L.legs);
  const skin = SKIN[Math.floor(h(4) * SKIN.length)];
  for (const sd of [-1, 1]) { const e = limb(r * 0.25, sd * r * 0.7, sd * (0.6 + h(5 + sd) * 1.6), r * 0.95, r * 0.36, L.body); c.fillStyle = skin; c.beginPath(); c.arc(e[0], e[1], r * 0.17, 0, 7); c.fill(); }
  c.fillStyle = L.body; c.beginPath(); c.ellipse(0, 0, r * 0.62, r * 0.92, 0, 0, 7); c.fill();
  c.fillStyle = L.trim; rrect(c, -r * 0.4, -r * 0.5, r * 0.75, r * 1.0, r * 0.2); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(0, 0, r * 0.62, r * 0.92, 0, 0, 7); c.stroke();
  c.save(); c.translate(r * 0.62, (h(8) - 0.5) * r * 0.4); drawHead(c, r, L, skin); c.restore();
  if (L.gun && !b.looted) { c.save(); c.translate(r * (0.3 + h(10)), r * (1.3 + h(11) * 0.5) * (h(12) < 0.5 ? -1 : 1)); c.rotate(h(13) * 6.3); c.fillStyle = '#1b1f24'; c.fillRect(-L.gun[0] / 2, -L.gun[1] / 2, L.gun[0], L.gun[1]); c.restore(); }
  c.restore();
}
const CAR_DIM = { van: [34, 64], sedan: [28, 54], suv: [32, 58], armored: [38, 68] };
function carPath(c, w, h, r) { c.beginPath(); c.moveTo(-w / 2 + r, -h / 2); c.lineTo(w / 2 - r, -h / 2); c.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); c.lineTo(w / 2, h / 2 - r); c.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); c.lineTo(-w / 2 + r, h / 2); c.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); c.lineTo(-w / 2, -h / 2 + r); c.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); c.closePath(); }
// Vehículo de huida visto desde arriba, morro hacia arriba: furgoneta, berlina, todoterreno o furgón blindado
function drawCar(c, kind, x, y, a = 0, paint) {
  const [w, h] = CAR_DIM[kind], col = paint || { van: '#bdb8aa', sedan: '#2a3a52', suv: '#1f2b23', armored: '#3a3f36' }[kind];
  c.save(); c.translate(x, y); c.rotate(a);
  c.fillStyle = 'rgba(0,0,0,0.45)'; carPath(c, w, h, 7); c.save(); c.translate(5, 7); c.fill(); c.restore();
  c.fillStyle = '#111'; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.fillRect(sx * w / 2 - (sx > 0 ? 2 : 3), sy * h * 0.3 - 6, 5, 12); // ruedas
  c.fillStyle = col; carPath(c, w, h, kind === 'armored' ? 4 : 8); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(-w / 2 + 2, -h / 2 + 6, 2, h - 12);
  if (kind === 'van') { c.fillStyle = '#a7a294'; c.fillRect(-w / 2 + 3, -h / 2 + 18, w - 6, h - 22); c.fillStyle = '#8a3a2e'; c.fillRect(-w / 2, 4, w, 3); }
  else if (kind === 'armored') { c.fillStyle = '#2c3029'; c.fillRect(-w / 2 + 4, -h / 2 + 20, w - 8, h - 26); c.fillStyle = '#4f5548'; for (let i = 0; i < 4; i++) c.fillRect(-w / 2 + 6, -h / 2 + 24 + i * 9, w - 12, 2); c.fillStyle = '#1a1d18'; for (let i = 0; i < 5; i++) c.fillRect(-w / 2 + 6 + i * (w - 12) / 5, -h / 2 + 2, 2, 5); }
  else { c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-w / 2 + 4, -h / 2 + 18, w - 8, h * 0.42); if (kind === 'suv') { c.fillStyle = '#3c473f'; for (let i = 0; i < 3; i++) c.fillRect(-w / 2 + 6, -h / 2 + 22 + i * 7, w - 12, 1.5); } }
  c.fillStyle = '#6f8fae'; c.beginPath(); c.moveTo(-w / 2 + 4, -h / 2 + 16); c.lineTo(w / 2 - 4, -h / 2 + 16); c.lineTo(w / 2 - 6, -h / 2 + 9); c.lineTo(-w / 2 + 6, -h / 2 + 9); c.closePath(); c.fill(); // parabrisas
  c.fillStyle = 'rgba(111,143,174,0.8)'; c.fillRect(-w / 2 + 6, h / 2 - 9, w - 12, 4); // luna trasera
  c.fillStyle = col; c.fillRect(-w / 2 - 3, -h / 2 + 15, 3, 4); c.fillRect(w / 2, -h / 2 + 15, 3, 4); // retrovisores
  c.restore();
}
function carLights(c, kind, x, y, on, a = 0) { // faros (con haz) y pilotos
  const [w, h] = CAR_DIM[kind];
  c.save(); c.translate(x, y); c.rotate(a);
  for (const sx of [-1, 1]) {
    c.fillStyle = on ? 'rgba(255,248,220,0.95)' : 'rgba(120,120,110,0.6)'; c.fillRect(sx * (w / 2 - 6) - 3, -h / 2, 6, 2.5);
    c.fillStyle = on ? 'rgba(255,40,30,0.9)' : 'rgba(90,20,20,0.6)'; c.fillRect(sx * (w / 2 - 6) - 3, h / 2 - 2.5, 6, 2.5);
    if (!on) continue;
    const g = c.createRadialGradient(sx * (w / 2 - 6), -h / 2, 0, sx * (w / 2 - 6), -h / 2 - 90, 100);
    g.addColorStop(0, 'rgba(255,245,210,0.35)'); g.addColorStop(1, 'rgba(255,245,210,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(sx * (w / 2 - 6), -h / 2); c.lineTo(sx * (w / 2 - 6) - 28, -h / 2 - 110); c.lineTo(sx * (w / 2 - 6) + 28, -h / 2 - 110); c.closePath(); c.fill();
  }
  c.restore();
}
const GUN_SHAPE = { pistol: [9, 4], revolver: [12, 4.5], smg: [14, 5], smgs: [15, 5], shotgun: [19, 6], autosg: [19, 7], crossbow: [15, 4], rifle: [21, 5], dmr: [25, 4.5], lmg: [23, 7.5], mpistol: [11, 4.5], burst: [19, 5], gl: [18, 8], amr: [30, 5.5] }; // [largo, ancho] del arma en la mano
const CAR_COLORS = ['#3b2a2f', '#2b3848', '#3d3e44', '#43392a', '#24383b', '#4a4d52'];
function drawTile(g, M, x, y, z) {
  const c = y * W + x, t = M[c], X = x * T, Y = y * T;
  const tall = v => v === WALL || v === GLASS || v === VWALL || v === SECURE;
  if (t === SECURE) { // puerta de seguridad: placa de acero, bandas de peligro y volante
    const vert = M[c - W] === SECURE || M[c + W] === SECURE, first = vert ? M[c + W] === SECURE : M[c + 1] === SECURE;
    g.fillStyle = '#4c545e'; g.fillRect(X, Y, T, T);
    g.fillStyle = '#5d6672'; g.fillRect(X + 3, Y + 3, T - 6, T - 6);
    g.save(); g.beginPath(); g.rect(X, Y, T, T); g.clip(); g.fillStyle = 'rgba(214,170,40,0.75)';
    for (let i = -T; i < T * 2; i += 10) { g.beginPath(); g.moveTo(X + i, Y); g.lineTo(X + i + 5, Y); g.lineTo(X + i + 5 - 6, Y + 6); g.lineTo(X + i - 6, Y + 6); g.closePath(); g.fill(); }
    g.restore();
    g.strokeStyle = '#2b3036'; g.lineWidth = 3;
    const wx = vert ? X + T / 2 : first ? X + T : X, wy = vert ? (first ? Y + T : Y) : Y + T / 2; // el volante, centrado entre las dos hojas
    g.save(); g.beginPath(); g.rect(X, Y, T, T); g.clip(); g.beginPath(); g.arc(wx, wy, 11, 0, 7); g.stroke(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(a) * 15, wy + Math.sin(a) * 15); g.stroke(); } g.restore();
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(X, Y + T - 4, T, 4);
  } else if (t === WALL || t === GLASS || t === VWALL) {
    const fence = border(x, y);
    const facade = z === 0 && !fence && [c - 1, c + 1, c - W, c + W].some(n => !BLOCK_WALK[M[n]] && !zone[n]);
    const steel = t === VWALL, hull = t === WALL && fks[z][c] === 15; // casco blanco del yate
    const top = hull ? '#cfd4da' : fence ? '#1c2128' : steel ? '#3a434e' : facade ? '#3b3431' : '#2d3745', face = hull ? '#8f97a0' : fence ? '#121519' : steel ? '#232930' : facade ? '#271f1d' : '#1b222c';
    g.fillStyle = top; g.fillRect(X, Y, T, T);
    if (facade && t === WALL && !hull) { // ladrillo visto
      g.fillStyle = 'rgba(0,0,0,0.2)';
      for (let r = 0; r < T; r += 8) { g.fillRect(X, Y + r, T, 1); for (let j = (r / 8) % 2 ? 8 : 0; j < T; j += 16) g.fillRect(X + j, Y + r, 1, 8); }
    } else if (steel) { // muro blindado: placas remachadas
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X + T / 2, Y, 1, T); g.fillRect(X, Y + T / 2, T, 1);
      g.fillStyle = '#5a646f'; for (const [dx, dy] of [[4, 4], [T - 6, 4], [4, T - 18], [T - 6, T - 18]]) g.fillRect(X + dx, Y + dy, 2, 2);
    } else if (!fence) { g.fillStyle = 'rgba(255,255,255,0.035)'; g.fillRect(X + 4, Y + 5, T - 8, 1); }
    if (!tall(M[c - W])) { g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(X, Y, T, 2); }
    if (!tall(M[c - 1])) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(X, Y, 2, T); }
    if (!tall(M[c + 1])) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X + T - 2, Y, 2, T); }
    if (!tall(M[c + W])) { g.fillStyle = face; g.fillRect(X, Y + T - 11, T, 11); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(X, Y + T - 11, T, 1); } // cara frontal: da altura
    if (t === WALL && !BLOCK_WALK[M[c + W]] && fks[z][c + W] === 8 && hash(x, y, 21) < 0.45) { // cuadro colgado en la galería
      const pal = [['#7a2f2a', '#d9a441'], ['#2a4a6a', '#c9d6df'], ['#3d5a3a', '#e0c07a'], ['#5a3a6a', '#e8a0a0']][Math.floor(hash(x, y, 22) * 4)];
      g.fillStyle = '#b39a52'; g.fillRect(X + 7, Y + T - 18, 26, 16);
      g.fillStyle = pal[0]; g.fillRect(X + 9, Y + T - 16, 22, 12);
      g.fillStyle = pal[1]; g.beginPath(); g.arc(X + 14 + hash(x, y, 23) * 12, Y + T - 10, 3 + hash(x, y, 24) * 3, 0, 7); g.fill();
    }
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
  } else if (t === LOW && fks[z][c] === 16) { // vitrina de joyería: base de terciopelo, cristal y piezas que brillan
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(X + 4, Y + 6, T - 4, T - 6);
    g.fillStyle = '#3a1418'; g.fillRect(X + 3, Y + 4, T - 6, T - 8);
    g.fillStyle = '#e8c45a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(X + 9 + (i % 2) * 20 + hash(x, y, i) * 4, Y + 13 + (i >> 1) * 14, 2.6, 0, 7); g.fill(); }
    g.fillStyle = '#bfe6ff'; g.beginPath(); g.arc(X + 20, Y + 20, 2.4, 0, 7); g.fill();
    g.fillStyle = 'rgba(180,220,255,0.22)'; g.fillRect(X + 3, Y + 4, T - 6, T - 8); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(X + 5, Y + 6, T - 10, 1.5);
  } else if (t === LOW && fks[z][c] === 12) { // mesa de juego: tapete verde con fichas
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(X + 3, Y + 7, T, T - 8);
    g.fillStyle = '#4a2e18'; g.fillRect(X, Y + 3, T, T - 6); g.fillStyle = '#1f5a34'; g.fillRect(X + 2, Y + 5, T - 4, T - 10);
    for (let i = 0; i < 3; i++) { g.fillStyle = ['#c9302c', '#e8e4da', '#2a5ac9'][i]; g.beginPath(); g.arc(X + 8 + hash(x, y, i) * 24, Y + 12 + hash(x, y, i + 5) * 14, 2.5, 0, 7); g.fill(); }
  } else if (t === RACK && fks[z][c] === 12) { // tragaperras: mueble con pantalla encendida
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(X + 6, Y + 6, T - 6, T - 4);
    g.fillStyle = '#2a1a3a'; g.fillRect(X + 4, Y + 2, T - 8, T - 4); g.fillStyle = '#c9a64a'; g.fillRect(X + 4, Y + 2, T - 8, 3);
    g.fillStyle = '#ffd98a'; g.fillRect(X + 9, Y + 9, T - 18, 10); g.fillStyle = '#c9302c'; for (let i = 0; i < 3; i++) g.fillRect(X + 11 + i * 6, Y + 11, 4, 6);
  } else if (t === LOW && fks[z][c] === 15) { // tumbona de cubierta
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X + 9, Y + 6, 26, 32);
    g.fillStyle = '#d9d4c8'; g.fillRect(X + 7, Y + 4, 24, 30); g.fillStyle = '#e9e5da'; g.fillRect(X + 7, Y + 4, 24, 9);
  } else if (t === LOW && fks[z][c] === 8 && M[c - 1] !== LOW && M[c + 1] !== LOW) { // peana con una obra: busto, jarrón o escultura
    g.fillStyle = '#d8d3c8'; g.fillRect(X + 9, Y + 9, 22, 22); g.fillStyle = '#b3ada0'; g.fillRect(X + 9, Y + 27, 22, 4);
    const art = Math.floor(hash(x, y, 31) * 3);
    if (art === 0) { g.fillStyle = '#8f8a80'; g.beginPath(); g.arc(X + 20, Y + 16, 6, 0, 7); g.fill(); g.fillRect(X + 15, Y + 20, 10, 6); }
    else if (art === 1) { g.fillStyle = '#2f5d7a'; g.beginPath(); g.ellipse(X + 20, Y + 19, 6, 8, 0, 0, 7); g.fill(); g.fillStyle = '#e0c07a'; g.fillRect(X + 15, Y + 18, 10, 2); }
    else { g.fillStyle = '#a0632f'; g.beginPath(); g.moveTo(X + 20, Y + 10); g.lineTo(X + 27, Y + 25); g.lineTo(X + 13, Y + 25); g.closePath(); g.fill(); }
  } else if (t === LOW && fks[z][c] === 8) { // mostrador del banco: frente de madera, encimera de mármol y alguna caja registradora
    g.fillStyle = '#3b2b20'; g.fillRect(X, Y + 6, T, T - 12); g.fillStyle = '#c9c4b8'; g.fillRect(X, Y + 4, T, 7);
    if (hash(x, y, 33) < 0.4) { g.fillStyle = '#20242a'; g.fillRect(X + 12, Y + 12, 16, 11); g.fillStyle = '#4a8a5a'; g.fillRect(X + 14, Y + 14, 12, 4); }
  } else if (t === TERMINAL) { // terminal de seguridad: mesa, monitor grande y teclado
    g.fillStyle = '#3a3024'; g.fillRect(X + 2, Y + 6, T - 4, T - 12);
    g.fillStyle = '#15181d'; g.fillRect(X + 8, Y + 4, 24, 15); g.fillStyle = '#204a66'; g.fillRect(X + 10, Y + 6, 20, 11);
    g.fillStyle = '#2a2f37'; g.fillRect(X + 10, Y + 22, 20, 6);
  } else if (t === RACK) { // rack de servidores: armario oscuro con bandejas y rejilla
    g.fillStyle = '#171b22'; g.fillRect(X + 1, Y + 2, T - 2, T - 4);
    g.fillStyle = '#262c36'; for (let i = 5; i < T - 6; i += 6) g.fillRect(X + 4, Y + i, T - 8, 3);
    g.fillStyle = '#0d1014'; for (let i = 0; i < 4; i++) g.fillRect(X + 7 + i * 7, Y + 29, 4, 4);
  } else if (t === DEPOSIT) { // pared de cajas de seguridad (abiertas si ya las has forzado)
    const open = room && room.searched && room.searched.has(z + ':' + c);
    g.fillStyle = '#59616b'; g.fillRect(X, Y, T, T);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { g.fillStyle = open && (i + j) % 2 === 0 ? '#14171b' : '#6b747f'; g.fillRect(X + 2 + i * 12.5, Y + 2 + j * 12.5, 11, 11); if (!open) { g.fillStyle = '#2b3036'; g.fillRect(X + 7 + i * 12.5, Y + 7 + j * 12.5, 2, 2); } }
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
// El botín: lingotes de oro en una vitrina sobre un pedestal, con cordón de terciopelo alrededor y un brillo que lo recorre
function drawLoot(L) {
  const x = L.x, y = L.y, t = room.time, c = ctx;
  const posts = [[-26, -26], [26, -26], [26, 26], [-26, 26]];
  c.strokeStyle = '#7a1a24'; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath();
  posts.forEach(([px, py], i) => { const [qx, qy] = posts[(i + 1) % 4]; c.moveTo(x + px, y + py); c.quadraticCurveTo(x + (px + qx) / 2, y + (py + qy) / 2 + 5, x + qx, y + qy); });
  c.stroke();
  for (const [px, py] of posts) {
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.arc(x + px + 2, y + py + 3, 3.5, 0, 7); c.fill();
    c.fillStyle = '#b39a52'; c.beginPath(); c.arc(x + px, y + py, 3.5, 0, 7); c.fill();
    c.fillStyle = '#e8d38c'; c.beginPath(); c.arc(x + px - 1, y + py - 1, 1.3, 0, 7); c.fill();
  }
  c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(x - 10, y - 8, 28, 28); // sombra del pedestal
  const pg = c.createLinearGradient(x - 14, y - 14, x + 14, y + 14); pg.addColorStop(0, '#565c66'); pg.addColorStop(1, '#25282e');
  c.fillStyle = pg; c.fillRect(x - 14, y - 14, 28, 28);
  c.fillStyle = '#17191d'; c.fillRect(x - 14, y + 9, 28, 5); // cara frontal: da altura
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x - 14, y - 14, 28, 1.5);
  if (L.taken) { // vitrina rota
    c.fillStyle = 'rgba(170,215,245,0.6)';
    for (let i = 0; i < 7; i++) { const a = hash(i, 4, 1) * 6.3, d = 6 + hash(i, 5, 1) * 18, sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 3, sy + 1); c.lineTo(sx + 1, sy + 3); c.closePath(); c.fill(); }
    return;
  }
  if (L.type === 'maletin') { // maletín con cierres dorados y billetes asomando
    c.fillStyle = '#d6e6c8'; c.fillRect(x - 8, y - 9, 14, 3);
    c.fillStyle = '#3a2618'; c.fillRect(x - 11, y - 7, 22, 15); c.fillStyle = '#4e3322'; c.fillRect(x - 11, y - 7, 22, 3);
    c.strokeStyle = '#2a1a10'; c.lineWidth = 2; c.strokeRect(x - 4, y - 11, 8, 4);
    c.fillStyle = '#e0c06a'; c.fillRect(x - 8, y - 2, 3, 3); c.fillRect(x + 5, y - 2, 3, 3);
    return;
  }
  if (L.type === 'carga') { // sacos de dinero atados
    for (const [bx, by] of [[-7, 3], [6, 4], [0, -5]]) {
      c.fillStyle = '#7a6a48'; c.beginPath(); c.ellipse(x + bx, y + by, 7, 6, 0, 0, 7); c.fill();
      c.fillStyle = '#5a4c32'; c.fillRect(x + bx - 2, y + by - 8, 4, 3);
      c.fillStyle = '#e8d07a'; c.font = '700 8px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', x + bx, y + by + 1);
    }
    return;
  }
  if (L.type === 'diamante') { // diamante tallado sobre un cojín rojo
    c.fillStyle = '#7a1a24'; c.fillRect(x - 10, y - 8, 20, 16); c.fillStyle = '#9a2a34'; c.fillRect(x - 10, y - 8, 20, 3);
    const dg = c.createLinearGradient(x - 7, y - 7, x + 7, y + 7); dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.5, '#a8d8ff'); dg.addColorStop(1, '#5a9ad0');
    c.fillStyle = dg; c.beginPath(); c.moveTo(x - 7, y - 3); c.lineTo(x - 4, y - 7); c.lineTo(x + 4, y - 7); c.lineTo(x + 7, y - 3); c.lineTo(x, y + 7); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - 7, y - 3); c.lineTo(x + 7, y - 3); c.moveTo(x - 4, y - 7); c.lineTo(x, y + 7); c.lineTo(x + 4, y - 7); c.stroke();
  } else if (L.type === 'joyas') { // bandeja de terciopelo con collares y anillos
    c.fillStyle = '#2a0f18'; c.fillRect(x - 11, y - 8, 22, 16);
    c.strokeStyle = '#e8c45a'; c.lineWidth = 1.4; c.beginPath(); c.arc(x - 3, y - 1, 6, 0.2, Math.PI - 0.2); c.stroke(); c.beginPath(); c.arc(x + 4, y + 1, 4, 0.3, Math.PI - 0.3); c.stroke();
    c.fillStyle = '#9fe0ff'; c.beginPath(); c.arc(x - 3, y + 5, 2, 0, 7); c.fill(); c.fillStyle = '#ff6a8a'; c.beginPath(); c.arc(x + 6, y - 5, 2, 0, 7); c.fill(); c.fillStyle = '#7fe0a8'; c.beginPath(); c.arc(x - 8, y - 5, 1.8, 0, 7); c.fill();
  } else if (L.type === 'efectivo') { // dos maletines abiertos llenos de billetes
    for (const dx of [-6, 6]) { c.fillStyle = '#1a1a1a'; c.fillRect(x + dx - 6, y - 7, 12, 14); c.fillStyle = '#7fa86a'; c.fillRect(x + dx - 5, y - 6, 10, 12); c.fillStyle = '#a8c890'; for (let i = 0; i < 3; i++) c.fillRect(x + dx - 5, y - 5 + i * 4, 10, 1.5); }
  } else if (L.type === 'reliquia') { // máscara funeraria de oro
    const mg = c.createLinearGradient(x - 8, y - 9, x + 8, y + 9); mg.addColorStop(0, '#ffe39a'); mg.addColorStop(1, '#a8761e');
    c.fillStyle = '#1e3a6a'; c.beginPath(); c.ellipse(x, y, 11, 10, 0, 0, 7); c.fill(); // tocado azul
    c.fillStyle = mg; c.beginPath(); c.ellipse(x, y + 1, 7, 9, 0, 0, 7); c.fill();
    c.fillStyle = '#1a1208'; c.fillRect(x - 5, y - 2, 3, 1.5); c.fillRect(x + 2, y - 2, 3, 1.5); c.fillRect(x - 1, y + 5, 2, 3);
  } else if (L.type === 'cuadro') { // cuadro con marco dorado
    c.fillStyle = '#b8902a'; c.fillRect(x - 12, y - 9, 24, 18); c.fillStyle = '#2a4a6a'; c.fillRect(x - 9, y - 6, 18, 12);
    c.fillStyle = '#e8b04a'; c.beginPath(); c.arc(x + 3, y - 2, 3, 0, 7); c.fill(); c.fillStyle = '#3a5a2a'; c.fillRect(x - 9, y + 2, 18, 4);
  } else if (L.type === 'disco') { // disco cifrado con su tira de LED
    c.fillStyle = '#121418'; c.fillRect(x - 9, y - 6, 18, 12); c.fillStyle = '#2a2f37'; c.fillRect(x - 9, y - 6, 18, 2);
    c.fillStyle = `rgba(90,200,255,${(0.6 + 0.4 * Math.sin(t * 6)).toFixed(3)})`; c.fillRect(x - 6, y + 2, 12, 1.5);
  } else {
  const bar = (bx, by) => { // lingote: base, cara superior clara y bisel
    const g = c.createLinearGradient(bx, by - 3, bx, by + 4); g.addColorStop(0, '#f6d27a'); g.addColorStop(1, '#a8761e');
    c.fillStyle = g; c.beginPath(); c.moveTo(bx - 5, by + 3); c.lineTo(bx + 5, by + 3); c.lineTo(bx + 4, by - 3); c.lineTo(bx - 4, by - 3); c.closePath(); c.fill();
    c.fillStyle = '#ffe9a8'; c.fillRect(bx - 3.5, by - 2.5, 7, 2);
    c.strokeStyle = '#6e4c12'; c.lineWidth = 0.6; c.stroke();
  };
  for (const [bx, by] of [[-6, 4], [0, 4], [6, 4], [-3, -1], [3, -1], [0, -6]]) bar(x + bx, y + by);
  }
  c.save(); c.beginPath(); c.rect(x - 11, y - 10, 22, 18); c.clip(); // brillo que recorre los lingotes
  const sw = x - 30 + ((t * 40) % 90), sg = c.createLinearGradient(sw - 8, y - 10, sw + 8, y + 8);
  sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,240,0.55)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sg; c.fillRect(x - 11, y - 10, 22, 18);
  c.restore();
  c.strokeStyle = 'rgba(170,215,245,0.55)'; c.lineWidth = 1.2; c.strokeRect(x - 12, y - 12, 24, 22); // vitrina
  c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 9, y + 6); c.lineTo(x - 3, y - 9); c.moveTo(x + 2, y + 7); c.lineTo(x + 6, y - 2); c.stroke();
}
// Partículas, humo y polvo (se ven solo con luz)
function drawFxUnder(here) {
  for (const q of room.parts) if (here(q) && !q.glow) { ctx.fillStyle = q.c; ctx.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s); }
  for (const f of room.fx) { // humo y polvo: solo se ven donde hay luz
    if (!here(f) || (f.k !== 'smoke' && f.k !== 'puff')) continue;
    const k = f.t / f.life, r = f.k === 'smoke' ? f.r0 + (f.r1 - f.r0) * Math.pow(k, 0.6) : f.r * (0.5 + k);
    ctx.fillStyle = f.k === 'smoke' ? glow(ctx, f.x, f.y, r, `${f.g},${f.g},${f.g + 4}`, 0.6 * (1 - k)) : glow(ctx, f.x, f.y, r, '120,124,130', 0.45 * (1 - k));
    ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, 7); ctx.fill();
  }
}
// Lo que emite luz (en modo aditivo): trazadoras, fogonazos, fuego, onda expansiva y brasas
function drawFxGlow(here) {
  ctx.lineCap = 'round';
  for (const k of room.cams) if (here(k) && !camBlind(k) && Math.sin(room.time * 5 + k.t) > -0.2) { const x = k.x + Math.cos(k.a) * 2, y = k.y + Math.sin(k.a) * 2; ctx.fillStyle = glow(ctx, x, y, 7, '255,50,40', 0.9); ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); }
  for (const b of room.bullets) {
    if (!here(b)) continue;
    const sp = Math.hypot(b.vx, b.vy), tl = Math.min(Math.hypot(b.x - (b.sx ?? b.x), b.y - (b.sy ?? b.y)), sp * 0.035), ux = b.vx / sp, uy = b.vy / sp;
    if (!sp || !(tl > 0.5)) continue; // recién salida (o sin origen): aún no tiene estela
    const col = b.mine ? (b.boom ? '255,170,80' : b.bolt ? '200,225,255' : b.burn ? '255,150,60' : b.pierce ? '190,235,255' : '255,225,150') : '255,130,80', tx = b.x - ux * tl, ty = b.y - uy * tl;
    const gr = ctx.createLinearGradient(tx, ty, b.x, b.y); gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(1, `rgba(${col},0.95)`);
    ctx.strokeStyle = gr; ctx.lineWidth = b.bolt ? 2.5 : 1.8; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = `rgba(${col},0.16)`; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(b.x - ux * tl * 0.4, b.y - uy * tl * 0.4); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,250,235,0.95)'; ctx.beginPath(); ctx.arc(b.x, b.y, 1.4, 0, 7); ctx.fill();
  }
  for (const f of room.fx) {
    if (!here(f)) continue;
    const k = f.t / f.life;
    if (f.k === 'muzzle') { // estrella de fogonazo en la boca del cañón
      const r = f.s * 14, a = 0.9 * (1 - k);
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a);
      ctx.fillStyle = glow(ctx, 0, 0, r, '255,210,140', a); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(255,245,215,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(0, -3 * f.s); ctx.lineTo(r * 1.5, 0); ctx.lineTo(0, 3 * f.s); ctx.closePath(); ctx.fill();
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(r * 0.55, d * r * 0.75); ctx.lineTo(r * 0.4, 0); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    } else if (f.k === 'fire') { // crece rápido y se apaga de blanco a rojo
      const r = f.r * (0.35 + 0.65 * Math.sqrt(k)), g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      g.addColorStop(0, `rgba(255,250,220,${(0.95 * (1 - k)).toFixed(3)})`); g.addColorStop(0.35, `rgba(255,170,60,${(0.8 * (1 - k)).toFixed(3)})`);
      g.addColorStop(0.75, `rgba(200,50,20,${(0.45 * (1 - k)).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, 7); ctx.fill();
    } else if (f.k === 'smoke' && f.t < 0.5) { // el fuego ilumina el humo recién salido
      const r = f.r0 + (f.r1 - f.r0) * Math.pow(k, 0.6);
      ctx.fillStyle = glow(ctx, f.x, f.y, r, '255,140,50', 0.3 * (1 - f.t / 0.5)); ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, 7); ctx.fill();
    } else if (f.k === 'ring') {
      ctx.strokeStyle = `rgba(255,240,220,${(0.6 * (1 - k)).toFixed(3)})`; ctx.lineWidth = 1 + 4 * (1 - k);
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * k, 0, 7); ctx.stroke();    } else if (f.k === 'zap') { // dardos del táser: arco eléctrico quebrado
      ctx.strokeStyle = `rgba(170,210,255,${(0.9 * (1 - k)).toFixed(3)})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(f.x, f.y);
      for (let i = 1; i <= 6; i++) { const t = i / 6; ctx.lineTo(f.x + (f.tx - f.x) * t + (i < 6 ? rnd(-6, 6) : 0), f.y + (f.ty - f.y) * t + (i < 6 ? rnd(-6, 6) : 0)); }
      ctx.stroke();
    }
  }
  for (const q of room.parts) if (here(q) && q.glow) { ctx.fillStyle = `rgba(255,${Math.floor(120 + 100 * Math.min(1, q.t * 2))},60,${Math.min(1, q.t * 2).toFixed(3)})`; ctx.fillRect(q.x - 1, q.y - 1, 2, 2); }
}
function bindRoom() { if (room.maps !== maps) { maps = room.maps; fks = room.fks; zone = room.zone; W = room.W; H = room.H; } }
function render() {
  bindRoom();
  if (room.chase) { renderChase(); return; }
  const zi = room.introT > 0 ? 1 - 0.5 * Math.pow(room.introT / 1.6, 2) : 1; // zoom de entrada
  const S = zoom * dpr * zi, p = room.p, up = p.z === 1;
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
  for (const d of room.idoors) if (here(d) && onScreen(d.x, d.y, 60)) { // puerta de dos hojas: cerrada tapa el hueco; abierta, cada hoja gira sobre su bisagra
    for (const sd of [-1, 1]) {
      const hx = d.v ? d.x : d.x + sd * T, hy = d.v ? d.y + sd * T : d.y, base = d.v ? (sd < 0 ? Math.PI / 2 : -Math.PI / 2) : (sd < 0 ? 0 : Math.PI);
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(base + d.swing * Math.PI / 2 * (d.v ? -sd : sd)); // las dos hojas se abren hacia el mismo lado
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(2, 0, T - 3, 7);
      ctx.fillStyle = '#5a3d26'; ctx.fillRect(0, -3, T - 1, 6);
      ctx.fillStyle = '#76512f'; ctx.fillRect(2, -2, T - 5, 1.5);
      ctx.fillStyle = '#c9a64a'; ctx.fillRect(T - 7, -4, 2.5, 8); // tirador
      ctx.restore();
    }
  }
  for (const k of room.cams) if (here(k) && onScreen(k.x, k.y, 280)) { // cámara: cono rojizo (solo se ve con luz), soporte y lente
    if (!camBlind(k)) { ctx.fillStyle = `rgba(255,70,60,${(0.07 + 0.1 * Math.min(1, k.spot)).toFixed(3)})`; fillPoly(ctx, visPoly(k.x, k.y, k.a, 0.45, 260, 18)); }
    ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.a);
    ctx.fillStyle = '#2d333b'; ctx.fillRect(-9, -2, 4, 4); ctx.fillStyle = '#1b1f24'; ctx.fillRect(-6, -4, 13, 8);
    ctx.fillStyle = k.on ? '#06080a' : '#4a3a2a'; ctx.beginPath(); ctx.arc(7, 0, 3, 0, 7); ctx.fill();
    if (!k.on) { ctx.strokeStyle = '#8a7a6a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(5, 3); ctx.stroke(); }
    ctx.restore();
  }
  for (const c of room.coins || []) if (here(c)) { const k = c.t / c.T, x = c.x + (c.tx - c.x) * k, y = c.y + (c.ty - c.y) * k - Math.sin(k * Math.PI) * 30; ctx.fillStyle = '#e8c45a'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill(); }
  if (room.loot && here(room.loot)) drawLoot(room.loot);
  if (!up && !room.road) drawCar(ctx, room.mission.car, room.exit.x, room.exit.y);
  if (!up) drawStreetCars(ctx);
  for (const e of room.enemies) {
    const rr = visionRange(e);
    if (!here(e) || !onScreen(e.x, e.y, rr)) continue;
    ctx.fillStyle = `rgba(${CONE[e.state]},${e.state === 'combat' ? 0.2 : 0.14})`;
    fillPoly(ctx, visPoly(e.x, e.y, e.a, visionHalf(e), rr, 24));
  }
  // cuerpos
  for (const b of room.bodies) if (here(b) && onScreen(b.x, b.y, 50)) drawCorpse(ctx, b);
  for (const it of room.items) if (here(it)) { // lata de munición militar: asa, cierre, franja y cartuchos asomando
    const x = it.x, y = it.y;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x - 7, y - 3, 19, 13);
    ctx.fillStyle = '#4f5a33'; ctx.fillRect(x - 10, y - 7, 20, 13);
    ctx.fillStyle = '#3c4527'; ctx.fillRect(x - 10, y + 2, 20, 4);
    ctx.fillStyle = '#6a7744'; ctx.fillRect(x - 10, y - 7, 20, 1.5);
    ctx.fillStyle = '#d8c05a'; ctx.fillRect(x - 8, y - 3, 13, 2);
    ctx.fillStyle = '#c9a64a'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 7 + i * 3, y - 9, 1.6, 3);
    ctx.fillStyle = '#262b18'; ctx.fillRect(x - 4, y - 10, 8, 1.5); ctx.fillRect(x + 6, y - 6, 2.5, 3.5);
  }
  for (const c of room.charges) if (here(c)) { ctx.fillStyle = '#3b3f2a'; ctx.fillRect(c.x - 5, c.y - 4, 10, 8); ctx.fillStyle = '#c9b48a'; ctx.fillRect(c.x - 5, c.y - 1, 10, 2); }
  // granadas
  for (const n of room.nades) if (here(n)) { // sombra en el suelo y la granada a su altura
    const h = n.h || 0, k = 1 + h / 260;
    ctx.fillStyle = `rgba(0,0,0,${(0.4 - Math.min(0.25, h / 300)).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(n.x + 2, n.y + 2, 5, 3.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4b5a3a'; ctx.beginPath(); ctx.arc(n.x, n.y - h * 0.6, 5 * k, 0, 7); ctx.fill();
    ctx.fillStyle = '#6f7f52'; ctx.beginPath(); ctx.arc(n.x - 1.5, n.y - h * 0.6 - 1.5, 1.8 * k, 0, 7); ctx.fill();
  }
  // enemigos
  for (const e of room.enemies) {
    if (!here(e) || !onScreen(e.x, e.y, 30)) continue;
    const d = Math.hypot(e.x - (e.px ?? e.x), e.y - (e.py ?? e.y)); // zancada según lo que se ha movido desde el último fotograma
    e.px = e.x; e.py = e.y; e.walk = (e.walk || 0) + d * 0.22; e.mv = (e.mv || 0) * 0.85 + Math.min(1, d / 1.5) * 0.15;
    if (e.type === 'dog') { drawDog(ctx, e.x, e.y, e.a, e.r, e.walk * 1.4, e.mv); continue; }
    if (e.type === 'drone') { drawDrone(ctx, e.x, e.y, e.a, false); continue; }
    const L = e.look || LOOK[e.type], sub = e.state === 'subdued';
    drawHuman(ctx, e.x, e.y, e.a, sub ? e.r * 0.9 : e.r, L, { gun: L.gun, walk: e.walk, mv: sub ? 0 : e.mv, skin: SKIN[(e.skin ??= Math.floor(Math.random() * SKIN.length))], shield: FOES[e.type].shield, phone: e.state === 'panic' && e.callT > 0, tied: sub });
    if ((e.radioT > 0 || (e.state === 'panic' && e.callT > 0)) && lit(e.x, e.y, e.z)) { // dando el aviso: si lo paras a tiempo, no llega
      const k = e.radioT > 0 ? e.radioT / 3.5 : e.callT / 4.5;
      ctx.strokeStyle = '#ff8a5c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y - 26, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k)); ctx.stroke();
      ctx.fillStyle = '#ff8a5c'; ctx.font = '700 10px "Saira Semi Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(e.radioT > 0 ? 'RADIO' : 'LLAMA', e.x, e.y - 40);
    }
    if (e.type === 'elite') { ctx.strokeStyle = 'rgba(201,166,74,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 3, e.a - 0.6, e.a + 0.6); ctx.stroke(); }
  }
  for (const e of room.enemies) if (e.aimT > 0 && here(e)) { // láser del francotirador: solo se ve donde llega tu luz
    const c = Math.cos(e.a), sn = Math.sin(e.a), L = castRay(e.x, e.y, c, sn, 700);
    ctx.strokeStyle = 'rgba(255,50,50,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + c * L, e.y + sn * L); ctx.stroke();
  }
  // jugador
  if (!p.dead) {
    p.walk = (p.walk || 0) + p.speed * 0.016 * 0.22; // aproximado: la zancada no necesita el dt exacto
    drawHuman(ctx, p.x, p.y, p.a, p.r, playerLook(), { gun: GUN_SHAPE[curW().id] || [16, 6], gunCol: gunColor(), walk: p.walk, mv: Math.min(1, p.speed / 120), skin: SKIN[0], hurt: p.hurtT > 0, silenced: wstats(curW()).silenced });
    if (curW().id === 'crossbow') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = '#20262e'; ctx.fillRect(16, -8, 2.5, 16); ctx.restore(); }
    if (p.swingT > 0) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
      ctx.strokeStyle = `rgba(230,240,255,${(p.swingT / 0.18).toFixed(3)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 30, -1 + (1 - p.swingT / 0.18) * 1.2, 0.4 + (1 - p.swingT / 0.18) * 1.2); ctx.stroke();
      ctx.restore();
    }
  }
  if (!up) { // copas por encima de las personas; la primera planta apenas se intuye desde abajo
    ctx.globalAlpha = 0.93; canopies();
    if (maps[1]) { ctx.globalAlpha = 0.14; blit(ctx, bakes[1]); }
    ctx.globalAlpha = 1;
  }
  if (room.rain) { // salpicaduras de lluvia en el suelo (solo se ven donde hay luz)
    ctx.strokeStyle = 'rgba(170,200,230,0.45)'; ctx.lineWidth = 1;
    for (let i = 0; i < 46; i++) {
      const per = 0.5, cyc = Math.floor((room.time + hash(i, 7, 3) * per) / per), k = ((room.time + hash(i, 7, 3) * per) % per) / per;
      const x = cx + (hash(i, cyc, 4) * 2 - 1) * hw, y = cy + (hash(i, cyc, 5) * 2 - 1) * hh;
      if (solidPx(x, y)) continue;
      ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(x, y, 1 + 5 * k, 0.6 + 3 * k, 0, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  drawFxUnder(here);

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
  const L = room.loot;
  if (L && !L.taken && here(L)) { lctx.fillStyle = glow(lctx, L.x, L.y, 80, '0,0,0', 0.6); fillPoly(lctx, L.poly); }
  // niebla: se pinta sobre la máscara, así solo enturbia lo que está iluminado
  fogPat = fogPat || lctx.createPattern(fogCv, 'repeat');
  const fx = (room.time * 9) % 256, fy = (room.time * 4) % 256;
  lctx.globalCompositeOperation = 'source-over';
  lctx.save(); lctx.translate(fx, fy); lctx.fillStyle = fogPat;
  lctx.fillRect(cx - hw - fx - 256, cy - hh - fy - 256, hw * 2 + 512, hh * 2 + 512);
  lctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(lightCv, 0, 0, cw, ch);
  if (room.rain && !room.demo) { // lluvia: trazos que caen (se ven algo incluso a oscuras)
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.strokeStyle = 'rgba(170,200,230,0.2)'; ctx.lineWidth = dpr; ctx.beginPath();
    for (let i = 0; i < 140; i++) { const x = (hash(i, 1, 9) * cw + room.time * 120 * dpr) % cw, y = (hash(i, 2, 9) * ch + room.time * 900 * dpr * (0.8 + hash(i, 3, 9) * 0.4)) % ch; ctx.moveTo(x, y); ctx.lineTo(x - 6 * dpr, y + 18 * dpr); }
    ctx.stroke();
  }
  ctx.setTransform(S, 0, 0, S, ox, oy);
  ctx.globalCompositeOperation = 'lighter'; // tono cálido de la linterna (el de las lámparas va horneado en el suelo)
  if (cone) { ctx.fillStyle = glow(ctx, p.x, p.y, BEAM, '255,217,138', 0.06); fillPoly(ctx, cone); }
  if (L && !L.taken && here(L)) { ctx.fillStyle = glow(ctx, L.x, L.y, 80, '255,200,90', 0.14); fillPoly(ctx, L.poly); }
  // lo que emite luz, en modo aditivo: luminarias encendidas, trazadoras, fogonazos, fuego, onda y brasas
  if (!up && !room.road) carLights(ctx, room.mission.car, room.exit.x, room.exit.y, !(room.boss || (room.loot && !room.loot.taken)));
  if (!up) streetLights(ctx);
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) { // LED de los racks y pantallas de las terminales
    const t = maps[p.z][y * W + x], X = x * T, Y = y * T;
    if (t === RACK) for (let i = 0; i < 4; i++) { if (Math.sin(room.time * (2 + hash(x, y, i) * 6) + i * 3) > 0.2) { ctx.fillStyle = hash(x, y, i + 5) < 0.75 ? 'rgba(80,220,140,0.9)' : 'rgba(255,170,60,0.9)'; ctx.fillRect(X + 8 + i * 7, Y + 30, 2, 2); } }
    else if (t === TERMINAL) { const on = !room.hasCode; ctx.fillStyle = glow(ctx, X + T / 2, Y + 12, 16, on ? '90,200,255' : '90,255,150', 0.4); ctx.beginPath(); ctx.arc(X + T / 2, Y + 12, 16, 0, 7); ctx.fill(); }
  }
  for (const d of room.doors) if (here(d) && !d.open) { ctx.fillStyle = Math.sin(room.time * 5) > 0 ? 'rgba(255,60,50,0.95)' : 'rgba(255,60,50,0.4)'; ctx.fillRect(d.x + (d.v ? 8 : -3), d.y + (d.v ? -3 : 8), 4, 4); }
  if (room.act) { // progreso de lo que estás haciendo
    const A = room.act;
    ctx.strokeStyle = 'rgba(143,184,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(A.x, A.y, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, A.t / A.time)); ctx.stroke();
  }
  for (const l of room.lamps) if (l.on && here(l)) {
    const wallLamp = l.kind === 'wallN' || l.kind === 'wallS';
    ctx.fillStyle = glow(ctx, l.hx, l.hy, wallLamp ? 18 : 14, l.rgb, 0.55); ctx.beginPath(); ctx.arc(l.hx, l.hy, wallLamp ? 18 : 14, 0, 7); ctx.fill();
    ctx.fillStyle = `rgb(${l.rgb})`;
    if (l.kind === 'street') ctx.fillRect(l.x + 2, l.y - 29, 9, 2);
    else if (l.kind === 'floor') ctx.fillRect(l.x - 6, l.y - 18, 12, 2);
    else ctx.fillRect(l.x - 12, l.kind === 'wallN' ? l.y - 2 : l.y, 24, 2);
  }
  drawFxGlow(here);
  if (L && !L.taken && here(L)) for (let i = 0; i < 4; i++) { // destellos sobre los lingotes
    const a = Math.max(0, Math.sin(room.time * 3 + i * 1.7)), sx = L.x - 8 + hash(i, 1, 3) * 16, sy = L.y - 8 + hash(i, 2, 3) * 12, r = 1 + 3 * a;
    ctx.fillStyle = `rgba(255,248,220,${(0.9 * a).toFixed(3)})`;
    ctx.fillRect(sx - r, sy - 0.5, r * 2, 1); ctx.fillRect(sx - 0.5, sy - r, 1, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';

  // ---- Lo que brilla por encima de la oscuridad ----
  const pulse = 0.6 + 0.4 * Math.sin(room.time * 4);
  ctx.font = '700 10px "Saira Semi Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (!up && !(room.boss || (room.loot && !room.loot.taken))) { ctx.fillStyle = `rgba(70,230,140,${(0.6 + 0.4 * pulse).toFixed(3)})`; ctx.fillText('HUIDA', room.exit.x, room.exit.y - CAR_DIM[room.mission.car][1] / 2 - 12); }
  for (const c of room.charges) if (here(c) && Math.sin(room.time * 6) > 0) { ctx.fillStyle = '#ff5444'; ctx.beginPath(); ctx.arc(c.x, c.y, 2.5, 0, 7); ctx.fill(); } // C4 armada
  for (const n of room.nades) if (here(n) && Math.sin(n.t * (n.t < 0.6 ? 40 : 14)) > 0) { ctx.fillStyle = '#ff5444'; ctx.beginPath(); ctx.arc(n.x, n.y - (n.h || 0) * 0.6, 2.5, 0, 7); ctx.fill(); }
  const s = run && !room.demo ? wstats(curW()) : {}; // en el menú no hay jugador
  if (s.thermal && !p.dead) for (const e of room.enemies) { // mira térmica: silueta de calor de los guardias en la línea de tiro
    const d = dist(p, e);
    if (!here(e) || d > 420 || Math.abs(angDiff(p.a, ang(p, e))) > 0.32 || !los(p.x, p.y, e.x, e.y)) continue;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = glow(ctx, e.x, e.y, e.r + 10, '255,90,40', 0.5); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 10, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(255,170,90,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 2, 0, 7); ctx.stroke();
  }
  if (s.laser && settings.laser && !p.dead) { // mira láser: haz que se desvanece con la distancia y punto con halo donde da
    const c = Math.cos(p.a), sn = Math.sin(p.a), d = castRay(p.x, p.y, c, sn, 700), x0 = p.x + c * 22, y0 = p.y + sn * 22, x1 = p.x + c * d, y1 = p.y + sn * d;
    const fl = 0.85 + 0.15 * Math.sin(room.time * 40), g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(255,50,50,${(0.5 * fl).toFixed(3)})`); g.addColorStop(1, 'rgba(255,50,50,0.06)');
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    ctx.strokeStyle = g; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,150,140,0.55)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + c * Math.min(d - 22, 160), y0 + sn * Math.min(d - 22, 160)); ctx.stroke();
    ctx.fillStyle = glow(ctx, x1, y1, 10, '255,60,60', 0.95 * fl); ctx.beginPath(); ctx.arc(x1, y1, 10, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,235,230,0.95)'; ctx.beginPath(); ctx.arc(x1, y1, 1.6, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
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
  if (room.demo) return;
  if (room.introT > 0) { // franjas de cine y nombre de la misión al entrar
    const k = room.introT / 1.6, bar = 70 * Math.min(1, k * 1.6);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, vw, bar); ctx.fillRect(0, vh - bar, vw, bar);
    ctx.globalAlpha = Math.min(1, k * 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '400 34px "Saira Stencil One", Impact, sans-serif'; ctx.fillStyle = '#ffd98a'; ctx.fillText(room.mission.name.toUpperCase(), vw / 2, vh / 2 - 8);
    ctx.font = '600 12px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#d9e2ec'; ctx.fillText(`MISIÓN ${run.level} · ${(SCENES[room.mission.scene] || '').toUpperCase()}`, vw / 2, vh / 2 + 20);
    ctx.globalAlpha = 1;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (p.hurtT > 0 || run.hp < 30 || room.alarm) {
    const a = Math.max(p.hurtT / 0.35 * 0.5, run.hp < 30 ? 0.2 + 0.1 * Math.sin(room.time * 5) : 0, room.alarm ? 0.13 + 0.1 * Math.sin(room.time * 7) : 0);
    const g = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.3, vw / 2, vh / 2, Math.max(vw, vh) * 0.7);
    g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(200,20,20,${a.toFixed(3)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
  }
  let goal = room.chase ? null : room.tutorial ? (TUT[room.tut] && TUT[room.tut][1]() ? [{ z: 0, ...TUT[room.tut][1]() }, '#8fd8ff'] : null) : room.loot && !room.loot.taken ? [room.loot, '#ffd98a'] : !room.boss ? [{ ...room.exit, z: 0 }, '#46e68c'] : null;
  if (goal && goal[0].z !== p.z && room.stairs.length) {
    const st = room.stairs.map(c => ({ x: (c % W + 1) * T, y: (((c / W) | 0) + 1) * T })).reduce((a, b) => dist(a, p) < dist(b, p) ? a : b);
    goal = [st, '#8fb8ff'];
  }
  if (goal && !p.dead) { // si el objetivo está fuera de pantalla, una flecha en el borde
    const [g, col] = goal, sx = vw / 2 + (g.x - cam.x) * zoom, sy = vh / 2 + (g.y - cam.y) * zoom, m = 44;
    if (sx < m || sx > vw - m || sy < m || sy > vh - m) {
      const a = Math.atan2(sy - vh / 2, sx - vw / 2);
      const k = Math.min((vw / 2 - m) / (Math.abs(Math.cos(a)) || 1e-6), (vh / 2 - m) / (Math.abs(Math.sin(a)) || 1e-6));
      const right = touchMode ? vw - $('acts').getBoundingClientRect().left + 14 : m; // en móvil, sin meterse bajo los botones
      ctx.save(); ctx.translate(clamp(vw / 2 + Math.cos(a) * k, m, vw - right), Math.max(118 * ui + inset.t, vh / 2 + Math.sin(a) * k)); ctx.rotate(a); // por debajo del HUD de arriba
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
      ctx.fillStyle = p.sprint ? '#ff8a5c' : p.sneak ? '#62d6ad' : '#ffb547';
      ctx.fillText(p.sprint ? 'ESPRINT' : p.sneak ? 'SIGILO' : 'ANDANDO', sticks.L.ox, sticks.L.oy - STICK_R * 1.3 - 14);
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
  ctx.fillStyle = run.hp < 30 ? '#ff5444' : '#62d6ad'; ctx.fillRect(x, y + 14, bw * Math.min(1, run.hp / run.maxHp), 9);
  ctx.font = '600 11px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#7d8ca0';
  ctx.fillText(`VIDA ${Math.ceil(run.hp)}`, x, y);
  if (p.stam < 100) { // resistencia del esprint
    ctx.fillStyle = 'rgba(14,19,26,0.6)'; ctx.fillRect(x, y + 25, bw, 3);
    ctx.fillStyle = p.tired ? '#ff5444' : '#e8d07a'; ctx.fillRect(x, y + 25, bw * p.stam / 100, 3);
  }
  ctx.font = '700 18px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#ffd98a';
  ctx.fillText(`$${run.money}`, x, y + 28);
  if (room.shownCash > 0.5) { ctx.font = '600 12px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#7fe0a8'; ctx.fillText(`+$${Math.round(room.shownCash)} en la bolsa`, x + ctx.measureText(`$${run.money}`).width * 1.6 + 10, y + 32); }
  // medidor de visibilidad (cuánto te expones)
  ctx.font = '600 11px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#7d8ca0';
  if (room.chase) { const car = room.chase.car, k = Math.max(0, car.hp / car.maxHp); ctx.fillText('VEHÍCULO', x, y + 52); ctx.fillStyle = 'rgba(14,19,26,0.6)'; ctx.fillRect(x, y + 66, bw, 6); ctx.fillStyle = k > 0.5 ? '#8fb8ff' : k > 0.25 ? '#ffb547' : '#ff5444'; ctx.fillRect(x, y + 66, bw * k, 6); }
  else {
  ctx.fillText('VISIBILIDAD', x, y + 52);
  const vis = clamp(room.exposure / 2.2, 0, 1);
  ctx.fillStyle = 'rgba(14,19,26,0.6)'; ctx.fillRect(x, y + 66, 90, 6);
  ctx.fillStyle = vis < 0.3 ? '#62d6ad' : vis < 0.6 ? '#ffb547' : '#ff5444'; ctx.fillRect(x, y + 66, 90 * vis, 6);
  }

  if (room.chase) { // distancia que queda para despistarlos y coches derribados
    const C = room.chase, k = Math.min(1, C.t / C.len), bw2 = Math.min(320, uw - 300);
    ctx.textAlign = 'center';
    ctx.font = '600 11px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#7d8ca0';
    ctx.fillText(`MISIÓN ${run.level} · ${room.mission.name.toUpperCase()} · PERSECUCIÓN`, uw / 2, y);
    ctx.font = '700 16px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#ff8a5c';
    ctx.fillText(`${C.foes.filter(f => !f.dead).length + (C.heli && !C.heli.dead ? 1 : 0)} PERSEGUIDORES · ${C.killed} DERRIBADOS`, uw / 2, y + 14);
    ctx.fillStyle = 'rgba(14,19,26,0.7)'; ctx.fillRect(uw / 2 - bw2 / 2, y + 38, bw2, 7);
    ctx.fillStyle = '#62d6ad'; ctx.fillRect(uw / 2 - bw2 / 2, y + 38, bw2 * k, 7);
    ctx.font = '600 11px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#7d8ca0'; ctx.fillText('HASTA LA GUARIDA', uw / 2, y + 50);
    if (room.banner) { ctx.globalAlpha = Math.min(1, room.banner.t * 2); ctx.font = '700 15px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#ffd98a'; ctx.fillText(room.banner.text, uw / 2, y + 70); ctx.globalAlpha = 1; }
    if (C.t < 8) { // cómo se dispara desde el techo
      ctx.font = '600 12px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = 'rgba(217,226,236,0.75)';
      ctx.fillText(padMode ? `MIRA: STICK DERECHO · DISPARAR: ${btnName(padBtn('fire'))} · CONDUCTOR: STICK IZQUIERDO · GRANADA A LA MIRA: ${btnName(padBtn('nade'))}` : touchMode ? 'MIRA: STICK DERECHO (DISPARA SOLA SOBRE UN COCHE) · CONDUCTOR: IZQUIERDO' : 'RATÓN: APUNTA Y DISPARA · A/D: CARRIL · W/S: ACELERAR/FRENAR · G: GRANADA A LA MIRA', uw / 2, y + 90);
    }
    syncHud(); syncUse();
    return;
  }
  // nivel de alerta: tranquilo, sospechas, policía avisada (con cuenta atrás hasta que llega) y policía en la zona
  const susp = room.enemies.some(e => e.state !== 'patrol' && e.state !== 'subdued') || room.bodies.some(b => !b.hidden && room.enemies.some(e => e.seen && e.seen.has(b)));
  const heat = room.police ? 3 : room.alarm ? 2 : susp ? 1 : 0;
  const label = room.boss ? (room.enemies.some(e => e.state === 'combat') ? 'COMBATE' : 'SIN DETECTAR') : ['TRANQUILO', 'SOSPECHAS', `POLICÍA EN ${Math.ceil(room.policeT)} s`, 'POLICÍA EN LA ZONA'][heat];
  const col = ['#62d6ad', '#ffb547', '#ff8a5c', '#ff5444'][heat];
  ctx.textAlign = 'center';
  ctx.font = '600 11px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#7d8ca0';
  ctx.fillText(room.tutorial ? 'ENTRENAMIENTO' : `MISIÓN ${run.level} · ${room.mission.name.toUpperCase()} · ${room.enemies.filter(e => !hidden(e)).length} HOSTILES`, uw / 2, y);
  ctx.font = '700 16px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = heat >= 2 && Math.sin(room.time * 8) > 0 ? '#ffd98a' : col;
  ctx.fillText(label, uw / 2, y + 14);
  if (!room.boss) for (let i = 0; i < 4; i++) { ctx.fillStyle = i <= heat ? col : 'rgba(125,140,160,0.3)'; ctx.fillRect(uw / 2 - 31 + i * 16, y + 24, 14, 3); } // pips de alerta
  if (room.boss) {
    const b = room.boss, bw2 = Math.min(300, uw - 320);
    ctx.font = '700 12px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#ff5444';
    ctx.fillText(FOES[b.type].title.toUpperCase(), uw / 2, y + 38);
    ctx.fillStyle = 'rgba(14,19,26,0.7)'; ctx.fillRect(uw / 2 - bw2 / 2, y + 54, bw2, 7);
    ctx.fillStyle = '#ff5444'; ctx.fillRect(uw / 2 - bw2 / 2, y + 54, bw2 * Math.max(0, b.hp) / b.maxHp, 7);
  }
  let by = y + (room.boss ? 70 : 40);
  const ts = Math.ceil(room.timer), clock = `${Math.floor(ts / 60)}:${String(ts % 60).padStart(2, '0')}`;
  if (room.alarm) {
    ctx.font = '700 20px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = Math.sin(room.time * 8) > 0 ? '#ff5444' : '#ffb547';
    ctx.fillText(`${room.police ? 'CERCO' : 'HUYE'} ${clock}`, uw / 2, y + 40);
    by = y + 66;
  } else if (room.loot && !room.tutorial) {
    ctx.font = '700 18px "Saira Semi Condensed", sans-serif';
    ctx.fillStyle = ts <= 10 && Math.sin(room.time * 8) > 0 ? '#ff5444' : ts <= 30 ? '#ffb547' : '#ffd98a';
    ctx.fillText(`TIEMPO ${clock}`, uw / 2, y + 40);
    ctx.font = '600 11px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#ffd98a';
    const shut = room.doors.some(d => !d.open);
    ctx.fillText(room.loot && room.loot.taken ? 'LLEGA AL VEHÍCULO DE EXTRACCIÓN' : shut ? (room.hasCode ? `CÓDIGO ${room.code}: ABRE LA CÁMARA` : 'LA CÁMARA ESTÁ CERRADA: CONSIGUE EL CÓDIGO O HACKÉALA') : `ROBA EL BOTÍN (${(LOOTS[room.loot.type] || ['botín'])[0].toUpperCase()}) Y ESCAPA`, uw / 2, y + 56);
    by = y + 74;
  } else if (room.boss) {
    ctx.font = '700 12px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = ts <= 30 ? '#ff5444' : '#7d8ca0';
    ctx.fillText(`TIEMPO ${clock}`, uw / 2 + Math.min(300, uw - 320) / 2 + 40, y + 52);
  }
  if (room.tutorial && TUT[room.tut]) { // paso del tutorial
    ctx.font = '700 15px "Saira Semi Condensed", sans-serif'; const txt = `PASO ${room.tut + 1}/${TUT.length} · ${TUT[room.tut][0]}`, tw = ctx.measureText(txt).width;
    ctx.fillStyle = 'rgba(14,19,26,0.82)'; ctx.fillRect(uw / 2 - tw / 2 - 12, by + 14, tw + 24, 28); ctx.fillStyle = '#8fd8ff'; ctx.fillText(txt, uw / 2, by + 28);
  }
  if (room.banner) {
    ctx.globalAlpha = Math.min(1, room.banner.t * 2);
    ctx.font = '700 15px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#ffd98a';
    ctx.fillText(room.banner.text, uw / 2, by);
    ctx.globalAlpha = 1;
  }

  if (!touchMode && run.level === 1 && room.time < 16) {
    ctx.font = '600 13px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = 'rgba(217,226,236,0.6)';
    if (padMode) { const n = k => btnName(padBtn(k)); ctx.fillText(`Stick izq. mover (poco = sigilo) · ${n('run')} correr · stick der. apuntar · ${n('fire')} disparar · ${n('use')} usar · ${n('sneak')} sigilo · ${n('reload')} recargar · ${n('weapon')} arma · ${n('knife')} cuchillo · ${n('nade')} granada · ${n('c4')} C4 · ${n('coin')} moneda · ${n('item')} consumible · ${n('light')} linterna`, uw / 2, uh - 86); } else ctx.fillText('WASD mover · Mayús correr · C sigilo (activa/desactiva) · Espacio usar · ratón apunta y dispara · E cuchillo · G granada · B C4 · Q ruido · F linterna · R recargar · 1-5 arma', uw / 2, uh - 86);
  }
  syncHud();
  syncUse();
}
function drawStick(s, gx, gy, aim) {
  const ox = s ? s.ox : gx, oy = s ? s.oy : gy;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = s ? 'rgba(217,226,236,0.35)' : 'rgba(217,226,236,0.12)';
  ctx.beginPath(); ctx.arc(ox, oy, STICK_R, 0, 7); ctx.stroke();
  ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(ox, oy, STICK_R * (0.12 + 0.88 * (aim ? FIRE : SNEAK)), 0, 7); ctx.stroke(); ctx.setLineDash([]);
  if (!s) return;
  if (!aim) { ctx.setLineDash([2, 6]); ctx.beginPath(); ctx.arc(ox, oy, STICK_R * 1.3, 0, 7); ctx.stroke(); ctx.setLineDash([]); } // más allá: esprint
  const v = stickVec(s);
  if (!aim && v.over) { const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), k = Math.min(d, STICK_R * 1.45) / d; ctx.fillStyle = 'rgba(255,138,92,0.7)'; ctx.beginPath(); ctx.arc(ox + dx * k, oy + dy * k, 22, 0, 7); ctx.fill(); return; }
  ctx.fillStyle = aim && v.m > FIRE ? 'rgba(255,84,68,0.7)' : 'rgba(217,226,236,0.45)';
  ctx.beginPath(); ctx.arc(ox + v.x * STICK_R, oy + v.y * STICK_R, 22, 0, 7); ctx.fill();
}
let hudKey = '';
let objsOpen = false, objsKey = '';
function syncObjs() { // lista desplegable de objetivos (se abre sola unos segundos al empezar)
  const open = objsOpen || (room.time < 6 && !room.objSeen), key = `${room.objV || 0}|${open}|${room.obj.length}`;
  if (key === objsKey) return;
  objsKey = key;
  $('objs').hidden = !room.obj.length; // el tutorial no tiene objetivos
  const li = o => `<li class="${o.primary ? '' : 'sec '}${o.state > 0 ? 'ok' : o.state < 0 ? 'ko' : ''}">${o.state > 0 ? '✓' : o.state < 0 ? '✗' : '○'} ${o.text}${o.primary ? '' : ` <em>+$${o.reward}</em>`}</li>`;
  $('objsList').innerHTML = `<li class="h">Principales</li>${room.obj.filter(o => o.primary).map(li).join('')}<li class="h">Secundarios</li>${room.obj.filter(o => !o.primary).map(li).join('')}`;
  $('objsList').hidden = !open; $('bObjs').setAttribute('aria-expanded', open);
  $('objsN').textContent = `${room.obj.filter(o => o.state > 0).length}/${room.obj.length}`;
}
function syncHud() {
  if (room.obj) syncObjs();
  const it = run.items || {}, nIt = Object.values(it).reduce((a, b) => a + b, 0), ib = $('bItem');
  if (ib.hidden !== !nIt) ib.hidden = !nIt; if ($('itemN').textContent !== String(nIt)) $('itemN').textContent = nIt;
  const tb = $('bTool'), jn = room.chase ? 0 : room.jams; if (tb.hidden !== !(jn > 0 || room.jamT > 0)) tb.hidden = !(jn > 0 || room.jamT > 0); if ($('toolN').textContent !== String(jn)) $('toolN').textContent = jn;
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
function syncUse() { // botón contextual: qué puedes hacer aquí
  const A = room.act, u = A ? null : nearUse(), b = $('bUse');
  const label = A ? `${A.label}… ${Math.floor(100 * Math.min(1, A.t / A.time))} %` : u ? u.label + (padMode ? ` [${btnName(padBtn('use'))}]` : touchMode ? '' : ' [Espacio]') : '';
  if (b.textContent !== label) b.textContent = label;
  b.hidden = !label;
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
      const info = `Daño ${s.dmg}${s.pellets > 1 ? '×' + s.pellets : ''} · ${s.rate}/s · ${s.mag} bal. · ruido ${noiseLabel(s.noise)}${s.note ? ' · ' + s.note : ''}`;
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
    html += `<span style="font-size:12px;letter-spacing:.14em;color:var(--beam);margin-top:6px">MUNICIÓN</span>`;
    for (const id in AMMO) {
      const a = AMMO[id], has = w.ats.includes(id), on = w.at === id;
      html += item(a.name, a.desc, `ammoT:${id}`, on ? 'En uso' : has ? 'Usar' : `$${a.price}`, on || (!has && run.money < a.price), has);
    }
  } else if (shopTab === 'eq') {
    html += item('Caja de munición', `+50 % de reserva en todas tus armas${ammoFull() ? ' (ya están llenas)' : ''}`, 'ammo', '$45', run.money < 45 || ammoFull());
    html += item('C4', `Se planta casi sin ruido y estalla cuando la detonas: abre paredes y cajas, o sirve de trampa. Tienes ${run.charges} (máx. 4)`, 'charge', '$70', run.money < 70 || run.charges >= 4);
    html += item('Granada', `Radio enorme, ruido enorme. Tienes ${run.nades} (máx. 5)`, 'nade', '$60', run.money < 60 || run.nades >= 5);
    html += item('Placas de blindaje', `+25 de vida máxima, con la que empiezas cada sala (${run.maxHp}, tope 200)`, 'maxhp', '$220', run.money < 220 || run.maxHp >= 200);
    html += `<span style="font-size:12px;letter-spacing:.14em;color:var(--beam);margin-top:6px">CONSUMIBLES · SE USAN CON EL BOTÓN DE BOTIQUÍN (H)</span>`;
    for (const k in ITEMS) { const [n, d, pr] = ITEMS[k], have = (run.items && run.items[k]) || 0; html += item(n, `${d}. Tienes ${have} (máx. 5)`, `item:${k}`, `$${pr}`, run.money < pr || have >= 5); }
  } else if (shopTab === 'hab') {
    for (const k in SKILLS) { const lv = sk(k), pr = SKILL_COST[lv]; html += item(`${SKILLS[k][0]} ${'●'.repeat(lv)}${'○'.repeat(3 - lv)}`, SKILLS[k][1], `skill:${k}`, lv >= 3 ? 'Al máximo' : `$${pr}`, lv >= 3 || run.money < pr, lv >= 3); }
  } else {
    const st = style(), row = (title, list, key, cur) => `<span style="font-size:12px;letter-spacing:.14em;color:var(--beam);margin-top:6px">${title}</span>` +
      Object.entries(list).map(([k, v]) => { const own = !v[1] || st.owned.includes(k); return item(v[0], own ? (cur === k ? 'Puesto' : 'Tuyo') : 'Se compra una vez', `style:${key}:${k}`, cur === k ? 'Puesto' : own ? 'Poner' : `$${v[1]}`, cur === k || (!own && run.money < v[1]), cur === k); }).join('');
    html += row('ROPA', OUTFITS, 'outfit', st.outfit) + row('MÁSCARA', MASKS, 'mask', st.mask) + row('CAMUFLAJE DE LAS ARMAS', CAMOS, 'camo', st.camo);
  }
  $('shopList').innerHTML = html;
  $('bNext').textContent = `Siguiente: ${mission(run.level).name}`;
}
function shopAct(act) {
  const [k, v] = act.split(':');
  const pay = n => { run.money -= n; sfx('buy'); };
  if (k === 'buyW') { pay(WEAPONS[v].price); run.weapons.push({ id: v, mods: [], ammo: WEAPONS[v].mag, reserve: Math.ceil(WEAPONS[v].reserve / 2), at: 'normal', ats: ['normal'] }); run.cur = run.weapons.length - 1; }
  else if (k === 'equip') run.cur = +v;
  else if (k === 'sel') modSel = +v;
  else if (k === 'mod') { pay(MODS[v].price); run.weapons[modSel].mods.push(v); }
  else if (k === 'ammoT') { const w = run.weapons[modSel]; if (!w.ats.includes(v)) { pay(AMMO[v].price); w.ats.push(v); } w.at = v; }
  else if (k === 'ammo') { pay(45); addAmmo(0.5); }
  else if (k === 'nade') { pay(60); run.nades++; }
  else if (k === 'charge') { pay(70); run.charges++; }
  else if (k === 'maxhp') { pay(220); run.maxHp += 25; run.hp += 25; }
  else if (k === 'item') { pay(ITEMS[v][2]); run.items = run.items || {}; run.items[v] = (run.items[v] || 0) + 1; }
  else if (k === 'skill') { const lv = sk(v); pay(SKILL_COST[lv]); run.skills = { ...run.skills, [v]: lv + 1 }; }
  else if (k === 'style') { const [, key, id] = act.split(':'), list = { outfit: OUTFITS, mask: MASKS, camo: CAMOS }[key], st = style(); if (list[id][1] && !st.owned.includes(id)) { pay(list[id][1]); st.owned.push(id); } st[key] = id; run.style = st; }
  renderShop();
  save();
}

// ================= Audio (sintetizado, sin archivos) =================
// Reverberación (más dentro que fuera), panorama según dónde suena y ambiente: viento fuera, zumbido eléctrico dentro
let ac = null, noiseBuf = null, master = null, verb = null, amb = null, out = null, rvAmt = 0, musicBus = null;
function applyVolumes() { if (master) master.gain.value = 0.8 * settings.sfx; if (musicBus) musicBus.gain.value = settings.music; }
function initAudio() {
  if (ac) { ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6; comp.attack.value = 0.002; comp.release.value = 0.2;
    comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = 0.8 * settings.sfx; master.connect(comp);
    musicBus = ac.createGain(); musicBus.gain.value = settings.music; musicBus.connect(comp);
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
    const rs = ac.createBufferSource(); rs.buffer = noiseBuf; rs.loop = true; // lluvia: ruido filtrado de fondo
    const rf = ac.createBiquadFilter(); rf.type = 'bandpass'; rf.frequency.value = 2400; rf.Q.value = 0.5;
    const rg = ac.createGain(); rg.gain.value = 0;
    rs.connect(rf).connect(rg).connect(master); rs.start();
    amb = { wg, hg, rg };
    initMusic();
  } catch (e) { ac = null; }
}
const indoors = () => room && (room.p.z === 1 || zone[cellOf(room.p.x, room.p.y)] === 1);
// ---- Música del menú: synthwave oscura de golpe, sintetizada y programada por pasos (92 ppm, La menor: Am F C G)
// Va creciendo por secciones (pads, luego batería, luego arpegio) y se apaga al entrar en una misión
let music = null;
const STEP = 60 / 92 / 4, CHORDS = [[45, [0, 3, 7]], [41, [0, 4, 7]], [48, [0, 4, 7]], [43, [0, 4, 7]]];
const mfreq = m => 440 * Math.pow(2, (m - 69) / 12);
function initMusic() {
  const g = ac.createGain(); g.gain.value = 0; g.connect(musicBus);
  const dl = ac.createDelay(1), fb = ac.createGain(), dw = ac.createGain(); dl.delayTime.value = STEP * 3; fb.gain.value = 0.38; dw.gain.value = 0.45;
  dl.connect(fb).connect(dl); dl.connect(dw).connect(g); // eco del arpegio
  music = { g, dl, step: 0, next: 0 };
}
function note(type, f, t, dur, vol, { cut = 2000, att = 0.005, to = music.g, verbAmt = 0, detune = 0, f1 = 0, sus = false } = {}) {
  const o = ac.createOscillator(), fl = ac.createBiquadFilter(), v = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune; if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
  fl.type = 'lowpass'; fl.frequency.value = cut;
  if (sus) { v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(vol, t + att); v.gain.setValueAtTime(vol, t + dur - 0.6); v.gain.linearRampToValueAtTime(0, t + dur); } // pad: se mantiene todo el compás
  else { v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(vol, t + att); v.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  o.connect(fl).connect(v).connect(to);
  if (verbAmt) { const s2 = ac.createGain(); s2.gain.value = verbAmt; v.connect(s2).connect(verb); }
  o.start(t); o.stop(t + dur + 0.05);
}
function hit(t, dur, vol, freq, type, verbAmt = 0) { // golpe de ruido filtrado (caja, charles)
  const src = ac.createBufferSource(), fl = ac.createBiquadFilter(), v = ac.createGain();
  src.buffer = noiseBuf; fl.type = type; fl.frequency.value = freq; fl.Q.value = 0.9;
  v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(fl).connect(v).connect(music.g);
  if (verbAmt) { const s2 = ac.createGain(); s2.gain.value = verbAmt; v.connect(s2).connect(verb); }
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
}
function musicStep(i, t, mode) {
  if (mode === 'stealth') { // sigilo: pads graves, un pulso lento, charles suave y alguna nota con eco
    const st = i % 32, [root, tri] = CHORDS[Math.floor(i / 32) % 4];
    if (st === 0) for (const k of tri) note('triangle', mfreq(root + 24 + k), t, STEP * 32 + 0.5, 0.03, { cut: 700, att: 1.2, verbAmt: 0.6, sus: true });
    if (st % 8 === 0) note('sine', mfreq(root), t, STEP * 3, 0.2, { cut: 300 });
    if (st % 4 === 2) hit(t, 0.03, 0.025, 8000, 'highpass');
    if (st === 20 || (st === 28 && Math.floor(i / 32) % 2)) note('triangle', mfreq(root + 36 + tri[Math.floor(i / 4) % 3]), t, 0.5, 0.04, { cut: 2400, to: music.dl });
    return;
  }
  if (mode === 'alarm') { // alarma, combate o persecución: golpes de acorde, bajo que empuja, batería y arpegio
    const st = i % 16, [root, tri] = CHORDS[Math.floor(i / 16) % 4];
    if (st === 0) for (const k of tri) note('sawtooth', mfreq(root + 24 + k), t, STEP * 3, 0.045, { cut: 1600, verbAmt: 0.3 });
    if (st % 2 === 0) note('sawtooth', mfreq(root + (st % 4 === 2 ? 12 : 0)), t, STEP * 1.6, 0.22, { cut: 620 });
    if (st % 4 === 0) note('sine', 125, t, 0.3, 0.8, { f1: 45, cut: 800 });
    if (st === 4 || st === 12) { hit(t, 0.18, 0.32, 1900, 'bandpass', 0.3); note('sine', 200, t, 0.1, 0.16, { f1: 120 }); }
    hit(t, 0.03, st % 2 ? 0.035 : 0.06, 8000, 'highpass');
    const k = tri[i % 3] + (Math.floor(i / 3) % 2) * 12; note('square', mfreq(root + 36 + k), t, 0.12, 0.03, { cut: 2200, to: music.dl });
    return;
  }
  const st = i % 16, [root, tri] = CHORDS[Math.floor(i / 16) % 4], part = Math.floor(i / 64) % 4; // part 0: solo pads y bajo
  if (st === 0) for (const k of tri) for (const dt of [-8, 8]) note(k === tri[0] ? 'sawtooth' : 'triangle', mfreq(root + 24 + k), t, STEP * 16 + 0.5, 0.05, { cut: 1000, att: 0.7, verbAmt: 0.5, detune: dt, sus: true });
  if (st % 2 === 0) note('sawtooth', mfreq(root + (st % 4 === 2 ? 12 : 0)), t, STEP * 1.9, 0.22, { cut: 480 });
  if (part >= 1) {
    if (st === 0 || st === 8 || (st === 10 && i % 32 >= 16)) note('sine', 120, t, 0.34, 0.8, { f1: 42, cut: 800 });
    if (st === 4 || st === 12) { hit(t, 0.2, 0.34, 1800, 'bandpass', 0.35); note('sine', 190, t, 0.12, 0.18, { f1: 120 }); }
    if (st % 2 === 0) hit(t, 0.04, st % 4 === 0 ? 0.08 : 0.05, 7500, 'highpass');
  }
  if (part >= 2) { const k = tri[i % 3] + (Math.floor(i / 3) % 2) * 12; note('square', mfreq(root + 36 + k), t, 0.15, 0.05, { cut: 2600, to: music.dl }); note('square', mfreq(root + 36 + k), t, 0.15, 0.04, { cut: 2600 }); }
}
setInterval(() => { // programa la música con un poco de antelación
  if (!ac || !music) return;
  const now = ac.currentTime, menuish = ['menu', 'brief', 'shop', 'story', 'results', 'slots', 'settings'].includes(state);
  const playing = state === 'play' && room && !room.demo, hot = playing && (room.chase || room.alarm || room.enemies.some(e => e.state === 'combat'));
  const mode = menuish ? 'menu' : playing ? (hot ? 'alarm' : 'stealth') : null; // en la misión, la música sube cuando salta la alarma
  if (mode !== music.mode) { music.mode = mode; music.step = 0; }
  music.g.gain.setTargetAtTime(mode === 'menu' ? 0.55 : mode === 'alarm' ? 0.42 : mode === 'stealth' ? 0.3 : 0, now, mode ? 1.2 : 0.4);
  if (!mode) { music.next = 0; return; }
  if (music.next < now) music.next = now + 0.05;
  while (music.next < now + 0.3) { musicStep(music.step++, music.next, mode); music.next += STEP; }
}, 70);
addEventListener('pointerdown', () => initAudio(), { once: true }); // los navegadores solo dejan sonar tras el primer toque
addEventListener('keydown', () => initAudio(), { once: true });
function ambience(on) {
  if (!amb) return;
  const t = ac.currentTime, inside = on && indoors();
  amb.wg.gain.setTargetAtTime(!on ? 0 : inside ? 0.01 : 0.045 + 0.03 * Math.sin(t * 0.6) * Math.sin(t * 0.23), t, 0.4); // rachas
  amb.hg.gain.setTargetAtTime(inside ? 0.018 : 0, t, 0.4);
  amb.rg.gain.setTargetAtTime(on && room && room.rain ? (inside ? 0.025 : 0.08) : 0, t, 0.5);
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
    case 'tick': burst(0.03, 0.15 * v, 2200, 'bandpass', 3); break;
    case 'cash': tone(1800, 1800, 0.04, 0.08, 'triangle'); tone(2400, 2400, 0.06, 0.07, 'triangle', 0.05); break;
    case 'vault': burst(0.6, 0.5 * v, 220); tone(90, 60, 0.8, 0.4 * v, 'sawtooth'); clatter(3, 0.2 * v, 0.5); tone(1500, 1500, 0.05, 0.1 * v, 'square', 0.9); break;
    case 'buy': tone(660, 990, 0.12, 0.15, 'triangle'); tone(990, 1320, 0.15, 0.12, 'triangle', 0.1); break;
    case 'throw': burst(0.15, 0.25, 700, 'bandpass', 1.2, 0, 2400); break;
    case 'gore': burst(0.12, 0.3 * v, 400); tone(90, 50, 0.1, 0.2 * v, 'sine'); break;
    case 'bite': burst(0.09, 0.5 * v, 900); tone(240, 90, 0.12, 0.35 * v, 'sawtooth'); break;
    case 'clank': tone(1900, 1300, 0.07, 0.25 * v); burst(0.05, 0.3 * v, 4500, 'highpass'); break;
    case 'charge': tone(300, 1100, 0.9, 0.07 * v, 'sine'); break;
    case 'plant': burst(0.03, 0.2, 2500, 'bandpass', 3); tone(1800, 1800, 0.05, 0.08, 'square', 0.12); break;
    case 'click': tone(1600, 1600, 0.03, 0.12); tone(800, 800, 0.05, 0.1, 'square', 0.05); break;
    case 'zap': burst(0.25, 0.25 * v, 3500, 'bandpass', 4); tone(90, 70, 0.25, 0.08 * v, 'sawtooth'); break;
    case 'heal': tone(520, 780, 0.18, 0.09, 'sine'); tone(780, 1040, 0.2, 0.07, 'sine', 0.12); break;
    case 'horn': tone(410, 400, 0.35, 0.06 * v, 'square'); tone(520, 510, 0.35, 0.05 * v, 'square'); break;
    case 'door': burst(0.08, 0.12 * v, 900, 'bandpass', 2); tone(180, 120, 0.12, 0.05 * v, 'triangle'); break;
    case 'shell': tone(3600 + rnd(-300, 300), 3000, 0.04, 0.03 * v * (room && room.rain ? 0.5 : 1), 'triangle'); tone(4400, 4000, 0.03, 0.02 * v, 'triangle', 0.05); break;
    case 'tink': tone(3200, 2800, 0.06, 0.08 * v, 'triangle'); tone(4100, 3600, 0.05, 0.05 * v, 'triangle', 0.07); break;
    case 'scream': tone(700, 1150, 0.35, 0.11 * v, 'sawtooth'); tone(1000, 640, 0.32, 0.08 * v, 'sawtooth', 0.28); break;
    case 'radio': burst(0.22, 0.12, 1700, 'bandpass', 3); tone(1250, 1250, 0.05, 0.05, 'square', 0.24); break;
    case 'phone': tone(1400, 1400, 0.07, 0.05 * v, 'sine'); tone(1400, 1400, 0.07, 0.05 * v, 'sine', 0.14); break;
    case 'tick': tone(1500, 1400, 0.03, 0.05, 'triangle'); break;
    case 'tickBad': tone(320, 220, 0.08, 0.06, 'square'); break;
    case 'star0': case 'star1': case 'star2': tone(880 * 2 ** (k[4] / 4), 1760 * 2 ** (k[4] / 4), 0.18, 0.1, 'triangle'); tone(2640, 2640, 0.12, 0.03, 'sine', 0.05); break;
    case 'stamp': burst(0.18, 0.9, 260); tone(120, 45, 0.25, 0.7, 'sine'); burst(0.05, 0.3, 2000, 'highpass'); break;
    case 'objective': tone(880, 1320, 0.14, 0.13, 'triangle'); tone(1320, 1760, 0.16, 0.11, 'triangle', 0.12); break;
    case 'fail': tone(420, 240, 0.3, 0.13, 'triangle'); break;
    case 'siren':
      for (const det of [0, 9]) { tone(620 + det, 1080 + det, 0.5, 0.07, 'sawtooth'); tone(1080 + det, 620 + det, 0.5, 0.07, 'sawtooth', 0.5); }
      break;
  }
}

// ================= Entrada =================
function show(id) {
  ambience(id === null);
  if (id !== null) { sticks.L = sticks.R = null; mouse.down = false; } // un dedo que se levanta con un menú encima no deja el stick pegado
  for (const o of ['menu', 'shop', 'pause', 'over', 'win', 'brief', 'results', 'settings', 'slots', 'story', 'padmap']) $(o).hidden = o !== id;
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
    touchMode = false; padMode = false; mouse.active = true; mouse.x = e.clientX; mouse.y = e.clientY;
    if (e.button === 2) melee(); else mouse.down = true;
    return;
  }
  touchMode = true; padMode = false;
  const side = e.clientX < vw / 2 ? 'L' : 'R';
  if (!sticks[side]) sticks[side] = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
});
addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; if (state === 'play') { mouse.active = true; touchMode = false; padMode = false; } return; }
  for (const k in sticks) {
    const s = sticks[k];
    if (!s || s.id !== e.pointerId) continue;
    s.x = e.clientX; s.y = e.clientY;
    const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), m = STICK_R * 1.6;
    if (d > m) { s.ox = s.x - dx / d * m; s.oy = s.y - dy / d * m; } // la base sigue al dedo
  }
});
const release = e => {
  if (e.pointerType === 'mouse') mouse.down = false;
  for (const k in sticks) if (sticks[k] && sticks[k].id === e.pointerId) sticks[k] = null;
};
addEventListener('pointerup', release);
addEventListener('pointercancel', release);
addEventListener('contextmenu', e => e.preventDefault()); // la pulsación larga no abre menús del sistema
const dropInput = () => { sticks.L = sticks.R = null; mouse.down = false; for (const k in keys) keys[k] = false; };
addEventListener('blur', dropInput);
document.addEventListener('visibilitychange', () => { if (document.hidden) { dropInput(); pause(); } }); // al cambiar de app, pausa

const press = (id, fn) => $(id).addEventListener('pointerdown', e => {
  e.preventDefault(); e.stopPropagation();
  if (state !== 'play') return;
  fn(); buzz(8);
  const b = $(id); b.classList.add('press'); setTimeout(() => b.classList.remove('press'), 120);
});
press('bKnife', melee);
press('bNade', throwNade);
press('bNoise', makeNoise);
press('bBreach', breach);
press('bUse', use);
press('bReload', reload);
press('bLight', toggleLight);
press('bWeapon', cycleWeapon);
press('bSneak', toggleSneak);
$('bPause').addEventListener('click', () => pause());
$('bObjs').addEventListener('click', e => { e.stopPropagation(); objsOpen = !objsOpen; objsKey = ''; if (room) room.objSeen = true; });
$('bStGo').addEventListener('click', () => { initAudio(); const f = storyNext; storyNext = null; if (f) f(); });
$('results').addEventListener('pointerdown', e => { if (rsSkip && e.target.id !== 'bRsGo') rsSkip(); });
$('bRsGo').addEventListener('click', () => { const f = resultsNext; resultsNext = null; if (f) f(); });

function pause() {
  if (state !== 'play') return;
  state = 'pause';
  $('pauseInfo').textContent = `Misión ${run.level}: ${room.mission.name} · $${run.money} (+$${room.cash} en la bolsa) · vida ${Math.ceil(run.hp)}`;
  show('pause');
}
let sneakOn = false; // C o el botón de sigilo lo alternan
function toggleSneak() {
  sneakOn = !sneakOn;
  $('bSneak').classList.toggle('on', sneakOn); $('bSneak').setAttribute('aria-pressed', sneakOn);
  banner(sneakOn ? 'Sigilo activado' : 'Sigilo desactivado');
}
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Tab' || e.code === 'Space') e.preventDefault();
  if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play') pause(); else if (state === 'pause') { state = 'play'; show(null); } }
  if (state !== 'play' || e.repeat) return;
  if (e.code === 'KeyC') { toggleSneak(); return; }
  if (e.code === 'KeyJ') { useJammer(); return; }
  if (e.code === 'KeyL') { settings.laser = !settings.laser; saveSettings(); banner(settings.laser ? 'Mira láser encendida' : 'Mira láser apagada'); return; }
  if (e.code === 'KeyH') { useItem(); return; }
  if (e.code === 'KeyO') { objsOpen = !objsOpen; objsKey = ''; room.objSeen = true; return; }
  const act = { Space: use, KeyE: melee, KeyG: throwNade, KeyB: breach, KeyQ: makeNoise, KeyR: reload, KeyF: toggleLight, Tab: cycleWeapon }[e.code];
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

// ================= Mando (Gamepad API, distribución estándar tipo Xbox) =================
// Juego: stick izq. mover · LT correr · stick der. apuntar · RT disparar · A usar · B sigilo · X recargar · Y arma ·
// RB cuchillo · LB granada · cruceta ↑ C4 · ← moneda · ↓ consumible · → linterna · L3 láser · R3 inhibidor · Select objetivos · Start pausa.
// Menús: cruceta o stick izq. para moverte, A aceptar, B volver, ←/→ ajustan los deslizadores.
// Acciones del mando y su botón por defecto (índices de la distribución estándar); se pueden reasignar en Ajustes
const PAD_ACTIONS = [['fire', 'Disparar', 7], ['run', 'Correr', 6], ['use', 'Usar', 0], ['sneak', 'Sigilo', 1], ['reload', 'Recargar', 2], ['weapon', 'Cambiar arma', 3],
  ['knife', 'Cuchillo', 5], ['nade', 'Granada', 4], ['c4', 'C4', 12], ['coin', 'Moneda', 14], ['item', 'Consumible', 13], ['light', 'Linterna', 15],
  ['laser', 'Láser', 10], ['jammer', 'Inhibidor', 11], ['objs', 'Objetivos', 8], ['pause', 'Pausa', 9]];
const BTN_NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Select', 'Start', 'L3', 'R3', '↑', '↓', '←', '→', 'Guía'];
const padBtn = id => { const v = settings.padMap[id]; return Number.isInteger(v) ? v : PAD_ACTIONS.find(a => a[0] === id)[2]; };
const btnName = i => BTN_NAMES[i] || `Botón ${i}`;
let padCapture = null; // acción esperando a que pulses su botón nuevo
const pad = { L: { x: 0, y: 0, m: 0 }, R: { x: 0, y: 0, m: 0 }, fire: false, run: false, prev: [], navT: 0, idx: null };
let padMode = false;
const PAD_DEAD = 0.18;
function padStick(x, y) { const m = Math.hypot(x, y); if (m < PAD_DEAD) return { x: 0, y: 0, m: 0 }; const k = Math.min(1, (m - PAD_DEAD) / (1 - PAD_DEAD)); return { x: x / m * k, y: y / m * k, m: k }; }
function getPad() { try { for (const g of navigator.getGamepads ? navigator.getGamepads() : []) if (g && g.connected) { pad.idx = g.index; return g; } } catch (e) { /* sin permiso para mandos */ } return null; }
function padRumble(ms) { const g = padMode && getPad(); if (g && g.vibrationActuator) g.vibrationActuator.playEffect('dual-rumble', { duration: ms * 3, strongMagnitude: 0.6, weakMagnitude: 0.4 }).catch(() => {}); }
function padNote(text) { const n = $('padNote'); n.textContent = text; n.hidden = false; n.classList.remove('in'); void n.offsetWidth; n.classList.add('in'); clearTimeout(padNote.t); padNote.t = setTimeout(() => { n.hidden = true; }, 3500); }
addEventListener('gamepadconnected', e => { padNote(`🎮 Mando conectado: ${e.gamepad.id.replace(/\s*\(.*$/, '').slice(0, 40) || 'mando'}`); });
addEventListener('gamepaddisconnected', () => { padNote('Mando desconectado'); if (padMode) { padMode = false; touchMode = matchMedia('(pointer: coarse)').matches; if (state === 'play') pause(); } });
function pollPad() {
  const g = getPad();
  if (!g) { pad.L = pad.R = { x: 0, y: 0, m: 0 }; pad.fire = pad.run = false; return; }
  const b = i => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5)), ax = i => g.axes[i] || 0;
  const now = g.buttons.map((_, i) => b(i)), prev = pad.prev, hit = i => now[i] && !prev[i];
  pad.L = padStick(ax(0), ax(1)); pad.R = padStick(ax(2), ax(3));
  pad.fire = b(padBtn('fire')); pad.run = b(padBtn('run'));
  if (!padMode && (now.some(Boolean) || pad.L.m > 0 || pad.R.m > 0)) { // al tocar el mando, pasa a mandar él: fuera botones táctiles y ratón
    padMode = true; touchMode = false; mouse.active = false; sticks.L = sticks.R = null; resize();
  }
  pad.prev = now;
  if (!padMode) return;
  if (padCapture) { // reasignando: el primer botón que pulses pasa a esa acción (y la que lo tenía se queda con el antiguo)
    const i = now.findIndex((v, k) => v && !prev[k]);
    if (i >= 0) assignPad(padCapture, i);
    return;
  }
  const boot = $('boot');
  if (boot && (hit(0) || hit(9))) { boot.dispatchEvent(new Event('pointerdown')); return; }
  if (state === 'play') {
    if (hit(padBtn('pause'))) { pause(); return; }
    const acts = { use, sneak: toggleSneak, reload, weapon: cycleWeapon, knife: melee, nade: throwNade, c4: breach, coin: makeNoise, item: useItem, light: toggleLight, jammer: useJammer,
      objs: () => { objsOpen = !objsOpen; objsKey = ''; room.objSeen = true; },
      laser: () => { settings.laser = !settings.laser; saveSettings(); banner(settings.laser ? 'Mira láser encendida' : 'Mira láser apagada'); } };
    for (const k in acts) if (hit(padBtn(k))) acts[k]();
    return;
  }
  padMenu(hit, now);
}
function padMenu(hit, now) { // menús: foco que salta al botón más cercano en la dirección pulsada
  const ov = [...document.querySelectorAll('.overlay')].find(o => !o.hidden);
  if (!ov) return;
  if (state === 'results' && rsSkip && (hit(0) || hit(1))) { rsSkip(); return; }
  const els = [...ov.querySelectorAll('button:not([disabled]), input, summary')].filter(e => e.offsetParent !== null && e.getClientRects().length);
  if (!els.length) return;
  let cur = document.activeElement;
  if (!els.includes(cur)) cur = null;
  const focus = e => { document.querySelectorAll('.padfocus').forEach(x => x.classList.remove('padfocus')); e.focus({ preventScroll: true }); e.classList.add('padfocus'); e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); };
  const dx = (now[15] ? 1 : 0) - (now[14] ? 1 : 0) || Math.round(pad.L.m > 0.5 ? pad.L.x : 0), dy = (now[13] ? 1 : 0) - (now[12] ? 1 : 0) || Math.round(pad.L.m > 0.5 ? pad.L.y : 0);
  const t = performance.now(), fresh = hit(12) || hit(13) || hit(14) || hit(15);
  if ((dx || dy) && (fresh || t > pad.navT)) {
    pad.navT = t + (fresh ? 380 : 160); // mantener pulsado repite
    if (!cur) { focus(els.find(e => e.classList.contains('cta')) || els[0]); return; }
    if (cur.type === 'range' && dx && !dy) { cur.value = +cur.value + dx * (cur.max - cur.min) / 20; cur.dispatchEvent(new Event('input', { bubbles: true })); cur.dispatchEvent(new Event('change', { bubbles: true })); return; }
    const r0 = cur.getBoundingClientRect(), c0 = { x: r0.left + r0.width / 2, y: r0.top + r0.height / 2 };
    let best = null, bs = Infinity;
    for (const e of els) {
      if (e === cur) continue;
      const r = e.getBoundingClientRect(), vx = r.left + r.width / 2 - c0.x, vy = r.top + r.height / 2 - c0.y;
      const along = dx ? vx * dx : vy * dy, across = dx ? Math.abs(vy) : Math.abs(vx);
      if (along <= 4) continue;
      const sc = along + across * 2.2;
      if (sc < bs) { bs = sc; best = e; }
    }
    if (best) focus(best);
    return;
  }
  if (hit(0)) { if (cur) cur.click(); else focus(els.find(e => e.classList.contains('cta')) || els[0]); return; }
  if (hit(1) || (hit(9) && state === 'pause')) { // volver
    const back = { pause: 'bResume', settings: 'bSetBack', slots: 'bSlotsBack', padmap: 'bPmBack' }[ov.id];
    if (back) $(back).click();
  }
}

function begin() {
  initAudio();
  try { document.documentElement.requestFullscreen?.().catch(() => {}); screen.orientation?.lock?.('landscape').catch(() => {}); } catch (e) { /* opcional */ }
}
$('bPlay').addEventListener('click', () => {
  const b = $('bPlay');
  if (loadSave() && !b.dataset.sure) { b.dataset.sure = '1'; b.textContent = '¿Borrar la partida guardada?'; return; }
  begin(); newRun(); brief(startRoom);
});
$('bGo').addEventListener('click', () => {
  initAudio(); const f = goAfter; goAfter = null; clearInterval(typeT);
  if (run && run.plan) { const c = planCost(run.plan); if (c <= run.money) { run.money -= c; run.plan.paid.push(...[run.plan.entry, ...run.plan.tools].filter(k => !run.plan.paid.includes(k))); } else run.plan = freshPlan(); }
  if (f) f();
});
$('bfPlan').addEventListener('click', e => {
  const b = e.target.closest('button[data-plan]'); if (!b || b.disabled) return;
  const [kind, k] = b.dataset.plan.split(':'), plan = run.plan;
  if (kind === 'entry') plan.entry = k; else plan.tools = plan.tools.includes(k) ? plan.tools.filter(t => t !== k) : [...plan.tools, k];
  renderPlan(); sfx('click');
});
$('bTool').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); useJammer(); });
$('bItem').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); useItem(); });
// ---- Ajustes y partidas
let settingsBack = 'menu';
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* sin almacenamiento */ } applyVolumes(); }
function openSettings(back) {
  settingsBack = back;
  $('sMusic').value = Math.round(settings.music * 100); $('sSfx').value = Math.round(settings.sfx * 100); $('sSens').value = Math.round(settings.sens * 100);
  $('sVib').checked = settings.vib; $('sLaser').checked = settings.laser;
  show('settings');
}
for (const [id, k, f] of [['sMusic', 'music', v => v / 100], ['sSfx', 'sfx', v => v / 100], ['sSens', 'sens', v => v / 100]]) $(id).addEventListener('input', e => { settings[k] = f(+e.target.value); saveSettings(); });
$('sVib').addEventListener('change', e => { settings.vib = e.target.checked; saveSettings(); buzz(30); });
$('sLaser').addEventListener('change', e => { settings.laser = e.target.checked; saveSettings(); });
$('bSettings').addEventListener('click', () => { initAudio(); openSettings('menu'); });
$('bPauseSet').addEventListener('click', () => openSettings('pause'));
function renderPadMap() {
  $('pmList').innerHTML = PAD_ACTIONS.map(([id, label]) => `<button class="pm-row${padCapture === id ? ' wait' : ''}" data-act="${id}"><span>${label}</span><b>${padCapture === id ? 'Pulsa…' : btnName(padBtn(id))}</b></button>`).join('');
  $('pmNote').textContent = getPad() ? 'Elige una acción y pulsa en el mando el botón que quieras. Si ese botón ya tenía otra acción, se intercambian.' : 'Conecta un mando y pulsa un botón para poder reasignarlos.';
}
function assignPad(id, i) {
  const old = padBtn(id), other = PAD_ACTIONS.find(a => a[0] !== id && padBtn(a[0]) === i);
  if (other) settings.padMap[other[0]] = old; // intercambio: ninguna acción se queda sin botón
  settings.padMap[id] = i; padCapture = null; clearTimeout(assignPad.t);
  saveSettings(); renderPadMap(); sfx('click');
  const el = document.querySelector(`.pm-row[data-act="${id}"]`); if (el && padMode) { el.focus({ preventScroll: true }); el.classList.add('padfocus'); }
}
$('pmList').addEventListener('click', e => {
  const r = e.target.closest('.pm-row'); if (!r) return;
  padCapture = padCapture === r.dataset.act ? null : r.dataset.act; // volver a elegirla cancela
  clearTimeout(assignPad.t); if (padCapture) assignPad.t = setTimeout(() => { padCapture = null; renderPadMap(); }, 6000);
  renderPadMap();
  const el = document.querySelector(`.pm-row[data-act="${r.dataset.act}"]`); if (el) { el.focus({ preventScroll: true }); if (padMode) el.classList.add('padfocus'); }
});
$('bPadMap').addEventListener('click', () => { padCapture = null; renderPadMap(); show('padmap'); });
$('bPmReset').addEventListener('click', () => { settings.padMap = {}; padCapture = null; saveSettings(); renderPadMap(); });
$('bPmBack').addEventListener('click', () => { padCapture = null; show('settings'); });
$('bSetBack').addEventListener('click', () => { if (settingsBack === 'pause') show('pause'); else { refreshMenu(); show('menu'); } });
function renderSlots() {
  $('slotList').innerHTML = [1, 2, 3].map(n => {
    const d = loadSave(n), t = d && d.t ? new Date(d.t).toLocaleString('es', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    return `<div class="slot${n === slot ? ' cur' : ''}"><div><b>Ranura ${n}${n === slot ? ' · actual' : ''}</b><small>${d ? `Misión ${d.run.level}: ${mission(d.run.level).name} · $${d.run.money}${t ? ' · ' + t : ''}` : 'Vacía'}</small></div>` +
      `<div class="row">${d ? `<button class="cta" data-slot="load:${n}">Jugar</button><button class="ghost" data-slot="del:${n}">Borrar</button>` : `<button class="cta" data-slot="new:${n}">Nueva</button>`}</div></div>`;
  }).join('');
}
$('bSlots').addEventListener('click', () => { renderSlots(); show('slots'); });
$('bTutorial').addEventListener('click', () => { begin(); newRun(); run.tutorial = true; $('menuNote').hidden = true; startRoom(); });
$('bSlotsBack').addEventListener('click', () => { refreshMenu(); show('menu'); });
$('slotList').addEventListener('click', e => {
  const b = e.target.closest('button[data-slot]'); if (!b) return;
  const [k, n] = b.dataset.slot.split(':'), i = +n;
  if (k === 'del') { if (b.dataset.sure) { try { localStorage.removeItem(SLOT_KEY(i)); } catch (er) { /* sin almacenamiento */ } renderSlots(); } else { b.dataset.sure = '1'; b.textContent = '¿Seguro?'; } return; }
  setSlot(i);
  if (k === 'new') { begin(); newRun(); brief(startRoom); return; }
  const d = loadRun(); if (d) { if (d.shop) openShop('Partida guardada. Prepárate para la siguiente misión.'); else brief(startRoom); }
});
function loadRun() {
  const d = loadSave();
  if (!d) { refreshMenu(); return null; }
  begin();
  run = { charges: 2, ...d.run, snap: null }; // las partidas de antes de las cargas empiezan con 2
  for (const w of run.weapons) { w.at = w.at || 'normal'; w.ats = w.ats || ['normal']; }
  return d;
}
const prepShop = msg => openShop(msg, `Prepárate: ${mission(run.level).name}`); // tienda antes de entrar (desde el menú o tras caer)
$('bCont').addEventListener('click', () => {
  const d = loadRun();
  if (d) { if (d.shop) openShop('Partida guardada. Prepárate para la siguiente misión.'); else brief(startRoom); }
});
$('bShop').addEventListener('click', () => { if (loadRun()) prepShop('Cambia de arma, mejóralas o repón munición, C4 y granadas antes de entrar.'); });
$('bOverShop').addEventListener('click', () => { // vuelves al equipo con el que entraste y compras antes de reintentar
  run = { ...JSON.parse(run.snap), snap: null };
  prepShop('Cambia de arma, mejóralas o repón munición, C4 y granadas antes de reintentar.');
});
showMenu();
// Pantalla de carga: el nombre se enciende, la barra avanza con mensajes y se funde con el menú cuando las fuentes están listas
(function boot() {
  const el = $('boot'), bar = $('bootBar'), msg = $('bootMsg'), t0 = performance.now(), MIN = matchMedia('(prefers-reduced-motion: reduce)').matches ? 300 : 2100;
  const msgs = ['Cortando la luz…', 'Repasando los planos…', 'Cargando el equipo…', 'Esperando a la noche…'];
  let ready = false, gone = false;
  const done = () => { if (gone) return; gone = true; bar.style.width = '100%'; setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 800); }, 220); };
  const tick = () => {
    if (gone) return;
    const k = Math.min(1, (performance.now() - t0) / MIN);
    bar.style.width = `${Math.round((ready ? k : Math.min(k, 0.85)) * 100)}%`;
    msg.textContent = msgs[Math.min(msgs.length - 1, Math.floor(k * msgs.length))];
    if (ready && k >= 1) done(); else setTimeout(tick, 120);
  };
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 4000))]).then(() => { ready = true; });
  el.addEventListener('pointerdown', () => { if (ready) done(); }); // con todo cargado, un toque lo salta
  tick();
})();
$('bResume').addEventListener('click', () => { state = 'play'; show(null); });
$('bRestart').addEventListener('click', retryRoom);
$('bQuit').addEventListener('click', showMenu);
$('bRetry').addEventListener('click', () => { initAudio(); retryRoom(); });
$('bNew').addEventListener('click', () => { initAudio(); newRun(); brief(startRoom); });
$('bNext').addEventListener('click', () => { initAudio(); brief(startRoom); });
$('bWinGo').addEventListener('click', () => openShop(winStats));
$('bWinNew').addEventListener('click', () => { begin(); newRun(); brief(startRoom); });
document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { shopTab = b.dataset.tab; modSel = run.cur; renderShop(); } });
$('shopList').addEventListener('click', e => { const b = e.target.closest('button[data-act]'); if (b && !b.disabled) shopAct(b.dataset.act); });

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame); // primero: si algo falla en este fotograma, el juego no se congela
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  pollPad();
  if (state === 'play') update(dt);
  else if (room && room.demo) { // menú: la cámara recorre el mapa de fondo
    room.time += dt; cam.shake = 0;
    cam.x = room.W * T * (0.5 + 0.28 * Math.sin(room.time * 0.06)); cam.y = room.H * T * (0.5 + 0.25 * Math.sin(room.time * 0.09 + 1));
  }
  if (room) render();
  else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#07090d'; ctx.fillRect(0, 0, cw, ch); }
}
requestAnimationFrame(frame);

// Gancho para las pruebas automáticas (test/smoke.js)
window.__apagon = { settings, padBtn, pad, get padMode() { return padMode; }, pollPad, pickAt, get music() { return music; }, get run() { return run; }, get room() { return room; }, get state() { return state; }, buildRoom, castRay, bfs, findPath, cellOf, noise, hurtPlayer, hurtEnemy, startRoom, breach, useFloor, lit, use, nearUse, shoot, zoneAt: c => zone[c], get view() { return { cam, S: zoom * dpr, cw, ch }; } };
})();
