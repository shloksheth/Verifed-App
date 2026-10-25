import React, { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./Typography";
import { Image } from "./MenuImage";
import { colors, s } from "../styles";
import { type } from "../src/design-tokens";
import { Button, Icon, Sheet } from "./UI";

// Reuse individually sourced local photos; these captions identify the food,
// not its suitability for an allergy or a price available to order.
const dishes = [
  {
    name: "Vegetarian bowl",
    place: "Chipotle",
    color: "#F4CE58",
    source: require("../assets/home/chipotle-vegetarian-bowl.webp"),
    alt: "Chipotle bowl with rice, vegetables, beans and guacamole",
  },
  {
    name: "Roti canai",
    place: "Hawkers",
    color: "#ECA38A",
    source: require("../assets/food/hawkers-orlando/roti-canai.webp"),
    alt: "Hawkers flaky roti canai with curry dip",
  },
  {
    name: "Summer rolls",
    place: "Loving Hut",
    color: "#A9C695",
    source: require("../assets/food/loving-hut-orlando/summer-rolls-2-rolls-bo-bia.webp"),
    alt: "Loving Hut summer rolls with vegetables and dipping sauce",
  },
  {
    name: "Teriyaki salmon",
    place: "Fresh Kitchen",
    color: "#B7C7DB",
    source: require("../assets/food/fresh-kitchen-waterford/teriyaki-salmon.webp"),
    alt: "Fresh Kitchen teriyaki salmon from its official menu",
  },
];

export default function Welcome({ onSignIn, onCreateAccount, onContinue }) {
  const carousel = useRef(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardHeight = Math.max(
    330,
    Math.min(560, height - insets.top - insets.bottom - 246),
  );
  useEffect(() => {
    carousel.current?.scrollTo({ x: active * width, animated: false });
  }, [width]);
  function select(index) {
    if (!width) return;
    setActive(index);
    carousel.current?.scrollTo({ x: index * width, animated: true });
  }
  return (
    <View style={w.page}>
      <View
        style={[w.carousel, { height: cardHeight }]}
        onLayout={({ nativeEvent }) => {
          const nextWidth = nativeEvent.layout.width;
          if (nextWidth > 0 && nextWidth !== width) {
            setWidth(nextWidth);
          }
        }}
      >
        {width > 0 && (
          <ScrollView
            ref={carousel}
            horizontal
            pagingEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={32}
            onScroll={({ nativeEvent }) =>
              setActive(
                Math.max(
                  0,
                  Math.min(
                    dishes.length - 1,
                    Math.round(nativeEvent.contentOffset.x / width),
                  ),
                ),
              )
            }
          >
            {dishes.map((dish, index) => (
              <View
                key={dish.name}
                accessibilityElementsHidden={active !== index}
                importantForAccessibility={
                  active === index ? "auto" : "no-hide-descendants"
                }
                aria-hidden={active !== index}
                style={[
                  w.slide,
                  { width, height: cardHeight, backgroundColor: dish.color },
                ]}
              >
                <View style={w.brandRow}>
                  <View style={w.brand}>
                    <Image
                      source={require("../assets/verifed-mark.png")}
                      style={w.mark}
                      contentFit="contain"
                      accessibilityLabel="Verifed carrot checkmark"
                    />
                    <Text style={w.wordmark}>verifed.</Text>
                  </View>
                  <Text style={w.badge}>Find your flavor</Text>
                </View>
                <Text
                  accessibilityRole="header"
                  style={[w.title, cardHeight < 400 && w.compactTitle]}
                >
                  Find your{`\n`}next favorite.
                </Text>
                <View style={[w.photoFrame, index === 0 && w.chipotleFrame]}>
                  <Image
                    source={dish.source}
                    contentFit={index === 0 ? "contain" : "cover"}
                    style={w.photo}
                    accessibilityLabel={dish.alt}
                  />
                  <View style={w.photoLabel}>
                    <View style={w.caption}>
                      <Text style={w.dishName}>{dish.name}</Text>
                      <Text style={w.restaurant}>{dish.place}</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Next food photo after ${dish.name}`}
                      onPress={() => select((index + 1) % dishes.length)}
                      style={w.next}
                    >
                      <Icon
                        name="arrow-forward"
                        size={22}
                        color={colors.paper}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      <View style={w.dots} accessibilityLabel="Featured food photos">
        {dishes.map((dish, index) => (
          <Pressable
            key={dish.name}
            accessibilityRole="button"
            accessibilityLabel={`Show ${dish.name}, photo ${index + 1} of 4`}
            accessibilityState={{ selected: active === index }}
            onPress={() => select(index)}
            style={w.dotTarget}
          >
            <View style={[w.dot, active === index && w.activeDot]} />
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onCreateAccount}
        style={({ pressed }) => [w.primary, pressed && w.pressed]}
      >
        <Text style={w.primaryText}>Get started</Text>
        <Icon name="arrow-forward" color={colors.paper} size={20} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in to your account"
        onPress={onSignIn}
        style={w.textAction}
      >
        <Text style={w.secondaryText}>
          Have an account? <Text style={w.signIn}>Sign in</Text>
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onContinue}
        style={w.guestAction}
      >
        <Text style={w.guestText}>Explore as a guest</Text>
      </Pressable>
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
  page: { flex: 1, paddingHorizontal: 18, paddingVertical: 12, gap: 8 },
  carousel: {
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#F4CE58",
  },
  slide: { padding: 16, gap: 14 },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 5 },
  mark: { width: 22, height: 28 },
  wordmark: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  badge: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  title: {
    color: colors.ink,
    fontFamily: "HomeHeadingStrong",
    fontSize: 46,
    lineHeight: 46,
    letterSpacing: -1.6,
  },
  compactTitle: { fontSize: 36, lineHeight: 37 },
  chipotleFrame: { backgroundColor: "#E0C8A8" },
  photoFrame: {
    flex: 1,
    minHeight: 130,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.paper,
  },
  photo: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  photoLabel: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: colors.green,
    borderRadius: 24,
    paddingLeft: 15,
    paddingRight: 5,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  caption: { flex: 1, paddingVertical: 4 },
  dishName: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  restaurant: { color: colors.paleGreen, fontSize: 11, lineHeight: 16 },
  next: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#6C7E71",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    height: 44,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dotTarget: {
    minWidth: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { height: 5, width: 16, borderRadius: 3, backgroundColor: "#73867A" },
  activeDot: { width: 28, backgroundColor: colors.paleGreen },
  primary: {
    minHeight: 52,
    backgroundColor: colors.orange,
    borderRadius: 28,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryText: { ...type.button, color: colors.paper, fontSize: 16 },
  pressed: { opacity: 0.8 },
  textAction: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  secondaryText: {
    ...type.body,
    color: colors.paleGreen,
    fontSize: 16,
    lineHeight: 24,
  },
  signIn: {
    color: colors.paper,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
  },
  guestAction: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  guestText: {
    ...type.button,
    color: colors.paper,
    fontSize: 17,
    lineHeight: 24,
  },
});
