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
            if (bulletPool.length < MAX_POOL_SIZE) {
                bulletPool.push(removed);
            }
        }
    }
}

export function drawBullets(ctx) {
    ctx.save();
    bullets.forEach(b => {
        if (b.trail.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = b.glowColor;
            ctx.lineWidth = b.radius / 2;
            ctx.moveTo(b.trail[0].x, b.trail[0].y);
            for (let i = 1; i < b.trail.length; i++) {
                ctx.lineTo(b.trail[i].x, b.trail[i].y);
            }
            ctx.stroke();
        }

        ctx.fillStyle = b.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.glowColor;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    ctx.restore();
}

export function clearBullets() {
    bullets.length = 0;
}
