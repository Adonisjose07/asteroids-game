export function drawHUD(ctx, gameState, ship, currentWeapon, weaponTypes, unlockedWeapons, canvasWidth, canvasHeight) {
    ctx.fillStyle = 'white';
    ctx.font = '20px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${gameState.score}`, 20, 30);
    ctx.fillText(`LIVES: ${gameState.lives}`, 20, 55);
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`LEVEL: ${gameState.level}`, 20, 80);

    // Ship HP Bar
    const hpWidth = 100;
    const hpHeight = 10, hpX = 20, hpY = 95;
    const hpPercent = ship.hp / ship.maxHp;
    ctx.fillStyle = 'rgba(100, 0, 0, 0.5)';
    ctx.fillRect(hpX, hpY, hpWidth, hpHeight);
    const r = hpPercent < 0.5 ? 255 : Math.floor(255 - (hpPercent - 0.5) * 2 * 255);
    const g = hpPercent > 0.5 ? 255 : Math.floor(hpPercent * 2 * 255);
    ctx.fillStyle = `rgb(${r}, ${g}, 0)`;
    ctx.fillRect(hpX, hpY, hpWidth * hpPercent, hpHeight);

    // Weapon Indicator
    const weapon = weaponTypes[currentWeapon];
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = weapon.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(15, 115, 140, 50, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = weapon.color;
    ctx.font = 'bold 14px "Courier New"';
    ctx.fillText(weapon.name, 50, 132);

    // Unlock hints
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px "Courier New"';
    ctx.fillText(`[Q] ${unlockedWeapons.length}/${weaponTypes.length}`, 70, 158);

    if (gameState.gameOver) {
        ctx.textAlign = 'center';
        ctx.font = '60px "Courier New"';
        ctx.fillStyle = 'white';
        ctx.fillText('GAME OVER', canvasWidth / 2, canvasHeight / 2);
        ctx.font = '20px "Courier New"';
        ctx.fillText('PRESS "R" TO RESTART', canvasWidth / 2, canvasHeight / 2 + 50);
    }
}
