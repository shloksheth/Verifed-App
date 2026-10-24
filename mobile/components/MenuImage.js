import React from "react";
import { Image as BrowserImage, Platform } from "react-native";

// Snack's web bundler cannot initialize Expo Image's asset registry. Browsers
// already decode WebP, while Expo Image supplies that support on native iOS.
// Keep the native module lazy so the web preview never initializes it.
const Image = Platform.OS === "web"
  ? function MenuImage({ contentFit = "cover", ...props }) {
      return <BrowserImage {...props} resizeMode={contentFit} />;
    }
  : require("expo-image").Image;

export { Image };
