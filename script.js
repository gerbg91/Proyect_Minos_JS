const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('statusText');
const newMazeBtn = document.getElementById('newMazeBtn');

const COLS = 21;
const ROWS = 21;
const CELL_SIZE = canvas.width / COLS;

let maze = [];
let player = { x: 0, y: 0 };
let minotaur = { x: 0, y: 0 };
let exit = { x: COLS - 1, y: ROWS - 1 };
let minotaurRoom = null;
let gameOver = false;

// Objetos a recoger para activar la salida
// xifos: espada griega | ovillo: hilo de oro de Ariadna
let items = [
  { id: 'xifos',  name: 'Xifos',  x: 0, y: 0, collected: false },
  { id: 'ovillo', name: 'Ovillo de oro', x: 0, y: 0, collected: false }
];
let minotaurInterval = null;
let minotaurDelay = 300; // ms, menor = más rápido

// Cuenta atrás inicial: nadie se mueve hasta que termina
let countingDown = false;
let countdownTimer = null;

function createEmptyMaze() {
  maze = Array.from({ length: ROWS }, () => Array(COLS).fill(true));
}

function neighbors(x, y) {
  const dirs = [
    { x: 0, y: -2 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
    { x: -2, y: 0 }
  ];
  return dirs
    .map(d => ({ x: x + d.x, y: y + d.y, dir: d }))
    .filter(cell => cell.x >= 0 && cell.x < COLS && cell.y >= 0 && cell.y < ROWS && maze[cell.y][cell.x]);
}

function carveMaze() {
  const stack = [];
  const startX = 0;
  const startY = 0;
  maze[startY][startX] = false;
  stack.push({ x: startX, y: startY });

  while (stack.length) {
    const current = stack[stack.length - 1];
    const nextCells = neighbors(current.x, current.y);
    if (nextCells.length === 0) {
      stack.pop();
      continue;
    }
    const next = nextCells[Math.floor(Math.random() * nextCells.length)];
    const betweenX = current.x + (next.x - current.x) / 2;
    const betweenY = current.y + (next.y - current.y) / 2;
    maze[betweenY][betweenX] = false;
    maze[next.y][next.x] = false;
    stack.push({ x: next.x, y: next.y });
  }
}

function createLoops() {
  const loopCount = 18 + Math.floor(Math.random() * 14);
  let attempts = 0;
  let created = 0;

  while (created < loopCount && attempts < loopCount * 15) {
    attempts += 1;
    const x = 1 + Math.floor(Math.random() * (COLS - 2));
    const y = 1 + Math.floor(Math.random() * (ROWS - 2));
    if (!maze[y][x]) continue;

    const adjacent = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    ].filter(cell => !maze[cell.y][cell.x]);

    if (adjacent.length === 2) {
      const [first, second] = adjacent;
      const aligned = first.x === second.x || first.y === second.y;
      if (aligned) {
        maze[y][x] = false;
        created += 1;
      }
    }
  }
}

function makeMinotaurRoom() {
  const roomSize = 5;
  const roomX = Math.floor(COLS / 2) - 2;
  const roomY = Math.floor(ROWS / 2) - 2;
  minotaurRoom = { x: roomX, y: roomY, w: roomSize, h: roomSize };

  for (let ry = 0; ry < roomSize; ry++) {
    for (let rx = 0; rx < roomSize; rx++) {
      maze[roomY + ry][roomX + rx] = false;
    }
  }
  minotaur = { x: roomX + 2, y: roomY + 2 };
}

function endGame(message) {
  gameOver = true;
  statusText.textContent = message;
  if (minotaurInterval) {
    clearInterval(minotaurInterval);
    minotaurInterval = null;
  }
}

