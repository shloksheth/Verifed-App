// Keep the two visible font families consistent, including branded menus.
export function textFont(style = {}, { heading = false, input = false } = {}) {
  const requested = style.fontFamily;
  if (
    heading ||
    requested === "HomeHeading" ||
    (!input && Number(style.fontSize) >= 22)
  )
    return "HomeHeading";
  if (
    requested === "HomeMedium" ||
    style.fontWeight === "bold" ||
    Number(style.fontWeight) >= 500
  )
    return "HomeMedium";
  return "HomeBody";
}

export function textFontStyle(style, options, fontsReady) {
  // Use the system font while bundled assets load; never name an unloaded font.
  if (!fontsReady) return { fontFamily: undefined };
  return { fontFamily: textFont(style, options), fontWeight: "normal" };
}
