#!/usr/bin/env python3
"""
Google Takeout "Maps (your places)" çıktısını parse edip js/places.js oluşturur.
Sadece KR / JP / UZ ülkelerini dahil eder (kullanıcı tercihi).

Kullanım:
  python3 scripts/parse-places.py "/path/to/Takeout/Haritalar (yerleriniz)"

Birden fazla input klasörü/dosyası verilebilir; hepsi birleştirilir, duplicate'lar
google_maps_url üzerinden tekilleştirilir.
"""

import json
import os
import re
import sys
import hashlib
from pathlib import Path

ALLOWED_COUNTRIES = {"KR", "JP", "UZ"}

# city detection — substring match (case-insensitive) on address; first match wins.
CITY_RULES = [
    # Korea
    ("Seoul",      ["seoul", "서울"]),
    ("Busan",      ["busan", "부산"]),
    ("Incheon",    ["incheon", "인천"]),
    ("Jeju",       ["jeju", "제주"]),
    ("Daegu",      ["daegu", "대구"]),
    ("Gyeongju",   ["gyeongju", "경주"]),
    # Japan
    ("Tokyo",      ["tokyo", "東京"]),
    ("Osaka",      ["osaka", "大阪"]),
    ("Kyoto",      ["kyoto", "京都"]),
    ("Nara",       ["nara", "奈良"]),
    ("Hiroshima",  ["hiroshima", "広島"]),
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

# (label, emoji, keyword groups) — first match wins
TYPE_RULES = [
    ("Tapınak",       "⛩",  ["temple", "shrine", "절", "사", "寺", "神社", "교회"]),
    ("Tarihi",        "🏯",  ["palace", "castle", "fortress", "wall trail", "gung", "궁", "城", "성", "tomb", "kremlin", "madrasa", "mausoleum", "registan"]),
    ("Park & Doğa",   "🌳",  ["park", "garden", "trail", "공원", "정원", "공원", "공원", "森林", "山", "여행", "hike", "mountain"]),
    ("Manzara",       "📷",  ["tower", "skyline", "view", "lookout", "observatory", "전망"]),
    ("Müze",          "🏛",  ["museum", "gallery", "박물관", "美術館"]),
    ("Alışveriş",     "🛍",  ["mall", "market", "shop", "store", "department", "백화점", "市場", "bazaar", "bozor"]),
    ("Yemek",         "🍜",  ["restaurant", "cafe", "ramen", "sushi", "bbq", "izakaya", "식당", "라멘", "스시", "麺", "寿司", "오마카세"]),
    ("Eğlence",       "🎢",  ["playground", "amusement", "theme park", "놀이공원", "ディズニー", "유원지"]),
    ("Konaklama",     "🏨",  ["hotel", "ryokan", "guesthouse", "호텔", "ホテル", "旅館"]),
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


def detect_city(address, country_code):
    if not address:
        return None
    a = address.lower()
    for name, keys in CITY_RULES:
        for k in keys:
            if k.lower() in a:
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
    if "güney kore" in a or "south korea" in a or "south korean" in a or "republic of korea" in a:
        return "KR"
    if "japonya" in a or "japan" in a:
        return "JP"
    if "özbekistan" in a or "uzbekistan" in a or "o'zbekiston" in a:
        return "UZ"
    if "türkiye" in a or "turkey" in a:
        return "TR"
    return None


def stable_id(url, name):
    seed = (url or "") + "|" + (name or "")
    return "p_" + hashlib.sha1(seed.encode("utf-8")).hexdigest()[:12]


def collect_features(input_paths):
    features = []
    for p in input_paths:
        path = Path(p)
        if path.is_dir():
            for jf in sorted(path.rglob("*.json")):
                with open(jf, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for ft in data.get("features", []):
                    features.append((jf.name, ft))
        elif path.is_file() and path.suffix == ".json":
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for ft in data.get("features", []):
                features.append((path.name, ft))
    return features


def build_places(features):
    seen = set()
    out = []
    for src, ft in features:
        props = ft.get("properties", {}) or {}
        loc = props.get("location") or {}
        geom = ft.get("geometry") or {}
        coords = geom.get("coordinates") or [None, None]
        lng, lat = coords[0] if coords else None, coords[1] if len(coords) > 1 else None
        if (not lat and not lng) or (lat == 0 and lng == 0):
            continue

        name = (loc.get("name") or props.get("Comment") or "").strip()
        address = (loc.get("address") or "").strip()
        url = props.get("google_maps_url") or ""

        country = country_from_address(address, loc.get("country_code"))
        if country not in ALLOWED_COUNTRIES:
            continue
        if not name:
            continue

        city = detect_city(address, country)
        type_label, type_emoji = detect_type(name)
        pid = stable_id(url, name)
        if pid in seen:
            continue
        seen.add(pid)

        out.append({
            "id": pid,
            "name": name,
            "address": address,
            "country": country,
            "city": city or "Diğer",
            "type": type_label,
            "typeEmoji": type_emoji,
            "lat": round(float(lat), 7),
            "lng": round(float(lng), 7),
            "googleUrl": url,
            "comment": (props.get("Comment") or "").strip() or None,
            "source": src,
        })
    return out


def render_js(places):
    # Sort: country → city → name
    places.sort(key=lambda p: (p["country"], p["city"], p["name"].lower()))

    # Build city/country index for UI
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
        "// AUTO-GENERATED by scripts/parse-places.py — DÜZENLEME yapma, kaynak:\n"
        "// /Users/.../Takeout/Haritalar (yerleriniz)/*.json\n"
        f"// places: {len(places)} | countries: {[c['code'] for c in countries_meta]}\n\n"
        "window.PLACES = " + json.dumps(places, ensure_ascii=False, indent=2) + ";\n\n"
        "window.PLACE_COUNTRIES = " + json.dumps(countries_meta, ensure_ascii=False, indent=2) + ";\n"
    )


def main():
    if len(sys.argv) < 2:
        print("usage: parse-places.py <takeout-dir-or-json> [more...]")
        sys.exit(1)
    feats = collect_features(sys.argv[1:])
    print(f"Found {len(feats)} raw features", file=sys.stderr)
    places = build_places(feats)
    print(f"Kept {len(places)} places after filter (KR/JP/UZ, has-coords, has-name)", file=sys.stderr)
    out_dir = Path(__file__).resolve().parent.parent / "js"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "places.js"
    out_path.write_text(render_js(places), encoding="utf-8")
    print(f"Wrote {out_path}", file=sys.stderr)
    # Print summary
    by_country = {}
    for p in places:
        by_country.setdefault(p["country"], 0)
        by_country[p["country"]] += 1
    print("Summary:", by_country, file=sys.stderr)


if __name__ == "__main__":
    main()
