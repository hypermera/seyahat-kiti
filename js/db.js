// IndexedDB wrapper — belgeler ve ayarlar için.
// Veriler sadece cihaz üzerinde, hiçbir yere gönderilmez.

(function () {
  const DB_NAME = "seyahat-kiti";
  const DB_VERSION = 1;
  const STORE_DOCS = "documents";
  const STORE_SETTINGS = "settings";

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_DOCS)) {
          const docs = db.createObjectStore(STORE_DOCS, { keyPath: "id" });
          docs.createIndex("category", "category", { unique: false });
          docs.createIndex("addedAt", "addedAt", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: "key" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function reqAsPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function withStore(storeName, mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let result;
      Promise.resolve(fn(store))
        .then((r) => { result = r; })
        .catch(reject);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function generateThumbnail(blob, maxSize = 240) {
    if (!blob.type.startsWith("image/")) return null;
    try {
      const bitmap = await createImageBitmap(blob);
      const ratio = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
      const w = Math.round(bitmap.width * ratio);
      const h = Math.round(bitmap.height * ratio);
      const canvas = (typeof OffscreenCanvas !== "undefined")
        ? new OffscreenCanvas(w, h)
        : Object.assign(document.createElement("canvas"), { width: w, height: h });
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close && bitmap.close();
      if (canvas.convertToBlob) {
        return await canvas.convertToBlob({ type: "image/jpeg", quality: 0.75 });
      }
      return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.75));
    } catch (e) {
      console.warn("Thumbnail oluşturulamadı:", e);
      return null;
    }
  }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0,4).join("")}-${hex.slice(4,6).join("")}-${hex.slice(6,8).join("")}-${hex.slice(8,10).join("")}-${hex.slice(10).join("")}`;
  }

  window.DB = {
    async addDocument({ file, category, note, groupName }) {
      const blob = file;
      const thumbnailBlob = await generateThumbnail(blob);
      const doc = {
        id: uuid(),
        category,
        groupName: groupName || null,
        fileName: file.name || `belge-${Date.now()}`,
        mimeType: file.type || "application/octet-stream",
        size: file.size || 0,
        blob,
        thumbnailBlob,
        note: note || "",
        addedAt: Date.now()
      };
      await withStore(STORE_DOCS, "readwrite", (s) => reqAsPromise(s.add(doc)));
      return doc;
    },

    async updateDocument(id, patch) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DOCS, "readwrite");
        const store = tx.objectStore(STORE_DOCS);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const cur = getReq.result;
          if (!cur) { resolve(null); return; }
          Object.assign(cur, patch);
          const putReq = store.put(cur);
          putReq.onsuccess = () => resolve(cur);
          putReq.onerror = () => reject(putReq.error);
        };
        getReq.onerror = () => reject(getReq.error);
      });
    },

    async getGroupsForCategory(category) {
      const docs = await this.getDocumentsByCategory(category);
      const map = new Map();
      for (const d of docs) {
        if (!d.groupName) continue;
        if (!map.has(d.groupName)) map.set(d.groupName, 0);
        map.set(d.groupName, map.get(d.groupName) + 1);
      }
      return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
    },

    async getDocumentsByCategory(category) {
      return withStore(STORE_DOCS, "readonly", async (s) => {
        const result = await reqAsPromise(s.index("category").getAll(category));
        result.sort((a, b) => b.addedAt - a.addedAt);
        return result;
      });
    },

    async getAllDocuments() {
      return withStore(STORE_DOCS, "readonly", async (s) => {
        const result = await reqAsPromise(s.getAll());
        result.sort((a, b) => b.addedAt - a.addedAt);
        return result;
      });
    },

    async getDocument(id) {
      return withStore(STORE_DOCS, "readonly", (s) => reqAsPromise(s.get(id)));
    },

    async deleteDocument(id) {
      return withStore(STORE_DOCS, "readwrite", (s) => reqAsPromise(s.delete(id)));
    },

    async countByCategory() {
      const docs = await this.getAllDocuments();
      const counts = {};
      for (const d of docs) counts[d.category] = (counts[d.category] || 0) + 1;
      return counts;
    },

    async getSetting(key) {
      const row = await withStore(STORE_SETTINGS, "readonly", (s) => reqAsPromise(s.get(key)));
      return row ? row.value : undefined;
    },

    async setSetting(key, value) {
      return withStore(STORE_SETTINGS, "readwrite", (s) => reqAsPromise(s.put({ key, value })));
    },

    async deleteSetting(key) {
      return withStore(STORE_SETTINGS, "readwrite", (s) => reqAsPromise(s.delete(key)));
    }
  };
})();
