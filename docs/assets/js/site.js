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

  /* ---------- Home: the hangers' rail comes down when it's seen ---------- */
  function initRail() {
    const rail = $(".rail-art");
    if (!rail) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      rail.classList.add("is-down");
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        rail.classList.add("is-down");
        io.disconnect();
      }
    }, { rootMargin: "0px 0px -15% 0px" });
    io.observe(rail);
  }

  /* ---------- Style DNA: the taste graph's tooltip ---------- */
  function initTaste() {
    const svg = $(".taste-svg");
    const dataEl = $("#taste-data");
    if (!svg || !dataEl) return;
    const data = JSON.parse(dataEl.textContent);
    const tip = $("#taste-tip");
    const cross = $("#taste-cross");
    const plot = svg.parentElement;
    const box = svg.viewBox.baseVal;
    const left = 46, right = box.width - 48;
    const n = data.looks.length;
    const show = (clientX) => {
      const r = svg.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * box.width;
      const i = Math.max(0, Math.min(n - 1, Math.round(((x - left) / (right - left)) * (n - 1))));
      const cx = left + (i * (right - left)) / (n - 1);
      cross.setAttribute("x1", cx);
      cross.setAttribute("x2", cx);
      cross.removeAttribute("hidden");
      tip.innerHTML = `<strong>After ${data.looks[i]} looks</strong>` + data.series
        .map((s, k) => `<span class="taste-c${k + 1}"><i></i>${s.name} ${Math.round(s.values[i] * 100)}%</span>`).join("");
      tip.hidden = false;
      const px = (cx / box.width) * r.width;
      const w = tip.offsetWidth;
      tip.style.left = `${px + 12 + w <= r.width ? px + 12 : Math.max(0, px - 12 - w)}px`;
    };
    const hide = () => { tip.hidden = true; cross.setAttribute("hidden", ""); };
    plot.addEventListener("pointermove", (e) => show(e.clientX));
    plot.addEventListener("pointerdown", (e) => show(e.clientX));
    plot.addEventListener("pointerleave", hide);
  }

  /* ---------- Home: Alternative & Expressive, eight sets taking turns ----------
     Like the outfit grid at the top: starts at a random set, each photo
     crossfades to the next set's, with its caption; dots pick a set, and
     play/pause. Still with reduced
     motion (the dots still work). */
  function initAiLooks() {
    const grid = $("#ai-looks");
    const dataEl = $("#ai-data");
    const controls = $("#ai-controls");
    if (!grid || !dataEl || !controls) return;
    const sets = JSON.parse(dataEl.textContent);
    const firsts = $$("img[data-ai]", grid);
    const captions = $$(".ai-caption", grid);
    let playing = !reduceMotion;
    let timer = null;
    let current = 0;
    const frames = firsts.map((first, i) => {
      const stack = [first];
      for (let n = 1; n < sets.length; n++) {
        const img = document.createElement("img");
        img.alt = sets[n].captions[i].replace(/\.$/, "");
        img.width = 600; img.height = 800;
        img.decoding = "async";
        img.dataset.src = `assets/img/ai/${first.dataset.ai}-${n}.jpg?v=${document.body.dataset.photosV}`;
        img.setAttribute("aria-hidden", "true");
        first.parentElement.appendChild(img);
        stack.push(img);
      }
      return stack;
    });
    const ready = (n) => Promise.all(frames.map((stack) => {
      const img = stack[n];
      if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
      if (img.complete && img.naturalWidth) return null;
      return new Promise((done) => {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    }));
    const dots = sets.map((_, n) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "looks-dot";
      b.setAttribute("aria-label", `Show looks set ${n + 1} of ${sets.length}`);
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
    let wanted = 0;
    function show(n) {
      wanted = n;
      ready(n).then(() => { if (wanted === n) draw(n); });
    }
    function draw(n) {
      current = n;
      frames.forEach((stack) => stack.forEach((img, k) => {
        img.classList.toggle("is-on", k === n);
        if (k === n) img.removeAttribute("aria-hidden"); else img.setAttribute("aria-hidden", "true");
      }));
      captions.forEach((c, i) => { c.textContent = sets[n].captions[i]; });
      dots.forEach((d, k) => d.setAttribute("aria-pressed", String(k === n)));
    }
    function setPlaying(on) {
      playing = on;
      toggle.textContent = on ? "Pause" : "Play";
      toggle.setAttribute("aria-label", on ? "Pause the looks" : "Play the looks");
      clearInterval(timer);
      if (on) timer = setInterval(() => show((current + 1) % sets.length), 6000);
    }
    setPlaying(playing);
    startAtRandom(frames, sets.length, draw);
    if (playing) ready((current + 1) % sets.length);
  }

  // Each visit starts both photo grids at a random set (the owner). The
  // first set's photos are in the page; when another set starts, they are
  // put back to load-on-demand (cancelling their download) and the chosen
  // set loads instead.
  function startAtRandom(frames, count, draw) {
    const start = Math.floor(Math.random() * count);
    if (start === 0) return;
    frames.forEach((stack) => {
      const first = stack[0];
      first.dataset.src = first.getAttribute("src");
      first.removeAttribute("src");
      const img = stack[start];
      if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
    });
    draw(start);
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

  /* ---------- Home: three looks, rotating through the occasions ---------- */
  // Starts at a random occasion each visit (startAtRandom); the next one
  // loads in the background (each one shown fetches the one after), and an occasion only
  // shows once all three of its photos are ready, so a frame is never blank.
  // They cross-fade every 6 seconds; previous and next step through the
  // occasions (and stop the rotation); with reduced motion nothing turns by
  // itself.
  function initLooks() {
    const grid = $("#looks");
    const dataEl = $("#looks-data");
    const controls = $("#looks-controls");
    if (!grid || !dataEl || !controls) return;
    const sets = JSON.parse(dataEl.textContent);
    const looks = $$("img[data-look]", grid);
    const captions = $$(".look-caption", grid);
    const context = $("#looks-context");
    const guideLink = $("#looks-guide");
    const phone = {
      track: $("#phone-track"), context: $("#phone-context"), caption: $("#phone-caption"), credit: $("#phone-credit"),
      look: $("#phone-look"), count: $("#phone-count"), dots: $$("#phone-dots span"),
    };
    const LOOKS = ["classic", "bold", "relaxed"];
    const LOOK_NAMES = ["Classic", "Bold", "Relaxed"];
    const src = (n, look) => `assets/img/looks/s${n + 1}-${look}.jpg?v=${document.body.dataset.photosV}`;
    let current = 0;
    let playing = !reduceMotion;
    let timer = null;

    // One stacked image per occasion in each of the three frames.
    const frames = looks.map((first) => {
      const stack = [first];
      for (let n = 1; n < sets.length; n++) {
        const img = document.createElement("img");
        img.alt = sets[n].captions[looks.indexOf(first)];
        img.width = 600; img.height = 900;
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

    // Previous, "3 / 20" and next: dots don't fit this many occasions.
    const step = (label, delta) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "looks-step";
      b.setAttribute("aria-label", label);
      b.textContent = delta < 0 ? "‹" : "›";
      b.addEventListener("click", () => { setPlaying(false); show((wanted + delta + sets.length) % sets.length); });
      return b;
    };
    const count = document.createElement("span");
    count.className = "looks-count";
    count.setAttribute("aria-live", "polite");
    controls.append(step("Previous occasion", -1), count, step("Next occasion", 1));
    const showCount = (n) => { count.textContent = `${n + 1} / ${sets.length}`; };
    showCount(0);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "looks-toggle";
    toggle.addEventListener("click", () => setPlaying(!playing));
    controls.appendChild(toggle);
    controls.hidden = false;

    // Resolves when all three photos of occasion n can be drawn.
    const ready = (n) => {
      load(n);
      return Promise.all(frames.map((stack) => {
        const img = stack[n];
        if (img.complete && img.naturalWidth) return null;
        return new Promise((done) => {
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        });
      }));
    };
    let wanted = 0;
    function show(n) {
      wanted = n;
      ready(n).then(() => { if (wanted === n) draw(n); });
    }
    function draw(n) {
      current = n;
      const set = sets[n];
      frames.forEach((stack, i) => stack.forEach((img, k) => {
        img.classList.toggle("is-on", k === n);
        if (k === n) img.removeAttribute("aria-hidden"); else img.setAttribute("aria-hidden", "true");
        if (k === n) captions[i].textContent = set.captions[i];
      }));
      showCount(n);
      context.textContent = set.context;
      // The guide for the occasion shown, by its short address.
      if (guideLink && set.guide) { guideLink.href = `/${set.guide[0]}`; guideLink.textContent = set.guide[1]; }
      if (phone.track) {
        // The new occasion's three photos, back on Classic without sliding.
        $$("img", phone.track).forEach((img, k) => { img.src = src(n, LOOKS[k]); });
        phone.track.style.transition = "none";
        phoneShow(0);
        void phone.track.offsetWidth;
        phone.track.style.transition = "";
        phone.context.textContent = set.context;
        phoneCycle();
      }
      load((n + 1) % sets.length);
    }

    // The app screen in "The app" section swipes through the occasion's
    // three outfits like the app does: Classic, Bold, Relaxed, 2 seconds
    // each, so one pass takes as long as an occasion stays in the grid.
    let phoneAt = 0;
    let phoneTimer = null;
    function phoneShow(k) {
      phoneAt = k;
      phone.track.style.transform = `translateX(${-100 * k}%)`;
      phone.look.textContent = LOOK_NAMES[k];
      phone.caption.textContent = sets[current].captions[k];
      phone.credit.textContent = sets[current].credits[k];
      phone.count.textContent = `${k + 1} / 3`;
      phone.dots.forEach((d, i) => d.classList.toggle("is-on", i === k));
    }
    function phoneCycle() {
      clearInterval(phoneTimer);
      if (playing && phone.track) phoneTimer = setInterval(() => { if (!document.hidden && phoneAt < 2) phoneShow(phoneAt + 1); }, 2000);
    }

    function setPlaying(on) {
      playing = on;
      toggle.textContent = on ? "Pause" : "Play";
      toggle.setAttribute("aria-label", on ? "Pause the rotating outfits" : "Play the rotating outfits");
      clearInterval(timer);
      if (on) timer = setInterval(() => { if (!document.hidden) show((current + 1) % sets.length); }, 6000);
      phoneCycle();
    }
    setPlaying(playing);
    startAtRandom(frames, sets.length, (n) => { wanted = n; draw(n); });
    // After the page: fetch the next occasion.
    window.addEventListener("load", () => load((current + 1) % sets.length), { once: true });
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

  /* ---------- Home: "More great values" ---------- */
  // Open in the page so the text is there without JavaScript; on phones it
  // starts folded, and it opens again when the window widens past phone size.
  function initMore() {
    const more = document.querySelector(".more");
    if (!more) return;
    const phone = window.matchMedia("(max-width: 760px)");
    const sync = () => { more.open = !phone.matches; };
    sync();
    phone.addEventListener("change", sync);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHeader();
    initMore();
    initReveal();
    initRail();
    initTaste();
    initAiLooks();
    initLooks();
    initWeights();
    initMeasurements();
    initTurn();
    initBilling();
    initCopy();
  });
})();
