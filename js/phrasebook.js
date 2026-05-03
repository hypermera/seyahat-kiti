// Sözlük — render + arama + favoriler + dil toggle + kategori sıralama (edit mode).

(function () {
  const LANG_LABELS = {
    ko: { flag: "🇰🇷", label: "KR" },
    ja: { flag: "🇯🇵", label: "JP" },
    en: { flag: "🇬🇧", label: "EN" }
  };
  const LANGS = ["ko", "ja", "en"];

  const STATE = {
    activeLangs: new Set(["ko", "ja", "en"]),
    favorites: new Set(),
    searchQuery: "",
    categoryOrder: [],   // array of slugs
    editMode: false
  };

  function loadState() {
    try {
      const langs = JSON.parse(localStorage.getItem("phrasebook.langs") || "null");
      if (Array.isArray(langs)) STATE.activeLangs = new Set(langs);
      const favs = JSON.parse(localStorage.getItem("phrasebook.favorites") || "null");
      if (Array.isArray(favs)) STATE.favorites = new Set(favs);
      const order = JSON.parse(localStorage.getItem("phrasebook.categoryOrder") || "null");
      if (Array.isArray(order)) STATE.categoryOrder = order;
    } catch (e) { /* ignore */ }
  }

  function saveLangs() {
    localStorage.setItem("phrasebook.langs", JSON.stringify([...STATE.activeLangs]));
  }
  function saveFavorites() {
    localStorage.setItem("phrasebook.favorites", JSON.stringify([...STATE.favorites]));
  }
  function saveOrder() {
    localStorage.setItem("phrasebook.categoryOrder", JSON.stringify(STATE.categoryOrder));
  }

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

  function getOrderedCategories() {
    const all = CATEGORIES;
    const saved = STATE.categoryOrder;
    const seen = new Set();
    const ordered = [];
    for (const slug of saved) {
      const c = all.find((x) => x.slug === slug);
      if (c && !seen.has(slug)) { ordered.push(c); seen.add(slug); }
    }
    for (const c of all) {
      if (!seen.has(c.slug)) { ordered.push(c); seen.add(c.slug); }
    }
    return ordered;
  }

  function persistOrder(orderedSlugs) {
    STATE.categoryOrder = orderedSlugs;
    saveOrder();
  }

  function moveCategory(slug, direction) {
    const ordered = getOrderedCategories().map((c) => c.slug);
    const i = ordered.indexOf(slug);
    if (i < 0) return;
    const j = i + direction;
    if (j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    persistOrder(ordered);
    rerender();
  }

  function getCategoryById(slug) {
    return CATEGORIES.find((c) => c.slug === slug);
  }

  function getPhrasesForCategory(slug) {
    if (slug === "favorites") {
      return PHRASES.filter((p) => STATE.favorites.has(p.id));
    }
    return PHRASES.filter((p) => p.category === slug);
  }

  function searchPhrases(q) {
    const query = q.toLowerCase().trim();
    if (!query) return [];
    return PHRASES.filter((p) =>
      p.tr.toLowerCase().includes(query) ||
      p.en.toLowerCase().includes(query) ||
      p.ko.toLowerCase().includes(query) ||
      p.ja.toLowerCase().includes(query)
    );
  }

  function renderHeader(container) {
    const header = el("header", { class: "header" });

    const langs = el("div", { class: "lang-toggles" });
    for (const lang of LANGS) {
      const active = STATE.activeLangs.has(lang);
      const { flag, label } = LANG_LABELS[lang];
      langs.appendChild(el("button", {
        class: "lang-btn" + (active ? " active" : ""),
        type: "button",
        onclick: () => {
          if (STATE.activeLangs.has(lang)) STATE.activeLangs.delete(lang);
          else STATE.activeLangs.add(lang);
          saveLangs();
          rerender();
        }
      }, `${flag} ${label}`));
    }
    header.appendChild(langs);

    const search = el("input", {
      type: "search",
      class: "search-input",
      placeholder: "🔍 Ara...",
      value: STATE.searchQuery,
      autocomplete: "off",
      autocapitalize: "none",
      oninput: (e) => {
        STATE.searchQuery = e.target.value;
        renderResultsArea();
      }
    });
    header.appendChild(search);

    container.appendChild(header);
  }

  function renderHomeGrid(container) {
    const headerRow = el("div", { class: "home-actions" }, [
      el("h2", { class: "home-title" }, "Kategoriler"),
      el("button", {
        class: "edit-toggle" + (STATE.editMode ? " active" : ""),
        type: "button",
        onclick: () => { STATE.editMode = !STATE.editMode; rerender(); }
      }, STATE.editMode ? "✓ Bitti" : "✏️ Düzenle")
    ]);
    container.appendChild(headerRow);

    const ordered = getOrderedCategories();
    const grid = el("div", { class: "category-grid" + (STATE.editMode ? " edit-mode" : "") });
    ordered.forEach((cat, idx) => {
      const card = el("div", {
        class: "category-card" + (cat.emergency ? " emergency" : "") + (cat.slug === "favorites" ? " favorites" : ""),
        onclick: STATE.editMode ? null : () => openCategory(cat.slug)
      }, [
        el("span", { class: "category-icon" }, cat.icon),
        el("span", { class: "category-name" }, cat.name)
      ]);
      if (STATE.editMode) {
        const ctrls = el("div", { class: "card-controls" });
        if (idx > 0) {
          ctrls.appendChild(el("button", {
            class: "move-btn move-up",
            type: "button",
            onclick: (e) => { e.stopPropagation(); moveCategory(cat.slug, -1); }
          }, "↑"));
        }
        if (idx < ordered.length - 1) {
          ctrls.appendChild(el("button", {
            class: "move-btn move-down",
            type: "button",
            onclick: (e) => { e.stopPropagation(); moveCategory(cat.slug, +1); }
          }, "↓"));
        }
        card.appendChild(ctrls);
      }
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }

  function renderCategoryView(slug) {
    const cat = getCategoryById(slug);
    if (!cat) return;
    const list = getPhrasesForCategory(slug);

    const root = document.getElementById("phrasebook-results");
    root.innerHTML = "";

    const header = el("div", { class: "category-header" }, [
      el("button", { class: "back-btn", type: "button", onclick: () => { window.location.hash = ""; rerender(); } }, "←"),
      el("h2", { class: "category-title" }, `${cat.icon} ${cat.name}`)
    ]);
    root.appendChild(header);

    if (list.length === 0) {
      root.appendChild(el("p", { class: "empty" }, slug === "favorites"
        ? "Henüz favori yok. Cümle kartlarındaki ⭐ ile favorilere ekle."
        : "Bu kategoride henüz kelime yok."));
      return;
    }

    const cards = el("div", { class: "phrase-list" });
    for (const p of list) cards.appendChild(renderPhraseCard(p));
    root.appendChild(cards);
  }

  function renderPhraseCard(p) {
    const isFav = STATE.favorites.has(p.id);
    const card = el("article", { class: "phrase-card" });

    card.appendChild(el("div", { class: "phrase-top" }, [
      el("div", { class: "phrase-tr" }, p.tr),
      el("button", {
        class: "fav-btn" + (isFav ? " active" : ""),
        type: "button",
        title: isFav ? "Favoriden çıkar" : "Favoriye ekle",
        onclick: (e) => {
          e.stopPropagation();
          if (STATE.favorites.has(p.id)) STATE.favorites.delete(p.id);
          else STATE.favorites.add(p.id);
          saveFavorites();
          rerender();
        }
      }, isFav ? "⭐" : "☆")
    ]));

    const langWrap = el("div", { class: "phrase-langs" });
    for (const lang of LANGS) {
      if (!STATE.activeLangs.has(lang)) continue;
      const text = p[lang];
      if (!text) continue;
      langWrap.appendChild(el("div", { class: "phrase-row" }, [
        el("span", { class: "phrase-flag" }, LANG_LABELS[lang].flag),
        el("span", { class: "phrase-text" }, text)
      ]));
    }
    card.appendChild(langWrap);
    return card;
  }

  function renderResultsArea() {
    const results = document.getElementById("phrasebook-results");
    const home = document.getElementById("phrasebook-home");
    if (!results) return;
    if (STATE.searchQuery.trim()) {
      const matches = searchPhrases(STATE.searchQuery);
      results.innerHTML = "";
      results.appendChild(el("h2", { class: "category-title" }, `Arama: "${STATE.searchQuery}" (${matches.length})`));
      if (matches.length === 0) {
        results.appendChild(el("p", { class: "empty" }, "Eşleşen kelime bulunamadı."));
      } else {
        const cards = el("div", { class: "phrase-list" });
        for (const p of matches) cards.appendChild(renderPhraseCard(p));
        results.appendChild(cards);
      }
      if (home) home.style.display = "none";
      results.style.display = "block";
    } else {
      results.innerHTML = "";
      results.style.display = "none";
      if (home) home.style.display = "block";
    }
  }

  function openCategory(slug) {
    window.location.hash = `cat/${encodeURIComponent(slug)}`;
    rerender();
  }

  function getCurrentCategory() {
    const m = window.location.hash.match(/^#cat\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function rerender() {
    const root = document.getElementById("phrasebook-tab");
    root.innerHTML = "";
    renderHeader(root);

    const home = el("section", { id: "phrasebook-home" });
    renderHomeGrid(home);
    root.appendChild(home);

    const results = el("section", { id: "phrasebook-results", style: "display:none" });
    root.appendChild(results);

    const cat = getCurrentCategory();
    if (cat) {
      home.style.display = "none";
      results.style.display = "block";
      renderCategoryView(cat);
    } else if (STATE.searchQuery.trim()) {
      renderResultsArea();
    }
  }

  function init() {
    loadState();
    rerender();
    window.addEventListener("hashchange", rerender);
  }

  window.Phrasebook = { init, rerender };
})();
