# Apagón

Shooter táctico en primera persona (3D) para el navegador, en móvil o PC. Una campaña de 24 golpes con historia. Un coche te deja frente a oficinas, almacenes, galerías, bancos, joyerías, casinos, museos, centros de datos, un tren de mercancías o un yate. Entras de noche, viéndolo todo con tus ojos y con una linterna de haz cónico, robas el botín, saqueas lo que encuentras y escapas en el coche de extracción antes de que llegue la policía (a veces con una persecución por carretera). Puedes ir en sigilo, a tiros o abriendo paredes. Entre misiones compras armas, mejoras, consumibles, habilidades y ropa.

Sin compilación: `index.html` + `game.js`, y [Three.js](https://threejs.org) r149 incluido en `vendor/three.min.js` (licencia MIT en `vendor/THREE-LICENSE`), así que funciona sin conexión. Si el navegador no tiene WebGL, el juego se queda en la vista cenital de las versiones anteriores.

## Jugar

- **En local:** abre `index.html` en el navegador o sirve la carpeta (`python3 -m http.server`) y entra desde el móvil con la IP del ordenador.
- **Publicado:** en GitHub, *Settings → Pages → Deploy from a branch* y elige la rama con el código y la carpeta `/`. En móvil se juega en horizontal; en PC con teclado y ratón (al hacer clic, el ratón queda capturado para mirar; `Esc` lo suelta y pausa), y la vista y el HUD se adaptan al tamaño de la pantalla.
- **Pantallas:** al abrir hay una pantalla de carga (el nombre se enciende como un fluorescente). En móvil en horizontal, el menú, el briefing y los resultados se reparten en dos columnas para caber sin desplazarse.
- **Primera vez:** el botón «Tutorial» del menú enseña lo básico en un mapa pequeño, en diez pasos guiados.

## Android (APK)

`android/` tiene un envoltorio mínimo: una actividad con un WebView a pantalla completa y en horizontal que carga el mismo `index.html`, `game.js` y `vendor/three.min.js`. La partida se guarda igual, en el almacenamiento del WebView, y el botón atrás pausa. Se compila sin Gradle, solo con las herramientas del SDK (build-tools 34 y plataforma android-34) y Java:

```
keytool -genkeypair -keystore apagon.jks -alias apagon -keyalg RSA -keysize 2048 -validity 10000   # una vez
ANDROID_SDK=/ruta/al/sdk KEYSTORE=apagon.jks KS_PASS=... VERSION=2.1 CODE=9 android/build.sh   # → android/out/apagon.apk
```

Guarda el keystore y su contraseña. Para instalar una versión nueva encima de la anterior hay que firmarla con la misma clave y con un `CODE` mayor.

## Controles

Hay tres formas de jugar: pantalla táctil, teclado y ratón, o mando. El juego cambia solo según lo último que toques, y los botones táctiles se ocultan con teclado o mando. Te mueves hacia donde miras: el stick o `WASD` van adelante, atrás y de lado. Con el sigilo activado, además te agachas.

| Acción | Táctil | Teclado / ratón | Mando (por defecto) |
|---|---|---|---|
| Moverte en sigilo, sin ruido | Stick izquierdo con poco recorrido, o botón Sigilo | `WASD` con el sigilo activado (`C`) | Stick izquierdo con poco recorrido, o `B` para fijar el sigilo |
| Caminar (los pasos se oyen) | Stick izquierdo a fondo | `WASD` | Stick izquierdo a fondo |
| Correr (más rápido, mucho ruido, gasta aguante) | Stick izquierdo más allá del borde | `WASD` + `Mayús` | Pulsar `L3` (se apaga al pararte) |
| Mirar (y apuntar la linterna) | Arrastrar en la mitad derecha de la pantalla | Ratón (o `←` `→` para girar) | Stick derecho |
| Disparar | Botón rojo Disparar (si arrastras desde él, también miras) | Clic izquierdo | `RT` |
| Apuntar con la mira: zum, mucha más precisión y andas más despacio (los rifles de tirador, con mira telescópica) | Botón Apuntar (se activa y se desactiva) | Mantener el clic derecho | Mantener `LT` |
| Usar: registrar, hackear, arrastrar y esconder cuerpos (volver a pulsar cancela) | Botón Usar (aparece al acercarte) | `Espacio` | `A` |
| Cuchillo: casi silencioso; a los civiles los reduce sin matarlos | Cuchillo | `E` | `RB` |
| Granada: vuela en arco, rebota, abre paredes | Granada | `G` | `LB` |
| C4: plantar (casi sin ruido) y, la segunda vez, detonar | C4 | `B` | Cruceta `↑` |
| Moneda: la lanzas y los guardias van a mirar donde cae | Ruido | `Q` | Cruceta `←` |
| Consumible: vendas, botiquín, bebida o analgésicos | Botón del botiquín | `H` | Cruceta `↓` |
| Linterna | Botón Linterna | `F` | Cruceta `→` |
| Recargar (también es automática) | Recargar | `R` | `X` |
| Cambiar de arma | Recuadro del arma | `1`-`5`, rueda o `Tab` | `Y` |
| Activar o desactivar el sigilo | Botón Sigilo | `C` | `B` |
| Láser de la mira | Ajustes | `L` | Sin botón por defecto (se puede asignar) |
| Inhibidor de cámaras (si lo compraste) | Botón del inhibidor | `J` | `R3` (pulsar el stick derecho) |
| Lista de objetivos | Tocar la lista | `O` | `Select` / `View` |
| Pausa | Botón Pausa | `Esc` | `Start` / `Menu` |

**Ayuda de apuntado:** en táctil y con mando, al disparar la mira se deja llevar un poco hacia el guardia iluminado más cercano. La granada llega más lejos cuanto más arriba mires.

**En la persecución:** el stick derecho (o el ratón) mueve la mira y `RT` (o el clic) dispara. Con el mando y en táctil hay ayuda de apuntado: la mira se deja llevar hacia el perseguidor más cercano. El stick izquierdo (o `WASD`) le dice al conductor que cambie de carril, acelere o frene, y la granada (`LB` o `G`) vuela hasta el punto bajo la mira.

**Mando:**
- Vale cualquier mando con la distribución estándar del navegador (Xbox, PlayStation, Switch Pro y la mayoría de mandos Bluetooth o USB). Los nombres de la tabla son los de Xbox; en PlayStation, `A`/`B`/`X`/`Y` son ✕/○/□/△, `LB`/`RB` son L1/R1 y `LT`/`RT` son L2/R2.
- **Reasignar botones:** en Ajustes → «Botones del mando» eliges una acción y pulsas en el mando el botón que quieras. Si ese botón ya tenía otra acción, se intercambian, así que ninguna se queda sin botón. «Restablecer» vuelve a la distribución de la tabla. La asignación se guarda con los ajustes, y los avisos del juego («Usar [A]», la ayuda de la persecución) muestran los botones que hayas elegido. Los menús siempre se manejan con la cruceta, `A` y `B`, para que no puedas quedarte atascado.
- Se detecta solo: conéctalo y pulsa cualquier botón. Arriba aparece «Mando conectado» con su nombre. Si se desconecta en plena misión, el juego se pausa.
- En los menús, la cruceta o el stick izquierdo mueven el foco (marcado en amarillo), `A` acepta y `B` vuelve. En Ajustes, `←`/`→` mueven los deslizadores. En la pantalla de carga y en los resultados, `A` adelanta la animación.
- Vibra con los golpes y las explosiones si el mando lo admite y la vibración está activada en Ajustes.
- En el APK de Android también funciona, por USB OTG o Bluetooth.

## Mecánicas

### Campaña e historia

- **24 misiones** con nombre (Polilla, Marea Baja, Cristal, Bóveda Norte, Destello, Doble o Nada, Faraón, Vía Muerta, Marea Alta, Gran Premio, Corona…). Cada una es más difícil: más guardias, de tipos más duros y en edificios más grandes.
- **Jefes:** el Alcaide (misión 8), el Coronel (16) y la Viuda (24). Después sigue el modo infinito, con contratos generados y un jefe más duro cada 8.
- **Historia:** antes de algunas misiones aparece una escena ilustrada (ciudad de noche, siluetas, lluvia). En ellas hablan Marta, tu contacto, y Darío Vela, el rival que trabaja para cada nuevo jefe y te vende una y otra vez. Cada escena sale una sola vez por partida.
- **Briefing:** nombre, escenario, operación, vehículo, objetivos y la **planificación del golpe**:
  - *Entrada:* puerta principal (gratis), alcantarilla (sales por una arqueta dentro del edificio) o tejado (bajas a la primera planta o por un tragaluz).
  - *Herramientas:* inhibidor de cámaras (2 usos), ganzúa electrónica (hackeas el doble de rápido y sin pitidos) y disfraz de guardia (te detectan mucho más despacio si no haces nada raro).
  - Lo pagado se descuenta del dinero y, si mueres, no se cobra otra vez al reintentar.
- **Resultados:** al escapar, la escena se oscurece y la ficha va apareciendo: objetivos uno a uno, cifras que cuentan, estrellas, y al final se estampa el rango con un golpe (tocar la ficha lo adelanta). Muestra:
  - rango (S, A, B, C) y estrellas (una por la misión y una por cada objetivo secundario);
  - el desglose del dinero;
  - la puntuación, que guarda tu mejor marca por misión.

### Operaciones y alerta

- **Operaciones:**
  - *Sigilo:* si alguien da el aviso, la policía llega enseguida. Sin que nadie te vea, el botín vale el doble.
  - *Asalto:* la alarma suena desde el principio, la policía llega pronto y hay más guardias. A cambio llevas granadas y C4 de más, y la C4 revienta las puertas de seguridad.
  - *Mixta:* tú decides. Si dan el aviso, la policía tarda algo más.
- **Niveles de alerta,** en el HUD: *tranquilo* → *sospechas* (alguien oyó o vio algo) → *policía en N s* (han dado el aviso) → *policía en la zona*. Un guardia que te ve tarda unos segundos en avisar por radio: si lo eliminas antes, no llega a hacerlo.
- **Policía:**
  - Llega con retraso: más en mixta, menos en asalto, y menos cuanto más avanzas y más civiles caen.
  - Viene en coches patrulla con sirena que paran en la calle.
  - Los policías se distinguen de los guardias por el uniforme azul y la estrella dorada.
  - Después llegan refuerzos cada pocos segundos, también agentes de asalto con casco.
- **Cuándo se alertan (realista):**
  - En una entrada a la fuerza (asalto), la alarma ya ha saltado: todos van a por ti.
  - **Lugares públicos** (banco, oficinas, galería, joyería, casino, museo, la fiesta del yate): puedes pasear por la zona pública como un cliente más. Eso es la calle, el patio y lo que se alcanza por la puerta principal sin cruzar puertas interiores, como el vestíbulo. Nadie te detecta ahí, y las cámaras no te graban como intruso.
  - **Zona restringida:** tras las puertas interiores, las puertas de servicio de la fachada, la primera planta y la cámara. Si un guardia te ve, primero te echa («¡Eh! ¡Aquí no puede estar!») y, si sigues, te ataca.
  - **Delito a la vista,** en cualquier zona: disparar, acuchillar, apuntar a alguien con la mira, registrar, hackear, arrastrar un cuerpo o cargar con el botín. Los guardias atacan enseguida y los civiles huyen a llamar a la policía. Un cuerpo a la vista sigue dando la alerta.
  - **Recintos cerrados de noche** (almacén, centro de datos, tren): dentro de la valla todo es restringido.
  - El HUD indica en qué zona estás, y el minimapa tiñe de rojo lo restringido.
- **El botín no siempre hace saltar la alarma:** en bancos, galerías, centros de datos, joyerías, museos y casinos tiene sensor y al cogerlo suena. En el resto, solo suena si te detectan.

### Objetivos

- **Principales:** coger el botín y escapar; en las misiones de jefe, acabar con él.
- **Secundarios:** pagan extra. Por ejemplo: que no salte la alarma, ningún civil muerto, terminar en menos de N minutos, abatir a N enemigos, saquear una cantidad, abrir la cámara con el código o que nadie te detecte.
- Salen en el briefing y en una lista plegable en pantalla que marca lo hecho, lo fallado y lo pendiente.

### Calle, vehículos y civiles

- **Calle:** delante de los edificios hay una calle con aceras, farolas, coches aparcados y peatones.
- **Vehículos:** un coche te deja al principio y se va. El coche de extracción (furgoneta, berlina, todoterreno o furgón blindado, según la misión) viene a buscarte cuando tienes el botín y te espera con el motor en marcha.
- **Civiles:**
  - En los lugares públicos (bancos, galerías, oficinas, casinos, joyerías, museos y yates) hay empleados y clientes.
  - Si te ven armado o ven un cuerpo, huyen y llaman a la policía al cabo de unos segundos.
  - Con el cuchillo los reduces sin matarlos y quedan maniatados en el suelo, aunque si alguien los encuentra también da el aviso.
  - Matarlos adelanta a la policía y se descuenta del pago.
- **Cuerpos:** cualquiera que vea un cuerpo, sea guardia, policía o civil, da la alerta. Los cuerpos ya registrados se pueden **arrastrar** (vas más despacio y dejas rastro) y **esconder** en setos, contenedores, cajas y estanterías.

### Sigilo

- **Cámaras de seguridad:** barren de lado a lado con su cono pintado en el suelo. Si te graban un rato o graban un cuerpo, seguridad avisa a la policía. Se rompen de un tiro, se apagan desde la terminal y el inhibidor las ciega un rato.
- **Puertas normales:** se abren al acercarte tú o un guardia y se cierran solas. Cerradas, cortan la vista.
- **Distracciones:** la moneda atrae a los guardias cercanos al punto donde cae.
- **Visión cónica:**
  - Fuera de tu linterna, de un pequeño halo y de las lámparas, todo está a oscuras y con niebla.
  - Los guardias que no alumbras no se ven; solo te delatan sus fogonazos.
  - Su cono de visión está pintado en el suelo (azul, ámbar, rojo), pero solo donde llega tu luz.
- **Aviso de dirección:** cuando un guardia te oye (ámbar) o te detecta (rojo), aparece junto a ti una flecha hacia donde está.
- **IA:**
  - Patrullas con esperas y cambios aleatorios.
  - Al oír o ver algo pasan a *sospecha → investigar → registrar la zona* y luego vuelven más alerta.
  - Avisan a los demás.
  - Con lluvia ven menos fuera y oyen menos tus pasos.
- **Cuchillo:** elimina al instante a un guardia que no te ha detectado o está de espaldas. Las bajas silenciosas pagan +50 %.

### Escenarios

- **Lugares:**
  - oficinas (recepción con mostrador y sofás, despachos con puestos y sillas, salas de reuniones, de descanso y almacenes), almacén del puerto, galería de arte, banco (vestíbulo con ventanillas, columnas y bancos a lo ancho de la fachada) y centro de datos;
  - joyería: vitrinas y parqué;
  - casino: moqueta, mesas de juego y tragaperras;
  - museo: salas con piezas en peanas;
  - tren de mercancías: vagones en fila sobre las vías;
  - yate: cubierta de teca rodeada de agua.
- **Botín:** maletín, sacos de dinero, diamante, lingotes, disco cifrado, joyas, maletines de efectivo, máscara de oro, cuadro u oro del vagón blindado. Cada uno vale distinto.
- **La cámara blindada:** en bancos y centros de datos (y a veces en galerías), el botín está tras muros que no se rompen y una puerta de seguridad. Se abre de tres maneras:
  - con el código, que está en una nota en un cajón, en la tarjeta de un supervisor o en la terminal de seguridad;
  - hackeándola, y el progreso se guarda si lo dejas a medias;
  - en asalto, con C4.
  Hackear pita, y los guardias cercanos pueden oírlo.
- **Interiores:** cada sala tiene su uso, su suelo, el acabado de sus paredes (madera en los vestíbulos, papel pintado en las salas, paneles en los servidores, bloques en los almacenes) y su luz (plafones en el techo, una lámpara de pie o a oscuras). Hay cuadros colgados, sillas en los puestos y monitores encendidos.
- **Plantas y escalera:** algunos edificios tienen primera planta. La escalera es un tramo recto que se sube andando: la vista sube contigo, a mitad de tramo pasas a la otra planta y arriba hay un hueco de verdad con barandilla. Solo se entra y se sale por sus extremos. Cada planta tiene sus guardias, y los ruidos de la otra les llegan muy amortiguados.
- **Saltar por la ventana:** rompe una ventana de la primera planta que dé a la calle o al césped y salta. Caes abajo, te haces algo de daño (10) y el golpe se oye.
- **Lluvia:** algunas misiones son de noche lluviosa, con:
  - cortinas de lluvia y salpicaduras donde hay luz;
  - charcos que reflejan farolas y linterna;
  - el sonido de la lluvia, más fuerte fuera.

### Enemigos y jefes

- **Guardias:** guardia, pesado (escopeta) y élite (ráfagas).
- **Perro:** te huele a oscuras y corre más que tú.
- **Francotirador:** puesto fijo; apunta un segundo con láser.
- **Escudo:** para las balas de frente, salvo las perforantes.
- **Táser:** corre hacia ti y te aturde un momento.
- **Dron:** te sigue a distancia y avisa a los guardias de dónde estás; no dispara.
- **Agente encubierto:** parece un civil más hasta que te ve; entonces saca la pistola.
- **Policía y agente de asalto:** llegan con la alarma.
- **El Alcaide:** ametralladora, granadas y refuerzos a media vida.
- **El Coronel:** su armadura aguanta la mitad del daño de frente, y a media vida llama a drones y soldados.
- **La Viuda:** francotiradora que cambia de puesto en su azotea tras cada disparo.

### Huida y persecución

En algunas misiones, al huir te persiguen para recuperar el botín. Vas asomado por el techo del coche mirando hacia atrás, en una vista en perspectiva de noche, y ves a los perseguidores de frente.

- **Perseguidores:**
  - motos que zigzaguean, patrullas con sirena, todoterrenos, pickups con un tirador en la caja, furgones SWAT que embisten y blindados;
  - desde la misión 5, un helicóptero con foco y ametralladora;
  - desde la misión 12, a media persecución, el **Rinoceronte**: un camión blindado con torreta que embiste.
- **Carretera:** curvas, túneles iluminados y puentes. Hay controles policiales y pinchos que el conductor intenta esquivar, y a los perseguidores les cuesta más.
- **Tu vehículo tiene vida:** el blindado aguanta más y la berlina menos. Las balas y los choques lo van dejando humeante, y si llega a cero se acaba.
- **Disparar:** el stick derecho mueve la mira y, con el dedo puesto, dispara sola cuando hay un perseguidor debajo. En PC, con el ratón y el clic. La granada vuela hasta el punto de la carretera bajo la mira y estalla al tocar un coche.
- **Conducir:** con el stick izquierdo (o `WASD`) le indicas al conductor que cambie de carril, acelere o frene.
- **Derribarlos:** a tiros, con granadas, contra el quitamiedos o haciéndolos chocar con el tráfico, que paga más.
- También puedes usar consumibles. Si caes, se repite solo la persecución.

### Equipo y progreso

- **Armas:** 14 en total: pistola, pistola automática, revólver, subfusil, escopeta, ballesta (casi muda), subfusil silenciado, carabina de ráfaga, fusil, escopeta automática, rifle de tirador, lanzagranadas, ametralladora ligera y rifle antimaterial. Cada una tiene su retroceso.
- **Mejoras:** 8 por arma: silenciador, cargador ampliado, mira láser, cañón pesado, gatillo ligero, compensador, tambor y mira térmica.
- **Munición:** 4 tipos (normal, perforante, expansiva e incendiaria). Es limitada y las cajas la reponen.
- **Consumibles** (nada mágico):
  - vendas: +25 de vida poco a poco;
  - botiquín: +60 de vida;
  - bebida energética: aguante lleno durante 20 s;
  - analgésicos: −30 % de daño durante 25 s.
  Se compran en la tienda o aparecen en cajones, estanterías y en el bolsillo de algunos guardias. Puedes llevar 5 de cada uno.
- **Habilidades permanentes,** con 3 niveles cada una: manos rápidas (registrar y hackear), pies ligeros (menos ruido), fondo físico (aguante), pulso firme (dispersión), piel dura (daño recibido) y contactos (la policía tarda más).
- **Estilo:** ropa (táctico, urbano, bosque, noche, rojo), máscara (pasamontañas, hockey, calavera, payaso) y acabado del arma (desierto, bosque, urbano, oro). Todo se ve en el personaje.
- **Correr y aguante:** correr es mucho más rápido, pero hace mucho ruido y gasta aguante. Si lo vacías, vas cansado hasta recuperar un tercio.
- **Física y destrucción:**
  - Los disparos empujan, los cuerpos salen despedidos y las granadas rebotan.
  - La C4 y las granadas abren paredes interiores y fachadas, pero no los muros de la cámara ni la valla.
  - Las balas y el cuchillo rompen cajas y ventanas.
  - Todo hace ruido.

### Ajustes y guardado

- **Ajustes,** desde el menú y la pausa: volumen de música y de efectos, sensibilidad de la mira, campo de visión, calidad gráfica (alta, media o baja: la resolución del 3D, para móviles lentos), sombras de la linterna, vibración y mira láser. Se guardan aparte de la partida.
- **Ranuras de guardado:** tres partidas independientes.
  - Cada una se guarda sola al entrar en cada misión y en la tienda.
  - «Continuar» retoma la ranura activa, y «Nueva partida» pide confirmación.
  - Si mueres, reintentas la misión con el equipo con el que entraste, y antes puedes pasar por la tienda.

### Gráficos y sonido

- **Primera persona en 3D (Three.js):** la partida se sigue simulando en el plano (casillas, visión, ruido, balas, IA); la vista la convierte en un mundo 3D.
  - **Mundo:** muros, ventanas con cristal, puertas de seguridad, mesas, estanterías, racks, cajas de seguridad, contenedores, setos y árboles salen del mapa con su altura y sus texturas. Las fachadas son de ladrillo por fuera y de yeso por dentro, y hay techos y escaleras con su hueco.
  - **Destrucción:** el mapa se construye por trozos, y al romper una pared o una ventana solo se rehace el trozo afectado.
  - **Suelo:** usa el mismo horneado de siempre, así que la sangre, los casquillos, los cascotes y los charcos quedan pintados en él.
  - **Luz:** la de las lámparas se hornea en suelos, paredes, techos y personas. La linterna (con sombras, si las activas), el halo, los fogonazos, las explosiones, el brillo del botín y las sirenas son luces de verdad. Fuera, cielo con estrellas, luna, niebla y la silueta de la ciudad.
  - **Personas:** guardias, policías, civiles, perros, drones y jefes con formas redondeadas (cabeza esférica, tronco que se estrecha y brazos y piernas en cápsula), con piernas que andan, brazos que sujetan el arma, gorra, casco, capucha, máscara o pelo. Los cadáveres quedan tendidos sobre su charco. Arriba de la cabeza, `?` (sospecha) y `!` (te han visto), solo si los ves.
  - **Arma en primera persona:** cada arma con su forma (silenciador y láser incluidos) y con retroceso, balanceo al andar, recarga, cambio de arma, cuchillo y lanzamiento. Al apuntar, el arma va al centro con el alza delante del ojo; con los rifles de tirador se ve la mira telescópica, con su retícula.
  - **HUD:** mira que se abre con la dispersión y marca los impactos. Minimapa que gira contigo (muros, objetivo, tu ruido, y los guardias y cámaras que ves con su cono). Rombo con la distancia al objetivo (o flecha si queda detrás) y avisos alrededor de la mira hacia quien te oye o te ve.
  - **Efectos:** trazadoras, fogonazos, casquillos, chispas, humo, bola de fuego y lluvia que solo cae donde no hay techo. Los conos de visión de guardias y cámaras se ven en el suelo cuando les da tu luz.
  - **Menú:** de fondo, la cámara recorre despacio los pasillos de un edificio.
- **Persecución:** sigue en su perspectiva propia, asomado por el techo del coche.
- **Sonido:** sintetizado, con reverberación y panorama.
- **Música:** también sintetizada.
  - En el menú, synthwave oscura.
  - En misión es adaptativa: tensa y contenida en sigilo, con percusión y bajo intensos cuando salta la alarma.

## Pruebas

```
node test/smoke.js                  # requiere Playwright con Chromium
SHOTS=capturas node test/smoke.js   # además guarda capturas
node test/pad.js                    # el mando, con un gamepad simulado
```

Las pruebas dibujan el 3D en calidad baja (el WebGL por software de Chromium sin pantalla va justo de relleno; la lógica es la misma).

`test/pad.js` comprueba que se detecta el mando, que se navega por los menús con la cruceta, que se mueve hacia delante, gira la vista y dispara, el sigilo con `B`, la pausa con `Start`, los deslizadores de Ajustes, la reasignación de botones (con intercambio y guardado) y la mira y el disparo en la persecución.

La prueba de humo comprueba:

- **Mapas:** las primeras misiones son recorribles en todas sus plantas. El botín de una cámara solo se alcanza con la puerta abierta, y la salida nunca exige pasar por ella.
- **Menú y misiones:**
  - La pantalla de carga y el menú, que cabe sin desplazarse en un móvil en horizontal.
  - La escena de historia sale antes de la primera misión.
  - El briefing.
  - La vida llena al empezar y la cuenta atrás desde que entras.
- **Golpe:**
  - Sin botín no hay salida, y con él viene el coche de extracción.
  - Los objetivos salen en los resultados, que se van mostrando hasta que cae el sello.
  - Lo saqueado se cobra al escapar.
- **Sigilo y civiles:**
  - Puertas, cámaras, cuerpos que alertan y la moneda.
  - Los civiles llaman a la policía, que llega en coche.
- **Planificación:** el inhibidor se paga en el briefing y llega a la misión.
- **Cámara del banco:** hackeo con el progreso guardado, y el código del supervisor o de la terminal.
- **Persecución:**
  - Te persiguen al huir.
  - La mira dispara sola y daña.
  - La granada estalla al tocar un coche y los pinchos dañan tu vehículo.
  - Caer repite solo la persecución, y al perderlos pasas a la tienda.
- **Armas y mundo:**
  - Ráfaga de la carabina y lanzagranadas que abre paredes.
  - Escalera que se sube andando (y por el lado no se entra), saltar por una ventana rota del primer piso, C4 y ventanas.
  - Zonas del banco: en la pública un guardia no te detecta; en la restringida te avisa y luego ataca. Los civiles no se asustan por verte, pero huyen si disparas.
  - Todos los tipos de enemigo, el escudo y el perro.
  - El aviso de dirección. Oscuridad en 3D: se lee el píxel de un guardia en el lienzo WebGL, que apenas se ve sin luz y se ilumina con la linterna.
  - La IA reacciona, y el cuchillo elimina por la espalda.
- **Jefe:** con él vivo la salida está bloqueada; al vencerlo sale la pantalla de victoria.
- **Partida:**
  - Que el juego arranca en 3D. Controles táctiles: el stick avanza hacia donde miras, arrastrar a la derecha gira la vista y el botón dispara. Munición limitada.
  - Consumibles: las vendas curan 25.
  - Ajustes y ranuras.
  - Tienda, reintento, guardado y continuar.
  - Una partida corrupta no se ofrece.
- **Tutorial:** se completan los diez pasos y vuelve al menú con el aviso.
- **PC:** sin botones táctiles, el ratón gira la vista, el clic dispara y el clic derecho apunta (con zum).
