# Apagón

Shooter táctico top-down para el navegador, en móvil o PC. Cada sala es un golpe: te cuelas en un edificio a oscuras con una linterna de haz cónico, robas el botín y escapas antes de que llegue la policía. Puedes ir en sigilo, a tiros o abriendo paredes, y entre salas compras y mejoras armas.

Sin dependencias ni compilación: `index.html` + `game.js`.

## Jugar

- **En local:** abre `index.html` en el navegador o sirve la carpeta (`python3 -m http.server`) y entra desde el móvil con la IP del ordenador.
- **Publicado:** en GitHub, *Settings → Pages → Deploy from a branch* y elige la rama con el código y la carpeta `/`. En móvil se juega en horizontal; en PC con teclado y ratón, y la vista y el HUD se adaptan al tamaño de la pantalla.

## Controles

| Táctil | Teclado / ratón | Acción |
|---|---|---|
| Stick izquierdo (poco recorrido) | `WASD` + `Mayús` | Moverte en sigilo, sin ruido |
| Stick izquierdo (a fondo) | `WASD` | Correr: los pasos se oyen |
| Stick derecho | Ratón | Apuntar la linterna |
| Stick derecho hasta el borde | Clic izquierdo | Disparar |
| Cuchillo | `E` / clic derecho | Ataque cuerpo a cuerpo casi silencioso |
| Granada | `G` | Explosión de área que también abre paredes; se oye en todo el edificio |
| Brecha | `B` | Carga que a los 2 s abre un hueco en la pared o caja de enfrente; mucho ruido |
| Ruido | `Q` | Atrae a los guardias hacia ti |
| Linterna | `F` | Apagarla reduce tu visibilidad y lo que ves |
| Recargar | `R` | Recarga (también es automática) |
| Recuadro del arma | `1`-`5`, rueda o `Tab` | Cambiar de arma |
| Pausa | `Esc` | Pausa |

## Mecánicas

- **El golpe:** el botín brilla en la sala más profunda del edificio y una flecha en el borde de la pantalla te guía. La salida (la furgoneta, al otro lado) está cerrada hasta que lo coges. Al cogerlo saltan las sirenas y empieza una cuenta atrás que depende de lo lejos que esté la salida; si llega a cero, te atrapa la policía. La mitad de los guardias corre a la cámara del botín y la otra mitad a cortarte la salida.
- **Destrucción:** las cargas de brecha (empiezas con 2, se compran) y las granadas abren paredes interiores y fachadas; la valla del mapa no se rompe. Las balas y el cuchillo rompen cajas y ventanas. Todo hace ruido, así que atajar tiene precio.
- **Mapas:** un patio exterior (aparcamiento con coches, árboles, setos y farolas) rodea un edificio con fachada, ventanas y salas amuebladas según su uso: oficinas con mesas, almacenes con estanterías y cajas, salas con mesa grande y plantas. Unas salas están iluminadas de lleno y otras a oscuras. Las mesas y los coches cortan el paso pero no la vista ni las balas; las ventanas dejan ver y se rompen; en los setos no te ven.
- **Visión cónica:** fuera de tu linterna (con oclusión por muros), de un pequeño halo a tu alrededor y de las lámparas todo está a oscuras, y una niebla que deriva enturbia lo iluminado. Los guardias que no alumbras no se ven, ni sus avisos (`?`, `!`) ni sus ruidos; solo te delatan sus fogonazos al disparar.
- **Cono de los guardias:** su campo de visión está pintado en el suelo (azul patrulla, ámbar sospecha, rojo combate), pero solo se ve donde llega tu luz. Se encoge cuando te mueves en sigilo y a oscuras, porque así te ven desde menos lejos.
- **Aviso de dirección:** cuando un guardia te oye (ámbar) o te detecta (rojo), aparece una flecha junto a ti hacia donde está. Marca la dirección de ese momento, no lo sigue.
- **Visibilidad:** el medidor sube con la linterna encendida, bajo una lámpara, al disparar sin silenciador y al correr. Dispara a las lámparas para crear sombras.
- **Ruido:** pasos al correr, disparos, impactos de bala, cristales, el botón de ruido y las explosiones generan ondas visibles. Los guardias que las oyen (las paredes amortiguan) se vuelven a mirar (`?`) o acuden corriendo.
- **IA de patrulla:** cada guardia recorre su ruta con esperas, miradas y cambios de sentido aleatorios. Al oír o ver algo pasa a *sospecha → investigar → registrar la zona* y luego vuelve con una patrulla nueva y más alerta. Si te detecta (`!`) avisa a los demás. Los cadáveres que encuentran también los alertan.
- **Sigilo cuerpo a cuerpo:** el cuchillo elimina al instante a un guardia que no te ha detectado o que está de espaldas. Las bajas silenciosas pagan +50 %, y cruzar una sala sin ser detectado da un bonus *fantasma*.
- **Enemigos:**
  - *Guardia, pesado (escopeta) y élite (ráfagas):* la base.
  - *Perro* (desde la sala 2): te huele de cerca aunque vayas en sigilo y a oscuras, oye el doble, corre más que tú y muerde. No suelta munición.
  - *Francotirador* (desde la sala 3): no deja su puesto; cono largo y estrecho. Al detectarte apunta un segundo (flecha roja, láser visible solo con luz) y dispara un tiro pesado; si corres en perpendicular, falla.
  - *Escudo* (desde la sala 3): para las balas que le llegan de frente y gira despacio; rodéalo, lánzale una granada o apuñálalo por la espalda.
- **Jefe final: el Alcaide** (sala 8): una arena con columnas y lámparas, con la salida bloqueada hasta que cae. Lanza ráfagas de ametralladora y granadas, y a media vida pide refuerzos. El cuchillo por la espalda le quita mucho, pero no lo remata. Al vencerlo, pantalla de victoria; puedes seguir en modo infinito con un jefe más duro cada 8 salas.
- **Munición limitada:** cada arma tiene cargador y reserva. Las cajas de munición (algunas repartidas por el mapa y otras que sueltan los guardias) reponen la reserva de todas tus armas, y en la tienda también se compra.
- **Guardado:** la partida se guarda sola en el navegador al entrar en cada sala y en la tienda. En el menú, «Continuar» la retoma; «Nueva partida» pide confirmación antes de borrarla.
- **Progresión:** cada sala se genera al azar y es más grande y con más enemigos que la anterior. Entre salas hay tienda: 5 armas, 5 mejoras por arma (silenciador, cargador, láser, cañón, gatillo), munición, granadas, botiquines y blindaje. Si mueres reintentas la sala con el equipo con el que entraste.

## Pruebas

```
node test/smoke.js            # requiere Playwright con Chromium
SHOTS=capturas node test/smoke.js   # además guarda capturas
```

Comprueba que los mapas generados son recorribles (también el botín), que la salida está cerrada sin botín, que al cogerlo salta la alarma y que si se acaba el tiempo te atrapan, que una carga abre una pared, que una bala rompe una ventana, que aparecen los 6 tipos de enemigo y el jefe en la sala 8, que el escudo para las balas de frente, que el perro te huele a oscuras, que la salida sigue bloqueada mientras vive el jefe, que oír un ruido tuyo genera el aviso de dirección, que dibujar un fogonazo casi apagado no falla (congelaba el juego), que un guardia fuera de tu luz queda negro, los sticks táctiles, la munición limitada, la reacción de la IA al ruido y a la vista, la eliminación por la espalda, la tienda, el reintento, el guardado y continuar, y el modo PC con ratón.
