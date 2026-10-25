import { useFonts } from "expo-font";

// Static, locally bundled faces work in Expo Go, native exports and Snack.
// Keep the established aliases so existing screens share one loading lifecycle.
export function useAppFonts() {
  const [loaded] = useFonts({
    HomeHeading: require("../assets/fonts/ClashGrotesk-Semibold.ttf"),
    HomeHeadingStrong: require("../assets/fonts/ClashGrotesk-Bold.ttf"),
    HomeBody: require("../assets/fonts/ClashGrotesk-Regular.ttf"),
    HomeMedium: require("../assets/fonts/ClashGrotesk-Medium.ttf"),
    HomeStrong: require("../assets/fonts/ClashGrotesk-Bold.ttf"),
  });
  // The app keeps rendering readable system text if font loading fails.
  return loaded;
}
