# WARDBOUND — Combat Deep-Dive

> The full mechanical spec of the flick loop, with worked timelines and illustrative numbers (all
> tunable). This is the document that proves the mechanic actually holds together — and the reference
> we'll build the Phase 1 prototype against.

---

## 1. The tick (The Knell)

- Fixed **600ms** simulation step. Everything resolves on tick boundaries.
- Rendered with a visible **pulse**, an audible **click/knell**, and optional haptic.
- The sim is **deterministic** given inputs + seed (enables replays, ghosts, leaderboard integrity, future PvP).

### The Perfect window
Within each tick, the **Perfect window** is the final slice of the beat — illustratively the last
**~120ms** leading into the landing boundary. Raise the correct Ward inside that window → **Perfect**.
Earlier (but still covering landing) → **Clean**. Edge overlap → **Graze**. Outside → **Miss**.

> **Hard rule (skill purity):** this window is **universal and fixed**. No level, stat, item, or
> purchase ever widens it. Only the visible **Rime** curse narrows it, briefly and counterably.

---

## 2. Resources

### Aether (energy) — illustrative numbers
- Pool: **100** (modified by a Wraith's *Aether* stat).
- **Drain:** holding any Ward up costs **~8 / tick**.
- **Regen:** **~5 / tick** while *all* Wards are down (modified by *Flow*).
- A **Perfect flick** spends ~1 tick of hold (~8). Holding constantly empties the pool in ~12 ticks
  (~7s) and then regen can't keep up with drain → **you must flick, not hold.** This is the engine of
  the whole skill expression.

### Resolve (counter-meter)
- Fills from good defense; spent on **Strikes**.
- Gains (illustrative, scaled by *Spirit*): **Perfect +25 · Clean +10 · Graze +3 · Miss +0**.
- Bar caps at **100**; Strikes cost **20–60** depending on power/feint complexity.

### Vigor (HP)
- Standard health. A clean Miss against a heavy Strike can be **20–35%** of Vigor — getting read is *punishing*, which is what makes Perfects feel earned.

### Momentum (enemy/opponent pressure)
- On your **Miss**, the attacker gains Momentum: their next telegraph is **faster** and Strikes hit
  harder. Whiffing snowballs — but a single Perfect resets it. High-tension, high-comeback.

---

## 3. The flick grades (resolved each landing tick)

| Grade | Condition | Damage | Resolve | Aether |
| --- | --- | --- | --- | --- |
| **Perfect** | Correct Ward raised in the Perfect window | 0 | +25 | ~8 (1 tick) |
| **Clean** | Correct Ward up over landing, raised early | 0 | +10 | higher (held N ticks) |
| **Graze** | Correct Ward partially overlapping landing | ~50% | +3 | varies |
| **Miss** | Wrong Ward or no Ward on landing | 100% (+Momentum to attacker) | 0 | 0 |

The elegance: **Perfect is simultaneously safest, cheapest, and most rewarding.** Conservation
(OSRS) and precision (rhythm) collapse into one skill.

---

## 4. Telegraphs (how attacks are signaled — fairness first)

Every incoming Strike shows, ahead of its landing tick:
1. **Element** (color + shape icon, colorblind-safe).
2. **Wind-up length** (how many ticks until landing) via a filling indicator synced to the Knell.
3. **Special markers:** *feint* (will switch element on the last beat), *split* (two landing ticks),
   *stacked* (two elements, same tick).

Difficulty comes from **cadence, feints, and stacking** — never from hiding information unfairly. A
god Warden, given the same screen, always has a fair read.

---

## 5. Worked examples (tick timelines)

Notation: each cell is one 600ms tick. `[Ember➜]` = telegraph winding up; `‖` = landing tick;
`(Wd:X)` = you raise Ward of element X; ✅Perfect / 🟡Clean / 🟠Graze / ❌Miss.

### Example A — the basic flick (tutorial)
```
Tick:    1        2        3        4
Enemy:  [Ember➜] [Ember➜] [Ember‖]
You:     .        .        (Wd:Ember)✅
```
You wait, then snap Ward-of-Ember on the landing beat. Negated, +25 Resolve, ~8 Aether. Clean and cheap.

### Example B — lazy vs snap (the conservation lesson)
```
            t1       t2       t3
Snap:      .        .        (Wd:E)✅     → ~8 Aether, +25 Resolve   (optimal)
Lazy:      .       (Wd:E)    (hold)🟡     → ~16 Aether, +10 Resolve  (safe vs unclear timing)
```
Both negate; the **snap** conserves energy and pays more Resolve. Skilled play trends toward snaps;
lazy Wards are the safety valve when you can't yet read the beat (or under **Static**).

### Example C — alternating elements (cadence)
```
Tick:  1        2        3        4        5
Enemy:[Ember➜][Tide➜] [Ember‖] ...      [Tide‖]
       ...     (the two telegraphs overlap, landing on 3 and 5)
You:                    (Wd:E)✅          (Wd:T)✅
```
You must track two wind-ups and flick the *correct* element on each landing. This is where the type
chart bites: against a Storm Wraith you'll be forced onto your *off-elements*, which cost more Aether.

### Example D — the feint (reads)
```
Tick:  1            2            3
Enemy:[Storm➜](feint)[??➜]      [Ember‖]   ← telegraphed Storm, flips to Ember on the last beat
Bad:                              (Wd:Storm)❌   ← committed early, got read
Good:               (read flip)  (Wd:Ember)✅   ← waited, snapped the real element
```
Feints punish pre-committing. The counter-skill is **waiting for the Perfect window** instead of
flicking on the telegraph — exactly the discipline the game trains.

### Example E — Tempestrix Doublestrike (the ceiling)
```
Tick:  1          2          3
Enemy:[Storm➜]   [split‖a]  [split‖b]   ← one telegraph, TWO landing ticks (later: two elements)
You:              (Wd:S)✅   (Wd:S)✅     ← two perfect flicks back to back
```
At 1-tick cadence with mixed elements, this is the hook-clip pattern: rhythmic, brutal, and gorgeous
to watch.

---

## 6. Offense: the Strike economy

- Build **Resolve** by Warding well → spend it on your Wraith's **Strikes**.
- A Strike sends a **telegraphed attack at the opponent**, which *they* must Ward (same grades apply
  to them). So PvP/boss fights are **mutual flicking**: you defend *and* author offense.
- Strikes can be **feinted** or **split** (costing more Resolve) to bait Misses — pure mind-game.
- **Tempo choice:** dump Resolve early for chip pressure, or bank it for a lethal combo when their
  Aether is low. This is the strategic spine on top of the execution layer.

---

## 7. Curses (mechanics summary — see GDD §6 for the list)

Curses attack your **flicking** itself, always visibly and counterably:
- **Sear** (Ward costs 2×) · **Drown** (more drain) · **Static** (telegraphs reveal 1 beat later) ·
  **Shatter** (next Miss hits harder) · **Sap** (less Resolve) · **Rime** (Perfect window narrows
  briefly) · **Unmaking** (struck Ward decays → snap-only).
- They convert "deal damage" into "degrade their ability to defend," which is the most thematically and
  mechanically interesting axis of depth — and it's what makes the Hollow legendary terrifying.

---

## 8. Swapping (team tactics)

- Swap-in costs **1 tick + Aether**. During that tick you're vulnerable → swaps are *reads*, not free.
- A swap-in can be timed to **Ward-cover** an incoming Strike with a better-matched teammate (sac the
  tick to deny a big hit). Adds a team-level layer to the flick game.

---

## 9. PvE AI vs PvP

- **PvE:** enemy telegraphs are authored patterns + difficulty parameters (cadence, feint rate, split
  rate, stack rate, Momentum scaling). Bosses are *designed sequences* (rhythm-chart-like) — highly
  tunable and the backbone of the teaching curve and Trials.
- **PvP:** both players defend and author Strikes in real time. Netcode fairness is paramount and
  deliberately deferred (see ROADMAP); **Ghost Duels** (race a recorded opponent) deliver async PvP
  thrill with zero netcode in the meantime.

---

## 10. Tuning levers (what we'll iterate in playtests)

| Lever | Effect | Starting guess |
| --- | --- | --- |
| Tick length | Overall difficulty/feel | 600ms (ranked); 800ms (practice) |
| Perfect window | Execution strictness | ~120ms |
| Aether drain / regen | Flick pressure | 8 / 5 per tick |
| Resolve gains | Offense pace | 25 / 10 / 3 / 0 |
| Miss damage | Punish severity | 20–35% Vigor on heavies |
| Momentum scaling | Snowball/comeback | resets fully on one Perfect |

> Everything here is a **starting hypothesis**. Phase 1's job is to get these *feeling* right with real
> hands on the game. The numbers serve the feel, never the other way around.
