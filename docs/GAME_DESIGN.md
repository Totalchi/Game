# WARDBOUND — Game Design Document

**Title:** WARDBOUND
**Genre:** Real-time creature-collector battler with skill-timing ("flick") combat
**Platform:** Web (browser), mobile-web friendly. Steam/native later.
**Audience:** OSRS/skill-game players, creature-collector fans, rhythm & fighting-game crowd, streamers.
**Tone:** Dark elemental fantasy — moody, mythic, melancholy. The beauty of a dying world, not edgelord grimdark, not kiddie-cute.
**Tagline:** *Flick the tick. Bind the beast.*

> **Companion docs:** [WORLD.md](WORLD.md) (lore & art direction) · [BESTIARY.md](BESTIARY.md) (the Wraiths) · [COMBAT_DEEPDIVE.md](COMBAT_DEEPDIVE.md) (the flick mechanic in full) · [TECH_STACK.md](TECH_STACK.md) · [MONETIZATION.md](MONETIZATION.md) · [ROADMAP.md](ROADMAP.md)

---

## 1. Design pillars

Everything in WARDBOUND is measured against these six. If a feature fights a pillar, the feature loses.

1. **The flick is sacred.** Tick-perfect timing is the soul of the game. It is *never* sold, *never* RNG'd, *never* upgraded away. Skill is the only thing that wins a battle.
2. **Read, don't react-spam.** Information is telegraphed and fair. Mastery is *reading* the fight and *syncing* to the rhythm — not mashing.
3. **Defense feeds offense.** Every system loops perfect defense back into power. The best Warden is the one who barely gets touched and hits like a god for it.
4. **Easy to enter, endless to master.** Fun in 60 seconds. A skill ceiling measured in years.
5. **Collect to express, not to win.** Your roster is *strategy and identity*, never a stat-check that beats a better player.
6. **Built to be watched.** Every choice considers the spectator. If a clip of it wouldn't make chat lose its mind, we can do better.

---

## 2. The hook (the elevator clip)

A Warden is cornered by a **Tempestrix**, a storm-roc whose strikes split into two landing ticks at
1-tick cadence. Energy at **4%**. The player snap-flicks **Storm — Tide — Storm — Ember** in perfect
rhythm, negating a barrage that would flatten anyone else, Resolve maxing with every Perfect. On the
last beat they dump it all into a counter-Strike that detonates the roc. Chat explodes.

**That moment** — legible, dramatic, obviously skillful — is the product. Everything is designed to
manufacture and broadcast it.

---

## 3. The world, in one breath

The six elements were once living forces of the world. An age ago they were **Sundered** and died;
their death-echoes became **Wraiths** — bound, hungry, half-mad spirits. The world has been dimming
ever since, in a permanent dusk, and its heart is failing. You can still *feel* it beat — a slow,
600-millisecond **pulse**.

**Wardens** are those who learned to move in time with that fading heartbeat: to raise an elemental
**Ward** on the exact beat a blow lands, and to **bind** Wraiths to their will. The tick is not a UI
element. **The tick is the world's heartbeat, and you are flicking in time with the apocalypse.**

(Full lore, regions, and antagonist in [WORLD.md](WORLD.md).)

---

## 4. The core mechanic: Warding (the "flick")

The heart of the game and our moat — an original reinterpretation of OSRS prayer-flicking:
**tick-perfect toggling of a protective effect under a tight resource constraint, where the *element*
you flick is dictated by type matchups.** Full mechanical spec lives in
[COMBAT_DEEPDIVE.md](COMBAT_DEEPDIVE.md); the essentials:

