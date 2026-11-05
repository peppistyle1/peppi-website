/* Peppi website: menu, reveal on scroll, and each page's interactive parts.
   No trackers, no cookies, no network calls. */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header ---------- */
  function initHeader() {
    const header = $(".site-header");
    const button = $(".menu-btn");
    const nav = $("#site-nav");
    if (!header) return;
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!button || !nav) return;
    const setOpen = (open) => {
      button.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };
    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  /* ---------- Reveal: content is visible at rest, it only lifts in ---------- */
  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add("is-in");
      else io.observe(el);
    });
  }

  /* ---------- Segmented buttons ---------- */
  function segmented(group, onChange) {
    if (!group) return () => null;
    const buttons = $$("button", group);
    const value = () => (buttons.find((b) => b.getAttribute("aria-pressed") === "true") || buttons[0]).dataset.value;
    buttons.forEach((b) => b.addEventListener("click", () => {
      buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      onChange(b.dataset.value);
    }));
    return value;
  }

  /* ---------- Home: three looks, rotating through 8 occasions ---------- */
  // The first occasion's photos are in the page; the other seven load once
  // the page has, then cross-fade every 6 seconds. A dot picks an occasion
  // (and stops the rotation); with reduced motion nothing turns by itself.
  function initLooks() {
    const grid = $("#looks");
    const dataEl = $("#looks-data");
    const controls = $("#looks-controls");
    if (!grid || !dataEl || !controls) return;
    const sets = JSON.parse(dataEl.textContent);
    const looks = $$("img[data-look]", grid);
    const captions = $$(".look-caption", grid);
    const context = $("#looks-context");
    const phone = { img: $("#phone-img"), context: $("#phone-context"), caption: $("#phone-caption"), credit: $("#phone-credit") };
    const src = (n, look) => `assets/img/looks/s${n + 1}-${look}.jpg`;
    let current = 0;
    let playing = !reduceMotion;
    let timer = null;

    // One stacked image per occasion in each of the three frames.
    const frames = looks.map((first) => {
      const stack = [first];
      for (let n = 1; n < sets.length; n++) {
        const img = document.createElement("img");
        img.alt = sets[n].captions[looks.indexOf(first)];
        img.width = 599; img.height = 900;
        img.decoding = "async";
        img.dataset.src = src(n, first.dataset.look);
        img.setAttribute("aria-hidden", "true");
        first.parentElement.appendChild(img);
        stack.push(img);
      }
      return stack;
    });
    const load = (n) => frames.forEach((stack) => {
      const img = stack[n];
      if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
    });

    const dots = sets.map((set, n) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "looks-dot";
      b.setAttribute("aria-label", `Show outfits for ${set.context.split(" · ")[0].toLowerCase()} (${n + 1} of ${sets.length})`);
      b.setAttribute("aria-pressed", String(n === 0));
      b.innerHTML = "<span></span>";
      b.addEventListener("click", () => { setPlaying(false); show(n); });
      controls.appendChild(b);
      return b;
    });
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "looks-toggle";
    toggle.addEventListener("click", () => setPlaying(!playing));
    controls.appendChild(toggle);
    controls.hidden = false;

    function show(n) {
      load(n);
      current = n;
      const set = sets[n];
      frames.forEach((stack, i) => stack.forEach((img, k) => {
        img.classList.toggle("is-on", k === n);
        if (k === n) img.removeAttribute("aria-hidden"); else img.setAttribute("aria-hidden", "true");
        if (k === n) captions[i].textContent = set.captions[i];
      }));
      dots.forEach((d, k) => d.setAttribute("aria-pressed", String(k === n)));
      context.textContent = set.context;
      if (phone.img) {
        phone.img.src = src(n, "classic");
        phone.context.textContent = set.context;
        phone.caption.textContent = set.captions[0];
        phone.credit.textContent = set.credit;
      }
      load((n + 1) % sets.length);
    }
    function setPlaying(on) {
      playing = on;
      toggle.textContent = on ? "Pause" : "Play";
      toggle.setAttribute("aria-label", on ? "Pause the rotating outfits" : "Play the rotating outfits");
      clearInterval(timer);
      if (on) timer = setInterval(() => { if (!document.hidden) show((current + 1) % sets.length); }, 6000);
    }
    setPlaying(playing);
    window.addEventListener("load", () => load(1), { once: true });
  }

  /* ---------- Style DNA: how much each group of 10 looks counts ---------- */
  function initWeights() {
    const slider = $("#looks");
    if (!slider) return;
    const out = $("#weights-out");
    const label = $("#looks-out");
    const confLabel = $("#conf-label");
    const confNext = $("#conf-next");
    const scale = $$("#conf-scale span");

    function render() {
      const n = Number(slider.value);
      label.textContent = `${n} saved looks`;
      // Bucket b (0 = newest 10) weighs 0.6^b × (looks in it ÷ 10), normalized.
      const buckets = [];
      for (let start = 0; start < n; start += 10) buckets.push(Math.min(10, n - start));
      const raw = buckets.map((size, b) => Math.pow(0.6, b) * (size / 10));
      const total = raw.reduce((s, x) => s + x, 0);
      out.innerHTML = buckets.map((size, b) => {
        const pct = (raw[b] / total) * 100;
        const from = b * 10 + 1;
        const name = b === 0 ? `Newest ${size}` : `Looks ${from}-${from + size - 1}`;
        return `<li class="wrow"><span>${name}</span><div class="wrow-track"><div class="wrow-fill" style="width:${pct.toFixed(1)}%"></div></div><span class="num">${pct.toFixed(1)}%</span></li>`;
      }).join("");
      const level = n >= 30 ? "High" : n >= 15 ? "Medium" : "Low";
      confLabel.textContent = `Confidence: ${level}`;
      confNext.textContent = n >= 30 ? "Well established" : `${(n >= 15 ? 30 : 15) - n} more looks to reach ${n >= 15 ? "High" : "Medium"}`;
      const cls = { Low: "l", Medium: "m", High: "h" }[level];
      const lit = { Low: 1, Medium: 2, High: 3 }[level];
      scale.forEach((s, i) => { s.className = i < lit ? `on ${cls}` : ""; });
    }
    slider.addEventListener("input", render);
    render();
  }

  /* ---------- Try-on: measurements in cm or inches ---------- */
  function initMeasurements() {
    const table = $("#measure-list");
    if (!table) return;
    const cells = $$("dd[data-cm]", table);
    const render = (unit) => cells.forEach((dd) => {
      const cm = Number(dd.dataset.cm);
      if (unit === "cm") dd.textContent = `${cm} cm`;
      else if (dd.dataset.kind === "height") {
        const inches = Math.round(cm / 2.54);
        dd.textContent = `${Math.floor(inches / 12)} ft ${inches % 12} in`;
      } else dd.textContent = `${(cm / 2.54).toFixed(1)} in`;
    });
    segmented($("#measure-unit"), render);
    render("cm");
  }

  /* ---------- Try-on: the 360° turn ---------- */
  function initTurn() {
    const fig = $("#turn-figure");
    if (!fig) return;
    const marker = $("#turn-marker");
    // Which drawing to show, mirrored or not, and where the marker sits on the ring.
    const views = { Front: ["front", false, 50, 1], Left: ["side", true, 93, 11], Back: ["back", false, 50, 21], Right: ["side", false, 7, 11] };
    const groups = $$("g[data-view]", fig);
    const side = groups.find((g) => g.dataset.view === "side");
    const caption = $("#turn-caption");
    const set = (v) => {
      const [show, mirror, left, bottom] = views[v];
      // SVG elements have no .hidden property, so use the attribute.
      groups.forEach((g) => {
        if (g.dataset.view === show) g.removeAttribute("hidden");
        else g.setAttribute("hidden", "");
      });
      if (mirror) side.setAttribute("transform", "translate(60 0) scale(-1 1)");
      else side.removeAttribute("transform");
      marker.style.left = `calc(${left}% - 6px)`;
      marker.style.bottom = `${bottom}%`;
      caption.textContent = {
        Front: "Front: your try-on",
        Left: "Left side, drawn by Peppi's AI",
        Back: "Back, drawn by Peppi's AI",
        Right: "Right side, drawn by Peppi's AI",
      }[v];
    };
    const value = segmented($("#turn-views"), set);
    set("Front");
    // Drag sideways to turn, a quarter turn per 40 px, as in the app.
    const order = ["Front", "Right", "Back", "Left"];
    const table = fig.parentElement;
    let startX = null;
    let startIndex = 0;
    table.style.touchAction = "pan-y";
    table.style.cursor = "grab";
    table.addEventListener("pointerdown", (e) => { startX = e.clientX; startIndex = order.indexOf(value()); });
    window.addEventListener("pointerup", () => { startX = null; });
    table.addEventListener("pointermove", (e) => {
      if (startX === null) return;
      const steps = Math.round((e.clientX - startX) / 40);
      const next = order[(((startIndex + steps) % 4) + 4) % 4];
      if (next !== value()) {
        $$("#turn-views button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.value === next)));
        set(next);
      }
    });
  }

  /* ---------- Plans: monthly or yearly ---------- */
  function initBilling() {
    const group = $("#billing");
    if (!group) return;
    const render = (v) => $$("[data-billing]").forEach((el) => { el.hidden = el.dataset.billing !== v; });
    segmented(group, render);
    render("monthly");
  }

  /* ---------- Copy the email address ---------- */
  function initCopy() {
    $$(".copy-btn").forEach((btn) => btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      const done = (msg) => { btn.textContent = msg; setTimeout(() => { btn.textContent = "Copy"; }, 1800); };
      try {
        await navigator.clipboard.writeText(text);
        done("Copied");
      } catch (_) {
        const target = btn.parentElement.querySelector(".email");
        if (target) {
          const range = document.createRange();
          range.selectNodeContents(target);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        done("Selected");
      }
    }));
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHeader();
    initReveal();
    initLooks();
    initWeights();
    initMeasurements();
    initTurn();
    initBilling();
    initCopy();
  });
})();
