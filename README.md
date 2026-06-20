# Proyect_Minos_JS

Juego de laberinto inspirado en el mito de Teseo y el Minotauro. Encarnas a un guerrero que debe reunir dos reliquias, abrir la salida y escapar del laberinto antes de que el Minotauro le dé caza.

## Descripción

El laberinto se genera de forma procedural en cada partida sobre una rejilla de 21x21 celdas, dibujado en un `<canvas>` de HTML5. Es un laberinto **multicursal** (con bucles y caminos alternativos), no un simple árbol de pasillos. En su centro se abre la guarida del Minotauro, una sala rojiza de la que la bestia sale a perseguirte.

Para huir no basta con llegar a la salida: el portal solar dorado permanece **sellado** hasta que recojas las dos reliquias repartidas por el laberinto:

- ⚔ **Xifos**: la espada griega.
- 🧶 **Ovillo de oro**: el hilo de Ariadna.

Con ambas en tu poder, la salida (esquina inferior derecha) se abre y puedes ganar la partida.

## Cómo jugar

1. Abre `index.html` en un navegador.
2. Muévete con las **flechas del teclado** (arriba, abajo, izquierda, derecha).
3. Recoge el **Xifos** y el **Ovillo de oro** pisando sus celdas.
4. Llega a la salida una vez reunidas las dos reliquias para escapar.
5. **Evita al Minotauro**: si te alcanza, pierdes.

### Controles

- **Flechas**: mover al guerrero.
- **Nuevo laberinto**: genera una partida nueva.
- **Velocidad Minotauro (− / +)**: ajusta cada cuántos milisegundos se mueve la bestia (entre 50 y 2000 ms; menos ms = más rápido).

## El Minotauro

El Minotauro se mueve **automáticamente** cada cierto intervalo (300 ms por defecto), incluso si tú no te mueves. Usa búsqueda en anchura (BFS) para calcular la ruta más corta hacia tu posición, por lo que te persigue de forma inteligente. Si no encuentra camino, se mueve de manera aleatoria.

## Detalles técnicos

- **Sin dependencias de build**: HTML, CSS y JavaScript puro (vanilla).
- **Generación del laberinto**: backtracking recursivo iterativo (`carveMaze`) con bucles añadidos (`createLoops`) para crear rutas alternativas.
- **Renderizado**: todo se dibuja a mano en el `<canvas>` (guerrero con casco corintio, cabeza de toro del Minotauro, reliquias y portal de salida).
- **IA del enemigo**: pathfinding por BFS (`findPath` / `moveMinotaur`).
- **Estilos**: tema griego con [Bootstrap 5](https://getbootstrap.com/) y la fuente *Cormorant Garamond*.

## Estructura del proyecto

```
.
├── index.html    # Estructura de la página y la interfaz
├── styles.css    # Estilos y tema griego
└── script.js     # Lógica del juego (laberinto, render, IA del Minotauro)
```
