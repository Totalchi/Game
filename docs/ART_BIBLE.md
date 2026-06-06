# WARDBOUND — Art Bible & Generation Prompts

> Locks the visual identity, and provides **copy-paste-ready prompts** for every key asset so we can
> render the full concept set in one pass the moment we have image-gen credits (free plan currently
> blocks generation — see note at bottom). Style derived from WORLD.md §5.

## 0. Visual format: classic 2D top-down pixel-art (LOCKED) 🎮

**WARDBOUND is a 2D top-down pixel-art game** in the lineage of the classic handheld monster-RPGs
(GBA-era Pokémon, and modern originals like Coromon / Nexomon / Monster Sanctuary) — *but* dressed in
our dark-elemental world of the Long Dusk. This is the locked art direction (player reference, June 2026).

- **Overworld (exploration layer):** top-down, **tile-based** pixel maps you walk around in 4
  directions — the six domains are explorable regions/routes, your **Sanctuary** is a town you visibly
  rebuild, NPCs and **wild Wraiths** roam. This is the Pokémon-style collect/explore wrapper.
- **Battle layer:** entering a fight transitions to the **flick-battle** screen (our unique mechanic),
  also rendered in pixel art with the HUD from UI_HUD.md overlaid (telegraph lane, Knell, Wards).
- **Why it fits us perfectly:** pixel art is cheap to produce, infinitely scalable in scope, nostalgic
  and beloved, *highly* streamable, and the dusk palette makes element colours pop as pure signal.

### Pixel-art technical spec
- **Internal resolution:** render at a small virtual canvas (target **~480×270**, i.e. 16:9 "GBA-plus"),
  then integer-scale up with **nearest-neighbour** (no blur) to the window. Mobile-friendly.
- **Tile size:** **16×16 px** tiles (overworld), with a 32×32 option for hero props/buildings.
- **Character sprites:** ~**16×24 px**, 4-directional walk cycles (3–4 frames each).
- **Wraith battle sprites:** ~**48×48 to 64×64 px**, with idle + a Strike/flinch frame; Ascended forms
  are larger/more detailed variants.
- **Palette discipline:** a tight, cohesive dusk palette (amber-grays) + the seven element accent hues.
  Limited colours per sprite (retro feel + readability). Keep the §1 element hue/shape language.
- **Animation:** simple, readable, looped; the Knell heartbeat can subtly pulse battle elements on-beat.

### IP-safety reminder
We adopt the **2D top-down pixel-RPG style and genre conventions** (legally fine — many originals do),
and build **100% original** tiles, sprites, palettes, creatures, names, and code. No Nintendo/GameFreak
assets, sprites, tilesets, fonts, sounds, or UI — ever.

## 1. Visual identity (the rules)

- **Mood:** dark elemental fantasy — *mythic, melancholy, beautiful-but-dying.* The Long Dusk. Not
  grimdark-gore, not kiddie-cute. Think "a gorgeous funeral for the world."
- **Base palette:** desaturated **amber-gray twilight** everywhere, so pure **element colors pop as
  pure gameplay signal.**
- **Element hue + shape language (colorblind-safe, must be consistent everywhere):**
  - **Ember** — jagged orange/red, cracked-magma shapes
  - **Tide** — flowing cyan/teal, droplet/wave shapes
  - **Storm** — forked violet/white, lightning/angular shapes
  - **Stone** — blocky amber-brown, slab/cairn shapes
  - **Bloom** — spreading sickly green, fungal/vine shapes
  - **Frost** — crystalline white-blue, shard shapes
  - **Hollow** — absence/black with a thin rim-light, void shapes
- **Wraiths:** "a beautiful ghost made of a dying element." **Silhouette-first** (must read at small
  size and in spectator HUD). Eldritch edge, never cartoon-cute.
- **Rendering target (two tracks):**
  1. **Painterly concept art** — for ideation / key art / marketing (the §2A suffix below).
  2. **Pixel-art production assets** — the *actual in-game* look: sprites, tilesets, battle Wraiths
     (the §2B suffix below). This is what ships.

## 2A. Painterly concept-art suffix (ideation / key art / marketing)

```
STYLE: dark elemental fantasy game concept art, mythic and melancholy mood, painterly,
strong readable silhouette, desaturated amber-gray twilight environment so the element's color
pops, dramatic rim-lighting from the creature's own elemental glow, centered character study,
high detail, no text, no watermark, no UI.
```

## 2B. Pixel-art production suffix (the in-game look — use for sprites/tiles)

