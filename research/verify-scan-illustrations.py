"""Verify the four reviewed Sayola illustrations survive every platform export."""
from hashlib import sha256
import json
from pathlib import Path
import sys

repo = Path(__file__).resolve().parent.parent
export = Path(sys.argv[1]).resolve()
provenance = json.loads((repo / "research/sayola-illustration-provenance.json").read_text(encoding="utf8"))
metadata = json.loads((export / "metadata.json").read_text(encoding="utf8"))
platform_hashes = {}
for platform, data in metadata["fileMetadata"].items():
    platform_hashes[platform] = {
        sha256((export / asset["path"]).read_bytes()).hexdigest()
        for asset in data["assets"] if asset["ext"] == "webp"
    }
platform_hashes["web"] = {sha256(path.read_bytes()).hexdigest() for path in export.rglob("*.webp")}
checks = []
for image in provenance["images"]:
    digest = sha256((repo / image["asset"]).read_bytes()).hexdigest()
    checks.append({
        "itemId": image["itemId"], "asset": image["asset"],
        "provenanceMatches": digest == image["sha256"],
        "platforms": {name: digest in hashes for name, hashes in platform_hashes.items()},
    })
passed = all(row["provenanceMatches"] and all(row["platforms"].values()) for row in checks)
report = {"passed": passed, "images": checks}
(repo / "research/sayola-illustration-validation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
print(json.dumps(report, indent=2))
sys.exit(0 if passed else 1)
