import './style.css';
import { gameState, resetGameState, canvas, ctx, resizeCanvas } from './core/GameState.js';
import { keys } from './core/Input.js';
import { initStars, updateStars, drawStars } from './vfx/Starfield.js';
import { drawNebula } from './vfx/Nebula.js';
import { updateParticles, drawParticles, createExplosion, clearParticles } from './vfx/ParticleSystem.js';
import { screenShake, triggerShake, updateShake, triggerFlash, updateFlash, drawFlash } from './vfx/ScreenEffects.js';
import { Ship } from './entities/Ship.js';
import { createAsteroid, updateAsteroids, drawAsteroids } from './entities/Asteroid.js';
import { bullets, updateBullets, drawBullets, clearBullets, WEAPON_TYPES } from './entities/Bullet.js';
import { createPlanet, updatePlanet, drawPlanet } from './entities/Boss.js';
import { drawHUD } from './ui/HUD.js';
import { createScorePopup, updateScorePopups, drawScorePopups, clearScorePopups } from './ui/Popups.js';
import { MobileControls } from './ui/MobileControls.js';

// --- Configuration ---
const ASTEROID_SPEED = 1.5;
const asteroids = [];
let planet = null;
const dustParticles = [];

// Initial resize
resizeCanvas();

const ship = new Ship(canvas.width, canvas.height);
const mobileControls = new MobileControls(canvas, ship, WEAPON_TYPES, getUnlockedWeapons, resetGame, gameState);

window.addEventListener('resize', () => {
  resizeCanvas();
  // Optionally reset ship position or notify modules of change
  // ship.x = canvas.width / 2;
  // ship.y = canvas.height / 2;
});

function spawnInitialAsteroids() {
  asteroids.length = 0;
  const count = 3 + gameState.level * 2;
  for (let i = 0; i < count; i++) {
    asteroids.push(createAsteroid(null, null, 40 + Math.random() * 20, 3, canvas.width, canvas.height, ASTEROID_SPEED, gameState.level));
  }
}

function createStarDust(x, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.5 + 0.5;
    dustParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 2 + 2,
      life: 300 + Math.random() * 200,
      color: `hsla(${240 + Math.random() * 60}, 100%, 75%, 0.8)`
    });
  }
}

function updateStarDust() {
  for (let i = dustParticles.length - 1; i >= 0; i--) {
    const d = dustParticles[i];
    d.x += d.vx;
    d.y += d.vy;
    d.life--;

    if (d.x < 0) d.x = canvas.width;
    if (d.x > canvas.width) d.x = 0;
    if (d.y < 0) d.y = canvas.height;
    if (d.y > canvas.height) d.y = 0;

    if (d.life <= 0) dustParticles.splice(i, 1);
  }
}

function drawStarDust(ctx) {
  dustParticles.forEach(d => {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = d.color;
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// Get available (unlocked) weapons
function getUnlockedWeapons() {
  return WEAPON_TYPES.filter(w => gameState.score >= w.unlockScore);
}

// Weapon switch with Q key - only unlocked weapons
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyQ' && !gameState.gameOver) {
    const unlocked = getUnlockedWeapons();
    const currentW = WEAPON_TYPES[ship.currentWeapon];
    const currentIndexInUnlocked = unlocked.findIndex(w => w.name === currentW.name);

    const nextIndexInUnlocked = (currentIndexInUnlocked + 1) % unlocked.length;
    const nextWeapon = unlocked[nextIndexInUnlocked];

    ship.currentWeapon = WEAPON_TYPES.findIndex(w => w.name === nextWeapon.name);
  }
});

function resetGame() {
  resetGameState();
  ship.reset(canvas.width, canvas.height);
  clearBullets();
  clearParticles();
  clearScorePopups();
  asteroids.length = 0;
  planet = null;
  dustParticles.length = 0;
  spawnInitialAsteroids();
}

function shipHit(damage = 34) {
  if (ship.blinkTime > 0 || !ship.visible) return;
  createExplosion(ship.x, ship.y, 30, 'orange', 4, 50);
  triggerShake(10, 20);
  triggerFlash('red');
  ship.hp -= damage;

  if (ship.hp <= 0) {
    gameState.lives--;
    ship.hp = ship.maxHp;
    if (gameState.lives <= 0) {
      gameState.gameOver = true;
      createExplosion(ship.x, ship.y, 50, 'yellow', 5, 60);
    } else {
      ship.reset(canvas.width, canvas.height);
    }
  } else {
    ship.blinkTime = 60;
  }
}

