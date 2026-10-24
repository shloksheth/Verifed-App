"""Download source candidates without granting visual approval or changing the app.

Run after prepare-local-photo-review.mjs. Re-running resumes valid downloads.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "research/local-photo-manifest.json"
MAX_BYTES = 24 * 1024 * 1024


def download(url):
    parsed = urlparse(url)
    if parsed.scheme not in ("https", "http") or not parsed.hostname:
        return {"status": "download-failed", "error": "Invalid source URL"}
    cache_key = sha256(url.encode()).hexdigest()
    relative = f"research/photo-candidates/{cache_key}.webp"
    destination = ROOT / relative
    try:
        if not destination.exists():
            request = Request(url, headers={"User-Agent": "Mozilla/5.0 Verifed menu photo review"})
            with urlopen(request, timeout=25) as response:
                raw = response.read(MAX_BYTES + 1)
                if len(raw) > MAX_BYTES:
                    raise ValueError("Image exceeds the 24 MB download limit")
            with Image.open(BytesIO(raw)) as original:
                original.load()
                if original.width * original.height > 40_000_000:
                    raise ValueError("Image exceeds the 40 megapixel limit")
                image = ImageOps.exif_transpose(original)
                has_alpha = "A" in image.getbands() or "transparency" in image.info
                image = image.convert("RGBA" if has_alpha else "RGB")
                image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                destination.parent.mkdir(parents=True, exist_ok=True)
                image.save(destination, "WEBP", quality=84, method=6)
        with Image.open(destination) as image:
            image.load()
            width, height = image.size
            pixel_hash = sha256(image.convert("RGBA").tobytes()).hexdigest()
        data = destination.read_bytes()
        return {"status": "downloaded-unreviewed", "path": relative,
                "sha256": sha256(data).hexdigest(), "pixelHash": pixel_hash,
                "width": width, "height": height, "bytes": len(data)}
    except Exception as error:
        return {"status": "download-failed", "error": f"{type(error).__name__}: {error}"[:300]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    urls = sorted({candidate["url"] for item in manifest["items"] for candidate in item["candidates"] if candidate.get("url")})
    results = {}
    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 12))) as executor:
        futures = {executor.submit(download, url): url for url in urls}
        for future in as_completed(futures):
            results[futures[future]] = future.result()
            if len(results) % 25 == 0:
                print(f"Downloaded/checked {len(results)}/{len(urls)} source candidates", flush=True)
    for item in manifest["items"]:
        for candidate in item["candidates"]:
            if item["review"]["status"] == "approved" and candidate["id"] == item["review"]["selectedCandidateId"]:
                # A later host download must not rewrite an already inspected asset.
                continue
            if candidate.get("url") in results:
                candidate.update(results[candidate["url"]])
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"uniqueSources": len(urls), "downloaded": sum(result["status"] == "downloaded-unreviewed" for result in results.values()), "failed": sum(result["status"] == "download-failed" for result in results.values())}))


if __name__ == "__main__":
    main()
