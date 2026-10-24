"""Record actual researched candidates and download them; visual review is separate."""
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import runpy
import sys

ROOT = Path(__file__).resolve().parent.parent
download = runpy.run_path(str(ROOT / "research/download-photo-candidates.py"))["download"]
manifest_path = ROOT / "research/local-photo-manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
for research in json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")):
    item = next(item for item in manifest["items"] if item["catalogKey"] == research["catalogKey"])
    for source in research["candidates"]:
        candidate = {
            "id": sha256(source["url"].encode()).hexdigest()[:16], "origin": "sourced",
            "kind": "research-candidate", **source, **download(source["url"]),
        }
        if not any(previous["id"] == candidate["id"] for previous in item["candidates"]):
            item["candidates"].append(candidate)
        print(json.dumps({"key": item["catalogKey"], "id": candidate["id"], "path": candidate.get("path"), "status": candidate["status"]}))
    item["searchLog"].append({"query": research["query"], "searchedAt": datetime.now(timezone.utc).isoformat(), "candidateCount": len(research["candidates"]), "inspectedCandidateCount": 0, "result": "Downloaded candidates await actual visual inspection; no automatic approval."})
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
