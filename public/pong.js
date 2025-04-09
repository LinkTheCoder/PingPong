const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
const socket = io();

let players = {};
let playerId = null;
let ball = {
  x: 400,
  y: 300,
  radius: 10,
};

socket.on('init', (data) => {
  playerId = data.id;
});

socket.on('gameState', (data) => {
  players = data.players;
  ball = data.ball;
  draw();
});

socket.on('gameOver', (data) => {
  const winner = data.winner === playerId ? 'You win!' : 'You lose!';
  ctx.fillStyle = 'white';
  ctx.font = '50px Arial';
  ctx.fillText(winner, canvas.width / 2 - 100, canvas.height / 2);
});

socket.on('full', () => {
  alert('Room is full. Please try again later.');
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  socket.emit('movePaddle', y - 50); // center the paddle
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Paddles
  ctx.fillStyle = '#fff';
  for (let id in players) {
    const p = players[id];
    const x = id === playerId ? 0 : canvas.width - 20;
    ctx.fillRect(x, p.paddleY, 20, 100);
  }

  // Ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  // Center dashed line
  ctx.strokeStyle = 'gray';
  ctx.beginPath();
  ctx.setLineDash([10, 15]);
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Score
  const ids = Object.keys(players);
  if (ids.length === 2) {
    ctx.font = '24px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(players[ids[0]].score, canvas.width / 4, 30);
    ctx.fillText(players[ids[1]].score, (canvas.width * 3) / 4, 30);
  }
}
