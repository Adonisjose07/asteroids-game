import './style.css'
import { createNoise2D } from 'simplex-noise'

// Initialize noise generators
const noise2D = createNoise2D();
const nebulaNoiseTime = { value: 0 };

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

// --- Nebula Background (Simplex Noise) ---
function drawNebula() {
  nebulaNoiseTime.value += 0.003;

  const resolution = 40;
  const cellWidth = canvas.width / resolution;
  const cellHeight = canvas.height / resolution;

  // Color shifting over time
  const colorTime = nebulaNoiseTime.value * 0.3;
  const hueShift = Math.sin(colorTime) * 0.5 + 0.5; // 0 to 1

  for (let x = 0; x < resolution; x++) {
    for (let y = 0; y < resolution; y++) {
      const nx = x * 0.08;
      const ny = y * 0.08;
      const t = nebulaNoiseTime.value;

      // Layer multiple noise octaves for more organic look
      const noise1 = noise2D(nx + t * 0.5, ny) * 0.5 + 0.5;
      const noise2 = noise2D(nx * 2, ny * 2 + t * 0.3) * 0.3 + 0.3;
      const combined = (noise1 + noise2) / 1.5;

      if (combined > 0.3) {
        const alpha = (combined - 0.3) * 0.4;

        // Shifting nebula colors: purple -> blue -> cyan -> pink -> purple
        const localHue = (hueShift + noise1 * 0.3) % 1;

        let r, g, b;
        if (localHue < 0.25) {
          // Purple to Blue
          const t = localHue / 0.25;
          r = Math.floor(150 - t * 100 + combined * 50);
          g = Math.floor(30 + t * 50 + combined * 40);
          b = Math.floor(200 + combined * 55);
        } else if (localHue < 0.5) {
          // Blue to Cyan
          const t = (localHue - 0.25) / 0.25;
          r = Math.floor(50 + combined * 30);
          g = Math.floor(80 + t * 120 + combined * 60);
          b = Math.floor(200 + combined * 55);
        } else if (localHue < 0.75) {
          // Cyan to Pink
          const t = (localHue - 0.5) / 0.25;
          r = Math.floor(50 + t * 150 + combined * 50);
          g = Math.floor(200 - t * 100 + combined * 30);
          b = Math.floor(200 + combined * 55);
        } else {
          // Pink to Purple
          const t = (localHue - 0.75) / 0.25;
          r = Math.floor(200 - t * 50 + combined * 50);
          g = Math.floor(100 - t * 70 + combined * 30);
          b = Math.floor(200 + combined * 55);
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth + 1, cellHeight + 1);
      }
    }
  }
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

// --- Weapon System ---
const WEAPON_TYPES = [
  {
    name: 'PLASMA',
    color: '#ff00ff',
    glowColor: 'rgba(255, 0, 255, 0.5)',
    speed: 6,
    size: 5,
    life: 40,
    cooldown: 25,
    spread: 0,
    count: 1,
    damage: 3,
    unlockScore: 0 // Always available
  },
  {
    name: 'MISSILE',
    color: '#ff6600',
    glowColor: 'rgba(255, 100, 0, 0.5)',
    speed: 5,
    size: 4,
    life: 120,
    cooldown: 35,
    spread: 0,
    count: 1,
    damage: 5,
    unlockScore: 500 // Unlock at 500 points
  },
  {
    name: 'LASER',
    color: '#00ffff',
    glowColor: 'rgba(0, 255, 255, 0.5)',
    speed: 8,
    size: 3,
    life: 90,
    cooldown: 15,
    spread: 0,
    count: 1,
    damage: 7,
    unlockScore: 1500 // Unlock at 1500 points
  },
  {
    name: 'SPREAD',
    color: '#ffff00',
    glowColor: 'rgba(255, 255, 0, 0.4)',
    speed: 7,
    size: 2,
    life: 60,
    cooldown: 20,
    spread: 0.3,
    count: 3,
    damage: 2,
    unlockScore: 3000 // Unlock at 3000 points
  }
];

let currentWeapon = 0;
const bullets = [];
let shootTimer = 0;

// Get available (unlocked) weapons
function getUnlockedWeapons() {
  return WEAPON_TYPES.filter(w => gameState.score >= w.unlockScore);
}

// Weapon switch with Q key - only unlocked weapons
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyQ') {
    const unlocked = getUnlockedWeapons();
    const currentIndex = unlocked.findIndex(w => w === WEAPON_TYPES[currentWeapon]);
    const nextIndex = (currentIndex + 1) % unlocked.length;
    currentWeapon = WEAPON_TYPES.indexOf(unlocked[nextIndex]);
  }
});

