// Editorial headings use Source Serif 4; reading and controls use Public Sans.
export function textFont(style = {}, { heading = false, input = false } = {}) {
  const requested = style.fontFamily;
  const strong = style.fontWeight === "bold" || Number(style.fontWeight) >= 700;
  // Size alone never turns a dish name, number or large control into a serif.
  if (
    !input &&
    (heading ||
      requested === "HomeHeading" ||
      requested === "HomeHeadingStrong")
  )
    return strong || requested === "HomeHeadingStrong"
      ? "HomeHeadingStrong"
      : "HomeHeading";
  if (requested === "HomeStrong" || strong) return "HomeStrong";
  if (requested === "HomeMedium" || Number(style.fontWeight) >= 500)
    return "HomeMedium";
  return "HomeBody";
}

export function textFontStyle(style, options, fontsReady) {
  // Use the system font while bundled assets load; never name an unloaded font.
  if (!fontsReady) return { fontFamily: undefined };
  return { fontFamily: textFont(style, options), fontWeight: "normal" };
}
