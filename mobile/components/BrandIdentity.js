import React from "react";
import { Text } from "./Typography";
import { SvgXml } from "react-native-svg";
import { Image } from "./MenuImage";
import { chipotleLogoXml } from "../src/brand-assets";

// Preserve the existing menu composition while using Verifed typography.
export function BrandProvider({ children }) {
  return children;
}

export function BrandHeading({ style, ...props }) {
  return <Text {...props} style={[style, { fontFamily: "HomeHeading" }]} />;
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