// Dibuja el laberinto y, encima, un velo oscuro con el texto de la cuenta atrás
function drawCountdownOverlay(text) {
  draw();
  ctx.save();

  // Velo oscuro sobre el laberinto
  ctx.fillStyle = 'rgba(18,13,6,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const isNumber = /^\d+$/.test(text);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${canvas.width * (isNumber ? 0.34 : 0.18)}px 'Cinzel', Georgia, serif`;

  // Resplandor dorado
  ctx.shadowColor = 'rgba(232,204,128,0.85)';
  ctx.shadowBlur = canvas.width * 0.06;

  // Relleno con degradado dorado
  const grad = ctx.createLinearGradient(cx, cy - canvas.width * 0.18, cx, cy + canvas.width * 0.18);
  grad.addColorStop(0, '#e8cc80');
  grad.addColorStop(1, '#a87828');
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, cy);

  // Contorno
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#5c4210';
  ctx.strokeText(text, cx, cy);

  ctx.restore();
}

// Muestra 3, 2, 1, ¡Ya! y al terminar ejecuta onComplete
function startCountdown(onComplete) {
  countingDown = true;
  if (countdownTimer) clearInterval(countdownTimer);

  const steps = ['3', '2', '1', '¡Ya!'];
  let i = 0;
  drawCountdownOverlay(steps[i]);

  countdownTimer = setInterval(() => {
    i += 1;
    if (i < steps.length) {
      drawCountdownOverlay(steps[i]);
    } else {
      clearInterval(countdownTimer);
      countdownTimer = null;
      countingDown = false;
      draw();
      if (onComplete) onComplete();
    }
  }, 800);
}

function resetGame() {
  gameOver = false;
  if (minotaurInterval) {
    clearInterval(minotaurInterval);
    minotaurInterval = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  countingDown = false;
  createEmptyMaze();
  carveMaze();
  createLoops();
  makeMinotaurRoom();
  player = { x: 0, y: 0 };
  exit = { x: COLS - 1, y: ROWS - 1 };
  if (maze[player.y][player.x]) {
    maze[player.y][player.x] = false;
  }
  if (maze[exit.y][exit.x]) {
    maze[exit.y][exit.x] = false;
  }

  placeItems();

  draw();
  statusText.textContent = 'Prepárate...';

  // Nadie se mueve hasta que termina la cuenta atrás
  startCountdown(() => {
    startMinotaurInterval();
    updateQuestStatus('Reune el Xifos y el Ovillo de oro para abrir la salida.');
  });
}

// Coloca cada objeto en una celda libre alejada del jugador, la salida
// y la habitacion del Minotauro, sin solaparse entre si.
function placeItems() {
  const taken = new Set();
  const key = (x, y) => `${x},${y}`;
  taken.add(key(player.x, player.y));
  taken.add(key(exit.x, exit.y));

  const inMinotaurRoom = (x, y) => minotaurRoom &&
    x >= minotaurRoom.x && x < minotaurRoom.x + minotaurRoom.w &&
    y >= minotaurRoom.y && y < minotaurRoom.y + minotaurRoom.h;

  const dist = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);

  items.forEach(item => {
    item.collected = false;
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 2000) {
      attempts += 1;
      const x = Math.floor(Math.random() * COLS);
      const y = Math.floor(Math.random() * ROWS);
      if (maze[y][x]) continue;                 // es muro
      if (taken.has(key(x, y))) continue;       // ocupado
      if (inMinotaurRoom(x, y)) continue;       // dentro de la guarida
      if (dist(x, y, player.x, player.y) < 6) continue; // muy cerca del inicio
      item.x = x;
      item.y = y;
      taken.add(key(x, y));
      placed = true;
    }
    // Respaldo: si no se encontro celda valida, usa cualquier pasillo libre
    if (!placed) {
      for (let y = 0; y < ROWS && !placed; y++) {
        for (let x = 0; x < COLS && !placed; x++) {
          if (!maze[y][x] && !taken.has(key(x, y)) && !inMinotaurRoom(x, y)) {
            item.x = x; item.y = y; taken.add(key(x, y)); placed = true;
          }
        }
      }
    }
  });
}

function allItemsCollected() {
  return items.every(it => it.collected);
}

