#!/usr/bin/env python3
"""Builds the Peppi website from src/ into docs/ (what GitHub Pages serves).

    python3 build.py

Each page in src/pages/ starts with a JSON comment:
    <!--{"title": "...", "description": "...", "nav": "plans"}-->
and is wrapped in src/layout.html. Tokens such as {{garment:dress}} or
{{icon:heart}} are replaced with the inline SVGs below. Standard library only.
"""
import hashlib
import json
import re
import shutil
import subprocess
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "docs"
SITE = "https://peppi.style"
DOMAIN = "peppi.style"

# The six garments from the app's launch page, in their 60 x 60 boxes.
GARMENTS = {
    "tshirt": '<path pathLength="1" d="M22 8 9 14 4 27l9 3 1 24h32l1-24 9-3-5-13-13-6q-8 9-16 0Z"/>',
    "dress": '<path pathLength="1" d="M23 5l1 16-13 34q19 4 38 0L36 21l1-16"/><path pathLength="1" d="M23 5q7 8 14 0"/><path pathLength="1" d="M24 21q6 3 12 0"/>',
    "trousers": '<path pathLength="1" d="M15 6h30l4 49H35l-5-33-5 33H11Z"/><path pathLength="1" d="M15 12h30"/>',
    "heel": '<path pathLength="1" d="M3 49q1-8 12-8 12 0 21-11l9-6q8-2 8 7v6l-2 20h-3l-1-14q-16 4-31 10H7q-5 0-4-4Z"/><path pathLength="1" d="M16 50q15-6 31-10"/>',
    "handbag": '<path pathLength="1" d="M10 25h40l4 29H6Z"/><path pathLength="1" d="M20 25c0-17 20-17 20 0"/><path pathLength="1" d="M26 34h8"/>',
    "sunglasses": '<circle pathLength="1" cx="17" cy="33" r="11"/><circle pathLength="1" cx="43" cy="33" r="11"/><path pathLength="1" d="M28 31q2-4 4 0"/><path pathLength="1" d="M6 31 2 24"/><path pathLength="1" d="M54 31l4-7"/>',
}
GARMENT_NAMES = {"tshirt": "T-shirt", "dress": "Dress", "trousers": "Trousers", "heel": "Stiletto pump", "handbag": "Handbag", "sunglasses": "Sunglasses"}

# Line icons, 24 x 24, stroked with currentColor by the stylesheet.
ICONS = {
    "hanger": '<path d="M12 7.5V6.2a2.2 2.2 0 1 1 2.2-2.2"/><path d="M12 7.5 2.8 14.6c-.8.6-.4 1.9.6 1.9h17.2c1 0 1.4-1.3.6-1.9Z"/>',
    "camera": '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>',
    "person": '<circle cx="12" cy="5" r="2.5"/><path d="M12 8v7m0 0-3 6m3-6 3 6M7 11l5-3 5 3"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    "palette": '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.6-.9 1.3-1.8-.4-1.1.3-2.2 1.5-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    "heart": '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    "sparkle": '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7Z"/>',
    "refresh": '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/>',
    "photo": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    "lock": '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    "ruler": '<path d="M3 17 17 3l4 4L7 21Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    "face": '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 15a5 5 0 0 0 7 0"/>',
    "mirror": '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 6l-2 2M13 6l-5 5"/>',
    "hat": '<path d="M4 17h16"/><path d="M6 17c0-6 2.5-10 6-10s6 4 6 10"/><path d="M3 4 21 20"/>',
    "light": '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>',
    "turn": '<path d="M12 4a8 8 0 1 1-7.4 5"/><path d="M4 4v5h5"/>',
    "shield": '<path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
    "trash": '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "play": '<path d="M5 3.5v17l15-8.5Z"/>',
    "repeat": '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
}

# Store links. Placeholders until the listings are live: they keep the
# visitor on the page's app section. Replace them with the real listing
# URLs (and the stores' official badges) at launch.
PLAY_URL = "index.html#get"
APP_STORE_URL = "index.html#get"

# The logo (the app icon): six garments on a rounded tile, the dress as the
# accent. Its colors come from the stylesheet (.logo), so it can be inverted.
LOGO_CELLS = [
    ("line", '<path d="M22 8 9 14 4 27l9 3 1 24h32l1-24 9-3-5-13-13-6q-8 9-16 0Z"/>'),
    ("accent", '<path d="M23 5l1 16-13 34q19 4 38 0L36 21l1-16"/>'),
    ("line", '<path d="M15 6h30l4 49H35l-5-33-5 33H11Z"/>'),
    ("line", '<path d="M3 49q1-8 12-8 12 0 21-11l9-6q8-2 8 7v6l-2 20h-3l-1-14q-16 4-31 10H7q-5 0-4-4Z"/>'),
    ("line", '<path d="M10 25h40l4 29H6Z"/><path d="M20 25c0-17 20-17 20 0"/>'),
    ("line", '<circle cx="17" cy="33" r="11"/><circle cx="43" cy="33" r="11"/><path d="M28 31q2-4 4 0"/>'),
]
LOGO = ('<svg class="logo" viewBox="0 0 240 240" aria-hidden="true"><rect class="logo-tile" width="240" height="240" rx="52"/>'
        + "".join(f'<g class="logo-{kind}" transform="translate({10 + 74 * (i % 3)} {36 + 90 * (i // 3)}) scale(1.2)">{paths}</g>'
                  for i, (kind, paths) in enumerate(LOGO_CELLS))
        + "</svg>")

