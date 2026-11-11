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
tools/photo-record.md where each home page photo comes from
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
`sunglasses`); `{{logo}}` is Peppi's logo (the app icon), colored by the stylesheet.
A page with `"credits": true` in its JSON comment gets the photo credits in its
footer; see `build.py`. The home page follows the canvas's look B section by section.

## Design

The editorial lookbook ("look B" from the Claude Design canvas): paper #F7F6F3 and
ink #111111, one red #C8361B for emphasis (coral #F08A6E on ink), Bodoni Moda for
headings and Inter Tight for text, square edges and thin rules. Light and dark
themes follow the visitor's device.

## Photos

The home page's 24 outfit photos (`src/assets/img/looks/s<set>-<look>.jpg`) are free
Unsplash photos (Unsplash License, not Unsplash+), downloaded by hand on
November 5, 2026 and cropped below the face; one house number is blurred. Each
photographer is credited in the home page's footer (`PHOTOGRAPHERS` in `build.py`);
`tools/photo-record.md` lists each photo's Unsplash page.
No brand logos, and never endorsement-style text next to a person.

The Alternative & Expressive section (`#expressive`) shows 28 photos made with AI
(`src/assets/img/ai/<style>-<set>.jpg`, four sets of seven, taking turns like the
outfit grid): from Peppi's own AI library (the app's alternative-style examples,
approved by the owner), full length since the people aren't real, with no text in
the background and no real event or venue. A note under the row says they're made
with AI; captions are in the page's `ai-data`.

## GitHub Pages

Settings → Pages → Deploy from a branch → `main`, folder `/docs`. The build writes
`docs/CNAME` (`peppi.style`) and `docs/.nojekyll`.

## Before launch

- The privacy policy and terms are in effect from November 4, 2026. Have them reviewed by a lawyer
  before launch, and update the "Last updated" date with every change.
- Add the prices on the plans page when they're set.
- Replace the "Coming soon" store buttons with real store links: `PLAY_URL` and
  `APP_STORE_URL` in `build.py` (and the stores' official badges).

## Fonts

Bodoni Moda and Inter Tight (latin subsets), both under the SIL Open Font License
1.1 (license files in `src/assets/fonts/`).