function updateQuestStatus(prefix) {
  const got = items.filter(it => it.collected).map(it => it.name);
  const pending = items.filter(it => !it.collected).map(it => it.name);
  let msg = prefix ? prefix + ' ' : '';
  if (pending.length === 0) {
    msg += 'Tienes todas las reliquias: la salida esta abierta.';
  } else {
    msg += `Recogido: ${got.length ? got.join(', ') : 'nada'}. Falta: ${pending.join(', ')}.`;
  }
  statusText.textContent = msg;
}

function startMinotaurInterval() {
  if (minotaurInterval) clearInterval(minotaurInterval);
  minotaurInterval = setInterval(() => {
    if (gameOver) return;
    moveMinotaur();
    if (player.x === minotaur.x && player.y === minotaur.y) {
      endGame('¡El Minotauro te atrapó! Reinicia para jugar de nuevo.');
      draw();
      return;
    }
    draw();
  }, minotaurDelay);
  updateSpeedDisplay();
}

function stopMinotaurInterval() {
  if (minotaurInterval) {
    clearInterval(minotaurInterval);
    minotaurInterval = null;
  }
}

function setMinotaurDelay(newDelay) {
  const min = 50;
  const max = 2000;
  minotaurDelay = Math.max(min, Math.min(max, newDelay));
  if (minotaurInterval) {
    startMinotaurInterval();
  }
  updateSpeedDisplay();
}

function updateSpeedDisplay() {
  const disp = document.getElementById('minotaurSpeedDisplay');
  const info = document.getElementById('minotaurInfo');
  if (disp) disp.textContent = `${minotaurDelay} ms`;
  if (info) info.textContent = `${minotaurDelay}`;
}

function drawHelmet(cx, cy) {
  ctx.save();
  const r = CELL_SIZE * 0.4;

  // Penacho (cresta roja de crin de caballo)
  ctx.fillStyle = '#c0432f';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.12, cy - r * 1.0, r * 0.09, r * 0.3, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 1.12, r * 0.1, r * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.12, cy - r * 1.0, r * 0.09, r * 0.3, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Base de la cresta
  ctx.fillStyle = '#7a3010';
  ctx.fillRect(cx - r * 0.1, cy - r * 0.7, r * 0.2, r * 0.18);

  // Cuerpo del casco - gradiente bronce
  const grad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.2, 0, cx, cy, r);
  grad.addColorStop(0, '#e8c870');
  grad.addColorStop(0.4, '#b08030');
  grad.addColorStop(0.75, '#7a5018');
  grad.addColorStop(1, '#4a2e08');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.78, r, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ranuras para los ojos (oscuras, horizontales)
  ctx.fillStyle = '#1a0e04';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.26, cy - r * 0.08, r * 0.2, r * 0.07, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.26, cy - r * 0.08, r * 0.2, r * 0.07, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Nasal (protector de nariz)
  ctx.fillStyle = '#8b5a20';
  ctx.fillRect(cx - r * 0.06, cy - r * 0.18, r * 0.12, r * 0.55);

  // Contorno dorado
  ctx.strokeStyle = '#e8cc80';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.78, r, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Protectores de mejillas
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.5, cy + r * 0.35);
  ctx.lineTo(cx - r * 0.62, cy + r * 0.75);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.5, cy + r * 0.35);
  ctx.lineTo(cx + r * 0.62, cy + r * 0.75);
  ctx.stroke();

  ctx.restore();
}

