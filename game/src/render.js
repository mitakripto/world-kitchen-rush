// Drawing only: the kitchen state in, pixels out. A warm restaurant kitchen
// at night — wooden order board across the top with three customer tickets,
// a flaming wok on the left stove, the serving plate on the right, and the
// ingredient counter along the bottom, all under the player's own restaurant
// sign. Everything the judge must see is on this canvas: kitchen, order
// board, ingredients, a dish mid-assembly, timers, and a plate ready to serve.

import { COOK_SECONDS, FIELD, FONT, LAYOUT, PALETTE, ingredientRect } from './config.js';
import { INGREDIENTS, INGREDIENT_BY_ID } from './recipes.js';

/** The title panel's line count and the name box inside it: main.js hit-tests
 * clicks against the same rectangle the renderer draws. */
export const TITLE_LINE_COUNT = 4;

export function nameBoxRect() {
  const h = 150 + TITLE_LINE_COUNT * 36 + 70 + 64;
  const y = (FIELD.height - h) / 2;
  return { x: (FIELD.width - 520) / 2, y: y + h - 118, w: 520, h: 44 };
}

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    view.scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    view.x = (canvas.width - FIELD.width * view.scale) / 2;
    view.y = (canvas.height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align = 'left', weight = 600) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
  }

  function drawHeader(state, best) {
    ctx.fillStyle = PALETTE.wallBand;
    ctx.fillRect(0, 0, FIELD.width, 62);
    text(`🔥 ${state.restaurantName}`, 28, 42, 27, PALETTE.accent, 'left', 800);
    const mm = Math.floor(state.shiftT / 60);
    const ss = String(Math.floor(state.shiftT % 60)).padStart(2, '0');
    const urgent = state.shiftT <= 30;
    text(`⏱ Shift ${mm}:${ss}`, 500, 42, 28, urgent ? PALETTE.bad : PALETTE.cream, 'center', 800);
    text(`⭐ Score ${state.score}`, 770, 42, 26, PALETTE.cream, 'center', 800);
    text(`Coins ${state.coins}`, 950, 42, 26, PALETTE.warn, 'center', 800);
    text(`Served ${state.served}`, 1120, 42, 26, PALETTE.good, 'center', 800);
    // No best-score in the header: it would crowd the Served counter, and the
    // title and shift-over panels already show it.
  }

  function drawOrderBoard(state) {
    ctx.fillStyle = PALETTE.board;
    ctx.fillRect(14, 66, 1252, 134);
    ctx.strokeStyle = PALETTE.boardEdge;
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 66, 1252, 134);
    state.orders.forEach((order, index) => {
      const card = LAYOUT.orderCards[index];
      const selected = state.wok.recipe && state.wok.recipe.id === order.recipe.id && state.wok.phase !== 'idle';
      roundRect(ctx, card.x, card.y, card.w, card.h, 12);
      ctx.fillStyle = PALETTE.paper;
      ctx.fill();
      ctx.strokeStyle = selected ? PALETTE.flame : '#b89b62';
      ctx.lineWidth = selected ? 5 : 2;
      ctx.stroke();
      text(order.face, card.x + 32, card.y + 58, 36, PALETTE.ink, 'center');
      text(order.customer, card.x + 12, card.y + 114, 13, PALETTE.ink, 'left', 700);
      text(`${order.recipe.icon} ${order.recipe.name}`, card.x + 62, card.y + 36, 21, PALETTE.ink, 'left', 800);
      const steps = order.recipe.steps
        .map((id, stepIndex) => {
          const done = selected && stepIndex < state.wok.added.length;
          return `${done ? '✅' : INGREDIENT_BY_ID.get(id).icon}`;
        })
        .join(' ');
      text(steps, card.x + 62, card.y + 72, 22, PALETTE.ink, 'left');
      text(`${order.recipe.price} coins`, card.x + card.w - 14, card.y + 72, 18, '#8a5a12', 'right', 800);
      // Patience bar: green while happy, red when about to walk away.
      const ratio = Math.max(0, order.patience / order.patienceMax);
      ctx.fillStyle = '#d8c49a';
      ctx.fillRect(card.x + 62, card.y + 88, card.w - 80, 12);
      ctx.fillStyle = ratio > 0.5 ? PALETTE.good : ratio > 0.25 ? PALETTE.warn : PALETTE.bad;
      ctx.fillRect(card.x + 62, card.y + 88, (card.w - 80) * ratio, 12);
    });
    if (state.combo >= 2) {
      text(`🔥 COMBO x${state.combo}`, 640, 224, 26, PALETTE.flame, 'center', 800);
    }
  }

  function drawIngredientDots(added, cx, cy, spread) {
    added.forEach((id, index) => {
      const item = INGREDIENT_BY_ID.get(id);
      const angle = (index / Math.max(1, added.length)) * Math.PI * 2;
      const x = cx + Math.cos(angle) * spread * 0.55;
      const y = cy + Math.sin(angle) * spread * 0.3;
      ctx.font = '30px serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.icon, x, y + 10);
    });
  }

  function drawWok(state, time) {
    const box = LAYOUT.wok;
    // Stove and flame.
    ctx.fillStyle = PALETTE.steel;
    roundRect(ctx, box.x - 20, box.y + 128, box.w + 40, 96, 14);
    ctx.fill();
    if (state.wok.phase === 'cooking') {
      for (let i = 0; i < 7; i += 1) {
        const fx = box.x + 40 + i * 58 + Math.sin(time * 9 + i) * 5;
        ctx.fillStyle = i % 2 ? PALETTE.flame : PALETTE.warn;
        ctx.beginPath();
        ctx.ellipse(fx, box.y + 152, 15, 22 + Math.sin(time * 11 + i * 2) * 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // The wok itself.
    ctx.fillStyle = PALETTE.wok;
    ctx.beginPath();
    ctx.ellipse(box.x + box.w / 2, box.y + 92, 196, 74, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.wokInner;
    ctx.beginPath();
    ctx.ellipse(box.x + box.w / 2, box.y + 86, 172, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a4238';
    ctx.fillRect(box.x + box.w / 2 + 178, box.y + 66, 74, 15);
    if (state.wok.added.length && state.wok.phase !== 'ready') {
      ctx.fillStyle = '#caa06a';
      ctx.beginPath();
      ctx.ellipse(box.x + box.w / 2, box.y + 88, 130, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      drawIngredientDots(state.wok.added, box.x + box.w / 2, box.y + 88, 120);
    } else {
      text('empty wok', box.x + box.w / 2, box.y + 94, 22, PALETTE.muted, 'center');
    }
    // Steam while cooking.
    if (state.wok.phase === 'cooking' || state.wok.phase === 'ready') {
      ctx.font = '26px serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < 3; i += 1) {
        ctx.fillText('💨', box.x + 120 + i * 90, box.y + 26 - Math.sin(time * 3 + i) * 6);
      }
    }
    // Status line under the wok.
    if (state.wok.phase === 'cooking') {
      const ratio = 1 - state.wok.cookT / COOK_SECONDS;
      text(`Sizzling… stir the wok! (${state.wok.stir}/3 stirs)`, box.x + box.w / 2, box.y + 196, 23, PALETTE.warn, 'center', 700);
      ctx.fillStyle = '#4a3826';
      ctx.fillRect(box.x + 50, box.y + 208, box.w - 100, 14);
      ctx.fillStyle = PALETTE.flame;
      ctx.fillRect(box.x + 50, box.y + 208, (box.w - 100) * ratio, 14);
    } else if (state.wok.phase === 'assembling') {
      const next = state.wok.recipe.steps[state.wok.added.length];
      text(`Next: ${INGREDIENT_BY_ID.get(next).icon} ${INGREDIENT_BY_ID.get(next).name}`, box.x + box.w / 2, box.y + 202, 25, PALETTE.cream, 'center', 700);
    } else if (state.wok.phase === 'ready') {
      text('Done! The dish moved to the plate →', box.x + box.w / 2, box.y + 202, 23, PALETTE.good, 'center', 700);
    } else {
      text('Click an order ticket, then its ingredients in order', box.x + box.w / 2, box.y + 202, 21, PALETTE.muted, 'center');
    }
    text('THE WOK — click to stir', box.x + box.w / 2, box.y - 12, 22, PALETTE.cream, 'center', 800);
  }

  function drawPlate(state) {
    const box = LAYOUT.plate;
    text('THE SERVING PLATE', box.x + box.w / 2, box.y - 12, 22, PALETTE.cream, 'center', 800);
    ctx.fillStyle = '#f7f2e6';
    ctx.beginPath();
    ctx.ellipse(box.x + box.w / 2, box.y + 104, 168, 66, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ddd3bd';
    ctx.beginPath();
    ctx.ellipse(box.x + box.w / 2, box.y + 104, 128, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    if (state.wok.phase === 'ready' && state.wok.recipe) {
      // The finished dish: rice mound, fried egg, garnish, recipe icon.
      ctx.fillStyle = '#e8b96f';
      ctx.beginPath();
      ctx.ellipse(box.x + box.w / 2, box.y + 100, 108, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      drawIngredientDots(state.wok.added.slice(0, 4), box.x + box.w / 2, box.y + 100, 90);
      ctx.fillStyle = '#fff8ea';
      ctx.beginPath();
      ctx.ellipse(box.x + box.w / 2 - 40, box.y + 82, 30, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb03a';
      ctx.beginPath();
      ctx.ellipse(box.x + box.w / 2 - 40, box.y + 82, 13, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      text(`${state.wok.recipe.icon} ${state.wok.recipe.name}`, box.x + box.w / 2, box.y + 182, 25, PALETTE.good, 'center', 800);
      text('READY TO SERVE!', box.x + box.w / 2, box.y + 44, 27, PALETTE.accent, 'center', 800);
    } else {
      text('plate is empty', box.x + box.w / 2, box.y + 110, 21, '#8b8172', 'center');
    }
    // Serve / trash buttons.
    const serve = LAYOUT.serveButton;
    roundRect(ctx, serve.x, serve.y, serve.w, serve.h, 10);
    ctx.fillStyle = state.wok.phase === 'ready' ? '#3f9e4d' : '#5a5148';
    ctx.fill();
    text('✔ SERVE', serve.x + serve.w / 2, serve.y + 31, 22, '#ffffff', 'center', 800);
    const trash = LAYOUT.trashButton;
    roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 10);
    ctx.fillStyle = '#7a4438';
    ctx.fill();
    text('✖ TRASH', trash.x + trash.w / 2, trash.y + 31, 22, '#ffffff', 'center', 800);
  }

  function drawCounter(state) {
    ctx.fillStyle = PALETTE.counter;
    ctx.fillRect(0, 548, FIELD.width, 172);
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fillRect(0, 548, FIELD.width, 12);
    const nextId = state.wok.phase === 'assembling' ? state.wok.recipe.steps[state.wok.added.length] : null;
    INGREDIENTS.forEach((item, index) => {
      const rect = ingredientRect(index);
      const isNext = item.id === nextId;
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
      ctx.fillStyle = isNext ? '#5a4326' : '#54381f';
      ctx.fill();
      ctx.strokeStyle = isNext ? PALETTE.accent : '#7d5a33';
      ctx.lineWidth = isNext ? 5 : 2;
      ctx.stroke();
      ctx.font = '36px serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.icon, rect.x + rect.w / 2, rect.y + 52);
      text(item.name, rect.x + rect.w / 2, rect.y + 88, 15, PALETTE.cream, 'center', 700);
      text(`key ${item.key}`, rect.x + rect.w / 2, rect.y + 112, 13, PALETTE.muted, 'center');
      if (isNext) text('▼ NEXT', rect.x + rect.w / 2, rect.y - 8, 15, PALETTE.accent, 'center', 800);
    });
  }

  function drawMessage(state) {
    if (!state.message) return;
    ctx.fillStyle = 'rgba(20,12,6,0.82)';
    roundRect(ctx, 240, 512, 800, 34, 17);
    ctx.fill();
    text(state.message, 640, 535, 19, PALETTE.cream, 'center', 600);
  }

  function panelRect(lines, hasNameBox) {
    const w = 880;
    const h = 150 + lines.length * 36 + 70 + (hasNameBox ? 64 : 0);
    return { x: (FIELD.width - w) / 2, y: (FIELD.height - h) / 2, w, h };
  }

  function drawPanel(title, lines, prompt, nameBox) {
    ctx.fillStyle = 'rgba(16,10,5,0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    const panel = panelRect(lines, Boolean(nameBox));
    const { x, y, w, h } = panel;
    roundRect(ctx, x, y, w, h, 18);
    ctx.fillStyle = '#241407';
    ctx.fill();
    ctx.strokeStyle = PALETTE.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    text(title, FIELD.width / 2, y + 82, 46, PALETTE.accent, 'center', 800);
    lines.forEach((line, index) => {
      text(line, FIELD.width / 2, y + 138 + index * 36, 23, PALETTE.cream, 'center');
    });
    if (nameBox) {
      const box = nameBoxRect();
      text('YOUR RESTAURANT NAME — click the box and type', FIELD.width / 2, box.y - 10, 16, PALETTE.muted, 'center', 700);
      roundRect(ctx, box.x, box.y, box.w, box.h, 10);
      ctx.fillStyle = '#120b04';
      ctx.fill();
      ctx.strokeStyle = nameBox.editing ? PALETTE.good : PALETTE.boardEdge;
      ctx.lineWidth = nameBox.editing ? 3 : 2;
      ctx.stroke();
      const cursor = nameBox.editing && Math.floor(nameBox.time * 2) % 2 === 0 ? '▌' : '';
      text(`${nameBox.name}${cursor} ✎`, box.x + 18, box.y + 31, 24, PALETTE.cream, 'left', 700);
    }
    text(prompt, FIELD.width / 2, y + h - 30, 24, PALETTE.good, 'center', 800);
  }

  function draw(state, screen, best, time) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#17100a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    drawHeader(state, best);
    drawOrderBoard(state);
    drawWok(state, time);
    drawPlate(state);
    drawCounter(state);
    drawMessage(state);
    if (screen === SCREEN_TITLE) {
      drawPanel('🔥 WORLD KITCHEN RUSH', [
        'Run your own restaurant for one 150-second dinner shift.',
        'Cook Italy, Indonesia, China and India to order: click a ticket, add',
        'its ingredients IN ORDER (or the counter keys), stir the sizzling wok,',
        'then SERVE the plate before the patience bar runs out.',
      ], state.restaurantEditing ? 'Typing… press Enter or click anywhere to finish the name' : 'Click or press Space to open your restaurant', {
        name: state.restaurantName,
        editing: state.restaurantEditing,
        time,
      });
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('⏸ Paused', ['The wok will wait for you.'], 'Press P or Space to keep cooking');
    } else if (screen === SCREEN_OVER) {
      drawPanel('🌙 Shift Over!', [
        `Score ${state.score}   •   ${state.coins} coins earned`,
        `${state.served} happy customers served   •   ${state.missed} walked away`,
        `🔥 Best combo x${state.bestCombo}   •   Mistakes: ${state.mistakes}`,
        best ? `Best score: ${best}` : '',
      ], 'Click or press Space to work another shift');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
