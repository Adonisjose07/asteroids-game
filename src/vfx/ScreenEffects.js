export const screenShake = {
    offsetX: 0,
    offsetY: 0,
    duration: 0,
    intensity: 0
};

export function triggerShake(duration, intensity) {
    screenShake.duration = duration;
    screenShake.intensity = intensity;
}

export function updateShake() {
    if (screenShake.duration > 0) {
        screenShake.offsetX = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.offsetY = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.duration--;
    } else {
        screenShake.offsetX = 0;
        screenShake.offsetY = 0;
    }
}

let flashAlpha = 0;
let flashColor = 'white';

export function triggerFlash(color = 'white') {
    flashAlpha = 0.5;
    flashColor = color;
}

export function updateFlash() {
    if (flashAlpha > 0) flashAlpha -= 0.02;
}

export function drawFlash(ctx, canvasWidth, canvasHeight) {
    if (flashAlpha > 0) {
        ctx.fillStyle = flashColor === 'red' ? `rgba(255, 0, 0, ${flashAlpha})` : `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
}
