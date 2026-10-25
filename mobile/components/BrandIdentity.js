import React from "react";
import { Text } from "./Typography";
import { SvgXml } from "react-native-svg";
import { Image } from "./MenuImage";
import { chipotleLogoXml } from "../src/brand-assets";

// Chain-specific typography is intentionally distinct from the Verifed shell.
export function BrandProvider({ children }) {
  return children;
}

export function BrandHeading({ style, accessibilityRole, ...props }) {
  // The wrapper also renders tabs and product names: only true headings use serif.
  return (
    <Text
      {...props}
      accessibilityRole={accessibilityRole}
      style={[
        style,
        {
          fontFamily:
            accessibilityRole === "header" ? "HomeHeadingStrong" : "HomeStrong",
        },
      ]}
    />
  );
}

export function BrandLogo({ brand, size = 58 }) {
  return brand === "chipotle" ? (
    <SvgXml
      xml={chipotleLogoXml}
      width={size}
      height={size}
      accessibilityLabel="Chipotle Mexican Grill logo"
    />
  ) : (
    <Image
      source={require("../assets/brands/taco-bell-logo.png")}
      contentFit="contain"
      style={{ width: size * 1.15, height: size }}
      accessibilityLabel="Official Taco Bell bell logo"
    />
  );
}
