# Leonida Platinum — GTA VI Trophy Guide & Tracker

![make.fun competition](https://make.fun/badge/gta6-trophy-guide-01.svg)
![make.fun rank](https://make.fun/badge/gta6-trophy-guide-01/valdodamanik12-blip/gta6-trophy-guide/rank.svg)
![make.fun reward](https://make.fun/badge/gta6-trophy-guide-01/valdodamanik12-blip/gta6-trophy-guide/reward.svg)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for the make.fun competition [gta6-trophy-guide-01](https://make.fun/c/gta6-trophy-guide-01).

## What it does

- **Checklist & tracker** — every one of the 55 official trophies with its verbatim PlayStation name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze). Progress is saved in the browser (localStorage) and can be exported to a file and imported back. Trophies with a PlayStation-tracked count (42 Shooting Range challenges, 250 stunts, 100 WAiNK locations, …) get a counter that mirrors the target.
- **Filters & search** — by kind (story, missable, collectibles, activities, online — the official list has no online trophies), by grade, by text, and an "only unearned" view.
- **Spoiler setting** — hides the names and descriptions of story trophies until they are earned.
- **Roadmap to the platinum** — six stages built from the official descriptions: story first, missables while the story is still open, stranger strands, the collectible sweep, the count/medal/money grinds, then 100% completion and the platinum.
- **Missables page** — 9 trophies flagged from their official descriptions (one-off events, a unique hunt, partner-dependent moments, choices), each with the reasoning on its card.
- **Cited guides** — every trophy carries an original guide written for this entry, with its sources named on the card (the official list as published by Exophase and PSNProfiles). Where a method is not yet known publicly — several descriptions are deliberate jokes — the guide says so plainly instead of inventing a walkthrough.

## Running it

The app is static files under `app/` with no build step. Serve it with any static server, or:

```
node serve.ts        # then open http://localhost:8080
```

It works fully offline: every file it loads lives under `app/`, and it makes no network request.

## Handing it in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored `buildDossier` (`vendor/makefun-frontend.ts`, unchanged). It resolves the repository root from `MAKEFUN_BOT_DIR` or its own file location — never from the working directory — and writes only inside the output directory, so it runs cleanly in the grader's read-only sandbox.

## Screenshots

`screenshots/` holds four real renders of this app (1280×800, headless Chromium, sample progress seeded via the app's own `?demo=1` preview): the checklist with a guide open, the roadmap, the missables page, and the silver filter with its counters. `shots.json` records which view each one shows.

## License

MIT — see `LICENSE`.
