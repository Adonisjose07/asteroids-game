import { setKeyState } from '../core/Input.js';
import { logicalWidth, logicalHeight } from '../core/GameState.js';

export class MobileControls {
    constructor(canvas, ship, weaponTypes, getUnlockedWeapons, resetGame, gameState) {
        this.canvas = canvas;
        this.ship = ship;
        this.weaponTypes = weaponTypes;
        this.getUnlockedWeapons = getUnlockedWeapons;
        this.resetGame = resetGame;
        this.gameState = gameState;
        this.enabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.touches = {};

        // Joystick state
        this.joystick = {
            active: false,
            baseX: 0,
            baseY: 0,
            knobX: 0,
            knobY: 0,
            radius: 60,
            touchId: null
        };

        // Action Buttons
        this.buttons = {
            fire: { x: 0, y: 0, radius: 45, pressed: false, label: 'FIRE', key: 'Space' },
            thrust: { x: 0, y: 0, radius: 40, pressed: false, label: 'THRUST', key: 'ArrowUp' },
            brake: { x: 0, y: 0, radius: 32, pressed: false, label: 'BRAKE', key: 'ArrowDown' },
            switch: { x: 0, y: 0, radius: 32, pressed: false, label: 'WPN' }
        };

        if (this.enabled) {
            this.bindEvents();
        }
    }

    bindEvents() {
        window.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.handleTouch(e), { passive: false });
        window.addEventListener('touchend', (e) => this.handleTouch(e), { passive: false });
        window.addEventListener('touchcancel', (e) => this.handleTouch(e), { passive: false });
    }

    handleTouch(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();

        if (this.gameState.gameOver && e.type === 'touchstart') {
            this.resetGame();
            return;
        }

        // Current active touch IDs
        const activeIds = new Set();
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.processTouch(touch.identifier, x, y, e.type);
            activeIds.add(touch.identifier);
        }

        if (e.type === 'touchend' || e.type === 'touchcancel') {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                this.releaseTouch(touch.identifier);
            }
        }
    }

    processTouch(id, x, y, type) {
        const halfWidth = logicalWidth / 2;

        if (x < halfWidth) {
            // LEFT SIDE: Joystick
            if (type === 'touchstart' && !this.joystick.active) {
                this.joystick.active = true;
                this.joystick.touchId = id;
                this.joystick.baseX = x;
                this.joystick.baseY = y;
                this.joystick.knobX = x;
                this.joystick.knobY = y;
            } else if (this.joystick.touchId === id) {
                const dx = x - this.joystick.baseX;
                const dy = y - this.joystick.baseY;
                const dist = Math.hypot(dx, dy);
                const maxDist = this.joystick.radius;

                if (dist > maxDist) {
                    const angle = Math.atan2(dy, dx);
                    this.joystick.knobX = this.joystick.baseX + Math.cos(angle) * maxDist;
                    this.joystick.knobY = this.joystick.baseY + Math.sin(angle) * maxDist;
                } else {
                    this.joystick.knobX = x;
                    this.joystick.knobY = y;
                }

                // Map to Absolute Direction
                const angle = Math.atan2(this.joystick.knobY - this.joystick.baseY, this.joystick.knobX - this.joystick.baseX);
                const distPercent = Math.min(dist / maxDist, 1);

                if (distPercent > 0.15) {
                    this.ship.angle = angle;
                }
            }
        } else {
            // RIGHT SIDE: Buttons
            this.updateButtons(x, y, type, id);
        }
    }

    updateButtons(x, y, type, id) {
        // Positions are handled in draw() for consistency, but we need them here for hit detection
        const w = logicalWidth;
        const h = logicalHeight;

        this.buttons.fire.x = w - 70;
        this.buttons.fire.y = h - 70;
        this.buttons.thrust.x = w - 160;
        this.buttons.thrust.y = h - 100;
        this.buttons.brake.x = w - 230;
        this.buttons.brake.y = h - 60;
        this.buttons.switch.x = w - 60;
        this.buttons.switch.y = h - 160;

        for (const key in this.buttons) {
            const btn = this.buttons[key];
            const dist = Math.hypot(x - btn.x, y - btn.y);

            if (dist < btn.radius) {
                if (type === 'touchstart' || type === 'touchmove') {
                    if (!btn.pressed) {
                        btn.pressed = true;
                        btn.touchId = id;
                        if (btn.key) setKeyState(btn.key, true);
                        if (key === 'switch') this.triggerWeaponSwitch();
                    }
                }
            }
        }
    }

    triggerWeaponSwitch() {
        const unlocked = this.getUnlockedWeapons();
        const currentW = this.weaponTypes[this.ship.currentWeapon];
        const currentIndexInUnlocked = unlocked.findIndex(w => w.name === currentW.name);
        const nextIndexInUnlocked = (currentIndexInUnlocked + 1) % unlocked.length;
        const nextWeapon = unlocked[nextIndexInUnlocked];
        this.ship.currentWeapon = this.weaponTypes.findIndex(w => w.name === nextWeapon.name);
    }

    releaseTouch(id) {
        if (this.joystick.touchId === id) {
            this.joystick.active = false;
            this.joystick.touchId = null;
            setKeyState('ArrowLeft', false);
            setKeyState('ArrowRight', false);
        }
        for (const key in this.buttons) {
            const btn = this.buttons[key];
            if (btn.touchId === id) {
                btn.pressed = false;
                btn.touchId = null;
                if (btn.key) setKeyState(btn.key, false);
            }
        }
    }

    draw(ctx) {
        if (!this.enabled) return;

        ctx.save();
        ctx.globalAlpha = 0.5;

        // Draw Joystick
        if (this.joystick.active) {
            ctx.beginPath();
            ctx.arc(this.joystick.baseX, this.joystick.baseY, this.joystick.radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(this.joystick.knobX, this.joystick.knobY, 30, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
        }

        // Positions for drawing buttons (must match updateButtons for visual consistency)
        const w = logicalWidth;
        const h = logicalHeight;
        this.buttons.fire.x = w - 70;
        this.buttons.fire.y = h - 70;
        this.buttons.thrust.x = w - 160;
        this.buttons.thrust.y = h - 100;
        this.buttons.brake.x = w - 230;
        this.buttons.brake.y = h - 60;
        this.buttons.switch.x = w - 60;
        this.buttons.switch.y = h - 160;

        for (const key in this.buttons) {
            const btn = this.buttons[key];
            ctx.beginPath();
            ctx.arc(btn.x, btn.y, btn.radius, 0, Math.PI * 2);
            ctx.fillStyle = btn.pressed ? 'rgba(0, 255, 200, 0.6)' : 'rgba(255, 255, 255, 0.2)';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = `bold ${btn.radius * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.label, btn.x, btn.y);
        }

        ctx.restore();
    }
}
