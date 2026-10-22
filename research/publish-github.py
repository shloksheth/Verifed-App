"""Publish a completed Verifed update using its numbered Snack and mobile release.json.

The source workspace stays untouched. A separate checkout receives the files,
and existing browser/prototype history remains available beside the mobile app.
"""
import argparse
import base64
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
from urllib.error import HTTPError
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
REMOTE = 'https://github.com/shloksheth/Verifed-App.git'
REPOSITORY = 'shloksheth/Verifed-App'
API = f'https://api.github.com/repos/{REPOSITORY}'
IGNORED = {'.git', '.openai', '.expo', 'node_modules', '__pycache__', 'tmp', 'temp', 'coverage'}
RESEARCH_FILES = (
    'build-menu-catalog.mjs', 'build_catalog.mjs', 'import-expanded-menus.py',
    'check-restaurant-images.py', 'verify-districts.mjs', 'verify-orlando.mjs',
    'seed-orlando.mjs', 'package-source.py', 'publish-github.py',
    'full-menu-data.json', 'full-menu-evidence.md', 'expanded-menu-data.json',
    'expanded-restaurants.json', 'requested-menu-data.json', 'requested-restaurants.json',
    'REQUESTED_MENU_SOURCES.md', 'TWENTY_RESTAURANTS_SOURCES.md', 'IMAGE_SOURCES.md', 'FOOD_CHAINS_RESEARCH.md',
    'restaurant-images.json', 'restaurant-locations.json', 'orlando-menu-notes.md',
    'fresh-kitchen-2609.pdf', 'fresh-kitchen-2609-contact.jpg', 'VERSION_RECOVERY.md',
    'native-tools/publish.mjs', 'native-tools/package.json', 'native-tools/package-lock.json',
)
# These folders contain public menu/district source evidence. Auth captures,
# arbitrary research files, previews, local tools and dependencies are not copied.
RESEARCH_DIRECTORIES = ('menu-sources', 'district-evidence')


def run_git(checkout, *args, check=True):
    result = subprocess.run(['git', '-C', str(checkout), *args], capture_output=True, text=True)
    if check and result.returncode:
        raise ValueError(f'Git operation failed: {args[0]}. Check Git Credential Manager and repository access.')
    return result


def is_excluded(path):
    return any(part in IGNORED or part.startswith('.env') or part == 'dist' or part.startswith('dist-') for part in path.parts)


def selected_files():
    files = {}
    mobile = ROOT / 'verifed-mobile'
    for source in sorted(mobile.rglob('*')):
        relative = source.relative_to(mobile)
        if is_excluded(relative):
            continue
        if source.is_symlink():
            raise ValueError(f'Symlinks cannot be published: mobile/{relative.as_posix()}')
        if source.is_file():
            files['mobile/' + relative.as_posix()] = source
    backend = ROOT / 'verifed-app' / 'supabase'
    for directory in ('migrations', 'functions'):
        for source in sorted((backend / directory).rglob('*')):
            relative = source.relative_to(backend)
            if source.is_symlink():
                raise ValueError('Symlink in backend source')
            if source.is_file() and not is_excluded(relative):
                files['web/supabase/' + relative.as_posix()] = source
    for name in RESEARCH_FILES:
        source = ROOT / 'research' / name
        if source.is_file():
            if source.is_symlink():
                raise ValueError(f'Symlink in research allowlist: {name}')
            files['research/' + name] = source
    for directory in RESEARCH_DIRECTORIES:
        folder = ROOT / 'research' / directory
        for source in sorted(folder.rglob('*')):
            relative = source.relative_to(ROOT / 'research')
            if is_excluded(relative):
                continue
            if source.is_symlink():
                raise ValueError('Symlink in public research evidence')
            if source.is_file():
                files['research/' + relative.as_posix()] = source
    return files