// --- Ship Entity ---
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 15,
  angle: -Math.PI / 2, // Facing up
  rotation: 0,
  velocity: { x: 0, y: 0 },
  thrusting: false,
  braking: false,
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

    // Braking logic
    this.braking = keys['ArrowDown'];
    if (this.braking) {
      this.velocity.x *= 0.95; // Strong deceleration
      this.velocity.y *= 0.95;
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
    const weapon = WEAPON_TYPES[currentWeapon];
    if (keys['Space'] && shootTimer === 0) {
      this.shoot();
      shootTimer = weapon.cooldown;
    }
  },

  shoot() {
    const weapon = WEAPON_TYPES[currentWeapon];
    const startX = this.x + Math.cos(this.angle) * this.radius;
    const startY = this.y + Math.sin(this.angle) * this.radius;

    // Fire multiple bullets for spread weapons
    for (let i = 0; i < weapon.count; i++) {
      const angleOffset = weapon.count > 1
        ? weapon.spread * (i - (weapon.count - 1) / 2)
        : 0;
      const bulletAngle = this.angle + angleOffset;

      bullets.push({
        x: startX,
        y: startY,
        vx: Math.cos(bulletAngle) * weapon.speed + this.velocity.x * 0.3,
        vy: Math.sin(bulletAngle) * weapon.speed + this.velocity.y * 0.3,
        life: weapon.life,
        radius: weapon.size,
        trail: [{ x: startX, y: startY }],
        type: currentWeapon,
        color: weapon.color,
        glowColor: weapon.glowColor,
        damage: weapon.damage,
        angle: bulletAngle
      });
    }
  },

  draw() {
    if (!this.visible) return;

    // Invulnerability blinking
    if (this.blinkTime > 0) {
      this.blinkTime--;
      if (Math.floor(this.blinkTime / 10) % 2 === 0) return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Modern ship body - sleek metallic gradient
    const bodyGradient = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
    bodyGradient.addColorStop(0, 'rgba(40, 50, 70, 0.9)');
    bodyGradient.addColorStop(0.3, 'rgba(80, 100, 130, 0.9)');
    bodyGradient.addColorStop(0.7, 'rgba(60, 80, 110, 0.9)');
    bodyGradient.addColorStop(1, 'rgba(30, 40, 60, 0.9)');

    // Main triangular body - slightly more elongated
    ctx.beginPath();
    ctx.moveTo(this.radius * 1.2, 0); // Nose (more pointed)
    const backLeftX = Math.cos((Math.PI * 3) / 4) * this.radius;
    const backLeftY = Math.sin((Math.PI * 3) / 4) * this.radius;
    const backRightX = Math.cos(-(Math.PI * 3) / 4) * this.radius;
    const backRightY = Math.sin(-(Math.PI * 3) / 4) * this.radius;
    ctx.lineTo(backLeftX, backLeftY);
    ctx.lineTo(-this.radius * 0.3, 0); // Indent at back
    ctx.lineTo(backRightX, backRightY);
    ctx.closePath();
    ctx.fillStyle = bodyGradient;
    ctx.fill();

    // Neon edge glow
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cockpit window - larger and more prominent
    ctx.beginPath();
    ctx.ellipse(this.radius * 0.35, 0, this.radius * 0.3, this.radius * 0.18, 0, 0, Math.PI * 2);
    const cockpitGradient = ctx.createRadialGradient(
      this.radius * 0.3, -this.radius * 0.05, 0,
      this.radius * 0.35, 0, this.radius * 0.3
    );
    cockpitGradient.addColorStop(0, 'rgba(150, 230, 255, 0.95)');
    cockpitGradient.addColorStop(0.5, 'rgba(80, 180, 255, 0.8)');
    cockpitGradient.addColorStop(1, 'rgba(40, 120, 200, 0.7)');
    ctx.fillStyle = cockpitGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 240, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Side accent lines (neon)
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.8, 0);
    ctx.lineTo(backLeftX * 0.5, backLeftY * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.8, 0);
    ctx.lineTo(backRightX * 0.5, backRightY * 0.5);
    ctx.stroke();

    // Engine nozzles - glowing
    ctx.fillStyle = 'rgba(20, 30, 50, 0.9)';
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(backLeftX * 0.65, backLeftY * 0.65, this.radius * 0.12, this.radius * 0.07, (Math.PI * 3) / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(backRightX * 0.65, backRightY * 0.65, this.radius * 0.12, this.radius * 0.07, -(Math.PI * 3) / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw thrust flames - BIGGER AND MORE DYNAMIC
    if (this.thrusting) {
      const flameLength = this.radius * (2.0 + Math.random() * 1.0); // Much bigger

      // Outer flame (orange/red) - LARGER
      ctx.beginPath();
      ctx.moveTo(backLeftX * 0.6, backLeftY * 0.6);
      ctx.quadraticCurveTo(
        -this.radius * 1.2, (Math.random() - 0.5) * this.radius * 0.3,
        -flameLength, 0
      );
      ctx.quadraticCurveTo(
        -this.radius * 1.2, (Math.random() - 0.5) * this.radius * 0.3,
        backRightX * 0.6, backRightY * 0.6
      );
      const flameGradient = ctx.createLinearGradient(0, 0, -flameLength, 0);
      flameGradient.addColorStop(0, 'rgba(255, 220, 100, 1)');
      flameGradient.addColorStop(0.3, 'rgba(255, 150, 50, 0.9)');
      flameGradient.addColorStop(0.6, 'rgba(255, 80, 20, 0.7)');
      flameGradient.addColorStop(1, 'rgba(200, 30, 0, 0)');
      ctx.fillStyle = flameGradient;
      ctx.fill();

      // Inner flame (white/cyan core) - LARGER
      ctx.beginPath();
      const coreLength = flameLength * 0.65;
      ctx.moveTo(backLeftX * 0.4, backLeftY * 0.4);
      ctx.quadraticCurveTo(
        -this.radius * 0.8, 0,
        -coreLength, 0
      );
      ctx.quadraticCurveTo(
        -this.radius * 0.8, 0,
        backRightX * 0.4, backRightY * 0.4
      );
      const coreGradient = ctx.createLinearGradient(0, 0, -coreLength, 0);
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      coreGradient.addColorStop(0.4, 'rgba(150, 220, 255, 0.8)');
      coreGradient.addColorStop(1, 'rgba(50, 150, 255, 0)');
      ctx.fillStyle = coreGradient;
      ctx.fill();
    }

    // Braking effect - reverse thrusters (front)
    if (this.braking) {
      const brakeLength = this.radius * (0.5 + Math.random() * 0.3);

      // Small front brake jets
      ctx.fillStyle = 'rgba(255, 100, 50, 0.7)';
      ctx.beginPath();
      ctx.moveTo(this.radius * 0.9, -this.radius * 0.15);
      ctx.lineTo(this.radius * 0.9 + brakeLength * 0.5, -this.radius * 0.3);
      ctx.lineTo(this.radius * 0.9, -this.radius * 0.05);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.radius * 0.9, this.radius * 0.15);
      ctx.lineTo(this.radius * 0.9 + brakeLength * 0.5, this.radius * 0.3);
      ctx.lineTo(this.radius * 0.9, this.radius * 0.05);
      ctx.fill();
    }

    ctx.restore();
  }
};

