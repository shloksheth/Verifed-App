"""Package only reviewable application source and public research evidence."""
from pathlib import Path
import json
import zipfile

root = Path(__file__).resolve().parents[1]
out = root / 'outputs/verifed-design'
publication = json.loads((root / 'verifed-mobile/publication.json').read_text())
with zipfile.ZipFile(out / 'Verifed_Source.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for folder in ['verifed-mobile', 'verifed-app']:
        for path in sorted((root / folder).rglob('*')):
            relative = path.relative_to(root / folder)
            if any(part in ['node_modules', '.git', '.expo', '.openai', '.temp'] or part.startswith('dist') for part in relative.parts):
                continue
            if path.is_file() and not path.name.startswith('.env') and path.suffix not in ['.tar', '.gz']:
                archive.write(path, path.relative_to(root))
    for name in ['seed-orlando.mjs', 'verify-orlando.mjs', 'orlando-menu-notes.md', 'build-menu-catalog.mjs', 'full-menu-data.json', 'full-menu-evidence.md', 'expanded-menu-data.json', 'expanded-restaurants.json', 'restaurant-locations.json', 'restaurant-images.json', 'requested-menu-data.json', 'requested-restaurants.json', 'REQUESTED_MENU_SOURCES.md', 'VERSION_RECOVERY.md', 'publish-github.py', 'build_native_guide.py', 'build_verifed_handoff.py', 'IMAGE_SOURCES.md', 'TWENTY_RESTAURANTS_SOURCES.md', 'import-expanded-menus.py', 'verify-districts.mjs', 'check-restaurant-images.py']:
        path = root / 'research' / name
        archive.write(path, path.relative_to(root))
    for path in sorted((root / 'research/menu-sources').glob('*')):
        if path.is_file(): archive.write(path, path.relative_to(root))
    path = root / 'research/FOOD_CHAINS_RESEARCH.md'
    if path.is_file(): archive.write(path, path.relative_to(root))
    for path in sorted((root / 'research/district-evidence').glob('*.json')):
        archive.write(path, path.relative_to(root))
    for name in ['package.json', 'package-lock.json', 'publish.mjs']:
        path = root / 'research/native-tools' / name
        archive.write(path, path.relative_to(root))

delivery = f"""# {publication['name']} delivery - 22 October 2026

Try the numbered React Native app: {publication['editorUrl']}
GitHub source and version history: https://github.com/shloksheth/Verifed-App/releases

## What changed

V13 is a partial chain checkpoint: Tako Cheena removed, named exceptions retained, collection tabs and chain header themes added. McDonald’s, Pizza Hut, Domino’s and Wendy’s imports remain unfinished. 92 tests and all exports pass; usage stop rule reached. V12 added username/email and password login, private username lookup, database uniqueness and duplicate-account errors. Live signup is pending the requested approval to disable email confirmation. V11 previously added Honey, Vegetarian (no eggs), and No garlic or onion. It fixes the undefined onPress crash on dish details, removes repeated disclaimer paragraphs and collapses source notes. Compact ingredient-status labels remain. Profile persistence, dish rendering, save/journal actions and the restaurant return button were exercised in the browser.

25 active Orlando-area locations and 1,630 published food/component records. Added Woodlands, Bombay Street Kitchen, Yellow Dog Eats Gotha and three Taco Bell branches with a location picker. Each restaurant retains Full menu and For my diet views.

Explore combines a real map, city/ZIP/neighborhood and U.S. street-address entry, radius, cuisine and dietary-evidence filters. Recommendations use dietary fit, preferences and rated meal history; strict allergen filters require source absence claims for items and do not certify kitchens.

Home has an information button. Guests see Create an account, Log in and Explore without an account when opening the app. New accounts use the username/email/password form; immediate signup requires the pending email-confirmation setting change. Google is secondary; native OAuth requires a development build. No working Expo Go Google callback is claimed.

## Verification and limits

92 mobile tests and web/Android/iOS exports pass. Public Supabase reads matched all 1,652 records, UUID relationships, coordinates, images and provenance across 26 locations. Browser checks cover address lookup, map tiles/pin navigation, account entry, Home info, cuisine and dietary filtering, and the Taco Bell picker.

The V10 Snack editor hung before the native simulator became available. Prior native screenshots belong to V9, and do not verify V10. Native gestures/keyboard/address interaction and physical-iPhone behavior remain to be tested. The matching Expo SDK 54 runtime is required.

24 address district matches are FL-10; Yellow Dog Eats Gotha is FL-11, and Bombay’s district is unknown. Contestant eligibility must be confirmed separately. Menus are published snapshots, and local preparation/availability/cross-contact were not verified with staff. Chain branches share one national template. Source coverage is documented; no live full-branch inventory is claimed.

## Source and explanations

Verifed_Native_Code_Guide.pdf explains related modules, source evidence, navigation, address search, map, recommendation engine, accounts, storage and release tooling. Verifed_Source.zip includes the mobile and companion source, tests, public research and importer/publisher code, excluding environment files, credentials, modules and generated bundles.

V1-V9 recovered checkpoints are uploaded sequentially with source provenance. V6-V9 have new version-named Snack copies; V1-V5 were browser applications. They do not have invented native versions. Each current release uses the same number in Snack and GitHub. Future completed updates follow AGENTS.md and docs/GITHUB_RELEASES.md.

The companion website remains https://verifed-dining-studio.jackbruns247.chatgpt.site and has its earlier browser interface. AI assistance is disclosed in the guide; learn and explain the implementation accurately. No paid service, restaurant message/order, or store publication occurred.
"""
(out / 'DELIVERY.md').write_text(delivery, encoding='utf-8')
print('Packaged ' + publication['name'] + ':', publication['editorUrl'])
