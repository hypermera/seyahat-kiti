#!/usr/bin/env python3
"""
Google Takeout (Maps + Kaydedildi/Listeler + Haritalarım) çıktısını parse eder.
Sadece KR / JP / UZ ülkelerini dahil eder (kullanıcı tercihi).

Kullanım:
  python3 scripts/parse-places.py "/path/to/Takeout"
  python3 scripts/parse-places.py "/path1/Takeout" "/path2/Takeout 2"

Birden fazla input verilebilir; hepsi birleştirilir, duplicate'lar URL ya da
lat/lng üzerinden tekilleştirilir. Şehre göre daha spesifik kayıt tercih edilir.
"""

import csv
import hashlib
import json
import os
import re
import sys
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


def nfc(s):
    return unicodedata.normalize("NFC", s) if s else s

ALLOWED_COUNTRIES = {"KR", "JP", "UZ"}

# ───── List file → metadata mapping ─────
# Country/city assignment from list filenames (kept here so user can edit).
LIST_METADATA = {
    "Japonya.csv":         {"country": "JP", "city": None},
    "Kore.csv":            {"country": "KR", "city": None},
    "özbekistan.csv":      {"country": "UZ", "city": None},
    "Kyoto.csv":           {"country": "JP", "city": "Kyoto"},
    "Tokyo.kmz":           {"country": "JP", "city": "Tokyo"},
    "Gezdiklerimiz.csv":   {"country": "JP", "city": None},
    "Favori yerler.csv":   {"country": "JP", "city": None},
    "Perfect days.csv":    {"country": "JP", "city": None},
}

SKIP_LISTS = {
    "İzmir.csv", "Tayland.csv", "Malezya.csv",
    "Görseller.csv", "Daha sonrası için kaydedilenler.csv",
    "Varsayılan liste.csv",
}

CITY_RULES = [
    # Korea
    ("Seoul",      ["seoul", "서울"]),
    ("Busan",      ["busan", "부산"]),
    ("Incheon",    ["incheon", "인천"]),
    ("Jeju",       ["jeju", "제주"]),
    ("Daegu",      ["daegu", "대구"]),
    ("Gyeongju",   ["gyeongju", "경주"]),
    # Japan
    ("Tokyo",      ["tokyo", "東京", "shibuya", "shinjuku", "akihabara", "harajuku", "ginza", "asakusa", "ueno", "ikebukuro", "roppongi"]),
    ("Osaka",      ["osaka", "大阪", "namba", "umeda", "dotonbori"]),
    ("Kyoto",      ["kyoto", "京都", "gion", "arashiyama", "fushimi"]),
    ("Nara",       ["nara", "奈良"]),
    ("Hiroshima",  ["hiroshima", "広島", "miyajima"]),
    ("Yokohama",   ["yokohama", "横浜"]),
    ("Kobe",       ["kobe", "神戸"]),
    ("Fukuoka",    ["fukuoka", "福岡"]),
    ("Sapporo",    ["sapporo", "札幌"]),
    # Uzbekistan
    ("Tashkent",   ["tashkent", "toshkent", "ташкент"]),
    ("Samarkand",  ["samarkand", "samarqand", "самарканд"]),
    ("Bukhara",    ["bukhara", "buxoro", "бухара"]),
    ("Khiva",      ["khiva", "xiva"]),
    ("Fergana",    ["fergana", "farg'ona", "фергана"]),
]

