import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "./MenuImage";
import { Text } from "./Typography";
import { Icon } from "./UI";
import { scanDishAssets } from "../src/scan-dish-assets";

export const scanColors = {
  ground: "#EDE1CE",
  brown: "#443020",
  cream: "#FFF8EB",
  gold: "#E7BE75",
  muted: "#715E49",
  line: "#D9C7AA",
  burgundy: "#732E30",
};

export function CaptureMenu({ busy, onCamera, onLibrary }) {
  const compact = useWindowDimensions().width < 360;
  return (
    <View style={[a.capture, compact && a.captureCompact]}>
      <View style={a.captureTop}>
        <Text
          accessibilityRole="header"
          style={[a.captureTitle, compact && a.captureTitleCompact]}
        >
          {"A menu,\nyour way."}
        </Text>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[a.finder, compact && a.finderCompact]}
        >
          <View style={[a.paperSketch, compact && a.paperCompact]}>
            <View style={a.paperRuleShort} />
            <View style={a.paperRule} />
            <View style={a.paperRule} />
            <View style={a.paperRule} />
            <Icon
              name="restaurant-outline"
              size={compact ? 18 : 28}
              color={scanColors.brown}
            />
          </View>
          <View style={a.cameraMark}>
            <Icon
              name="scan-outline"
              size={compact ? 22 : 32}
              color={scanColors.gold}
            />
          </View>
        </View>
      </View>
      <Text style={[a.captureCopy, compact && a.captureCopyCompact]}>
        See dish names in English and compare ingredients with your needs.
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onCamera}
        style={({ pressed }) => [
          a.cameraButton,
          compact && a.cameraButtonCompact,
          (pressed || busy) && a.pressed,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={scanColors.brown} />
        ) : (
          <Icon name="camera-outline" color={scanColors.brown} size={22} />
        )}
        <Text style={a.cameraText}>
          {busy ? "Opening photo…" : "Take a photo"}
        </Text>
        <Icon name="arrow-forward" color={scanColors.brown} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onLibrary}
        style={({ pressed }) => [
          a.libraryButton,
          (pressed || busy) && a.pressed,
        ]}
      >
        <Icon name="images-outline" color={scanColors.cream} />
        <Text style={a.libraryText}>Choose a photo</Text>
      </Pressable>
      <View style={a.captureTip}>
        <Icon name="sunny-outline" color={scanColors.gold} size={19} />
        <Text style={a.captureTipText}>Whole page. Even light. No glare.</Text>
      </View>
    </View>
  );
}

