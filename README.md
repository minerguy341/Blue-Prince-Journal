# Blue Prince Notes Organizer

A spiral-bound Mount Holly notebook you can leave open beside Blue Prince. It watches your save, files documents you have already read, and tracks objectives, secrets, rooms, and your own notes — without naming anything this save has not found.

Game fonts are not redistributed. The UI uses public stand-ins: Special Elite, Architects Daughter, Caveat, and Source Serif 4, with the estate cyan / navy / cream palette.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147). The first launch loads a bundled **Day 59 demo snapshot** so you can browse immediately.

### Point it at your live save

1. Open the **Settings** tab.
2. Uncheck the demo snapshot.
3. Set the folder to your Blue Prince storage directory, usually:

`C:\Users\<you>\AppData\LocalLow\Dogubomb\BLUE PRINCE\storage`

The watcher reads `MtHollyBlueprint.es3` (Easy Save 3) or a `.json` export dropped in that folder. It never writes back to the game.

Optional: set `BLUE_PRINCE_ES3_PASSWORD` if your install uses a different Easy Save password. Game Pass saves try `swansong` automatically.

Custom notes live in `.data/notes/` on your machine, keyed to the save, and are gitignored.

```bash
npm test
npm run build
```

## Spoiler rule

The catalog may know about flags. The page may not. Unread mail, unopened vaults, unfound rooms, and unsolved doors are omitted — not greyed out, not counted as “remaining.” Your own notes can say anything; those are yours.

## What it files

- **Index** — day stamp, allowance, open threads, facts this save already holds
- **Objectives** — threads you have already opened (sanctum work, trophies, discs, west path, foundation, boilers)
- **Documents** — mail, red envelopes, drafting volumes, terminal password, and other read items
- **Secrets** — discoveries whose flags are true
- **Rooms** — draft counts greater than zero
- **Notes** — handwritten pages, including the seeded chess / precipice list on the demo estate

This is a companion, not a walkthrough.