# The home page's outfit photos (free Unsplash photos, full length),
# credited in the footer of the pages that show them.
PHOTOGRAPHERS = [
    ("McFollis", "thisismcfollis"), ("Shaikh Musaddik", "shaikhmusaddik_9420862_sink"), ("K Studios", "kstudios"),
    ("ALIREZA Pandkhahi", "kroba313"), ("Filip Rankovic Grobgaard", "filipgrobgaard"), ("Ramy Mamdouh", "romba100"),
    ("Salar Arif", "salararif28"), ("Look Studio", "lookphoto"), ("Anton Polidovets", "wrecker2281337"),
    ("Reza Shahriari", "officialthereza"), ("Jon Tyson", "jontyson"), ("Hong bz", "hongbz"),
    ("David Suarez", "davidprspctive"), ("Dion Martins", "dionmartins"), ("Babak Eshaghian", "babak22ir"),
    ("Marcel Strauß", "martzzl"), ("Megan Ruth", "meganruthphoto"), ("Anton K Wibowo", "antonkwibowo"),
    ("lhon karwan", "lhonkarwanhamasalih"), ("Allef Vinicius", "seteph"), ("avat fathiazar", "avatno"),
    ("Frames For Your Heart", "framesforyourheart"), ("Oswald Elsaboath", "ozzzyphotos"), ("Good Faces", "goodfacesagency"),
    ("Alekon pictures", "alekonpictures"), ("Brian Lundquist", "bwl667"), ("Olga Zhuravleva", "zabegina"),
    ("Muhammad Numan", "numaninsari"), ("Atiyeh Fathi", "atiyehfathi"), ("M. Brauer", "mebradus"),
    ("Khaled Ghareeb", "khaledkagii"), ("Hunter Moranville", "onehunna"), ("Fred Kloet", "5dworkspace"),
    ("litoon dev", "litoondev"), ("AllGo - An App For Plus Size People", "canweallgo"), ("Vishal Kampani", "vishalkampani"),
    ("Konstantin Mishchenko", "meduzakos"), ("MOHAMMAD AL JANNAT RAKIN", "aljannatrakin"), ("Filipp Romanovski", "filipp_roman_photography"),
    ("nicola dowie", "nickynoodles13"), ("Abdulhameed Al-ameri", "hamedo_ka"), ("Sou Jest", "soujest"),
    ("Oscar Omondi", "xodusdigitals"), ("Michael Kyule", "madness_leahcim_"), ("Devin Santiago", "ydcphotography"),
    ("Christian Agbede", "chriscreations__"), ("Gufran Mansuri", "gufran2001"), ("Navid Sohrabi", "navidsohrabi"),
    ("Rodrigo Rodrigues | WOLF Λ R T", "wolfart32"), ("Daria Trofimova", "da161"), ("Clem Onojeghuo", "clemono"),
    ("IMANA", "imanaindia"), ("Nadeem Choudhary", "hyper_nawab"), ("Mohamad Khosravi", "mohamadkhosravi"),
    ("Jason Tran", "jasonntran"), ("Asal Mshk", "asalmashkoori"), ("Юрий Баринов", "studentapk"),
]


