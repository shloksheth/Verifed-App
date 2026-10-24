"""Import observed menu photos from a browser asset bundle; never grant approval."""
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import sys
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
manifest_path = ROOT / 'research/local-photo-manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf8'))
bundle = json.loads(Path(sys.argv[1]).read_text(encoding='utf8'))
observations = json.loads(Path(sys.argv[2]).read_text(encoding='utf8'))
for observation in observations:
    item = next(i for i in manifest['items'] if i['catalogKey'] == observation['catalogKey'])
    assert observation['name'] == item['specification']['name'], observation['catalogKey']
    matches = [a for a in bundle['assets'] if a.get('kind') == 'image' and a['url'].split('/')[-1] == observation['file'] and a['url'].startswith('https://d1w7312wesee68.cloudfront.net/')]
    assert matches, observation['file']
    # Multiple observed responsive versions may exist. Prefer the largest decoded file.
    def area(asset):
        with Image.open(asset['path']) as image: return image.width * image.height
    asset = max(matches, key=area)
    digest = sha256(asset['url'].encode()).hexdigest()
    if any(c['id'] == digest[:16] for c in item['candidates']): continue
    destination = ROOT / 'research/photo-candidates' / f'{digest}.webp'
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(asset['path']) as original:
        image = ImageOps.exif_transpose(original).convert('RGBA')
        image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        image.save(destination, 'WEBP', quality=84, method=6)
    with Image.open(destination) as image:
        image.load()
        width, height = image.size
        pixels = sha256(image.convert('RGBA').tobytes()).hexdigest()
    item['candidates'].append({
        'id': digest[:16], 'origin': 'sourced', 'kind': 'official-product',
        'url': asset['url'], 'sourceUrl': observation['pageUrl'],
        'credit': 'Winter Park Biscuit Company official ordering menu',
        'alt': observation['name'] + ' photographed for Winter Park Biscuit Company',
        'path': destination.relative_to(ROOT).as_posix(),
        'sha256': sha256(destination.read_bytes()).hexdigest(), 'pixelHash': pixels,
        'width': width, 'height': height, 'bytes': destination.stat().st_size,
        'status': 'downloaded-unreviewed',
        'discovery': {'method': 'visible menu DOM: named item link contains this image', 'observedAt': observation['observedAt']},
    })
    print(json.dumps({'key': item['catalogKey'], 'id': digest[:16], 'width': width, 'height': height}))
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
