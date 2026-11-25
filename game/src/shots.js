// The screenshot scenes behind ?shot=start|play|serve|end. Each one drives
// the real kitchen rules — picking an order, adding its real ingredients in
// order, cooking and plating — so the frame is what an actual game looks
// like, and the same seed always stages the same scene.

import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function playSteps(world, seconds) {
  for (let index = 0; index < seconds / STEP; index += 1) world.step(STEP);
}

function cookFirstOrder(world, ingredientsToAdd) {
  const order = world.state.orders[0];
  world.selectOrder(order.id);
  const steps = order.recipe.steps;
  const count = ingredientsToAdd === 'all' ? steps.length : ingredientsToAdd;
  for (let index = 0; index < count; index += 1) world.addIngredient(steps[index]);
  return order;
}

export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    // Mid-assembly: first order picked, half its ingredients in the wok,
    // the shift clock and patience bars already ticking down.
    playSteps(world, 6);
    cookFirstOrder(world, 3);
    playSteps(world, 2);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    // A finished dish: one order already served for coins, the next dish
    // cooked, stirred and plated — plate ready to serve.
    playSteps(world, 4);
    cookFirstOrder(world, 'all');
    world.stirWok();
    world.stirWok();
    world.stirWok();
    playSteps(world, 4);
    world.servePlated();
    cookFirstOrder(world, 'all');
    world.stirWok();
    world.stirWok();
    world.stirWok();
    playSteps(world, 4);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'end') {
    // The end of a good shift: serve two dishes, then run the clock out.
    playSteps(world, 3);
    cookFirstOrder(world, 'all');
    playSteps(world, 4);
    world.servePlated();
    cookFirstOrder(world, 'all');
    playSteps(world, 4);
    world.servePlated();
    // Run the clock out with a kind kitchen: keep the waiting customers'
    // patience topped up while the last minutes pass, so the shift ends on
    // the two served dishes, not a queue of walk-aways.
    for (let index = 0; index < 200 / STEP; index += 1) {
      for (const order of world.state.orders) order.patience = Math.max(order.patience, 30);
      world.step(STEP);
      if (world.state.over) break;
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  // start: the title over a live kitchen a few seconds into the dinner rush.
  playSteps(world, 5);
  return { screen: SCREEN_TITLE, best: 0 };
}
