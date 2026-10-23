# Vision

## Intent

Green Grid is a browser app for designing garden layouts. A user creates a garden, sets its dimensions in meters, and places items on a scrollable, grid-backed canvas. Five fixed layers stack from underground pipes to tree canopy. The user drags items from a built-in catalog; the app sorts them into the correct layer. The main output is a downloadable, print-ready garden plan in a hand-drawn map style.

## Principles

- Intuitive drag-and-drop interaction. No manuals, no modes, no menus deeper than one level.
- Every item knows its own layer. The user places things; the app sorts them.
- Offline-first, local-only data. Gardens, settings, and preferences live in localStorage. No server, no account.
- The downloaded output is the product. It must look like a hand-drawn garden map: readable, complete, and worth printing.
- Minimal UI, maximum canvas. The garden is the interface; controls stay out of the way.

## Not this

- No backend, no authentication, no cloud sync.
- No custom item creation; the catalog is built-in and curated.
- No real-time collaboration or sharing.
