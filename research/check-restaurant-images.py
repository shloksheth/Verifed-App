"""Check the public images used by the restaurant browser.

These URLs came from each restaurant's own website, not a stock-photo search.
Run this script to refresh the HTTP, media-type and image-size evidence.
The check keeps image bytes in memory and does not redistribute original files.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
import json
import urllib.request

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "research/restaurant-images.json"


def inspect(pair):
    key, entry = pair
    if not entry.get("imageUrl"):
        return key, entry
    request = urllib.request.Request(entry["imageUrl"], headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read()
            picture = Image.open(BytesIO(data))
            evidence = {
                "status": response.status,
                "contentType": response.headers.get("Content-Type"),
                "bytes": len(data),
                "width": picture.width,
                "height": picture.height,
                "checkedAt": datetime.now(timezone.utc).isoformat(),
            }
            if not evidence["contentType"].startswith("image/") or min(picture.size) < 150:
                raise ValueError("Not a usable restaurant image")
            return key, {**entry, "verification": evidence}
    except Exception as error:
        return key, {**entry, "verification": {"error": str(error)}}


if __name__ == "__main__":
    entries = json.loads(TARGET.read_text(encoding="utf-8"))
    result = dict(ThreadPoolExecutor(max_workers=8).map(inspect, entries.items()))
    TARGET.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for key, value in result.items():
        print(key, value.get("verification", {"status": "no verified image available"}))
