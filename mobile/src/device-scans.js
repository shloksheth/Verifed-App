import AsyncStorage from "@react-native-async-storage/async-storage";
import { createScanLibrary } from "./scan-library.js";

// Scanning and Settings share one queue so a pending save cannot undo clearing.
export const scanLibrary = createScanLibrary(AsyncStorage);
