import './style.css'

const canvas = document.querySelector('#game');
if (!canvas) {
  console.error('Canvas element #game not found!');
  throw new Error('Canvas element #game not found!');
}
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// --- Input Handling ---
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyR' && gameState.gameOver) {
    resetGame();
  }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

// --- Game State ---
const gameState = {
  score: 0,
  lives: 3,
  gameOver: false,
  level: 1
};

// --- Particle System ---
const particles = [];

function createExplosion(x, y, count, color = 'white', speed = 3, life = 40) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * speed + 1;
    particles.push({
      x, y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: life + Math.random() * 20,
      maxLife: life + 20,
      size: Math.random() * 3 + 1,
      color
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// --- Starfield Background ---
const starLayers = [
  { stars: [], speed: 0.1, size: 1, count: 100 },
  { stars: [], speed: 0.3, size: 1.5, count: 50 },
  { stars: [], speed: 0.5, size: 2, count: 25 }
];

function initStars() {
  starLayers.forEach(layer => {
    layer.stars = [];
    for (let i = 0; i < layer.count; i++) {
      layer.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        brightness: Math.random() * 0.5 + 0.5
      });
    }
  });
}

function updateStars() {
  starLayers.forEach(layer => {
    layer.stars.forEach(star => {
      star.y += layer.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });
  });
}

function drawStars() {
  starLayers.forEach(layer => {
    layer.stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.6})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, layer.size, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

// --- Screen Shake ---
const screenShake = { intensity: 0, duration: 0, offsetX: 0, offsetY: 0 };

function triggerShake(intensity, duration) {
  screenShake.intensity = intensity;
  screenShake.duration = duration;
}

function updateShake() {
  if (screenShake.duration > 0) {
    screenShake.offsetX = (Math.random() - 0.5) * screenShake.intensity * 2;
    screenShake.offsetY = (Math.random() - 0.5) * screenShake.intensity * 2;
    screenShake.duration--;
    screenShake.intensity *= 0.9;
  } else {
    screenShake.offsetX = 0;
    screenShake.offsetY = 0;
  }
}

// --- Score Popups ---
const scorePopups = [];

function createScorePopup(x, y, score) {
  scorePopups.push({
    x, y,
    score,
    life: 60,
    vy: -2
  });
}

function updateScorePopups() {
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    const p = scorePopups[i];
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) scorePopups.splice(i, 1);
  }
}

function drawScorePopups() {
  ctx.font = '16px "Courier New"';
  ctx.textAlign = 'center';
  scorePopups.forEach(p => {
    const alpha = p.life / 60;
    ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
    ctx.fillText(`+${p.score}`, p.x, p.y);
  });
}

// --- Screen Flash ---
let screenFlash = { alpha: 0, color: 'white' };

function triggerFlash(color = 'red') {
  screenFlash.alpha = 0.5;
  screenFlash.color = color;
}

function updateFlash() {
  if (screenFlash.alpha > 0) {
    screenFlash.alpha -= 0.05;
  }
}

