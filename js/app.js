// Uygulama girişi — sekme yönetimi, service worker register, kalıcı depolama izni.

(function () {
  const TAB_PHRASEBOOK = "phrasebook";
  const TAB_DOCUMENTS  = "documents";
  const TAB_PLACES     = "places";
  const TAB_SHOPPING   = "shopping";

  function setActiveTab(tab) {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === tab);
    });
    document.querySelectorAll(".tab-content").forEach((c) => {
      c.classList.toggle("active", c.id === `${tab}-tab`);
    });
    const viewer = document.getElementById("doc-viewer");
    if (tab === TAB_DOCUMENTS) {
      Documents.init();
    } else if (tab === TAB_PLACES) {
      if (window.Places) Places.init();
    } else if (tab === TAB_SHOPPING) {
      if (window.Shopping) Shopping.init();
    } else {
      if (viewer) viewer.classList.add("hidden");
    }
    try { localStorage.setItem("app.activeTab", tab); } catch (e) {}
  }

  async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const persisted = await navigator.storage.persisted();
        if (!persisted) await navigator.storage.persist();
      } catch (e) { /* ignore */ }
    }
  }

  function showUpdateBanner(reg) {
    if (document.getElementById("update-banner")) return;
    const banner = document.createElement("div");
    banner.id = "update-banner";
    banner.className = "update-banner";

    const text = document.createElement("span");
    text.className = "update-text";
    text.textContent = "Yeni sürüm hazır";

    const btn = document.createElement("button");
    btn.className = "update-btn";
    btn.textContent = "↻ Yenile";
    btn.onclick = () => {
      btn.textContent = "Yenileniyor...";
      btn.disabled = true;
      const onControllerChange = () => {
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        window.location.reload();
      };
      if (reg.waiting) {
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
        // safety: reload after 1.5s if controllerchange doesn't fire
        setTimeout(() => window.location.reload(), 1500);
      } else {
        window.location.reload();
      }
    };

    const dismiss = document.createElement("button");
    dismiss.className = "update-dismiss";
    dismiss.title = "Kapat";
    dismiss.textContent = "✕";
    dismiss.onclick = () => banner.remove();

    banner.appendChild(text);
    banner.appendChild(btn);
    banner.appendChild(dismiss);
    document.body.appendChild(banner);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", async () => {
      try {
        const reg = await navigator.serviceWorker.register("./sw.js");

        // Hâlihazırda waiting worker varsa banner göster
        if (reg.waiting && navigator.serviceWorker.controller) {
          showUpdateBanner(reg);
        }

        // Güncelleme bulunduğunda
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateBanner(reg);
            }
          });
        });

        // Sayfa açılınca ve her saatte bir update kontrol
        reg.update().catch(() => {});
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);

        // Sayfa visible olduğunda da kontrol et (app'ten çıkıp geri gelince)
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) reg.update().catch(() => {});
        });
      } catch (e) {
        console.warn("Service worker register hatası:", e);
      }
    });
  }

  function bindTabClicks() {
    document.querySelectorAll(".tab").forEach((t) => {
      t.addEventListener("click", () => setActiveTab(t.dataset.tab));
    });
  }

  function init() {
    bindTabClicks();
    Phrasebook.init();
    setActiveTab(TAB_PHRASEBOOK);
    requestPersistentStorage();
    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
