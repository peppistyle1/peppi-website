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

  /* ---------- Style DNA: the helix beside the sample card ---------- */
  // Saved looks fly into a turning double helix one at a time; the card's
  // bars fill from 3 looks and it's ready at 6 (the app's free preview).
  // Drawn on a canvas, upright beside the card or lying across it on phones.
  // Paused while off screen; with reduced motion it stands still, card full.
  function initHelix() {
    const cv = $(".dna-helix");
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext("2d");
    const count = $(".dna-count");
    const fills = $$(".dna-card .bar-fill"), nums = $$(".dna-card .bar-top .num");
    const targets = fills.map((f) => parseFloat(f.style.getPropertyValue("--w")) || 0);
    const rungs = ["#1F2A44", "#C8A27A", "#F7F6F3", "#111111", "#8A9A7B", "#F08A6E", "#E4E1DA", "#5A2A1E"];
    const N = 16, READY = 6;
    let saves = 0, t = 0, last = 0, nextSave = 0.8, running = false, raf = 0;
    let flyers = [];
    const lit = new Map();

    function size() {
      const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(1, Math.round(r.width * d));
      cv.height = Math.max(1, Math.round(r.height * d));
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    function showCard() {
      const share = saves < 3 ? 0 : Math.min(1, (saves - 2) / (READY - 2));
      fills.forEach((f, k) => { f.style.width = `${targets[k] * share}%`; });
      nums.forEach((n, k) => { n.textContent = `${Math.round(targets[k] * share)}%`; });
      if (count) {
        count.textContent = saves === 0 ? "Save the looks you love"
          : saves < READY ? `${saves} ${saves === 1 ? "look" : "looks"} saved · ${READY - saves} more to go`
          : "Your Style DNA is ready";
      }
    }
    function heart(x, y, s) {
      ctx.fillStyle = "#F7F6F3";
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.9);
      ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.6, y - s * 1.3, x, y - s * 0.4);
      ctx.bezierCurveTo(x + s * 0.6, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
      ctx.fill();
    }
    // Points along the helix's axis: down the canvas, or across it when wide.
    function draw(dt) {
      const w = cv.clientWidth, h = cv.clientHeight, across = w > h;
      const len = across ? w : h, mid = across ? h / 2 : w / 2, R = (across ? h : w) * 0.32;
      const gap = (len - 24) / (N - 1);
      const at = (along, off) => (across ? [along, mid + off] : [mid + off, along]);
      ctx.clearRect(0, 0, w, h);
      const pts = [];
      for (let k = 0; k < N; k++) {
        const ph = t * 0.9 + k * 0.5;
        pts.push({ along: 12 + k * gap, off: R * Math.sin(ph), z: Math.cos(ph) });
      }
      pts.forEach((p, k) => {
        const glow = lit.get(k) || 0;
        ctx.globalAlpha = 0.45 + 0.45 * Math.abs(p.z);
        ctx.strokeStyle = glow > 0 ? "#111111" : rungs[k % rungs.length];
        ctx.lineWidth = 3 + glow * 2;
        ctx.beginPath(); ctx.moveTo(...at(p.along, p.off)); ctx.lineTo(...at(p.along, -p.off)); ctx.stroke();
      });
      ctx.globalAlpha = 0.9; ctx.lineWidth = 1.6; ctx.strokeStyle = "#F7F6F3";
      for (const sign of [1, -1]) {
        ctx.beginPath();
        pts.forEach((p, k) => (k ? ctx.lineTo(...at(p.along, sign * p.off)) : ctx.moveTo(...at(p.along, sign * p.off))));
        ctx.stroke();
      }
      ctx.fillStyle = "#F7F6F3";
      pts.forEach((p) => {
        for (const sign of [1, -1]) {
          const front = sign * p.z > 0;
          ctx.globalAlpha = front ? 1 : 0.5;
          ctx.beginPath(); ctx.arc(...at(p.along, sign * p.off), front ? 3.4 : 2.4, 0, Math.PI * 2); ctx.fill();
        }
      });
      flyers = flyers.filter((f) => {
        f.p += dt / 0.9;
        const e = 1 - Math.pow(1 - Math.min(1, f.p), 3);
        const [ex, ey] = at(pts[f.k].along, 0);
        const x = f.sx + (ex - f.sx) * e, y = f.sy + (ey - f.sy) * e - Math.sin(e * Math.PI) * 26;
        ctx.globalAlpha = Math.max(0, 1 - Math.max(0, f.p - 0.85) * 6);
        heart(x, y, 6);
        if (f.p >= 1) { lit.set(f.k, 1); return false; }
        return true;
      });
      ctx.globalAlpha = 1;
      lit.forEach((v, k) => { const nv = v - dt * 0.5; if (nv <= 0) lit.delete(k); else lit.set(k, nv); });
    }
    function frame(now) {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now; t += dt;
      if (saves < READY) {
        nextSave -= dt;
        if (nextSave <= 0) {
          nextSave = 1.25;
          const across = cv.clientWidth > cv.clientHeight;
          flyers.push({
            k: Math.floor(Math.random() * N), p: 0,
            sx: across ? Math.random() * cv.clientWidth : cv.clientWidth + 10,
            sy: across ? -10 : Math.random() * cv.clientHeight,
          });
          setTimeout(() => { saves += 1; showCard(); }, 900);
        }
      }
      draw(dt);
      if (running) raf = requestAnimationFrame(frame);
    }
    size();
    window.addEventListener("resize", () => { size(); if (!running) draw(0); });
    if (reduceMotion || !("IntersectionObserver" in window)) { draw(0); return; }
    // Empty the card at once (no shrinking transition), then fill as looks arrive.
    fills.forEach((f) => { f.style.transition = "none"; });
    showCard();
    void cv.offsetWidth;
    fills.forEach((f) => { f.style.transition = ""; });
    const io = new IntersectionObserver((entries) => {
      const seen = entries.some((entry) => entry.isIntersecting);
      if (seen && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
      else if (!seen && running) { running = false; cancelAnimationFrame(raf); }
    });
    io.observe(cv);
  }

  /* ---------- Plans: the swing tags fall onto the rail ---------- */
  // The CSS does the falling and the sewing (.is-playing); the needle follows
  // the thread here. After that they sway (.is-done), which is also how they
  // rest without a script or with reduced motion.
  function initTags() {
    const svg = $(".plan-tags");
    if (!svg) return;
    if (reduceMotion || !("IntersectionObserver" in window)) { svg.classList.add("is-done"); return; }
    const thread = $(".pt-thread", svg), needle = $(".pt-needle", svg);
    const play = () => {
      svg.classList.add("is-playing");
      const L = thread.getTotalLength();
      const start = performance.now() + 1600, dur = 1600;
      const tick = (now) => {
        const p = Math.max(0, Math.min(1, (now - start) / dur));
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const a = thread.getPointAtLength(e * L), b = thread.getPointAtLength(Math.min(L, e * L + 1));
        const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
        needle.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${angle})`);
        needle.style.opacity = p > 0 && p < 1 ? "1" : "0";
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      setTimeout(() => { svg.classList.remove("is-playing"); svg.classList.add("is-done"); }, 3800);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { io.disconnect(); play(); }
    }, { rootMargin: "0px 0px -10% 0px" });
    io.observe(svg);
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
    const out = $("#weights-out");
    const label = $("#looks-out");
    // The home page's outfit grid is also #looks: only the Style DNA slider has its labels.
    if (!slider || !label || !out) return;
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

  /* ---------- Home: the film at the top ---------- */
  // Three short stories, each four photos made with AI: a couple before a
  // wedding, a man before a dinner date, a woman before a wedding. Each visit
  // shows a different one from the visit before (remembered on this browser
  // only, in turn; without storage it's a random one). Each photo zooms out slowly around the
  // people while the story bars fill, the clock moves on and a subtitle says
  // the moment; in the third, Peppi's three outfits appear beside them, with a
  // heart on Classic, the one they wear in the last. Then "What to wear,
  // decided." rises over it and the film rests there (Replay plays it again).
  // Motion (motion.js, on the home page) does the movement; without it, or
  // with reduced motion, the film shows its last photo and the headline.
  const FILMS = {
    couple: {
      subs: ["2:30 pm. Wedding at four.", "We have nothing to wear.", "Ask Peppi."],
      times: ["2:30 PM", "2:34 PM", "2:37 PM", "2:41 PM"],
      occasion: "Wedding guests", temp: "22°C", app: "right",
      them: "72% 50%",
      phone: [0.533, 0.57], // the phone in photo 3 (0-1 of the image)
      // Where the people are in each photo (0-1 of the image, [x0, y0, x1, y1]):
      // all their heads, their faces, their whole bodies (read by Gemini).
      heads: [[0.149, 0.045, 0.796, 0.532], [0.165, 0.159, 0.718, 0.597], [0.417, 0.078, 0.726, 0.55], [0.361, 0.048, 0.568, 0.333]],
      faces: [[0.263, 0.121, 0.747, 0.375], [0.195, 0.193, 0.7, 0.549], [0.483, 0.184, 0.695, 0.395], [0.397, 0.081, 0.555, 0.234]],
      bodies: [[0.137, 0.045, 0.874, 1.0], [0.15, 0.159, 0.916, 1.0], [0.345, 0.077, 0.853, 1.0], [0.323, 0.048, 0.622, 0.977]],
    },
    man: {
      subs: ["6:58 pm. Dinner at eight.", "Nothing works.", "Okay, Peppi."],
      times: ["6:58 PM", "7:01 PM", "7:04 PM", "7:07 PM"],
      occasion: "Date night", temp: "18°C", app: "left",
      them: "86% 50%",
      phone: [0.677, 0.73],
      heads: [[0.477, 0.053, 0.582, 0.297], [0.489, 0.058, 0.608, 0.332], [0.469, 0.031, 0.627, 0.426], [0.524, 0.047, 0.586, 0.185]],
      faces: [[0.49, 0.146, 0.564, 0.292], [0.497, 0.162, 0.587, 0.33], [0.497, 0.18, 0.61, 0.424], [0.529, 0.095, 0.58, 0.187]],
      bodies: [[0.319, 0.053, 0.702, 1.0], [0.357, 0.058, 0.647, 1.0], [0.28, 0.031, 0.707, 1.0], [0.5, 0.047, 0.657, 0.989]],
    },
    her: {
      subs: ["7:42. Nothing to wear.", "Again.", "Okay, Peppi."],
      times: ["7:42 AM", "7:44 AM", "7:46 AM", "7:48 AM"],
      occasion: "Wedding guest", temp: "13°C", app: "right",
      them: "62% 50%",
      phone: [0.613, 0.48],
      heads: [[0.369, 0.084, 0.505, 0.335], [0.442, 0.089, 0.584, 0.345], [0.375, 0.048, 0.574, 0.439], [0.49, 0.042, 0.572, 0.238]],
      faces: [[0.444, 0.153, 0.497, 0.286], [0.497, 0.14, 0.562, 0.29], [0.463, 0.153, 0.55, 0.361], [0.526, 0.083, 0.569, 0.18]],
      bodies: [[0.367, 0.084, 0.645, 1.0], [0.401, 0.089, 0.659, 0.996], [0.332, 0.048, 0.649, 1.0], [0.458, 0.042, 0.617, 0.987]],
      // Her three outfits are the home page's wedding-guest looks (Unsplash, credited below).
      looks: { classic: "assets/img/looks/s1-classic.jpg", bold: "assets/img/looks/s1-bold.jpg", relaxed: "assets/img/looks/s1-relaxed.jpg" },
    },
  };
  function pickFilm() {
    const names = Object.keys(FILMS);
    // ?film=couple|man|her shows that one (for checking each film).
    const asked = new URLSearchParams(location.search).get("film");
    if (names.includes(asked)) return asked;
    let last = null;
    try { last = localStorage.getItem("peppi-film"); } catch (e) { /* no storage: any film */ }
    // In turn, so three visits show all three (the owner); without storage, any one.
    const name = names.includes(last) ? names[(names.indexOf(last) + 1) % names.length] : names[Math.floor(Math.random() * names.length)];
    try { localStorage.setItem("peppi-film", name); } catch (e) { /* fine */ }
    return name;
  }
  function initFilm() {
    const film = $("#film");
    if (!film) return;
    const name = pickFilm(), cfg = FILMS[name], dir = `assets/img/film/${name}`;
    const frames = $$(".film-frame", film), bars = $$(".film-ticks b", film);
    const time = $(".film-time", film), sub = $(".film-sub", film), app = $(".film-app", film);
    const figs = $$(".film-app figure", film), heart = $(".film-heart", film), head = $(".film-head", film);
    const eyebrow = $(".film-eyebrow", film), words = $$(".film-head .w > span", film), replay = $("#film-replay");
    const kicker = $(".film-kicker", film);
    frames.forEach((f) => {
      const k = f.dataset.k;
      f.srcset = `${dir}/${k}-900.jpg 900w, ${dir}/${k}-1600.jpg 1600w`;
      f.src = `${dir}/${k}-1600.jpg`;
    });
    // Each photo starts a little closer and zooms out slowly to the full
    // picture the screen allows, always filling the film (the owner: the
    // phone in their hands and the outfit they end in must be seen; a photo
    // smaller than the film over a blurred copy of itself wasn't
    // professional). No face is ever cut, on any screen. From the phone on,
    // each photo is centred on the people, whole; earlier ones on their
    // heads (the faces at least, if the heads can't all fit), which stay
    // inside the film all the way. Returns the scales it runs between.
    const ZOOM = 1.14;
    function place(i) {
      const f = frames[i], W = film.clientWidth, H = film.clientHeight;
      const s0 = Math.max(W / 1600, H / 893), Dw = 1600 * s0, Dh = 893 * s0;
      const pad = 0.012, edge = 6, top = 10;
      let box = cfg.heads[i];
      if ((box[2] - box[0] + 2 * pad) * Dw > W) box = cfg.faces[i];
      const x0 = box[0] - pad, y0 = box[1] - pad, x1 = box[2] + pad, y1 = box[3] + pad;
      const need = i >= 2 ? cfg.bodies[i] : [x0, y0, x1, y1];
      const cx = (need[0] + need[2]) / 2, cy = (need[1] + need[3]) / 2;
      const tx = Math.min(0, Math.max(W - Dw, W / 2 - cx * Dw));
      let ty = H / 2 - cy * Dh;
      if (y0 * Dh + ty < top) ty = top - y0 * Dh;
      ty = Math.min(0, Math.max(H - Dh, ty));
      // The whole photo, placed in the film (which clips it), so zooming out
      // shows more of it rather than shrinking a cropped view.
      Object.assign(f.style, { width: `${Dw}px`, height: `${Dh}px`, left: `${tx}px`, top: `${ty}px` });
      // It zooms out about the people's middle, ending at the full picture.
      const end = 1;
      const ox = cx * Dw + tx, oy = Math.min(H - edge, Math.max(top, cy * Dh + ty));
      f.style.transformOrigin = `${ox - tx}px ${oy - ty}px`;
      // How close it may start about that point before a head reaches an edge.
      const room = (o, p, lo, hi) => (p < o ? (o - lo) / (o - p) : p > o ? (hi - o) / (p - o) : Infinity);
      const px0 = x0 * Dw + tx, px1 = x1 * Dw + tx, py0 = y0 * Dh + ty, py1 = y1 * Dh + ty;
      const most = Math.min(room(ox, px0, edge, W - edge), room(ox, px1, edge, W - edge),
        room(oy, py0, top, H - edge), room(oy, py1, top, H - edge));
      placed[i] = { tx, ty, Dw, Dh };
      return [Math.max(end, Math.min(ZOOM, most)), end];
    }
    const placed = [];
    // On phones the outfits card goes in the corner of photo 3 that hides
    // least of the heads and the phone in their hands (the owner: the phone
    // must be seen); on wider screens it keeps its side, clear of them.
    function placeCard() {
      ["top", "bottom", "left", "right"].forEach((k) => { app.style[k] = ""; });
      const W = film.clientWidth, H = film.clientHeight;
      if (W / H >= 1.2 || !placed[2]) return;
      const { tx, ty, Dw, Dh } = placed[2];
      const rect = (b) => [b[0] * Dw + tx, b[1] * Dh + ty, b[2] * Dw + tx, b[3] * Dh + ty];
      const px = cfg.phone[0] * Dw + tx, py = cfg.phone[1] * Dh + ty;
      const avoid = [[rect(cfg.heads[2]), 3], [[px - 36, py - 36, px + 36, py + 36], 6]];
      const cw = app.offsetWidth || 150, ch = app.offsetHeight || 120;
      const spots = [
        { top: 34, left: 12 }, { top: 34, right: 12 },
        { bottom: Math.round(H * 0.2), left: 12 }, { bottom: Math.round(H * 0.2), right: 12 },
      ];
      const area = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
      let best = spots[0], bestCost = Infinity;
      for (const s of spots) {
        const x = s.left != null ? s.left : W - s.right - cw, y = s.top != null ? s.top : H - s.bottom - ch;
        const r = [x, y, x + cw, y + ch];
        const cost = avoid.reduce((sum, [b, w]) => sum + w * area(r, b), 0);
        if (cost < bestCost) { best = s; bestCost = cost; }
      }
      app.style.top = best.top != null ? `${best.top}px` : "auto";
      app.style.bottom = best.bottom != null ? `${best.bottom}px` : "auto";
      app.style.left = best.left != null ? `${best.left}px` : "auto";
      app.style.right = best.right != null ? `${best.right}px` : "auto";
    }
    let scales = frames.map((f, i) => place(i));
    placeCard();
    // Placed again whenever the film's size changes (a resize, the page
    // settling after it first lays out).
    const replace = () => { scales = frames.map((f, i) => place(i)); placeCard(); };
    if ("ResizeObserver" in window) new ResizeObserver(replace).observe(film);
    else window.addEventListener("resize", replace);
    $$(".film-app img", film).forEach((img) => {
      const k = img.dataset.k;
      img.src = cfg.looks ? `${cfg.looks[k]}?v=${document.body.dataset.photosV}` : k === "classic" ? `${dir}/ready-900.jpg` : `${dir}/${k}.jpg`;
      if (k === "classic" && !cfg.looks) img.style.objectPosition = cfg.them;
    });
    $(".film-app-occ", film).textContent = cfg.occasion;
    $(".film-app-temp", film).textContent = cfg.temp;
    app.classList.toggle("film-app--left", cfg.app === "left");
    const M = window.Motion;
    const rest = () => {
      frames.forEach((f, i) => { f.style.opacity = i === frames.length - 1 ? "1" : "0"; f.style.transform = ""; });
      bars.forEach((b) => { b.style.transform = "scaleX(1)"; });
      head.style.opacity = "1";
      words.forEach((w) => { w.style.transform = "none"; });
      time.textContent = cfg.times[3];
    };
    if (!M || reduceMotion) { rest(); return; }
    const DUR = [3.0, 2.4, 3.6, 3.2];
    const wait = (ms) => new Promise((done) => setTimeout(done, ms));
    let run = 0;
    async function say(text) {
      await M.animate(sub, { opacity: [1, 0] }, { duration: 0.25 });
      sub.textContent = text || "";
      if (text) M.animate(sub, { opacity: [0, 1], y: [10, 0] }, { duration: 0.6, ease: "easeOut" });
    }
    async function play() {
      const id = ++run;
      const live = () => id === run;
      frames.forEach((f) => { f.style.opacity = "0"; f.style.transform = ""; });
      bars.forEach((b) => { b.style.transform = "scaleX(0)"; });
      sub.textContent = ""; app.style.opacity = "0"; app.style.transform = "";
      figs.forEach((f) => { f.style.opacity = "0"; }); heart.style.opacity = "0";
      head.style.opacity = "0"; words.forEach((w) => { w.style.transform = "translateY(110%)"; });
      for (let i = 0; i < frames.length; i++) {
        if (!live()) return;
        const f = frames[i];
        time.textContent = cfg.times[i];
        M.animate(time, { opacity: [0.3, 1] }, { duration: 0.5 });
        M.animate(f, { opacity: [0, 1] }, { duration: i ? 1.1 : 0.8, ease: "easeInOut" });
        if (i) M.animate(frames[i - 1], { opacity: [1, 0] }, { duration: 1.1, ease: "easeInOut" });
        scales[i] = place(i);
        M.animate(f, { scale: scales[i] }, { duration: DUR[i] + 1.4, ease: "linear" });
        M.animate(bars[i], { scaleX: [0, 1] }, { duration: DUR[i], ease: "linear" });
        say(cfg.subs[i]);
        if (i === 2) {
          await wait(900); if (!live()) return;
          M.animate(app, { opacity: [0, 1], y: [30, 0], scale: [0.92, 1] }, { type: "spring", stiffness: 160, damping: 18 });
          figs.forEach((fig, k) => M.animate(fig, { opacity: [0, 1], y: [16, 0] }, { duration: 0.5, delay: 0.3 + k * 0.15 }));
          await wait(1400); if (!live()) return;
          M.animate(heart, { opacity: [0, 1], scale: [0.3, 1.4, 1] }, { duration: 0.5 });
          await wait(DUR[i] * 1000 - 2300); if (!live()) return;
          M.animate(app, { opacity: 0, x: cfg.app === "left" ? -40 : 40 }, { duration: 0.6, delay: 0.2 });
        } else {
          await wait(DUR[i] * 1000);
        }
      }
      if (!live()) return;
      head.style.opacity = "1";
      M.animate(eyebrow, { opacity: [0, 1], y: [8, 0] }, { duration: 0.6 });
      words.forEach((w, k) => M.animate(w, { y: ["110%", "0%"] }, { type: "spring", stiffness: 160, damping: 18, delay: 0.2 + k * 0.12 }));
      if (kicker) M.animate(kicker, { opacity: [0, 1], y: [8, 0] }, { duration: 0.6, delay: 0.4 + words.length * 0.12 });
      replay.hidden = false;
    }
    replay.addEventListener("click", play);
    play();
  }

  /* ---------- Home: the occasions as a departure board ---------- */
  // Reads the 40 occasions from the lists in the page (which stay there for
  // search engines, and show without a script) and shows them as departures:
  // every 2.5 s the next occasion flips into a row, its letters rattling until
  // they land (Motion turns each flap), and the newest row is "Dressing" in
  // coral. The category buttons flip the whole board to one category. Paused
  // while off screen; with reduced motion the letters land at once and the
  // rows don't change by themselves.
  function initBoard() {
    const box = $("#occ-board"), lists = $(".occasions"), tbody = $("#board-rows"), chips = $("#occ-chips");
    if (!box || !lists || !tbody || !chips) return;
    const cats = $$("section", lists).map((sec) => ({
      name: $("h3", sec).firstChild.textContent.trim(),
      items: $$("li", sec).map((li) => li.textContent.trim()),
    }));
    const all = cats.flatMap((c) => c.items.map((name) => ({ name, cat: c.name })));
    if (!all.length) return;
    const M = window.Motion, ROWS = 8, GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ&/";
    let filter = null, cursor = 0, next = 0, timer = null;
    const list = () => (filter ? all.filter((o) => o.cat === filter) : all);
    // A made-up timetable: from 8:00, every 35 minutes.
    const when = (k) => { const m = 8 * 60 + 35 * k; return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
    function flap(el, text) {
      if (!M || reduceMotion) { el.textContent = text; return; }
      let n = 0;
      const steps = 6 + Math.floor(Math.random() * 5);
      const tick = () => {
        if (n++ >= steps) { el.textContent = text; M.animate(el, { rotateX: [-80, 0] }, { duration: 0.18 }); return; }
        el.textContent = text.split("").map((ch) => (ch === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join("");
        M.animate(el, { rotateX: [-70, 0] }, { duration: 0.06 });
        setTimeout(tick, 55);
      };
      tick();
    }
    const rows = [];
    for (let r = 0; r < ROWS; r++) {
      const tr = document.createElement("tr");
      tr.innerHTML = '<td class="when"><span class="flap"></span></td><td><span class="flap"></span></td><td class="cat"><span class="flap"></span></td><td class="status"><span class="flap"></span></td>';
      tbody.appendChild(tr);
      rows.push({ tr, flaps: $$(".flap", tr) });
    }
    function setRow(r, o, k, now) {
      const [w, n, c, s] = rows[r].flaps;
      flap(w, when(k)); flap(n, o.name); flap(c, o.cat);
      s.classList.toggle("now", now);
      flap(s, now ? "Dressing" : "On time");
    }
    function fill() {
      const l = list();
      rows.forEach((row, r) => {
        row.tr.hidden = r >= l.length;
        if (r < l.length) setTimeout(() => setRow(r, l[r], r, r === 0), r * 90);
      });
      cursor = Math.min(ROWS, l.length);
      // The first row is "Dressing" now; a category that fits flips the second one next.
      next = l.length <= ROWS ? 1 % l.length : 0;
    }
    function step() {
      const l = list();
      rows.forEach((row) => row.flaps[3].classList.remove("now"));
      if (l.length <= ROWS) {
        // A category that fits on the board: each row flips again in turn
        // (same occasion, letters rattling) and becomes the one "Dressing".
        const r = next % l.length;
        setRow(r, l[r], r, true);
        next = (r + 1) % l.length;
        return;
      }
      setRow(next, l[cursor % l.length], cursor, true);
      cursor++;
      next = (next + 1) % ROWS;
    }
    // The buttons: All, then each category with its count.
    const buttons = [{ label: "All", count: all.length, cat: null }, ...cats.map((c) => ({ label: c.name, count: c.items.length, cat: c.name }))].map((b, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "occ-chip";
      el.setAttribute("aria-pressed", String(i === 0));
      el.innerHTML = "<span></span><b></b>";
      el.firstChild.textContent = b.label;
      el.lastChild.textContent = String(b.count);
      el.addEventListener("click", () => {
        buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === el)));
        filter = b.cat;
        fill();
      });
      chips.appendChild(el);
      return el;
    });
    const clock = $("#board-clock");
    const showClock = () => {
      const d = new Date();
      clock.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };
    showClock();
    box.hidden = false;
    lists.hidden = true;
    fill();
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      const seen = entries.some((entry) => entry.isIntersecting);
      if (seen && !timer) { showClock(); timer = setInterval(() => { step(); showClock(); }, 2500); }
      else if (!seen && timer) { clearInterval(timer); timer = null; }
    });
    io.observe(box);
  }

  /* ---------- Home: "Surprise me" under the AI looks ---------- */
  // A strip of the seven looks (each with one of its photos, picked per
  // visit) spins, slows with a spring and lands on one under the pointer;
  // the winner jumps and says its line. Motion (motion.js, self-hosted) does
  // the movement; without it, or with reduced motion, the pick is instant.
  // It spins once by itself the first time it's seen.
  function initPick() {
    const box = $("#pick"), strip = $("#pick-strip"), slot = $("#pick-slot"), dataEl = $("#ai-data");
    if (!box || !strip || !slot || !dataEl) return;
    const sets = JSON.parse(dataEl.textContent);
    // The seven looks as written in the page (set 0); each gets one of its sets at random.
    const looks = $$(".pick-card", strip).map((fig, i) => ({
      id: $("img[data-ai]", fig).dataset.ai,
      name: $("strong", fig).textContent,
      occasion: $(".ai-occasion", fig).textContent,
      set: Math.floor(Math.random() * sets.length),
      i,
    }));
    if (!looks.length) return;
    const LINES = {
      "desert-burner": "Dust is an accessory.",
      "romantic-goth": "It's not black. It's midnight velvet.",
      "cyberpunk-techwear": "My jacket has better Wi-Fi than me.",
      "steampunk-explorer": "The goggles are mostly decorative.",
      "fantasy-cosplay": "Yes, the cloak has pockets.",
      "punk-industrial": "The mohawk was not optional.",
      "avant-garde-art": "It's a hat. Probably.",
    };
    const REPS = 7;
    strip.textContent = "";
    for (let r = 0; r < REPS; r++) {
      looks.forEach((l) => {
        const caption = sets[l.set].captions[l.i];
        const fig = document.createElement("figure");
        fig.className = "pick-card";
        if (r !== 1) fig.setAttribute("aria-hidden", "true");
        fig.innerHTML = `<div class="ai-look-photo"><img src="assets/img/ai/${l.id}-${l.set}.jpg?v=${document.body.dataset.photosV}" alt="" width="600" height="800" loading="lazy" decoding="async"></div><figcaption><strong></strong><span class="ai-occasion"></span><span class="ai-caption"></span></figcaption>`;
        if (r === 1) $("img", fig).alt = caption.replace(/\.$/, "");
        // Only one set carries the words as text: the other six show them
        // through CSS (data-t), so search engines read each look once, not
        // seven times (they read repeated text as stuffing).
        const put = (sel, text) => { const el = $(sel, fig); if (r === 1) el.textContent = text; else el.dataset.t = text; };
        put("strong", l.name);
        put(".ai-occasion", l.occasion);
        put(".ai-caption", caption);
        strip.appendChild(fig);
      });
    }
    $("#pick-row").hidden = false;
    const M = window.Motion;
    const bubble = $("#pick-bubble"), nameEl = $("#pick-name"), lineEl = $("#pick-line");
    const n = looks.length;
    let at = n + Math.floor(Math.random() * n), x = 0, spinning = false;
    const offsetFor = (k) => {
      const c = strip.children[k];
      return slot.clientWidth / 2 - (c.offsetLeft + c.offsetWidth / 2);
    };
    const place = (k) => { x = offsetFor(k); strip.style.transform = `translateX(${x}px)`; };
    const say = (k) => {
      const l = looks[k % n];
      nameEl.textContent = l.name;
      lineEl.textContent = LINES[l.id] || "";
      bubble.classList.remove("is-empty");
    };
    place(at);
    window.addEventListener("resize", () => place(at));
    async function spin() {
      if (spinning) return;
      spinning = true;
      place((at % n) + n);                           // the same look, back in the second set
      const target = (REPS - 2) * n + Math.floor(Math.random() * n);
      const to = offsetFor(target);
      if (!M || reduceMotion) {
        place(target);
      } else {
        M.animate(bubble, { opacity: 0, scale: 0.85 }, { duration: 0.2 });
        await M.animate(strip, { x: [x, to - 30] }, { duration: 2.6, ease: [0.12, 0.7, 0.2, 1] });
        await M.animate(strip, { x: [to - 30, to] }, { type: "spring", stiffness: 220, damping: 9 });
        x = to;
        strip.style.transform = `translateX(${to}px)`;
      }
      at = target;
      say(target);
      if (M && !reduceMotion) {
        M.animate(strip.children[target], { y: [0, -30, 0, -12, 0], rotate: [0, -6, 4, -2, 0], scale: [1, 1.07, 1] }, { duration: 0.9 });
        M.animate(bubble, { opacity: [0, 1], scale: [0.4, 1.06, 1] }, { type: "spring", stiffness: 260, damping: 13 });
      } else {
        bubble.style.opacity = "1";
      }
      spinning = false;
    }
    $("#pick-spin").addEventListener("click", spin);
    if (!("IntersectionObserver" in window)) { say(at); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { io.disconnect(); setTimeout(spin, 300); }
    }, { threshold: 0.5 });
    io.observe(slot);
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

  // The launch sign-up: sends the form to Brevo with fetch (isAjax gives a JSON
  // answer) and shows the result in the note, so the visitor stays on the page.
  function initSignup() {
    document.querySelectorAll("form[data-signup]").forEach((form) => {
      const note = form.querySelector("[data-signup-note]");
      const button = form.querySelector("button");
      const original = note.innerHTML;
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        button.disabled = true;
        form.classList.remove("is-error");
        try {
          const url = form.action + (form.action.includes("?") ? "&" : "?") + "isAjax=1";
          const res = await fetch(url, { method: "POST", body: new URLSearchParams(new FormData(form)) });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error("not saved");
          form.classList.add("is-done");
          note.textContent = "Almost there. We've sent you an email: tap the link in it to confirm.";
        } catch (err) {
          form.classList.add("is-error");
          note.innerHTML = "That didn't go through. Please check your email address and try again. " + original.slice(original.indexOf("<a"));
          button.disabled = false;
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initSignup();
    initHeader();
    initMore();
    initFilm();
    initBoard();
    initReveal();
    initRail();
    initTaste();
    initHelix();
    initTags();
    initPick();
    initLooks();
    initWeights();
    initMeasurements();
    initTurn();
    initBilling();
    initCopy();
  });
})();
