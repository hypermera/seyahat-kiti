// Uygulama girişi — sekme yönetimi, service worker register, kalıcı depolama izni.

(function () {
  const TAB_PHRASEBOOK = "phrasebook";
  const TAB_DOCUMENTS  = "documents";
  const TAB_SHOPPING   = "shopping";

  function setActiveTab(tab) {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === tab);
    });
    document.querySelectorAll(".tab-content").forEach((c) => {
      c.classList.toggle("active", c.id === `${tab}-tab`);
    });
    if (tab === TAB_DOCUMENTS) {
      Documents.init();
    } else if (tab === TAB_SHOPPING) {
      if (window.Shopping) Shopping.init();
      const lock = document.getElementById("lock-screen");
      if (lock) lock.classList.add("hidden");
    } else {
      const lock = document.getElementById("lock-screen");
      if (lock) lock.classList.add("hidden");
      const viewer = document.getElementById("doc-viewer");
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

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch((e) => {
          console.warn("Service worker register hatası:", e);
        });
      });
    }
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
