export const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

export function isKeyDown(code) {
    return !!keys[code];
}

export function setKeyState(code, isPressed) {
    keys[code] = isPressed;
}