TYPE_RULES = [
    ("Tapınak",       "⛩",  ["temple", "shrine", "절", "사", "寺", "神社", "-ji", "jingu", "kannon", "miyajima"]),
    ("Tarihi",        "🏯",  ["palace", "castle", "fortress", "wall trail", "gung", "궁", "城", "성", "tomb", "kremlin", "madrasa", "mausoleum", "registan", "memorial"]),
    ("Park & Doğa",   "🌳",  ["park", "garden", "trail", "공원", "정원", "庭園", "森林", "山", "hike", "mountain", "森", "river", "lake", "falls", "waterfall"]),
    ("Manzara",       "📷",  ["tower", "skyline", "view", "lookout", "observatory", "전망", "skytree", "skydeck"]),
    ("Müze",          "🏛",  ["museum", "gallery", "박물관", "美術館", "博物館"]),
    ("Alışveriş",     "🛍",  ["mall", "market", "shop", "store", "department", "백화점", "市場", "bazaar", "bozor", "broadway", "don quijote", "donki", "uniqlo", "muji", "book off", "ginza six"]),
    ("Yemek",         "🍜",  ["restaurant", "cafe", "ramen", "sushi", "bbq", "izakaya", "식당", "라멘", "스시", "麺", "寿司", "오마카세", "kitchen", "shokudo", "wendy", "starbucks", "matcha", "kissaten", "yakiniku", "udon", "soba", "tempura", "donut"]),
    ("Eğlence",       "🎢",  ["playground", "amusement", "theme park", "놀이공원", "ディズニー", "유원지", "disney", "universal", "arcade", "game center", "karaoke"]),
    ("Konaklama",     "🏨",  ["hotel", "ryokan", "guesthouse", "호텔", "ホテル", "旅館", "inn", "hostel"]),
    ("Ulaşım",        "🚉",  ["station", "airport", "havalimanı", "uluslararası", "주차장", "駅", "터미널"]),
]

DEFAULT_TYPE = ("Diğer", "📍")

CITY_TO_COUNTRY = {
    "Seoul": "KR", "Busan": "KR", "Incheon": "KR", "Jeju": "KR",
    "Daegu": "KR", "Gyeongju": "KR",
    "Tokyo": "JP", "Osaka": "JP", "Kyoto": "JP", "Nara": "JP",
    "Hiroshima": "JP", "Yokohama": "JP", "Kobe": "JP", "Fukuoka": "JP", "Sapporo": "JP",
    "Tashkent": "UZ", "Samarkand": "UZ", "Bukhara": "UZ", "Khiva": "UZ", "Fergana": "UZ",
}

COUNTRY_LABEL = {"KR": "Güney Kore", "JP": "Japonya", "UZ": "Özbekistan"}

KML_NS = {"kml": "http://www.opengis.net/kml/2.2"}


def detect_city(text, country_code):
    """text = address or name; country filter ensures sanity."""
    if not text:
        return None
    t = text.lower()
    for name, keys in CITY_RULES:
        for k in keys:
            if k.lower() in t:
                if country_code and CITY_TO_COUNTRY.get(name) and CITY_TO_COUNTRY[name] != country_code:
                    continue
                return name
    return None


def detect_type(name):
    if not name:
        return DEFAULT_TYPE
    n = name.lower()
    for label, emoji, keys in TYPE_RULES:
        for k in keys:
            if k.lower() in n:
                return (label, emoji)
    return DEFAULT_TYPE


def country_from_address(address, country_code):
    if country_code:
        return country_code
    if not address:
        return None
    a = address.lower()
    if any(s in a for s in ["güney kore", "south korea", "republic of korea"]):
        return "KR"
    if "japonya" in a or "japan" in a or "japan," in a:
        return "JP"
    if "özbekistan" in a or "uzbekistan" in a or "o'zbekiston" in a:
        return "UZ"
    if "türkiye" in a or "turkey" in a:
        return "TR"
    return None


def stable_id(*parts):
    seed = "|".join(str(p) for p in parts if p)
    return "p_" + hashlib.sha1(seed.encode("utf-8")).hexdigest()[:12]


def parse_csv_list(path: Path, country: str, city):
    results = []
    with open(path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("Başlık") or "").strip()
            url = (row.get("URL") or "").strip()
            if not name or not url:
                continue
            if "google.com/maps" not in url:
                continue
            comment = (row.get("Yorum") or "").strip() or None
            note = (row.get("Not") or "").strip() or None
            results.append({
                "name": name,
                "googleUrl": url,
                "country": country,
                "city": city,
                "comment": comment,
                "note": note,
                "lat": None,
                "lng": None,
                "address": None,
                "source": path.name,
            })
    return results