// --- Planet Boss System ---
let planet = null;

function createPlanet() {
  const radius = 80 + gameState.level * 10;
  const health = 20 + gameState.level * 10;

  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: radius,
    health: health,
    maxHealth: health,
    angle: 0,
    rotationSpeed: 0.002,
    // Surface features
    continents: Array.from({ length: 5 + Math.floor(Math.random() * 3) }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 0.6,
      size: 0.15 + Math.random() * 0.2,
      color: `hsl(${100 + Math.random() * 60}, 60%, ${30 + Math.random() * 20}%)`
    })),
    // Atmosphere color based on level
    atmosColor: `hsl(${200 + gameState.level * 30}, 70%, 50%)`,
    destroyed: false
  };
}

function drawPlanet() {
  if (!planet || planet.destroyed) return;

  ctx.save();
  ctx.translate(planet.x, planet.y);

  // Outer atmosphere glow
  const atmosGrad = ctx.createRadialGradient(0, 0, planet.radius * 0.8, 0, 0, planet.radius * 1.3);
  atmosGrad.addColorStop(0, 'transparent');
  atmosGrad.addColorStop(0.5, planet.atmosColor.replace(')', ', 0.3)').replace('hsl', 'hsla'));
  atmosGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = atmosGrad;
  ctx.beginPath();
  ctx.arc(0, 0, planet.radius * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Planet body
  ctx.save();
  ctx.rotate(planet.angle);

  // Base color gradient
  const bodyGrad = ctx.createRadialGradient(-planet.radius * 0.3, -planet.radius * 0.3, 0, 0, 0, planet.radius);
  bodyGrad.addColorStop(0, '#5588aa');
  bodyGrad.addColorStop(0.5, '#336688');
  bodyGrad.addColorStop(1, '#224466');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, planet.radius, 0, Math.PI * 2);
  ctx.fill();

  // Continents
  planet.continents.forEach(cont => {
    const cx = Math.cos(cont.angle) * planet.radius * cont.dist;
    const cy = Math.sin(cont.angle) * planet.radius * cont.dist;
    ctx.fillStyle = cont.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, planet.radius * cont.size, planet.radius * cont.size * 0.6, cont.angle, 0, Math.PI * 2);
    ctx.fill();
  });

  // Cloud layer
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 4; i++) {
    const cloudAngle = (i / 4) * Math.PI * 2 + planet.angle * 2;
    const cx = Math.cos(cloudAngle) * planet.radius * 0.5;
    const cy = Math.sin(cloudAngle) * planet.radius * 0.3;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(cx, cy, planet.radius * 0.3, planet.radius * 0.1, cloudAngle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // Damage cracks on planet
  const healthPercent = planet.health / planet.maxHealth;
  if (healthPercent < 1) {
    const crackCount = Math.floor((1 - healthPercent) * 12);
    ctx.strokeStyle = 'rgba(255, 100, 0, 0.8)';
    ctx.lineWidth = 3;

    for (let i = 0; i < crackCount; i++) {
      const angle = (i / crackCount) * Math.PI * 2;
      ctx.beginPath();
      let x = Math.cos(angle) * planet.radius * 0.3;
      let y = Math.sin(angle) * planet.radius * 0.3;
      ctx.moveTo(x, y);

      for (let s = 0; s < 4; s++) {
        const dist = planet.radius * (0.4 + s * 0.15);
        const jitter = (Math.random() - 0.5) * planet.radius * 0.1;
        x = Math.cos(angle + jitter * 0.05) * dist;
        y = Math.sin(angle + jitter * 0.05) * dist;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Lava glow in cracks
    if (healthPercent < 0.5) {
      ctx.fillStyle = `rgba(255, ${100 + Math.random() * 50}, 0, ${0.3 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(0, 0, planet.radius * (1 - healthPercent) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  // Health bar
  const barWidth = planet.radius * 2;
  const barHeight = 8;
  const barX = planet.x - barWidth / 2;
  const barY = planet.y - planet.radius - 25;

  ctx.fillStyle = 'rgba(100, 0, 0, 0.8)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  const hp = healthPercent;
  const r = hp < 0.5 ? 255 : Math.floor(255 - (hp - 0.5) * 2 * 255);
  const g = hp > 0.5 ? 255 : Math.floor(hp * 2 * 255);
  ctx.fillStyle = `rgb(${r}, ${g}, 0)`;
  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Boss label
  ctx.fillStyle = 'white';
  ctx.font = 'bold 14px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillText('PLANET BOSS', planet.x, barY - 8);
}

function updatePlanet() {
  if (!planet || planet.destroyed) return;
  planet.angle += planet.rotationSpeed;
}

// --- Asteroid System ---
const asteroids = [];
const ASTEROID_SPEED = 1.5;

function createAsteroid(x, y, radius, level) {
  const vertCount = Math.floor(Math.random() * 7 + 8);
  const offsets = [];
  for (let i = 0; i < vertCount; i++) {
    offsets.push(Math.random() * 0.4 + 0.8);
  }

  // Generate craters - mostly small, rarely large
  const craterCount = Math.floor(level * 2 + Math.random() * 3);
  const craters = [];
  for (let i = 0; i < craterCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius * 0.6;
    // 90% small craters, 10% large
    const isLarge = Math.random() < 0.1;
    const size = isLarge
      ? radius * (0.12 + Math.random() * 0.08) // Large: 12-20% of radius
      : radius * (0.03 + Math.random() * 0.04); // Small: 3-7% of radius
    craters.push({
      offsetX: Math.cos(angle) * dist,
      offsetY: Math.sin(angle) * dist,
      size: size,
      isLarge: isLarge
    });
  }

  // Generate surface lines/cracks - MORE DISPERSED AND RANDOM
  const crackCount = Math.floor(level * 3 + Math.random() * 4); // More cracks
  const cracks = [];
  for (let i = 0; i < crackCount; i++) {
    const startAngle = Math.random() * Math.PI * 2;
    const startDist = Math.random() * radius * 0.7; // Random distance from center
    const length = radius * (0.15 + Math.random() * 0.35);
    const segments = Math.floor(2 + Math.random() * 3); // Multi-segment cracks
    cracks.push({
      startAngle,
      startDist,
      length,
      curve: (Math.random() - 0.5) * 1.2, // More curve variation
      segments
    });
  }

  // Pre-generate surface patches (fixed brown spots)
  const patchCount = Math.min(Math.floor(radius / 5), 10);
  const patches = [];
  for (let i = 0; i < patchCount; i++) {
    const pAngle = (i / patchCount) * Math.PI * 2 + Math.random() * 0.5;
    const pDist = radius * (0.25 + Math.random() * 0.4);
    const shade = 90 + Math.floor(Math.random() * 70);
    patches.push({
      x: Math.cos(pAngle) * pDist,
      y: Math.sin(pAngle) * pDist,
      size: radius * (0.08 + Math.random() * 0.04),
      color: `rgb(${shade + 20}, ${shade}, ${shade - 20})`
    });
  }

  // Health based on size: Large=6, Medium=3, Small=1
  const health = level * 2;

  return {
    x: x ?? Math.random() * canvas.width,
    y: y ?? Math.random() * canvas.height,
    vx: (Math.random() * 2 - 1) * ASTEROID_SPEED * (4 - level) * 0.5,
    vy: (Math.random() * 2 - 1) * ASTEROID_SPEED * (4 - level) * 0.5,
    radius: radius,
    level: level, // 3: Large, 2: Medium, 1: Small
    health: health,
    maxHealth: health,
    vertCount: vertCount,
    offsets: offsets,
    angle: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() * 2 - 1) * 0.02,
    craters: craters,
    cracks: cracks,
    patches: patches
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
  // Update positions
  asteroids.forEach(a => {
    a.x += a.vx;
    a.y += a.vy;
    a.angle += a.rotationSpeed;

    if (a.x < -a.radius) a.x = canvas.width + a.radius;
    if (a.x > canvas.width + a.radius) a.x = -a.radius;
    if (a.y < -a.radius) a.y = canvas.height + a.radius;
    if (a.y > canvas.height + a.radius) a.y = -a.radius;
  });

  // Asteroid-Asteroid collisions
  for (let i = 0; i < asteroids.length; i++) {
    for (let j = i + 1; j < asteroids.length; j++) {
      const a1 = asteroids[i];
      const a2 = asteroids[j];
      const dx = a2.x - a1.x;
      const dy = a2.y - a1.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a1.radius + a2.radius;

      if (dist < minDist && dist > 0) {
        // Normalize collision vector
        const nx = dx / dist;
        const ny = dy / dist;

        // Relative velocity
        const dvx = a1.vx - a2.vx;
        const dvy = a1.vy - a2.vy;
        const dvn = dvx * nx + dvy * ny;

        // Only resolve if moving towards each other
        if (dvn > 0) {
          // Simple elastic collision (equal mass approximation)
          const impulse = dvn * 0.8; // 0.8 for slight energy loss
          a1.vx -= impulse * nx;
          a1.vy -= impulse * ny;
          a2.vx += impulse * nx;
          a2.vy += impulse * ny;

          // Separate overlapping asteroids
          const overlap = (minDist - dist) / 2;
          a1.x -= overlap * nx;
          a1.y -= overlap * ny;
          a2.x += overlap * nx;
          a2.y += overlap * ny;
        }
      }
    }
  }

  if (asteroids.length === 0 && !gameState.gameOver) {
    // Check if planet boss exists
    if (!planet) {
      // Spawn planet boss
      planet = createPlanet();
    } else if (planet.destroyed) {
      // Planet defeated, next level
      planet = null;
      gameState.level++;
      spawnInitialAsteroids();
    }
  }
}

function drawAsteroids() {
  asteroids.forEach((a, asteroidIndex) => {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);

    // Create clipping path for asteroid shape
    ctx.beginPath();
    for (let i = 0; i < a.vertCount; i++) {
      const angle = (i / a.vertCount) * Math.PI * 2;
      const r = a.radius * a.offsets[i];
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Rocky brown gradient fill
    const gradient = ctx.createRadialGradient(
      -a.radius * 0.3, -a.radius * 0.3, 0,
      0, 0, a.radius
    );
    gradient.addColorStop(0, 'rgba(120, 90, 60, 0.7)');  // Light brown highlight
    gradient.addColorStop(0.5, 'rgba(80, 60, 40, 0.6)'); // Medium brown
    gradient.addColorStop(1, 'rgba(50, 35, 25, 0.5)');   // Dark brown shadow
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw outline with brownish tint
    ctx.strokeStyle = 'rgba(200, 180, 150, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw pre-generated surface patches (fixed brown spots)
    ctx.globalAlpha = 0.6;
    a.patches.forEach(patch => {
      ctx.fillStyle = patch.color;
      ctx.beginPath();
      ctx.arc(patch.x, patch.y, patch.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw craters - simplified for small ones
    a.craters.forEach(crater => {
      // Crater shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(crater.offsetX, crater.offsetY, crater.size, 0, Math.PI * 2);
      ctx.fill();

      // Only add rim and inner detail for large craters
      if (crater.isLarge) {
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(crater.offsetX, crater.offsetY, crater.size, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(50, 50, 50, 0.4)';
        ctx.beginPath();
        ctx.arc(crater.offsetX + crater.size * 0.15, crater.offsetY + crater.size * 0.15, crater.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw surface cracks - DARK CRACKS
    ctx.strokeStyle = 'rgba(20, 15, 10, 0.8)'; // Dark brown/black
    ctx.lineWidth = 1.5;
    a.cracks.forEach(crack => {
      ctx.beginPath();
      // Start from random position on asteroid
      let currentX = Math.cos(crack.startAngle) * crack.startDist;
      let currentY = Math.sin(crack.startAngle) * crack.startDist;
      ctx.moveTo(currentX, currentY);

      // Draw multi-segment jagged crack
      const segmentLength = crack.length / crack.segments;
      let currentAngle = crack.startAngle + crack.curve;

      for (let s = 0; s < crack.segments; s++) {
        // Add randomness to each segment
        currentAngle += (Math.random() - 0.5) * 0.8;
        currentX += Math.cos(currentAngle) * segmentLength;
        currentY += Math.sin(currentAngle) * segmentLength;
        ctx.lineTo(currentX, currentY);
      }
      ctx.stroke();
    });

    // Draw DAMAGE CRACKS based on health lost
    const healthPercent = a.health / a.maxHealth;
    if (healthPercent < 1) {
      const damageCrackCount = Math.floor((1 - healthPercent) * 8); // More cracks as health drops
      ctx.strokeStyle = 'rgba(255, 50, 0, 0.7)'; // Red/orange damage cracks
      ctx.lineWidth = 2;

      for (let i = 0; i < damageCrackCount; i++) {
        const angle = (i / damageCrackCount) * Math.PI * 2 + asteroidIndex;
        const startDist = a.radius * 0.2;
        const endDist = a.radius * (0.5 + (1 - healthPercent) * 0.4);

        ctx.beginPath();
        let x = Math.cos(angle) * startDist;
        let y = Math.sin(angle) * startDist;
        ctx.moveTo(x, y);

        // Jagged crack path
        const segments = 3;
        for (let s = 1; s <= segments; s++) {
          const t = s / segments;
          const dist = startDist + (endDist - startDist) * t;
          const jitter = (Math.random() - 0.5) * a.radius * 0.15;
          x = Math.cos(angle + jitter * 0.1) * dist + jitter;
          y = Math.sin(angle + jitter * 0.1) * dist + jitter * 0.5;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    ctx.restore();

    // Draw health bar ABOVE asteroid (not rotated)
    if (a.health < a.maxHealth) {
      const barWidth = a.radius * 1.5;
      const barHeight = 4;
      const barX = a.x - barWidth / 2;
      const barY = a.y - a.radius - 12;

      // Background (red)
      ctx.fillStyle = 'rgba(150, 0, 0, 0.8)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Health fill (green to yellow to red gradient based on health)
      const hp = healthPercent;
      const r = hp < 0.5 ? 255 : Math.floor(255 - (hp - 0.5) * 2 * 255);
      const g = hp > 0.5 ? 255 : Math.floor(hp * 2 * 255);
      ctx.fillStyle = `rgb(${r}, ${g}, 0)`;
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
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

    // Remove bullets that leave canvas (no wrap-around)
    if (b.x < -10 || b.x > canvas.width + 10 || b.y < -10 || b.y > canvas.height + 10) {
      bullets.splice(i, 1);
      continue;
    }

    if (b.life <= 0) {
      bullets.splice(i, 1);
    }
  }
}

function drawBullets() {
  bullets.forEach(b => {
    ctx.save();

    // Draw trail with bullet color
    for (let i = 0; i < b.trail.length; i++) {
      const alpha = (i / b.trail.length) * 0.4;
      const size = (i / b.trail.length) * b.radius * 0.8;
      ctx.fillStyle = b.glowColor || `rgba(255, 255, 255, ${alpha})`;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(b.trail[i].x, b.trail[i].y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw based on weapon type
    const type = b.type || 0;

    if (type === 0) {
      // LASER - elongated beam
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      // Glow
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;

      // Beam shape
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.radius * 3, b.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.ellipse(0, 0, b.radius * 2, b.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 1) {
      // PLASMA - glowing orb with pulsing
      const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.2;

      ctx.shadowColor = b.color;
      ctx.shadowBlur = 15;

      // Outer glow
      const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 2 * pulse);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.3, b.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 2 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 2) {
      // MISSILE - rocket shape with fire trail
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      // Fire trail
      const trailLength = b.radius * 4;
      const fireGradient = ctx.createLinearGradient(0, 0, -trailLength, 0);
      fireGradient.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
      fireGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.6)');
      fireGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = fireGradient;
      ctx.beginPath();
      ctx.moveTo(-b.radius, -b.radius * 0.5);
      ctx.lineTo(-trailLength, 0);
      ctx.lineTo(-b.radius, b.radius * 0.5);
      ctx.fill();

      // Missile body
      ctx.fillStyle = '#444';
      ctx.beginPath();
      ctx.moveTo(b.radius * 2, 0);
      ctx.lineTo(-b.radius, -b.radius * 0.8);
      ctx.lineTo(-b.radius * 0.5, 0);
      ctx.lineTo(-b.radius, b.radius * 0.8);
      ctx.closePath();
      ctx.fill();

      // Missile tip
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.radius * 1.5, 0, b.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 3) {
      // SPREAD - small pellets
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 5;

      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
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
      if (!b) continue;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (dist < a.radius + b.radius) {
        // Apply damage
        const damage = b.damage || 1;
        a.health -= damage;

        // Small hit effect
        createExplosion(b.x, b.y, 3, b.color || 'white', 1);

        // Remove bullet
        bullets.splice(i, 1);

        // Check if asteroid is destroyed
        if (a.health <= 0) {
          const points = (4 - a.level) * 10;
          gameState.score += points;
          createScorePopup(a.x, a.y, points);
          createExplosion(a.x, a.y, a.level * 8, 'orange', 2 + a.level);
          if (a.level === 3) triggerShake(3, 8);
          splitAsteroid(j);
        } else {
          // Hit flash - small explosion for damage feedback
          createExplosion(a.x, a.y, 4, 'yellow', 1, 20);
        }
        break;
      }
    }
  }

  // Bullet-Planet
  if (planet && !planet.destroyed) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b) continue;
      const dist = Math.hypot(b.x - planet.x, b.y - planet.y);
      if (dist < planet.radius + b.radius) {
        const damage = b.damage || 1;
        planet.health -= damage;

        createExplosion(b.x, b.y, 5, b.color || 'orange', 2);
        bullets.splice(i, 1);

        if (planet.health <= 0) {
          // Planet destroyed!
          planet.destroyed = true;
          const points = 100 + gameState.level * 50;
          gameState.score += points;
          createScorePopup(planet.x, planet.y, points);
          createExplosion(planet.x, planet.y, 50, 'orange', 5);
          createExplosion(planet.x, planet.y, 40, 'red', 4);
          createExplosion(planet.x, planet.y, 30, 'yellow', 3);
          triggerShake(15, 30);
          triggerFlash('orange');
        }
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

    // Ship-Planet collision
    if (planet && !planet.destroyed) {
      const dist = Math.hypot(ship.x - planet.x, ship.y - planet.y);
      if (dist < planet.radius + ship.radius) {
        shipHit();
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

  // Weapon indicator - top left below lives
  const weapon = WEAPON_TYPES[currentWeapon];

  // Background box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.strokeStyle = weapon.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(15, 85, 140, 50, 8);
  ctx.fill();
  ctx.stroke();

  // Weapon name
  ctx.fillStyle = weapon.color;
  ctx.font = 'bold 14px "Courier New"';
  ctx.fillText(weapon.name, 50, 105);

  // Weapon icon preview
  ctx.save();
  ctx.translate(32, 118);

  if (currentWeapon === 0) {
    // Plasma icon
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(0.5, weapon.color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (currentWeapon === 1) {
    // Missile icon
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-4, -3);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-4, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = weapon.color;
    ctx.beginPath();
    ctx.arc(6, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (currentWeapon === 2) {
    // Laser icon
    ctx.fillStyle = weapon.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (currentWeapon === 3) {
    // Spread icon
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = weapon.color;
      ctx.beginPath();
      ctx.arc(i * 5, i * 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Q to switch hint + unlock count
  const unlocked = getUnlockedWeapons();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '10px "Courier New"';
  ctx.fillText(`[Q] ${unlocked.length}/${WEAPON_TYPES.length}`, 70, 128);

  // Next unlock hint
  const nextLocked = WEAPON_TYPES.find(w => gameState.score < w.unlockScore);
  if (nextLocked) {
    ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
    ctx.font = '9px "Courier New"';
    ctx.fillText(`NEXT: ${nextLocked.unlockScore} pts`, 20, 148);
  }

  if (gameState.gameOver) {
    ctx.textAlign = 'center';
    ctx.font = '60px "Courier New"';
    ctx.fillStyle = 'white';
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
  updatePlanet();
  checkCollisions();
}

function draw() {
  // Apply screen shake
  ctx.save();
  ctx.translate(screenShake.offsetX, screenShake.offsetY);

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();
  drawNebula();
  drawPlanet();
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