function drawBullHead(cx, cy) {
  ctx.save();
  const r = CELL_SIZE * 0.4;

  // Cuernos (detrás de la cabeza)
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = Math.max(2, r * 0.18);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.32, cy - r * 0.28);
  ctx.quadraticCurveTo(cx - r * 0.85, cy - r * 0.72, cx - r * 0.52, cy - r * 1.02);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.32, cy - r * 0.28);
  ctx.quadraticCurveTo(cx + r * 0.85, cy - r * 0.72, cx + r * 0.52, cy - r * 1.02);
  ctx.stroke();

  // Orejas
  ctx.fillStyle = '#3a1008';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.62, cy - r * 0.06, r * 0.18, r * 0.26, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.62, cy - r * 0.06, r * 0.18, r * 0.26, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Cabeza principal
  const hGrad = ctx.createRadialGradient(cx - r * 0.12, cy - r * 0.1, 0, cx, cy + r * 0.1, r * 0.9);
  hGrad.addColorStop(0, '#6a2010');
  hGrad.addColorStop(0.5, '#3d1208');
  hGrad.addColorStop(1, '#1e0804');
  ctx.fillStyle = hGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.05, r * 0.72, r * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ojos (rojo rabioso)
  ctx.fillStyle = '#cc2200';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.27, cy - r * 0.18, r * 0.13, r * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.27, cy - r * 0.18, r * 0.13, r * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupilas
  ctx.fillStyle = '#1a0000';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.27, cy - r * 0.18, r * 0.05, r * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.27, cy - r * 0.18, r * 0.05, r * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hocico
  ctx.fillStyle = '#4a1a0a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.35, r * 0.36, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fosas nasales
  ctx.fillStyle = '#1a0602';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.14, cy + r * 0.35, r * 0.08, r * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.14, cy + r * 0.35, r * 0.08, r * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  // Argolla dorada en la nariz
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.42, r * 0.11, 0, Math.PI * 2);
  ctx.stroke();

  // Contorno de la cabeza
  ctx.strokeStyle = '#7a2808';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.05, r * 0.72, r * 0.82, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawExit(ex, ey, active) {
  const px = ex * CELL_SIZE;
  const py = ey * CELL_SIZE;
  const cx = px + CELL_SIZE / 2;
  const cy = py + CELL_SIZE / 2;
  const s = CELL_SIZE;

  ctx.save();

  if (active) {
    // Resplandor dorado radial (salida abierta)
    const gGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.5);
    gGrad.addColorStop(0, 'rgba(232,204,128,0.96)');
    gGrad.addColorStop(0.45, 'rgba(201,168,76,0.65)');
    gGrad.addColorStop(1, 'rgba(139,107,40,0.05)');
    ctx.fillStyle = gGrad;
    ctx.fillRect(px + 2, py + 2, s - 4, s - 4);

    ctx.fillStyle = '#e8cc80';
  } else {
    // Salida sellada: piedra apagada con tenue brillo gris
    const gGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.5);
    gGrad.addColorStop(0, 'rgba(120,110,90,0.55)');
    gGrad.addColorStop(1, 'rgba(60,55,45,0.05)');
    ctx.fillStyle = gGrad;
    ctx.fillRect(px + 2, py + 2, s - 4, s - 4);

    ctx.fillStyle = '#6b6457';
  }

  // Estrella de 8 puntas (motivo solar griego)
  ctx.translate(cx, cy);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.26, s * 0.042, s * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Centro
  ctx.fillStyle = active ? '#c9a84c' : '#4a463c';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.065, 0, Math.PI * 2);
  ctx.fill();

  // Candado simbolico cuando esta sellada
  if (!active) {
    ctx.strokeStyle = '#2a2620';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -s * 0.02, s * 0.1, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#2a2620';
    ctx.fillRect(-s * 0.13, -s * 0.02, s * 0.26, s * 0.18);
  }

  ctx.restore();
}