def parse_kmz(path: Path, country: str, city):
    results = []
    try:
        with zipfile.ZipFile(path) as z:
            for member in z.namelist():
                if not member.endswith(".kml"):
                    continue
                with z.open(member) as f:
                    content = f.read().decode("utf-8", errors="ignore")
                root = ET.fromstring(content)
                for pm in root.iter("{http://www.opengis.net/kml/2.2}Placemark"):
                    nm = pm.find("kml:name", KML_NS)
                    pt = pm.find("kml:Point", KML_NS)
                    if pt is None:
                        continue
                    coords_el = pt.find("kml:coordinates", KML_NS)
                    if coords_el is None or coords_el.text is None:
                        continue
                    cs = coords_el.text.strip().split(",")
                    if len(cs) < 2:
                        continue
                    try:
                        lng, lat = float(cs[0]), float(cs[1])
                    except ValueError:
                        continue
                    name = nm.text.strip() if nm is not None and nm.text else "Unnamed"
                    results.append({
                        "name": name,
                        "googleUrl": None,
                        "country": country,
                        "city": city,
                        "comment": None,
                        "note": None,
                        "lat": lat,
                        "lng": lng,
                        "address": None,
                        "source": path.name,
                    })
    except (zipfile.BadZipFile, ET.ParseError) as e:
        print(f"  ! KMZ parse error in {path.name}: {e}", file=sys.stderr)
    return results


def parse_geojson(path: Path):
    results = []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for ft in data.get("features", []):
        props = ft.get("properties", {}) or {}
        loc = props.get("location") or {}
        name = (loc.get("name") or props.get("name") or props.get("Comment") or "").strip()
        address = (loc.get("address") or props.get("address") or "").strip()
        coords = (ft.get("geometry") or {}).get("coordinates") or [None, None]
        lng = coords[0] if coords else None
        lat = coords[1] if coords and len(coords) > 1 else None
        url = props.get("google_maps_url")
        cc = country_from_address(address, loc.get("country_code"))
        if cc not in ALLOWED_COUNTRIES:
            continue
        if not name:
            continue
        if (lat == 0 and lng == 0):
            lat, lng = None, None
        results.append({
            "name": name,
            "googleUrl": url,
            "country": cc,
            "city": detect_city(address, cc),
            "comment": (props.get("Comment") or "").strip() or None,
            "note": None,
            "lat": lat,
            "lng": lng,
            "address": address,
            "source": path.name,
        })
    return results


def collect_from_dir(input_dir: Path):
    """Walk a Takeout directory and collect all relevant places."""
    found = []
    if not input_dir.exists():
        print(f"  ! {input_dir} not found", file=sys.stderr)
        return found

    for root, _, files in os.walk(input_dir):
        for fname in files:
            full = Path(root) / fname

            # Skip macOS metadata files
            if fname.startswith("."):
                continue

            # macOS uses NFD-decomposed filenames; LIST_METADATA keys are in NFC
            fname_nfc = nfc(fname)

            if fname_nfc in SKIP_LISTS:
                print(f"  · skipped {fname_nfc}", file=sys.stderr)
                continue

            meta = LIST_METADATA.get(fname_nfc)
            fname = fname_nfc
            if meta:
                if fname.endswith(".csv"):
                    items = parse_csv_list(full, meta["country"], meta["city"])
                    print(f"  + {fname}: {len(items)} from CSV", file=sys.stderr)
                    found.extend(items)
                elif fname.endswith(".kmz"):
                    items = parse_kmz(full, meta["country"], meta["city"])
                    print(f"  + {fname}: {len(items)} from KMZ", file=sys.stderr)
                    found.extend(items)
                continue

            # GeoJSON-style files (Saved Places, Yorumlar, Etiketli yerler)
            if fname in ("Kaydedilen Yerler.json", "Yorumlar.json", "Etiketli yerler.json"):
                items = parse_geojson(full)
                print(f"  + {fname}: {len(items)} from JSON", file=sys.stderr)
                found.extend(items)
                continue

    return found


