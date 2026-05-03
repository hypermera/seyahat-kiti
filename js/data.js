// Seyahat Kiti — kelime/ifade veritabanı
// Yeni cümle eklemek için PHRASES dizisine satır ekle ve sw.js'teki CACHE_VERSION'u arttır.

window.CATEGORIES = [
  { slug: "emergency",  name: "Acil Durum",     icon: "🆘", emergency: true },
  { slug: "favorites",  name: "Favoriler",      icon: "⭐", virtual: true   },
  { slug: "basics",     name: "Temel",          icon: "👋" },
  { slug: "bargain",    name: "Pazarlık",       icon: "💰" },
  { slug: "pointing",   name: "İşaret",         icon: "👉" },
  { slug: "directions", name: "Yön & Yer",      icon: "🧭" },
  { slug: "comm",       name: "İletişim",       icon: "💬" },
  { slug: "food",       name: "Market & Yemek", icon: "🍜" },
  { slug: "numbers",    name: "Sayılar",        icon: "🔢" }
];

window.PHRASES = [
  // Acil Durum
  { id: "thief",      category: "emergency",  tr: "Hırsız!",                    ko: "Doduk-iya!",            ja: "Dorobou!",          en: "Thief!" },
  { id: "stolen",     category: "emergency",  tr: "Eşyam çalındı",              ko: "Mulgon ilo-boryossoyo", ja: "Nusumaremashita",   en: "My stuff was stolen" },
  { id: "police",     category: "emergency",  tr: "Polis",                      ko: "Gyeongchal",            ja: "Keisatsu",          en: "Police" },
  { id: "hospital",   category: "emergency",  tr: "Hastane",                    ko: "Byeong-won",            ja: "Byouin",            en: "Hospital" },
  { id: "help",       category: "emergency",  tr: "Yardım edin",                ko: "Dowa-juseyo",           ja: "Tasukete kudasai",  en: "Help me" },

  // Temel
  { id: "hello",      category: "basics",     tr: "Merhaba",                    ko: "Annyeong-haseyo",       ja: "Konnichiwa",        en: "Hello" },
  { id: "thanks",     category: "basics",     tr: "Teşekkürler",                ko: "Gamsahamnida",          ja: "Arigato",           en: "Thank you" },

  // Pazarlık
  { id: "discount",   category: "bargain",    tr: "İndirim yapabilir misiniz?", ko: "Kkakka-juseyo?",        ja: "Makete-kudasai?",   en: "Can you discount?" },
  { id: "expensive",  category: "bargain",    tr: "Pahalı",                     ko: "Bissayo",               ja: "Takai",             en: "Expensive" },

  // İşaret
  { id: "this",       category: "pointing",   tr: "Bu",                         ko: "İgo",                   ja: "Kore",              en: "This" },
  { id: "that",       category: "pointing",   tr: "Şu",                         ko: "Chogo",                 ja: "Sore",              en: "That" },

  // Yön & Yer
  { id: "right",      category: "directions", tr: "Sağ",                        ko: "Oreunjok",              ja: "Migi",              en: "Right" },
  { id: "left",       category: "directions", tr: "Sol",                        ko: "Oenjok",                ja: "Hidari",            en: "Left" },
  { id: "entrance",   category: "directions", tr: "Giriş",                      ko: "İp-gu",                 ja: "Iriguchi",          en: "Entrance" },
  { id: "exit",       category: "directions", tr: "Çıkış",                      ko: "Chul-gu",               ja: "Deguchi",           en: "Exit" },
  { id: "subway",     category: "directions", tr: "Metro",                      ko: "Jihachol",              ja: "Chikatetsu",        en: "Subway" },
  { id: "hotel",      category: "directions", tr: "Otel",                       ko: "Hoteul",                ja: "Hoteru",            en: "Hotel" },
  { id: "where",      category: "directions", tr: "Nerede?",                    ko: "Odiyeyo?",              ja: "Doko desu ka?",     en: "Where?" },

  // İletişim
  { id: "photo",      category: "comm",       tr: "Fotoğraf (lütfen)",          ko: "Sajin (Juseyo)",        ja: "Shashin (Kudasai)", en: "Photo (Please)" },
  { id: "ok",         category: "comm",       tr: "Tamam / Anladım",            ko: "Arassoyo",              ja: "Wakarimashita",     en: "OK / I understand" },

  // Market & Yemek
  { id: "heat",       category: "food",       tr: "Isıtın lütfen",              ko: "Dewo juseyo",           ja: "Atatamete kudasai", en: "Heat it up please" },
  { id: "bag",        category: "food",       tr: "Poşet",                      ko: "Bongtu",                ja: "Fukuro",            en: "Plastic bag" },
  { id: "not_spicy",  category: "food",       tr: "Acı olmasın",                ko: "An mep-ge",             ja: "Karakunai",         en: "Not spicy" },
  { id: "chopsticks", category: "food",       tr: "Yemek çubuğu",               ko: "Jeotgarak",             ja: "Hashi",             en: "Chopsticks" },
  { id: "water",      category: "food",       tr: "Su",                         ko: "Mul",                   ja: "Mizu",              en: "Water" },
  { id: "bill",       category: "food",       tr: "Hesap",                      ko: "Gyesan",                ja: "Kaikei",            en: "Bill / Check" },

  // Sayılar
  { id: "all",        category: "numbers",    tr: "Hepsi",                      ko: "Jeonbu",                ja: "Zenbu",             en: "All" },
  { id: "more",       category: "numbers",    tr: "Daha fazla",                 ko: "Deo mani",              ja: "Motto takusan",     en: "More" },
  { id: "one",        category: "numbers",    tr: "1 tane",                     ko: "Han gae",               ja: "Hitotsu",           en: "1 piece" },
  { id: "two",        category: "numbers",    tr: "2 tane",                     ko: "Du gae",                ja: "Futatsu",           en: "2 pieces" }
];

window.DOC_CATEGORIES = [
  { slug: "passport",    name: "Pasaport",          icon: "🛂" },
  { slug: "id",          name: "Kimlik",            icon: "🪪" },
  { slug: "credit_card", name: "Kredi Kartları",    icon: "💳" },
  { slug: "ticket",      name: "Bilet/Rezervasyon", icon: "✈️" },
  { slug: "hotel_doc",   name: "Otel",              icon: "🏨" },
  { slug: "health",      name: "Sağlık",            icon: "💉" },
  { slug: "other",       name: "Diğer",             icon: "📁" }
];
