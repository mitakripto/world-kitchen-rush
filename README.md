# warung-sizzle

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/mitakripto/warung-sizzle/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/mitakripto/warung-sizzle/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Warung Sizzle** — an original cooking game. Run a night warung for one 150-second shift: click a customer's order ticket (Nasi Goreng Spesial, Mie Goreng Jawa, Nasi Goreng Seafood, Mie Ayam Pedas), add the dish's ingredients to the wok in recipe order from the counter bins (or keys 1-9), stir while it sizzles, then serve the plated dish before the customer's patience bar runs out. Combos, patience bonuses, stir bonuses, a trash-the-wok do-over, WebAudio kitchen sounds, title / pause / shift-over screens. Plain static files under `game/`, no build step, no network requests, keyboard and mouse.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. To hand the game in the way the grader does: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` — that copies `game/` and `screenshots/` to `out/` and writes `out/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=xavpy24p&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
