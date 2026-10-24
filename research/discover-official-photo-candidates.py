"""Discover named candidates on the published menu pages. Never approve by name alone."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import unicodedata
from urllib.parse import urljoin
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "research/local-photo-manifest.json"


def normalize(name):
    text = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", text.lower())


class MenuImages(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        source = attributes.get("data-src") or attributes.get("src")
        if tag == "img" and attributes.get("alt") and source and not source.startswith("data:"):
            self.images.append({"name": attributes["alt"], "url": source})


def inspect_page(url):
    try:
        request = Request(url, headers={"User-Agent": "Mozilla/5.0 Verifed menu photo review"})
        with urlopen(request, timeout=20) as response:
            content_type = response.headers.get("Content-Type", "")
            if "html" not in content_type:
                return url, [], "Non-HTML menu; no image-name associations extracted"
            text = response.read(5_000_001)
            if len(text) > 5_000_000:
                return url, [], "Page exceeded discovery size limit"
        parser = MenuImages()
        parser.feed(text.decode("utf-8", errors="replace"))
        return url, [{**image, "url": urljoin(url, image["url"])} for image in parser.images], None
    except Exception as error:
        return url, [], f"{type(error).__name__}: {error}"[:300]


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    menus = sorted({item["specification"]["menuUrl"] for item in manifest["items"] if item["specification"].get("menuUrl") and not item["specification"]["menuUrl"].lower().endswith(".pdf")})
    # Existing first-party Mamak category pages expose images omitted from its PDF inventory.
    menus.extend(["https://www.mamakeats.com/menu/asian-street-food", "https://www.mamakeats.com/menu/dinner", "https://www.mamakeats.com/menu/noodles"])
    with ThreadPoolExecutor(max_workers=4) as executor:
        pages = {url: {"images": images, "error": error} for url, images, error in executor.map(inspect_page, menus)}
    added = 0
    for item in manifest["items"]:
        urls = [item["specification"].get("menuUrl")]
        if item["restaurant"] == "mamak-colonial":
            urls += [url for url in pages if "mamakeats.com" in url]
        names = {normalize(item["specification"]["name"])}
        # A count omitted in image alt text is a candidate only, still requiring portion review.
        names.add(normalize(re.sub(r"\s*\(\d+\)\s*$", "", item["specification"]["name"])))
        for url in set(urls):
            for image in pages.get(url, {}).get("images", []):
                if normalize(image["name"]) not in names or any(candidate.get("url") == image["url"] for candidate in item["candidates"]):
                    continue
                item["candidates"].append({
                    "id": sha256(image["url"].encode()).hexdigest()[:16], "origin": "sourced",
                    "url": image["url"], "sourceUrl": url,
                    "credit": item["restaurantName"] + " published menu",
                    "alt": image["name"], "kind": "official-product", "status": "not-downloaded",
                    "discoveryMethod": "Published menu img alt matches normalized item name; not visual approval",
                })
                added += 1
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = {"searchedAt": datetime.now(timezone.utc).isoformat(), "pages": pages, "addedCandidates": added}
    (ROOT / "research/official-photo-discovery.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"pages": len(pages), "addedCandidates": added, "errors": {url: page["error"] for url, page in pages.items() if page["error"]}}, indent=2))


if __name__ == "__main__":
    main()