function drawFlash() {
  if (screenFlash.alpha > 0) {
    ctx.fillStyle = screenFlash.color;
    ctx.globalAlpha = screenFlash.alpha;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
}

initStars();

// --- Shooting Mechanism ---
const bullets = [];
const SHOOT_COOLDOWN = 20; // frames
let shootTimer = 0;

// --- Ship Entity ---
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 15,
  angle: -Math.PI / 2, // Facing up
  rotation: 0,
  velocity: { x: 0, y: 0 },
  thrusting: false,
  visible: true,
  blinkTime: 0,

  update() {
    if (gameState.gameOver || !this.visible) return;

    // Rotation logic
    if (keys['ArrowLeft']) this.angle -= 0.1;
    if (keys['ArrowRight']) this.angle += 0.1;

    // Thrust logic
    this.thrusting = keys['ArrowUp'];
    if (this.thrusting) {
      const accel = 0.1;
      this.velocity.x += Math.cos(this.angle) * accel;
      this.velocity.y += Math.sin(this.angle) * accel;
    }

    // Apply friction/drag
    const friction = 0.99;
    this.velocity.x *= friction;
    this.velocity.y *= friction;

    // Update position
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Wrap-around
    if (this.x < -this.radius) this.x = canvas.width + this.radius;
    if (this.x > canvas.width + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = canvas.height + this.radius;
    if (this.y > canvas.height + this.radius) this.y = -this.radius;

    // Shooting logic
    if (shootTimer > 0) shootTimer--;
    if (keys['Space'] && shootTimer === 0) {
      this.shoot();
      shootTimer = SHOOT_COOLDOWN;
    }
  },

  shoot() {
    const bulletSpeed = 5;
    const startX = this.x + Math.cos(this.angle) * this.radius;
    const startY = this.y + Math.sin(this.angle) * this.radius;
    bullets.push({
      x: startX,
      y: startY,
      vx: Math.cos(this.angle) * bulletSpeed + this.velocity.x,
      vy: Math.sin(this.angle) * bulletSpeed + this.velocity.y,
      life: 60, // frames
      radius: 2,
      trail: [{ x: startX, y: startY }]
    });
  },

  draw() {
    if (!this.visible) return;

    // Invulnerability blinking
    if (this.blinkTime > 0) {
      this.blinkTime--;
      if (Math.floor(this.blinkTime / 10) % 2 === 0) return;
    }

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Triangular shape
    ctx.moveTo(
      this.x + Math.cos(this.angle) * this.radius,
      this.y + Math.sin(this.angle) * this.radius
    );
    ctx.lineTo(
      this.x + Math.cos(this.angle + (Math.PI * 3) / 4) * this.radius,
      this.y + Math.sin(this.angle + (Math.PI * 3) / 4) * this.radius
    );
    ctx.lineTo(
      this.x + Math.cos(this.angle - (Math.PI * 3) / 4) * this.radius,
      this.y + Math.sin(this.angle - (Math.PI * 3) / 4) * this.radius
    );
    ctx.closePath();
    ctx.stroke();

    // Draw thrust flame
    if (this.thrusting) {
      ctx.beginPath();
      ctx.moveTo(
        this.x + Math.cos(this.angle + (Math.PI * 3) / 4) * (this.radius * 0.5),
        this.y + Math.sin(this.angle + (Math.PI * 3) / 4) * (this.radius * 0.5)
      );
      ctx.lineTo(
        this.x + Math.cos(this.angle + Math.PI) * (this.radius * 1.5),
        this.y + Math.sin(this.angle + Math.PI) * (this.radius * 1.5)
      );
      ctx.lineTo(
        this.x + Math.cos(this.angle - (Math.PI * 3) / 4) * (this.radius * 0.5),
        this.y + Math.sin(this.angle - (Math.PI * 3) / 4) * (this.radius * 0.5)
      );
      ctx.stroke();
    }
  }
};

// --- Asteroid System ---
const asteroids = [];
const ASTEROID_SPEED = 1.5;

function createAsteroid(x, y, radius, level) {
  const vertCount = Math.floor(Math.random() * 7 + 8);
  const offsets = [];
  for (let i = 0; i < vertCount; i++) {
    offsets.push(Math.random() * 0.4 + 0.8);
  }

  return {
    x: x ?? Math.random() * canvas.width,
    y: y ?? Math.random() * canvas.height,
    vx: (Math.random() * 2 - 1) * ASTEROID_SPEED * (4 - level) * 0.5,
    vy: (Math.random() * 2 - 1) * ASTEROID_SPEED * (4 - level) * 0.5,
    radius: radius,
    level: level, // 3: Large, 2: Medium, 1: Small
    vertCount: vertCount,
    offsets: offsets,
    angle: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() * 2 - 1) * 0.02
  };
}

function spawnInitialAsteroids() {
  const count = 5 + gameState.level;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = Math.random() * canvas.width;
      y = Math.random() * canvas.height;
    } while (Math.hypot(x - ship.x, y - ship.y) < 150);

    asteroids.push(createAsteroid(x, y, 50, 3));
  }
}

function updateAsteroids() {
  asteroids.forEach(a => {
    a.x += a.vx;
    a.y += a.vy;
    a.angle += a.rotationSpeed;

    if (a.x < -a.radius) a.x = canvas.width + a.radius;
    if (a.x > canvas.width + a.radius) a.x = -a.radius;
    if (a.y < -a.radius) a.y = canvas.height + a.radius;
    if (a.y > canvas.height + a.radius) a.y = -a.radius;
  });

  if (asteroids.length === 0 && !gameState.gameOver) {
    gameState.level++;
    spawnInitialAsteroids();
  }
}

