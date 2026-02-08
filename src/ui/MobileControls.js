import { setKeyState } from '../core/Input.js';

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
            fire: { x: 0, y: 0, radius: 45, pressed: false, label: 'FIRE' },
            switch: { x: 0, y: 0, radius: 35, pressed: false, label: 'WPN' }
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
        const halfWidth = this.canvas.width / (window.devicePixelRatio || 1) / 2;

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

                // Map to keys
                const angle = Math.atan2(this.joystick.knobY - this.joystick.baseY, this.joystick.knobX - this.joystick.baseX);
                const distPercent = Math.min(dist / maxDist, 1);

                // Reset keys first
                setKeyState('ArrowUp', distPercent > 0.3);
                setKeyState('ArrowLeft', false);
                setKeyState('ArrowRight', false);

                if (distPercent > 0.3) {
                    const deg = (angle * 180) / Math.PI;
                    // Rotation mapping (very simplified)
                    if (deg < -45 && deg > -135) { /* Forward only */ }
                    else if (deg >= -45 && deg <= 45) setKeyState('ArrowRight', true);
                    else if (deg > 45 && deg < 135) { /* Backwards? maybe not needed */ }
                    else setKeyState('ArrowLeft', true);
                }
            }
        } else {
            // RIGHT SIDE: Buttons
            this.updateButtons(x, y, type, id);
        }
    }

    updateButtons(x, y, type, id) {
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);

        this.buttons.fire.x = w - 80;
        this.buttons.fire.y = h - 80;
        this.buttons.switch.x = w - 180;
        this.buttons.switch.y = h - 60;

        for (const key in this.buttons) {
            const btn = this.buttons[key];
            const dist = Math.hypot(x - btn.x, y - btn.y);

            if (dist < btn.radius) {
                if (type === 'touchstart') {
                    btn.pressed = true;
                    btn.touchId = id;
                    if (key === 'fire') setKeyState('Space', true);
                    if (key === 'switch') this.triggerWeaponSwitch();
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
            setKeyState('ArrowUp', false);
            setKeyState('ArrowLeft', false);
            setKeyState('ArrowRight', false);
        }
        for (const key in this.buttons) {
            const btn = this.buttons[key];
            if (btn.touchId === id) {
                btn.pressed = false;
                btn.touchId = null;
                if (key === 'fire') setKeyState('Space', false);
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
            ctx.fillStyle = 'white';
            ctx.fill();
        }

        // Draw Buttons
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);
        this.buttons.fire.x = w - 80;
        this.buttons.fire.y = h - 80;
        this.buttons.switch.x = w - 180;
        this.buttons.switch.y = h - 60;

        for (const key in this.buttons) {
            const btn = this.buttons[key];
            ctx.beginPath();
            ctx.arc(btn.x, btn.y, btn.radius, 0, Math.PI * 2);
            ctx.fillStyle = btn.pressed ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.label, btn.x, btn.y);
        }

        ctx.restore();
    }
}
