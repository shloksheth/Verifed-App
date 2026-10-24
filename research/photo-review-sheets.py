"""Make labeled contact sheets for visual inspection, never automatic approval."""
import argparse
import json
from pathlib import Path
import textwrap
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument("restaurant")
parser.add_argument("--pending-candidates", action="store_true")
parser.add_argument("--item", help="Show every downloaded candidate for one stable catalog key")
args = parser.parse_args()
manifest = json.loads((ROOT / "research/local-photo-manifest.json").read_text(encoding="utf-8"))
items = [item for item in manifest["items"] if item["restaurant"] == args.restaurant or args.restaurant == "all"]
if args.item:
    item = next(item for item in items if item["catalogKey"] == args.item)
    items = [{**item, "candidates": [candidate]} for candidate in item["candidates"] if candidate.get("path")]
if args.pending_candidates:
    items = [item for item in items if item["review"]["status"] == "pending" and any(candidate.get("path") for candidate in item["candidates"]) and item["restaurant"] not in ["loving-hut-orlando", "mamak-colonial", "hawkers-orlando", "taco-bell-east-colonial", "taco-bell-orlando-west"]]
out = ROOT / "tmp/photo-review" / args.restaurant
if args.item: out = out / args.item
out.mkdir(parents=True, exist_ok=True)
font_path = Path("C:/Windows/Fonts/arial.ttf")
font = ImageFont.truetype(str(font_path), 16) if font_path.exists() else ImageFont.load_default(size=16)
for start in range(0, len(items), 9):
    sheet = Image.new("RGB", (1500, 1500), "#f5f3ee")
    draw = ImageDraw.Draw(sheet)
    for offset, item in enumerate(items[start:start+9]):
        x, y = (offset % 3) * 500, (offset // 3) * 500
        draw.text((x+12, y+8), f"{start+offset+1}. {item['specification']['name']}"[:57], font=font, fill="black")
        if args.restaurant == "all": draw.text((x+12, y+28), item["restaurantName"][:57], font=font, fill="#444444")
        candidate = next((candidate for candidate in item["candidates"] if candidate.get("path")), None)
        if candidate:
            with Image.open(ROOT / candidate["path"]) as image:
                image = ImageOps.contain(image.convert("RGBA"), (476, 330))
                sheet.paste(image, (x+(500-image.width)//2, y+45), image)
        else:
            draw.text((x+20, y+150), "NO LOCAL CANDIDATE", font=font, fill="#a02020")
        description = item["specification"]["description"] or "; ".join(item["specification"]["ingredients"])
        lines = textwrap.wrap(description, width=59)[:5]
        draw.multiline_text((x+12, y+375), "\n".join(lines), font=font, fill="black", spacing=3)
        draw.text((x+12, y+478), item["itemKey"][:55], font=font, fill="#444444")
    target = out / f"sheet-{start//9+1:02}.jpg"
    sheet.save(target, quality=94)
    print(target)
