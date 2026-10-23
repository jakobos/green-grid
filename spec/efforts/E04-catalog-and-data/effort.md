---
id: E04
status: proposed
opened: 2026-10-23
---

# E04-catalog-and-data · Fuller catalog and JSON backup and restore

## Problem

The catalog has 15 items, three per layer, and some sit oddly. Layer 1 "Underground" holds two bulbs and a carrot but none of the "underground pipes" the vision names. Basil is a "Ground Item" beside a raised bed. There are no paths, patios, fences, hedges, sheds, ponds or irrigation, so most real gardens can't be drawn. Separately, every garden lives only in localStorage: clearing site data, switching browsers or reinstalling loses all work, and there's no way to move a garden to another machine.

## Goal

The catalog covers the common parts of a home garden: hardscape, structures, water and irrigation, utilities, vegetables, herbs, flowers, shrubs, hedges and trees. Every item sits in the layer a gardener would expect, and the sidebar lists items in a predictable order. A user can download all gardens as one JSON file and restore or merge it later, in this or another browser, without losing anything.

## Non-goals

- User-defined catalog items (vision).
- Cloud sync, sharing links, or any server (vision).
- Plant-care data such as watering schedules, sun requirements or companion planting.
- Importing from other garden tools' formats.

## Constraints

- `catalogId` values are permanent: existing ids are never removed or renamed, because placed items reference them. Names, descriptions, layers and defaults may change.
- A backup file carries the persist schema version. Importing an older version runs the same migration as localStorage.
- Import never silently overwrites: imported gardens are added with fresh ids, and a malformed file changes nothing and tells the user why.
- Line catalog entries (paths, pipes, cables, fences, hedges) depend on E03 line items landing first.

## Approach

- Catalog: keep `src/data/catalog.ts` as the single source, perhaps split into one file per layer once it grows. Add a `category` for sidebar subgrouping, separate from the export `symbol` that E02 adds. Fix layer assignments in the same pass. Every new item also needs a `symbol`.
- Sidebar order: by layer, then category, then name.
- Backup: header actions "Download backup" and "Restore backup". Export serialises `gardens` with `version` and `exportedAt`. Import parses the file, validates its shape, migrates it, assigns fresh ids, appends the gardens and switches to the first imported one.

## Decisions

<!-- Append-only: date · decision · why. Workers read this so they do not relitigate. -->
- 2026-10-23 · Import appends with fresh ids, never replaces · a restore can't destroy current work
- 2026-10-23 · catalogIds are append-only · placed items and backups reference them
- 2026-10-23 · "Sorting" means correct layers, categories and a fixed sidebar order (layer, category, name), not a user sort control · user decision
- 2026-10-23 · E04 runs after E02 and E03, backup included · user decision

## Roadmap

<!-- guild:roadmap — slice text is yours; marks and change ids are generated -->
1. [ ] Backup: download all gardens as JSON and restore them by import
2. [ ] Catalog restructure: correct layer assignments, categories, sidebar ordering
3. [ ] Catalog expansion: area items for hardscape, structures, water, vegetables, flowers, shrubs, trees
4. [ ] Catalog expansion: line items for paths, pipes, cables, fences, hedges

## Risks and open questions

- Backup stays the only guard against data loss until E04 slice 1 lands.
- A JSON schema validator would be a new dependency; a hand-written type guard is likely enough for one file shape.
