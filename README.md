# Apagón

Shooter táctico top-down para el navegador, en móvil o PC. Una campaña de 16 golpes con nombre propio: te cuelas de noche en oficinas, almacenes, galerías, bancos y centros de datos con una linterna de haz cónico, robas el botín, saqueas lo que encuentras y escapas en el vehículo antes de que llegue la policía (a veces con una persecución por carretera). Puedes ir en sigilo, a tiros o abriendo paredes, y entre misiones compras y mejoras armas.

Sin dependencias ni compilación: `index.html` + `game.js`.

## Jugar

- **En local:** abre `index.html` en el navegador o sirve la carpeta (`python3 -m http.server`) y entra desde el móvil con la IP del ordenador.
- **Publicado:** en GitHub, *Settings → Pages → Deploy from a branch* y elige la rama con el código y la carpeta `/`. En móvil se juega en horizontal; en PC con teclado y ratón, y la vista y el HUD se adaptan al tamaño de la pantalla.

## Controles

| Táctil | Teclado / ratón | Acción |
|---|---|---|
| Stick izquierdo (poco recorrido) | `WASD` + `Ctrl` o `C` | Moverte en sigilo, sin ruido |
| Stick izquierdo (a fondo) | `WASD` | Caminar: los pasos se oyen |
| Stick izquierdo (más allá del borde) | `WASD` + `Mayús` | Correr: más rápido, mucho ruido y gasta aguante |
| Stick derecho | Ratón | Apuntar la linterna |
| Stick derecho hasta el borde | Clic izquierdo | Disparar |
| Usar (aparece al acercarte) | `Espacio` | Registrar cajones, estanterías, cuerpos, cajas de seguridad y racks; hackear la terminal o la puerta de la cámara. Volver a pulsar cancela |
| Cuchillo | `E` / clic derecho | Ataque cuerpo a cuerpo casi silencioso |
| Granada | `G` | Se lanza en arco, rebota y estalla: abre paredes y se oye en todo el edificio |
| C4 | `B` | Primera pulsación: la plantas casi sin ruido. Segunda: la detonas |
| Ruido | `Q` | Atrae a los guardias hacia ti |
| Linterna | `F` | Apagarla reduce tu visibilidad y lo que ves |
| Recargar | `R` | Recarga (también es automática) |
| Recuadro del arma | `1`-`5`, rueda o `Tab` | Cambiar de arma |
| Pausa | `Esc` | Pausa |

## Mecánicas

- **Campaña:** 16 misiones con nombre (Polilla, Marea Baja, Cristal, Hierro Fundido, Bóveda Norte, Silicio…), cada una más difícil: más guardias, de tipos más duros y en edificios más grandes. Las misiones 8 (*El Alcaide*) y 16 (*Ajuste de Cuentas*) son de jefe. Después sigue el modo infinito con contratos generados y un jefe más duro cada 8. El menú tiene de fondo un edificio de verdad con sus luces, la lista de la campaña con lo hecho y lo que sigue, y antes de cada misión aparece un briefing animado (nombre, escenario, operación, vehículo, objetivos). Al entrar, la cámara se acerca con franjas de cine y el nombre de la misión.
- **Operaciones:**
  - *Sigilo:* si te detectan llaman a la policía (alarma y refuerzos). Sin que te vean, el botín vale el doble.
  - *Asalto:* la alarma suena desde el principio, hay más guardias y más duros, pero entras con una granada y una C4 de más y la C4 revienta las puertas de seguridad.
  - *Mixta:* tú decides.
  Con la alarma sonando llegan refuerzos de la policía cada pocos segundos.
- **Escenarios:** oficinas (mesas con cajones, moqueta), almacén del puerto (estanterías y cajas), galería de arte (mármol, cuadros, peanas con piezas), banco (vestíbulo con mostrador y columnas, cámara con cajas de seguridad) y centro de datos (suelo técnico, filas de racks con LEDs, sala blindada). Cada uno tiene su botín: maletín, sacos de dinero, diamante, lingotes de oro o disco cifrado, que valen distinto.
- **La cámara blindada:** en bancos y centros de datos (y a veces en galerías) el botín está tras muros que no se rompen y una puerta de seguridad. Se abre de tres maneras:
  - con el código, que está en una nota en algún cajón, en la tarjeta de un supervisor (registra su cuerpo; al abatirlo verás «Lleva una tarjeta») o en la terminal de seguridad (6 s de hackeo);
  - hackeándola (18 s; si lo dejas, el progreso se guarda);
  - en asalto, con C4.
  Hackear pita y los guardias cercanos pueden oírlo.
- **Saqueo y bolsa:** cajones, estanterías, cuerpos, cajas de seguridad y racks dan dinero o munición. Todo va a la bolsa (el contador «$» del HUD), junto con lo que pagan las bajas, y se cobra al escapar: botín, saqueo, bonus de sala y bonus fantasma si nadie te vio.
- **El golpe y el tiempo:** la cuenta atrás corre desde que entras (entre 5 y 8 minutos según el tamaño, y uno más si hay cámara). Una flecha te guía al botín (o a la escalera si está en otra planta). Al cogerlo saltan las sirenas y empieza otra cuenta atrás para escapar. Si cualquiera de las dos llega a cero, te atrapa la policía.
- **Huida:** el vehículo te espera al otro lado del mapa, con faros y humo de escape. Según la misión es una furgoneta, una berlina, un todoterreno o un furgón blindado. Súbete con el botín.
- **Persecución:** en algunas misiones, al huir te persiguen coches (patrullas con sirena, todoterrenos y, más adelante, blindados) que intentan recuperar el botín: se ponen a tu lado, disparan y embisten. Mueves el coche de lado a lado con el stick izquierdo (o `A`/`D`), disparas con el derecho (con ayuda de apuntado) y las granadas caen a la carretera y se quedan atrás, hacia ellos. Aguanta hasta perderlos o derríbalos: cada coche paga.
- **Armas:** 10 armas: pistola, revólver, subfusil, escopeta, ballesta (casi muda), subfusil silenciado, fusil, escopeta automática, rifle de tirador y ametralladora ligera. Cada una tiene su retroceso: la dispersión crece al disparar seguido y al correr, y baja quieto y en sigilo.
- **Mejoras:** 8 por arma: silenciador, cargador ampliado, mira láser, cañón pesado, gatillo ligero, compensador, tambor y mira térmica (ves la silueta de los guardias hacia los que apuntas aunque estén a oscuras).
- **Munición:** 4 tipos por arma, que se compran una vez y se eligen en la tienda:
  - normal;
  - perforante: atraviesa escudos y un enemigo;
  - expansiva: +35 % de daño;
  - incendiaria: prende fuego.
  Es limitada: cada arma tiene cargador y reserva, y las cajas (metálicas, con su asa y cartuchos) la reponen.
