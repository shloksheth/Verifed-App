import { Platform } from "react-native";
import { URL, URLSearchParams } from "react-native-url-polyfill";

// Install URL before loading Supabase on native runtimes. Keep the browser's
// own implementation in web previews. Version 4 also avoids the older
// polyfill's punycode dependency, which failed in Snack's Android runtime.
if (Platform.OS !== "web") {
  global.URL = URL;
  global.URLSearchParams = URLSearchParams;
  globalThis.URL = URL;
  globalThis.URLSearchParams = URLSearchParams;
}
