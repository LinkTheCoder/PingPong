const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const FRAME_RATE = 60;
const WIDTH = 800;
const HEIGHT = 600;

let players = {};
let ball = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  radius: 10,
  vx: 5,
  vy: 5
};

io.on('connection', (socket) => {
  const playerCount = Object.keys(players).length;

  if (playerCount >= 2) {
    socket.emit('full');
    return;
  }

  players[socket.id] = {
    paddleY: HEIGHT / 2 - 50,
    score: 0,
  };

  socket.emit('init', { id: socket.id });

  socket.on('movePaddle', (y) => {
    if (players[socket.id]) {
      players[socket.id].paddleY = Math.max(0, Math.min(HEIGHT - 100, y));
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
  });
});

function resetBall() {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.vx = -ball.vx;
  ball.vy = 5 * (Math.random() > 0.5 ? 1 : -1);
}

function gameLoop() {
  const ids = Object.keys(players);
  if (ids.length < 2) return;

  const p1 = players[ids[0]];
  const p2 = players[ids[1]];

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y <= 0 || ball.y >= HEIGHT) {
    ball.vy *= -1;
  }

  // Paddle collision
  if (
    ball.x - ball.radius < 20 &&
    ball.y > p1.paddleY &&
    ball.y < p1.paddleY + 100
  ) {
    ball.vx *= -1;
    ball.x = 20 + ball.radius;
  }

  if (
    ball.x + ball.radius > WIDTH - 20 &&
    ball.y > p2.paddleY &&
    ball.y < p2.paddleY + 100
  ) {
    ball.vx *= -1;
    ball.x = WIDTH - 20 - ball.radius;
  }

  // Scoring
  if (ball.x < 0) {
    p2.score++;
    resetBall();
  }

  if (ball.x > WIDTH) {
    p1.score++;
    resetBall();
  }

  // Check for game over
  if (p1.score >= 5 || p2.score >= 5) {
    io.emit('gameOver', { winner: p1.score >= 5 ? ids[0] : ids[1] });
    p1.score = 0;
    p2.score = 0;
    resetBall();
  }

  io.emit('gameState', { players, ball });
}

setInterval(gameLoop, 1000 / FRAME_RATE);

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
