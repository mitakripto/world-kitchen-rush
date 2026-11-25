// Boot and the one loop for Warung Sizzle: input is read every frame, the
// kitchen advances in fixed 1/60 s steps, and the renderer paints the room.
// Clicks land on order tickets, ingredient bins, the wok, and the SERVE /
// TRASH buttons; keys 1-9 pick ingredients, Space serves, T trashes, P pauses.
//
// ?seed=N fixes the customer rush. ?shot=start|play|serve|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, LAYOUT, STEP, ingredientRect, pointInRect } from './config.js';
import { createRandom } from './random.js';
import { INGREDIENTS } from './recipes.js';
import {
  createWorld, EVENT_COOKED, EVENT_EXPIRED, EVENT_OVER, EVENT_SERVED, EVENT_WRONG,
} from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_SERVE, ACTION_TRASH, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
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

  function announce(message) {
    status.textContent = message;
  }

  function startShift() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('The warung is open. Pick an order to start cooking.');
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
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
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
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
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
    for (const point of input.takeClicks()) handleClick(point);
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

  announce('Warung Sizzle. Click or press Space to open the warung.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
