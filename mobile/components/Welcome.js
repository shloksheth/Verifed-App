import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "./Typography";
import { Image } from "./MenuImage";
import { colors, s } from "../styles";
import { Button, Sheet } from "./UI";

export default function Welcome({ onSignIn, onCreateAccount, onContinue }) {
  return (
    <View style={w.page}>
      <View style={w.photoFrame}>
        <Image
          source={require("../assets/home/chipotle-vegetarian-bowl.webp")}
          contentFit="cover"
          style={w.photo}
          accessibilityLabel="Chipotle bowl with vegetables, beans and guacamole"
        />
        <View style={w.photoLabel}>
          <Text style={w.photoLabelText}>Chipotle · Orlando</Text>
        </View>
      </View>
      <Text accessibilityRole="header" style={w.title}>
        Check the menu before you order.
      </Text>
      <Text style={w.description}>
        Explore Orlando restaurants, compare ingredients with your dietary
        needs, and save meals for next time.
      </Text>
      <View style={w.actions}>
        <Button onPress={onCreateAccount}>Create an account</Button>
        <Button variant="secondary" onPress={onSignIn}>
          Sign in
        </Button>
        <Button variant="quiet" onPress={onContinue}>
          Continue as guest
        </Button>
      </View>
      <Text style={w.privacy}>
        Guest profiles, saved dishes and meal notes stay on this device.
      </Text>
    </View>
  );
}

export function HomeInfo({ onClose }) {
  return (
    <Sheet title="About Verifed" onClose={onClose}>
      <Text style={s.body}>
        Verifed compares Orlando-area restaurant menus with your allergies and
        dietary restrictions.
      </Text>
      <Text style={s.h3}>Browse menus</Text>
      <Text style={s.body}>
        Search Explore by restaurant, dish or cuisine. Set an area to see nearby
        locations and map pins.
      </Text>
      <Text style={s.h3}>Compare ingredients</Text>
      <Text style={s.body}>
        Add your needs in You, then switch a menu to For my diet. Published
        allergen declarations and ingredient clues are labeled separately. Ask
        the restaurant about unlisted ingredients and cross-contact.
      </Text>
      <Text style={s.h3}>Keep meal notes</Text>
      <Text style={s.body}>
        Save dishes with the heart button. Rate meals in Journal to help sort
        future suggestions.
      </Text>
      <Text style={s.small}>
        Built for the Congressional App Challenge. Each restaurant menu includes
        its original sources and review details.
      </Text>
      <Button onPress={onClose}>Close</Button>
    </Sheet>
  );
}

const w = StyleSheet.create({
  page: { gap: 20, paddingBottom: 8 },
  photoFrame: {
    width: "100%",
    aspectRatio: 1.55,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.peach,
  },
  photo: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  photoLabel: {
    position: "absolute",
    left: 12,
    bottom: 12,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.paper,
  },
  photoLabelText: { color: colors.ink, fontSize: 11, fontWeight: "600" },
  title: {
    color: colors.ink,
    fontFamily: "HomeHeadingStrong",
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  description: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  actions: { gap: 10 },
  privacy: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
