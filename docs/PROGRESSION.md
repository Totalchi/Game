# WARDBOUND — Progression, The Sanctuary & Retention

> Your ideas — base building, level-up, skill trees — are exactly the loops that turn a fun mechanic
> into a game people live in. This doc designs them so they create **depth, identity, and a reason to
> return every day**, while obeying our #1 pillar: **the flick is sacred — progression never buys you
> better timing or pay-to-win power.**

---

## ⭐ IMPLEMENTED v1 — Skill Tree & Homebase (what's actually in the game)

### The Warding Tree (skill tree) — *"a degelijk lange grind"*
You earn **Insight** slowly (battle win **+1**, Revenant **+3**, mythic boss **+5**, each bind **+2**)
and spend it across **4 branches / 16 nodes**, most with **5 ranks** and **rising cost** (rank *r*
costs `baseCost × (r+1)`). Completing everything needs **≈ 650 Insight ≈ 200+ encounters** — a genuine
long-haul grind, on purpose. Every node is economy/utility/access — **never timing** (skill purity).

| Branch | Nodes (rank-by-rank perks) |
| --- | --- |
| 🟦 **Conservation** | *Steady Breath* (+8% Aether regen), *Deep Well* (+5 max Aether), *Light Step* (−12% swap cost), *Eternal Flame* (capstone: Wards drain −15%) |
| 🟪 **Resolve** | *Riposte* (+2 Resolve/Perfect), *Honed Edge* (+4% Strike), *Deep Reserve* (+10 Resolve cap), *Overflow* (capstone: +15% Strike) |
| 🟨 **Hunter** | *Keen Eye* (+rare-spawn luck), *Warden's Tithe* (+8% Beacon), *Scholar* (+8% XP), *Practised Bind* (+6 starting Bind meter), *Fortune's Favour* (capstone: +6 luck) |
| 🟩 **Warding** | *Calm Mind* (−8% curse duration), *Momentum Break* (−12% Momentum dmg), *Unbroken* (capstone: −20% curse duration) |

Prereqs gate the tree (e.g. *Deep Well* needs *Steady Breath* rank 2; capstones need their branch
maxed), so it reads as a real tree with build choices. Open it with **K** in the overworld.
**Future expansion** (keeps the grind growing): per-element Affinity sub-trees and per-Wraith "Pacts"
(GDD §3B/PROGRESSION §3B/C) — each a fresh tree on top of this one, so "100%" keeps moving with seasons.

### The Sanctuary (homebase upgrades) — *"hoe doen we de homebase?"*
Walk into the building (top-left) to enter your base. You spend **Beacon** (bind **+12**, win **+6**,
scaled by Knell-Shrine & skills) on structures with **rising cost** (`baseCost × costMult^level`). Each
gives a tangible **economy/PvE** perk; the **Hearth** tier visibly *lifts the Long Dusk* (the screen
brightens, flavour text advances) — progress you can *see*, which is the core retention + soul hook.

| Structure | Perk (per level, max 5) |
| --- | --- |
| **The Hearth** | Sanctuary tier — lifts the dusk (soul/visual; gates the fantasy of healing Vael) |
| **Aether Font** | +6 max Aether in battle |
| **Whetstone** | +6% Strike power |
| **The Archive** | +12% XP |
| **Knell-Shrine** | +15% Beacon income |
| **The Aviary** | +2 rare-spawn luck |

**How upgrades work / scale:** costs grow geometrically so each structure is its own mini-grind; perks
stack multiplicatively with skill-tree perks (e.g. Whetstone ×1.30 × Honed Edge ×1.20 strike power), so
a maxed Warden is meaningfully stronger in PvE without ever touching the flick window. **Future
structures** (the design runway): Domain Habitats ×6 (passive Beacon + house bound Wraiths per element),
the Trial Hall (unlocks Trials/Daily), the Forge (cosmetics), the Reliquary (Insight income) — and
higher Hearth tiers that physically rebuild the town art. See §1 below for the full vision.

### World events — the rare-spawn chase
**Knell Stutters** now fire periodically in the overworld (HUD shows *✦ KNELL STUTTER*): for ~12s rare
spawns surge (a big luck boost on top of Keen Eye/Aviary), driving the *"log in / keep hunting"* loop.
Roadmap: Eclipses & Domain Storms (RARITY.md §4).

## 0. The golden rule (how we keep retention AND skill purity)

Progression in WARDBOUND grants four things — and *never* the fifth:

✅ **Economy** (cheaper/faster Aether, Resolve) · ✅ **Utility & QoL** (build variety, swaps, hunting
tools) · ✅ **Expression** (cosmetics, your Sanctuary, your identity) · ✅ **Access** (new content, rare
spawns, modes)

❌ **NEVER** wider timing windows, and ❌ **never** raw power that lets a worse player out-stat a better
one in ranked.

**How ranked stays pure:** Ranked Duels use **normalized loadouts** — Wraiths are brought to a standard
level and a capped "build budget," so the ladder is decided by *reads and flicks*, not grind. All the
juicy progression below powers **PvE, hunting, expression, and unranked play** to the fullest. Best of
both worlds: deep RPG progression *and* a clean esport.

---

## 1. The Sanctuary (base building — the heart of "stickiness" and soul)

Your home in Vael: a ruined Warden refuge you **rebuild beat by beat** as you play. It is the single
strongest retention + soul system we have, because **you literally watch the dying world come back to
life by your hand.**

