# Leonida Platinum — GTA VI Trophy Guide & Tracker

[![GTA 6 Trophy Guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_medium=readme)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/valdodamanik12-blip/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_medium=readme)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/valdodamanik12-blip/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_medium=readme)

An offline, open-source guide and tracker for all **55 PlayStation 5 trophies** of
Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden) — built for
[make.fun](https://make.fun/bounty/gta6-trophy-guide-01?utm_medium=readme)'s
`gta6-trophy-guide-01` bounty.

## What it does

- **Checklist tracker** — every trophy with its official name, description and grade
  exactly as PlayStation publishes them, a checkbox saved in the browser
  (localStorage), with **export** to a file and **import** back, plus a reset.
- **Filters & search** — by kind (story, missable, collectibles, activities, side
  quests, robberies, combat, money & property, 100% completion), by grade, by
  earned / not yet earned, and free-text search.
- **Spoiler setting** — “Hide story spoilers” blanks out the names and descriptions
  of story trophies until you earn them.
- **Roadmap to the Platinum** — four stages built from the official descriptions,
  with per-stage progress (PowerPyx rates the set 4/10, about 200 hours, one
  playthrough, no online trophies).
- **Missables page** — flags the one trophy reported as possibly missable
  (Positive Mental Attitude: the Chapter 1 balcony meditation) and explains why
  nothing else can be missed.
- **A guide for every trophy, in this guide's own words, with cited sources** —
  what to do, where, and when it can be missed. Where no published method exists
  yet (five trophies as of 20 Nov 2026), the guide says so honestly instead of
  inventing a location or step.

## Sources

- Names, descriptions and grades: the official list as published by
  [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and
  [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi)
  (18 Nov 2026), the two agreeing on all 55.
- Counts (42 Shooting Range challenges, 14 drone race locations, 18 meditation
  spots, 100 WAiNK locations, 52 areas, 9 gangs, 8 garage properties, 500 choices):
  PSN's progress targets via PSNProfiles.
- Methods and roadmap: [PowerPyx's GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/)
  and GTABase, paraphrased in this guide's own words and cited beside each trophy.

## How to run it

No build step, no network — plain static files:

```sh
node serve.ts
# then open http://localhost:8080
```

Or serve `app/` with any static HTTP server. Your progress lives in the browser;
use **Export progress** to back it up.

## How to hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/dossier.json via vendor/makefun-frontend.ts
```

## Screenshots

- `1-checklist.jpg` — the checklist with 13 of 55 earned (demo progress), filters and progress bar
- `2-guide.jpg` — a trophy's full guide open: Positive Mental Attitude, the possibly missable one, with its sources
- `3-roadmap.jpg` — the four-stage roadmap to the Platinum
- `4-missables.jpg` — the missables page

## License

MIT. Grand Theft Auto and GTA are trademarks of Take-Two Interactive / Rockstar
Games. This is an independent fan-made tracker, not affiliated with or endorsed by
Rockstar Games, and it uses no Rockstar logo or official artwork.
