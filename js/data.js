// Seyahat Kiti — kelime/ifade veritabanı
// Yeni cümle eklemek için PHRASES dizisine satır ekle ve sw.js'teki CACHE_VERSION'u arttır.

window.CATEGORIES = [
  { slug: "emergency",  name: "Acil Durum",      icon: "🆘", emergency: true },
  { slug: "favorites",  name: "Favoriler",       icon: "⭐", virtual: true   },
  { slug: "basics",     name: "Temel",           icon: "👋" },
  { slug: "food",       name: "Yemek & Market",  icon: "🍜" },
  { slug: "shopping",   name: "Mağaza/Kıyafet",  icon: "🛍" },
  { slug: "hotel_stay", name: "Otel",            icon: "🏨" },
  { slug: "questions",  name: "Sorular",         icon: "❓" },
  { slug: "directions", name: "Yön & Yer",       icon: "🧭" },
  { slug: "comm",       name: "İletişim",        icon: "💬" },
  { slug: "bargain",    name: "Pazarlık",        icon: "💰" },
  { slug: "pointing",   name: "İşaret",          icon: "👉" },
  { slug: "numbers",    name: "Sayılar",         icon: "🔢" }
];

window.PHRASES = [
  // ───── Acil Durum ─────
  { id: "thief",       category: "emergency",  tr: "Hırsız!",                    ko: "Doduk-iya!",            ja: "Dorobou!",                en: "Thief!" },
  { id: "stolen",      category: "emergency",  tr: "Eşyam çalındı",              ko: "Mulgon ilo-boryossoyo", ja: "Nusumaremashita",         en: "My stuff was stolen" },
  { id: "police",      category: "emergency",  tr: "Polis",                      ko: "Gyeongchal",            ja: "Keisatsu",                en: "Police" },
  { id: "hospital",    category: "emergency",  tr: "Hastane",                    ko: "Byeong-won",            ja: "Byouin",                  en: "Hospital" },
  { id: "ambulance",   category: "emergency",  tr: "Ambulans çağırın",           ko: "Gugeupcha bulleo juseyo", ja: "Kyuukyuusha o yonde",   en: "Call an ambulance" },
  { id: "help",        category: "emergency",  tr: "Yardım edin",                ko: "Dowa-juseyo",           ja: "Tasukete kudasai",        en: "Help me" },
  { id: "embassy",     category: "emergency",  tr: "Türk büyükelçiliği",         ko: "Tereuk daesagwan",      ja: "Toruko taishikan",        en: "Turkish embassy" },

  // ───── Temel ─────
  { id: "hello",       category: "basics",     tr: "Merhaba",                    ko: "Annyeong-haseyo",       ja: "Konnichiwa",              en: "Hello" },
  { id: "thanks",      category: "basics",     tr: "Teşekkürler",                ko: "Gamsahamnida",          ja: "Arigato",                 en: "Thank you" },
  { id: "please",      category: "basics",     tr: "Lütfen",                     ko: "Juseyo",                ja: "Onegaishimasu",           en: "Please" },
  { id: "excuse_me",   category: "basics",     tr: "Pardon / Affedersiniz",      ko: "Sillyehamnida",         ja: "Sumimasen",               en: "Excuse me" },
  { id: "yes",         category: "basics",     tr: "Evet",                       ko: "Ne",                    ja: "Hai",                     en: "Yes" },
  { id: "no",          category: "basics",     tr: "Hayır",                      ko: "Aniyo",                 ja: "Iie",                     en: "No" },
  { id: "no_understand", category: "basics",   tr: "Anlamadım",                  ko: "Mollayo",               ja: "Wakarimasen",             en: "I don't understand" },
  { id: "repeat",      category: "basics",     tr: "Tekrar eder misiniz?",       ko: "Dasi malhae juseyo",    ja: "Mou ichido onegaishimasu", en: "Could you repeat?" },

  // ───── Yemek & Market ─────
  { id: "two_of_this", category: "food",       tr: "Bundan iki tane",            ko: "Igeo du-gae juseyo",    ja: "Kore o futatsu kudasai",  en: "Two of these, please" },
  { id: "menu",        category: "food",       tr: "Menü lütfen",                ko: "Menyu juseyo",          ja: "Menyuu kudasai",          en: "Menu please" },
  { id: "unlimited",   category: "food",       tr: "Sınırsız mı?",               ko: "Muhan ribil-iyeyo?",    ja: "Tabehoudai desu ka?",     en: "All-you-can-eat?" },
  { id: "is_meat",     category: "food",       tr: "Bu et mi?",                  ko: "Igeo gogi-yeyo?",       ja: "Kore wa niku desu ka?",   en: "Is this meat?" },
  { id: "vegetarian",  category: "food",       tr: "Vejetaryenim",               ko: "Chaesik-juuiya-yeyo",   ja: "Bejitarian desu",         en: "I'm a vegetarian" },
  { id: "halal",       category: "food",       tr: "Helal mi?",                  ko: "Hallal-i-eyo?",         ja: "Hararu desu ka?",         en: "Is it halal?" },
  { id: "no_alcohol",  category: "food",       tr: "Alkol istemiyorum",          ko: "Sul-eun an mashilgeyo", ja: "Osake wa irimasen",       en: "No alcohol please" },
  { id: "heat",        category: "food",       tr: "Isıtın lütfen",              ko: "Dewo juseyo",           ja: "Atatamete kudasai",       en: "Heat it up please" },
  { id: "bag",         category: "food",       tr: "Poşet",                      ko: "Bongtu",                ja: "Fukuro",                  en: "Plastic bag" },
  { id: "not_spicy",   category: "food",       tr: "Acı olmasın",                ko: "An mep-ge",             ja: "Karakunai",               en: "Not spicy" },
  { id: "less_salt",   category: "food",       tr: "Daha az tuzlu",              ko: "Yeom-bun jogeum",       ja: "Aji o usuku",             en: "Less salty" },
  { id: "chopsticks",  category: "food",       tr: "Yemek çubuğu",               ko: "Jeotgarak",             ja: "Hashi",                   en: "Chopsticks" },
  { id: "fork",        category: "food",       tr: "Çatal var mı?",              ko: "Pokeu isseoyo?",        ja: "Fooku arimasu ka?",       en: "Do you have a fork?" },
  { id: "water",       category: "food",       tr: "Su",                         ko: "Mul",                   ja: "Mizu",                    en: "Water" },
  { id: "coffee",      category: "food",       tr: "Kahve",                      ko: "Keopi",                 ja: "Koohii",                  en: "Coffee" },
  { id: "tea",         category: "food",       tr: "Çay",                        ko: "Cha",                   ja: "Ocha",                    en: "Tea" },
  { id: "bill",        category: "food",       tr: "Hesap",                      ko: "Gyesan",                ja: "Kaikei",                  en: "Bill / Check" },
  { id: "delicious",   category: "food",       tr: "Çok lezzetli",               ko: "Mas-isseoyo",           ja: "Oishii desu",             en: "Very delicious" },
  { id: "detergent",   category: "food",       tr: "Çamaşır deterjanı",          ko: "Setakje",               ja: "Sentakuzai",              en: "Laundry detergent" },
  { id: "shampoo",     category: "food",       tr: "Şampuan",                    ko: "Shyampu",               ja: "Shanpuu",                 en: "Shampoo" },
  { id: "toothpaste",  category: "food",       tr: "Diş macunu",                 ko: "Chiyak",                ja: "Hamigaki-ko",             en: "Toothpaste" },
  { id: "milk",        category: "food",       tr: "Süt",                        ko: "Uyu",                   ja: "Gyuunyuu",                en: "Milk" },
  { id: "bread",       category: "food",       tr: "Ekmek",                      ko: "Bbang",                 ja: "Pan",                     en: "Bread" },

  // ───── Mağaza/Kıyafet ─────
  { id: "bigger_size", category: "shopping",   tr: "Daha büyük beden var mı?",   ko: "Deo keun saijeu isseoyo?", ja: "Motto ookii saizu arimasu ka?", en: "Do you have a bigger size?" },
  { id: "smaller_size",category: "shopping",   tr: "Daha küçük beden var mı?",   ko: "Deo jageun saijeu isseoyo?", ja: "Motto chiisai saizu arimasu ka?", en: "Do you have a smaller size?" },
  { id: "other_color", category: "shopping",   tr: "Başka renk var mı?",         ko: "Dareun saek isseoyo?",  ja: "Hoka no iro arimasu ka?", en: "Other colors?" },
  { id: "try_on",      category: "shopping",   tr: "Deneyebilir miyim?",         ko: "Ibeo bwado dwaeyo?",    ja: "Shichaku dekimasu ka?",   en: "Can I try it on?" },
  { id: "mirror",      category: "shopping",   tr: "Ayna nerede?",               ko: "Geoul-i eodi-yeyo?",    ja: "Kagami wa doko desu ka?", en: "Where is the mirror?" },
  { id: "buy_this",    category: "shopping",   tr: "Bunu alacağım",              ko: "Igeo salgeyo",          ja: "Kore o kaimasu",          en: "I'll buy this" },
  { id: "not_now",     category: "shopping",   tr: "Şimdi almayacağım",          ko: "Jigeum-eun an sagessoyo", ja: "Ima wa kaimasen",        en: "Not buying now" },
  { id: "tax_refund",  category: "shopping",   tr: "Tax-free / Vergi iadesi",    ko: "Tekseu pri",            ja: "Menzei",                  en: "Tax-free" },
  { id: "receipt",     category: "shopping",   tr: "Fiş / Fatura",               ko: "Yeongsujeung",          ja: "Reshiito",                en: "Receipt" },

  // ───── Otel ─────
  { id: "wifi_pass",   category: "hotel_stay", tr: "Wi-Fi şifresi nedir?",       ko: "Waipai bimilbeonho mwoyeyo?", ja: "Wifi no pasuwaado wa?", en: "What's the wifi password?" },
  { id: "towel",       category: "hotel_stay", tr: "Havlu lütfen",               ko: "Sugeon juseyo",         ja: "Taoru kudasai",           en: "Towel please" },
  { id: "breakfast_time", category: "hotel_stay", tr: "Kahvaltı kaçta?",         ko: "Achim-shiksa myeotshi-yeyo?", ja: "Choushoku wa nanji?", en: "What time is breakfast?" },
  { id: "checkout_time", category: "hotel_stay", tr: "Check-out kaçta?",         ko: "Chekeu-aut myeotshi-yeyo?",   ja: "Chekku-auto wa nanji?", en: "What time is check-out?" },
  { id: "ac_broken",   category: "hotel_stay", tr: "Klima çalışmıyor",           ko: "Eeokon-i an dwaeyo",    ja: "Eakon ga ugokimasen",     en: "AC is not working" },
  { id: "no_hot_water",category: "hotel_stay", tr: "Sıcak su yok",               ko: "Tteut-an mul-i an na-wayo", ja: "Oyu ga demasen",      en: "No hot water" },
  { id: "key_lost",    category: "hotel_stay", tr: "Anahtarımı kaybettim",       ko: "Yeolssoe-reul ireobeoryeosseoyo", ja: "Kagi o nakushimashita", en: "I lost the key" },
  { id: "extra_bed",   category: "hotel_stay", tr: "Ekstra yatak",               ko: "Chuga chimdae",         ja: "Ekisutora beddo",         en: "Extra bed" },

  // ───── Sorular ─────
  { id: "how_much",    category: "questions",  tr: "Ne kadar?",                  ko: "Eolma-yeyo?",           ja: "Ikura desu ka?",          en: "How much?" },
  { id: "what_time",   category: "questions",  tr: "Saat kaç?",                  ko: "Myeot-shi-yeyo?",       ja: "Nanji desu ka?",          en: "What time?" },
  { id: "how_long",    category: "questions",  tr: "Ne kadar sürer?",            ko: "Eolmana georyeoyo?",    ja: "Donokurai kakarimasu ka?", en: "How long does it take?" },
  { id: "is_free",     category: "questions",  tr: "Ücretsiz mi?",               ko: "Mulyo-yeyo?",           ja: "Muryou desu ka?",         en: "Is it free?" },
  { id: "is_open",     category: "questions",  tr: "Açık mı?",                   ko: "Yeoreo isseoyo?",       ja: "Aiteimasu ka?",           en: "Is it open?" },
  { id: "is_closed",   category: "questions",  tr: "Kapalı mı?",                 ko: "Datchyeoss-eoyo?",      ja: "Shimatteimasu ka?",       en: "Is it closed?" },
  { id: "have_it",     category: "questions",  tr: "Var mı?",                    ko: "Isseoyo?",              ja: "Arimasu ka?",             en: "Do you have it?" },
  { id: "speak_eng",   category: "questions",  tr: "İngilizce konuşur musunuz?", ko: "Yeong-eo halsu isseoyo?", ja: "Eigo wa hanasemasu ka?", en: "Do you speak English?" },

  // ───── Yön & Yer ─────
  { id: "right",       category: "directions", tr: "Sağ",                        ko: "Oreunjok",              ja: "Migi",                    en: "Right" },
  { id: "left",        category: "directions", tr: "Sol",                        ko: "Oenjok",                ja: "Hidari",                  en: "Left" },
  { id: "straight",    category: "directions", tr: "Düz",                        ko: "Jikjin",                ja: "Massugu",                 en: "Straight" },
  { id: "entrance",    category: "directions", tr: "Giriş",                      ko: "İp-gu",                 ja: "Iriguchi",                en: "Entrance" },
  { id: "exit",        category: "directions", tr: "Çıkış",                      ko: "Chul-gu",               ja: "Deguchi",                 en: "Exit" },
  { id: "subway",      category: "directions", tr: "Metro",                      ko: "Jihachol",              ja: "Chikatetsu",              en: "Subway" },
  { id: "bus",         category: "directions", tr: "Otobüs",                     ko: "Beoseu",                ja: "Basu",                    en: "Bus" },
  { id: "train",       category: "directions", tr: "Tren",                       ko: "Gicha",                 ja: "Densha",                  en: "Train" },
  { id: "taxi",        category: "directions", tr: "Taksi",                      ko: "Taeksi",                ja: "Takushii",                en: "Taxi" },
  { id: "airport",     category: "directions", tr: "Havalimanı",                 ko: "Gonghang",              ja: "Kuukou",                  en: "Airport" },
  { id: "station",     category: "directions", tr: "İstasyon",                   ko: "Yeok",                  ja: "Eki",                     en: "Station" },
  { id: "hotel_word",  category: "directions", tr: "Otel",                       ko: "Hoteul",                ja: "Hoteru",                  en: "Hotel" },
  { id: "toilet",      category: "directions", tr: "Tuvalet nerede?",            ko: "Hwajangshil eodi-yeyo?", ja: "Toire wa doko desu ka?", en: "Where is the toilet?" },
  { id: "where",       category: "directions", tr: "Nerede?",                    ko: "Odiyeyo?",              ja: "Doko desu ka?",           en: "Where?" },
  { id: "near",        category: "directions", tr: "Yakında mı?",                ko: "Gakkapeotsuyo?",        ja: "Chikai desu ka?",         en: "Is it nearby?" },
  { id: "walking",     category: "directions", tr: "Yürüyerek?",                 ko: "Georeoseo?",            ja: "Aruite?",                 en: "Walking?" },

  // ───── İletişim ─────
  { id: "photo",       category: "comm",       tr: "Fotoğraf (lütfen)",          ko: "Sajin (Juseyo)",        ja: "Shashin (Kudasai)",       en: "Photo (Please)" },
  { id: "ok",          category: "comm",       tr: "Tamam / Anladım",            ko: "Arassoyo",              ja: "Wakarimashita",           en: "OK / I understand" },
  { id: "slow",        category: "comm",       tr: "Daha yavaş lütfen",          ko: "Cheoncheonhi malhae juseyo", ja: "Yukkuri hanashite kudasai", en: "Slowly please" },
  { id: "write",       category: "comm",       tr: "Yazar mısın?",               ko: "Sseojuseyo",            ja: "Kaite kudasai",           en: "Could you write it?" },
  { id: "wait",        category: "comm",       tr: "Bir saniye",                 ko: "Jamkkanmanyo",          ja: "Chotto matte kudasai",    en: "One moment" },

  // ───── Pazarlık ─────
  { id: "discount",    category: "bargain",    tr: "İndirim yapabilir misiniz?", ko: "Kkakka-juseyo?",        ja: "Makete-kudasai?",         en: "Can you discount?" },
  { id: "expensive",   category: "bargain",    tr: "Pahalı",                     ko: "Bissayo",               ja: "Takai",                   en: "Expensive" },
  { id: "cheap",       category: "bargain",    tr: "Ucuz",                       ko: "Ssayo",                 ja: "Yasui",                   en: "Cheap" },
  { id: "cash",        category: "bargain",    tr: "Nakit",                      ko: "Hyeon-geum",            ja: "Genkin",                  en: "Cash" },
  { id: "card",        category: "bargain",    tr: "Kredi kartı",                ko: "Kade-eu",               ja: "Kaado",                   en: "Credit card" },

  // ───── İşaret ─────
  { id: "this",        category: "pointing",   tr: "Bu",                         ko: "İgo",                   ja: "Kore",                    en: "This" },
  { id: "that",        category: "pointing",   tr: "Şu",                         ko: "Chogo",                 ja: "Sore",                    en: "That" },
  { id: "this_one",    category: "pointing",   tr: "Şunu istiyorum",             ko: "Igeo wonhaeyo",         ja: "Kore o kudasai",          en: "I want this one" },

  // ───── Sayılar ─────
  { id: "one",         category: "numbers",    tr: "1 tane",                     ko: "Han gae",               ja: "Hitotsu",                 en: "1 piece" },
  { id: "two",         category: "numbers",    tr: "2 tane",                     ko: "Du gae",                ja: "Futatsu",                 en: "2 pieces" },
  { id: "three",       category: "numbers",    tr: "3 tane",                     ko: "Se gae",                ja: "Mittsu",                  en: "3 pieces" },
  { id: "five",        category: "numbers",    tr: "5 tane",                     ko: "Daseot gae",            ja: "Itsutsu",                 en: "5 pieces" },
  { id: "all",         category: "numbers",    tr: "Hepsi",                      ko: "Jeonbu",                ja: "Zenbu",                   en: "All" },
  { id: "more",        category: "numbers",    tr: "Daha fazla",                 ko: "Deo mani",              ja: "Motto takusan",           en: "More" },
  { id: "a_little",    category: "numbers",    tr: "Biraz",                      ko: "Jogeum",                ja: "Sukoshi",                 en: "A little" },
  { id: "a_lot",       category: "numbers",    tr: "Çok",                        ko: "Manhi",                 ja: "Takusan",                 en: "A lot" }
];