### How it works
- Earn **materials & Beacon** (a non-purchasable building resource) from battles, hunts, dailies, story.
- Spend them to **restore and upgrade structures.** Each upgrade visibly changes the world: light
  returns, survivors arrive, a domain's flora regrows, the music gains an instrument.
- The Sanctuary is **persistent, personal, visitable**, and a constant "just one more upgrade" hook.

### Structures (function + feeling)

| Structure | Function | Soul |
| --- | --- | --- |
| **The Hearth** | Account hub; survivors (the Beacon Children) gather here | The emotional core — a growing, living home. |
| **Domain Habitats** ×6 | Rebuild each element's biome; houses your bound Wraiths of that type; passive material trickle | Each restored domain = a piece of Vael healed. |
| **The Forge** | Craft/equip cosmetics, Ward-FX, dyes | Self-expression engine (+ cosmetic economy). |
| **The Knell-Shrine** | Daily Ward, world-event tracker, bad-luck-protection pity | The daily-login anchor. |
| **The Trial Hall** | Practice/metronome trainer, Trials access, replay theater | Where you *get better* — skill retention. |
| **The Archive** | Bestiary, Wraith Echoes (story memories), Aberrant Hall | Collection pride + lore + the flex room. |
| **The Aviary/Lure** | Hunting tools: read where rares may spawn, set lures, track Stutters | Powers the rarity chase (access, not power). |

### Why it locks people in
- **Visible, accumulating progress** (the most reliable retention force in games).
- **Tied to collection & story** — every loop feeds the Sanctuary, the Sanctuary feeds every loop.
- **Social:** visit friends' Sanctuaries, leave a Beacon (a small buff/gift), show off your Aberrant Hall.
- **Endless horizon:** always one more structure, tier, or domain to bring back. Soft cap rises with seasons.

> Sanctuary upgrades grant **economy/utility/access/expression only** — never timing leniency or ranked power.

---

## 2. Leveling (the moment-to-moment dopamine)

Three parallel level tracks so there's *always* a bar filling:

1. **Wraith Levels** — per Wraith, from battles. Raise Vigor/Aether/Power/etc. and unlock their Strikes.
   Caps at the **Ascension** threshold → evolve into the stronger eldritch form (new signature + dramatic
   visual). (Ascension = the big collector/cosmetic payoff.)
2. **Warden Renown** (account level) — everything you do grants Renown. Each level drips Sanctuary
   materials, cosmetic unlocks, skill-tree points, and **access** gates (new domains/modes/hunts).
3. **Affinity** (per element, "mastery") — battling/binding with an element builds its Affinity, feeding
   that element's **skill tree** (below) and unlocking element cosmetics + lore.

> In ranked, Wraith levels are normalized — leveling is for PvE power, hunting, and build variety.

---

## 3. Skill trees (build identity & horizontal depth)

Skill trees give players a **build to call their own** and a long-term goal — without touching timing
purity. Three layers:

### A) The Warding Tree (general, every Warden)
Universal nodes that shape *playstyle*, not power level. Examples:
- *Conservator:* Aether regen +x while all Wards down (economy → rewards clean flicking).
- *Riposte:* +Resolve on a Perfect after a Perfect (combo identity).
- *Banker:* larger Resolve cap, slower decay (tempo identity).
- *Swap Artist:* cheaper/faster swaps (team identity).
- *Hunter's Eye:* better rare-spawn intel, gentler Binding Rites for *commons* only (QoL/access).

### B) Element Affinity Trees ×6 (specialization)
Each element has its own small tree fed by Affinity. Examples (Ember):
- Cheaper Ward-of-Ember; bonus Resolve on Ember Perfects; Sear resistance; an Ember cosmetic capstone.
These let players **main an element** and feel mastery — great for identity and the meta, terrible for
nobody (no timing changes).

### C) Wraith "Pacts" (per-creature micro-trees)
A few branching choices per Wraith that tune *how its signature expresses* (e.g. Sunkenlord's Riptide:
drain more Aether **or** refund more to you). Build-craft per creature → theorycrafting culture → the
kind of depth that fuels guides, videos, and a long meta tail.

> **All trees grant economy/utility/expression/access — never timing windows or ranked-breaking stats.**
> Respecs are free or cheap (we want experimentation, not regret). Ranked applies the normalized budget.

---

## 4. The retention loop stack (what brings people back, by cadence)

| Cadence | Loop | Hook |
| --- | --- | --- |
| **Per-session** | Flick mastery, leveling bars, materials | "I'm getting better + numbers go up." |
| **Daily** | Daily Ward, Knell-Shrine, bounties, Stutter check | "Did a rare spawn today? Did I keep my streak?" |
| **Weekly** | World events (Eclipses/Storms), weekly Trials, ranked decay | "Limited rare window + ladder push." |
| **Seasonal** | Battle pass, new domain/Wraiths, story chapter, ranked split | "New chase, new content, fresh cosmetics." (SEASONS.md) |
| **Long-term** | Full Bestiary, Aberrant Hall, max Sanctuary, top ranked | "Prestige & identity — the years-long goals." |

Layered cadences = a reason to return in 5 minutes, today, this week, and this year. That stack is how
modern games keep a worldwide audience — applied here **without** any pay-to-win or skill corruption.

## 5. The one-line summary

**Collect, build, master — forever; win battles with skill alone — always.**
That combination (RPG depth that hooks + an esport-clean skill core) is rare, and it's our edge.
