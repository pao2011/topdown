# Apagón

Shooter táctico top-down para el navegador, en móvil o PC. Cruzas edificios a oscuras sala a sala con una linterna de haz cónico. Puedes ir en sigilo o a tiros, y entre salas compras y mejoras armas.

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
| Granada | `G` | Explosión de área, se oye en todo el edificio |
| Ruido | `Q` | Atrae a los guardias hacia ti |
| Linterna | `F` | Apagarla reduce tu visibilidad y lo que ves |
| Recargar | `R` | Recarga (también es automática) |
| Recuadro del arma | `1`-`5`, rueda o `Tab` | Cambiar de arma |
| Pausa | `Esc` | Pausa |

## Mecánicas

- **Visión cónica:** fuera de tu linterna (con oclusión por muros), de un pequeño halo a tu alrededor y de las lámparas todo está a oscuras. Los guardias que no alumbras no se ven, ni sus avisos (`?`, `!`) ni sus ruidos; solo te delatan sus fogonazos al disparar.
- **Visibilidad:** el medidor sube con la linterna encendida, bajo una lámpara, al disparar sin silenciador y al correr. Dispara a las lámparas para crear sombras.
- **Ruido:** pasos al correr, disparos, impactos de bala, cristales, el botón de ruido y las explosiones generan ondas visibles. Los guardias que las oyen (las paredes amortiguan) se vuelven a mirar (`?`) o acuden corriendo.
- **IA de patrulla:** cada guardia recorre su ruta con esperas, miradas y cambios de sentido aleatorios. Al oír o ver algo pasa a *sospecha → investigar → registrar la zona* y luego vuelve con una patrulla nueva y más alerta. Si te detecta (`!`) avisa a los demás. Los cadáveres que encuentran también los alertan.
- **Sigilo cuerpo a cuerpo:** el cuchillo elimina al instante a un guardia que no te ha detectado o que está de espaldas. Las bajas silenciosas pagan +50 %, y cruzar una sala sin ser detectado da un bonus *fantasma*.
- **Munición limitada:** cada arma tiene cargador y reserva. Las cajas de munición (algunas repartidas por el mapa y otras que sueltan los guardias) reponen la reserva de todas tus armas, y en la tienda también se compra.
- **Guardado:** la partida se guarda sola en el navegador al entrar en cada sala y en la tienda. En el menú, «Continuar» la retoma; «Nueva partida» pide confirmación antes de borrarla.
- **Progresión:** cada sala es un edificio generado con salas, puertas, cajas y lámparas, más grande y con más enemigos (guardias, pesados con escopeta, élites) que la anterior. Entre salas hay tienda: 5 armas, 5 mejoras por arma (silenciador, cargador, láser, cañón, gatillo), munición, granadas, botiquines y blindaje. Si mueres reintentas la sala con el equipo con el que entraste.

## Pruebas

```
node test/smoke.js            # requiere Playwright con Chromium
SHOTS=capturas node test/smoke.js   # además guarda capturas
```

Comprueba que los mapas generados son recorribles, que dibujar un fogonazo casi apagado no falla (congelaba el juego), que un guardia fuera de tu luz queda negro, los sticks táctiles, la munición limitada, la reacción de la IA al ruido y a la vista, la eliminación por la espalda, la tienda, el reintento, el guardado y continuar, y el modo PC con ratón.
