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
src/root/           files served as they are from the site's root (BingSiteAuth.xml)
src/guides.json     the what-to-wear guides' text (one per outfit-grid occasion)
guides.py           renders the guides and the Outfit ideas page that lists them
docs/               the built site that GitHub Pages serves (do not edit by hand)
tools/og-image.html the source of the social-share picture
tools/photo-record.md where each home page photo comes from
tools/serve.py      the local preview server
```

## Editing

1. Change a page in `src/pages/` (or the frame in `src/layout.html`, or
   `src/assets/`).
2. Run `python3 build.py` (Python 3, standard library only).
3. Preview: `python3 tools/serve.py`, then open http://127.0.0.1:8765 (it serves
   `/faq` from `faq.html`, as GitHub Pages does; links use those short addresses).
4. Commit both `src/` and `docs/`.

In pages, `{{icon:name}}` inserts a line icon and `{{garment:name}}` one of the six
garment drawings from the app (`tshirt`, `dress`, `trousers`, `heel`, `handbag`,
`sunglasses`); `{{logo}}` is Peppi's logo (the app icon), colored by the stylesheet.
A page with `"credits": true` in its JSON comment gets the photo credits in its
footer; see `build.py`. The home page follows the canvas's look B section by section.

## Search engines

Each page has a title (up to 60 characters) and a description (up to 155) worded
the way people search, and JSON-LD structured data (`structured_data` in
`build.py`): Peppi and the site on every page, the app on the home page, the
questions on the FAQ page and the guides. The **Outfit ideas** page
(`/outfit-ideas`) lists 20 guides, each at the address of its search
(`/what-to-wear-to-a-job-interview`): the occasion's three looks from the home
grid with why each works, tips, what to avoid and questions. Their text is in
`src/guides.json` (drafted with Peppi's model, then reviewed); a new occasion in
the grid needs a guide there too. The home grid links to the guide of the
occasion it shows. No meta keywords tag: search engines ignore it.

## Design

The editorial lookbook ("look B" from the Claude Design canvas): paper #F7F6F3 and
ink #111111, one red #C8361B for emphasis (coral #F08A6E on ink), Bodoni Moda for
headings and Inter Tight for text, square edges and thin rules. Light and dark
themes follow the visitor's device.

## Photos

The home page's 60 outfit photos (`src/assets/img/looks/s<set>-<look>.jpg`: 20
occasions of three looks, taking turns with previous / next and a "3 / 20" count)
are free Unsplash photos (Unsplash License, not Unsplash+), full length (head to
toe) at 600 x 900; one house number is blurred. Each photographer is credited in
the home page's footer (`PHOTOGRAPHERS` in `build.py`); `tools/photo-record.md`
lists each photo's Unsplash page and how it was framed.
No brand logos, and never endorsement-style text next to a person.

The Alternative & Expressive section (`#expressive`) draws on 56 photos made with AI
(`src/assets/img/ai/<style>-<set>.jpg`, eight sets of seven, 56 different people)
from Peppi's own AI library (the app's alternative-style examples, approved by the
owner), full length since the people aren't real, with no text in the background and
no real event or venue. They're shown as "Can't choose? Let Peppi pick." (`#pick`,
`initPick` in `site.js`): a slot-machine strip of the seven styles, each with one of
its photos picked per visit, its occasion and that photo's description (captions are
in the page's `ai-data`), which spins, lands on one and gives its one-liner. The
movement is Motion 11.11.13 (motion.dev, MIT), self-hosted in `src/assets/js/motion.js`
and loaded on the home page only, so the site still makes no outside calls. A note
under it says the photos are made with AI.

The home page opens with a short film (`#film`, `initFilm` in `site.js`, Motion): one of
three stories (a couple before a wedding, a man before a dinner date, a woman before a
wedding), each four photos made with AI in `src/assets/img/film/<couple|man|her>/`
(900 and 1600 px), kept in Peppi's AI library as "held". Each visit shows a different film
from the last one (`localStorage` "peppi-film"); the note under it says the people aren't
real. Without a script it shows the couple's last photo with the headline.

Other animations are drawn in code (SVG with CSS, or a canvas): the hangers' rail on
the home page, the Style DNA helix beside the sample card (`initHelix`) and the plans
page's swing tags (`initTags`). Each starts when it's seen and rests finished with
reduced motion or without a script.

## GitHub Pages

Settings → Pages → Deploy from a branch → `main`, folder `/docs`. The build writes
`docs/CNAME` (`peppi.style`) and `docs/.nojekyll`.

The build also writes `docs/robots.txt` and `docs/sitemap.xml`: every page except
those marked `noindex` (the 404 page), the home page first, each with the date its
source page was last committed (today if it has uncommitted edits). Submit
https://peppi.style/sitemap.xml once in Google Search Console and Bing Webmaster Tools;
they re-read it by themselves after that.

## Before launch

- The privacy policy and terms are in effect from November 4, 2026. Have them reviewed by a lawyer
  before launch, and update the "Last updated" date with every change.
- Add the prices on the plans page when they're set.
- Replace the "Coming soon" store buttons with real store links: `PLAY_URL` and
  `APP_STORE_URL` in `build.py` (and the stores' official badges).

## Fonts

Bodoni Moda and Inter Tight (latin subsets), both under the SIL Open Font License
1.1 (license files in `src/assets/fonts/`).