- **Correr y aguante:** correr es mucho más rápido pero hace mucho ruido y gasta la barra de aguante. Si la vacías, vas cansado hasta recuperar un tercio.
- **Física:** los disparos y golpes empujan, los cuerpos salen despedidos y se deslizan, y las granadas vuelan en arco y rebotan en el suelo y las paredes.
- **Destrucción:** la C4 (empiezas con 2, se compran) se planta casi sin ruido y estalla cuando la detonas. Las granadas también abren paredes interiores y fachadas, no los muros de la cámara ni la valla. Las balas y el cuchillo rompen cajas y ventanas. Todo hace ruido.
- **Plantas:** algunos edificios tienen primera planta. Desde abajo apenas se intuye; al pisar la escalera subes y la planta baja queda apagada debajo. Cada planta tiene sus guardias, y los ruidos de la otra les llegan muy amortiguados.
- **Gráficos:**
  - El mapa se dibuja una vez por misión con texturas de suelo (moqueta, hormigón, parqué, mármol, suelo técnico, chapa de acero) y grano.
  - Muros con altura y sombras suaves proyectadas por árboles, estanterías, racks, columnas, coches y muros.
  - La luz de las lámparas va horneada con sombras y su color, en farolas, lámparas de pie y tubos fluorescentes.
  - Balas trazadoras, fogonazos, casquillos, impactos, explosiones con bola de fuego, onda, brasas, cascotes y humo.
- **Sonido:** sintetizado, con reverberación (más dentro que fuera) y panorama: pasos, ladridos, radios, la C4, cristales, muros que caen, sirenas, pitidos de hackeo, monedas al saquear y ambiente.
- **Visión cónica:** fuera de tu linterna, de un pequeño halo y de las lámparas todo está a oscuras y con niebla. Los guardias que no alumbras no se ven; solo te delatan sus fogonazos. Su cono de visión está pintado en el suelo (azul, ámbar, rojo), pero solo donde llega tu luz.
- **Aviso de dirección:** cuando un guardia te oye (ámbar) o te detecta (rojo), aparece una flecha junto a ti hacia donde está.
- **IA:** patrullas con esperas y cambios aleatorios. Al oír o ver algo pasan a *sospecha → investigar → registrar la zona* y vuelven más alerta. Avisan a los demás y los cadáveres que encuentran también los alertan.
- **Enemigos:**
  - guardia, pesado (escopeta) y élite (ráfagas);
  - perro: te huele a oscuras y corre más que tú;
  - francotirador: puesto fijo, apunta un segundo con láser;
  - escudo: para las balas de frente, salvo las perforantes;
  - el Alcaide: ametralladora, granadas y refuerzos a media vida.
- **Sigilo cuerpo a cuerpo:** el cuchillo elimina al instante a un guardia que no te ha detectado o está de espaldas, y las bajas silenciosas pagan +50 %.
- **Guardado:** la partida se guarda sola al entrar en cada misión y en la tienda. «Continuar» la retoma; «Nueva partida» pide confirmación. Siempre empiezas una misión con la vida llena, y si mueres la reintentas con el equipo con el que entraste.

## Pruebas

```
node test/smoke.js            # requiere Playwright con Chromium
SHOTS=capturas node test/smoke.js   # además guarda capturas
```

La prueba de humo comprueba:

- **Mapas:** en las 17 primeras misiones son recorribles en las dos plantas. El botín de una cámara solo se alcanza con la puerta abierta, y la salida nunca exige pasar por ella.
- **Menú y misiones:** menú → briefing → misión. Cada misión empieza con la vida llena y la cuenta atrás corre desde el principio.
- **Golpe y alarma:**
  - La salida está cerrada sin botín.
  - Al cogerlo salta la alarma, y si se acaba cualquiera de las dos cuentas te atrapan.
  - Lo saqueado se cobra al escapar.
- **Cámara del banco:** hackear la puerta y cancelar guarda el progreso. El código sale de la tarjeta del supervisor (registrando su cuerpo) o de la terminal, y con él se abre la puerta.
- **Persecución:** en la misión 4 te persiguen al huir. Las balas dañan sus coches y, al perderlos, pasas a la tienda.
- **Mundo y enemigos:**
  - Escalera, C4 (no estalla sola y abre la pared) y ventanas que se rompen.
  - Los 6 tipos de enemigo y el jefe.
  - El escudo para las balas de frente y el perro te huele a oscuras.
  - El aviso de dirección y la oscuridad fuera de tu luz.
  - La IA reacciona al ruido y a la vista, y el cuchillo elimina por la espalda.
- **Partida:**
  - Sticks táctiles y munición limitada.
  - Tienda, reintento, guardado y continuar.
  - Modo PC con ratón.