// Espada griega (xifos): hoja en forma de hoja con empuñadura en cruz
function drawXifos(cx, cy) {
  ctx.save();
  const r = CELL_SIZE * 0.62;
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4); // diagonal

  // Hoja (forma foliacea, mas ancha en el centro)
  const blade = ctx.createLinearGradient(-r * 0.25, 0, r * 0.25, 0);
  blade.addColorStop(0, '#8d8878');
  blade.addColorStop(0.5, '#f4f1e6');
  blade.addColorStop(1, '#8d8878');
  ctx.fillStyle = blade;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.92);             // punta
  ctx.quadraticCurveTo(r * 0.26, -r * 0.35, r * 0.2, r * 0.12);
  ctx.lineTo(-r * 0.2, r * 0.12);
  ctx.quadraticCurveTo(-r * 0.26, -r * 0.35, 0, -r * 0.92);
  ctx.closePath();
  ctx.fill();
  // Filo brillante en contorno
  ctx.strokeStyle = 'rgba(255,255,250,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Nervio central
  ctx.strokeStyle = 'rgba(80,80,70,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.lineTo(0, r * 0.1);
  ctx.stroke();

  // Guarda (cruz dorada)
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(-r * 0.38, r * 0.1, r * 0.76, r * 0.12);
  ctx.strokeStyle = '#8b6b28';
  ctx.lineWidth = 1;
  ctx.strokeRect(-r * 0.38, r * 0.1, r * 0.76, r * 0.12);

  // Empuñadura (cuero)
  ctx.fillStyle = '#7a3010';
  ctx.fillRect(-r * 0.08, r * 0.22, r * 0.16, r * 0.42);
  // Vendaje de la empuñadura
  ctx.strokeStyle = 'rgba(40,16,4,0.7)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const yy = r * 0.28 + i * r * 0.09;
    ctx.beginPath();
    ctx.moveTo(-r * 0.08, yy);
    ctx.lineTo(r * 0.08, yy);
    ctx.stroke();
  }

  // Pomo
  ctx.fillStyle = '#e8cc80';
  ctx.beginPath();
  ctx.arc(0, r * 0.7, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8b6b28';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

// Ovillo de lana de oro (hilo de Ariadna)
function drawOvillo(cx, cy) {
  ctx.save();
  const r = CELL_SIZE * 0.32;

  // Esfera de lana
  const ball = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  ball.addColorStop(0, '#f6e29a');
  ball.addColorStop(0.55, '#d9b441');
  ball.addColorStop(1, '#9c7818');
  ctx.fillStyle = ball;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Hebras cruzadas
  ctx.strokeStyle = 'rgba(120,90,20,0.55)';
  ctx.lineWidth = 1;
  for (let a = -1; a <= 1; a++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.9, r * 0.35, a * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,240,180,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.35, r * 0.9, 0.4, 0, Math.PI * 2);
  ctx.stroke();

  // Hilo colgante
  ctx.strokeStyle = '#e8cc80';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.7, cy + r * 0.4);
  ctx.quadraticCurveTo(cx + r * 1.3, cy + r * 0.9, cx + r * 0.9, cy + r * 1.3);
  ctx.stroke();

  // Contorno
  ctx.strokeStyle = '#9c7818';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function draw() {
  const pathColor = '#d4c4a2';
  const wallColor = '#1a1005';
  const roomTint  = 'rgba(180,60,20,0.12)';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo (pasillo de piedra clara)
  ctx.fillStyle = pathColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Muros (bloques de piedra oscura)
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (maze[y][x]) {
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;
        ctx.fillStyle = wallColor;
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        // Línea de mortero sutil
        ctx.strokeStyle = 'rgba(50,30,10,0.4)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px + 0.25, py + 0.25, CELL_SIZE - 0.5, CELL_SIZE - 0.5);
      }
    }
  }

  // Tinte de la habitación del Minotauro
  if (minotaurRoom) {
    ctx.fillStyle = roomTint;
    ctx.fillRect(
      minotaurRoom.x * CELL_SIZE, minotaurRoom.y * CELL_SIZE,
      minotaurRoom.w * CELL_SIZE, minotaurRoom.h * CELL_SIZE
    );
  }

  // Salida (portal solar dorado: sellada hasta reunir las reliquias)
  drawExit(exit.x, exit.y, allItemsCollected());

  // Objetos pendientes de recoger
  items.forEach(item => {
    if (item.collected) return;
    const icx = item.x * CELL_SIZE + CELL_SIZE / 2;
    const icy = item.y * CELL_SIZE + CELL_SIZE / 2;
    if (item.id === 'xifos') drawXifos(icx, icy);
    else if (item.id === 'ovillo') drawOvillo(icx, icy);
  });

  // Jugador (casco corintio)
  drawHelmet(
    player.x * CELL_SIZE + CELL_SIZE / 2,
    player.y * CELL_SIZE + CELL_SIZE / 2
  );

  // Minotauro (cabeza de toro)
  drawBullHead(
    minotaur.x * CELL_SIZE + CELL_SIZE / 2,
    minotaur.y * CELL_SIZE + CELL_SIZE / 2
  );
}

