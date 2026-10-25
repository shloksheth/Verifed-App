import React from "react";
import {
  Image as NativeImage,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFonts } from "expo-font";
import Svg, { Path, Rect } from "react-native-svg";
import { Image } from "./MenuImage";
import { Icon } from "./UI";
import { homeNeeds, homeRestaurants } from "../src/home-content";

export const homeColors = {
  cream: "#F7F5EF",
  green: "#164B39",
  orange: "#EF732B",
  ink: "#153E35",
  muted: "#5D6C68",
  sage: "#E6EBDF",
  line: "#E5E3DB",
};

// Bundle real font files so native and Snack do not depend on Google Fonts CSS.
export function useHomeFonts() {
  const [loaded] = useFonts({
    HomeHeading: require("../assets/fonts/Sora-SemiBold.ttf"),
    HomeBody: require("../assets/fonts/DMSans-Regular.ttf"),
    HomeMedium: require("../assets/fonts/DMSans-Medium.ttf"),
  });
  return loaded;
}

function Copy({ fontsReady, heading, medium, style, ...props }) {
  const family = heading ? "HomeHeading" : medium ? "HomeMedium" : "HomeBody";
  return (
    <Text
      {...props}
      style={[h.copy, fontsReady && { fontFamily: family }, style]}
    />
  );
}

