export const particles = [];

export function createExplosion(x, y, count, color = 'white', speed = 3, life = 40) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const s = Math.random() * speed;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * s,
            vy: Math.sin(angle) * s,
            life: Math.random() * life + 10,
            color: color,
            size: Math.random() * 3 + 1
        });
    }
}

export function updateParticles() {
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

export function drawParticles(ctx) {
    ctx.save();
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 50;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.restore();
}

export function clearParticles() {
    particles.length = 0;
}