### 4.1 The tick clock
- Combat advances in fixed **600ms ticks** (the world's heartbeat). A visible pulse + audio click +
  optional haptic keep you in rhythm. Readability is everything — the player must always *feel* the beat.

### 4.2 Wards are flicked, not held
- Each element has a **Ward** (Ward-of-Ember, Ward-of-Tide, …) on a key/button.
- A Ward is **toggled on for a tick** and auto-drops. The "flick."
- **Holding a Ward up drains energy (Aether) fast; leaving it down costs nothing and regenerates.**

### 4.3 The flick loop (why it's deep)
- Incoming attacks have an **element** and a **landing tick**, shown by a telegraph wind-up.
- Raise the **correct** Ward on the landing tick → **negate** the hit *and* bank **Resolve** (counter-meter).
- Wrong Ward / no Ward → take the hit and feed the enemy.
- Optimal play: flick the right Ward on the exact landing tick and drop it — spending ~1 tick of energy
  instead of holding for many. Skilled = barely spends energy, blocks everything. Novice = gets hit or burns out.

### 4.4 Timing grades (the rhythm-game layer)
Each flick is graded by *when* the correct Ward goes up relative to landing:

| Grade | What happened | Result |
| --- | --- | --- |
| **Perfect** | Correct Ward raised *on the landing beat* (tight window) | Full negate · **max Resolve** · ~1 tick energy. The flick. |
| **Clean** | Correct Ward up across landing but raised early (held) | Full negate · less Resolve · more energy spent. Safe but wasteful. |
| **Graze** | Slightly off / partial overlap | ~50% damage · tiny Resolve. |
| **Miss** | Wrong Ward or none | Full damage · enemy gains Momentum. |

This is the elegant synthesis: **Perfect is simultaneously the safest, cheapest, *and* most offensive
play** — so OSRS conservation and rhythm-game precision become the *same* skill.

### 4.5 Defense feeds offense
Perfect flicks fill **Resolve**; spend Resolve on your Wraith's **Strikes**, which the *opponent* must
then Ward. The better you defend, the harder you hit. (Economy detail in the deep-dive.)

### 4.6 Skill purity (a hard rule)
**Timing windows are universal and fixed.** They are *never* widened by levels, stats, items, or
purchases. You cannot buy or grind better timing. Stats and gear affect HP, energy economy, damage,
and Resolve — never the leniency of the flick. (The only thing that tightens a window is a **visible,
in-battle Curse**, which is fair and counterable.) This protects the competitive integrity that makes
the game worth watching.

---

## 5. The collector layer: elements, Wraiths, teams

### 5.1 The element wheel (original)
Six core elements (tight for readability, expandable later), plus a rare seventh.

| Element | Beats | Weak to | Flavor |
| --- | --- | --- | --- |
| **Ember** (fire) | Bloom, Frost | Tide, Stone | cursed flame |
| **Tide** (water) | Ember, Stone | Bloom, Storm | drowned spirits |
| **Storm** (air/lightning) | Tide, Bloom | Stone, Frost | shrieking wind |
| **Stone** (earth) | Ember, Storm | Tide, Bloom | grave-rock |
| **Bloom** (decay/nature) | Tide, Stone | Ember, Storm | rot & overgrowth |
| **Frost** (ice) | Storm, Bloom | Ember, Stone | the cold death |
| **Hollow** (void) ★ | — | — | the eldritch wound; neutral matchups, breaks rules |

**The crucial twist:** type advantage doesn't just multiply damage — it **shapes the timing puzzle**.
An advantaged attacker telegraphs *faster/feinted* strikes against you, and your off-element Wards cost
more, so matchups change *what you have to flick and how hard*, not just a number. The chart matters to
skilled play, not just stat-checking.

### 5.2 Wraiths (creatures)
- Each has: **element** (sometimes dual), **stats** (Vigor / Aether / Flow / Power / Resolve-gen),
  **2–4 Strikes** across elements, and a **signature ability** that interacts with the flick loop.
- **100% original designs** in the dark-elemental style (see [BESTIARY.md](BESTIARY.md) for the launch roster:
  a starter trio, notable mid-game Wraiths, and a Hollow legendary).
- ~24–30 at launch — deep meta, sane art budget.

### 5.3 Binding (catching) is a skill, not a dice roll
Weaken a wild Wraith, then win the **Binding Rite** — a tightened solo flick gauntlet where the Wraith
lashes out and you must Perfect a short escalating sequence to seal the bind. **Skill catches, not RNG.**
A great Warden can bind a rare Wraith on low odds by simply out-flicking it. (Streamable tension.)

### 5.4 Teams, leveling, Ascension
- **Team of up to 6.** Swapping mid-battle costs a tick + energy → a real tactical decision, and a
  swap-in can "Ward-cover" for a teammate on a read.
- **Leveling** raises stats and unlocks Strikes.
- **Ascension** (evolution): at thresholds a Wraith Ascends into a stronger, eldritch-tinged form —
  new signature, dramatic visual upgrade. Collection + cosmetic hook.
- **Affinity (Warden meta-progression):** mastering an element over time unlocks *flavor & economy*
  perks (cheaper off-Wards, faster Resolve with that element) — **never** timing leniency.

---

## 6. Status: Curses (depth without clutter)

Curses are the spice — and thematically perfect, because they attack your **ability to flick** rather
than just your health:

| Curse | Element | Effect |
| --- | --- | --- |
| **Sear** | Ember | Your next Ward costs double Aether. |
| **Drown** | Tide | Aether drain while Warding is increased. |
| **Static** | Storm | Telegraphs reveal one beat later (less reaction time). |
| **Shatter** | Stone | Your next *missed* Ward hits much harder. |
| **Sap** | Bloom | Reduced Resolve gain. |
| **Rime** | Frost | Your Perfect timing window narrows briefly (visible, counterable). |
| **Unmaking** | Hollow | A struck Ward *decays* — it can't be held, only snap-flicked. |

Curses are always **visible, telegraphed, and counterable** — they raise the skill expression, they
never feel like unseen RNG. They make matchups a battle over your *flicking itself*.

---

## 7. Game modes

| Mode | Purpose | Notes |
| --- | --- | --- |
| **Story / Hunt** | Onboarding + single-player spine | Region-based, escalating telegraph difficulty, boss Wraiths. The drip-feed that teaches flicking. |
| **Wild Hunts** | Catch & grind | Roam the dusk-zones; find & bind wild Wraiths via the Binding Rite. |
| **Trials** | Pure skill flex (PvE) | Endless/ramping flick gauntlets; leaderboards. Maximally streamable. |
| **Duels (PvP)** | The skill endgame | 1v1 real-time flick duels; ranked ladder. The esport/streaming engine. |
| **Ghost Duels** | Async PvP | Race a recorded "ghost" of another Warden's run — PvP thrill, no netcode. (Great early-launch bridge.) |
| **Daily Ward** | Retention | One curated seeded puzzle/gauntlet a day; shared leaderboard; cheap to run, very sticky. |

Launch order is PvE-first (teach the mechanic, build the roster, prove fun, de-risk netcode) — see ROADMAP.

---

## 8. The teaching curve (first 60 seconds → first hour)

The #1 risk for a skill game is bouncing newcomers. We teach by *play*, never walls of text:

1. **0:00 — One clear strike.** A single telegraphed Ember blow, huge cue. Flick Ward-of-Ember, negate, feel powerful. No menus.
2. **0:20 — Elements matter.** Two alternating elements; you learn Wards are element-specific.
3. **1:00 — Ownership.** Win your first Binding Rite; you now *own* a Wraith.
4. **3:00 — The loop.** First short Hunt: a Resolve Strike, a swap, an Ascension preview dangled.
5. **The ramp** (single → mixed → faster → feints → stacked) is metered out across the Story so players are *always* ~one notch past comfortable. A **Practice/Metronome trainer** lets them drill any pattern.

**Targets:** fun < 60s, ownership < 3min, "I'm getting better" felt within the first session.

---

## 9. Why it's built to be watched (the viral engine)

Skill ceiling + clip-ability is our cheapest, biggest marketing channel. So these are *features*, not afterthoughts:

- **Instant replays + one-click clip export** (vertical-format friendly for TikTok/Shorts/Reels).
- **Ghost Duels & shared Daily Ward seeds** — built-in "can you beat my run?" loops.
- **Spectator mode** with a clean, legible HUD (telegraphs, grades, energy, Resolve readable to viewers).
- **Spectacular, cosmetic-able Perfect-flick FX** — the most-repeated, most-watched action gets the most visual love (and is prime cosmetic real estate; see MONETIZATION.md).
- **Leaderboards everywhere** (Trials, Daily Ward, ranked Duels).

---

## 10. Accessibility & feel (non-negotiable for a flick game)

- **Tick speed adjustable in casual/practice** (e.g. 800ms training); ranked locked at 600ms.
- **Multi-sensory cues** — visual + audio + optional haptic. *Never* audio-only.
- **Colorblind-safe palette + distinct shape/icon per element.** Never color-only.
- **Input latency is a first-class metric.** We instrument input→resolve from day one; audio cues use the sample-accurate Web Audio clock, not timers. (See TECH_STACK.md.)
- **Comfort:** no required rapid mashing — flicking is *precise*, not *frantic*; remappable inputs; one-handed/relaxed layouts.
- **Practice mode** so players can *feel themselves improve* — the engine of skill-game retention.

---

## 11. What we are explicitly NOT doing (IP safety)

- No RuneScape/OSRS or Pokémon **assets, names, sounds, creatures, or UI**.
- No "Protect from Melee/Magic/Range" naming, no Pokémon type names, no Poké-anything, no gym badges.
- We borrow only the **mechanics** (tick-flicking, type matchups, collection) — legally fair — and
  express them with **entirely original** world, art, audio, names, and code. (Reasoning + sources in MONETIZATION.md.)

---

## 12. Open design questions (decide together as we build)

- Final element count at launch (6 vs 5); does **dual-typing** ship in v1?
- **Aether** per-Warden (shared pool, purest prayer-flick feel — current lean) vs per-Wraith?
- **Wrong-Ward punishment**: full damage vs partial — tune via playtests.
- PvP netcode model (lockstep vs rollback) — big call, deliberately deferred (Ghost Duels bridge us).
- How much of the **Curse** system ships at launch vs post-launch.
