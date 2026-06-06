# WARDBOUND — Game Design Document

**Working title:** WARDBOUND (placeholder — easy to change)
**Genre:** Real-time creature-collector battler with skill-timing combat
**Platform:** Web (browser), mobile-web friendly. Steam/native later.
**Audience:** OSRS/skill-game players, creature-collector fans, rhythm/fighting-game crowd, streamers.
**Tone:** Dark fantasy meets elemental mysticism. Moody, atmospheric, a little melancholy — not grimdark-edgy, not kiddie-cute.

---

## 1. The fantasy

The world's elements have curdled. Where there was fire, water, storm, stone, and light, there
are now **Wraiths** — the bound spirits of dead elements, hungry and half-mad. A **Warden**
(the player) can bind these Wraiths and channel their power, but only by mastering the ancient
art of **Warding**: raising the right elemental shield at the exact instant a blow lands.

You are a Warden. You hunt, bind, and raise Wraiths. You out-time everything that tries to
kill you.

---

## 2. The core mechanic: Warding (the "flick")

This is the heart of the game and our competitive moat. It is a direct, original reinterpretation
of OSRS prayer-flicking: **tick-perfect toggling of a protective effect under a tight resource
constraint.**

### 2.1 The tick clock

- Combat runs on a fixed **tick** of **600ms** (configurable; OSRS uses 600ms and it feels great).
- Everything — attacks, Wards, energy drain, counters — resolves on tick boundaries.
- A visible **tick pulse** (a beat/heartbeat UI element + audio click) keeps the player in rhythm.
  Readability is everything: the player must always *feel* the beat.

### 2.2 Wards

- Each element has a **Ward** (Protect-from-Fire, Protect-from-Tide, Protect-from-Storm, …).
- The player has **Ward slots** mapped to keys (desktop: 1–6 / Q-W-E; mobile: on-screen buttons).
- A Ward is **toggled**, not held-charged: tap to raise it for the current tick, it auto-drops
  unless re-tapped. This is the "flick."

### 2.3 The flick loop (why it's deep)

- **Holding a Ward up drains energy fast.** Leaving it down costs nothing.
- An incoming attack lands on a specific **landing tick** and has an **element**.
- If the **correct** Ward is up on the landing tick → attack is **negated** (or massively reduced)
  AND you bank **Resolve** (counter-meter).
- If the **wrong** Ward is up, or **no** Ward → you take full damage.
- So the optimal play is to **flick the correct Ward on the exact landing tick and drop it
  immediately** — spending ~1 tick of energy instead of holding it for many. Just like prayer
  flicking, but the *element* you flick is dictated by the type matchup.

This produces the signature skill expression: a skilled Warden barely spends energy and blocks
everything; a novice either gets hit or burns out their energy holding shields up.

### 2.4 Difficulty layers (the skill ceiling)

