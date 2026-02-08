export const WEAPON_TYPES = [
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
        unlockScore: 0
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
        unlockScore: 500
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
        unlockScore: 1500
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
        unlockScore: 3000
    }
];

export const bullets = [];
const bulletPool = [];
const MAX_POOL_SIZE = 100;

export function createBullet(x, y, vx, vy, life, radius, type, color, glowColor, damage, angle) {
    let b;
    if (bulletPool.length > 0) {
        b = bulletPool.pop();
        b.x = x;
        b.y = y;
        b.vx = vx;
        b.vy = vy;
        b.life = life;
        b.radius = radius;
        b.type = type;
        b.color = color;
        b.glowColor = glowColor;
        b.damage = damage;
        b.angle = angle;
        b.trail = [{ x, y }];
    } else {
        b = { x, y, vx, vy, life, radius, type, color, glowColor, damage, angle, trail: [{ x, y }] };
    }
    bullets.push(b);
}

export function updateBullets(canvasWidth, canvasHeight) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 8) b.trail.shift();
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        if (b.x < -10 || b.x > canvasWidth + 10 || b.y < -10 || b.y > canvasHeight + 10 || b.life <= 0) {
            const removed = bullets.splice(i, 1)[0];
            if (bulletPool.length < MAX_POOL_SIZE) bulletPool.push(removed);
        }
    }
}

export function drawBullets(ctx) {
    bullets.forEach(b => {
        ctx.save();

        // Draw trail
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

        const type = b.type || 0;
        if (type === 0) { // PLASMA (Original said type 0 was LASER in draw logic, but WEAPON_TYPES has PLASMA at 0. Checking index mapping...)
            // The old draw logic: if (type === 0) { // LASER ... } ... else if (type === 1) { // PLASMA ... }
            // In WEAPON_TYPES: 0: PLASMA, 1: MISSILE, 2: LASER, 3: SPREAD.
            // I will map the logical drawing to the correct index in WEAPON_TYPES.

            // PLASMA style (Original type 1 logic)
            const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.2;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 15;
            const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 2 * pulse);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(0.3, b.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 2 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();

        } else if (type === 1) { // MISSILE
            ctx.translate(b.x, b.y);
            ctx.rotate(b.angle);
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
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.moveTo(b.radius * 2, 0);
            ctx.lineTo(-b.radius, -b.radius * 0.8);
            ctx.lineTo(-b.radius * 0.5, 0);
            ctx.lineTo(-b.radius, b.radius * 0.8);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.radius * 1.5, 0, b.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();

        } else if (type === 2) { // LASER
            ctx.translate(b.x, b.y);
            ctx.rotate(b.angle);
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, b.radius * 3, b.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.ellipse(0, 0, b.radius * 2, b.radius * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();

        } else if (type === 3) { // SPREAD
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

export function clearBullets() {
    bullets.length = 0;
}
