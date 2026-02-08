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
        if (isGameOver || !this.visible) return;

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

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, this.radius);
        ctx.lineTo(-this.radius / 2, 0);
        ctx.lineTo(-this.radius, -this.radius);
        ctx.closePath();
        ctx.stroke();

        if (this.thrusting) {
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.moveTo(-this.radius / 2, 0);
            ctx.lineTo(-this.radius - 10, 5);
            ctx.lineTo(-this.radius - 15, 0);
            ctx.lineTo(-this.radius - 10, -5);
            ctx.closePath();
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
