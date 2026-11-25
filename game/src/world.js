// World Kitchen Rush's kitchen rules, with no drawing and no browser in it:
// customer orders with patience timers, the wok (pick a dish, add its
// ingredients in order, let it sizzle, plate it), scoring, combos and the
// shift clock. step() advances one fixed step; the action methods return
// event flags so the caller can play sounds and announcements.

import { COOK_SECONDS, DEFAULT_RESTAURANT_NAME, MAX_ORDERS, SHIFT_SECONDS } from './config.js';
import { CUSTOMER_FACES, CUSTOMER_NAMES, RECIPES } from './recipes.js';

export const EVENT_ADDED = 1;
export const EVENT_WRONG = 2;
export const EVENT_COOKED = 4;
export const EVENT_SERVED = 8;
export const EVENT_EXPIRED = 16;
export const EVENT_OVER = 32;

let nextOrderId = 1;

export function createWorld(random) {
  const state = {
    orders: [],
    wok: { recipe: null, added: [], phase: 'idle', cookT: 0, stir: 0 },
    shiftT: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    mistakes: 0,
    message: 'Pick an order to start cooking!',
    messageT: 0,
    over: false,
    restaurantName: DEFAULT_RESTAURANT_NAME,
    restaurantEditing: false,
  };

  /** The player names their own restaurant; the sign hangs over the kitchen. */
  function setRestaurantName(name) {
    const clean = String(name).replace(/\s+/g, ' ').trim().slice(0, 24);
    state.restaurantName = clean || DEFAULT_RESTAURANT_NAME;
  }

  function spawnOrder() {
    const recipe = RECIPES[Math.floor(random() * RECIPES.length)];
    const who = Math.floor(random() * CUSTOMER_NAMES.length);
    state.orders.push({
      id: nextOrderId,
      recipe,
      customer: CUSTOMER_NAMES[who],
      face: CUSTOMER_FACES[who],
      patience: 52 + random() * 14,
      patienceMax: 60,
    });
    nextOrderId += 1;
    state.orders[state.orders.length - 1].patienceMax = state.orders[state.orders.length - 1].patience;
  }

  function reset() {
    nextOrderId = 1;
    state.orders = [];
    state.wok = { recipe: null, added: [], phase: 'idle', cookT: 0, stir: 0 };
    state.shiftT = SHIFT_SECONDS;
    state.elapsed = 0;
    state.score = 0;
    state.coins = 0;
    state.served = 0;
    state.missed = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.mistakes = 0;
    state.message = 'Pick an order to start cooking!';
    state.messageT = 0;
    state.over = false;
    spawnOrder();
    spawnOrder();
    spawnOrder();
  }

  /** Start (or switch) the wok to an order's dish. Switching empties the wok. */
  function selectOrder(orderId) {
    const order = state.orders.find((entry) => entry.id === orderId);
    if (!order || state.over) return false;
    if (state.wok.phase === 'ready') return false;
    state.wok = { recipe: order.recipe, added: [], phase: 'assembling', cookT: 0, stir: 0 };
    state.message = `Cooking ${order.recipe.name} for ${order.customer} — add ingredients in order!`;
    return true;
  }

  /** Add an ingredient to the wok. Only the next step of the recipe counts. */
  function addIngredient(ingredientId) {
    const wok = state.wok;
    if (wok.phase !== 'assembling' || !wok.recipe) {
      state.message = wok.phase === 'idle' ? 'Pick an order first, then add ingredients!' : state.message;
      return 0;
    }
    const expected = wok.recipe.steps[wok.added.length];
    if (ingredientId !== expected) {
      state.mistakes += 1;
      state.combo = 0;
      state.message = `Not yet! The recipe wants ${expected} next. Combo lost.`;
      return EVENT_WRONG;
    }
    wok.added.push(ingredientId);
    if (wok.added.length === wok.recipe.steps.length) {
      wok.phase = 'cooking';
      wok.cookT = COOK_SECONDS;
      state.message = 'All in! Let it sizzle — click the wok to stir!';
    } else {
      state.message = `${wok.added.length} of ${wok.recipe.steps.length} ingredients in the wok.`;
    }
    return EVENT_ADDED;
  }

  /** Clicking the wok while it cooks: a good stir keeps the dish perfect. */
  function stirWok() {
    if (state.wok.phase !== 'cooking') return;
    state.wok.stir = Math.min(5, state.wok.stir + 1);
    state.wok.cookT = Math.max(0.15, state.wok.cookT - 0.35);
  }

  function trashWok() {
    if (state.wok.phase === 'idle' || state.wok.phase === 'ready') return;
    state.wok = { recipe: null, added: [], phase: 'idle', cookT: 0, stir: 0 };
    state.combo = 0;
    state.message = 'Wok emptied. Pick an order to start again.';
  }

  /** Serve the plated dish to the matching order; returns coins earned or 0. */
  function servePlated() {
    const wok = state.wok;
    if (wok.phase !== 'ready' || !wok.recipe) return 0;
    const index = state.orders.findIndex((entry) => entry.recipe.id === wok.recipe.id);
    if (index === -1) {
      state.message = 'That customer already left! Trash the plate and cook fresh.';
      return 0;
    }
    const order = state.orders[index];
    const patienceBonus = Math.round(10 * (order.patience / order.patienceMax));
    const stirBonus = wok.stir >= 3 ? 5 : 0;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const comboBonus = Math.min(10, state.combo * 2);
    const earned = order.recipe.price + patienceBonus + stirBonus + comboBonus;
    state.coins += earned;
    state.score += earned * 10;
    state.served += 1;
    state.message = `${order.customer} loved the ${order.recipe.name}! +${earned} coins, combo x${state.combo}!`;
    state.orders.splice(index, 1);
    if (state.orders.length < MAX_ORDERS) spawnOrder();
    state.wok = { recipe: null, added: [], phase: 'idle', cookT: 0, stir: 0 };
    return EVENT_SERVED;
  }

  function step(dt) {
    if (state.over) return 0;
    let events = 0;
    state.elapsed += dt;
    state.shiftT = Math.max(0, SHIFT_SECONDS - state.elapsed);
    state.messageT += dt;

    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(index, 1);
        state.missed += 1;
        state.combo = 0;
        state.message = `${order.customer} walked away hungry…`;
        events |= EVENT_EXPIRED;
        if (state.orders.length < MAX_ORDERS) spawnOrder();
      }
    }

    if (state.wok.phase === 'cooking') {
      state.wok.cookT -= dt;
      if (state.wok.cookT <= 0) {
        state.wok.phase = 'ready';
        state.wok.cookT = 0;
        state.message = `${state.wok.recipe.name} is plated and ready — hit SERVE!`;
        events |= EVENT_COOKED;
      }
    }

    if (state.shiftT <= 0) {
      state.over = true;
      events |= EVENT_OVER;
    }
    return events;
  }

  reset();
  return { state, reset, selectOrder, addIngredient, stirWok, trashWok, servePlated, step, setRestaurantName };
}
