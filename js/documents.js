// Belgelerim — IndexedDB tabanlı yerel belge cüzdanı.
// Gruplar (uçuş/otel slot'ları), kategori sıralama.
// Hiçbir veri sunucuya/web'e gönderilmez (yine de cihaz Face ID/passcode'u
// telefonun kendi koruması olarak iş görür).

(function () {
  const STATE = {
    currentCategory: null,
    currentGroup: null,    // groupName when viewing inside a group
    pendingCategory: null,
    pendingGroup: null,
    editMode: false,
    categoryOrder: []
  };

  function loadOrder() {
    try {
      const o = JSON.parse(localStorage.getItem("documents.categoryOrder") || "null");
      if (Array.isArray(o)) STATE.categoryOrder = o;
    } catch (e) {}
  }
  function saveOrder() {
    localStorage.setItem("documents.categoryOrder", JSON.stringify(STATE.categoryOrder));
  }

  function getOrderedDocCategories() {
    const all = DOC_CATEGORIES;
    const seen = new Set();
    const ordered = [];
    for (const slug of STATE.categoryOrder) {
      const c = all.find((x) => x.slug === slug);
      if (c && !seen.has(slug)) { ordered.push(c); seen.add(slug); }
    }
    for (const c of all) {
      if (!seen.has(c.slug)) { ordered.push(c); seen.add(c.slug); }
    }
    return ordered;
  }

  function moveDocCategory(slug, direction) {
    const ordered = getOrderedDocCategories().map((c) => c.slug);
    const i = ordered.indexOf(slug);
    if (i < 0) return;
    const j = i + direction;
    if (j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    STATE.categoryOrder = ordered;
    saveOrder();
    renderHome();
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

  function fmtSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getDocCategoryById(slug) {
    return DOC_CATEGORIES.find((c) => c.slug === slug);
  }

  // ---------- Home (category list) ----------

  async function renderHome() {
    STATE.currentCategory = null;
    STATE.currentGroup = null;
    const root = document.getElementById("documents-tab");
    root.innerHTML = "";

    root.appendChild(el("header", { class: "header doc-header" }, [
      el("h1", { class: "doc-title" }, "🛂 Belgelerim"),
      el("button", {
        class: "edit-toggle" + (STATE.editMode ? " active" : ""),
        type: "button",
        onclick: () => { STATE.editMode = !STATE.editMode; renderHome(); }
      }, STATE.editMode ? "✓ Bitti" : "✏️ Düzenle")
    ]));

    root.appendChild(el("p", { class: "doc-intro" }, "Tüm belgeler sadece bu telefonda. Web'e veya bulut'a gönderilmez."));

    const counts = await DB.countByCategory();
    const ordered = getOrderedDocCategories();

    const list = el("div", { class: "doc-categories" });
    ordered.forEach((cat, idx) => {
      const count = counts[cat.slug] || 0;
      const row = el("div", {
        class: "doc-category-row" + (STATE.editMode ? " edit-mode" : ""),
        onclick: STATE.editMode ? null : () => openDocCategory(cat.slug)
      }, [
        el("span", { class: "doc-cat-icon" }, cat.icon),
        el("span", { class: "doc-cat-name" }, cat.name),
        el("span", { class: "doc-cat-count" }, count > 0 ? `${count} belge` : ""),
        STATE.editMode ? null : el("span", { class: "doc-cat-arrow" }, "›")
      ]);
      if (STATE.editMode) {
        const ctrls = el("div", { class: "row-controls" });
        if (idx > 0) ctrls.appendChild(el("button", {
          class: "move-btn",
          type: "button",
          onclick: (e) => { e.stopPropagation(); moveDocCategory(cat.slug, -1); }
        }, "↑"));
        if (idx < ordered.length - 1) ctrls.appendChild(el("button", {
          class: "move-btn",
          type: "button",
          onclick: (e) => { e.stopPropagation(); moveDocCategory(cat.slug, +1); }
        }, "↓"));
        row.appendChild(ctrls);
      }
      list.appendChild(row);
    });
    root.appendChild(list);
  }

  // ---------- Category view (groups + ungrouped docs) ----------

  async function openDocCategory(slug) {
    STATE.currentCategory = slug;
    STATE.currentGroup = null;
    await renderCategory(slug);
  }

  async function renderCategory(slug) {
    const cat = getDocCategoryById(slug);
    if (!cat) return;

    const root = document.getElementById("documents-tab");
    root.innerHTML = "";

    root.appendChild(el("header", { class: "header doc-header" }, [
      el("button", { class: "back-btn", type: "button", onclick: renderHome }, "←"),
      el("h2", { class: "doc-title" }, `${cat.icon} ${cat.name}`),
      el("button", { class: "primary-btn small", type: "button", onclick: () => triggerAdd(slug, null) }, "➕ Ekle")
    ]));

    const docs = await DB.getDocumentsByCategory(slug);
    if (docs.length === 0) {
      root.appendChild(el("p", { class: "empty" }, "Bu kategoride henüz belge yok. ➕ Ekle ile başla."));
      return;
    }

    // Group documents
    const groups = new Map();
    const ungrouped = [];
    for (const d of docs) {
      if (d.groupName) {
        if (!groups.has(d.groupName)) groups.set(d.groupName, []);
        groups.get(d.groupName).push(d);
      } else {
        ungrouped.push(d);
      }
    }

    if (groups.size > 0) {
      root.appendChild(el("h3", { class: "section-heading" }, "Gruplar"));
      const groupList = el("div", { class: "doc-categories" });
      for (const [name, ds] of groups) {
        groupList.appendChild(el("div", {
          class: "doc-category-row",
          onclick: () => openGroup(slug, name)
        }, [
          el("span", { class: "doc-cat-icon" }, "📁"),
          el("span", { class: "doc-cat-name" }, name),
          el("span", { class: "doc-cat-count" }, `${ds.length} dosya`),
          el("span", { class: "doc-cat-arrow" }, "›")
        ]));
      }
      root.appendChild(groupList);
    }

    if (ungrouped.length > 0) {
      if (groups.size > 0) {
        root.appendChild(el("h3", { class: "section-heading" }, "Etiketsiz"));
      }
      const list = el("div", { class: "doc-list" });
      for (const d of ungrouped) list.appendChild(await renderDocCard(d, () => renderCategory(slug)));
      root.appendChild(list);
    }
  }

  // ---------- Group view ----------

  async function openGroup(category, groupName) {
    STATE.currentCategory = category;
    STATE.currentGroup = groupName;
    await renderGroupView(category, groupName);
  }

  async function renderGroupView(category, groupName) {
    const cat = getDocCategoryById(category);
    const root = document.getElementById("documents-tab");
    root.innerHTML = "";

    root.appendChild(el("header", { class: "header doc-header" }, [
      el("button", { class: "back-btn", type: "button", onclick: () => renderCategory(category) }, "←"),
      el("h2", { class: "doc-title group-title" }, [
        el("span", { class: "doc-cat-icon" }, "📁"),
        " " + groupName
      ]),
      el("button", { class: "primary-btn small", type: "button", onclick: () => triggerAdd(category, groupName) }, "➕ Ekle")
    ]));

    root.appendChild(el("p", { class: "doc-intro small" }, `${cat ? cat.name + " — " : ""}bu grupta toplanan dosyalar`));

    const all = await DB.getDocumentsByCategory(category);
    const docs = all.filter((d) => d.groupName === groupName);

    if (docs.length === 0) {
      root.appendChild(el("p", { class: "empty" }, "Bu grupta belge kalmadı."));
      return;
    }

    const list = el("div", { class: "doc-list" });
    for (const d of docs) list.appendChild(await renderDocCard(d, () => renderGroupView(category, groupName)));
    root.appendChild(list);
  }

  async function renderDocCard(doc, refresh) {
    const card = el("div", { class: "doc-card" });
    const isImage = doc.mimeType.startsWith("image/");
    const isPdf = doc.mimeType === "application/pdf";

    const thumb = el("div", { class: "doc-thumb" });
    if (isImage && doc.thumbnailBlob) {
      const img = el("img", { alt: doc.fileName });
      img.src = URL.createObjectURL(doc.thumbnailBlob);
      img.onload = () => URL.revokeObjectURL(img.src);
      thumb.appendChild(img);
    } else if (isPdf) {
      thumb.appendChild(el("span", { class: "doc-thumb-icon" }, "📄"));
    } else {
      thumb.appendChild(el("span", { class: "doc-thumb-icon" }, "📎"));
    }

    const info = el("div", { class: "doc-info" }, [
      el("div", { class: "doc-name" }, doc.fileName),
      el("div", { class: "doc-meta" }, fmtSize(doc.size) + (doc.note ? ` — ${doc.note}` : ""))
    ]);

    const actions = el("div", { class: "doc-actions" }, [
      el("button", { class: "icon-btn", type: "button", title: "Sil", onclick: async (e) => {
        e.stopPropagation();
        if (confirm(`"${doc.fileName}" silinsin mi?`)) {
          await DB.deleteDocument(doc.id);
          if (refresh) refresh();
        }
      }}, "🗑")
    ]);

    card.appendChild(thumb);
    card.appendChild(info);
    card.appendChild(actions);
    card.addEventListener("click", () => viewDocument(doc.id));
    return card;
  }

  // ---------- Adding documents (with group prompt) ----------

  function ensureFileInput() {
    let input = document.getElementById("doc-file-input");
    if (input) return input;
    input = el("input", {
      type: "file",
      id: "doc-file-input",
      accept: "image/*,application/pdf",
      multiple: true,
      style: "display:none"
    });
    document.body.appendChild(input);
    input.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      e.target.value = "";
      if (!files.length) return;
      await handleFilesSelected(files);
    });
    return input;
  }

  function triggerAdd(category, preselectedGroup) {
    STATE.pendingCategory = category;
    STATE.pendingGroup = preselectedGroup;
    ensureFileInput().click();
  }

  async function handleFilesSelected(files) {
    const category = STATE.pendingCategory;
    if (STATE.pendingGroup !== null && STATE.pendingGroup !== undefined) {
      await saveFiles(files, category, STATE.pendingGroup);
      return;
    }
    showGroupModal(category, files.length, async (groupName) => {
      await saveFiles(files, category, groupName);
    });
  }

  async function saveFiles(files, category, groupName) {
    for (const f of files) {
      try {
        await DB.addDocument({ file: f, category, groupName });
      } catch (e) {
        console.error("Belge eklenemedi:", e);
        alert("Belge eklenemedi: " + (e.message || e));
      }
    }
    if (STATE.currentGroup) await renderGroupView(category, STATE.currentGroup);
    else if (STATE.currentCategory) await renderCategory(category);
  }

  async function showGroupModal(category, fileCount, onConfirm) {
    const groups = await DB.getGroupsForCategory(category);
    const overlay = el("div", { class: "modal-overlay" });
    const modal = el("div", { class: "modal" });
    modal.appendChild(el("h3", {}, `${fileCount} dosya seçildi`));
    modal.appendChild(el("p", { class: "modal-info" }, "Bir etiket koyarsan dosyalar aynı grup altında düzenlenir (örn. \"İzmir-Samarkand uçuşu\", \"Seoul oteli\")."));

    const dlId = "group-suggestions-" + Date.now();
    const input = el("input", {
      type: "text",
      class: "modal-input",
      placeholder: "Etiket (opsiyonel)",
      list: dlId,
      autocomplete: "off"
    });
    const dl = el("datalist", { id: dlId });
    for (const g of groups) dl.appendChild(el("option", { value: g.name }));
    modal.appendChild(input);
    modal.appendChild(dl);

    if (groups.length > 0) {
      const chips = el("div", { class: "group-chips" });
      for (const g of groups) {
        chips.appendChild(el("button", {
          class: "chip",
          type: "button",
          onclick: () => { input.value = g.name; }
        }, `${g.name} (${g.count})`));
      }
      modal.appendChild(chips);
    }

    const btnRow = el("div", { class: "modal-btns" });
    btnRow.appendChild(el("button", {
      class: "secondary-btn",
      type: "button",
      onclick: () => { document.body.removeChild(overlay); onConfirm(null); }
    }, "Etiketsiz"));
    btnRow.appendChild(el("button", {
      class: "primary-btn",
      type: "button",
      onclick: () => {
        const name = input.value.trim() || null;
        document.body.removeChild(overlay);
        onConfirm(name);
      }
    }, "Kaydet"));
    modal.appendChild(btnRow);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setTimeout(() => input.focus(), 50);
  }

  // ---------- Viewer ----------

  async function viewDocument(id) {
    const doc = await DB.getDocument(id);
    if (!doc) return;
    const overlay = document.getElementById("doc-viewer");
    overlay.innerHTML = "";
    overlay.classList.remove("hidden");

    const url = URL.createObjectURL(doc.blob);
    const close = () => {
      URL.revokeObjectURL(url);
      overlay.classList.add("hidden");
      overlay.innerHTML = "";
    };

    overlay.appendChild(el("div", { class: "viewer-bar" }, [
      el("button", { class: "back-btn", type: "button", onclick: close }, "✕"),
      el("span", { class: "viewer-name" }, doc.fileName)
    ]));

    const body = el("div", { class: "viewer-body" });
    if (doc.mimeType.startsWith("image/")) {
      body.appendChild(el("img", { src: url, alt: doc.fileName, class: "viewer-img" }));
    } else if (doc.mimeType === "application/pdf") {
      body.appendChild(el("iframe", { src: url, class: "viewer-pdf", title: doc.fileName }));
      body.appendChild(el("a", { href: url, target: "_blank", class: "secondary-btn open-in-tab" }, "Yeni sekmede aç"));
    } else {
      body.appendChild(el("p", {}, "Bu dosya tipi önizlenemiyor."));
    }
    overlay.appendChild(body);
  }

  // ---------- Init ----------

  async function init() {
    loadOrder();
    STATE.currentCategory = null;
    STATE.currentGroup = null;
    await renderHome();
  }

  window.Documents = { init, renderHome };
})();
