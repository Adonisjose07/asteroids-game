export function createPlanet(canvasWidth, canvasHeight, gameStateLevel) {
    const radius = 80 + gameStateLevel * 10;
    const health = 20 + gameStateLevel * 10;

    return {
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        radius: radius,
        health: health,
        maxHealth: health,
        angle: 0,
        rotationSpeed: 0.002,
        continents: Array.from({ length: 5 + Math.floor(Math.random() * 3) }, () => ({
            angle: Math.random() * Math.PI * 2,
            dist: Math.random() * 0.6,
            size: 0.15 + Math.random() * 0.2,
            color: `hsl(${100 + Math.random() * 60}, 60%, ${30 + Math.random() * 20}%)`
        })),
        atmosColor: `hsl(${200 + gameStateLevel * 30}, 70%, 50%)`,
        destroyed: false
    };
}

export function updatePlanet(planet) {
    if (!planet || planet.destroyed) return;
    planet.angle += planet.rotationSpeed;
}

export function drawPlanet(ctx, planet) {
    if (!planet || planet.destroyed) return;

    ctx.save();
    ctx.translate(planet.x, planet.y);

    const atmosGrad = ctx.createRadialGradient(0, 0, planet.radius * 0.8, 0, 0, planet.radius * 1.3);
    atmosGrad.addColorStop(0, 'transparent');
    atmosGrad.addColorStop(0.5, planet.atmosColor.replace(')', ', 0.3)').replace('hsl', 'hsla'));
    atmosGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = atmosGrad;
    ctx.beginPath();
    ctx.arc(0, 0, planet.radius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(planet.angle);
    const bodyGrad = ctx.createRadialGradient(-planet.radius * 0.3, -planet.radius * 0.3, 0, 0, 0, planet.radius);
    bodyGrad.addColorStop(0, '#5588aa');
    bodyGrad.addColorStop(0.5, '#336688');
    bodyGrad.addColorStop(1, '#224466');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, planet.radius, 0, Math.PI * 2);
    ctx.fill();

    planet.continents.forEach(cont => {
        const cx = Math.cos(cont.angle) * planet.radius * cont.dist;
        const cy = Math.sin(cont.angle) * planet.radius * cont.dist;
        ctx.fillStyle = cont.color;
        ctx.beginPath();
        ctx.ellipse(cx, cy, planet.radius * cont.size, planet.radius * cont.size * 0.6, cont.angle, 0, Math.PI * 2);
        ctx.fill();
    });

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

    const healthPercent = planet.health / planet.maxHealth;
    if (healthPercent < 1) {
        const crackCount = Math.floor((1 - healthPercent) * 12);
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.8)';
        ctx.lineWidth = 3;
        for (let i = 0; i < crackCount; i++) {
            const angle = (i / crackCount) * Math.PI * 2;
            ctx.beginPath();
            let x = Math.cos(angle) * planet.radius * 0.3, y = Math.sin(angle) * planet.radius * 0.3;
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
    }
    ctx.restore();

    const barWidth = planet.radius * 2, barHeight = 8;
    const barX = planet.x - barWidth / 2, barY = planet.y - planet.radius - 25;
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
}