// Alışveriş listesi — yurt dışında alınacak ürünler (kullanıcı kişisel listesi başlangıç)
// Her cihaz kendi check ve eklenen kalemlerini ayrı tutar (localStorage).
window.SHOPPING_LIST = [
  { id: "buzluk",            text: "Buzluk silikon",              emoji: "🧊" },
  { id: "daiso_bag",         text: "Kore Daiso çanta",            emoji: "🧳" },
  { id: "passport_case",     text: "Pasaport case",               emoji: "🛂" },
  { id: "sunglasses",        text: "Güneş gözlüğü",               emoji: "🕶" },
  { id: "tweezer",           text: "Cımbız",                      emoji: "✂️" },
  { id: "7eleven_magnets",   text: "7-Eleven magnetleri",         emoji: "🧲" },
  { id: "creative_magnets",  text: "Yaratıcı magnetler",          emoji: "🧲" },
  { id: "nail_file",         text: "Törpü",                       emoji: "💅" },
  { id: "7eleven_photo",     text: "7-Eleven fotoğraf gaste",     emoji: "📸" },
  { id: "nail_clipper",      text: "Tırnak makası",               emoji: "✂️" },
  { id: "mascara",           text: "Rimel",                       emoji: "💄" },
  { id: "sunscreen",         text: "Güneş kremi",                 emoji: "🧴" },
  { id: "makeup_box",        text: "Makyaj kutusu",               emoji: "👜" },
  { id: "omurice_pan",       text: "Omurice tavası (dikdörtgen)", emoji: "🍳" },
  { id: "canmake_eyeliner",  text: "Canmake eyeliner",            emoji: "👁" },
  { id: "thermos",           text: "Termos",                      emoji: "🍵" },
  { id: "acne_patch",        text: "Akne bandı",                  emoji: "🩹" },
  { id: "lipstick",          text: "Ruj",                         emoji: "💋" },
  { id: "watch",             text: "Saat",                        emoji: "⌚" },
  { id: "nail_polish",       text: "Oje",                         emoji: "💅" }
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
