export function createAsteroid(x, y, radius, level, canvasWidth, canvasHeight, ASTEROID_SPEED, gameStateLevel) {
    const vertCount = Math.floor(Math.random() * 7 + 8);
    const offsets = [];
    for (let i = 0; i < vertCount; i++) {
        offsets.push(Math.random() * 0.4 + 0.8);
    }

    const craterCount = Math.floor(level * 2 + Math.random() * 3);
    const craters = [];
    for (let i = 0; i < craterCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius * 0.6;
        const isLarge = Math.random() < 0.1;
        const size = isLarge
            ? radius * (0.12 + Math.random() * 0.08)
            : radius * (0.03 + Math.random() * 0.04);
        craters.push({ offsetX: Math.cos(angle) * dist, offsetY: Math.sin(angle) * dist, size, isLarge });
    }

    const crackCount = Math.floor(level * 3 + Math.random() * 4);
    const cracks = [];
    for (let i = 0; i < crackCount; i++) {
        cracks.push({
            startAngle: Math.random() * Math.PI * 2,
            startDist: Math.random() * radius * 0.7,
            length: radius * (0.15 + Math.random() * 0.35),
            curve: (Math.random() - 0.5) * 1.2,
            segments: Math.floor(2 + Math.random() * 3)
        });
    }

    const patches = [];
    const patchCount = Math.min(Math.floor(radius / 5), 10);
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

    const health = level * 2;

    return {
        x: x ?? Math.random() * canvasWidth,
        y: y ?? Math.random() * canvasHeight,
        vx: (Math.random() * 2 - 1) * ASTEROID_SPEED * (4 - level) * 0.5 * (1 + gameStateLevel * 0.1),
        vy: (Math.random() * 2 - 1) * ASTEROID_SPEED * (4 - level) * 0.5 * (1 + gameStateLevel * 0.1),
        radius, level, health, maxHealth: health, vertCount, offsets,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() * 2 - 1) * 0.02,
        craters, cracks, patches
    };
}

export function updateAsteroids(asteroids, canvasWidth, canvasHeight) {
    asteroids.forEach(a => {
        a.x += a.vx;
        a.y += a.vy;
        a.angle += a.rotationSpeed;
        if (a.x < -a.radius) a.x = canvasWidth + a.radius;
        if (a.x > canvasWidth + a.radius) a.x = -a.radius;
        if (a.y < -a.radius) a.y = canvasHeight + a.radius;
        if (a.y > canvasHeight + a.radius) a.y = -a.radius;
    });

    for (let i = 0; i < asteroids.length; i++) {
        for (let j = i + 1; j < asteroids.length; j++) {
            const a1 = asteroids[i];
            const a2 = asteroids[j];
            const dx = a2.x - a1.x;
            const dy = a2.y - a1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = a1.radius + a2.radius;

            if (dist < minDist && dist > 0) {
                const nx = dx / dist;
                const ny = dy / dist;
                const dvx = a1.vx - a2.vx;
                const dvy = a1.vy - a2.vy;
                const dvn = dvx * nx + dvy * ny;

                if (dvn > 0) {
                    const impulse = dvn * 0.8;
                    a1.vx -= impulse * nx;
                    a1.vy -= impulse * ny;
                    a2.vx += impulse * nx;
                    a2.vy += impulse * ny;
                    const overlap = (minDist - dist) / 2;
                    a1.x -= overlap * nx;
                    a1.y -= overlap * ny;
                    a2.x += overlap * nx;
                    a2.y += overlap * ny;
                }
            }
        }
    }
}

export function drawAsteroids(ctx, asteroids) {
    asteroids.forEach((a, asteroidIndex) => {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);

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

        const gradient = ctx.createRadialGradient(-a.radius * 0.3, -a.radius * 0.3, 0, 0, 0, a.radius);
        gradient.addColorStop(0, 'rgba(120, 90, 60, 0.7)');
        gradient.addColorStop(0.5, 'rgba(80, 60, 40, 0.6)');
        gradient.addColorStop(1, 'rgba(50, 35, 25, 0.5)');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = 'rgba(200, 180, 150, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.globalAlpha = 0.6;
        a.patches.forEach(patch => {
            ctx.fillStyle = patch.color;
            ctx.beginPath();
            ctx.arc(patch.x, patch.y, patch.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        a.craters.forEach(crater => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(crater.offsetX, crater.offsetY, crater.size, 0, Math.PI * 2);
            ctx.fill();
            if (crater.isLarge) {
                ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(crater.offsetX, crater.offsetY, crater.size, 0, Math.PI * 2);
                ctx.stroke();
            }
        });

        ctx.strokeStyle = 'rgba(20, 15, 10, 0.8)';
        ctx.lineWidth = 1.5;
        a.cracks.forEach(crack => {
            ctx.beginPath();
            let currentX = Math.cos(crack.startAngle) * crack.startDist;
            let currentY = Math.sin(crack.startAngle) * crack.startDist;
            ctx.moveTo(currentX, currentY);
            const segmentLength = crack.length / crack.segments;
            let currentAngle = crack.startAngle + crack.curve;
            for (let s = 0; s < crack.segments; s++) {
                currentAngle += (Math.random() - 0.5) * 0.8;
                currentX += Math.cos(currentAngle) * segmentLength;
                currentY += Math.sin(currentAngle) * segmentLength;
                ctx.lineTo(currentX, currentY);
            }
            ctx.stroke();
        });

        const healthPercent = a.health / a.maxHealth;
        if (healthPercent < 1) {
            const damageCrackCount = Math.floor((1 - healthPercent) * 8);
            ctx.strokeStyle = 'rgba(255, 50, 0, 0.7)';
            ctx.lineWidth = 2;
            for (let i = 0; i < damageCrackCount; i++) {
                const angle = (i / damageCrackCount) * Math.PI * 2 + asteroidIndex;
                const startDist = a.radius * 0.2, endDist = a.radius * (0.5 + (1 - healthPercent) * 0.4);
                ctx.beginPath();
                let x = Math.cos(angle) * startDist, y = Math.sin(angle) * startDist;
                ctx.moveTo(x, y);
                for (let s = 1; s <= 3; s++) {
                    const jitter = (Math.random() - 0.5) * a.radius * 0.15;
                    const dist = startDist + (endDist - startDist) * (s / 3);
                    x = Math.cos(angle + jitter * 0.1) * dist + jitter;
                    y = Math.sin(angle + jitter * 0.1) * dist + jitter * 0.5;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        }
        ctx.restore();
    });
}
