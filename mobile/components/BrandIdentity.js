import React, { createContext, useContext } from "react";
import { Platform, Text } from "react-native";
import { useFonts } from "expo-font";
import { SvgXml } from "react-native-svg";
import { Image } from "./MenuImage";
import { chipotleLogoXml } from "../src/brand-assets";

const BrandFont = createContext(undefined);
const fonts = {
  VerifedAnton: require("../assets/fonts/Anton-Regular.ttf"),
  VerifedBarlowCondensed: require("../assets/fonts/BarlowCondensed-SemiBold.ttf"),
};

export function BrandProvider({ brand, children }) {
  const [loaded] = useFonts(fonts);
  const fallback = Platform.OS === "ios"
    ? "HelveticaNeue-CondensedBold"
    : Platform.OS === "android" ? "sans-serif-condensed" : "Arial";
  const family = loaded
    ? brand === "taco-bell" ? "VerifedAnton" : "VerifedBarlowCondensed"
    : fallback;
  return <BrandFont.Provider value={family}>{children}</BrandFont.Provider>;
}

export function BrandHeading({ style, ...props }) {
  const fontFamily = useContext(BrandFont);
  return <Text {...props} style={[style, { fontFamily, fontWeight: "normal" }]} />;
}

export function BrandLogo({ brand, size = 58 }) {
  return brand === "chipotle"
    ? <SvgXml xml={chipotleLogoXml} width={size} height={size} accessibilityLabel="Chipotle Mexican Grill logo" />
    : <Image source={require("../assets/brands/taco-bell-logo.png")} contentFit="contain"
        style={{ width: size * 1.15, height: size }} accessibilityLabel="Official Taco Bell bell logo" />;
}