function validMove(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS && !maze[y][x];
}

function movePlayer(dx, dy) {
  if (gameOver || countingDown) return;
  const nextX = player.x + dx;
  const nextY = player.y + dy;
  if (!validMove(nextX, nextY)) return;
  player.x = nextX;
  player.y = nextY;

  if (player.x === minotaur.x && player.y === minotaur.y) {
    endGame('¡El Minotauro te atrapó! Reinicia para jugar de nuevo.');
    draw();
    return;
  }

  // Recoger objeto si el jugador pisa su celda
  const here = items.find(it => !it.collected && it.x === player.x && it.y === player.y);
  if (here) {
    here.collected = true;
    updateQuestStatus(`Tomas el ${here.name}.`);
    draw();
    return;
  }

  if (player.x === exit.x && player.y === exit.y) {
    if (allItemsCollected()) {
      endGame('¡Has ganado! Con el Xifos y el hilo de Ariadna escapas del laberinto.');
    } else {
      const pending = items.filter(it => !it.collected).map(it => it.name).join(', ');
      statusText.textContent = `La salida esta sellada. Necesitas: ${pending}.`;
    }
    draw();
    return;
  }

  draw();
}

function findPath(start, goal) {
  const queue = [start];
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const parent = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  visited[start.y][start.x] = true;

  while (queue.length) {
    const current = queue.shift();
    if (current.x === goal.x && current.y === goal.y) break;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy]) => {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !visited[ny][nx] && !maze[ny][nx]) {
        visited[ny][nx] = true;
        parent[ny][nx] = current;
        queue.push({ x: nx, y: ny });
      }
    });
  }

  if (!visited[goal.y][goal.x]) return null;
  const path = [];
  let cur = goal;
  while (cur) {
    path.push(cur);
    if (cur.x === start.x && cur.y === start.y) break;
    cur = parent[cur.y][cur.x];
  }
  return path.reverse();
}

function moveMinotaur() {
  if (gameOver) return;
  const path = findPath(minotaur, player);
  if (path && path.length >= 2) {
    minotaur = { x: path[1].x, y: path[1].y };
    return;
  }

  const possibleMoves = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ].filter(move => validMove(minotaur.x + move.dx, minotaur.y + move.dy));

  if (possibleMoves.length > 0) {
    const choice = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    minotaur.x += choice.dx;
    minotaur.y += choice.dy;
  }
}

window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowUp':
      movePlayer(0, -1);
      break;
    case 'ArrowDown':
      movePlayer(0, 1);
      break;
    case 'ArrowLeft':
      movePlayer(-1, 0);
      break;
    case 'ArrowRight':
      movePlayer(1, 0);
      break;
    default:
      return;
  }
  event.preventDefault();
});

newMazeBtn.addEventListener('click', resetGame);
// Controles de velocidad
const speedDownBtn = document.getElementById('speedDownBtn');
const speedUpBtn = document.getElementById('speedUpBtn');

if (speedDownBtn) {
  speedDownBtn.addEventListener('click', () => {
    setMinotaurDelay(minotaurDelay + 50); // aumentar ms = más lento
  });
}

if (speedUpBtn) {
  speedUpBtn.addEventListener('click', () => {
    setMinotaurDelay(minotaurDelay - 50); // disminuir ms = más rápido
  });
}

resetGame();

// Mostrar velocidad al inicio
updateSpeedDisplay();
