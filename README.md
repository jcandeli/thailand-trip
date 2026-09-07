# Thailand trip planner

A small single-page planner: add activities with a location, see them on a map,
group the ones that are close together, and drag each group onto a day of the
trip. Data lives in `public/trip.json`; the published site is read-only.

Live site: https://jcandeli.github.io/thailand-trip/

## Editing the plan (you)

```sh
npm install        # first time only
npm run dev        # opens http://localhost:5173/thailand-trip/
```

In dev mode every change is written straight to `public/trip.json` (the header
shows "Saved to trip.json"). When you're happy:

```sh
git add public/trip.json
git commit -m "Update plan"
git push
```

GitHub Actions rebuilds and redeploys the site in about a minute.

### How to use it

- **Add activity**: click "+ Add activity", give it a name, optional
  description and image URL, then either search for the place or click on the
  map to drop a pin.
- **Group activities**: tick the checkboxes next to activities that are close to
  each other, type a group name, click "Group selected". You can also move a
  single activity between groups with the dropdown under it.
- **Rename / recolor / delete a group**: use the pencil, the colored dot, and
  the X in the group header in the left panel.
- **Schedule a group**: drag its card from "Unscheduled groups" onto a day.
  Dropping onto an occupied day swaps the two groups. The X on a scheduled card
  sends it back to the tray.
- **Change dates**: the Start and Days fields above the calendar. Assignments
  are kept by day number.
- **Summary** in the header tells you how many groups still need a day and
  whether they fit in the days left.
- **Export / Import**: download or replace the whole `trip.json` by hand if
  ever needed.

## Viewing (dad)

Just open the live URL. Click a pin or an activity name to see details.

## Tech

React + Vite + TypeScript, Leaflet / OpenStreetMap tiles, Nominatim geocoding,
dnd-kit for drag and drop. No backend, no accounts, no API keys. Deployed to
GitHub Pages via `.github/workflows/deploy.yml`.
