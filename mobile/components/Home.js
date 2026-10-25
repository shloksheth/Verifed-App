import React, { useState } from "react";
import {
  Image as NativeImage,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "./MenuImage";
import { Text, TextInput } from "./Typography";
import { Icon } from "./UI";
import { colors } from "../styles";
import { homeNeeds, homeRestaurants } from "../src/home-content";
export { useAppFonts as useHomeFonts } from "../src/use-app-fonts";

export function HomeHeader({ navigate, onInfo }) {
  return (
    <View style={h.header}>
      <Pressable
        onPress={() => navigate("home")}
        accessibilityRole="button"
        accessibilityLabel="Verifed home"
        style={h.brandLink}
      >
        <NativeImage
          source={require("../assets/verifed-mark.png")}
          style={h.brandMark}
          accessibilityLabel="Verifed carrot checkmark"
        />
        <Text style={h.wordmark}>
          verifed<Text style={{ color: colors.orange }}>.</Text>
        </Text>
      </Pressable>
      <View style={h.headerActions}>
        <Pressable
          onPress={onInfo}
          accessibilityRole="button"
          accessibilityLabel="About Verifed"
          style={h.iconButton}
        >
          <Icon name="information-circle-outline" size={24} />
        </Pressable>
        <Pressable
          onPress={() => navigate("favorites")}
          accessibilityRole="button"
          accessibilityLabel="Open saved dishes"
          style={h.iconButton}
        >
          <Icon name="heart-outline" size={24} />
        </Pressable>
      </View>
    </View>
  );
}

export function HomeTab({ selected }) {
  return (
    <View style={[h.homeTab, selected && h.homeTabSelected]}>
      <Icon
        name={selected ? "home" : "home-outline"}
        size={23}
        color={selected ? colors.paper : colors.muted}
      />
      <Text style={[h.tabLabel, selected && { color: colors.paper }]}>
        Home
      </Text>
    </View>
  );
}

const covers = {
  "hawkers-orlando": {
    source: require("../assets/food/hawkers-orlando/roti-canai.webp"),
    alt: "Hawkers roti canai with curry dip",
    name: "Hawkers",
    detail: "Asian street food",
  },
  "chipotle-south-orange": {
    source: require("../assets/home/chipotle-vegetarian-bowl.webp"),
    alt: "Chipotle bowl with rice, beans, vegetables and guacamole",
    name: "Chipotle",
    detail: "Mexican",
  },
};

export default function Home({ state, navigate, searchArea }) {
  const [query, setQuery] = useState("");
  const needs = homeNeeds(state.profile);
  const restaurants = homeRestaurants(state.restaurants);
  const location = searchArea?.label || "Orlando, FL";
  function search() {
    navigate(`explore?q=${encodeURIComponent(query.trim())}`);
  }
  return (
    <View style={h.page}>
      <Pressable
        onPress={() => navigate("explore?location=1")}
        accessibilityRole="button"
        accessibilityLabel={`Change location, currently ${location}`}
        style={h.location}
      >
        <View style={h.locationDot}>
          <Icon name="location-outline" size={20} color={colors.orange} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={h.locationLabel}>Browse menus in</Text>
          <Text style={h.locationText} numberOfLines={2}>
            {location}
          </Text>
        </View>
        <Icon name="chevron-down" size={18} />
      </Pressable>

      <Text accessibilityRole="header" style={h.headline}>
        Find your next meal.
      </Text>
      <View style={h.search}>
        <Icon name="search-outline" size={22} color={colors.muted} />
        <TextInput
          accessibilityLabel="Search restaurants or dishes"
          placeholder="Restaurant, dish or ingredient"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={h.searchInput}
        />
        <Pressable
          onPress={search}
          accessibilityRole="button"
          accessibilityLabel="Find menus"
          style={h.searchGo}
        >
          <Icon name="arrow-forward" color={colors.paper} size={20} />
        </Pressable>
      </View>

      <View style={h.cuisineRow}>
        {[
          ["Indian", "restaurant-outline"],
          ["Mexican", "sunny-outline"],
          ["Vegan", "leaf-outline"],
        ].map(([label, icon]) => (
          <Pressable
            key={label}
            onPress={() =>
              navigate(`explore?cuisine=${encodeURIComponent(label)}`)
            }
            accessibilityRole="button"
            accessibilityLabel={`Explore ${label} restaurants`}
            style={({ pressed }) => [h.cuisine, pressed && h.pressed]}
          >
            <View style={h.cuisineIcon}>
              <Icon name={icon} color={colors.ink} size={25} />
            </View>
            <Text style={h.cuisineName}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={h.section}>
        <View style={h.sectionHeading}>
          <Text accessibilityRole="header" style={h.sectionTitle}>
            Featured menus
          </Text>
          <Pressable
            onPress={() => navigate("explore")}
            accessibilityRole="button"
            accessibilityLabel="See all restaurants"
            style={h.textButton}
          >
            <Text style={h.link}>See all</Text>
            <Icon name="arrow-forward" color={colors.orangeDark} size={17} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={h.restaurantRail}
        >
          {restaurants.map((restaurant) => {
            const cover = covers[restaurant.slug];
            const count = state.dishes.filter(
              (dish) => dish.restaurantId === restaurant.id,
            ).length;
            return (
              <Pressable
                key={restaurant.id}
                onPress={() => navigate(`restaurant/${restaurant.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`View ${cover.name} menu`}
                style={({ pressed }) => [
                  h.restaurantCard,
                  pressed && h.pressed,
                ]}
              >
                <View style={h.foodFrame}>
                  <Image
                    source={cover.source}
                    contentFit="cover"
                    accessibilityLabel={cover.alt}
                    style={h.foodPhoto}
                  />
                  <View style={h.photoArrow}>
                    <Icon name="arrow-forward" size={19} />
                  </View>
                </View>
                <View style={h.caption}>
                  <Text style={h.restaurantName}>{cover.name}</Text>
                  <Text style={h.meta}>
                    {cover.detail}
                    {count ? ` · ${count} items` : ""}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        {!restaurants.length && (
          <Text style={h.meta}>
            No featured menus available. Browse all restaurants instead.
          </Text>
        )}
      </View>

      <View style={h.needs}>
        <View style={h.sectionHeading}>
          <View style={{ flex: 1 }}>
            <Text style={h.needsTitle}>Your dietary needs</Text>
            {!needs.length && (
              <Text style={h.meta}>Add allergies or dietary restrictions.</Text>
            )}
          </View>
          <Pressable
            onPress={() => navigate("edit-profile?returnTo=home")}
            accessibilityRole="button"
            accessibilityLabel="Edit your dietary needs"
            style={h.textButton}
          >
            <Text style={h.link}>{needs.length ? "Edit" : "Set up"}</Text>
            <Icon name="chevron-forward" size={16} color={colors.orangeDark} />
          </Pressable>
        </View>
        {!!needs.length && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={h.needsRail}
          >
            {needs.map((need) => (
              <Pressable
                key={need.key}
                onPress={() => navigate("edit-profile?returnTo=home")}
                accessibilityRole="button"
                accessibilityLabel={`Edit dietary need: ${need.label}`}
                style={h.needChip}
              >
                <Icon name={need.icon} size={16} color={colors.green} />
                <Text style={h.needText}>{need.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <Pressable
        onPress={() => navigate("scan")}
        accessibilityRole="button"
        accessibilityLabel="Scan a menu"
        style={({ pressed }) => [h.scanPanel, pressed && h.pressed]}
      >
        <View style={{ flex: 1, gap: 9 }}>
          <Text accessibilityRole="header" style={h.scanTitle}>
            Have a paper menu?
          </Text>
          <Text style={h.scanDescription}>
            Take a photo to view it in English.
          </Text>
          <View style={h.scanAction}>
            <Icon name="camera-outline" size={20} color={colors.orangeDark} />
            <Text style={h.link}>Scan menu</Text>
            <Icon name="arrow-forward" size={18} color={colors.orangeDark} />
          </View>
        </View>
        <View style={h.menuThumbnail}>
          <Image
            source={require("../assets/scan/2cero7-spanish-menu.webp")}
            contentFit="contain"
            accessibilityLabel="Spanish restaurant menu"
            style={h.foodPhoto}
          />
        </View>
      </Pressable>
    </View>
  );
}

const h = StyleSheet.create({
  page: { gap: 24, paddingBottom: 8 },
  header: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  brandLink: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    gap: 7,
  },
  brandMark: { width: 27, height: 35, resizeMode: "contain" },
  wordmark: {
    fontFamily: "HomeStrong",
    fontSize: 25,
    lineHeight: 34,
    letterSpacing: -1.1,
    color: colors.ink,
  },
  headerActions: { flexDirection: "row", gap: 4 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
  },
  locationDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.peach,
    alignItems: "center",
    justifyContent: "center",
  },
  locationLabel: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  locationText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  headline: {
    color: colors.ink,
    fontFamily: "HomeHeadingStrong",
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.8,
    maxWidth: 390,
  },
  search: {
    backgroundColor: colors.paper,
    borderRadius: 28,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 6,
    gap: 9,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: -7,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: 14,
    minHeight: 50,
    paddingVertical: 8,
  },
  searchGo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  cuisineRow: { flexDirection: "row", gap: 12 },
  cuisine: { flex: 1, alignItems: "center", gap: 8 },
  cuisineIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  cuisineName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  section: { gap: 12 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontFamily: "HomeHeadingStrong",
    color: colors.ink,
    fontSize: 25,
    lineHeight: 32,
    flexShrink: 1,
  },
  textButton: {
    minHeight: 44,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  link: {
    color: colors.orangeDark,
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 21,
  },
  restaurantRail: { gap: 16, paddingRight: 4 },
  restaurantCard: { width: 254, gap: 10 },
  foodFrame: {
    width: "100%",
    aspectRatio: 1.5,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.line,
  },
  foodPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  photoArrow: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  caption: { gap: 3 },
  restaurantName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  needs: {
    paddingVertical: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  needsTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
  },
  needsRail: { gap: 8 },
  needChip: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 24,
    backgroundColor: colors.paleGreen,
  },
  needText: { color: colors.green, fontSize: 13, lineHeight: 20 },
  scanPanel: {
    backgroundColor: colors.peach,
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scanTitle: {
    color: colors.ink,
    fontFamily: "HomeHeadingStrong",
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  scanDescription: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  scanAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 44,
  },
  menuThumbnail: {
    width: 75,
    height: 108,
    backgroundColor: colors.paper,
    borderRadius: 4,
    overflow: "hidden",
    transform: [{ rotate: "8deg" }],
  },
  homeTab: {
    minWidth: 56,
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  homeTabSelected: { backgroundColor: colors.green },
  tabLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
  },
  pressed: { opacity: 0.72 },
});
