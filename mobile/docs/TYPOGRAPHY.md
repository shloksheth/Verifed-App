# Shared mobile typography

The V21 interface uses two licensed, bundled font families: Source Serif 4 for
editorial page and section headings, and Public Sans for reading, menu dishes,
prices, buttons, fields and navigation. This creates a consistent hierarchy
without turning every large label into a serif headline. Restaurant logos and
Ionicons remain artwork and symbols.

## Files and font loading

`src/use-app-fonts.js` exposes `useAppFonts()`, returning Expo Font's readiness
boolean. The app root loads all faces once and shares readiness through
`TypographyProvider`. Compatibility aliases keep existing screens on one family
system:

| Alias | Bundled face | Purpose |
| --- | --- | --- |
| HomeHeading | Source Serif 4 SemiBold | Page/section headings |
| HomeHeadingStrong | Source Serif 4 Bold | Strong headings |
| HomeBody | Public Sans Regular | Reading and input text |
| HomeMedium | Public Sans SemiBold | Labels, controls, dish names |
| HomeStrong | Public Sans Bold | Strong labels and prices |

`components/Typography.js` wraps native Text and TextInput while preserving refs,
input callbacks, accessibility props and system text scaling. It flattens styles
only to choose the face; layout, colors, spacing and sizes remain on the native
component. Its provider receives readiness from the root hook. While loading, or
if loading fails, the wrappers remove named aliases so readable system text stays
visible. A screen should never block its content indefinitely waiting for fonts.

`src/typography.js` applies the following readable rules:

- `accessibilityRole="header"` or explicit `HomeHeading` chooses Source Serif 4.
- A heading at weight 700 or above selects the real Bold face; otherwise it uses
  SemiBold. Explicit `HomeHeadingStrong` also selects Bold.
- Body weight 500–600 selects Public Sans SemiBold; 700 or `bold` selects Bold.
- Font size alone does not select a serif. Large buttons, menu-item names and
  numeric values keep Public Sans unless explicitly marked as headings.
- Inputs always use Public Sans, even if passed a heading alias accidentally.
- Once loaded, static faces use `fontWeight: "normal"`; the font file itself
  provides the intended weight instead of synthetic bold.

Home's local text helper should consume these same aliases and root readiness.
It must not separately load its previous Sora/DM Sans files under those aliases.
Other active screen text uses the shared wrappers. Former condensed restaurant
heading fonts are not loaded by the brand wrapper; logos retain their artwork.

## License and asset provenance

Official sources are the Google Fonts repository directories
[Source Serif 4](https://github.com/google/fonts/tree/main/ofl/sourceserif4) and
[Public Sans](https://github.com/google/fonts/tree/main/ofl/publicsans). Both use
the SIL Open Font License 1.1; verbatim license files are bundled beside them as
`SourceSerif4-OFL.txt` and `PublicSans-OFL.txt`.

`assets/fonts/editorial-font-sources.json` records the exact source commit, source
URLs, source/download hashes, resulting static TTF hashes, axis values and
conversion method. We instantiated official variable fonts with fontTools using
`instantiateVariableFont(updateFontNames=True, static=True)`. Source Serif 4 uses
optical size 28 and weights 600/700; Public Sans uses weights 400/600/700. Font
name tables and OS/2 weight classes were checked after conversion. No font artwork
was generated or redrawn. Runtime font requests do not depend on Google Fonts.
The previous font assets remain in history and are not overwritten.

## Verification

`tests/typography.test.js` verifies semantic heading/body/strong selection,
large controls and inputs remaining sans serif, safe loading fallbacks, and
avoiding synthetic font weight. It also checks the five TTF signatures, hashes,
pinned official URLs and bundled licenses. Platform exports and actual-width
visual review are still required to establish native loading and text wrapping;
these unit checks do not claim physical-device verification.
