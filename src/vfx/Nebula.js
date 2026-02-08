import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();
const nebulaNoiseTime = { value: 0 };

export function drawNebula(ctx, canvasWidth, canvasHeight) {
    nebulaNoiseTime.value += 0.003;

    const resolution = 40;
    const cellWidth = canvasWidth / resolution;
    const cellHeight = canvasHeight / resolution;

    const colorTime = nebulaNoiseTime.value * 0.3;
    const hueShift = Math.sin(colorTime) * 0.5 + 0.5;

    for (let x = 0; x < resolution; x++) {
        for (let y = 0; y < resolution; y++) {
            const nx = x * 0.08;
            const ny = y * 0.08;
            const t = nebulaNoiseTime.value;

            const noise1 = noise2D(nx + t * 0.5, ny) * 0.5 + 0.5;
            const noise2 = noise2D(nx * 2, ny * 2 + t * 0.3) * 0.3 + 0.3;
            const combined = (noise1 + noise2) / 1.5;

            if (combined > 0.3) {
                const alpha = (combined - 0.3) * 0.4;
                const localHue = (hueShift + noise1 * 0.3) % 1;

                let r, g, b;
                if (localHue < 0.25) {
                    const t = localHue / 0.25;
                    r = Math.floor(150 - t * 100 + combined * 50);
                    g = Math.floor(30 + t * 50 + combined * 40);
                    b = Math.floor(200 + combined * 55);
                } else if (localHue < 0.5) {
                    const t = (localHue - 0.25) / 0.25;
                    r = Math.floor(50 + combined * 30);
                    g = Math.floor(80 + t * 120 + combined * 60);
                    b = Math.floor(200 + combined * 55);
                } else if (localHue < 0.75) {
                    const t = (localHue - 0.5) / 0.25;
                    r = Math.floor(50 + t * 150 + combined * 50);
                    g = Math.floor(200 - t * 100 + combined * 30);
                    b = Math.floor(200 + combined * 55);
                } else {
                    const t = (localHue - 0.75) / 0.25;
                    r = Math.floor(200 - t * 50 + combined * 50);
                    g = Math.floor(100 - t * 70 + combined * 30);
                    b = Math.floor(200 + combined * 55);
                }

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth + 1, cellHeight + 1);
            }
        }
    }
}
