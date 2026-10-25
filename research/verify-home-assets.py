"""Check the Home photos/fonts against the actual native and web export bytes."""
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parent.parent
export = Path(sys.argv[1]).resolve()
metadata = json.loads((export / "metadata.json").read_text(encoding="utf8"))
paths = [
    "assets/food/hawkers-orlando/roti-canai.webp",
    "assets/home/chipotle-vegetarian-bowl.webp",
    "assets/fonts/Sora-SemiBold.ttf",
    "assets/fonts/DMSans-Regular.ttf",
    "assets/fonts/DMSans-Medium.ttf",
]
sources = {path: sha256((root / "mobile" / path).read_bytes()).hexdigest() for path in paths}
checks = {}
for platform, bundle in metadata["fileMetadata"].items():
    hashes = {sha256((export / asset["path"]).read_bytes()).hexdigest() for asset in bundle["assets"]}
    checks[platform] = {path: digest in hashes for path, digest in sources.items()}
web_hashes = {sha256(path.read_bytes()).hexdigest() for path in export.rglob("*") if path.suffix in {".webp", ".ttf"}}
checks["web"] = {path: digest in web_hashes for path, digest in sources.items()}
report = {
    "checkedAt": datetime.now(timezone.utc).isoformat(),
    "exportDirectory": export.name,
    "sourceHashes": sources,
    "platforms": checks,
    "passed": all(all(matches.values()) for matches in checks.values()),
    "chipotlePhoto": {
        "generated": False,
        "credit": "Chipotle Mexican Grill, Inc. via Food Business News",
        "source": "https://www.foodbusinessnews.net/articles/13410-chipotle-serving-new-plant-powered-lifestyle-bowls",
        "use": "Restaurant cover, not an ingredient-specific menu photograph or dietary-suitability claim",
    },
}
(root / "research/home-v18-asset-verification.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
print(json.dumps(report, indent=2))
sys.exit(0 if report["passed"] else 1)
