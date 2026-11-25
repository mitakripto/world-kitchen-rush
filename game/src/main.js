// Boot and the one loop for World Kitchen Rush: input is read every frame,
// the kitchen advances in fixed 1/60 s steps, and the renderer paints the
// room. Clicks land on order tickets, ingredient bins, the wok, and the
// SERVE / TRASH buttons; the counter keys pick ingredients, Space serves,
// T trashes, P pauses. On the title screen the player can also click the
// restaurant name box and type a name of their own for the kitchen's sign.
//
// ?seed=N fixes the customer rush. ?shot=start|play|serve|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, DEFAULT_RESTAURANT_NAME, LAYOUT, NAME_KEY, STEP, ingredientRect, pointInRect } from './config.js';
import { createRandom } from './random.js';
import { INGREDIENTS } from './recipes.js';
import {
  createWorld, EVENT_COOKED, EVENT_EXPIRED, EVENT_OVER, EVENT_SERVED, EVENT_WRONG,
} from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_SERVE, ACTION_TRASH, createInput } from './input.js';
import { createRenderer, nameBoxRect, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { soundAdded, soundCooked, soundExpired, soundServed, soundWrong, unlockAudio } from './audio.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score lasts this visit only.
  }
}

function runShot(name) {
  world.setRestaurantName(params.get('name') ?? DEFAULT_RESTAURANT_NAME);
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, 1.2);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, INGREDIENTS);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // The restaurant name: remembered between visits, typed on the title
  // screen. While editing, the draft is kept raw (a trailing space while
  // typing a two-word name must survive); it is cleaned when editing ends.
  let nameDraft = DEFAULT_RESTAURANT_NAME;
  try {
    nameDraft = window.localStorage.getItem(NAME_KEY) || DEFAULT_RESTAURANT_NAME;
  } catch {
    // Storage can be off: the default name then lasts this visit only.
  }
  world.setRestaurantName(nameDraft);
  nameDraft = world.state.restaurantName;
  let nameEditing = false;

  function setEditing(editing) {
    nameEditing = editing;
    world.state.restaurantEditing = editing;
    if (!editing) {
      world.setRestaurantName(nameDraft);
      nameDraft = world.state.restaurantName;
      try {
        window.localStorage.setItem(NAME_KEY, nameDraft);
      } catch {
        // As above: a name that cannot be stored still names this visit.
      }
    }
  }

  window.addEventListener('keydown', (event) => {
    if (!nameEditing || screen !== SCREEN_TITLE) return;
    if (event.key === 'Backspace') nameDraft = nameDraft.slice(0, -1);
    else if (event.key === 'Enter') { setEditing(false); return; }
    else if (event.key.length === 1 && nameDraft.length < 24) nameDraft += event.key;
    else return;
    world.state.restaurantName = nameDraft;
    event.preventDefault();
  });

  function announce(message) {
    status.textContent = message;
  }

  function startShift() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Your restaurant is open. Pick an order to start cooking.');
  }

  function endShift() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Shift over. Score ${world.state.score}.`);
  }

  function react(events) {
    if (events & EVENT_WRONG) soundWrong();
    if (events & EVENT_COOKED) { soundCooked(); announce(world.state.message); }
    if (events & EVENT_EXPIRED) soundExpired();
    if (events & EVENT_OVER) endShift();
  }

  function handleClick(point) {
    unlockAudio();
    if (screen === SCREEN_TITLE) {
      if (pointInRect(point.x, point.y, nameBoxRect())) {
        nameDraft = world.state.restaurantName;
        setEditing(true);
        announce('Type your restaurant name, then click anywhere to start.');
        return;
      }
      if (nameEditing) { setEditing(false); return; }
      startShift();
      return;
    }
    if (screen === SCREEN_OVER) {
      startShift();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const state = world.state;
    for (let index = 0; index < state.orders.length; index += 1) {
      if (pointInRect(point.x, point.y, LAYOUT.orderCards[index])) {
        world.selectOrder(state.orders[index].id);
        announce(state.message);
        return;
      }
    }
    for (let index = 0; index < INGREDIENTS.length; index += 1) {
      if (pointInRect(point.x, point.y, ingredientRect(index))) {
        const events = world.addIngredient(INGREDIENTS[index].id);
        if (events) soundAdded();
        react(events);
        announce(state.message);
        return;
      }
    }
    if (pointInRect(point.x, point.y, LAYOUT.wok)) {
      world.stirWok();
      return;
    }
    if (pointInRect(point.x, point.y, LAYOUT.serveButton)) {
      if (world.servePlated() & EVENT_SERVED) soundServed();
      announce(state.message);
      return;
    }
    if (pointInRect(point.x, point.y, LAYOUT.trashButton)) world.trashWok();
  }

  function handleActions() {
    const actions = input.takeActions();
    if (nameEditing) {
      // While the name is being typed, keys are letters, not orders: drain
      // the queued picks and let only clicks through (they end the edit).
      input.takeIngredientPick();
      for (const point of input.takeClicks()) handleClick(point);
      return;
    }
    // Clicks first: a pointer press also queues ACTION_CONFIRM, and the
    // click's own hit-test (the name box above all) must win over it — so
    // the confirm-start below only counts when no click arrived this frame
    // (a real keyboard Space or Enter, not the echo of a mouse press).
    const clicks = input.takeClicks();
    for (const point of clicks) handleClick(point);
    if (clicks.length === 0 && (actions & ACTION_CONFIRM) && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startShift();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Cooking again.');
    } else if (actions & ACTION_SERVE && screen === SCREEN_PLAY) {
      if (world.state.wok.phase === 'cooking') world.stirWok();
      else if (world.servePlated() & EVENT_SERVED) soundServed();
    }
    if (actions & ACTION_TRASH && screen === SCREEN_PLAY) world.trashWok();
    const pick = input.takeIngredientPick();
    if (pick && screen === SCREEN_PLAY) {
      const events = world.addIngredient(pick);
      if (events) soundAdded();
      react(events);
    }
    if (actions & ACTION_CONFIRM && screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        react(world.step(STEP));
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, now / 1000);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('World Kitchen Rush. Click or press Space to open your restaurant, or click the name box to name it.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
