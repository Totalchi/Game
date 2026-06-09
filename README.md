# WARDBOUND

> **Flick the tick. Bind the beast.**

A **2D top-down pixel-art** creature-collector battler (classic GBA-era monster-RPG style) that fuses
**OSRS-style prayer-flick timing** with **Pokémon-style collection and team-building** — wrapped in an
original *dark-elemental* world of cursed spirits called **Wraiths**. Explore a tile-based dusk world
top-down; battles switch to the unique real-time flick combat.

You don't pick moves from a passive menu. You fight on a **tick clock** — and here's the keystone
idea that ties the whole game together: **the tick is the dying heartbeat of a broken world, and
you flick in time with the apocalypse.** On that 600ms pulse you read your opponent's telegraphed
attacks and **flick the matching elemental Ward** on the exact landing beat to negate damage while
conserving a tight energy pool. Easy to learn, with a near-infinite skill ceiling — the kind of
mechanic people stream.

## Design pillars

1. **The flick is sacred** — timing skill is the soul; never sold, never RNG'd, never upgraded away.
2. **Read, don't react-spam** — info is telegraphed and fair; mastery is reading + rhythm.
3. **Defense feeds offense** — perfect defense *is* your offense.
4. **Easy to enter, endless to master** — fun in 60s, a ceiling measured in years.
5. **Collect to express, not to win** — your roster is strategy & identity, never a stat-check.
6. **Built to be watched** — if a clip of it wouldn't make chat lose its mind, we can do better.

---

## Why this game

| Pillar | The bet |
| --- | --- |
| **Novel core mechanic** | Tick-perfect "Warding" is a genuine skill mechanic almost no collector game has. It's our moat. |
| **Proven genre shape** | Creature collection + team-building + type matchups is a multi-billion-dollar, sticky genre. |
| **Streamable** | High-skill, readable, dramatic. Free marketing via Twitch/YouTube/TikTok clips. |
| **Reachable & monetizable** | Ships in the browser (zero install), discoverable on web portals, monetized ethically via cosmetics. |
| **Original IP** | 100% our own creatures, art, names, and code — sellable and defensible. |

## Status

🟢 **Phase 1 prototype is playable.** The core flick loop runs: the Knell (600ms tick), telegraphed
attacks, six Wards, Perfect/Clean/Graze/Miss grading, Aether economy, Resolve→Strike offense,
Momentum, an escalating enemy, and a starter-pick screen. Engine-agnostic pure-TS combat core with a
Canvas renderer (Phaser wraps it later for production). 14 core unit tests passing.

## Play the prototype

```bash
npm install
npm run dev      # open the printed localhost URL in a browser
```

**How to play:**
1. Pick your first Wraith (1/2/3).
2. **Explore** the top-down dusk world with **arrows / WASD**. Walk into the **tall grass** to find a
   wild Wraith. Press **Tab** to switch which bound Wraith you lead with.
3. In **battle**, raise the **matching Ward** (keys **1–6**) on the beat an attack reaches the NOW
   line. A quick **tap** = a cheap **Perfect**; **holding** drains Aether. Bank Resolve, then press
   **SPACE** to Strike. Weaken the wild Wraith's Vigor to 0.
4. The **Binding Rite** begins: Ward its final flurry of strikes to fill the **Bind meter** past the
   threshold and **catch it**. Bound Wraiths join your collection — which is **saved** between
   sessions. **ENTER** returns you to the world.

**Depth that's in:** ~18 data-driven Wraiths across 6 elements, each with stats and a **signature**
(Everburn, Riptide, Tempo, Aegis, Wither, Rime, Unmaking); **leveling & Ascension** (Wraiths evolve
as they grow); **mid-battle swapping** (Q/E) with per-Wraith Vigor; **Curses** that attack your
*flicking itself* (Sear drains your next Ward, Static hides telegraphs longer, Rime tightens your
Perfect window, Unmaking stops Wards fully negating…) inflicted by tougher foes; and **rarity** —
most wilds are common, but **Revenants**, a **mythic** Voidmoth, and ultra-rare **Aberrant**
("shiny") variants lurk, each with a longer, harder Binding Rite. Walk the path east to the **Hollow
Shrine** to face the boss. Every species fights with its **own rhythm** — an aggressive Ember
double-hits, a Storm trickster feints and splits, a Stone wall hits slow and heavy. Skill catches
them, never your wallet.