```
STYLE: 2D top-down monster-RPG pixel art, GBA/16-bit era inspired (think Coromon / Nexomon, NOT any
Nintendo asset), clean readable sprite, limited cohesive palette, dark dusk amber-gray tones with one
glowing element-colour accent, crisp pixels, nearest-neighbour, transparent background, single sprite,
no text, no watermark, no UI, no anti-aliasing.
```
For **overworld tilesets** add: `top-down 16x16 tileset, seamless tiles, orthogonal, game-ready`.
For **battle sprites** add: `front-facing battle sprite, ~64x64, idle pose, slight elemental glow`.

## 3. Creature prompts (the launch anchors)

> Each line has 3 Ascension stages. Generate stage art consistently (same creature, evolving).
> **`[+STYLE]` = append §2B (pixel-art) for in-game sprites, or §2A (painterly) for concept/marketing.**
> Production sprites use **§2B**.

### Ember starter — Ashling → Cindreaver → Pyrelich
- **Ashling (stage 1):** `A small cursed ember-fox spirit kit, body of dim glowing coals and soft ash, tiny flickering flame-tail, hollow warm-orange eyes, fragile and sad. [+STYLE]`
- **Cindreaver (stage 2):** `A lithe four-legged fox made of cracked obsidian and living ember, molten cracks glowing along its body, a mane of dim orange flame, hollow ember eyes, ash and smoke trailing from its tail, agile and fierce. [+STYLE]`
- **Pyrelich (stage 3):** `An imposing lich-fox wreathed in everburning fire, charred-bone crown, ribcage of glowing coals, eldritch black-and-orange flame, regal and deathly. [+STYLE]`

### Tide starter — Drippet → Mournmaw → Sunkenlord
- **Drippet:** `A small weeping lantern-jelly spirit, translucent cyan body holding a dim drowned light, trailing teardrop tendrils, mournful. [+STYLE]`
- **Mournmaw:** `A drowned spectral hound made of dark water and pale bone, glowing cyan eyes, kelp and barnacles, water streaming endlessly off its body. [+STYLE]`
- **Sunkenlord:** `A colossal leviathan-ghost of black water and drowned-temple architecture, lantern-light in its hollow chest, immense and sorrowful, cyan glow. [+STYLE]`

### Storm starter — Sprite → Galewisp → Tempestrix
- **Sprite:** `A tiny flickering wind-mote spirit, crackling violet static, near-formless and quick. [+STYLE]`
- **Galewisp:** `A shrieking wind-wisp creature of swirling violet air and forked light, half-seen, fast and erratic. [+STYLE]`
- **Tempestrix:** `A thunder-crowned storm-roc, vast wings of forked violet lightning and dark cloud, a crown of arcing electricity, regal and terrifying, the face of the game. [+STYLE]`

### Notable Wraiths
- **Gravemount (Stone):** `A mountain-sized walking cairn golem of stacked grave-stones and ancient barrow-rock, moss in its seams, slow and eternal, amber-brown. [+STYLE]`
- **Mossgrave Hierophant (Bloom):** `A priestly fungal wraith of decay and bioluminescent green spores, robed in rot and vines, beautiful and sickly. [+STYLE]`
- **Glaciax (Frost):** `A glacier-spirit of black ice with a thousand frozen screams visible inside it, crystalline white-blue shards, silent and cold. [+STYLE]`

### Hollow legendary — Voidmoth Mourne ★
- `A vast moth of pure absence, wings of starless black that seem to eat the surrounding dusk, thin rim-light outlining its form, faint hollow eyes, eldritch and wrong and beautiful, the ultimate rare creature. [+STYLE]`

### Aberrant (shiny) variant note
- For an Aberrant of any Wraith, append: `Aberrant Hollow-corrupted variant: recolored with void-black
  and an eerie secondary glow, subtle wrongness, rare prestige aura.`

## 4. Environment / domain prompts (regions = art bibles)

