// PIN + WebAuthn (Face ID / Touch ID) auth — sadece Belgelerim sekmesi için.
// PIN salted PBKDF2-SHA256 ile hash'lenir, hash + salt IndexedDB'de saklanır.

(function () {
  const PIN_SETTING = "auth.pin";
  const WEBAUTHN_SETTING = "auth.webauthn";
  const FAILED_SETTING = "auth.failed";

  function bytesToHex(bytes) {
    return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function randomSalt() {
    return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  }

  async function hashPin(pin, saltHex) {
    const enc = new TextEncoder();
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((b) => parseInt(b, 16)));
    const keyMaterial = await crypto.subtle.importKey(
      "raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      256
    );
    return bytesToHex(bits);
  }

  function lockoutDelay(failed) {
    if (failed < 3) return 0;
    if (failed < 5) return 30;          // 30s
    if (failed < 7) return 5 * 60;      // 5m
    return 60 * 60;                     // 1h
  }

  window.Auth = {
    async isPinSet() {
      const cfg = await DB.getSetting(PIN_SETTING);
      return Boolean(cfg && cfg.hash && cfg.salt);
    },

    async setupPin(pin) {
      if (!/^\d{4,6}$/.test(pin)) throw new Error("PIN 4-6 rakam olmalı");
      const salt = randomSalt();
      const hash = await hashPin(pin, salt);
      await DB.setSetting(PIN_SETTING, { hash, salt, createdAt: Date.now() });
      await DB.setSetting(FAILED_SETTING, { count: 0, lastAttempt: 0 });
    },

    async getLockoutSeconds() {
      const f = await DB.getSetting(FAILED_SETTING);
      if (!f) return 0;
      const wait = lockoutDelay(f.count) * 1000;
      const elapsed = Date.now() - (f.lastAttempt || 0);
      return Math.max(0, Math.ceil((wait - elapsed) / 1000));
    },

    async verifyPin(pin) {
      const remaining = await this.getLockoutSeconds();
      if (remaining > 0) {
        return { ok: false, locked: true, remaining };
      }
      const cfg = await DB.getSetting(PIN_SETTING);
      if (!cfg) return { ok: false, locked: false };
      const hash = await hashPin(pin, cfg.salt);
      const ok = hash === cfg.hash;
      const f = (await DB.getSetting(FAILED_SETTING)) || { count: 0 };
      if (ok) {
        await DB.setSetting(FAILED_SETTING, { count: 0, lastAttempt: 0 });
      } else {
        await DB.setSetting(FAILED_SETTING, {
          count: (f.count || 0) + 1,
          lastAttempt: Date.now()
        });
      }
      return { ok, locked: false };
    },

    async clearPin() {
      await DB.deleteSetting(PIN_SETTING);
      await DB.deleteSetting(FAILED_SETTING);
      await DB.deleteSetting(WEBAUTHN_SETTING);
    },

    canUseWebAuthn() {
      return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
    },

    async hasWebAuthn() {
      const v = await DB.getSetting(WEBAUTHN_SETTING);
      return Boolean(v && v.credentialId);
    },

    async registerWebAuthn() {
      if (!this.canUseWebAuthn()) throw new Error("Cihaz Face ID/Touch ID desteklemiyor");
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Seyahat Kiti", id: location.hostname || "localhost" },
          user: { id: userId, name: "user", displayName: "Seyahat Kiti" },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 }
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred"
          },
          timeout: 60000,
          attestation: "none"
        }
      });
      const credentialId = bytesToHex(cred.rawId);
      await DB.setSetting(WEBAUTHN_SETTING, {
        credentialId,
        rawIdBytes: Array.from(new Uint8Array(cred.rawId)),
        createdAt: Date.now()
      });
      return true;
    },

    async authenticateWebAuthn() {
      const v = await DB.getSetting(WEBAUTHN_SETTING);
      if (!v) throw new Error("Face ID kayıtlı değil");
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const rawId = new Uint8Array(v.rawIdBytes);
      try {
        await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [{ type: "public-key", id: rawId }],
            userVerification: "required",
            timeout: 60000
          }
        });
        return true;
      } catch (e) {
        return false;
      }
    },

    async removeWebAuthn() {
      await DB.deleteSetting(WEBAUTHN_SETTING);
    }
  };
})();
