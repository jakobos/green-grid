# Findings inbox

<!-- Findings not yet triaged: friction, bugs, ideas and candidate lessons, noted by the human or the coordinator with
     `guild note "…"`, and filed from a job's `finish` findings by `guild land` (or `guild note --job <job>`). One line
     each: `- date · kind · text · source`. A retro job (`guild spawn --role retro`) proposes what each becomes; once
     the human decides, the coordinator applies the decisions and removes the entries it covered. -->

## Inbox

- 2026-10-23 · bug · With an item selected, typing r or Backspace in the header garden-name field rotates/deletes the item: Canvas.tsx keydown handler has no event-target check (read 2026-10-23). C009 adds the guard. · C009
- 2026-10-23 · bug · Ctrl+Shift+Z never redoes: Canvas.tsx keydown checks e.key === 'z', but with Shift held the key is 'Z' (observed 2026-10-23 on C008 build: keyboard redo no-op; Redo button works).
- 2026-10-23 · friction · playwright-cli named sessions opened with the default browser get net::ERR_ACCESS_DENIED on localhost dev servers; --browser=chromium works. C009 worker fell back to C008 worker's -s=e03w session instead (job log lines 55-64).
- 2026-10-23 · friction · styleguide references `npm run lint` and `npm run typecheck` but these scripts do not exist in package.json; typecheck is embedded in `npm run build` as `tsc --noEmit`, and there is no ESLint config. Evidence: `npm run` output listing only `dev`, `build`, `preview`, `test`, `test:watch`. · job 2026-10-23-e03-search-e745e5 · C009
- 2026-10-23 · friction · playwright-cli default browser (system chrome) gets net::ERR_ACCESS_DENIED on localhost dev servers; open sessions with --browser=chromium · C007
- 2026-10-23 · friction · Host has 1 CPU and 4 GB RAM: with 3 omp sessions, workers, vite and chromium the load average hit 35 and npm run build took 1m45s; cap parallel workers at 1 per lane and close browsers after use
