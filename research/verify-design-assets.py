"""Verify the new font faces and the Home photographs in each exported app."""
from hashlib import sha256
import json
from pathlib import Path
import sys

repo = Path(__file__).resolve().parent.parent
export = Path(sys.argv[1]).resolve()
font_sources = json.loads((repo / "mobile/assets/fonts/editorial-font-sources.json").read_text(encoding="utf8"))
expected = {}
for font in font_sources["files"]:
    name = "assets/fonts/" + font["file"]
    digest = sha256((repo / "mobile" / name).read_bytes()).hexdigest()
    assert digest == font["sha256"], name
    expected[name] = digest
for name in ["assets/home/chipotle-vegetarian-bowl.webp", "assets/food/hawkers-orlando/roti-canai.webp"]:
    expected[name] = sha256((repo / "mobile" / name).read_bytes()).hexdigest()
metadata = json.loads((export / "metadata.json").read_text(encoding="utf8"))
checks = {}
for platform, data in metadata["fileMetadata"].items():
    paths = [export / asset["path"] for asset in data["assets"] if asset["ext"] in {"ttf", "webp"}]
    hashes = {sha256(path.read_bytes()).hexdigest() for path in paths}
    checks[platform] = [name for name, digest in expected.items() if digest not in hashes]
web_hashes = {sha256(path.read_bytes()).hexdigest() for path in export.rglob("*") if path.is_file() and path.suffix in {".ttf", ".webp"}}
checks["web"] = [name for name, digest in expected.items() if digest not in web_hashes]
report = {"version": 21, "expectedAssets": len(expected), "missingByPlatform": checks, "passed": all(not names for names in checks.values())}
(repo / "research/design-v21-asset-validation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
print(json.dumps(report, indent=2))
sys.exit(0 if report["passed"] else 1)
