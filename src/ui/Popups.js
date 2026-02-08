export const scorePopups = [];

export function createScorePopup(x, y, score) {
    scorePopups.push({
        x, y,
        score,
        life: 60,
        vy: -2
    });
}

export function updateScorePopups() {
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        const p = scorePopups[i];
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) scorePopups.splice(i, 1);
    }
}

export function drawScorePopups(ctx) {
    ctx.font = '16px "Courier New"';
    ctx.textAlign = 'center';
    scorePopups.forEach(p => {
        const alpha = p.life / 60;
        ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
        ctx.fillText(`+${p.score}`, p.x, p.y);
    });
}

export function clearScorePopups() {
    scorePopups.length = 0;
}
