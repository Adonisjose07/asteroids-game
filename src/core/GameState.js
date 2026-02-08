export const gameState = {
    score: 0,
    lives: 3,
    gameOver: false,
    level: 1
};

export const canvas = document.querySelector('#game');
export const ctx = canvas ? canvas.getContext('2d') : null;

// Logical dimensions (for physics/logic)
export let logicalWidth = window.innerWidth;
export let logicalHeight = window.innerHeight;

if (!canvas) {
    console.error('Canvas element #game not found!');
} else {
    resizeCanvas();
}

export function resizeCanvas() {
    if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        logicalWidth = window.innerWidth;
        logicalHeight = window.innerHeight;

        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        canvas.style.width = `${logicalWidth}px`;
        canvas.style.height = `${logicalHeight}px`;

        if (ctx) {
            ctx.scale(dpr, dpr);
        }
    }
}

export function setLevel(level) {
    gameState.level = level;
}

export function resetGameState() {
    gameState.score = 0;
    gameState.lives = 3;
    gameState.gameOver = false;
    gameState.level = 1;
}
