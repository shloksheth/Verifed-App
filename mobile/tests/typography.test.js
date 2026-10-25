import test from "node:test";
import assert from "node:assert/strict";
import { textFont, textFontStyle } from "../src/typography.js";

test("headings use Sora while body copy and controls use DM Sans", () => {
  assert.equal(textFont({ fontSize: 14 }), "HomeBody");
  assert.equal(textFont({ fontSize: 14, fontWeight: "600" }), "HomeMedium");
  assert.equal(textFont({ fontSize: 14, fontWeight: "bold" }), "HomeMedium");
  assert.equal(textFont({ fontSize: 28 }), "HomeHeading");
  assert.equal(textFont({ fontSize: 16 }, { heading: true }), "HomeHeading");
  assert.equal(textFont({ fontFamily: "HomeHeading", fontSize: 14 }), "HomeHeading");
});

test("inputs keep DM Sans even when users enlarge their entered text", () => {
  assert.equal(textFont({ fontSize: 24 }, { input: true }), "HomeBody");
  assert.equal(textFont({ fontSize: 24, fontWeight: "500" }, { input: true }), "HomeMedium");
});

test("loading fallback avoids missing font aliases and loaded static fonts avoid synthetic bold", () => {
  assert.deepEqual(textFontStyle({ fontFamily: "Georgia", fontWeight: "700" }, {}, false), {
    fontFamily: undefined,
  });
  assert.deepEqual(textFontStyle({ fontSize: 26, fontWeight: "800" }, {}, true), {
    fontFamily: "HomeHeading", fontWeight: "normal",
  });
  assert.equal(textFont({ fontFamily: "VerifedAnton", fontSize: 15 }), "HomeBody");
});
