import { colors, type } from "../src/design-tokens";
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
              color={colors.ink}
            />
          </View>
          <View style={a.cameraMark}>
            <Icon
              name="scan-outline"
              size={compact ? 22 : 32}
              color={colors.onGreen}
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
          <ActivityIndicator color={colors.paper} />
        ) : (
          <Icon name="camera-outline" color={colors.paper} size={22} />
        )}
        <Text style={a.cameraText}>
          {busy ? "Opening photo…" : "Take a photo"}
        </Text>
        <Icon name="arrow-forward" color={colors.paper} />
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
        <Icon name="images-outline" color={colors.green} />
        <Text style={a.libraryText}>Choose a photo</Text>
      </Pressable>
      <View style={a.captureTip}>
        <Icon name="sunny-outline" color={colors.onGreen} size={19} />
        <Text style={a.captureTipText}>Whole page with no glare.</Text>
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
                  color={colors.ink}
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
        <Icon name="chevron-forward" size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}

const a = StyleSheet.create({
  capture: {
    backgroundColor: colors.green,
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
  captureTitle: { ...type.page, color: colors.paper, flex: 1 },
  finder: {
    width: 106,
    height: 128,
    justifyContent: "center",
    alignItems: "center",
  },
  paperSketch: {
    width: 76,
    height: 106,
    backgroundColor: colors.paper,
    transform: [{ rotate: "9deg" }],
    padding: 12,
    gap: 7,
    alignItems: "center",
  },
  paperRule: { height: 2, width: "100%", backgroundColor: colors.line },
  paperRuleShort: {
    height: 4,
    width: "65%",
    backgroundColor: colors.ink,
    marginBottom: 5,
  },
  cameraMark: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: colors.green,
    padding: 5,
    borderRadius: 8,
  },
  captureCopy: { color: colors.onGreen, fontSize: 15, lineHeight: 22 },
  cameraButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.orange,
    padding: 15,
    minHeight: 54,
    borderRadius: 12,
  },
  cameraText: {
    color: colors.paper,
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  libraryButton: {
    backgroundColor: colors.paleGreen,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.paleGreen,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },
  libraryText: { color: colors.green, fontSize: 15, fontWeight: "500" },
  captureTip: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  captureTipText: {
    color: colors.onGreen,
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
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  tabText: { color: colors.ink, fontSize: 14, fontWeight: "500" },
  tabActiveText: { color: colors.paper },
  gallery: {
    marginHorizontal: -12,
    backgroundColor: colors.peach,
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
  galleryTitle: { ...type.section, color: colors.ink },
  galleryCaption: { color: colors.ink, fontSize: 12 },
  galleryScroll: { paddingHorizontal: 14, gap: 12 },
  photoCard: {
    width: 192,
    backgroundColor: colors.paper,
    borderRadius: 12,
    overflow: "hidden",
  },
  foodFrame: { width: 192, height: 160, overflow: "hidden" },
  foodPhoto: { width: "100%", height: "100%" },
  photoCopy: { padding: 12, gap: 8, flex: 1 },
  photoName: { ...type.card, color: colors.ink },
  photoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  price: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 0,
  },
  dish: {
    padding: 17,
    backgroundColor: colors.paper,
    borderRadius: 12,
    gap: 9,
    marginBottom: 10,
  },
  dishTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  dishName: { ...type.card, color: colors.ink, flex: 1 },
  description: { ...type.body, color: colors.muted },
  dishBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  labels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
    alignItems: "center",
  },
  sourceBadge: {
    backgroundColor: colors.paleGreen,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sourceBadgeText: { color: colors.green, fontSize: 11, fontWeight: "600" },
  dietNote: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.green,
    flexShrink: 1,
  },
  conflict: { color: colors.orangeDark },
  pressed: { opacity: 0.65 },
});
