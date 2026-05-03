// Web Speech API wrapper — cihaz üzerinde sesli telaffuz, internet gerekmez.

(function () {
  const LANG_MAP = {
    tr: "tr-TR",
    ko: "ko-KR",
    ja: "ja-JP",
    en: "en-US"
  };

  let voices = [];
  function loadVoices() {
    if ("speechSynthesis" in window) {
      voices = speechSynthesis.getVoices();
    }
  }

  if ("speechSynthesis" in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  function pickVoice(lang) {
    if (!voices.length) loadVoices();
    const code = LANG_MAP[lang] || lang;
    const prefix = code.split("-")[0];
    return (
      voices.find((v) => v.lang === code) ||
      voices.find((v) => v.lang.startsWith(prefix)) ||
      null
    );
  }

  window.TTS = {
    isSupported() {
      return "speechSynthesis" in window;
    },

    speak(text, lang) {
      if (!this.isSupported() || !text) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = LANG_MAP[lang] || lang;
        u.rate = 0.9;
        u.pitch = 1.0;
        const voice = pickVoice(lang);
        if (voice) u.voice = voice;
        speechSynthesis.speak(u);
      } catch (e) {
        console.warn("TTS hatası:", e);
      }
    },

    cancel() {
      if (this.isSupported()) speechSynthesis.cancel();
    }
  };
})();
