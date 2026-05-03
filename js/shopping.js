// Alışveriş listesi — seed liste (data.js) + kullanıcının eklediği kalemler.
// Check/uncheck, ekle, sil — tümü localStorage'da, cihaz başına ayrı.

(function () {
  const KEY_CHECKED = "shopping.checked";
  const KEY_CUSTOM  = "shopping.custom";
  const KEY_REMOVED = "shopping.removed";

  const STATE = {
    checked: new Set(),
    custom:  [],
    removed: new Set()
  };

  function loadState() {
    try {
      STATE.checked = new Set(JSON.parse(localStorage.getItem(KEY_CHECKED) || "[]"));
      STATE.custom  = JSON.parse(localStorage.getItem(KEY_CUSTOM) || "[]");
      STATE.removed = new Set(JSON.parse(localStorage.getItem(KEY_REMOVED) || "[]"));
    } catch (e) { /* ignore */ }
  }

  function saveState() {
    localStorage.setItem(KEY_CHECKED, JSON.stringify([...STATE.checked]));
    localStorage.setItem(KEY_CUSTOM,  JSON.stringify(STATE.custom));
    localStorage.setItem(KEY_REMOVED, JSON.stringify([...STATE.removed]));
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

  function getAllItems() {
    const seed = (window.SHOPPING_LIST || []).filter((i) => !STATE.removed.has(i.id));
    return [...seed, ...STATE.custom];
  }

  function toggleCheck(id) {
    if (STATE.checked.has(id)) STATE.checked.delete(id);
    else STATE.checked.add(id);
    saveState();
    render();
  }

  function removeItem(id) {
    const customIdx = STATE.custom.findIndex((i) => i.id === id);
    if (customIdx >= 0) {
      STATE.custom.splice(customIdx, 1);
    } else {
      STATE.removed.add(id);
    }
    STATE.checked.delete(id);
    saveState();
    render();
  }

  function addItem(text) {
    text = (text || "").trim();
    if (!text) return;
    const id = "custom-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    STATE.custom.push({ id, text, emoji: "🛒" });
    saveState();
    render();
  }

  function clearChecked() {
    if (STATE.checked.size === 0) return;
    if (!confirm(`${STATE.checked.size} işaretli kalemi silmek istiyor musun?`)) return;
    for (const id of STATE.checked) {
      const customIdx = STATE.custom.findIndex((i) => i.id === id);
      if (customIdx >= 0) STATE.custom.splice(customIdx, 1);
      else STATE.removed.add(id);
    }
    STATE.checked.clear();
    saveState();
    render();
  }

  function render() {
    const root = document.getElementById("shopping-tab");
    if (!root) return;
    root.innerHTML = "";

    const all = getAllItems();
    const checkedCount = all.filter((i) => STATE.checked.has(i.id)).length;

    root.appendChild(el("header", { class: "header doc-header" }, [
      el("h1", { class: "doc-title" }, "🛍 Alışveriş"),
      checkedCount > 0
        ? el("button", {
            class: "secondary-btn small",
            type: "button",
            onclick: clearChecked
          }, `🗑 ${checkedCount} işaretli`)
        : null
    ]));

    // Inline add input
    const input = el("input", {
      type: "text",
      class: "search-input",
      placeholder: "+ Yeni ekle... (Enter ile kaydet)",
      autocomplete: "off",
      autocapitalize: "sentences"
    });
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const v = input.value;
        addItem(v);
        input.value = "";
      }
    });
    root.appendChild(input);

    root.appendChild(el("p", { class: "doc-intro small" },
      `${checkedCount} / ${all.length} alındı — alındıkça satıra dokunup işaretle`));

    if (all.length === 0) {
      root.appendChild(el("p", { class: "empty" },
        "Liste boş. Yukarıdan yeni kalem ekle."));
      return;
    }

    const list = el("div", { class: "shopping-list" });
    for (const item of all) {
      const isChecked = STATE.checked.has(item.id);
      const row = el("div", {
        class: "shopping-item" + (isChecked ? " checked" : ""),
        onclick: () => toggleCheck(item.id)
      }, [
        el("span", { class: "shopping-checkbox" }, isChecked ? "☑" : "☐"),
        el("span", { class: "shopping-emoji" }, item.emoji || "🛒"),
        el("span", { class: "shopping-text" }, item.text),
        el("button", {
          class: "icon-btn shopping-remove",
          type: "button",
          title: "Listeden sil",
          onclick: (e) => { e.stopPropagation(); removeItem(item.id); }
        }, "🗑")
      ]);
      list.appendChild(row);
    }
    root.appendChild(list);
  }

  function init() {
    loadState();
    render();
  }

  window.Shopping = { init, render };
})();
