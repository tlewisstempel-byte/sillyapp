const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const winsEl = document.querySelector("#wins");
const prizeEl = document.querySelector("#prize");
const dialog = document.querySelector("#winDialog");
const winMessageEl = document.querySelector("#winMessage");
const againButton = document.querySelector("#again");
const resetButton = document.querySelector("#reset");

const messages = [
  "ella is extremely silly, hi T",
  "ella is really, really silly",
  "T is better than ella",
  "hi T",
  "ella ffs why are you here",
];

const board = {
  cols: 7,
  rows: 8,
  tile: 90,
  left: 45,
  top: 62,
};

let player;
let wins = 0;
let messageIndex = 0;
let lastTime = 0;

const lanes = [
  { row: 1, color: "#14203a", speed: -42, cars: [{ x: 70, w: 112 }, { x: 400, w: 130 }] },
  { row: 2, color: "#243e42", speed: 28, cars: [{ x: 130, w: 96 }, { x: 510, w: 116 }] },
  { row: 3, color: "#151d31", speed: -34, cars: [{ x: 210, w: 126 }] },
  { row: 5, color: "#243e42", speed: 32, cars: [{ x: 40, w: 118 }, { x: 430, w: 100 }] },
  { row: 6, color: "#151d31", speed: -30, cars: [{ x: 260, w: 128 }] },
];

function resetRun() {
  player = {
    col: 3,
    row: 7,
    pop: 0,
    bumped: 0,
  };
  prizeEl.textContent = "A smug little win screen.";
}

function drawRoundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fillRounded(x, y, width, height, radius, fillStyle) {
  drawRoundedRect(x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function tileCenter(col, row) {
  return {
    x: board.left + col * board.tile + board.tile / 2,
    y: board.top + row * board.tile + board.tile / 2,
  };
}

function drawBoard(time) {
  const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grd.addColorStop(0, "#172848");
  grd.addColorStop(0.46, "#0b1326");
  grd.addColorStop(1, "#142923");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  fillRounded(28, 38, 664, 748, 34, "rgba(255,255,255,0.08)");
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  drawRoundedRect(28, 38, 664, 748, 34);
  ctx.stroke();

  for (let row = 0; row < board.rows; row += 1) {
    const y = board.top + row * board.tile;
    const isGoal = row === 0;
    const isStart = row === 7;
    const lane = lanes.find((item) => item.row === row);
    const color = isGoal ? "#75601c" : isStart ? "#204932" : lane ? lane.color : "#1b3343";

    fillRounded(board.left, y, board.cols * board.tile, board.tile - 8, 18, color);

    if (isGoal) {
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.font = "900 28px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("FINISH", canvas.width / 2, y + 56);
    }

    for (let col = 0; col < board.cols; col += 1) {
      const x = board.left + col * board.tile;
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 4, y + 4, board.tile - 8, board.tile - 16);
    }
  }

  const shimmer = Math.sin(time / 520) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(255, 255, 255, ${0.08 + shimmer * 0.08})`;
  ctx.fillRect(board.left + 18, board.top + 18, board.cols * board.tile - 36, 5);
}

function drawCars(dt) {
  lanes.forEach((lane) => {
    const y = board.top + lane.row * board.tile + 18;
    lane.cars.forEach((car) => {
      car.x += (lane.speed * dt) / 1000;
      if (lane.speed > 0 && car.x > canvas.width + 40) car.x = -car.w - 80;
      if (lane.speed < 0 && car.x < -car.w - 40) car.x = canvas.width + 80;

      const carGradient = ctx.createLinearGradient(car.x, y, car.x + car.w, y + 52);
      carGradient.addColorStop(0, lane.speed > 0 ? "#4ee8ff" : "#ff5cb8");
      carGradient.addColorStop(1, lane.speed > 0 ? "#c8ff4e" : "#ffd35c");
      fillRounded(car.x, y, car.w, 52, 18, carGradient);

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      fillRounded(car.x + 14, y + 8, car.w * 0.36, 12, 8, ctx.fillStyle);
      ctx.fillStyle = "rgba(5,10,18,0.5)";
      fillRounded(car.x + 14, y + 39, 18, 8, 6, ctx.fillStyle);
      fillRounded(car.x + car.w - 32, y + 39, 18, 8, 6, ctx.fillStyle);
    });
  });
}

function drawPlayer(time) {
  const center = tileCenter(player.col, player.row);
  const bounce = Math.sin(time / 130) * 2 + player.pop * 7;
  const squash = player.bumped > 0 ? 1.1 : 1;

  ctx.save();
  ctx.translate(center.x, center.y - bounce);
  ctx.scale(squash, 1 / squash);
  ctx.shadowColor = "rgba(0,0,0,0.36)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 18;

  const body = ctx.createRadialGradient(-16, -18, 4, 4, 6, 48);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.18, "#eaffff");
  body.addColorStop(0.52, "#4ee8ff");
  body.addColorStop(1, "#1666ff");
  fillRounded(-31, -38, 62, 76, 24, body);

  ctx.shadowColor = "transparent";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  fillRounded(-18, -28, 21, 10, 8, ctx.fillStyle);
  ctx.fillStyle = "#07101e";
  ctx.beginPath();
  ctx.arc(-10, -3, 4, 0, Math.PI * 2);
  ctx.arc(12, -3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function detectCollision() {
  const center = tileCenter(player.col, player.row);
  const hit = lanes.some((lane) => {
    if (lane.row !== player.row) return false;
    return lane.cars.some((car) => center.x > car.x - 18 && center.x < car.x + car.w + 18);
  });

  if (hit) {
    player.bumped = 8;
    prizeEl.textContent = "Bumped. Still winning, obviously.";
  }
}

function win() {
  const message = messages[messageIndex % messages.length];
  messageIndex += 1;
  wins += 1;
  winsEl.textContent = String(wins);
  prizeEl.textContent = message;
  winMessageEl.textContent = message;
  dialog.showModal();
}

function move(direction) {
  if (dialog.open) return;

  if (direction === "up") player.row = Math.max(0, player.row - 1);
  if (direction === "down") player.row = Math.min(7, player.row + 1);
  if (direction === "left") player.col = Math.max(0, player.col - 1);
  if (direction === "right") player.col = Math.min(6, player.col + 1);

  player.pop = 1;
  detectCollision();
  if (player.row === 0) win();
}

function loop(time) {
  const dt = Math.min(time - lastTime, 32);
  lastTime = time;
  player.pop *= 0.72;
  player.bumped = Math.max(0, player.bumped - 1);

  drawBoard(time);
  drawCars(dt);
  drawPlayer(time);
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (event) => {
  const keys = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
  };
  const direction = keys[event.code];
  if (!direction) return;
  event.preventDefault();
  move(direction);
});

document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => move(button.dataset.move));
});

againButton.addEventListener("click", () => {
  resetRun();
});

resetButton.addEventListener("click", resetRun);

resetRun();
requestAnimationFrame(loop);
