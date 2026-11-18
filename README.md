# notlike.us website

Coming-soon site for the notlike.us app (a friendship app that matches people who are different from each other).

- `src/pages/` – page bodies (first line is a `<!--meta {...} -->` comment with title and description)
- `src/partials/` – shared header and footer
- `src/legal.json` – Terms of Use and Privacy Policy, exported from the app's `src/data/legal.ts` so both always match
- `build.mjs` – assembles everything into `public/` (Cloudflare runs it on every push; `public/` is not committed)

Edit files in `src/`, run `node build.mjs` to check, then commit and push. Cloudflare redeploys automatically.
