// Keyboard and pointer input. Pointer clicks are converted into the game's
// 1280x720 logical coordinates (the same letterboxed fit the renderer uses)
// and queued as points; keys are queued both as ingredient picks (1-9) and as
// one-shot actions, so a press between frames is never lost or doubled.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SERVE = 4;
export const ACTION_TRASH = 8;

const KEY_ACTIONS = new Map([
  ['Space', ACTION_CONFIRM | ACTION_SERVE],
  ['Enter', ACTION_CONFIRM | ACTION_SERVE],
  ['KeyP', ACTION_PAUSE],
  ['Escape', ACTION_PAUSE],
  ['KeyT', ACTION_TRASH],
]);

export function createInput(canvas, ingredients) {
  const clicks = [];
  let actions = 0;
  let ingredientPick = null;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / 1280, rect.height / 720);
    const x = (event.clientX - rect.left - (rect.width - 1280 * scale) / 2) / scale;
    const y = (event.clientY - rect.top - (rect.height - 720 * scale) / 2) / scale;
    return { x, y };
  }

  canvas.addEventListener('pointerdown', (event) => {
    clicks.push(toLogical(event));
    actions |= ACTION_CONFIRM;
  });

  window.addEventListener('keydown', (event) => {
    // Counter keys in bin order: digits 1-9, then 0, then Q and W for the
    // last two bins — the same labels the counter draws under each bin.
    const keyIndex = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'KeyQ', 'KeyW'].indexOf(event.code);
    if (keyIndex >= 0 && ingredients[keyIndex]) {
      ingredientPick = ingredients[keyIndex].id;
    } else if (KEY_ACTIONS.has(event.code)) {
      if (!event.repeat) actions |= KEY_ACTIONS.get(event.code);
    } else return;
    event.preventDefault();
  });

  return {
    takeClicks() {
      const taken = clicks.slice();
      clicks.length = 0;
      return taken;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeIngredientPick() {
      const taken = ingredientPick;
      ingredientPick = null;
      return taken;
    },
  };
}