**The Sanctuary:** walk into the building at the top-left to enter your home base. Spend **Beacon**
(earned from binds & wins) to rebuild six structures — the Aether Font, Whetstone, Archive,
Knell-Shrine, Aviary, and the **Hearth**, whose rising tier visibly *lifts the Long Dusk*. Perks boost
your Wraiths' economy and power (PvE), never your timing — skill stays sacred.

**Meta & content:** press **K** for the **Warding Skill Tree** (Insight across 4 branches / 16 nodes —
a long grind, economy/utility only). Press **T** for **Trials** (an endless flick gauntlet) or **Y**
for the date-seeded **Daily Ward**, both tracking your best score. **Knell Stutter** events surge rare
spawns. And a **Story/Hunt** runs through it: narrative beats plus an escalating Hollow-Shrine boss
ladder — Pyreon, Brinewraith, and finally **Mourne, the Hollowed** — after which the Knell steadies:
*held, not healed.*

> The overworld is intentionally chunky "programmer-art" — it proves the *format* (explore → encounter
> → flick-battle → return). Real pixel-art tiles/sprites swap in later (see `docs/ART_BIBLE.md` §0).

```bash
npm test         # run the combat + type-chart unit tests
npm run build    # production build (tsc + vite)
```

## Documentation

**Design & world**
- **[docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)** — the master design (pillars, the flick, collection, modes, teaching curve).
- **[docs/WORLD.md](docs/WORLD.md)** — world bible & art direction (the lore that makes the tick *canon*).
- **[docs/STORY.md](docs/STORY.md)** — story, characters, themes & how we build the game's soul.
- **[docs/BESTIARY.md](docs/BESTIARY.md)** — the Wraiths: starter trio, notable creatures, the Hollow legendary.
- **[docs/COMBAT_DEEPDIVE.md](docs/COMBAT_DEEPDIVE.md)** — full flick spec with timing windows & worked tick-timelines.

**Systems & retention**
- **[docs/RARITY.md](docs/RARITY.md)** — rarity tiers (Revenants, Primarch Echoes, Hollowborn, Aberrants) & the chase.
- **[docs/PROGRESSION.md](docs/PROGRESSION.md)** — the Sanctuary (base building), leveling & skill trees; the retention loop stack.
- **[docs/SEASONS.md](docs/SEASONS.md)** — seasons, world events & live-ops calendar.

**Build & business**
- **[docs/UI_HUD.md](docs/UI_HUD.md)** — HUD/UI design with combat-screen mockups.
- **[docs/NETCODE.md](docs/NETCODE.md)** — PvP & netcode strategy (why our 600ms tick is a fairness superpower).
- **[docs/TECH_STACK.md](docs/TECH_STACK.md)** — engine/tech decision, with research.
- **[docs/ART_BIBLE.md](docs/ART_BIBLE.md)** — visual identity + ready-to-paste image-generation prompts.
- **[docs/MONETIZATION.md](docs/MONETIZATION.md)** — business model and how we make money (ethically).
- **[docs/ROADMAP.md](docs/ROADMAP.md)** — milestones from prototype to launch.

## The one-paragraph pitch

*WARDBOUND is a free-to-play browser battler where you collect cursed elemental spirits and
fight in real time. Instead of mashing menu attacks, you survive by **flicking** the right
elemental Ward at the precise moment each blow lands — a tick-perfect timing skill borrowed from
hardcore MMOs — while the type-matchup depth of a creature collector decides which Wards matter.
It's the depth of a collector, the tension of a rhythm game, and the skill expression of a
fighting game, all in something you can play in a browser tab in 60 seconds.*
