import { useFonts } from "expo-font";

// Static, locally bundled faces work in Expo Go, native exports and Snack.
// Keep the established aliases so existing screens share one loading lifecycle.
export function useAppFonts() {
  const [loaded] = useFonts({
    HomeHeading: require("../assets/fonts/SourceSerif4-SemiBold.ttf"),
    HomeHeadingStrong: require("../assets/fonts/SourceSerif4-Bold.ttf"),
    HomeBody: require("../assets/fonts/PublicSans-Regular.ttf"),
    HomeMedium: require("../assets/fonts/PublicSans-SemiBold.ttf"),
    HomeStrong: require("../assets/fonts/PublicSans-Bold.ttf"),
  });
  // The app keeps rendering readable system text if font loading fails.
  return loaded;
}
