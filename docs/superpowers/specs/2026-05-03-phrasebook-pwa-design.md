# Seyahat Kiti — Tasarım Spec'i

**Tarih:** 2026-05-03
**App adı / repo:** `seyahat-kiti`
**Durum:** Onay bekliyor

## Amaç

Yurt dışı seyahatlerinde (önce Kore + Japonya, ileride yeni ülkeler) Türkçe konuşan iki kullanıcının (kullanıcı ve eşi) iki ayrı ihtiyacını tek mobil uygulamada birleştirmek:

1. **Sözlük:** Önemli kelime ve ifadelere internet olmadan hızlı erişim
2. **Belgelerim:** Pasaport, kimlik, kredi kartı, bilet gibi belgelerin fotoğrafına/PDF'ine hızlı erişim — **sadece cihaz üstünde, web'e asla yüklenmez**

İkisi de aynı PWA içinde, üstte sekme ile geçiş.

## Kullanıcılar ve Cihazlar

- 2 kullanıcı: kendisi ve eşi (her biri kendi cihazını kullanır)
- Her ikisi de iPhone, Safari
- Apple Developer hesabı veya App Store gerekmiyor
- Erişim: Safari'den GitHub Pages adresine girip "Ana Ekrana Ekle"

## Hosting & Maliyet

- **GitHub Pages**, public repo (`seyahat-kiti`)
- **Tamamen ücretsiz**, kart bilgisi yok
- Kod public olabilir çünkü hassas hiçbir şey içermez (sadece HTML/CSS/JS + kelime listesi)
- URL formatı: `https://hypermera.github.io/seyahat-kiti`
- **Repo ismi sabit kalmalı** — değiştirilirse tarayıcı yeni bir app sanır ve cihazdaki belgeler erişilemez olur

---

# Bölüm 1: Sözlük

## Diller

- **Türkçe** — kaynak dil, daima görünür
- **Korece** (romanize okunuş)
- **Japonca** (Romaji)
- **İngilizce**

Kullanıcı 3 hedef dilden istediklerini açıp kapatır (Türkçe daima açık).

### İleride genişleme
Yeni ülkeye gidildiğinde dil ekleme `data.js`'e iki alan + üst bara bir toggle eklemekten ibaret (~10 dakikalık iş). Sınırlama yok.

## Kategoriler

| | |
|---|---|
| 🆘 Acil Durum *(kırmızı vurgu)* | ⭐ Favoriler |
| 👋 Temel | 💰 Pazarlık |
| 👉 İşaret Etme | 🧭 Yön & Yer |
| 💬 İletişim | 🍜 Market/Yemek |
| 🔢 Miktar & Sayılar | |

İleride "Ulaşım", "Sağlık" gibi kategoriler eklenebilir — `CATEGORIES` listesine bir satır.

## Özellikler

1. **Ana ekran:** 2 sütunlu kategori kart grid'i, her kart büyük emoji + isim
2. **Arama:** Türkçe veya İngilizce yazınca tüm cümlelerde anlık filtre
3. **Favoriler:** Her cümle kartında ⭐ toggle, yıldızlananlar Favoriler kategorisinde toplanır
4. **Sesli telaffuz:** Web Speech API ile cihaz üstü TTS, her dil satırında 🔊 butonu — internet gerekmez
5. **Dil görünürlüğü:** Üstte 3 toggle (🇰🇷 KR, 🇯🇵 JP, 🇬🇧 EN); kapatılan dil tüm kartlarda gizlenir
6. **Tercih hatırlama:** Aktif diller ve favoriler `localStorage`'da, cihaz başına ayrı

## Cümle Kartı

```
┌─────────────────────────────────┐
│ Hırsız!                      ⭐ │
│ 🇰🇷 Doduk-iya!               🔊 │
│ 🇯🇵 Dorobou!                 🔊 │
│ 🇬🇧 Thief!                   🔊 │
└─────────────────────────────────┘
```

## Başlangıç Verisi

