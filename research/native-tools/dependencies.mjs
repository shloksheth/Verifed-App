// Keep existing compatible ranges; adding a second tilde makes an invalid version.
export function snackVersionFor(name, version) {
  if (/^[~^]/.test(version)) return version;
  if (name.startsWith("expo-") || name === "react-native-safe-area-context") {
    return `~${version}`;
  }
  if (name === "@expo/vector-icons") return `^${version}`;
  return version;
}
