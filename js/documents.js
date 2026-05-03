// Belgelerim — IndexedDB tabanlı yerel belge cüzdanı.
// Hiçbir veri sunucuya/web'e gönderilmez.

(function () {
  const STATE = {
    unlocked: false,
    currentCategory: null,
    pendingCategory: null
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

  function fmtSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getDocCategoryById(slug) {
    return DOC_CATEGORIES.find((c) => c.slug === slug);
  }

  // ---------- Lock screen ----------

  async function showLockScreen() {
    const overlay = document.getElementById("lock-screen");
    overlay.innerHTML = "";
    overlay.classList.remove("hidden");

    const isSet = await Auth.isPinSet();
    if (!isSet) {
      renderPinSetup(overlay);
      return;
    }

    renderUnlock(overlay);
  }

  function hideLockScreen() {
    const overlay = document.getElementById("lock-screen");
    overlay.classList.add("hidden");
    overlay.innerHTML = "";
  }

  function renderPinSetup(overlay) {
    const card = el("div", { class: "lock-card" });
    card.appendChild(el("h2", {}, "🔐 Belgelerim için PIN belirle"));
    card.appendChild(el("p", { class: "lock-info" }, "Bu PIN sadece senin telefonunda saklanır. Belgelerim her açılışta bunu soracak. 4-6 rakam."));

    const input1 = el("input", { type: "password", inputmode: "numeric", pattern: "[0-9]*", maxLength: 6, class: "pin-input", placeholder: "Yeni PIN" });
    const input2 = el("input", { type: "password", inputmode: "numeric", pattern: "[0-9]*", maxLength: 6, class: "pin-input", placeholder: "Tekrar" });
    const msg = el("p", { class: "lock-msg" });
    const btn = el("button", { class: "primary-btn", type: "button", onclick: async () => {
      const a = input1.value, b = input2.value;
      if (!/^\d{4,6}$/.test(a)) { msg.textContent = "PIN 4-6 rakam olmalı."; return; }
      if (a !== b) { msg.textContent = "PIN'ler eşleşmiyor."; return; }
      await Auth.setupPin(a);
      msg.textContent = "PIN kaydedildi.";

      // Offer Face ID enrollment
      if (Auth.canUseWebAuthn()) {
        msg.textContent = "PIN kaydedildi. Face ID/Touch ID kuruluyor...";
        try {
          await Auth.registerWebAuthn();
          msg.textContent = "Face ID kaydedildi ✓";
        } catch (e) {
          msg.textContent = "Face ID atlandı, PIN ile devam ediyoruz.";
        }
      }
      STATE.unlocked = true;
      hideLockScreen();
      renderHome();
    }}, "PIN'i Kaydet");

    card.appendChild(input1);
    card.appendChild(input2);
    card.appendChild(btn);
    card.appendChild(msg);
    overlay.appendChild(card);
    setTimeout(() => input1.focus(), 50);
  }

  async function renderUnlock(overlay) {
    const card = el("div", { class: "lock-card" });
    card.appendChild(el("h2", {}, "🔐 Belgelerim"));
    card.appendChild(el("p", { class: "lock-info" }, "Belgelerine erişmek için kimliğini doğrula."));

    const msg = el("p", { class: "lock-msg" });
    const pinInput = el("input", { type: "password", inputmode: "numeric", pattern: "[0-9]*", maxLength: 6, class: "pin-input", placeholder: "PIN" });

    const submit = async () => {
      const r = await Auth.verifyPin(pinInput.value);
      if (r.locked) {
        msg.textContent = `Çok fazla yanlış. ${r.remaining} sn bekle.`;
        return;
      }
      if (r.ok) {
        STATE.unlocked = true;
        hideLockScreen();
        renderHome();
      } else {
        const remaining = await Auth.getLockoutSeconds();
        msg.textContent = remaining > 0
          ? `Yanlış PIN. ${remaining} sn bekle.`
          : "Yanlış PIN.";
        pinInput.value = "";
      }
    };

    pinInput.addEventListener("keypress", (e) => { if (e.key === "Enter") submit(); });

    const pinBtn = el("button", { class: "primary-btn", type: "button", onclick: submit }, "Aç");

    card.appendChild(pinInput);
    card.appendChild(pinBtn);

    if (Auth.canUseWebAuthn() && (await Auth.hasWebAuthn())) {
      const faceBtn = el("button", { class: "secondary-btn", type: "button", onclick: async () => {
        msg.textContent = "Face ID isteniyor...";
        try {
          const ok = await Auth.authenticateWebAuthn();
          if (ok) {
            STATE.unlocked = true;
            hideLockScreen();
            renderHome();
          } else {
            msg.textContent = "Face ID başarısız. PIN dene.";
          }
        } catch (e) {
          msg.textContent = "Face ID iptal edildi. PIN dene.";
        }
      }}, "🔓 Face ID / Touch ID ile aç");
      card.appendChild(faceBtn);
    }

    card.appendChild(msg);
    overlay.appendChild(card);
    setTimeout(() => pinInput.focus(), 50);
  }

  // ---------- Home (category list) ----------

  async function renderHome() {
    const root = document.getElementById("documents-tab");
    root.innerHTML = "";

    const header = el("header", { class: "header doc-header" }, [
      el("h1", { class: "doc-title" }, "🛂 Belgelerim"),
      el("button", { class: "lock-btn", type: "button", title: "Kilitle", onclick: () => {
        STATE.unlocked = false;
        STATE.currentCategory = null;
        showLockScreen();
      }}, "🔒")
    ]);
    root.appendChild(header);

    const intro = el("p", { class: "doc-intro" }, "Tüm belgeler sadece bu telefonda. Web'e veya bulut'a gönderilmez.");
    root.appendChild(intro);

    const counts = await DB.countByCategory();

    const list = el("div", { class: "doc-categories" });
    for (const cat of DOC_CATEGORIES) {
      const count = counts[cat.slug] || 0;
      const row = el("button", {
        class: "doc-category-row",
        type: "button",
        onclick: () => openDocCategory(cat.slug)
      }, [
        el("span", { class: "doc-cat-icon" }, cat.icon),
        el("span", { class: "doc-cat-name" }, cat.name),
        el("span", { class: "doc-cat-count" }, count > 0 ? `${count} belge` : ""),
        el("span", { class: "doc-cat-arrow" }, "›")
      ]);
      list.appendChild(row);
    }
    root.appendChild(list);
  }

  // ---------- Category view (documents in a category) ----------

  async function openDocCategory(slug) {
    STATE.currentCategory = slug;
    await renderCategory(slug);
  }

  async function renderCategory(slug) {
    const cat = getDocCategoryById(slug);
    if (!cat) return;

    const root = document.getElementById("documents-tab");
    root.innerHTML = "";

    const header = el("header", { class: "header doc-header" }, [
      el("button", { class: "back-btn", type: "button", onclick: () => { STATE.currentCategory = null; renderHome(); } }, "←"),
      el("h2", { class: "doc-title" }, `${cat.icon} ${cat.name}`),
      el("button", { class: "primary-btn small", type: "button", onclick: () => triggerAdd(slug) }, "➕ Ekle")
    ]);
    root.appendChild(header);

    const docs = await DB.getDocumentsByCategory(slug);
    if (docs.length === 0) {
      root.appendChild(el("p", { class: "empty" }, "Bu kategoride henüz belge yok. Yukarıdaki ➕ Ekle butonuyla ekle."));
      return;
    }

    const list = el("div", { class: "doc-list" });
    for (const d of docs) list.appendChild(await renderDocCard(d));
    root.appendChild(list);
  }

  async function renderDocCard(doc) {
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
          renderCategory(STATE.currentCategory);
        }
      }}, "🗑")
    ]);

    card.appendChild(thumb);
    card.appendChild(info);
    card.appendChild(actions);
    card.addEventListener("click", () => viewDocument(doc.id));
    return card;
  }

  // ---------- Adding documents ----------

  function triggerAdd(category) {
    let input = document.getElementById("doc-file-input");
    if (!input) {
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
        if (!files.length) return;
        for (const f of files) {
          try {
            await DB.addDocument({ file: f, category: STATE.pendingCategory, note: "" });
          } catch (err) {
            console.error("Belge ekleme hatası:", err);
            alert("Belge eklenemedi: " + (err.message || err));
          }
        }
        e.target.value = "";
        if (STATE.currentCategory) renderCategory(STATE.currentCategory);
      });
    }
    STATE.pendingCategory = category;
    input.click();
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

    const bar = el("div", { class: "viewer-bar" }, [
      el("button", { class: "back-btn", type: "button", onclick: close }, "✕"),
      el("span", { class: "viewer-name" }, doc.fileName)
    ]);

    const body = el("div", { class: "viewer-body" });
    if (doc.mimeType.startsWith("image/")) {
      const img = el("img", { src: url, alt: doc.fileName, class: "viewer-img" });
      body.appendChild(img);
    } else if (doc.mimeType === "application/pdf") {
      const iframe = el("iframe", { src: url, class: "viewer-pdf", title: doc.fileName });
      body.appendChild(iframe);
      const openInTab = el("a", { href: url, target: "_blank", class: "secondary-btn open-in-tab" }, "Yeni sekmede aç");
      body.appendChild(openInTab);
    } else {
      body.appendChild(el("p", {}, "Bu dosya tipi önizlenemiyor."));
    }

    overlay.appendChild(bar);
    overlay.appendChild(body);
  }

  // ---------- Init ----------

  async function init() {
    // Show lock immediately when documents tab is opened
    STATE.unlocked = false;
    await showLockScreen();
  }

  function handleTabBackground() {
    // When tab moves away or app backgrounds, re-lock
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        STATE.unlocked = false;
      } else {
        const docsTab = document.getElementById("documents-tab");
        if (docsTab && docsTab.classList.contains("active") && !STATE.unlocked) {
          showLockScreen();
        }
      }
    });
  }
  handleTabBackground();

  window.Documents = { init, showLockScreen, renderHome };
})();