function drawAsteroids() {
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  asteroids.forEach(a => {
    ctx.beginPath();
    for (let i = 0; i < a.vertCount; i++) {
      const angle = a.angle + (i / a.vertCount) * Math.PI * 2;
      const r = a.radius * a.offsets[i];
      const x = a.x + Math.cos(angle) * r;
      const y = a.y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    // Add current position to trail
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 8) b.trail.shift();

    b.x += b.vx;
    b.y += b.vy;
    b.life--;

    if (b.x < 0) b.x = canvas.width;
    if (b.x > canvas.width) b.x = 0;
    if (b.y < 0) b.y = canvas.height;
    if (b.y > canvas.height) b.y = 0;

    if (b.life <= 0) {
      bullets.splice(i, 1);
    }
  }
}

function drawBullets() {
  bullets.forEach(b => {
    // Draw trail
    for (let i = 0; i < b.trail.length; i++) {
      const alpha = (i / b.trail.length) * 0.5;
      const size = (i / b.trail.length) * b.radius;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(b.trail[i].x, b.trail[i].y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw bullet
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

// --- Collision System ---
function checkCollisions() {
  if (gameState.gameOver) return;

  // Bullet-Asteroid
  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = asteroids.length - 1; j >= 0; j--) {
      const b = bullets[i];
      const a = asteroids[j];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (dist < a.radius + b.radius) {
        bullets.splice(i, 1);
        const points = (4 - a.level) * 10;
        gameState.score += points;
        createScorePopup(a.x, a.y, points);
        createExplosion(a.x, a.y, a.level * 8, 'white', 2 + a.level);
        if (a.level === 3) triggerShake(3, 8);
        splitAsteroid(j);
        break;
      }
    }
  }

  // Ship-Asteroid
  if (ship.visible && ship.blinkTime === 0) {
    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i];
      const dist = Math.hypot(ship.x - a.x, ship.y - a.y);
      if (dist < a.radius + ship.radius) {
        shipHit();
        break;
      }
    }
  }
}

function splitAsteroid(index) {
  const a = asteroids[index];
  if (a.level > 1) {
    const newRadius = a.radius / 2;
    const newLevel = a.level - 1;
    asteroids.push(createAsteroid(a.x, a.y, newRadius, newLevel));
    asteroids.push(createAsteroid(a.x, a.y, newRadius, newLevel));
  }
  asteroids.splice(index, 1);
}

function shipHit() {
  // Visual effects
  createExplosion(ship.x, ship.y, 30, 'orange', 4, 50);
  triggerShake(10, 20);
  triggerFlash('red');

  gameState.lives--;
  if (gameState.lives <= 0) {
    gameState.gameOver = true;
    createExplosion(ship.x, ship.y, 50, 'yellow', 5, 60);
  } else {
    // Respawn at center with invulnerability
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    ship.velocity = { x: 0, y: 0 };
    ship.angle = -Math.PI / 2;
    ship.blinkTime = 120; // 2 seconds at 60fps
  }
}

function resetGame() {
  gameState.score = 0;
  gameState.lives = 3;
  gameState.gameOver = false;
  gameState.level = 1;
  ship.x = canvas.width / 2;
  ship.y = canvas.height / 2;
  ship.velocity = { x: 0, y: 0 };
  ship.angle = -Math.PI / 2;
  ship.blinkTime = 120;
  bullets.length = 0;
  asteroids.length = 0;
  particles.length = 0;
  scorePopups.length = 0;
  spawnInitialAsteroids();
}

function drawUI() {
  ctx.fillStyle = 'white';
  ctx.font = '20px "Courier New"';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${gameState.score}`, 20, 40);
  ctx.fillText(`LIVES: ${gameState.lives}`, 20, 70);

  if (gameState.gameOver) {
    ctx.textAlign = 'center';
    ctx.font = '60px "Courier New"';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px "Courier New"';
    ctx.fillText('PRESS "R" TO RESTART', canvas.width / 2, canvas.height / 2 + 50);
  }
}

function update() {
  updateStars();
  updateParticles();
  updateScorePopups();
  updateShake();
  updateFlash();
  ship.update();
  updateBullets();
  updateAsteroids();
  checkCollisions();
}

function draw() {
  // Apply screen shake
  ctx.save();
  ctx.translate(screenShake.offsetX, screenShake.offsetY);

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();
  ship.draw();
  drawBullets();
  drawAsteroids();
  drawParticles();
  drawScorePopups();
  drawFlash();
  drawUI();

  ctx.restore();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

spawnInitialAsteroids();
loop();
