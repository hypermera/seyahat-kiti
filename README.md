# Seyahat Kiti

Yurt dışı seyahatlerinde Türkçe → Korece/Japonca/İngilizce hızlı sözlük + offline belge cüzdanı (pasaport, kimlik, kredi kartı, vs).

iPhone Safari'de Ana Ekrana Ekle → native app gibi çalışır, internet gerekmez.

## Kurulum (kullanıcı için)

1. iPhone Safari'de aç: `https://hypermera.github.io/seyahat-kiti`
2. Paylaş ↗ → **Ana Ekrana Ekle** → simge belirir
3. Ana Ekrandan aç (tam ekran PWA modu)
4. İlk açılışta Belgelerim için 4-6 haneli PIN belirle (sözlük bölümü PIN gerektirmez)

## Özellikler

### 📖 Sözlük
- Türkçe + Korece (romanize) + Japonca (Romaji) + İngilizce
- Üst bardan istediğin dilleri açıp kapatabilirsin
- Kategori grid'i (Acil Durum, Pazarlık, Yemek, vb.) — direk ulaş
- Arama: Türkçe veya İngilizce yazınca anlık filtre
- Favoriler: ⭐ butonu ile yıldızla, Favoriler kategorisinde toplanır
- Sesli telaffuz: 🔊 butonu — iPhone'un yerleşik TTS'i ile dinle
- **Offline çalışır**, ilk açılıştan sonra internet gerekmez

### 🛂 Belgelerim
- Pasaport, kimlik, kredi kartı, bilet, otel rezervasyonu fotoğrafları + PDF
- **PIN veya Face ID** koruması
- Tüm belgeler **sadece senin telefonunda**, web'e/sunucuya **asla** yüklenmez
- iCloud, GitHub, hiçbir yere gitmez — Safari'nin yerel veritabanında durur

## Güvenlik notu

- Belgeler cihazın IndexedDB'sinde saklanır. App güncellemeleri belgeleri silmez.
- Safari verisini temizlersen veya telefonu sıfırlarsan belgeler gider — orijinalleri Photos uygulamasında da tut.
- Yanlış PIN üst üste girilirse bekleme süresi başlar.

## Geliştirici notu

Saf HTML + CSS + Vanilla JS. Build adımı yok, framework yok. Yeni cümle eklemek için `js/data.js` düzenle, push'la — service worker bir sonraki açılışta günceller.

Yeni cümle eklemek istersen issue aç veya direkt `data.js`'e satır ekle.
