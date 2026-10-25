import test from "node:test";
import assert from "node:assert/strict";
import { colors } from "../src/design-tokens.js";

function luminance(hex) {
  const channels = [1, 3, 5].map(
    (start) => parseInt(hex.slice(start, start + 2), 16) / 255,
  );
  const linear = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return linear.reduce(
    (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
    0,
  );
}

test("normal text and primary actions retain AA contrast in the shared palette", () => {
  for (const [foreground, background] of [
    [colors.ink, colors.cream],
    [colors.muted, colors.cream],
    [colors.paper, colors.orange],
    [colors.green, colors.paleGreen],
    [colors.orangeDark, colors.peach],
    [colors.red, colors.paleRed],
  ]) {
    const levels = [luminance(foreground), luminance(background)].sort(
      (a, b) => b - a,
    );
    const ratio = (levels[0] + 0.05) / (levels[1] + 0.05);
    assert.ok(
      ratio >= 4.5,
      `${foreground} on ${background}: ${ratio.toFixed(2)}`,
    );
  }
});
