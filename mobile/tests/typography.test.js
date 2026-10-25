import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { textFont, textFontStyle } from "../src/typography.js";

test("headings, body and controls keep their semantic weight aliases", () => {
  assert.equal(textFont({ fontSize: 14 }), "HomeBody");
  assert.equal(textFont({ fontSize: 14, fontWeight: "600" }), "HomeHeading");
  assert.equal(textFont({ fontSize: 14, fontWeight: "bold" }), "HomeStrong");
  assert.equal(textFont({ fontSize: 28 }), "HomeBody");
  assert.equal(textFont({ fontSize: 16 }, { heading: true }), "HomeHeading");
  assert.equal(
    textFont({ fontFamily: "HomeHeading", fontSize: 14 }),
    "HomeHeading",
  );
  assert.equal(
    textFont({ fontSize: 24, fontWeight: "700" }, { heading: true }),
    "HomeHeadingStrong",
  );
  assert.equal(
    textFont({ fontFamily: "HomeHeadingStrong" }),
    "HomeHeadingStrong",
  );
  assert.equal(textFont({ fontFamily: "HomeStrong" }), "HomeStrong");
});

test("bundled editorial faces match their recorded licensed static assets", () => {
  const folder = new URL("../assets/fonts/", import.meta.url);
  const manifest = JSON.parse(
    readFileSync(new URL("editorial-font-sources.json", folder), "utf8"),
  );
  assert.equal(manifest.files.length, 5);
  for (const face of manifest.files) {
    const bytes = readFileSync(new URL(face.file, folder));
    assert.equal(bytes.readUInt32BE(0), 0x00010000, face.file);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      face.sha256,
      face.file,
    );
    assert.match(
      face.url,
      /^https:\/\/raw\.githubusercontent\.com\/google\/fonts\/[0-9a-f]{40}\//,
    );
    assert.match(
      readFileSync(new URL(face.license, folder), "utf8"),
      /SIL OPEN FONT LICENSE/,
    );
  }
});

test("large dish names, controls and inputs stay sans serif", () => {
  assert.equal(textFont({ fontSize: 24 }, { input: true }), "HomeBody");
  assert.equal(
    textFont({ fontSize: 24, fontWeight: "500" }, { input: true }),
    "HomeMedium",
  );
  assert.equal(textFont({ fontSize: 28, fontWeight: "700" }), "HomeStrong");
  assert.equal(
    textFont({ fontFamily: "HomeHeading", fontSize: 24 }, { input: true }),
    "HomeBody",
  );
});

test("loading fallback avoids missing font aliases and loaded static fonts avoid synthetic bold", () => {
  assert.deepEqual(
    textFontStyle({ fontFamily: "Georgia", fontWeight: "700" }, {}, false),
    {
      fontFamily: undefined,
    },
  );
  assert.deepEqual(
    textFontStyle({ fontSize: 26, fontWeight: "800" }, { heading: true }, true),
    {
      fontFamily: "HomeHeadingStrong",
      fontWeight: "normal",
    },
  );
  assert.equal(
    textFont({ fontFamily: "VerifedAnton", fontSize: 15 }),
    "HomeBody",
  );
});

test("Clash Grotesk loads the four unmodified official static faces", () => {
  const folder = new URL("../assets/fonts/", import.meta.url);
  const source = JSON.parse(
    readFileSync(new URL("clash-grotesk-sources.json", folder), "utf8"),
  );
  const loader = readFileSync(
    new URL("../src/use-app-fonts.js", import.meta.url),
    "utf8",
  );
  assert.equal(source.family, "Clash Grotesk");
  assert.equal(
    source.downloadUrl,
    "https://api.fontshare.com/v2/fonts/download/clash-grotesk",
  );
  assert.deepEqual(
    source.files.map((face) => face.weight),
    [400, 500, 600, 700],
  );
  for (const face of source.files) {
    const bytes = readFileSync(new URL(face.file, folder));
    assert.equal(bytes.readUInt32BE(0), 0x00010000);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), face.sha256);
    assert.ok(loader.includes(face.file));
  }
  assert.equal(/SourceSerif4|PublicSans/.test(loader), false);
  const license = readFileSync(new URL("ClashGrotesk-FFL.txt", folder));
  assert.equal(
    createHash("sha256").update(license).digest("hex"),
    source.licenseSha256,
  );
  assert.match(license.toString(), /ITF Free Font License/);
});
