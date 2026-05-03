// Sözlük (Phrasebook) — render + arama + favoriler + dil toggle.

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
    searchQuery: ""
  };

  function loadState() {
    try {
      const langs = JSON.parse(localStorage.getItem("phrasebook.langs") || "null");
      if (Array.isArray(langs)) STATE.activeLangs = new Set(langs);
      const favs = JSON.parse(localStorage.getItem("phrasebook.favorites") || "null");
      if (Array.isArray(favs)) STATE.favorites = new Set(favs);
    } catch (e) { /* ignore */ }
  }

  function saveLangs() {
    localStorage.setItem("phrasebook.langs", JSON.stringify([...STATE.activeLangs]));
  }
  function saveFavorites() {
    localStorage.setItem("phrasebook.favorites", JSON.stringify([...STATE.favorites]));
  }

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const k in props) {
      if (k === "class") node.className = props[k];
      else if (k === "dataset") Object.assign(node.dataset, props[k]);
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

  function renderLangToggles(container) {
    const wrap = el("div", { class: "lang-toggles" });
    for (const lang of LANGS) {
      const active = STATE.activeLangs.has(lang);
      const { flag, label } = LANG_LABELS[lang];
      const btn = el("button", {
        class: "lang-btn" + (active ? " active" : ""),
        type: "button",
        onclick: () => {
          if (STATE.activeLangs.has(lang)) STATE.activeLangs.delete(lang);
          else STATE.activeLangs.add(lang);
          saveLangs();
          rerender();
        }
      }, `${flag} ${label}`);
      wrap.appendChild(btn);
    }
    container.appendChild(wrap);
  }

  function renderSearch(container) {
    const input = el("input", {
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
    container.appendChild(input);
  }

  function renderHomeGrid(container) {
    const grid = el("div", { class: "category-grid" });
    for (const cat of CATEGORIES) {
      const isEmergency = cat.emergency;
      const card = el("button", {
        class: "category-card" + (isEmergency ? " emergency" : "") + (cat.slug === "favorites" ? " favorites" : ""),
        type: "button",
        onclick: () => openCategory(cat.slug)
      }, [
        el("span", { class: "category-icon" }, cat.icon),
        el("span", { class: "category-name" }, cat.name)
      ]);
      grid.appendChild(card);
    }
    container.appendChild(grid);
  }

  function renderCategoryView(slug) {
    const cat = getCategoryById(slug);
    if (!cat) return;
    const list = getPhrasesForCategory(slug);

    const root = document.getElementById("phrasebook-results");
    root.innerHTML = "";

    const header = el("div", { class: "category-header" }, [
      el("button", {
        class: "back-btn",
        type: "button",
        onclick: () => { window.location.hash = ""; rerender(); }
      }, "←"),
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

    const top = el("div", { class: "phrase-top" }, [
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
    ]);
    card.appendChild(top);

    const langWrap = el("div", { class: "phrase-langs" });
    for (const lang of LANGS) {
      if (!STATE.activeLangs.has(lang)) continue;
      const text = p[lang];
      if (!text) continue;
      const row = el("div", { class: "phrase-row" }, [
        el("span", { class: "phrase-flag" }, LANG_LABELS[lang].flag),
        el("span", { class: "phrase-text" }, text),
        el("button", {
          class: "speak-btn",
          type: "button",
          title: "Sesli oku",
          onclick: () => TTS.speak(text, lang)
        }, "🔊")
      ]);
      langWrap.appendChild(row);
    }
    card.appendChild(langWrap);
    return card;
  }

  function renderResultsArea() {
    const results = document.getElementById("phrasebook-results");
    if (!results) return;
    if (STATE.searchQuery.trim()) {
      const matches = searchPhrases(STATE.searchQuery);
      results.innerHTML = "";
      const head = el("h2", { class: "category-title" }, `Arama: "${STATE.searchQuery}" (${matches.length})`);
      results.appendChild(head);
      if (matches.length === 0) {
        results.appendChild(el("p", { class: "empty" }, "Eşleşen kelime bulunamadı."));
        return;
      }
      const cards = el("div", { class: "phrase-list" });
      for (const p of matches) cards.appendChild(renderPhraseCard(p));
      results.appendChild(cards);
      const home = document.getElementById("phrasebook-home");
      if (home) home.style.display = "none";
      results.style.display = "block";
    } else {
      results.innerHTML = "";
      results.style.display = "none";
      const home = document.getElementById("phrasebook-home");
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
    const cat = getCurrentCategory();
    const home = document.getElementById("phrasebook-home");
    const results = document.getElementById("phrasebook-results");
    if (cat) {
      home.style.display = "none";
      results.style.display = "block";
      renderCategoryView(cat);
    } else if (STATE.searchQuery.trim()) {
      renderResultsArea();
    } else {
      home.style.display = "block";
      results.style.display = "none";
      // home grid stays static, just refresh in case favorites changed
    }
  }

  function init() {
    loadState();

    const root = document.getElementById("phrasebook-tab");
    root.innerHTML = "";

    const header = el("header", { class: "header" });
    renderLangToggles(header);
    renderSearch(header);
    root.appendChild(header);

    const home = el("section", { id: "phrasebook-home" });
    renderHomeGrid(home);
    root.appendChild(home);

    const results = el("section", { id: "phrasebook-results", style: "display:none" });
    root.appendChild(results);

    window.addEventListener("hashchange", rerender);
    rerender();
  }

  window.Phrasebook = { init, rerender };
})();
