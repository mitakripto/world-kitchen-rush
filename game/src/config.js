// World Kitchen Rush — tuning, palette and the shared kitchen layout.
// The kitchen is a fixed 1280x720 logical room; the renderer scales it to the
// window, and input converts pointer positions back into the same coordinates,
// so the layout constants below are the single source both sides agree on.

export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const SHIFT_SECONDS = 150;
export const COOK_SECONDS = 3.2;
export const MAX_ORDERS = 3;

export const PALETTE = {
  wall: '#2e1f16',
  wallBand: '#453022',
  board: '#1d1712',
  boardEdge: '#8a6b45',
  counter: '#6d4426',
  counterTop: '#96683c',
  steel: '#3c4653',
  wok: '#22262d',
  wokInner: '#31363f',
  flame: '#ff8c3b',
  cream: '#fff3dd',
  paper: '#ffedb8',
  ink: '#2b1c10',
  muted: '#c9a87c',
  good: '#7ed957',
  warn: '#ffc93b',
  bad: '#ff6b57',
  accent: '#ffb03a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'world-kitchen-rush.best';
export const NAME_KEY = 'world-kitchen-rush.name';
export const DEFAULT_RESTAURANT_NAME = 'Blue Fork Bistro';

// Layout: order cards across the top board, wok centre-left, the serving
// plate centre-right, and the ingredient counter along the bottom.
export const LAYOUT = {
  orderCards: [
    { x: 28, y: 74, w: 400, h: 118 },
    { x: 440, y: 74, w: 400, h: 118 },
    { x: 852, y: 74, w: 400, h: 118 },
  ],
  wok: { x: 118, y: 268, w: 430, h: 250 },
  plate: { x: 700, y: 268, w: 430, h: 250 },
  serveButton: { x: 728, y: 462, w: 176, h: 46 },
  trashButton: { x: 926, y: 462, w: 176, h: 46 },
  ingredientY: 560,
  ingredientH: 128,
  ingredientX0: 22,
  ingredientW: 96,
  ingredientGap: 5,
};

export function ingredientRect(index) {
  return {
    x: LAYOUT.ingredientX0 + index * (LAYOUT.ingredientW + LAYOUT.ingredientGap),
    y: LAYOUT.ingredientY,
    w: LAYOUT.ingredientW,
    h: LAYOUT.ingredientH,
  };
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