function splitAsteroid(index) {
  const a = asteroids[index];
  if (a.level > 1) {
    const newRadius = a.radius / 2;
    const newLevel = a.level - 1;
    asteroids.push(createAsteroid(a.x, a.y, newRadius, newLevel, canvas.width, canvas.height, ASTEROID_SPEED, gameState.level));
    asteroids.push(createAsteroid(a.x, a.y, newRadius, newLevel, canvas.width, canvas.height, ASTEROID_SPEED, gameState.level));

    // Level 2+ Hazard: Large asteroids release star dust
    if (a.level === 3 && gameState.level >= 2) {
      createStarDust(a.x, a.y, 8 + Math.floor(Math.random() * 5));
    }
  }
  asteroids.splice(index, 1);
}

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
        a.health -= b.damage;
        createExplosion(b.x, b.y, 3, b.color, 1);
        bullets.splice(i, 1);
        if (a.health <= 0) {
          const points = (4 - a.level) * 10;
          gameState.score += points;
          createScorePopup(a.x, a.y, points);
          createExplosion(a.x, a.y, a.level * 8, 'orange', 2 + a.level);
          if (a.level === 3) triggerShake(3, 8);
          splitAsteroid(j);
        } else {
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
      const dist = Math.hypot(b.x - planet.x, b.y - planet.y);
      if (dist < planet.radius + b.radius) {
        planet.health -= b.damage;
        createExplosion(b.x, b.y, 5, b.color, 2);
        bullets.splice(i, 1);
        if (planet.health <= 0) {
          planet.destroyed = true;
          gameState.score += 100 + gameState.level * 50;
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
      if (Math.hypot(ship.x - a.x, ship.y - a.y) < a.radius + ship.radius) {
        shipHit(34);
        break;
      }
    }
  }

  // Ship-Star Dust collision
  for (let i = dustParticles.length - 1; i >= 0; i--) {
    const d = dustParticles[i];
    const dist = Math.hypot(ship.x - d.x, ship.y - d.y);
    if (dist < d.radius + ship.radius) {
      shipHit(10); // Small damage
      dustParticles.splice(i, 1);
      break;
    }
  }
}

function update() {
  updateStars(canvas.width, canvas.height);
  updateParticles();
  updateScorePopups();
  updateShake();
  updateFlash();
  updateStarDust();

  if (keys['KeyR'] && gameState.gameOver) resetGame();

  if (keys['Space'] && !gameState.gameOver) {
    if (ship.shootTimer <= 0) {
      ship.shoot();
      ship.shootTimer = WEAPON_TYPES[ship.currentWeapon].cooldown;
    }
  }
  if (ship.shootTimer > 0) ship.shootTimer--;

  ship.update(keys, canvas.width, canvas.height, gameState.gameOver);
  updateBullets(canvas.width, canvas.height);
  updateAsteroids(asteroids, canvas.width, canvas.height);
  if (planet) updatePlanet(planet);
  checkCollisions();

  if (asteroids.length === 0 && !gameState.gameOver) {
    if (!planet) planet = createPlanet(canvas.width, canvas.height, gameState.level);
    else if (planet.destroyed) {
      planet = null;
      gameState.level++;
      spawnInitialAsteroids();
    }
  }
}

function draw() {
  ctx.save();
  ctx.translate(screenShake.offsetX, screenShake.offsetY);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars(ctx);
  drawNebula(ctx, canvas.width, canvas.height);
  drawStarDust(ctx);
  if (planet) drawPlanet(ctx, planet);
  ship.draw(ctx);
  drawBullets(ctx);
  drawAsteroids(ctx, asteroids);
  drawParticles(ctx);
  drawScorePopups(ctx);
  drawFlash(ctx, canvas.width, canvas.height);
  mobileControls.draw(ctx);
  drawHUD(ctx, gameState, ship, ship.currentWeapon, WEAPON_TYPES, getUnlockedWeapons(), canvas.width, canvas.height);
  ctx.restore();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

initStars(canvas.width, canvas.height);
spawnInitialAsteroids();
loop();