def last_changed(page):
    """When a page last really changed, for the sitemap: today if its source
    has uncommitted edits, else the date of the last commit touching it."""
    path = str(page.relative_to(ROOT))
    try:
        if subprocess.run(["git", "status", "--porcelain", "--", path], cwd=ROOT,
                          capture_output=True, text=True, check=True).stdout.strip():
            return date.today().isoformat()
        day = subprocess.run(["git", "log", "-1", "--format=%cs", "--", path], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout.strip()
        return day or date.today().isoformat()
    except (OSError, subprocess.CalledProcessError):
        return date.today().isoformat()


def credits_html():
    links = [f'<a href="https://unsplash.com/@{user}">{name}</a>' for name, user in PHOTOGRAPHERS]
    names = ", ".join(links[:-1]) + " and " + links[-1]
    return ('<details class="credits"><summary>Photo credits</summary>'
            f'<p>Outfit photos by {names} on <a href="https://unsplash.com">Unsplash</a>.</p>'
            '<p>The people shown in photos on this website and in the Peppi app are not affiliated with Peppi '
            'and do not endorse it. Their photos are used only to show examples of outfits.</p></details>')


NAV = [
    ("how", "index.html#how", "How it works"),
    ("dna", "style-dna.html", "Style DNA"),
    ("tryon", "try-on.html", "Try-on"),
    ("plans", "plans.html", "Plans"),
    ("faq", "faq.html", "FAQ"),
]


def garment(name, cls="garment"):
    return (f'<svg class="{cls}" viewBox="0 0 60 60" role="img" aria-label="{GARMENT_NAMES[name]}">'
            f'{GARMENTS[name]}</svg>')


def icon(name):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>'


def render(text):
    text = re.sub(r"\{\{garment:(\w+)\}\}", lambda m: garment(m.group(1)), text)
    text = re.sub(r"\{\{garment-draw:(\w+)\}\}", lambda m: garment(m.group(1), "garment draw"), text)
    text = re.sub(r"\{\{icon:(\w+)\}\}", lambda m: icon(m.group(1)), text)
    text = text.replace("{{logo}}", LOGO)
    text = text.replace("{{play_url}}", PLAY_URL).replace("{{appstore_url}}", APP_STORE_URL)
    text = text.replace("{{year}}", str(date.today().year))
    return text


def nav_html(active):
    links = []
    for key, href, label in NAV:
        current = ' aria-current="page"' if key == active else ""
        links.append(f'<a href="{href}"{current}>{label}</a>')
    links.append('<a class="nav-cta" href="index.html#get">Get the app</a>')
    return "\n          ".join(links)


def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC / "assets", OUT / "assets")
    # One stylesheet: the fonts first, so they start loading with it.
    css_dir = OUT / "assets" / "css"
    fonts = (SRC / "assets" / "fonts" / "fonts.css").read_text()
    (css_dir / "site.css").write_text(fonts + "\n" + (SRC / "assets" / "css" / "site.css").read_text())
    (OUT / "assets" / "fonts" / "fonts.css").unlink()

    # Version the stylesheet and script by their content, so a browser never
    # pairs a new page with an old cached copy (GitHub Pages caches 10 minutes).
    def version(rel):
        return hashlib.sha256((OUT / rel).read_bytes()).hexdigest()[:10]
    layout = (SRC / "layout.html").read_text()
    for rel in ("assets/css/site.css", "assets/js/site.js"):
        layout = layout.replace(f'"{rel}"', f'"{rel}?v={version(rel)}"')
    # The outfit and AI photos too, by one version over all of them: their
    # file names stay the same when a photo is replaced. The script builds
    # the other sets' addresses, so it reads the version off <body>.
    photos = hashlib.sha256()
    for path in sorted([*(OUT / "assets/img/looks").glob("*.jpg"), *(OUT / "assets/img/ai").glob("*.jpg")]):
        photos.update(path.name.encode() + path.read_bytes())
    photos_v = photos.hexdigest()[:10]
    layout = layout.replace("{{photos_v}}", photos_v)
    urls = []
    for page in sorted((SRC / "pages").glob("*.html")):
        raw = page.read_text()
        meta_match = re.match(r"\s*<!--(\{.*?\})-->\s*", raw, re.S)
        if not meta_match:
            raise SystemExit(f"{page.name}: missing the JSON comment at the top")
        meta = json.loads(meta_match.group(1))
        body = raw[meta_match.end():]
        slug = page.stem
        path = "" if slug == "index" else slug
        canonical = f"{SITE}/{path}"
        html = layout
        if slug == "404":
            # GitHub Pages serves this page at any missing address, so its
            # links must not depend on the folder it appears in.
            html = html.replace("<head>\n", '<head>\n  <base href="/">\n', 1)
        for key, value in {
            "title": meta["title"],
            "description": meta["description"],
            "canonical": canonical,
            "nav": nav_html(meta.get("nav", "")),
            "body_class": meta.get("body_class", ""),
            "robots": meta.get("robots", "index, follow"),
            "credits": credits_html() if meta.get("credits") else "",
            "content": body,
        }.items():
            html = html.replace("{{" + key + "}}", value)
        html = re.sub(r'(assets/img/(?:looks|ai)/[\w.-]+\.jpg)"', rf'\1?v={photos_v}"', html)
        (OUT / page.name).write_text(render(html))
        if meta.get("robots", "").startswith("noindex"):
            continue
        urls.append((canonical, last_changed(page)))

    (OUT / "CNAME").write_text(DOMAIN + "\n")
    (OUT / ".nojekyll").write_text("")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
    # The home page first, then the rest by name.
    urls.sort(key=lambda u: (u[0] != f"{SITE}/", u[0]))
    entries = "\n".join(f"  <url><loc>{u}</loc><lastmod>{day}</lastmod></url>" for u, day in urls)
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{entries}\n</urlset>\n")
    print(f"Built {len(urls)} indexed pages into {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    build()