Kullanıcının verdiği tablodaki ~22 cümle birebir eklenecek. İleride ek kelimeler `data.js`'e eklenip push'lanır, telefonlar otomatik günceller.

---

# Bölüm 2: Belgelerim

## Güvenlik Modeli — KRİTİK

Belgelerim'deki **hiçbir veri** GitHub'a, sunucuya, web'e gönderilmez. Tüm dosyalar:

- ✅ Yalnızca cihazın **IndexedDB**'sinde saklanır (Safari'nin yerel veritabanı)
- ✅ App güncellemelerinde silinmez (kod ve veri ayrı katmanlarda)
- ✅ Eşinin telefonundakiler senin telefonuna senkronize olmaz (her cihaz bağımsız)
- ✅ `navigator.storage.persist()` ile iOS'a "kalıcı saklama" izni istenir (storage eviction'ı önler)

## Kategoriler

- 🛂 Pasaport
- 🪪 Kimlik
- 💳 Kredi Kartları
- ✈️ Bilet/Rezervasyon
- 🏨 Otel
- 💉 Sağlık (aşı belgesi vb.)
- ➕ Diğer

İleride yeni kategori eklenebilir.

## Desteklenen dosya tipleri

- **Görseller:** JPEG, PNG, HEIC (iPhone yerli formatı), WebP
- **PDF:** dosya boyutu sınırı yok (IndexedDB cihaz storage'ı kadarına izin verir)

## UI Akışı

### Belgelerim Ana Ekranı (PIN/Face ID sonrası)
```
┌─────────────────────────────────────┐
│ ← Belgelerim              ➕ Ekle    │
│                                     │
│ 🛂 Pasaport (2 dosya)        ›      │
│ 🪪 Kimlik (1 dosya)          ›      │
│ 💳 Kredi Kartları (3 dosya)  ›      │
│ ...                                 │
└─────────────────────────────────────┘
```

### Kategori İçi Liste
```
┌─────────────────────────────────────┐
│ ← Pasaport                          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [thumb] pasaport-on.jpg         │ │
│ │         2.1 MB                  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 📄 vize-onayi.pdf               │ │
│ │    340 KB                       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- Görsel kartında küçük thumbnail (cihaz üzerinde generate edilir)
- PDF kartında 📄 ikon + dosya adı + boyut
- Karta dokun → tam ekran görüntüleyici
  - Görsel: pinch-to-zoom
  - PDF: iOS Safari yerleşik PDF görüntüleyici (yeni sekme veya iframe)
- Uzun basma → silme / yeniden adlandırma

### Ekleme Akışı
1. ➕ butonu
2. Kategori seç
3. iOS dosya seçici açılır:
   - "Photo Library" (camera roll'dan seç)
   - "Take Photo" (anında fotoğraf çek)
   - "Choose Files" (Files app'ten PDF seç)
4. Opsiyonel: kısa not / etiket ekle (örn. "Kart 5678 son rakam, son kull. 04/28")
5. Kaydet → IndexedDB'ye yazılır

## PIN & Face ID Koruması

### İlk kurulum
- Kullanıcı Belgelerim sekmesine ilk kez girdiğinde 4-6 haneli PIN belirler
- PIN, salted SHA-256 hash olarak `localStorage`'a yazılır (düz değil)
- Opsiyonel: "Face ID ile aç" → WebAuthn ile platform authenticator (Face ID/Touch ID) kayıt edilir

### Açış akışı
1. Belgelerim sekmesine her girişte kilit ekranı
2. Face ID enrolled ise: Face ID prompt otomatik açılır
3. Başarısız veya cihaz desteklemiyorsa: PIN ekranı
4. Doğru PIN/Face ID → Belgelerim açılır
5. Sözlük sekmesine geçince Belgelerim kilitlenir, tekrar açışta yeniden auth

### Güvenlik önlemleri
- 3 yanlış PIN → 30 saniye bekleme süresi (artan: 5. yanlışta 5 dk, 7. yanlışta 1 saat)
- PIN hash + salt cihazda; brute force'a karşı PBKDF2 (100k iteration) gibi hesaba göre yavaşlatılmış hash
- Auto-lock: ekran kilitlenirse veya app arka plana gidip 1 dakikadan fazla kalırsa Belgelerim re-lock olur

## Veri Modeli (IndexedDB)

### `documents` object store
```js
{
  id: "uuid-v4",
  category: "passport",       // kategori slug
  fileName: "pasaport-on.jpg",
  mimeType: "image/jpeg",     // veya "application/pdf"
  size: 2148123,              // byte
  blob: Blob,                 // gerçek dosya (binary)
  thumbnailBlob: Blob,        // sadece görseller için, PDF'ler için null
  note: "Geçerlilik 2030",    // opsiyonel
  addedAt: 1714742400000      // unix timestamp
}
```

### `settings` object store
```js
{
  pinHash: "...",
  pinSalt: "...",
  pinFailedAttempts: 0,
  pinLockedUntil: null,
  webauthnCredentialId: "...",  // Face ID kayıtlıysa
  storagePersisted: true        // navigator.storage.persist sonucu
}
```

---

# Bölüm 3: Ortak Mimari

## Teknoloji Yığını

- **Saf HTML + CSS + Vanilla JavaScript** (framework yok)
- Build adımı yok, Node.js gerekmez
- Tüm kod tarayıcıda çalışır

### Neden framework yok
- Uygulama yeterince küçük (~50 cümle, basit form)
- Build hatası, dependency güncellemesi gibi sürtünmeler yok
- Hem kullanıcı hem AI asistanı dosyaları doğrudan açıp düzenleyebilir
- iOS Safari uyumluluğu en yüksek

## Dosya Yapısı

```
/
├── index.html                  # Tek HTML — tüm ekranlar SPA olarak
├── style.css                   # Mobil-öncelikli stiller
├── js/
│   ├── app.js                  # Uygulama girişi, router
│   ├── phrasebook.js           # Sözlük mantığı
│   ├── documents.js            # Belgelerim mantığı
│   ├── auth.js                 # PIN/WebAuthn
│   ├── db.js                   # IndexedDB wrapper
│   ├── tts.js                  # Web Speech API wrapper
│   └── data.js                 # Cümle veritabanı (array literal)
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
└── README.md
```

## State Yönetimi

- Sözlük tercihleri (aktif diller, favoriler) → `localStorage`
- Belgeler + auth ayarları → `IndexedDB`
- UI state (aktif sekme, açık kategori) → bellek (sayfa kapanınca kaybolur, normal)

## Offline Stratejisi

- Service worker tüm statik dosyaları (HTML, CSS, JS, ikonlar, manifest) cache'ler — `cache-first` stratejisi
- Service worker'da `CACHE_VERSION` sabiti tutulur
- Veri/kod güncellendiğinde versiyon arttırılır → app açılınca yeni versiyon arka planda iner → bir sonraki açılışta aktif olur
- IndexedDB cache'lenmez (zaten kalıcı, browser'ın kendi katmanı)
- Service worker IndexedDB'ye dokunmaz → güncellemeler belgeleri silmez

## Görünüm

- App görünen adı: **Seyahat Kiti** (manifest `name`, ana ekran simgesi etiketi)
- Üstte 2 sekme: **📖 Sözlük** / **🛂 Belgelerim** — aktif sekme alt çizgi ile vurgulanır
- Mobil-öncelikli layout
- Açık tema varsayılan, `prefers-color-scheme` ile dark mode
- Acil Durum kartı kırmızı arka plan
- Min 44x44 pt dokunma alanları (Apple HIG)
- Sistem fontu (`-apple-system, sans-serif`)

## Hata Yönetimi

- Service worker register edilemezse: app çalışır, offline kapalı (sessizce devam)
- TTS yoksa: 🔊 butonu görünmez
- IndexedDB yoksa (private mode): Belgelerim sekmesinde uyarı: "Tarayıcı verisi etkin değil — belgeler kaydedilemez"
- Storage quota dolarsa: kullanıcıya uyarı + en eski belgelerin silinmesi öneri olarak (otomatik silmez)
- WebAuthn desteklenmiyorsa: Face ID seçeneği gizlenir, sadece PIN gösterilir

## Test Stratejisi

- **Manuel checklist** README'de
- iPhone Safari'de gerçek cihazda doğrulama (offline mod, Ana Ekrana Ekle, kilit/aç döngüsü)
- Veri doğrulama scripti (Node, opsiyonel): `data.js`'i import edip cümlelerin tüm dillerinin dolu, ID'lerin benzersiz olduğunu kontrol eder

---

# Bölüm 4: Kurulum & Kullanım

## Geliştirme Akışı (sen + AI)

1. Bu klasörde dosyalar yazılır
2. `git` ile commit'lenir
3. `gh repo create hypermera/seyahat-kiti --public` ile GitHub'a push'lanır
4. GitHub Pages otomatik aktif edilir (Settings → Pages → main branch root)
5. URL hazır: `https://hypermera.github.io/seyahat-kiti`

## Kullanıcı Akışı

1. iPhone Safari'de URL açılır
2. Paylaş → **Ana Ekrana Ekle** → simge belirir
3. Ana Ekrandan açılır → tam ekran PWA modu
4. İlk açılış: PIN belirleme ekranı (Belgelerim için)
5. Eşine link iletilir, o da Ana Ekrana ekler, kendi PIN'ini belirler
6. Kullanım sırasında: cümle ara, kategori gez, sesli okutma, belge ekle/görüntüle

---

# Kapsam Dışı (Bu Sürümde Yok)

- Çok cihaz arası senkronizasyon (favoriler/notlar paylaşımı)
- Bulut yedekleme (kullanıcı manuel iCloud Drive'a export edebilir, ileride)
- Quiz / kelime kartı modu
- Telaffuz kayıt karşılaştırma
- Çoklu seyahat profili
- App içinden kullanıcı tarafından cümle ekleme UI'sı (cümleler `data.js`'e ayrı commit'lenir)
- Belge OCR / metin tanıma
- Push notification

---

# Başarı Kriterleri

- iPhone Safari'de uçak modunda app açılıyor
- Ana Ekrandan tek dokunuşta tam ekran açılıyor
- Acil Durum kategorisine ana ekrandan ≤2 dokunuşta erişiliyor
- Korece/Japonca cümleler 🔊 ile sesli okunuyor
- Arama kutusuna "hırsız" yazınca ilgili cümle ≤1 saniyede bulunuyor
- Belgelerim'e PIN veya Face ID ile girilebiliyor
- Görsel ve PDF belgeler eklenip görüntülenebiliyor
- Kod güncellemesi sonrası belgeler yerinde kalıyor
- Eşinin telefonunda da aynı şekilde çalışıyor (kendi belgeleri ile)

---

# Bilinen Riskler

1. **iOS PWA storage eviction**: iOS, kullanılmayan PWA verisini ~7 gün sonra silmeye yetkilidir. `navigator.storage.persist()` çoğunlukla önler ama %100 garanti değildir. Önlem: kullanıcıya "orijinal belgeleri Photos uygulamasında da tut" uyarısı README'de.
2. **Repo URL değişimi**: Repo adı sonradan değiştirilirse cihazdaki tüm Belgelerim verisi erişilemez olur (yeni origin = yeni storage). Bu yüzden ad sabittir: `seyahat-kiti`.
3. **Safari verisi temizleme**: Kullanıcı "Tüm Geçmişi Sil" yaparsa veriler gider. Bu kullanıcının seçimi, app önleyemez.
4. **WebAuthn iOS Safari sürümü**: iOS 16+ tam destek, daha eski sürümlerde Face ID çalışmaz, PIN'e fallback olur.
