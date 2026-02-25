// Gamepad button indices (Standard Gamepad mapping, W3C spec)
// Retroid Pocket 5 reports: A=0, B=1, X=2, Y=3
export const GP = {
  A: 1,  // right face button  → Select / Confirm
  B: 0,  // bottom face button → Back / Cancel
  X: 2,  // left face button   → PASS
  Y: 3,  // top face button    → NO
  // D-pad buttons (standard mapping)
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
} as const;

export function isGamepadButtonPressed(index: number): boolean {
  const gamepads = navigator.getGamepads?.();
  if (!gamepads) return false;
  for (const gp of gamepads) {
    if (gp?.buttons[index]?.pressed) return true;
  }
  return false;
}

/** Read D-pad direction from gamepad (buttons 12-15 OR axes 0/1). */
export function getDpadDirection(): { up: boolean; down: boolean; left: boolean; right: boolean } {
  const result = { up: false, down: false, left: false, right: false };
  const gamepads = navigator.getGamepads?.();
  if (!gamepads) return result;
  for (const gp of gamepads) {
    if (!gp) continue;
    // D-pad buttons (standard mapping)
    if (gp.buttons[12]?.pressed) result.up = true;
    if (gp.buttons[13]?.pressed) result.down = true;
    if (gp.buttons[14]?.pressed) result.left = true;
    if (gp.buttons[15]?.pressed) result.right = true;
    // Also check axes (some devices report D-pad as axes)
    if (gp.axes[1] < -0.5) result.up = true;
    if (gp.axes[1] > 0.5) result.down = true;
    if (gp.axes[0] < -0.5) result.left = true;
    if (gp.axes[0] > 0.5) result.right = true;
  }
  return result;
}
