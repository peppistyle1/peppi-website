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

  /* ---------- Home: the outfit demo ---------- */
  const GARMENT_PATHS = {
    tshirt: '<path d="M22 8 9 14 4 27l9 3 1 24h32l1-24 9-3-5-13-13-6q-8 9-16 0Z"/>',
    dress: '<path d="M23 5l1 16-13 34q19 4 38 0L36 21l1-16"/><path d="M23 5q7 8 14 0"/><path d="M24 21q6 3 12 0"/>',
    trousers: '<path d="M15 6h30l4 49H35l-5-33-5 33H11Z"/><path d="M15 12h30"/>',
    heel: '<path d="M3 49q1-8 12-8 12 0 21-11l9-6q8-2 8 7v6l-2 20h-3l-1-14q-16 4-31 10H7q-5 0-4-4Z"/><path d="M16 50q15-6 31-10"/>',
    handbag: '<path d="M10 25h40l4 29H6Z"/><path d="M20 25c0-17 20-17 20 0"/><path d="M26 34h8"/>',
    sunglasses: '<circle cx="17" cy="33" r="11"/><circle cx="43" cy="33" r="11"/><path d="M28 31q2-4 4 0"/><path d="M6 31 2 24"/><path d="M54 31l4-7"/>',
  };

  // label, garments, colors, drawing
  const o = (label, items, colors, art) => ({ label, items, colors, art });
  const OCCASIONS = [
    {
      id: "interview", name: "Job Interview", category: "Professional", formality: 7,
      women: [
        o("Classic", ["Navy tailored blazer", "Cream silk blouse", "Navy straight trousers", "Black leather loafers"], ["#1F2A44", "#F2E8D5", "#1A1A1A"], "trousers"),
        o("Modern minimal", ["Charcoal knit midi dress", "Camel long coat", "Black block-heel pumps", "Structured tote"], ["#3B3F45", "#C19A6B", "#1A1A1A"], "dress"),
        o("Relaxed formal", ["Soft grey trouser suit", "White crew-neck tee", "White leather sneakers", "Small silver hoops"], ["#9AA0A8", "#F7F7F5", "#C9CCD1"], "trousers"),
      ],
      men: [
        o("Classic", ["Navy two-button suit", "White poplin shirt", "Burgundy silk tie", "Dark brown Oxford shoes"], ["#1F2A44", "#FFFFFF", "#6D1A2B"], "trousers"),
        o("Smart casual", ["Grey wool blazer", "Light blue Oxford shirt", "Charcoal chinos", "Brown suede loafers"], ["#8C9096", "#A9C7E8", "#3B3F45"], "tshirt"),
        o("Relaxed formal", ["Navy merino crew-neck", "Collared shirt underneath", "Stone wool trousers", "Black Derby shoes"], ["#23314F", "#D9CFC1", "#1A1A1A"], "tshirt"),
      ],
    },
    {
      id: "date", name: "First Date", category: "Dating & Social", formality: 5,
      women: [
        o("Romantic", ["Floral wrap midi dress", "Cropped denim jacket", "Strappy block heels", "Small crossbody bag"], ["#D86A8B", "#F3D9E1", "#4A6FA5"], "dress"),
        o("Bold", ["Red satin camisole", "High-waisted black jeans", "Pointed ankle boots", "Gold hoops"], ["#C62828", "#1A1A1A", "#D4AF37"], "heel"),
        o("Relaxed", ["Cream cable-knit sweater", "Light-wash straight jeans", "White sneakers", "Tan shoulder bag"], ["#EFE6D2", "#9DB6D4", "#C19A6B"], "handbag"),
      ],
      men: [
        o("Classic", ["Navy overshirt", "White T-shirt", "Dark selvedge jeans", "Brown Chelsea boots"], ["#23314F", "#FFFFFF", "#2E3A59"], "tshirt"),
        o("Bold", ["Burgundy corduroy jacket", "Black knit polo", "Black slim trousers", "Black leather boots"], ["#6D1A2B", "#1A1A1A", "#3B3F45"], "tshirt"),
        o("Relaxed", ["Olive linen shirt", "Beige chinos", "White canvas sneakers", "Leather-strap watch"], ["#6B7B4B", "#D8C8A8", "#FFFFFF"], "trousers"),
      ],
    },
    {
      id: "wedding", name: "Wedding Guest", category: "Formal & Celebrations", formality: 8,
      women: [
        o("Classic", ["Sage satin slip dress", "Cream wrap shawl", "Nude strappy heels", "Pearl clutch"], ["#A7B89A", "#F2E8D5", "#E3C7B0"], "dress"),
        o("Bold", ["Cobalt one-shoulder gown", "Gold drop earrings", "Metallic sandals", "Box clutch"], ["#1E4FBF", "#D4AF37", "#C0C0C0"], "dress"),
        o("Modern", ["Blush wide-leg jumpsuit", "Tailored ivory blazer", "Block-heel mules", "Gold cuff"], ["#E8B4B8", "#F5F0E6", "#D4AF37"], "trousers"),
      ],
      men: [
        o("Classic", ["Charcoal three-piece suit", "Pale pink shirt", "Navy patterned tie", "Black Oxford shoes"], ["#3B3F45", "#F4CCD4", "#23314F"], "trousers"),
        o("Bold", ["Midnight velvet dinner jacket", "Black tuxedo trousers", "White wing-collar shirt", "Patent leather shoes"], ["#1B2340", "#1A1A1A", "#FFFFFF"], "tshirt"),
        o("Relaxed formal", ["Light grey linen suit", "White open-collar shirt", "Tan suede loafers", "Silk pocket square"], ["#B9BEC5", "#FFFFFF", "#C19A6B"], "trousers"),
      ],
    },
    {
      id: "family", name: "Family Gathering", category: "Family & Culture", formality: 4,
      women: [
        o("Relaxed", ["Striped Breton top", "Cream wide-leg trousers", "Leather ballet flats", "Straw tote"], ["#23314F", "#F2E8D5", "#C9A66B"], "trousers"),
        o("Classic", ["Camel knit cardigan", "Denim shirt dress", "Brown ankle boots", "Silk scarf"], ["#C19A6B", "#6F8FB8", "#6B4A2E"], "dress"),
        o("Bold", ["Mustard midi skirt", "Black fitted turtleneck", "Knee-high boots", "Gold pendant"], ["#D9A52B", "#1A1A1A", "#5A3B28"], "handbag"),
      ],
      men: [
        o("Relaxed", ["Grey quarter-zip sweater", "Dark chinos", "White leather sneakers", "Canvas belt"], ["#8C9096", "#2E3A59", "#FFFFFF"], "tshirt"),
        o("Classic", ["Blue gingham shirt", "Navy V-neck sweater", "Stone chinos", "Brown loafers"], ["#6F8FB8", "#23314F", "#D8C8A8"], "tshirt"),
        o("Bold", ["Forest green corduroy shirt", "Cream trousers", "Tan Chelsea boots", "Brown leather belt"], ["#2F4F3A", "#EFE6D2", "#A0703A"], "trousers"),
      ],
    },
    {
      id: "travel", name: "Travel / Airport", category: "Leisure & Lifestyle", formality: 3,
      women: [
        o("Comfortable", ["Black knit joggers", "Oversized grey hoodie", "Chunky sneakers", "Crossbody belt bag"], ["#1A1A1A", "#9AA0A8", "#FFFFFF"], "trousers"),
        o("Polished", ["Camel trench coat", "White long-sleeve tee", "Straight dark jeans", "Leather weekender"], ["#C19A6B", "#FFFFFF", "#2E3A59"], "handbag"),
        o("Layered", ["Denim jacket", "Striped tee", "Black leggings", "Slip-on sneakers"], ["#6F8FB8", "#F2F2F2", "#1A1A1A"], "tshirt"),
      ],
      men: [
        o("Comfortable", ["Navy tech joggers", "Grey merino tee", "Light running shoes", "Packable puffer vest"], ["#23314F", "#9AA0A8", "#E8E8E8"], "trousers"),
        o("Polished", ["Olive bomber jacket", "White Oxford shirt", "Dark stretch chinos", "Leather sneakers"], ["#6B7B4B", "#FFFFFF", "#2E3A59"], "tshirt"),
        o("Layered", ["Fleece quarter-zip", "Black tee", "Cargo trousers", "Suede trail shoes"], ["#C8BBA6", "#1A1A1A", "#5C6B4E"], "tshirt"),
      ],
    },
    {
      id: "steampunk", name: "Steampunk & Victorian Fantasy", category: "Alternative & Expressive", formality: 6,
      women: [
        o("Victorian", ["Brocade corset vest", "Ruffled ivory blouse", "Brown bustle skirt", "Lace-up heeled boots"], ["#6B3E26", "#F2E8D5", "#B08D57"], "dress"),
        o("Adventurer", ["Leather utility harness", "Cream linen shirt", "Tan riding trousers", "Brass goggles"], ["#8B5A2B", "#EFE6D2", "#B5A642"], "sunglasses"),
        o("Bold", ["Burgundy velvet tailcoat", "Black high-neck blouse", "Pinstriped skirt", "Mini top hat"], ["#6D1A2B", "#1A1A1A", "#B08D57"], "heel"),
      ],
      men: [
        o("Victorian", ["Brown tweed waistcoat", "Collarless white shirt", "Pinstriped trousers", "Pocket watch on a chain"], ["#6B4A2E", "#FFFFFF", "#B08D57"], "tshirt"),
        o("Adventurer", ["Long leather duster coat", "Cream henley", "Canvas cargo trousers", "Brass goggles"], ["#5A3B28", "#EFE6D2", "#B5A642"], "sunglasses"),
        o("Bold", ["Oxblood frock coat", "Black brocade waistcoat", "Black top hat", "Buckled boots"], ["#5E1A1F", "#1A1A1A", "#B08D57"], "trousers"),
      ],
    },
  ];
  const WEATHER = { Morning: "11°C, partly cloudy", Midday: "17°C, sunny", Evening: "13°C, clear", Night: "9°C, clear" };
  const formalityWord = (v) => (v <= 2 ? "Very relaxed" : v <= 4 ? "Casual" : v <= 6 ? "Smart casual" : v <= 8 ? "Dressy" : "Black tie");

  function initDemo() {
    const grid = $("#demo-occasions");
    if (!grid) return;
    const state = { occ: OCCASIONS[2], wear: "women", day: "Tomorrow", time: "Evening", formality: 8, index: 0 };

    grid.innerHTML = OCCASIONS.map((occ) =>
      `<button type="button" class="occ" data-id="${occ.id}" aria-pressed="${occ === state.occ}"><small>${occ.category}</small><strong>${occ.name}</strong></button>`
    ).join("");

    const slider = $("#demo-formality");
    const sliderOut = $("#demo-formality-out");
    const card = $("#demo-card");
    const dots = $("#demo-dots");

    function renderContext() {
      sliderOut.textContent = `${state.formality} · ${formalityWord(state.formality)}`;
      $("#demo-context").textContent =
        `${state.occ.name} · ${state.day} · ${state.time} · Lisbon, Portugal · ${WEATHER[state.time]} · Formality ${state.formality}/10`;
    }

    function renderOutfit(animate) {
      const list = state.occ[state.wear];
      const outfit = list[state.index];
      const paint = () => {
        const [a, b, c] = outfit.colors;
        $("#demo-art").innerHTML =
          `<span style="background:${a}"></span><span style="background:${a}"></span><span style="background:${b}"></span><span style="background:${c}"></span>` +
          `<svg viewBox="0 0 60 60" aria-hidden="true" style="fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round">${GARMENT_PATHS[outfit.art]}</svg>` +
          `<button type="button" class="heart" aria-pressed="false" aria-label="Save this look"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>`;
        $("#demo-outfit-label").textContent = outfit.label;
        $("#demo-swatches").innerHTML = outfit.colors.map((col) => `<i style="background:${col}"></i>`).join("");
        $("#demo-items").innerHTML = outfit.items.map((it) => `<li>${it}</li>`).join("");
        $("#demo-count").textContent = `${state.index + 1} / ${list.length}`;
        dots.innerHTML = list.map((x, i) =>
          `<button type="button" aria-label="Outfit ${i + 1}: ${x.label}" aria-current="${i === state.index}"></button>`).join("");
        card.classList.remove("is-leaving");
      };
      if (animate && !reduceMotion) {
        card.classList.add("is-leaving");
        setTimeout(paint, 180);
      } else {
        paint();
      }
    }

    function go(delta) {
      const n = state.occ[state.wear].length;
      state.index = (state.index + delta + n) % n; // loops both ways, like the app
      renderOutfit(true);
    }

    grid.addEventListener("click", (e) => {
      const b = e.target.closest(".occ");
      if (!b) return;
      state.occ = OCCASIONS.find((x) => x.id === b.dataset.id);
      state.formality = state.occ.formality;
      slider.value = String(state.formality);
      state.index = 0;
      $$(".occ", grid).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      renderContext();
      renderOutfit(true);
    });
    segmented($("#demo-wear"), (v) => { state.wear = v; state.index = 0; renderOutfit(true); });
    segmented($("#demo-day"), (v) => { state.day = v; renderContext(); });
    segmented($("#demo-time"), (v) => { state.time = v; renderContext(); });
    slider.addEventListener("input", () => { state.formality = Number(slider.value); renderContext(); });
    $("#demo-prev").addEventListener("click", () => go(-1));
    $("#demo-next").addEventListener("click", () => go(1));
    dots.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      state.index = $$("button", dots).indexOf(b);
      renderOutfit(true);
    });
    card.addEventListener("click", (e) => {
      const heart = e.target.closest(".heart");
      if (heart) heart.setAttribute("aria-pressed", String(heart.getAttribute("aria-pressed") !== "true"));
    });
    // Swipe between outfits, as in the app.
    let startX = null;
    card.addEventListener("pointerdown", (e) => { startX = e.clientX; });
    card.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    });

    renderContext();
    renderOutfit(false);
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
    initDemo();
    initWeights();
    initMeasurements();
    initTurn();
    initBilling();
    initCopy();
  });
})();
