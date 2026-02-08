import { createBullet, WEAPON_TYPES } from './Bullet.js';

export class Ship {
    constructor(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.radius = 15;
        this.angle = -Math.PI / 2;
        this.rotation = 0;
        this.velocity = { x: 0, y: 0 };
        this.thrusting = false;
        this.braking = false;
        this.visible = true;
        this.blinkTime = 0;
        this.hp = 100;
        this.maxHp = 100;
        this.currentWeapon = 0;
        this.shootTimer = 0;
    }

    update(keys, canvasWidth, canvasHeight, isGameOver) {
        // Update blink timer even if game is over or ship is temporarily "invisible"
        if (this.blinkTime > 0) {
            this.blinkTime--;
            this.visible = Math.floor(this.blinkTime / 10) % 2 === 0;
        } else {
            this.visible = true;
        }

        if (isGameOver) return;

        if (keys['ArrowLeft']) this.angle -= 0.1;
        if (keys['ArrowRight']) this.angle += 0.1;

        this.thrusting = keys['ArrowUp'];
        if (this.thrusting) {
            const accel = 0.1;
            this.velocity.x += Math.cos(this.angle) * accel;
            this.velocity.y += Math.sin(this.angle) * accel;
        }

        this.braking = keys['ArrowDown'];
        if (this.braking) {
            this.velocity.x *= 0.95;
            this.velocity.y *= 0.95;
        }

        const friction = 0.99;
        this.velocity.x *= friction;
        this.velocity.y *= friction;

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        if (this.x < -this.radius) this.x = canvasWidth + this.radius;
        if (this.x > canvasWidth + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvasHeight + this.radius;
        if (this.y > canvasHeight + this.radius) this.y = -this.radius;

        if (this.blinkTime > 0) {
            this.blinkTime--;
            this.visible = Math.floor(this.blinkTime / 10) % 2 === 0;
        } else {
            this.visible = true;
        }
    }

    shoot() {
        const weapon = WEAPON_TYPES[this.currentWeapon];
        const startX = this.x + Math.cos(this.angle) * this.radius;
        const startY = this.y + Math.sin(this.angle) * this.radius;

        for (let i = 0; i < weapon.count; i++) {
            const angleOffset = weapon.count > 1
                ? weapon.spread * (i - (weapon.count - 1) / 2)
                : 0;
            const bulletAngle = this.angle + angleOffset;

            createBullet(
                startX,
                startY,
                Math.cos(bulletAngle) * weapon.speed + this.velocity.x * 0.3,
                Math.sin(bulletAngle) * weapon.speed + this.velocity.y * 0.3,
                weapon.life,
                weapon.size,
                this.currentWeapon,
                weapon.color,
                weapon.glowColor,
                weapon.damage,
                bulletAngle
            );
        }
    }

    draw(ctx) {
        if (!this.visible) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Modern ship body - sleek metallic gradient
        const bodyGradient = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
        bodyGradient.addColorStop(0, 'rgba(40, 50, 70, 0.9)');
        bodyGradient.addColorStop(0.3, 'rgba(80, 100, 130, 0.9)');
        bodyGradient.addColorStop(0.7, 'rgba(60, 80, 110, 0.9)');
        bodyGradient.addColorStop(1, 'rgba(30, 40, 60, 0.9)');

        // Main triangular body
        ctx.beginPath();
        ctx.moveTo(this.radius * 1.2, 0); // Nose
        const backLeftX = Math.cos((Math.PI * 3) / 4) * this.radius;
        const backLeftY = Math.sin((Math.PI * 3) / 4) * this.radius;
        const backRightX = Math.cos(-(Math.PI * 3) / 4) * this.radius;
        const backRightY = Math.sin(-(Math.PI * 3) / 4) * this.radius;
        ctx.lineTo(backLeftX, backLeftY);
        ctx.lineTo(-this.radius * 0.3, 0); // Indent at back
        ctx.lineTo(backRightX, backRightY);
        ctx.closePath();
        ctx.fillStyle = bodyGradient;
        ctx.fill();

        // Neon edge glow
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cockpit window
        ctx.beginPath();
        ctx.ellipse(this.radius * 0.35, 0, this.radius * 0.3, this.radius * 0.18, 0, 0, Math.PI * 2);
        const cockpitGradient = ctx.createRadialGradient(
            this.radius * 0.3, -this.radius * 0.05, 0,
            this.radius * 0.35, 0, this.radius * 0.3
        );
        cockpitGradient.addColorStop(0, 'rgba(150, 230, 255, 0.95)');
        cockpitGradient.addColorStop(0.5, 'rgba(80, 180, 255, 0.8)');
        cockpitGradient.addColorStop(1, 'rgba(40, 120, 200, 0.7)');
        ctx.fillStyle = cockpitGradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 240, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Side accent lines (neon)
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.radius * 0.8, 0);
        ctx.lineTo(backLeftX * 0.5, backLeftY * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.radius * 0.8, 0);
        ctx.lineTo(backRightX * 0.5, backRightY * 0.5);
        ctx.stroke();

        // Engine nozzles
        ctx.fillStyle = 'rgba(20, 30, 50, 0.9)';
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(backLeftX * 0.65, backLeftY * 0.65, this.radius * 0.12, this.radius * 0.07, (Math.PI * 3) / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(backRightX * 0.65, backRightY * 0.65, this.radius * 0.12, this.radius * 0.07, -(Math.PI * 3) / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw thrust flames
        if (this.thrusting) {
            const flameLength = this.radius * (2.0 + Math.random() * 1.0);
            ctx.beginPath();
            ctx.moveTo(backLeftX * 0.6, backLeftY * 0.6);
            ctx.quadraticCurveTo(-this.radius * 1.2, (Math.random() - 0.5) * this.radius * 0.3, -flameLength, 0);
            ctx.quadraticCurveTo(-this.radius * 1.2, (Math.random() - 0.5) * this.radius * 0.3, backRightX * 0.6, backRightY * 0.6);
            const flameGradient = ctx.createLinearGradient(0, 0, -flameLength, 0);
            flameGradient.addColorStop(0, 'rgba(255, 220, 100, 1)');
            flameGradient.addColorStop(0.3, 'rgba(255, 150, 50, 0.9)');
            flameGradient.addColorStop(0.6, 'rgba(255, 80, 20, 0.7)');
            flameGradient.addColorStop(1, 'rgba(200, 30, 0, 0)');
            ctx.fillStyle = flameGradient;
            ctx.fill();

            ctx.beginPath();
            const coreLength = flameLength * 0.65;
            ctx.moveTo(backLeftX * 0.4, backLeftY * 0.4);
            ctx.quadraticCurveTo(-this.radius * 0.8, 0, -coreLength, 0);
            ctx.quadraticCurveTo(-this.radius * 0.8, 0, backRightX * 0.4, backRightY * 0.4);
            const coreGradient = ctx.createLinearGradient(0, 0, -coreLength, 0);
            coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            coreGradient.addColorStop(0.4, 'rgba(150, 220, 255, 0.8)');
            coreGradient.addColorStop(1, 'rgba(50, 150, 255, 0)');
            ctx.fillStyle = coreGradient;
            ctx.fill();
        }

        // Braking effect
        if (this.braking) {
            const brakeLength = this.radius * (0.5 + Math.random() * 0.3);
            ctx.fillStyle = 'rgba(255, 100, 50, 0.7)';
            ctx.beginPath();
            ctx.moveTo(this.radius * 0.9, -this.radius * 0.15);
            ctx.lineTo(this.radius * 0.9 + brakeLength * 0.5, -this.radius * 0.3);
            ctx.lineTo(this.radius * 0.9, -this.radius * 0.05);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.radius * 0.9, this.radius * 0.15);
            ctx.lineTo(this.radius * 0.9 + brakeLength * 0.5, this.radius * 0.3);
            ctx.lineTo(this.radius * 0.9, this.radius * 0.05);
            ctx.fill();
        }

        ctx.restore();
    }

    reset(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.velocity = { x: 0, y: 0 };
        this.angle = -Math.PI / 2;
        this.hp = this.maxHp;
        this.blinkTime = 120;
        this.visible = true;
        this.shootTimer = 0;
    }
}
