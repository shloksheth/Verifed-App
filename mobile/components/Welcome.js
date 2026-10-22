import React from "react";
import { Image, Text, View } from "react-native";
import { s, colors } from "../styles";
import { Button, Icon, Sheet } from "./UI";

export default function Welcome({ onSignIn, onCreateAccount, onContinue }) {
  return (
    <View style={s.welcome}>
      <View style={s.welcomeMark}>
        <Image
          source={require("../assets/verifed-mark.png")}
          style={{ width: 90, height: 110, resizeMode: "contain" }}
          accessibilityLabel="Verifed carrot checkmark"
        />
      </View>
      <Text style={s.eyebrow}>A SEAT FOR EVERY APPETITE</Text>
      <Text
        accessibilityRole="header"
        style={[s.homeHeadline, { textAlign: "center" }]}
      >
        Welcome to your table.
      </Text>
      <Text style={[s.subtitle, { textAlign: "center" }]}>
        Discover Orlando menus around you. Find your kind of food, save a
        favorite, and remember the meals you love.
      </Text>
      <View style={{ alignSelf: "stretch", gap: 12, marginTop: 15 }}>
        <Button onPress={onCreateAccount}>Create an account</Button>
        <Button variant="secondary" onPress={onSignIn}>
          Log in
        </Button>
        <Button variant="quiet" onPress={onContinue}>
          Explore without an account
        </Button>
      </View>
      <Text style={[s.small, { textAlign: "center" }]}>
        Use Google for a new account. Guest preferences, saved dishes, and
        journal entries stay on this device.
      </Text>
    </View>
  );
}

export function HomeInfo({ onClose }) {
  return (
    <Sheet title="A little more about Verifed" onClose={onClose}>
      <Icon name="leaf-outline" size={34} color={colors.green} />
      <Text style={s.h2}>Good food should include you.</Text>
      <Text style={s.body}>
        Verifed helps Orlando-area diners explore published restaurant menus
        with their allergies and dietary needs in mind.
      </Text>
      <Text style={s.h3}>Make the menu yours</Text>
      <Text style={s.body}>
        Choose your needs in You. Open any restaurant for its Full menu or For
        my diet view. Source-reported matches and possible options have separate
        labels.
      </Text>
      <Text style={s.h3}>Find your next table</Text>
      <Text style={s.body}>
        Explore lets you choose an area, view a map, and filter by cuisine or
        dietary evidence. Recommended results consider your selected needs,
        preferences, and meals you rated.
      </Text>
      <Text style={s.h3}>Know what the labels mean</Text>
      <Text style={s.body}>
        Restaurant declarations and ingredient clues have separate labels. Open
        Source details for coverage, review dates and original menus.
      </Text>
      <Text style={s.small}>
        Built as a Congressional App Challenge community project. Restaurant
        locations and source links are listed in each menu.
      </Text>
      <Button onPress={onClose}>Back to my table</Button>
    </Sheet>
  );
}
