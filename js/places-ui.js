// Yerler — Google Maps Takeout'tan içe aktarılan yerlerin görüntülenmesi.
// Veri: js/places.js (PLACES + PLACE_COUNTRIES) — auto-generated, GitHub'da public.
// Lokal state: aktif filtreler, son ziyaret edilen şehir.

(function () {
  const STATE = {
    currentCountry: null,
    currentCity: null,
    currentType: null,    // type filter inside city
    searchQuery: ""
  };

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const k in props) {
      if (k === "class") node.className = props[k];
      else if (k.startsWith("on") && typeof props[k] === "function") {
        node.addEventListener(k.slice(2).toLowerCase(), props[k]);
      } else if (k === "html") node.innerHTML = props[k];
      else node[k] = props[k];
    }
    for (const c of [].concat(children)) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  function placesIn(country, city) {
    const all = window.PLACES || [];
    return all.filter((p) => p.country === country && (city == null || p.city === city));
  }

  function searchPlaces(q) {
    const query = q.toLowerCase().trim();
    if (!query) return [];
    return (window.PLACES || []).filter((p) =>
      p.name.toLowerCase().includes(query) ||
      (p.address || "").toLowerCase().includes(query) ||
      (p.city || "").toLowerCase().includes(query) ||
      p.type.toLowerCase().includes(query)
    );
  }

  function openMaps(place) {
    // Google Maps app öncelikli; yoksa web. Universal link iOS Safari'de Maps app açar.
    const q = encodeURIComponent(place.name);
    const lat = place.lat, lng = place.lng;
    const url = `https://www.google.com/maps/search/?api=1&query=${q}&query_lat=${lat}&query_lng=${lng}`;
    window.open(url, "_blank");
  }

  function renderHome() {
    STATE.currentCountry = null;
    STATE.currentCity = null;
    const root = document.getElementById("places-tab");
    if (!root) return;
    root.innerHTML = "";

    root.appendChild(el("header", { class: "header doc-header" }, [
      el("h1", { class: "doc-title" }, "🗺 Yerler")
    ]));

    const search = el("input", {
      type: "search",
      class: "search-input",
      placeholder: "🔍 Yer / şehir ara...",
      value: STATE.searchQuery,
      autocomplete: "off",
      autocapitalize: "none",
      oninput: (e) => { STATE.searchQuery = e.target.value; renderResults(); }
    });
    root.appendChild(search);

    const total = (window.PLACES || []).length;
    if (total === 0) {
      root.appendChild(el("p", { class: "empty" }, [
        "Henüz yer eklenmedi.\n\n",
        "Google Takeout'tan indirdiğin Maps verilerini bu projeye koy, otomatik şehir/tip bazlı kategorize edeyim. "
      ]));
      return;
    }

    root.appendChild(el("p", { class: "doc-intro small" },
      `${total} yer • ülkeye dokun → şehir → yer`));

    const results = el("section", { id: "places-results", style: "display:none" });
    root.appendChild(results);

    const home = el("section", { id: "places-home" });
    const list = el("div", { class: "doc-categories" });
    const countries = window.PLACE_COUNTRIES || [];
    for (const c of countries) {
      const flag = c.code === "KR" ? "🇰🇷" : c.code === "JP" ? "🇯🇵" : c.code === "UZ" ? "🇺🇿" : "🏳";
      const row = el("div", {
        class: "doc-category-row",
        onclick: () => openCountry(c.code)
      }, [
        el("span", { class: "doc-cat-icon" }, flag),
        el("span", { class: "doc-cat-name" }, c.label),
        el("span", { class: "doc-cat-count" }, `${c.total} yer`),
        el("span", { class: "doc-cat-arrow" }, "›")
      ]);
      list.appendChild(row);
    }
    home.appendChild(list);
    root.appendChild(home);

    if (STATE.searchQuery.trim()) renderResults();
  }

  function renderResults() {
    const home = document.getElementById("places-home");
    const results = document.getElementById("places-results");
    if (!results) return;
    if (!STATE.searchQuery.trim()) {
      home.style.display = "block";
      results.style.display = "none";
      results.innerHTML = "";
      return;
    }
    home.style.display = "none";
    results.style.display = "block";
    results.innerHTML = "";

    const matches = searchPlaces(STATE.searchQuery);
    results.appendChild(el("h3", { class: "section-heading" },
      `Arama: "${STATE.searchQuery}" (${matches.length})`));
    if (matches.length === 0) {
      results.appendChild(el("p", { class: "empty" }, "Eşleşen yer yok."));
      return;
    }
    const list = el("div", { class: "places-list" });
    for (const p of matches) list.appendChild(renderPlaceCard(p, /*showCity*/true));
    results.appendChild(list);
  }

  function openCountry(code) {
    STATE.currentCountry = code;
    STATE.currentCity = null;
    renderCountryView();
  }

  function renderCountryView() {
    const root = document.getElementById("places-tab");
    root.innerHTML = "";
    const c = (window.PLACE_COUNTRIES || []).find((x) => x.code === STATE.currentCountry);
    if (!c) { renderHome(); return; }

    root.appendChild(el("header", { class: "header doc-header" }, [
      el("button", { class: "back-btn", type: "button", onclick: renderHome }, "←"),
      el("h2", { class: "doc-title" }, c.label)
    ]));

    root.appendChild(el("p", { class: "doc-intro small" }, `${c.total} yer • şehre dokun`));

    const list = el("div", { class: "doc-categories" });
    for (const city of c.cities) {
      list.appendChild(el("div", {
        class: "doc-category-row",
        onclick: () => openCity(c.code, city.name)
      }, [
        el("span", { class: "doc-cat-icon" }, "📍"),
        el("span", { class: "doc-cat-name" }, city.name),
        el("span", { class: "doc-cat-count" }, `${city.count} yer`),
        el("span", { class: "doc-cat-arrow" }, "›")
      ]));
    }
    root.appendChild(list);
  }

  function openCity(country, city) {
    STATE.currentCountry = country;
    STATE.currentCity = city;
    STATE.currentType = null;
    renderCityView();
  }

  function renderCityView() {
    const root = document.getElementById("places-tab");
    root.innerHTML = "";
    const country = STATE.currentCountry, city = STATE.currentCity;

    root.appendChild(el("header", { class: "header doc-header" }, [
      el("button", { class: "back-btn", type: "button", onclick: () => { STATE.currentCity = null; renderCountryView(); } }, "←"),
      el("h2", { class: "doc-title" }, `📍 ${city}`)
    ]));

    const all = placesIn(country, city);
    if (all.length === 0) {
      root.appendChild(el("p", { class: "empty" }, "Bu şehirde yer yok."));
      return;
    }

    // Type filter chips
    const typeCounts = new Map();
    for (const p of all) {
      const k = p.type;
      typeCounts.set(k, (typeCounts.get(k) || 0) + 1);
    }
    const chips = el("div", { class: "type-chips" });
    chips.appendChild(el("button", {
      class: "chip" + (STATE.currentType == null ? " active" : ""),
      type: "button",
      onclick: () => { STATE.currentType = null; renderCityView(); }
    }, `Hepsi (${all.length})`));
    for (const [type, count] of typeCounts) {
      const sample = all.find((p) => p.type === type);
      const emoji = sample ? sample.typeEmoji : "📍";
      chips.appendChild(el("button", {
        class: "chip" + (STATE.currentType === type ? " active" : ""),
        type: "button",
        onclick: () => { STATE.currentType = type; renderCityView(); }
      }, `${emoji} ${type} (${count})`));
    }
    root.appendChild(chips);

    const filtered = STATE.currentType ? all.filter((p) => p.type === STATE.currentType) : all;
    const list = el("div", { class: "places-list" });
    for (const p of filtered) list.appendChild(renderPlaceCard(p, false));
    root.appendChild(list);
  }

  function renderPlaceCard(p, showCity) {
    const card = el("article", { class: "place-card" });
    card.appendChild(el("div", { class: "place-emoji" }, p.typeEmoji));

    const info = el("div", { class: "place-info" });
    info.appendChild(el("div", { class: "place-name" }, p.name));
    const meta = [p.type];
    if (showCity && p.city) meta.unshift(p.city);
    info.appendChild(el("div", { class: "place-meta" }, meta.join(" • ")));
    if (p.comment) {
      info.appendChild(el("div", { class: "place-comment" }, "💬 " + p.comment));
    }
    card.appendChild(info);

    card.appendChild(el("button", {
      class: "primary-btn small place-go-btn",
      type: "button",
      onclick: (e) => { e.stopPropagation(); openMaps(p); }
    }, "Git ›"));

    return card;
  }

  function init() {
    if (!STATE.currentCountry && !STATE.currentCity) {
      renderHome();
    } else if (STATE.currentCity) {
      renderCityView();
    } else {
      renderCountryView();
    }
  }

  window.Places = { init, renderHome };
})();
