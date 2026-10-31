# Apagón

Shooter táctico top-down para el navegador, en móvil o PC. Una campaña de 24 golpes con historia. Un coche te deja frente a oficinas, almacenes, galerías, bancos, joyerías, casinos, museos, centros de datos, un tren de mercancías o un yate. Entras de noche con una linterna de haz cónico, robas el botín, saqueas lo que encuentras y escapas en el coche de extracción antes de que llegue la policía (a veces con una persecución por carretera). Puedes ir en sigilo, a tiros o abriendo paredes. Entre misiones compras armas, mejoras, consumibles, habilidades y ropa.

Sin dependencias ni compilación: `index.html` + `game.js`.

## Jugar

- **En local:** abre `index.html` en el navegador o sirve la carpeta (`python3 -m http.server`) y entra desde el móvil con la IP del ordenador.
- **Publicado:** en GitHub, *Settings → Pages → Deploy from a branch* y elige la rama con el código y la carpeta `/`. En móvil se juega en horizontal; en PC con teclado y ratón, y la vista y el HUD se adaptan al tamaño de la pantalla.
- **Primera vez:** el botón «Tutorial» del menú enseña lo básico en un mapa pequeño, en diez pasos guiados.

## Android (APK)

`android/` tiene un envoltorio mínimo: una actividad con un WebView a pantalla completa y en horizontal que carga el mismo `index.html` y `game.js`. La partida se guarda igual, en el almacenamiento del WebView, y el botón atrás pausa. Se compila sin Gradle, solo con las herramientas del SDK (build-tools 34 y plataforma android-34) y Java:

```
keytool -genkeypair -keystore apagon.jks -alias apagon -keyalg RSA -keysize 2048 -validity 10000   # una vez
ANDROID_SDK=/ruta/al/sdk KEYSTORE=apagon.jks KS_PASS=... VERSION=1.3 CODE=4 android/build.sh   # → android/out/apagon.apk
```

Guarda el keystore y su contraseña. Para instalar una versión nueva encima de la anterior hay que firmarla con la misma clave y con un `CODE` mayor.

## Controles

| Táctil | Teclado / ratón | Acción |
|---|---|---|
| Stick izquierdo (poco recorrido) o botón Sigilo | `WASD` con el sigilo activado (`C` lo activa y lo desactiva) | Moverte en sigilo, sin ruido |
| Stick izquierdo (a fondo) | `WASD` | Caminar: los pasos se oyen |
| Stick izquierdo (más allá del borde) | `WASD` + `Mayús` | Correr: más rápido, mucho ruido y gasta aguante |
| Stick derecho | Ratón | Apuntar la linterna |
| Stick derecho hasta el borde | Clic izquierdo | Disparar |
| Usar (aparece al acercarte) | `Espacio` | Registrar, hackear, arrastrar y esconder cuerpos. Volver a pulsar cancela |
| Cuchillo | `E` / clic derecho | Ataque cuerpo a cuerpo casi silencioso; a los civiles los reduce sin matarlos |
| Granada | `G` | Se lanza en arco, rebota y estalla: abre paredes y se oye en todo el edificio |
| C4 | `B` | Primera pulsación: la plantas casi sin ruido. Segunda: la detonas |
| Moneda | `Q` | La lanzas hacia donde apuntas: al caer suena y los guardias cercanos van a mirar |
| Consumible | `H` | Usa vendas, botiquín, bebida energética o analgésicos; el botón muestra cuál y cuántos |
| Inhibidor | `J` | Ciega las cámaras cercanas 20 s, si lo compraste en la planificación |
| Linterna | `F` | Apagarla reduce tu visibilidad y lo que ves |
| Láser | `L` | Enciende o apaga la línea de la mira láser (también en Ajustes) |
| Objetivos | `O` / tocar la lista | Despliega o recoge la lista de objetivos |
| Recargar | `R` | Recarga (también es automática) |
| Recuadro del arma | `1`-`5`, rueda o `Tab` | Cambiar de arma |
| Pausa | `Esc` | Pausa, con acceso a Ajustes |

## Mecánicas

### Campaña e historia

