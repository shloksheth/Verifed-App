# Shared mobile typography

The updated app uses the same two font families throughout its active screens:
Sora SemiBold for headings, and DM Sans Regular/Medium for reading and controls.
The bundled files and licenses remain in `assets/fonts/`; no network font request
is necessary. Brand logos remain artwork, while restaurant menu text follows the
same Verifed fonts as the rest of the app.

## How the files work together

- `components/Home.js` retains `useHomeFonts`, which loads the three existing
  aliases `HomeHeading`, `HomeBody`, and `HomeMedium` through Expo Font. Keeping
  these aliases preserves the approved Home screen without loading duplicate fonts.
- `components/Typography.js` exports drop-in `Text` and `TextInput` wrappers.
  Screens import these instead of React Native's direct text components. The
  wrappers preserve refs, accessibility props, text scaling and input callbacks.
  They flatten incoming styles only to select a font; original layout, colors,
  spacing and type sizes remain on the native component.
- `TypographyProvider` shares font readiness from the app root. Until fonts finish
  loading, the wrappers remove explicit font-family aliases and use system text.
  If font loading fails, that readable fallback remains instead of hiding the app.
  Outside the provider, the wrappers check Expo's loaded aliases directly.
- `src/typography.js` chooses the face: explicit headings and display text of
  22 points or above use Sora. Smaller copy uses DM Sans; weights of 500 or above
  select its Medium face. Inputs always keep the body face. Once fonts load,
  weight is `normal` because the actual static font file already supplies weight.
- `styles.js` replaces the old Georgia/serif declarations with the shared heading
  alias. `BrandIdentity.js` keeps logo rendering and its menu wrappers, but no
  longer loads separate condensed menu fonts.
- Active screens (`Account`, `AllergenIcons`, `ChipotleMenu`, `Dining`, `Explore`,
  `Journal`, `RestaurantMap`, `TacoBellMenu`, `Welcome`) and shared `UI` controls
  use the text wrappers. Home already uses these same bundled faces. Ionicons
  remain untouched, so symbols retain the icon font rather than becoming text.

## Verification

`tests/typography.test.js` checks semantic headings, body/medium selection, input
font behavior, unloaded-font fallback, and avoiding synthetic weight on static
faces. Platform exports and screen review are still necessary to verify wrapping
and clipping at actual device widths; a unit test cannot establish visual quality.
