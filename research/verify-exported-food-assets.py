"""Confirm every reviewed source image is present unchanged in an Expo export."""
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
export = Path(sys.argv[1]).resolve()
metadata = json.loads((export / 'metadata.json').read_text(encoding='utf8'))
source_files = list((ROOT / 'mobile/assets/food').rglob('*.webp'))
expected = {sha256(p.read_bytes()).hexdigest(): p.relative_to(ROOT).as_posix() for p in source_files}
assert len(expected) == len(source_files), 'Duplicate source image bytes'
checks = {}
for platform, data in metadata['fileMetadata'].items():
    files = [export / asset['path'] for asset in data['assets'] if asset['ext'] == 'webp']
    hashes = {sha256(p.read_bytes()).hexdigest() for p in files}
    missing = [name for digest, name in expected.items() if digest not in hashes]
    checks[platform] = {'expected': len(expected), 'matched': len(expected)-len(missing), 'missing': missing}
# Web exports use hashed .webp filenames, while native assets have extensionless names.
web_hashes = {sha256(p.read_bytes()).hexdigest() for p in export.rglob('*.webp')}
missing = [name for digest, name in expected.items() if digest not in web_hashes]
checks['web'] = {'expected': len(expected), 'matched': len(expected)-len(missing), 'missing': missing}
report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'exportDirectoryName': export.name,
          'registrySha256': sha256((ROOT / 'mobile/src/local-food-assets.js').read_bytes()).hexdigest(),
          'platforms': checks, 'passed': all(not check['missing'] for check in checks.values())}
(ROOT / 'research/local-photo-export-validation.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf8')
print(json.dumps(report, indent=2))
sys.exit(0 if report['passed'] else 1)
