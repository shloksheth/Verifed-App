"""Compare the saved Snack's actual download with every published local source file."""
from datetime import datetime, timezone
from hashlib import sha256
import io
import json
from pathlib import Path, PurePosixPath
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.request import urlopen
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
mobile = ROOT / 'mobile'
publication = json.loads((mobile / 'publication.json').read_text(encoding='utf8'))
identifier = publication['id']
assert re.fullmatch(r'[A-Za-z0-9_-]+', identifier), 'Invalid Snack ID'
expected = {'App.js', 'styles.js'}
for directory in ('src', 'components'):
    expected.update(f'{directory}/{p.name}' for p in (mobile / directory).glob('*.js')
                    if not (directory == 'components' and p.name in {'Scanner.js', 'Workspace.js', 'Requests.js'}))
expected.update(p.relative_to(mobile).as_posix() for p in (mobile / 'assets').rglob('*')
                if p.is_file() and p.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp', '.ttf'})
expected.update(p.relative_to(mobile).as_posix() for p in (mobile / 'assets/fonts').iterdir()
                if p.is_file() and p.suffix.lower() in {'.txt', '.json'})
assert set(publication['files']) == expected, 'Published inventory does not match local source'
try:
    with urlopen(f'https://exp.host/--/api/v2/snack/download/{identifier}', timeout=45) as response:
        data = response.read()
except (HTTPError, URLError, TimeoutError) as error:
    reason = f'HTTP {error.code}' if isinstance(error, HTTPError) else type(error).__name__
    report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'name': publication['name'],
              'snackId': identifier, 'expectedFiles': len(expected),
              'foodImages': sum(n.startswith('assets/food/') for n in expected),
              'errors': [{'reason': f'Snack download unavailable: {reason}'}], 'passed': False}
    (ROOT / 'research/local-photo-snack-validation.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf8')
    print(json.dumps(report, indent=2))
    sys.exit(1)
errors = []
with ZipFile(io.BytesIO(data)) as archive:
    entry = next(n for n in archive.namelist() if n == 'App.js' or n.endswith('/App.js'))
    prefix = entry[:-len('App.js')]
    for name in sorted(expected):
        relative = PurePosixPath(name)
        assert not relative.is_absolute() and '..' not in relative.parts and '\\' not in name
        local = (mobile / name).read_bytes()
        try:
            remote = archive.read(prefix + name)
            if remote != local: errors.append({'file': name, 'reason': 'Byte content differs'})
        except KeyError:
            errors.append({'file': name, 'reason': 'Missing from Snack download'})
        if name.startswith('assets/') and sha256(local).hexdigest() != publication['assetHashes'].get(name):
            errors.append({'file': name, 'reason': 'Publication hash differs from source'})
report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'name': publication['name'],
          'snackId': identifier, 'expectedFiles': len(expected),
          'foodImages': sum(n.startswith('assets/food/') for n in expected),
          'errors': errors, 'passed': not errors}
(ROOT / 'research/local-photo-snack-validation.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf8')
print(json.dumps(report, indent=2))
sys.exit(1 if errors else 0)
