import React, { createContext, forwardRef, useContext } from "react";
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
} from "react-native";
import { isLoaded } from "expo-font";
import { textFontStyle } from "../src/typography";

const FontReadiness = createContext(null);

export function TypographyProvider({ fontsReady, children }) {
  return (
    <FontReadiness.Provider value={fontsReady}>
      {children}
    </FontReadiness.Provider>
  );
}

function useFontReadiness() {
  const ready = useContext(FontReadiness);
  return ready ?? ["HomeHeading", "HomeBody", "HomeMedium"].every(isLoaded);
}

export const Text = forwardRef(function Text(
  { style, accessibilityRole, ...props },
  ref,
) {
  const ready = useFontReadiness();
  const font = textFontStyle(
    StyleSheet.flatten(style) || {},
    {
      heading: accessibilityRole === "header",
    },
    ready,
  );
  return (
    <NativeText
      {...props}
      ref={ref}
      accessibilityRole={accessibilityRole}
      style={[style, font]}
    />
  );
});

export const TextInput = forwardRef(function TextInput(
  { style, ...props },
  ref,
) {
  const ready = useFontReadiness();
  const font = textFontStyle(
    StyleSheet.flatten(style) || {},
    { input: true },
    ready,
  );
  return <NativeTextInput {...props} ref={ref} style={[style, font]} />;
});