- **The Cinderwaste (Ember):** `Ash desert under a smoke-red dusk, glass-fused dunes, guttering ember-light, the skeletal ruins of a burned city, desolate and mythic. [+STYLE, environment]`
- **The Drowned Reach (Tide):** `Endless tidal flats and half-sunken halls under black water, dim lantern-light, drowned bells, weeping fog, sorrowful beauty. [+STYLE, environment]`
- **The Howling Span (Storm):** `Shattered floating stone bridges in a violet storm-sky, perpetual lightning, vertigo and verticality, ruins suspended in cloud. [+STYLE, environment]`
- **The Cairnlands (Stone):** `Grave-moors of standing stones and barrows under heavy gray dusk, oppressive stillness, ancient and quiet. [+STYLE, environment]`
- **The Rotwood (Bloom):** `A vast fungal forest of bioluminescent decay feeding on the dead, sickly-beautiful green glow, overgrowth swallowing ruins. [+STYLE, environment]`
- **The Rime (Frost):** `A frozen waste of black ice and white-blue gloom, things frozen mid-scream, silent and deathly. [+STYLE, environment]`
- **The Hollow (Void) ★:** `A non-Euclidean wound at the center of the world, dim and wrong, geometry that shouldn't exist, the source of the Sundering, dread and awe. [+STYLE, environment]`

> For in-game environments use **§2B** + the tileset add-on, e.g. a Cinderwaste tileset:
> `top-down 16x16 pixel tileset for an ash-desert region: cracked glass-fused ground, ember rocks,
> burned ruins, dim path tiles, seamless, orthogonal, dark dusk palette with ember-orange accents. [§2B]`

## 4B. Overworld assets (the top-down exploration layer)

- **Player overworld sprite:** `top-down 16x24 pixel character: a hooded young Warden in a tattered
  dusk-grey cloak with a faint glowing element-sigil, 4-direction walk cycle (down/up/left/right), 3
  frames each, retro monster-RPG style. [§2B]`
- **Sanctuary town (rebuildable):** `top-down pixel-art ruined-then-restored Warden refuge town:
  broken stone hall, a relit hearth, small huts, lantern light returning, regrowing dusk garden;
  provide a 'ruined' and a 'restored' tile variant set. [§2B]`
- **Wild Wraith overworld blips:** `tiny top-down 16x16 pixel overworld versions of each Wraith,
  faintly glowing in their element colour, readable silhouette. [§2B]`
- **Domain route tiles:** one seamless 16×16 tileset per domain (Cinderwaste / Drowned Reach / Howling
  Span / Cairnlands / Rotwood / Rime / Hollow) using §2B + the tileset add-on above.

## 5. Key-art / branding prompts

- **The Warden (player):** `A hooded Warden figure in a tattered cloak holding up a glowing six-spoked Ward-sigil that casts elemental light, standing against the Long Dusk, lonely and resolute, mythic. [+STYLE]`
- **Hero key art:** `A lone Warden facing a vast Tempestrix storm-roc on a shattered sky-bridge, raising a glowing elemental Ward against a barrage of lightning, the dying amber world behind, epic and melancholy, splash-art composition. [+STYLE]`
- **Logo direction:** the word **WARDBOUND** in a weathered, mythic serif; the "O" replaced by a
  six-spoked Ward-sigil that subtly suggests a heartbeat pulse. Amber-gray with a single element-color
  accent. (Vector/typography task, not a generation prompt.)

## 6. Recommended generation setup (when credits exist)

- **Pixel-art sprites/tiles (the shipping assets):** any strong model with the **§2B** suffix, generated
  large then **downscaled + cleaned** to true pixel resolution (16×16 tiles, 48–64px battle sprites).
  Expect hand-cleanup; AI rarely outputs perfect pixel grids — treat generations as a base to pixel over.
- **Top quality / key art / 4K / any text:** `nano_banana_pro` (~2 credits/img, supports 4K + diagrams).
- **Concept-art creature studies (§2A):** `soul_2` (with a reference image for line consistency) or
  `soul_cast` (cheaper) — *requires Basic plan or higher.*
- **For evolution-line consistency:** generate the stage-2 form first, then feed it as a **reference
  image** (`medias` role) for stages 1 and 3 so the creature stays the same being.
- **Aspect ratios:** `1:1` for sprites/creatures; `16:9` for environments/overworld; `2:3`/`9:16` for
  key art / mobile splash.
- **Alternative pixel pipelines:** dedicated pixel-art tools/models or hand-pixeling in Aseprite —
  for a pixel game, a skilled pixel artist (or Aseprite + these prompts as reference) will beat raw AI.

## 7. ⚠️ Current blocker

Image generation is **unavailable on the free plan** (balance 0.5 credits; cheapest model needs Basic+).
To render this set we need either (a) an upgraded plan / credits on the connected image service, or
(b) to generate elsewhere (Midjourney, etc.) and drop assets into `/src/assets`. These prompts are
written to be portable to any modern image model.