export function HomeHeader({ fontsReady, navigate, onInfo }) {
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
        <Copy fontsReady={fontsReady} heading style={h.wordmark}>
          verifed
        </Copy>
      </Pressable>
      <View style={h.headerActions}>
        <Pressable
          onPress={onInfo}
          accessibilityRole="button"
          accessibilityLabel="About Verifed"
          style={h.iconButton}
        >
          <Icon
            name="information-circle-outline"
            size={27}
            color={homeColors.ink}
          />
        </Pressable>
        <Pressable
          onPress={() => navigate("favorites")}
          accessibilityRole="button"
          accessibilityLabel="Open saved dishes"
          style={h.iconButton}
        >
          <Icon name="heart-outline" size={27} color={homeColors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

export function HomeTab({ selected, fontsReady }) {
  return (
    <View style={[h.homeTab, selected && h.homeTabSelected]}>
      <Icon
        name={selected ? "home" : "home-outline"}
        size={23}
        color={selected ? "#FFFFFF" : homeColors.muted}
      />
      <Copy
        fontsReady={fontsReady}
        medium
        style={[h.tabLabel, selected && h.tabLabelSelected]}
      >
        Home
      </Copy>
    </View>
  );
}

function MenuSketch() {
  return (
    <View pointerEvents="none" accessible={false} style={h.sketch}>
      <Svg width="100%" height="100%" viewBox="0 0 94 128">
        <Rect
          x="39"
          y="8"
          width="48"
          height="96"
          rx="4"
          stroke="#E4EEE6"
          strokeWidth="2"
          fill="none"
          transform="rotate(8 63 56)"
        />
        <Path
          d="M53 39h21M53 52h21M53 65h21M53 78h16M60 21v-3m-8 11c0-12 22-12 22 0H52Z"
          stroke="#E4EEE6"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Rect
          x="8"
          y="34"
          width="39"
          height="72"
          rx="5"
          stroke="#E4EEE6"
          strokeWidth="2"
          fill="#164B39"
          transform="rotate(-7 28 70)"
        />
        <Path
          d="M22 42h12m-15 24h5l3-4h7l3 4h4v19H19V66Zm10 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
          stroke="#E4EEE6"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const covers = {
  "hawkers-orlando": {
    source: require("../assets/food/hawkers-orlando/roti-canai.webp"),
    alt: "Hawkers roti canai with curry dip in a red basket",
    name: "Hawkers",
    detail: "Asian street food · Orlando",
  },
  "chipotle-south-orange": {
    source: require("../assets/home/chipotle-vegetarian-bowl.webp"),
    alt: "Real Chipotle vegetarian bowl with rice, beans, vegetables and guacamole",
    name: "Chipotle",
    detail: "Mexican · Orlando",
  },
};

export default function Home({ state, navigate, searchArea, fontsReady }) {
  const needs = homeNeeds(state.profile);
  const restaurants = homeRestaurants(state.restaurants);
  const location = searchArea?.label || "Orlando, FL";
  const copy = { fontsReady };

  return (
    <View style={h.page}>
      <Pressable
        onPress={() => navigate("explore?location=1")}
        accessibilityRole="button"
        accessibilityLabel={`Change location, currently ${location}`}
        style={h.location}
      >
        <Icon name="location" size={18} color={homeColors.green} />
        <Copy {...copy} medium style={h.locationText} numberOfLines={2}>
          {location}
        </Copy>
        <Icon name="chevron-down" size={18} color={homeColors.green} />
      </Pressable>

      <Copy {...copy} heading accessibilityRole="header" style={h.headline}>
        Find your next good meal.
      </Copy>

      <View style={h.needs}>
        <View style={h.sectionHeading}>
          <Copy {...copy} medium style={h.needsTitle}>
            Your needs
          </Copy>
          <Pressable
            onPress={() => navigate("edit-profile?returnTo=home")}
            accessibilityRole="button"
            accessibilityLabel="Edit your dietary needs"
            style={h.textButton}
          >
            <Copy {...copy} medium style={h.edit}>
              Edit
            </Copy>
          </Pressable>
        </View>
        {needs.length ? (
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
                <Icon name={need.icon} size={18} color={homeColors.green} />
                <Copy {...copy} style={h.needText}>
                  {need.label}
                </Copy>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Pressable
            onPress={() => navigate("edit-profile?returnTo=home")}
            accessibilityRole="button"
            style={h.emptyNeeds}
          >
            <Icon
              name="add-circle-outline"
              size={19}
              color={homeColors.green}
            />
            <Copy {...copy} style={h.needText}>
              Choose your dietary needs
            </Copy>
          </Pressable>
        )}
      </View>

      <View style={h.scanPanel}>
        <View style={h.scanIntro}>
          <View style={h.scanWords}>
            <Copy
              {...copy}
              heading
              accessibilityRole="header"
              style={h.scanTitle}
            >
              A menu you can read.
            </Copy>
            <Copy {...copy} style={h.scanDescription}>
              Photograph a menu. Explore it in English.
            </Copy>
          </View>
          <MenuSketch />
        </View>
        <Pressable
          onPress={() => navigate("scan")}
          accessibilityRole="button"
          accessibilityLabel="Scan a menu"
          style={({ pressed }) => [h.scanButton, pressed && h.pressed]}
        >
          <Icon name="camera-outline" size={24} color="#FFFFFF" />
          <Copy {...copy} medium style={h.scanButtonText}>
            Scan a menu
          </Copy>
        </Pressable>
        <Copy {...copy} style={h.scanHint}>
          Take a photo or choose from your library
        </Copy>
      </View>

      <View style={h.restaurantSection}>
        <View style={h.sectionHeading}>
          <Copy
            {...copy}
            heading
            accessibilityRole="header"
            style={h.sectionTitle}
          >
            Explore Orlando
          </Copy>
          <Pressable
            onPress={() => navigate("explore")}
            accessibilityRole="button"
            accessibilityLabel="See all restaurants"
            style={h.textButton}
          >
            <Copy {...copy} medium style={h.seeAll}>
              See all →
            </Copy>
          </Pressable>
        </View>
        <View style={h.restaurantGrid}>
          {restaurants.map((restaurant) => {
            const cover = covers[restaurant.slug];
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
                </View>
                <View style={h.restaurantCaption}>
                  <View style={h.restaurantNameRow}>
                    <Copy {...copy} heading style={h.restaurantName}>
                      {cover.name}
                    </Copy>
                    <Icon
                      name="arrow-forward"
                      size={18}
                      color={homeColors.green}
                    />
                  </View>
                  <Copy {...copy} style={h.restaurantDetail}>
                    {cover.detail}
                  </Copy>
                </View>
              </Pressable>
            );
          })}
        </View>
        {!restaurants.length && (
          <Copy {...copy}>
            These featured menus are unavailable. See all restaurants to browse
            the current catalog.
          </Copy>
        )}
      </View>

      <View style={h.cuisines}>
        <Copy
          {...copy}
          heading
          accessibilityRole="header"
          style={h.cuisineTitle}
        >
          Something different?
        </Copy>
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
              style={({ pressed }) => [h.cuisineChip, pressed && h.pressed]}
            >
              <Icon name={icon} size={20} color={homeColors.green} />
              <Copy {...copy} style={h.cuisineLabel}>
                {label}
              </Copy>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const h = StyleSheet.create({
  copy: { color: homeColors.ink, fontSize: 15, lineHeight: 22 },
  page: { gap: 24, paddingBottom: 10 },
  header: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: 6,
  },
  brandLink: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    gap: 7,
  },
  brandMark: { width: 30, height: 39, resizeMode: "contain" },
  wordmark: { fontSize: 27, lineHeight: 36, letterSpacing: -1.2 },
  headerActions: { flexDirection: "row", gap: 3 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  location: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
    minHeight: 44,
    gap: 8,
    borderRadius: 22,
    backgroundColor: "#EAEDE5",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  locationText: { flexShrink: 1, fontSize: 14, lineHeight: 20 },
  headline: { fontSize: 27, lineHeight: 35, letterSpacing: -1, marginTop: -3 },
  needs: { gap: 8, marginTop: -6 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  needsTitle: { fontSize: 16 },
  textButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 2 },
  edit: {
    color: homeColors.green,
    textDecorationLine: "underline",
    fontSize: 14,
  },
  needsRail: { gap: 8, paddingBottom: 1 },
  needChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: homeColors.sage,
    borderRadius: 24,
    paddingHorizontal: 13,
    paddingVertical: 10,
    minHeight: 44,
  },
  needText: { fontSize: 13, lineHeight: 20 },
  emptyNeeds: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    alignSelf: "flex-start",
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: homeColors.sage,
    borderRadius: 22,
  },
  scanPanel: {
    backgroundColor: homeColors.green,
    borderRadius: 18,
    padding: 18,
    gap: 13,
  },
  scanIntro: { flexDirection: "row", alignItems: "center", gap: 8 },
  scanWords: { flex: 1, gap: 7 },
  scanTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
  scanDescription: { color: "#EDF2E9", fontSize: 14, lineHeight: 21 },
  sketch: { width: 74, height: 105 },
  scanButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 7,
    padding: 11,
    borderRadius: 13,
    backgroundColor: "#C64D10",
  },
  scanButtonText: { color: "#FFFFFF", fontSize: 17 },
  scanHint: {
    color: "#D9E5DB",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  restaurantSection: { gap: 8 },
  sectionTitle: {
    fontSize: 21,
    lineHeight: 29,
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  seeAll: { color: homeColors.green, fontSize: 14 },
  restaurantGrid: { flexDirection: "row", gap: 10 },
  restaurantCard: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: homeColors.line,
  },
  // Own the aspect ratio on a View: React Native Web otherwise applies the
  // bundled image's intrinsic height (450/600px) to the Image itself.
  foodFrame: { width: "100%", aspectRatio: 1.35, overflow: "hidden" },
  foodPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  restaurantCaption: { padding: 10, gap: 4 },
  restaurantNameRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  restaurantName: {
    fontSize: 16,
    lineHeight: 23,
    flex: 1,
    letterSpacing: -0.4,
  },
  restaurantDetail: { color: homeColors.muted, fontSize: 11, lineHeight: 17 },
  cuisines: { gap: 13 },
  cuisineTitle: { fontSize: 17, lineHeight: 24, letterSpacing: -0.4 },
  cuisineRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cuisineChip: {
    flexGrow: 1,
    flexBasis: "28%",
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#809486",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  cuisineLabel: { fontSize: 13 },
  homeTab: {
    minWidth: 58,
    minHeight: 54,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  homeTabSelected: { backgroundColor: homeColors.green },
  tabLabel: { fontSize: 10, lineHeight: 14, color: homeColors.muted },
  tabLabelSelected: { color: "#FFFFFF" },
  pressed: { opacity: 0.76 },
  previewDescription: { lineHeight: 24, marginBottom: 6 },
});