export function ScanTabs({ options, value, onChange, label }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={a.tabs}
      accessibilityLabel={label}
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: option.value === value }}
          aria-selected={option.value === value}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => [
            a.tab,
            option.value === value && a.tabActive,
            pressed && a.pressed,
          ]}
        >
          <Text style={[a.tabText, option.value === value && a.tabActiveText]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function IllustratedDishes({ items, menu, onSelect }) {
  if (menu.id !== "sayola-dinner-fixed" || menu.edited) return null;
  const illustrated = items.filter((item) => scanDishAssets[item.id]);
  if (!illustrated.length) return null;
  return (
    <View style={a.gallery}>
      <View style={a.galleryHeading}>
        <Text accessibilityRole="header" style={a.galleryTitle}>
          A closer look
        </Text>
        <Text style={a.galleryCaption}>Dish illustrations</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={a.galleryScroll}
      >
        {illustrated.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item)}
            accessibilityRole="button"
            accessibilityLabel={`Read ${item.name} ingredients and dietary notes`}
            style={({ pressed }) => [a.photoCard, pressed && a.pressed]}
          >
            <View style={a.foodFrame}>
              <Image
                source={scanDishAssets[item.id]}
                style={a.foodPhoto}
                contentFit="contain"
                accessibilityLabel={`Illustration of ${item.name}`}
              />
            </View>
            <View style={a.photoCopy}>
              <Text style={a.photoName}>{item.name}</Text>
              <View style={a.photoFooter}>
                <Text style={a.price}>{item.price}</Text>
                <Icon
                  name="arrow-forward-circle-outline"
                  size={25}
                  color={scanColors.brown}
                />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function ScannedDish({ item, needs, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Read ${item.name} ingredients and dietary notes`}
      style={({ pressed }) => [a.dish, pressed && a.pressed]}
    >
      <View style={a.dishTop}>
        <Text style={a.dishName}>{item.name}</Text>
        <Text style={a.price}>{item.price}</Text>
      </View>
      {!!item.description && (
        <Text style={a.description}>{item.description}</Text>
      )}
      <View style={a.dishBottom}>
        <View style={a.labels}>
          {(item.sourceLabels || []).map((label) => (
            <View key={label} style={a.sourceBadge}>
              <Text style={a.sourceBadgeText}>{label}</Text>
            </View>
          ))}
          <Text
            style={[
              a.dietNote,
              (item.assessment.conflicts.length ||
                item.needsTranslationReview) &&
                a.conflict,
            ]}
          >
            {item.needsTranslationReview
              ? "Review translation"
              : item.assessment.conflicts.length
                ? `Check: ${item.assessment.conflicts.join(" · ")}`
                : needs.length
                  ? "No listed conflict"
                  : "Ingredients & dietary notes"}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={scanColors.muted} />
      </View>
    </Pressable>
  );
}

const a = StyleSheet.create({
  capture: {
    backgroundColor: scanColors.brown,
    borderRadius: 16,
    padding: 22,
    gap: 17,
    overflow: "hidden",
  },
  captureCompact: { padding: 16, gap: 10 },
  captureTitleCompact: { fontSize: 28, lineHeight: 31 },
  finderCompact: { width: 64, height: 72 },
  paperCompact: { width: 48, height: 66, padding: 7, gap: 4 },
  captureCopyCompact: { fontSize: 14, lineHeight: 20 },
  cameraButtonCompact: { minHeight: 48, paddingVertical: 12 },
  captureTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  captureTitle: {
    fontSize: 34,
    lineHeight: 37,
    color: scanColors.cream,
    fontWeight: "600",
    flex: 1,
    letterSpacing: -0.6,
  },
  finder: {
    width: 106,
    height: 128,
    justifyContent: "center",
    alignItems: "center",
  },
  paperSketch: {
    width: 76,
    height: 106,
    backgroundColor: "#F2DCB6",
    transform: [{ rotate: "9deg" }],
    padding: 12,
    gap: 7,
    alignItems: "center",
  },
  paperRule: { height: 2, width: "100%", backgroundColor: "#B29B77" },
  paperRuleShort: {
    height: 4,
    width: "65%",
    backgroundColor: scanColors.brown,
    marginBottom: 5,
  },
  cameraMark: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: scanColors.brown,
    padding: 5,
    borderRadius: 8,
  },
  captureCopy: { color: "#EBDCC6", fontSize: 15, lineHeight: 22 },
  cameraButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: scanColors.gold,
    padding: 15,
    minHeight: 54,
    borderRadius: 12,
  },
  cameraText: {
    color: scanColors.brown,
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  libraryButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#897253",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },
  libraryText: { color: scanColors.cream, fontSize: 15, fontWeight: "500" },
  captureTip: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  captureTipText: {
    color: "#EBDCC6",
    fontSize: 12,
    flexShrink: 1,
    lineHeight: 18,
  },
  tabs: { gap: 7, paddingVertical: 2 },
  tab: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#F9F0E0",
    borderWidth: 1,
    borderColor: scanColors.line,
  },
  tabActive: {
    backgroundColor: scanColors.brown,
    borderColor: scanColors.brown,
  },
  tabText: { color: scanColors.brown, fontSize: 14, fontWeight: "500" },
  tabActiveText: { color: scanColors.cream },
  gallery: {
    marginHorizontal: -12,
    backgroundColor: "#C8AC7E",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 12,
  },
  galleryHeading: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 14,
    flexWrap: "wrap",
  },
  galleryTitle: { color: scanColors.brown, fontSize: 20, fontWeight: "600" },
  galleryCaption: { color: scanColors.brown, fontSize: 12 },
  galleryScroll: { paddingHorizontal: 14, gap: 12 },
  photoCard: {
    width: 192,
    backgroundColor: scanColors.cream,
    borderRadius: 12,
    overflow: "hidden",
  },
  foodFrame: { width: 192, height: 160, overflow: "hidden" },
  foodPhoto: { width: "100%", height: "100%" },
  photoCopy: { padding: 12, gap: 8, flex: 1 },
  photoName: {
    color: scanColors.brown,
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 21,
  },
  photoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  price: {
    color: scanColors.brown,
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 0,
  },
  dish: {
    padding: 17,
    backgroundColor: scanColors.cream,
    borderRadius: 12,
    gap: 9,
    marginBottom: 10,
  },
  dishTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  dishName: {
    fontSize: 19,
    lineHeight: 24,
    color: scanColors.brown,
    fontWeight: "600",
    flex: 1,
  },
  description: { color: "#624F3B", fontSize: 14, lineHeight: 21 },
  dishBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  labels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
    alignItems: "center",
  },
  sourceBadge: {
    backgroundColor: "#E2E9D4",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sourceBadgeText: { color: "#35462B", fontSize: 11, fontWeight: "600" },
  dietNote: { fontSize: 12, lineHeight: 18, color: "#49603C", flexShrink: 1 },
  conflict: { color: scanColors.burgundy },
  pressed: { opacity: 0.65 },
});