def check_secret_markers(data, label):
    text = data.decode('utf8', errors='ignore')
    markers = r'GOCSPX-[A-Za-z0-9_-]{16,}|sb_secret_[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{25,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
    if re.search(markers, text):
        raise ValueError(f'Possible credential in {label}; refusing publication. No credential value was logged.')
    for token in re.findall(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', text):
        try:
            segment = token.split('.')[1]
            payload = json.loads(base64.urlsafe_b64decode(segment + '=' * (-len(segment) % 4)))
        except (ValueError, UnicodeError):
            continue
        if payload.get('role') == 'service_role':
            raise ValueError(f'Service-role token in {label}; refusing publication.')


def read_release():
    release = json.loads((ROOT / 'verifed-mobile/release.json').read_text(encoding='utf8'))
    check_secret_markers(json.dumps(release).encode(), 'mobile/release.json')
    number = release.get('number')
    if not isinstance(number, int) or isinstance(number, bool) or number < 1:
        raise ValueError('release.json number must be a positive integer.')
    if release.get('name') != f'Verifed V{number}':
        raise ValueError('Release name must exactly match its number: Verifed V<number>.')
    if not isinstance(release.get('description'), str) or not release['description'].strip():
        raise ValueError('release.json needs a concrete change description.')
    verification = release.get('verification', [])
    if not isinstance(verification, list) or any(not isinstance(item, str) for item in verification):
        raise ValueError('Optional verification must be an array of factual check descriptions.')
    publication = json.loads((ROOT / 'verifed-mobile/publication.json').read_text(encoding='utf8'))
    if publication.get('name') != release['name'] or publication.get('version') != number:
        raise ValueError('Publish the matching numbered Snack first; mobile/publication.json belongs to another release.')
    identifier = publication.get('id', '')
    if not isinstance(identifier, str) or not re.fullmatch(r'[A-Za-z0-9_-]+', identifier) or publication.get('editorUrl') != f'https://snack.expo.dev/{identifier}':
        raise ValueError('Snack publication ID/editorUrl is invalid.')
    return release, publication


def verify_snack(publication):
    identifier = publication['id']
    with urlopen(f'https://exp.host/--/api/v2/snack/download/{identifier}', timeout=45) as response:
        downloaded = response.read()
    with ZipFile(io.BytesIO(downloaded)) as archive:
        app = next((name for name in archive.namelist() if name.endswith('/App.js')), None)
        if not app:
            raise ValueError('Published Snack download has no application entry point.')
        prefix = app.rsplit('/', 1)[0] + '/'
        names = publication.get('files')
        if not isinstance(names, list) or not names or any(not isinstance(name, str) for name in names) or len(names) != len(set(names)):
            raise ValueError('Snack publication has an invalid file inventory.')
        local = ROOT / 'verifed-mobile'
        expected = {'App.js', 'styles.js', 'assets/verifed-mark.png'}
        for directory in ('src', 'components'):
            expected.update(f'{directory}/{path.name}' for path in (local / directory).glob('*.js') if not (directory == 'components' and path.name in {'Scanner.js', 'Workspace.js', 'Requests.js'}))
        if set(names) != expected:
            raise ValueError('Snack file inventory differs from the current CAC publisher contract; review the publisher before releasing.')
        for name in names:
            relative = PurePosixPath(name)
            if relative.is_absolute() or '..' in relative.parts or '\\' in name:
                raise ValueError('Unsafe path in Snack file inventory.')
            if archive.read(prefix + name) != (local / name).read_bytes():
                raise ValueError(f'Snack source is stale or different: {name}. Republish the completed app first.')
    return len(names)


def validate_checkout(checkout):
    if not checkout.resolve().is_relative_to((ROOT / 'tmp').resolve()):
        raise ValueError('Publishing checkout must be inside this workspace tmp directory.')
    if checkout.exists():
        if not (checkout / '.git').is_dir():
            raise ValueError('Publishing checkout exists but is not a dedicated Git clone.')
        origin = run_git(checkout, 'remote', 'get-url', 'origin').stdout.strip()
        allowed = {REMOTE.lower(), REMOTE[:-4].lower(), 'git@github.com:shloksheth/verifed-app.git'}
        if origin.lower() not in allowed:
            raise ValueError('Publishing checkout origin is not the expected Verifed-App repository.')
        if run_git(checkout, 'status', '--porcelain').stdout.strip():
            raise ValueError('Publishing checkout has uncommitted files. Review them before publishing.')
        if run_git(checkout, 'branch', '--show-current').stdout.strip() != 'main':
            raise ValueError('Publishing checkout must be on main.')
    remote_refs = subprocess.run(['git', 'ls-remote', REMOTE], capture_output=True, text=True, check=True).stdout
    return dict(line.split('\t', 1)[::-1] for line in remote_refs.splitlines())


def source_digest(files, release, publication):
    hashes = {name: hashlib.sha256(source.read_bytes()).hexdigest() for name, source in sorted(files.items())}
    payload = {'files': hashes, 'release': release, 'snackId': publication['id']}
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()


def github_request(method, url, credential, body=None, content_type='application/json'):
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname not in {'api.github.com', 'uploads.github.com'}:
        raise ValueError('Unexpected GitHub API destination.')
    headers = {'Authorization': 'Bearer ' + credential, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': content_type}
    data = json.dumps(body).encode() if body is not None and content_type == 'application/json' else body
    request = Request(url, data=data, headers=headers, method=method)
    with urlopen(request, timeout=90) as response:
        return json.load(response)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true', help='Validate source, Snack and Git state without writing, committing, pushing or releasing.')
    parser.add_argument('--checkout', type=Path, default=ROOT / 'tmp/github-release/repository')
    parser.add_argument('--asset', type=Path, action='append', default=[], help='Attach an already reviewed PDF or ZIP; repeat for multiple assets.')
    args = parser.parse_args()
    checkout = args.checkout.resolve()
    release, publication = read_release()
    files = selected_files()
    for name, source in files.items():
        check_secret_markers(source.read_bytes(), name)
    assets = []
    for asset in args.asset:
        if not asset.is_file() or asset.suffix.lower() not in {'.pdf', '.zip'}:
            raise ValueError('Release assets must be existing, reviewed PDF or ZIP files.')
        content = asset.read_bytes()
        check_secret_markers(content, asset.name)
        if asset.suffix.lower() == '.zip':
            with ZipFile(io.BytesIO(content)) as archive:
                for entry in archive.infolist():
                    relative = PurePosixPath(entry.filename)
                    if '\\' in entry.filename or relative.is_absolute() or is_excluded(relative) or '..' in relative.parts:
                        raise ValueError('Release ZIP includes an excluded or unsafe path.')
                    if not entry.is_dir():
                        check_secret_markers(archive.read(entry), f'{asset.name}/{entry.filename}')
        assets.append({'path': asset, 'bytes': content, 'sha256': hashlib.sha256(content).hexdigest()})
    if len({asset['path'].name for asset in assets}) != len(assets):
        raise ValueError('Release asset names must be unique.')
    checked = verify_snack(publication)
    remote_refs = validate_checkout(checkout)
    number, tag = release['number'], f"v{release['number']}"
    digest = source_digest(files, release, publication)
    tags = [int(match.group(1)) for ref in remote_refs if (match := re.fullmatch(r'refs/tags/v(\d+)', ref))]
    existing = f'refs/tags/{tag}' in remote_refs or (checkout.exists() and run_git(checkout, 'show-ref', '--verify', '--quiet', f'refs/tags/{tag}', check=False).returncode == 0)
    if not existing and number != max(tags, default=0) + 1:
        raise ValueError('Release number must be the next sequential remote version.')
    if existing:
        if not checkout.exists():
            raise ValueError('Tag already exists. Use the original clean publishing checkout to resume.')
        saved = json.loads(run_git(checkout, 'show', f'{tag}:versions/{tag}.json').stdout)
        if saved.get('sourceDigest') != digest or run_git(checkout, 'rev-parse', 'HEAD').stdout != run_git(checkout, 'rev-parse', f'{tag}^{{}}').stdout:
            raise ValueError('Existing tag does not match this completed source and checkout. Tags will not be overwritten.')
    elif checkout.exists() and run_git(checkout, 'rev-parse', 'HEAD').stdout.strip() != remote_refs.get('refs/heads/main'):
        raise ValueError('Publishing checkout main differs from remote main. Review and synchronize first.')
    print(json.dumps({'name': release['name'], 'tag': tag, 'sourceFiles': len(files), 'verifiedSnackFiles': checked, 'snack': publication['editorUrl'], 'resumeExistingTag': bool(existing), 'assets': [item['path'].name for item in assets], 'dryRun': args.dry_run}), flush=True)
    if args.dry_run:
        return
    if not checkout.exists():
        checkout.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['git', 'clone', REMOTE, str(checkout)], check=True, capture_output=True)
    if not existing:
        # Delete only the current mobile subtree after resolving its boundary.
        mobile = checkout / 'mobile'
        if mobile.is_symlink() or not mobile.resolve().is_relative_to(checkout):
            raise ValueError('Unsafe mobile destination in publishing checkout.')
        if mobile.exists():
            shutil.rmtree(mobile)
        for name, source in files.items():
            target = checkout / name
            if target.is_symlink() or not target.resolve().is_relative_to(checkout):
                raise ValueError('Unsafe source destination in publishing checkout.')
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
        record = {**release, 'sourceDigest': digest, 'snack': publication['editorUrl'], 'snackId': publication['id'], 'snackPublishedAt': publication.get('publishedAt'), 'verifiedSnackFiles': checked}
        (checkout / 'versions').mkdir(exist_ok=True)
        (checkout / f'versions/{tag}.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf8')
        readme = checkout / 'README.md'
        text = readme.read_text(encoding='utf8')
        row = f"| [{release['name']}](https://github.com/{REPOSITORY}/releases/tag/{tag}) | {release['description'].replace('|', '/').replace(chr(10), ' ')} | [{release['name']}]({publication['editorUrl']}) |"
        lines = text.splitlines()
        last_row = max(index for index, line in enumerate(lines) if line.startswith('| '))
        lines.insert(last_row + 1, row)
        readme.write_text('\n'.join(lines) + '\n', encoding='utf8')
        run_git(checkout, 'add', '--all')
        run_git(checkout, 'commit', '-m', f"{release['name']}: {release['description'].splitlines()[0]}")
        run_git(checkout, 'tag', '-a', tag, '-m', release['name'])
    run_git(checkout, 'push', 'origin', 'main', tag)
    # Existing GCM authorization is read only into this process's memory.
    credential_result = subprocess.run(['git', 'credential', 'fill'], input='protocol=https\nhost=github.com\n\n', text=True, capture_output=True, check=True)
    credential = dict(line.split('=', 1) for line in credential_result.stdout.splitlines() if '=' in line)['password']
    try:
        published = github_request('GET', API + '/releases/tags/' + tag, credential)
    except HTTPError as error:
        if error.code != 404:
            raise
        verification = '\n'.join('- ' + item for item in release.get('verification', []))
        body = release['description'] + f"\n\nTry [{release['name']}]({publication['editorUrl']}). Published application code and assets were compared byte for byte with this source before release."
        if verification:
            body += '\n\nValidation recorded for this version:\n\n' + verification
        published = github_request('POST', API + '/releases', credential, {'tag_name': tag, 'name': release['name'], 'body': body, 'draft': False, 'prerelease': False, 'make_latest': 'true'})
    if published['name'] != release['name']:
        raise ValueError('Existing release title differs; no existing release was overwritten.')
    for asset in assets:
        old = next((item for item in published.get('assets', []) if item['name'] == asset['path'].name), None)
        expected = 'sha256:' + asset['sha256']
        if old:
            if old.get('digest') != expected:
                raise ValueError('Existing release asset differs; refusing to overwrite it.')
            continue
        upload = published['upload_url'].split('{', 1)[0] + '?name=' + quote(asset['path'].name)
        github_request('POST', upload, credential, asset['bytes'], 'application/octet-stream')
    print(json.dumps({'released': release['name'], 'url': published['html_url'], 'commit': run_git(checkout, 'rev-parse', 'HEAD').stdout.strip()}))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as error:
        # Avoid dumping response bodies, Git helper output or credentials.
        print(f'Publication stopped: {error if isinstance(error, ValueError) else type(error).__name__}.', file=sys.stderr)
        raise SystemExit(1)
