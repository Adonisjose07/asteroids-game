export const stars = [];

export function initStars(canvasWidth, canvasHeight) {
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            size: Math.random() * 2,
            opacity: Math.random() * 0.5 + 0.5,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

export function updateStars(canvasWidth, canvasHeight) {
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvasHeight) {
            s.y = 0;
            s.x = Math.random() * canvasWidth;
        }
    });
}

export function drawStars(ctx) {
    ctx.save();
    stars.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}