1. **Single telegraph** (tutorial): one attack, clear 3-tick wind-up, flick on cue.
2. **Mixed elements**: attacks alternate elements; you must flick the *right* Ward each time.
3. **Faster cadence**: attacks every 2 ticks, then every tick (the OSRS "1-tick" feel).
4. **Fakes & feints**: enemy telegraphs one element, switches at the last tick (reaction reads).
5. **Double-hits / stacked**: two elements on the same landing tick → forces Ward priority choices
   (you can't block both; minimize damage by Warding the bigger threat).

### 2.5 Energy ("Aether")

- A pool that drains while any Ward is up, regenerates while all Wards are down.
- Forces the flick discipline: you cannot just hold shields forever.
- Certain Wraith abilities, items, and cosmetics tune regen/drain — a build-craft dimension.

### 2.6 Offense: Resolve & strikes

- Combat isn't *only* defensive. Perfect flicks build **Resolve**.
- Spend Resolve to trigger your Wraith's **Strikes** (attacks), which the *opponent* must Ward.
- In PvP, this becomes a duel of mutual flicking: bait the opponent into the wrong Ward, then
  strike the element they're not covering. Pure skill expression, OSRS PvP-style mind games.

---

## 3. The Pokémon layer: collection, types, teams

### 3.1 Elemental type chart (original)

Six core elements at launch (kept tight for readability; expandable later):

| Element | Beats | Weak to | Flavor |
| --- | --- | --- | --- |
| **Ember** (fire) | Bloom, Frost | Tide, Stone | cursed flame |
| **Tide** (water) | Ember, Stone | Bloom, Storm | drowned spirits |
| **Storm** (air/lightning) | Tide, Bloom | Stone, Frost | shrieking wind |
| **Stone** (earth) | Ember, Storm | Tide, Bloom | grave-rock |
| **Bloom** (nature/decay) | Tide, Stone | Ember, Storm | rot & overgrowth |
| **Frost** (ice) | Storm, Bloom | Ember, Stone | the cold death |

Plus a rare 7th, **Hollow** (eldritch/void), introduced later — neutral matchups but unique
mechanics (e.g. Wards that decay, attacks that can't be fully negated). This is the "dark
fantasy" half of the theme and a strong cosmetic/collector hook.

- Type advantage in WARDBOUND doesn't just scale damage — it changes **which Wards an opponent
  forces on you**, i.e., it shapes the *timing puzzle*, not just a damage multiplier. This makes
  the matchup chart matter to skilled play, not just stat-checking.

### 3.2 Wraiths (creatures)

- Each Wraith has: an **element** (sometimes dual), **stats** (Vigor/HP, Aether/energy pool,
  regen, Resolve gen), and **2–4 Strikes** of various elements + a **signature ability**.
- **Original designs only.** Theme: cursed elemental spirits with an eldritch edge (think:
  a drowned lantern-ghost for Tide, a cracked-magma golem for Ember/Stone, a void-moth for Hollow).
- ~24–30 Wraiths at launch is plenty for a deep meta without art blowing up scope.
- **Binding (catching):** weaken a wild Wraith in battle, then win a short "binding flick"
  minigame (a tightened version of the core mechanic) to capture it. Catching *is* the mechanic —
  no random RNG ball-throw; skill is rewarded.

### 3.3 Teams & progression

- Build a **team of up to 6**; swap Wraiths mid-battle (swap costs a tick + energy → tactical).
- **Leveling:** Wraiths gain levels from battles, raising stats and unlocking Strikes.
- **Evolution / "Ascension":** at thresholds, Wraiths Ascend into stronger eldritch forms
  (visual upgrade + new signature ability). Great collection + cosmetic hook.
- **Affinity:** a Warden masters specific elements over time, unlocking faster Ward flicks or
  cheaper Wards for those elements — a meta-progression that rewards specialization.

---

## 4. Game modes

| Mode | Purpose | Notes |
| --- | --- | --- |
| **Story / Hunt** | Onboarding + single-player content | Region-based, escalating telegraph difficulty, boss Wraiths. The drip-feed that teaches flicking. |
| **Wild Hunts** | Catch & grind | Roam zones, find & bind wild Wraiths. |
| **Trials (PvE skill)** | Pure skill flex | Endless/ramping flick gauntlets, leaderboards. Highly streamable & clip-able. |
| **Duels (PvP)** | The skill endgame | 1v1 real-time flick duels. Ranked ladder. This is the esport/streaming engine. |
| **Daily Ward** | Retention | One curated puzzle/gauntlet per day, shared seed, leaderboard. Cheap to run, sticky. |

PvP is the long-term heart but PvE-first is the right launch order (teach the mechanic, build the
roster, prove fun) — see ROADMAP.

---

## 5. The "first 60 seconds" (new-player flow)

1. Cold open: a single telegraphed Ember strike. Big cue. Player flicks Ember Ward, negates it,
   feels powerful. (No menus, no text walls.)
2. Second beat: two alternating elements — player learns Wards are element-specific.
3. They bind their first Wraith via the binding flick. Now they *own* something.
4. Hook: "A stronger Wraith lurks deeper." → into the first short Hunt.

The goal: **fun in under 60 seconds, ownership in under 3 minutes** — critical for web retention.

---

## 6. Accessibility & feel

- **Adjustable tick speed** in casual modes (practice at 800ms, ranked locked at 600ms).
- **Audio + visual + haptic** tick cues (never audio-only — accessibility and clarity).
- **Colorblind-safe** element palette + distinct shapes/icons per element (never color-only).
- **Input latency budget:** we must measure and minimize input→resolve latency; a flick game lives
  or dies on responsiveness. This drives the tech choice (see TECH_STACK.md).
- **Practice mode / metronome trainer:** let players drill flicks. Skill games retain when players
  feel themselves improving.

---

## 7. What we are explicitly NOT doing (IP safety)

- No RuneScape/OSRS or Pokémon **assets, names, sounds, creatures, or UI**.
- No "Protect from Melee/Magic/Range" naming, no Pokémon type names, no Pokéball, no gym badges.
- We borrow the **mechanic** (tick-flicking, type matchups, collection) — which is legally fair —
  and express it with **entirely original** worldbuilding, art, audio, and code.
- See MONETIZATION.md §"Legal & IP" for the reasoning and sources.

---

## 8. Open design questions (to decide together as we build)

- Final element count at launch (6 vs 5) and whether dual-typing ships in v1.
- Should energy (Aether) be per-Wraith or per-Warden (shared pool)? (Leaning per-Warden for the
  pure prayer-flick feel.)
- PvP netcode model — rollback-style vs server-authoritative tick lockstep (affects fairness of a
  timing game heavily; big technical decision flagged in ROADMAP).
- How punishing should "wrong Ward" be — full damage vs partial? (Tuning, decide via playtests.)
