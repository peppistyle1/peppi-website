"""The "what to wear" guides: one page per occasion of the home page's outfit
grid (its three looks, why each works, tips, what to avoid, questions) and
the Outfit ideas page that lists them. Text in src/guides.json; build.py
renders these like the pages in src/pages/.
"""
import html
import json
from pathlib import Path

LOOKS = ["Classic", "Bold", "Relaxed"]


def load(src):
    return json.loads((Path(src) / "guides.json").read_text())


def _e(text):
    return html.escape(text, quote=True)


def _credit(name, users):
    user = users.get(name)
    who = f'<a href="https://unsplash.com/@{user}">{_e(name)}</a>' if user else _e(name)
    return f'Photo: {who} on <a href="https://unsplash.com">Unsplash</a>'


def guide_page(g, users):
    """(meta, body, structured data) for one guide."""
    looks = "\n".join(f'''          <li>
            <figure class="look">
              <div class="look-photo"><img class="is-on" src="assets/img/looks/s{g["set"]}-{name.lower()}.jpg" alt="{_e(look["caption"])}" width="600" height="900"{' fetchpriority="high"' if i == 0 else ' loading="lazy"'}></div>
              <figcaption>
                <strong class="look-name">{name}</strong>
                <span class="look-caption">{_e(look["caption"])}</span>
                <span class="guide-why">{_e(look["why"])}</span>
                <span class="guide-credit">{_credit(look["credit"], users)}</span>
              </figcaption>
            </figure>
          </li>''' for i, (name, look) in enumerate(zip(LOOKS, g["looks"])))
    tips = "\n".join(f"            <li>{_e(t)}</li>" for t in g["tips"])
    avoid = "\n".join(f"            <li>{_e(t)}</li>" for t in g["avoid"])
    faq = "\n".join(f'''            <details>
              <summary>{_e(f["q"])}</summary>
              <div class="answer"><p>{_e(f["a"])}</p></div>
            </details>''' for f in g["faq"])
    body = f'''
    <section class="band page-hero">
      <div class="wrap">
        <nav class="crumbs small" aria-label="Breadcrumb"><a href="outfit-ideas.html">Outfit ideas</a> <span aria-hidden="true">/</span> {_e(g["occasion"])}</nav>
        <h1 style="margin-top:20px">{_e(g["h1"])}</h1>
        <p class="lede">{_e(g["intro"])}</p>
      </div>
    </section>

    <section class="band band--tight">
      <div class="wrap">
        <div class="section-head">
          <span class="eyebrow">Three outfits · {_e(g["context"])}</span>
          <h2>Classic, bold or relaxed.</h2>
        </div>
        <ul class="looks-grid guide-looks">
{looks}
        </ul>
      </div>
    </section>

    <section class="band band--tint band--tight">
      <div class="wrap guide-cols">
        <div>
          <h2 class="guide-h">Tips</h2>
          <ul class="guide-list">
{tips}
          </ul>
        </div>
        <div>
          <h2 class="guide-h">What to avoid</h2>
          <ul class="guide-list guide-list--avoid">
{avoid}
          </ul>
        </div>
      </div>
    </section>

    <section class="band band--tight">
      <div class="wrap">
        <h2 class="guide-h">Questions</h2>
        <div class="faq">
{faq}
        </div>
      </div>
    </section>

    <section class="band band--night band--tight">
      <div class="wrap guide-cta">
        <div>
          <h2>Your three outfits, for <span class="script">your</span> day.</h2>
          <p class="lede">Tell Peppi where you're going, when, and how dressed up you want to be. It checks the weather there and gives you three complete outfits, each with a real photo.</p>
        </div>
        <div class="btns"><a class="btn" href="index.html#get">Get the app</a><a class="btn btn--ghost" href="outfit-ideas.html">More outfit ideas</a></div>
      </div>
    </section>
'''
    meta = {"title": g["title"], "description": g["description"], "nav": "ideas"}
    data = [
        {"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in g["faq"]]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Outfit ideas", "item": "https://peppi.style/outfit-ideas"},
            {"@type": "ListItem", "position": 2, "name": g["occasion"], "item": f"https://peppi.style/{g['slug']}"}]},
    ]
    return meta, body, data


def hub_page(guides):
    """(meta, body, structured data) for the Outfit ideas page."""
    cards = "\n".join(f'''          <li>
            <a class="idea" href="{g["slug"]}.html">
              <span class="idea-photo"><img src="assets/img/looks/s{g["set"]}-classic.jpg" alt="{_e(g["looks"][0]["caption"])}" width="600" height="900" loading="lazy"></span>
              <strong>{_e(g["h1"])}</strong>
              <span class="small muted">{_e(g["context"])}</span>
            </a>
          </li>''' for g in guides)
    body = f'''
    <section class="band page-hero">
      <div class="wrap">
        <span class="eyebrow">Outfit ideas</span>
        <h1 style="margin-top:20px">What to wear, for <span class="script">every</span> occasion.</h1>
        <p class="lede">{len(guides)} occasions, three complete outfits each: a classic choice, a bold one and a relaxed one, with real photos, tips for the dress code and the weather, and what to avoid.</p>
      </div>
    </section>

    <section class="band band--tight">
      <div class="wrap">
        <ul class="ideas">
{cards}
        </ul>
      </div>
    </section>
'''
    meta = {"title": "Outfit ideas for every occasion: what to wear · Peppi",
            "description": "What to wear to a wedding, a job interview, a date, a concert and more: three complete outfits for each occasion, with real photos and tips.",
            "nav": "ideas"}
    data = [{"@type": "CollectionPage", "name": "Outfit ideas for every occasion", "url": "https://peppi.style/outfit-ideas",
             "hasPart": [{"@type": "WebPage", "name": g["h1"], "url": f"https://peppi.style/{g['slug']}"} for g in guides]}]
    return meta, body, data
