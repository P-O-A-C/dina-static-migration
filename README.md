# POAC — Unified Repository

This repository contains Dina’s Corner, Grand Dry Clean, and POAC administration files.

## Main entry points
- Dina’s Corner customer welcome page: `welcome.html`
- Dina’s Corner menu and WhatsApp ordering: `menu.html`
- POAC unified login: `index.html`
- Grand Dry Clean customer home: `GrandDryClean/index.html`
- POAC Admin: `POAC-Admin/index.html`

## Dina’s Corner static status
The public customer pages in the repository root are detached from Supabase in this snapshot. They load catalogue, branch, and featured-image data from local `data/*.json` files and local files in `images/`. Menu orders are handed off to WhatsApp.

This does **not** mean every POAC component is detached. Older management pages under `Dina'sCorner/`, the POAC login, and Grand Dry Clean still contain Supabase-dependent code. Do not remove shared configuration until those applications are migrated separately.

See `GITHUB-MIGRATION-REVIEW-AR.md` for the detailed audit and `data/README-AR.md` for the static data inventory.

## Important hosting limitation
GitHub Pages is static hosting. It can serve JSON and images for reading, but it cannot securely save browser edits to repository files, provide a database, or implement protected admin writes by itself. Keep access tokens and secrets out of browser JavaScript.
