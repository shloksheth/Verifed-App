"""Check the local image inventory and fail --require-complete until every item passes."""
import argparse
from collections import defaultdict
from hashlib import sha256
import json
from pathlib import Path
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument("--require-complete", action="store_true")
args = parser.parse_args()
manifest = json.loads((ROOT / "research/local-photo-manifest.json").read_text(encoding="utf-8"))
approved, shared, errors, missing = [], [], [], []
items_by_key = {item['catalogKey']: item for item in manifest['items']}
by_restaurant = {}
hashes = defaultdict(list)
for item in manifest["items"]:
    summary = by_restaurant.setdefault(item["restaurant"], {"active": 0, "approved": 0, "shared": 0, "generated": 0})
    summary["active"] += 1
    if item["review"]["status"] != "approved":
        source = items_by_key.get(item.get('sharedPhotoFrom'))
        if source:
            # Only the same national Taco Bell product can share a photo.
            # A second branch is not a second individually reviewed image.
            fields = ('name', 'description', 'ingredients', 'servingSize', 'kind')
            same_product = all(item['specification'].get(field) == source['specification'].get(field) for field in fields)
            allowed_branch = item['restaurant'] in ('taco-bell-east-colonial', 'taco-bell-orlando-west')
            if not (allowed_branch and source['restaurant'] == 'taco-bell-south-orange'
                    and item['itemKey'] == source['itemKey'] and same_product
                    and source['review']['status'] == 'approved'):
                errors.append({'key': item['catalogKey'], 'error': 'Invalid shared chain product'})
            else:
                shared.append(item['catalogKey'])
                summary['shared'] += 1
                continue
        missing.append(item["catalogKey"])
        continue
    key = item["catalogKey"]
    target = ROOT / "mobile/assets/food" / item["restaurant"] / f"{item['itemKey']}.webp"
    try:
        data = target.read_bytes()
        with Image.open(target) as image:
            image.load()
            if image.format != "WEBP":
                raise ValueError("Not WebP content")
            if min(image.size) < 96 or max(image.size) > 1200:
                raise ValueError(f"Unexpected dimensions {image.size}")
            hashes[sha256(image.convert("RGBA").tobytes()).hexdigest()].append(key)
        candidate = next(candidate for candidate in item["candidates"] if candidate["id"] == item["review"]["selectedCandidateId"])
        if sha256(data).hexdigest() != candidate["sha256"]:
            raise ValueError("Asset changed after visual inspection")
        for check in ("identity", "ingredients", "portion", "framing", "quality"):
            if item["review"].get("checks", {}).get(check) != "pass":
                raise ValueError(f"Missing {check} approval")
        approved.append(key)
        summary["approved"] += 1
        summary["generated"] += candidate.get("origin") == "generated"
    except Exception as error:
        errors.append({"key": key, "error": str(error)})
duplicates = [keys for keys in hashes.values() if len(keys) > 1]
report = {"activeItems": len(manifest["items"]), "approvedLocalImages": len(approved),
          "sharedLocalEntries": len(shared), "coveredLocalEntries": len(approved) + len(shared),
          "remaining": len(missing), "errors": errors, "duplicateFinalImages": duplicates,
          "restaurants": by_restaurant,
          "complete": not missing and not errors and not duplicates}
(ROOT / "research/local-photo-coverage.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, indent=2))
sys.exit(1 if errors or duplicates or (args.require_complete and missing) else 0)
