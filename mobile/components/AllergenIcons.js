import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";
import { ALLERGENS } from "../src/data";
import { colors, s } from "../styles";

// Small line drawings stay native, and every symbol keeps its written label.
export function AllergenGlyph({ allergen, size = 18, color = colors.ink }) {
  let drawing;
  switch (allergen) {
    case "Milk":
      drawing = (
        <>
          <Path d="M7 3h8l3 5v13H6V8zM6 8h12M11 3v5" />
          <Rect x="9" y="12" width="6" height="5" rx="1" />
        </>
      );
      break;
    case "Egg":
      drawing = (
        <>
          <Path d="M19 14c0 5-3 7-7 7s-7-2-7-7S9 3 12 3s7 6 7 11Z" />
          <Path d="M8 15c0 2 1 3 3 3" />
        </>
      );
      break;
    case "Fish":
      drawing = (
        <>
          <Path d="M3 7l5 5-5 5V7Zm5 5c3-7 9-7 13 0-4 7-10 7-13 0Z" />
          <Circle cx="17" cy="11" r=".8" fill={color} />
        </>
      );
      break;
    case "Shellfish":
      drawing = (
        <>
          <Path d="M18 6c-8-6-16 4-10 11 5 5 13-1 9-5-3-3-7 1-4 3M18 6l3-3M18 6l4 2M7 9l5 1M6 13l5-1M9 17l3-3M12 19l1-4" />
        </>
      );
      break;
    case "Tree nuts":
      drawing = (
        <>
          <Path d="M12 2C2 8 4 20 12 22c8-2 10-14 0-20Z" />
          <Path d="M12 5c-3 4-3 10 0 14M12 5c3 4 3 10 0 14" />
        </>
      );
      break;
    case "Peanuts":
      drawing = (
        <>
          <Path d="M9 3C3 1 1 9 6 12c-4 6 1 11 6 8 5 3 10-3 6-8 5-5 0-12-5-9L11 5Z" />
          <Path d="m8 7 7 10M6 9l5-3M7 17l9-7M11 20l6-4" />
        </>
      );
      break;
    case "Wheat":
      drawing = (
        <>
          <Path d="M12 22V5M12 9C5 9 5 4 5 4c5 0 7 5 7 5Zm0 6c-7 0-7-5-7-5 5 0 7 5 7 5Zm0-3c7 0 7-5 7-5-5 0-7 5-7 5Zm0 6c7 0 7-5 7-5-5 0-7 5-7 5ZM12 5V2" />
        </>
      );
      break;
    case "Soy":
      drawing = (
        <>
          <Path d="M3 18C4 5 15 2 21 3c-1 10-6 18-15 18Z" />
          <Circle cx="8" cy="16" r="2" />
          <Circle cx="12" cy="11" r="2" />
          <Circle cx="16" cy="7" r="1.8" />
        </>
      );
      break;
    case "Sesame":
      drawing = (
        <>
          <Ellipse cx="8" cy="7" rx="2.4" ry="4" transform="rotate(-25 8 7)" />
          <Ellipse
            cx="17"
            cy="10"
            rx="2.4"
            ry="4"
            transform="rotate(25 17 10)"
          />
          <Ellipse cx="9" cy="18" rx="2.4" ry="4" transform="rotate(55 9 18)" />
        </>
      );
      break;
    case "other":
      drawing = (
        <>
          <Path d="m12 2 10 10-10 10L2 12Z" />
          <Line x1="12" y1="7" x2="12" y2="13" />
          <Line x1="12" y1="17" x2="12.01" y2="17" />
        </>
      );
      break;
    default:
      drawing = (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3" />
          <Line x1="12" y1="17" x2="12.01" y2="17" />
        </>
      );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <G
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {drawing}
      </G>
    </Svg>
  );
}

function AllergenToken({
  allergen,
  unknown = false,
  other = false,
  ingredient = false,
}) {
  return (
    <View
      accessible
      accessibilityLabel={
        unknown
          ? "Unknown: incomplete allergen source coverage"
          : `${allergen}: ${ingredient ? "recognizable named ingredient" : "declared allergen"}`
      }
      style={s.allergenToken}
    >
      <AllergenGlyph
        allergen={other ? "other" : allergen}
        color={unknown ? colors.muted : colors.ink}
      />
      <Text style={s.allergenLabel}>
        {unknown ? "Unknown" : `${allergen}${ingredient ? "†" : ""}`}
      </Text>
    </View>
  );
}

export function hasUnknownAllergenCoverage(dish) {
  if (!dish.provenance) return !dish.informationComplete;
  const coverage = dish.provenance.coverage || [];
  return ALLERGENS.some(
    (allergen) =>
      !coverage.some((item) => item.toLowerCase() === allergen.toLowerCase()),
  );
}

export default function AllergenIcons({
  dish,
  showUnknown = true,
  showEmpty = true,
}) {
  const declared = [...new Set(dish.allergens || [])];
  const ingredient = [...new Set(dish.ingredientHints?.allergens || [])].filter(
    (allergen) => !declared.includes(allergen),
  );
  const possible = [...new Set(dish.ingredientHints?.possibleAllergens || [])];
  const other = [...new Set(dish.otherDeclaredAllergens || [])].filter(
    (allergen) => !declared.includes(allergen),
  );
  const unknown = hasUnknownAllergenCoverage(dish);
  if (
    !declared.length &&
    !ingredient.length &&
    !possible.length &&
    !other.length &&
    !showEmpty &&
    !(showUnknown && unknown)
  )
    return null;
  return (
    <View style={s.allergenRow}>
      {declared.map((allergen) => (
        <AllergenToken key={allergen} allergen={allergen} />
      ))}
      {ingredient.map((allergen) => (
        <AllergenToken key={allergen} allergen={allergen} ingredient />
      ))}
      {other.map((allergen) => (
        <AllergenToken key={allergen} allergen={allergen} other />
      ))}
      {showUnknown && unknown && <AllergenToken unknown />}
      {!!possible.length && (
        <Text style={s.allergenLabel}>
          Check ingredients: {possible.join(", ")}
        </Text>
      )}
      {showEmpty &&
        !declared.length &&
        !ingredient.length &&
        !possible.length &&
        !other.length && (
          <Text style={s.allergenLabel}>
            No allergens declared; check details
          </Text>
        )}
    </View>
  );
}

export function AllergenLegend({ accent = colors.ink }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={s.menuLegend}>
      <View style={s.menuLegendSummary}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          aria-expanded={expanded}
          onPress={() => setExpanded(!expanded)}
          style={s.menuLegendToggle}
        >
          <AllergenGlyph size={16} color={accent} />
          <Text style={[s.menuLegendLabel, { color: accent }]}>
            Allergen key {expanded ? "−" : "+"}
          </Text>
        </Pressable>
        <Text style={[s.menuCaption, s.flex]}>
          Icons: source declarations or named ingredients (†). ? means
          incomplete coverage.
        </Text>
      </View>
      {expanded && (
        <View style={s.allergenLegendGrid}>
          {ALLERGENS.map((allergen) => (
            <AllergenToken key={allergen} allergen={allergen} />
          ))}
          <AllergenToken unknown />
          <AllergenToken allergen="Other source declaration" other />
          <Text style={s.menuCaption}>
            † marks a recognizable ingredient named in the published menu, not a
            restaurant allergen declaration. “Check ingredients” flags common
            recipe possibilities inferred from menu wording; they need
            confirmation. Additional declarations keep the restaurant's wording,
            including unspecified nut types. They are not mapped to a different
            allergen.
          </Text>
        </View>
      )}
    </View>
  );
}
