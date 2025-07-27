
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let isGameOver = false, isGameStarted = false, score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let audioSetupDone = false, theme = "dark";
const ballColors = ["#0f0", "#ff0", "#0ff", "#f0f", "#f55"];
let ballColorIndex = 0;

let jumpSound = new Audio('https://actions.google.com/sounds/v1/human_voices/human_grunt1.ogg');
let hitSound = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg');

let ball = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  radius: 20,
  vy: 0,
  gravity: 0.6,
  lift: -15,
  color: ballColors[ballColorIndex],
  glow: 0
};

let obstacle = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  length: 120,
  thickness: 10,
  angle: 0,
  speed: 0.03
};

let pulse = { active: false, radius: 0, alpha: 1 };
let analyser, dataArray, getVolume;

async function setupAudio() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const mic = audioContext.createMediaStreamSource(stream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  mic.connect(analyser);
  getVolume = () => {
    analyser.getByteFrequencyData(dataArray);
    return dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  };
  audioSetupDone = true;
}

function startGame() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('scoreDisplay').style.display = 'block';
  isGameStarted = true;
  score = 0;
  if (!audioSetupDone) {
    setupAudio().then(gameLoop);
  } else {
    gameLoop();
  }
}

function restartGame() {
  isGameOver = false;
  isGameStarted = true;
  score = 0;
  ball.y = canvas.height - 50;
  ball.vy = 0;
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('scoreDisplay').style.display = 'block';
  gameLoop();
}

function gameLoop() {
  if (!isGameStarted || isGameOver) return;
  requestAnimationFrame(gameLoop);
  const volume = getVolume ? getVolume() : 0;
  if (volume > 30) {
    ball.vy = ball.lift;
    ball.glow = 20;
    pulse.active = true;
    pulse.radius = 0;
    pulse.alpha = 1;
    jumpSound.play();
  }

  ball.vy += ball.gravity;
  ball.y += ball.vy;

  if (ball.y > canvas.height - ball.radius) {
    ball.y = canvas.height - ball.radius;
    ball.vy = 0;
  }

  if (ball.y < ball.radius) {
    ball.y = ball.radius;
    ball.vy = 0;
  }

  if (ball.glow > 0) ball.glow -= 1;
  obstacle.angle += obstacle.speed;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (pulse.active) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, pulse.radius, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(0,255,0,${pulse.alpha})`;
    ctx.lineWidth = 4;
    ctx.stroke();
    pulse.radius += 2;
    pulse.alpha -= 0.02;
    if (pulse.alpha <= 0) pulse.active = false;
  }

  ctx.save();
  ctx.translate(obstacle.x, obstacle.y);
  ctx.rotate(obstacle.angle);
  ctx.fillStyle = "#f00";
  ctx.fillRect(-obstacle.length / 2, -obstacle.thickness / 2, obstacle.length, obstacle.thickness);
  ctx.restore();

  let dx = ball.x - obstacle.x;
  let dy = ball.y - obstacle.y;
  let dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < ball.radius + obstacle.thickness) {
    isGameOver = true;
    isGameStarted = false;
    if (score > highScore) {
      localStorage.setItem("highScore", Math.floor(score));
      highScore = score;
      document.getElementById('highScoreText').innerText = "🎉 Yeni Rekor!";
    } else {
      document.getElementById('highScoreText').innerText = "En Yüksek Skor: " + highScore;
    }
    document.getElementById('finalScore').innerText = "Skorun: " + Math.floor(score);
    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('scoreDisplay').style.display = 'none';
    hitSound.play();
    return;
  }

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.shadowColor = ball.color;
  ctx.shadowBlur = ball.glow;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.closePath();

  score += 0.1;
  document.getElementById('scoreDisplay').innerText = "Skor: " + Math.floor(score);
}

function toggleTheme() {
  theme = theme === "dark" ? "light" : "dark";
  document.body.style.background = theme === "light" ? "#fdfdfd" : "#111";
  canvas.style.background = theme === "light" ? "#fff" : "#222";
}

function changeBallColor() {
  ballColorIndex = (ballColorIndex + 1) % ballColors.length;
  ball.color = ballColors[ballColorIndex];
}
