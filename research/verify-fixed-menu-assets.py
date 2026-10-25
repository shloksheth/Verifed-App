"""Check the bundled source-menu image survives native and web exports unchanged."""
from hashlib import sha256
import json
from pathlib import Path
import sys

repo = Path(__file__).resolve().parent.parent
export = Path(sys.argv[1]).resolve()
source = json.loads((repo / "research/fixed-menu-source.json").read_text(encoding="utf8"))
image = repo / "mobile" / source["appAsset"]
digest = sha256(image.read_bytes()).hexdigest()
assert digest == source["appAssetSha256"], "Source image differs from its provenance record"
metadata = json.loads((export / "metadata.json").read_text(encoding="utf8"))
checks = {}
for platform, data in metadata["fileMetadata"].items():
    paths = [export / asset["path"] for asset in data["assets"] if asset["ext"] == "webp"]
    checks[platform] = any(sha256(path.read_bytes()).hexdigest() == digest for path in paths)
checks["web"] = any(sha256(path.read_bytes()).hexdigest() == digest for path in export.rglob("*.webp"))
report = {"asset": source["appAsset"], "sha256": digest, "platforms": checks, "passed": all(checks.values())}
(repo / "research/fixed-menu-asset-validation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
print(json.dumps(report, indent=2))
sys.exit(0 if report["passed"] else 1)
