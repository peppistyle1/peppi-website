# Peppi website

The public website for the Peppi app, served at **https://peppi.style** by GitHub Pages.
It holds the home page, Style DNA, virtual try-on, plans, about, FAQ, support, the
privacy policy, the terms of service and the account-deletion page that Google Play
asks for.

Plain HTML, CSS and a little JavaScript: no framework, no cookies, no analytics,
and fonts served from the site itself.

## Layout

```
build.py            builds src/ into docs/
src/layout.html     the shared page frame: head, header, footer
src/pages/*.html    one file per page; the first line is a JSON comment with
                    the title, description and active menu item
src/assets/         stylesheet, script, fonts (with their licenses) and images
docs/               the built site that GitHub Pages serves (do not edit by hand)
tools/og-image.html the source of the social-share picture
```

## Editing

1. Change a page in `src/pages/` (or the frame in `src/layout.html`, or
   `src/assets/`).
2. Run `python3 build.py` (Python 3, standard library only).
3. Preview: `cd docs && python3 -m http.server 8765`, then open
   http://127.0.0.1:8765.
4. Commit both `src/` and `docs/`.

In pages, `{{icon:name}}` inserts a line icon and `{{garment:name}}` one of the six
garment drawings from the app (`tshirt`, `dress`, `trousers`, `heel`, `handbag`,
`sunglasses`); see `build.py`.

## GitHub Pages

Settings → Pages → Deploy from a branch → `main`, folder `/docs`. The build writes
`docs/CNAME` (`peppi.style`) and `docs/.nojekyll`.

## Before launch

- The privacy policy and terms are drafts. Fill in the highlighted items (legal
  name, address, effective date, governing law, log retention)
  and have them reviewed by a lawyer, then remove the "Draft" notes.
- Add the prices on the plans page when they're set.
- Replace the "Coming soon" store badges with real store links.

## Fonts

Syne, Figtree, DM Mono and Great Vibes, all under the SIL Open Font License 1.1
(license files in `src/assets/fonts/`).
