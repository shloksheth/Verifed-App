"""Copy generated outputs into the project and retain provenance; approval is separate."""
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import sys
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
manifest_path = ROOT / "research/local-photo-manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
jobs = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
for job in jobs:
    item = next(item for item in manifest["items"] if item["catalogKey"] == job["catalogKey"])
    source = Path(job["sourceFile"])
    original_hash = sha256(source.read_bytes()).hexdigest()
    candidate_id = "generated-" + original_hash[:16]
    destination = ROOT / "research/generated-photo-candidates" / f"{item['catalogKey']}-{original_hash[:8]}.webp"
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        image.save(destination, "WEBP", quality=86, method=6)
    with Image.open(destination) as final:
        final.load()
        width, height = final.size
        pixel_hash = sha256(final.convert("RGBA").tobytes()).hexdigest()
    generation = {
        "tool": "image_gen.imagegen built-in",
        "prompt": job["prompt"],
        "createdAt": datetime.fromtimestamp(source.stat().st_mtime, timezone.utc).isoformat(),
        "originalSha256": original_hash,
        "operation": "reference-guided reconstruction" if job.get("referenceFile") else "from-scratch",
    }
    if job.get("referenceFile"):
        reference_hash = sha256(Path(job["referenceFile"]).read_bytes()).hexdigest()
        reference = next((candidate for candidate in item["candidates"] if candidate.get("sha256") == reference_hash or candidate.get("generation", {}).get("originalSha256") == reference_hash), None)
        generation["reference"] = {"sha256": reference_hash, "candidateId": reference["id"] if reference else None, "sourceUrl": reference.get("sourceUrl") if reference else None}
    candidate = {
        "id": candidate_id, "origin": "generated", "kind": "generated-illustration",
        "path": destination.relative_to(ROOT).as_posix(),
        "sha256": sha256(destination.read_bytes()).hexdigest(), "pixelHash": pixel_hash,
        "width": width, "height": height, "bytes": destination.stat().st_size,
        "status": "generated-awaiting-visual-review", "generation": generation,
        "alt": "Menu illustration of " + item["specification"]["name"],
        "credit": "Verifed generated menu illustration",
    }
    if not any(previous["id"] == candidate_id for previous in item["candidates"]):
        item["candidates"].append(candidate)
    print(json.dumps({"key": item["catalogKey"], "id": candidate_id, "path": str(destination)}))
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
