export const gameState = {
    score: 0,
    lives: 3,
    gameOver: false,
    level: 1
};

export const canvas = document.querySelector('#game');
export const ctx = canvas ? canvas.getContext('2d') : null;

if (!canvas) {
    console.error('Canvas element #game not found!');
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