def merge_and_dedupe(items):
    """Dedupe by URL or (lat,lng); when merging prefer richer record."""
    by_key = {}
    for item in items:
        # Filter again on country
        if item["country"] not in ALLOWED_COUNTRIES:
            continue
        if not item.get("name"):
            continue

        # Key: prefer URL (place_id is in URL), else (lat,lng), else name
        key = None
        if item.get("googleUrl"):
            # Strip URL to its place_id for stable key
            url = item["googleUrl"]
            m = re.search(r"!1s([0-9a-fx:]+)", url)
            if m:
                key = ("pid", m.group(1))
            else:
                key = ("url", url)
        elif item.get("lat") is not None and item.get("lng") is not None:
            key = ("ll", round(item["lat"], 4), round(item["lng"], 4))
        else:
            key = ("name", item["name"].lower(), item["country"])

        if key not in by_key:
            by_key[key] = item
        else:
            existing = by_key[key]
            # Merge: prefer record with city set, otherwise keep existing
            if not existing.get("city") and item.get("city"):
                existing["city"] = item["city"]
            if not existing.get("address") and item.get("address"):
                existing["address"] = item["address"]
            if not existing.get("comment") and item.get("comment"):
                existing["comment"] = item["comment"]
            if existing.get("lat") is None and item.get("lat") is not None:
                existing["lat"] = item["lat"]
                existing["lng"] = item["lng"]
            if not existing.get("googleUrl") and item.get("googleUrl"):
                existing["googleUrl"] = item["googleUrl"]
            # Track multiple sources
            srcs = (existing.get("source") or "").split("+")
            if item["source"] not in srcs:
                existing["source"] = "+".join(srcs + [item["source"]])

    return list(by_key.values())


def finalize_places(items):
    out = []
    for item in items:
        # If city not set, try detection on name (last-ditch)
        if not item.get("city"):
            inferred = detect_city(item["name"], item["country"])
            if inferred:
                item["city"] = inferred

        type_label, type_emoji = detect_type(item["name"])

        out.append({
            "id": stable_id(item.get("googleUrl"), item["name"], item["country"]),
            "name": item["name"],
            "address": item.get("address") or "",
            "country": item["country"],
            "city": item.get("city") or "Genel",
            "type": type_label,
            "typeEmoji": type_emoji,
            "lat": round(item["lat"], 6) if item.get("lat") is not None else None,
            "lng": round(item["lng"], 6) if item.get("lng") is not None else None,
            "googleUrl": item.get("googleUrl"),
            "comment": item.get("comment"),
            "source": item.get("source", ""),
        })
    return out


def render_js(places):
    places.sort(key=lambda p: (p["country"], p["city"], p["name"].lower()))

    countries = {}
    for p in places:
        countries.setdefault(p["country"], {})
        countries[p["country"]].setdefault(p["city"], 0)
        countries[p["country"]][p["city"]] += 1

    countries_meta = []
    for code, cities in countries.items():
        countries_meta.append({
            "code": code,
            "label": COUNTRY_LABEL.get(code, code),
            "cities": [{"name": c, "count": n} for c, n in sorted(cities.items(), key=lambda x: -x[1])],
            "total": sum(cities.values()),
        })
    countries_meta.sort(key=lambda c: -c["total"])

    return (
        "// AUTO-GENERATED by scripts/parse-places.py — DÜZENLEME yapma.\n"
        f"// places: {len(places)} | countries: {[c['code'] for c in countries_meta]}\n\n"
        "window.PLACES = " + json.dumps(places, ensure_ascii=False, indent=2) + ";\n\n"
        "window.PLACE_COUNTRIES = " + json.dumps(countries_meta, ensure_ascii=False, indent=2) + ";\n"
    )


def main():
    if len(sys.argv) < 2:
        print("usage: parse-places.py <takeout-dir> [more...]")
        sys.exit(1)

    raw = []
    for arg in sys.argv[1:]:
        path = Path(arg)
        print(f"→ Scanning {path}", file=sys.stderr)
        raw.extend(collect_from_dir(path))

    print(f"\nRaw items: {len(raw)}", file=sys.stderr)
    deduped = merge_and_dedupe(raw)
    print(f"After dedup: {len(deduped)}", file=sys.stderr)
    final = finalize_places(deduped)
    print(f"Final places: {len(final)}", file=sys.stderr)

    by_country = {}
    by_type = {}
    for p in final:
        by_country[p["country"]] = by_country.get(p["country"], 0) + 1
        by_type[p["type"]] = by_type.get(p["type"], 0) + 1
    print(f"\nBy country: {by_country}", file=sys.stderr)
    print(f"By type:    {by_type}", file=sys.stderr)

    out_dir = Path(__file__).resolve().parent.parent / "js"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "places.js"
    out_path.write_text(render_js(final), encoding="utf-8")
    print(f"\nWrote {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