- **24 misiones** con nombre (Polilla, Marea Baja, Cristal, Bóveda Norte, Destello, Doble o Nada, Faraón, Vía Muerta, Marea Alta, Gran Premio, Corona…). Cada una es más difícil: más guardias, de tipos más duros y en edificios más grandes.
- **Jefes:** el Alcaide (misión 8), el Coronel (16) y la Viuda (24). Después sigue el modo infinito, con contratos generados y un jefe más duro cada 8.
- **Historia:** antes de algunas misiones aparece una escena ilustrada (ciudad de noche, siluetas, lluvia). En ellas hablan Marta, tu contacto, y Darío Vela, el rival que trabaja para cada nuevo jefe y te vende una y otra vez. Cada escena sale una sola vez por partida.
- **Briefing:** nombre, escenario, operación, vehículo, objetivos y la **planificación del golpe**:
  - *Entrada:* puerta principal (gratis), alcantarilla (sales por una arqueta dentro del edificio) o tejado (bajas a la primera planta o por un tragaluz).
  - *Herramientas:* inhibidor de cámaras (2 usos), ganzúa electrónica (hackeas el doble de rápido y sin pitidos) y disfraz de guardia (te detectan mucho más despacio si no haces nada raro).
  - Lo pagado se descuenta del dinero y, si mueres, no se cobra otra vez al reintentar.
- **Resultados:** al escapar sale una pantalla con:
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
  - oficinas, almacén del puerto, galería de arte, banco y centro de datos;
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
- **Plantas:** algunos edificios tienen primera planta. Al pisar la escalera subes y la planta baja queda apagada debajo. Cada planta tiene sus guardias, y los ruidos de la otra les llegan muy amortiguados.
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

- **Ajustes,** desde el menú y la pausa: volumen de música y de efectos, vibración, sensibilidad de la mira y mira láser. Se guardan aparte de la partida.
- **Ranuras de guardado:** tres partidas independientes.
  - Cada una se guarda sola al entrar en cada misión y en la tienda.
  - «Continuar» retoma la ranura activa, y «Nueva partida» pide confirmación.
  - Si mueres, reintentas la misión con el equipo con el que entraste, y antes puedes pasar por la tienda.

### Gráficos y sonido

- **Mapa:** se hornea por misión con texturas de suelo, grano y la luz de las lámparas con sus sombras. Los muros tienen altura y sombras en dos capas: nítidas al pie y una penumbra larga y difuminada.
- **Personajes:** vistos desde arriba, con piernas que se mueven, brazos con el arma y chaleco, casco, gorra o máscara según el tipo. Los cadáveres quedan tendidos sobre un charco de sangre que se extiende, con salpicaduras alargadas y rastro.
- **Efectos:** balas trazadoras, fogonazos, casquillos que tintinean al caer y explosiones con bola de fuego, onda, brasas, cascotes y humo.
- **Sonido:** sintetizado, con reverberación y panorama.
- **Música:** también sintetizada.
  - En el menú, synthwave oscura.
  - En misión es adaptativa: tensa y contenida en sigilo, con percusión y bajo intensos cuando salta la alarma.

## Pruebas

```
node test/smoke.js                  # requiere Playwright con Chromium
SHOTS=capturas node test/smoke.js   # además guarda capturas
```

La prueba de humo comprueba:

- **Mapas:** las primeras misiones son recorribles en todas sus plantas. El botín de una cámara solo se alcanza con la puerta abierta, y la salida nunca exige pasar por ella.
- **Menú y misiones:**
  - La escena de historia sale antes de la primera misión.
  - El briefing.
  - La vida llena al empezar y la cuenta atrás desde que entras.
- **Golpe:**
  - Sin botín no hay salida, y con él viene el coche de extracción.
  - Los objetivos salen en los resultados.
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
  - Escalera, C4 y ventanas.
  - Todos los tipos de enemigo, el escudo y el perro.
  - El aviso de dirección y la oscuridad.
  - La IA reacciona, y el cuchillo elimina por la espalda.
- **Jefe:** con él vivo la salida está bloqueada; al vencerlo sale la pantalla de victoria.
- **Partida:**
  - Sticks táctiles y munición limitada.
  - Consumibles: las vendas curan 25.
  - Ajustes y ranuras.
  - Tienda, reintento, guardado y continuar.
  - Una partida corrupta no se ofrece.
- **Tutorial:** se completan los diez pasos y vuelve al menú con el aviso.
- **PC:** sin botones táctiles, el clic dispara y se apunta hacia el ratón.
