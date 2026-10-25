import { colors, type } from "../src/design-tokens";
import { Text, TextInput } from "./Typography";
import React, { useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "./MenuImage";
import { BrandHeading, BrandLogo, BrandProvider } from "./BrandIdentity";
import AllergenIcons from "./AllergenIcons";
import { dietaryMenuStatus, groupMenu } from "../src/menu-filter";
import { localPhotoKeyFor } from "../src/local-photo-key";
import { localFoodAssets } from "../src/local-food-assets";
import { localFoodPhotoMetadata } from "../src/local-food-photo-metadata";
import { readChipotleDraft, saveChipotleDraft } from "../src/chipotle-draft";

const brown = colors.ink;
const red = colors.orange;
const categoryOrder = [
  "Proteins",
  "Rice",
  "Beans",
  "Vegetables",
  "Toppings",
  "Salsas",
  "Sauces",
  "Tortillas",
  "Sides",
];

function IngredientPhoto({ dish, style, hero = false }) {
  const photoKey = localPhotoKeyFor(dish);
  const metadata = localFoodPhotoMetadata[photoKey];
  return (
    <View style={[look.photo, style]}>
      <Image
        source={localFoodAssets[photoKey]}
        contentFit="contain"
        style={look.photoFill}
        accessibilityLabel={`${metadata?.alt || dish.name}${hero ? ". One example from the restaurant menu." : ""}`}
      />
      {metadata?.generated && (
        <Text style={look.illustration}>Menu illustration</Text>
      )}
    </View>
  );
}

function IngredientCard({ dish, profile, selected, onToggle, navigate }) {
  const status = dietaryMenuStatus(dish, profile);
  return (
    <View style={[look.card, selected && look.cardSelected]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${dish.name}`}
        onPress={() => navigate(`dish/${dish.id}`)}
      >
        <IngredientPhoto dish={dish} />
        <BrandHeading style={look.itemName}>{dish.name}</BrandHeading>
      </Pressable>
      <Text style={[look.status, status.level === "conflict" && look.conflict]}>
        {status.level === "match"
          ? "Reported dietary match"
          : status.level === "conflict"
            ? "Conflicts with your needs"
            : "View ingredient details"}
      </Text>
      <AllergenIcons dish={dish} showUnknown showEmpty />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        aria-pressed={selected}
        accessibilityLabel={`${selected ? "Remove" : "Add"} ${dish.name} ${selected ? "from" : "to"} selection`}
        onPress={() => onToggle(dish.id)}
        style={[look.addButton, selected && look.addSelected]}
      >
        <BrandHeading style={[look.addText, selected && look.addSelectedText]}>
          {selected ? "✓ ADDED" : "+ SELECT"}
        </BrandHeading>
      </Pressable>
    </View>
  );
}

export default function ChipotleMenu({
  restaurant,
  dishes,
  profile,
  navigate,
  draftOwner = "guest",
}) {
  const draftKey = `${draftOwner}:${restaurant.slug || restaurant.id}`;
  const [mode, setMode] = useState("full");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() =>
    readChipotleDraft(draftKey),
  );
  const [reviewing, setReviewing] = useState(false);
  const [bodyWidth, setBodyWidth] = useState(0);
  const columns =
    bodyWidth >= 620 ? 3 : bodyWidth > 0 && bodyWidth < 320 ? 1 : 2;
  const needs = [...(profile.allergies || []), ...(profile.restrictions || [])];
  const selected = dishes.filter((dish) => selectedIds.includes(dish.id));
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return dishes.filter(
      (dish) =>
        (category === "All" || dish.category === category) &&
        (!term ||
          [dish.name, dish.description, dish.category].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(term),
          )) &&
        (mode !== "diet" ||
          dietaryMenuStatus(dish, profile).level !== "conflict"),
    );
  }, [dishes, category, query, mode, profile]);
  const groups = groupMenu(visible).sort(
    (a, b) =>
      categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category),
  );
  const categories = categoryOrder.filter((value) =>
    dishes.some((dish) => dish.category === value),
  );
  const guacamole = dishes.find(
    (dish) => dish.catalogKey === "chipotle-south-orange-guacamole",
  );
  const toggle = (id) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((value) => value !== id)
      : [...selectedIds, id];
    saveChipotleDraft(draftKey, next);
    setSelectedIds(next);
  };

  return (
    <BrandProvider brand="chipotle">
      <View style={look.page}>
        <View style={look.header}>
          <BrandLogo brand="chipotle" size={58} />
          <View style={look.headerDivider} />
          <View style={{ flex: 1 }}>
            <BrandHeading style={look.headerTitle}>CHIPOTLE MENU</BrandHeading>
            <Text style={look.location}>{restaurant.location}</Text>
          </View>
        </View>
        <View style={[look.hero, bodyWidth < 500 && look.compactHero]}>
          <View style={{ flex: 1 }}>
            <Text style={look.overline}>CHIPOTLE</Text>
            <BrandHeading accessibilityRole="header" style={look.headline}>
              Choose your ingredients
            </BrandHeading>
            <Text style={look.heroCopy}>
              Check dietary information and save an ingredient selection.
            </Text>
          </View>
          {!!guacamole && bodyWidth >= 500 && (
            <IngredientPhoto dish={guacamole} style={look.heroPhoto} hero />
          )}
        </View>
        <View style={look.preferences}>
          <View style={{ flex: 1 }}>
            <BrandHeading style={look.preferenceTitle}>
              Your dietary needs
            </BrandHeading>
            <Text style={look.small}>
              {needs.length
                ? needs.join(" · ")
                : "Choose allergies and dietary restrictions"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit Chipotle dietary needs"
            style={look.editTarget}
            onPress={() =>
              navigate(
                `edit-profile?returnTo=${encodeURIComponent(`restaurant/${restaurant.id}`)}`,
              )
            }
          >
            <BrandHeading style={look.edit}>EDIT ›</BrandHeading>
          </Pressable>
        </View>
        <View style={look.controls}>
          <View style={look.modes}>
            {[
              ["full", "Full menu"],
              ["diet", "For my diet"],
            ].map(([value, label]) => (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === value }}
                aria-selected={mode === value}
                onPress={() => setMode(value)}
                style={[look.mode, mode === value && look.modeActive]}
              >
                <BrandHeading
                  style={[look.modeText, mode === value && look.modeTextActive]}
                >
                  {label}
                </BrandHeading>
              </Pressable>
            ))}
          </View>
          <TextInput
            accessibilityLabel="Search Chipotle menu"
            placeholder="Search ingredients or components"
            placeholderTextColor="#7B6C63"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            style={look.search}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={look.categories}
        >
          {["All", ...categories].map((value) => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: category === value }}
              aria-selected={category === value}
              onPress={() => setCategory(value)}
              style={[look.category, category === value && look.categoryActive]}
            >
              <BrandHeading
                style={[
                  look.categoryText,
                  category === value && look.categoryTextActive,
                ]}
              >
                {value === "All" ? "All ingredients" : value.toUpperCase()}
              </BrandHeading>
            </Pressable>
          ))}
        </ScrollView>
        {!!selected.length && (
          <View style={look.selectionBar}>
            <View style={{ flex: 1 }}>
              <BrandHeading style={look.selectionTitle}>
                YOUR SELECTION
              </BrandHeading>
              <Text style={look.small}>
                {selected.length
                  ? `${selected.length} components selected`
                  : "Select components to review together"}
              </Text>
            </View>
            <Pressable
              disabled={!selected.length}
              accessibilityRole="button"
              accessibilityLabel="Review Chipotle selection"
              onPress={() => setReviewing(true)}
              style={[look.reviewButton, !selected.length && { opacity: 0.45 }]}
            >
              <BrandHeading style={look.reviewText}>
                REVIEW ({selected.length})
              </BrandHeading>
            </Pressable>
          </View>
        )}
        <View
          style={look.body}
          onLayout={(event) => setBodyWidth(event.nativeEvent.layout.width)}
        >
          <Text style={look.small}>
            {visible.length} standard menu components · Open an item for
            sources.
          </Text>
          {mode === "diet" && !needs.length && (
            <Text style={look.small}>
              Choose dietary needs to personalize this menu.
            </Text>
          )}
          {groups.map((group) => (
            <View key={group.category} style={look.group}>
              <BrandHeading accessibilityRole="header" style={look.groupTitle}>
                {group.category === "Proteins"
                  ? "PROTEIN OR VEGGIE"
                  : group.category.toUpperCase()}
              </BrandHeading>
              <View style={look.grid}>
                {group.dishes.map((dish) => (
                  <View
                    key={dish.id}
                    style={{ width: `${100 / columns - 2}%` }}
                  >
                    <IngredientCard
                      dish={dish}
                      profile={profile}
                      selected={selectedIds.includes(dish.id)}
                      onToggle={toggle}
                      navigate={navigate}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
          {!visible.length && (
            <Text style={look.empty}>
              No matching components. Try another category or search.
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            style={look.sourceTarget}
            onPress={() =>
              Linking.openURL(restaurant.menuUrl || "https://www.chipotle.com/")
            }
          >
            <BrandHeading style={look.sourceLink}>
              OPEN OFFICIAL CHIPOTLE MENU ↗
            </BrandHeading>
          </Pressable>
          <Text style={look.footer}>
            Independent Verifed menu. Chipotle owns its trademarks. This is a
            component selection, not a restaurant order. Published ingredient
            and allergen coverage remains incomplete.
          </Text>
        </View>
        <Modal
          visible={reviewing}
          transparent
          animationType="slide"
          onRequestClose={() => setReviewing(false)}
        >
          <View style={look.shade}>
            <View style={look.sheet}>
              <View style={look.sheetHeader}>
                <BrandHeading style={look.groupTitle}>
                  YOUR SELECTION
                </BrandHeading>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close Chipotle selection"
                  onPress={() => setReviewing(false)}
                  style={look.close}
                >
                  <Text style={look.closeText}>✕</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={look.sheetBody}>
                <Text style={look.small}>
                  Review each component and its source. A selection does not
                  confirm the finished meal's ingredients or preparation.
                </Text>
                {selected.map((dish) => (
                  <View key={dish.id} style={look.selectionRow}>
                    <View style={{ flex: 1 }}>
                      <BrandHeading style={look.selectionTitle}>
                        {dish.name}
                      </BrandHeading>
                      <AllergenIcons dish={dish} showUnknown showEmpty />
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${dish.name} from review`}
                      onPress={() => toggle(dish.id)}
                      style={look.close}
                    >
                      <Text style={look.edit}>REMOVE</Text>
                    </Pressable>
                  </View>
                ))}
                {!selected.length && (
                  <Text style={look.empty}>Your selection is empty.</Text>
                )}
                <Text style={look.footer}>
                  Draft only. Nothing is sent to Chipotle.
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </BrandProvider>
  );
}

const look = StyleSheet.create({
  page: { marginHorizontal: -18, backgroundColor: colors.cream },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  headerDivider: { height: 42, width: 1, backgroundColor: colors.line },
  headerTitle: { ...type.section, color: colors.ink },
  location: { color: colors.muted, fontSize: 11, marginTop: 3 },
  hero: {
    backgroundColor: colors.peach,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 210,
  },
  compactHero: { minHeight: 130, paddingVertical: 17, paddingHorizontal: 17 },
  overline: { color: colors.muted, fontSize: 13, marginBottom: 3 },
  headline: { ...type.page, color: brown },
  heroCopy: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 11,
  },
  heroPhoto: { width: "37%", maxWidth: 190, aspectRatio: 1 },
  preferences: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.paleGreen,
    paddingVertical: 10,
    paddingHorizontal: 17,
  },
  preferenceTitle: { ...type.card, color: brown, marginBottom: 3 },
  small: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  editTarget: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  edit: { color: red, fontSize: 15, padding: 4 },
  controls: { padding: 12, gap: 10 },
  modes: { flexDirection: "row", borderWidth: 1, borderColor: brown },
  mode: { flex: 1, minHeight: 44, padding: 10, alignItems: "center" },
  modeActive: { backgroundColor: colors.green },
  modeText: { ...type.button, color: brown },
  modeTextActive: { color: colors.paper },
  search: {
    color: brown,
    height: 47,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  categories: {
    paddingHorizontal: 16,
    gap: 18,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  category: {
    minHeight: 44,
    paddingVertical: 11,
    borderBottomWidth: 3,
    borderColor: "transparent",
  },
  categoryActive: { borderColor: colors.green },
  categoryText: { ...type.meta, color: brown },
  categoryTextActive: { color: colors.green },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 10,
    backgroundColor: colors.peach,
  },
  selectionTitle: { ...type.card, color: brown, marginBottom: 3 },
  reviewButton: {
    backgroundColor: colors.orange,
    paddingHorizontal: 15,
    minHeight: 46,
    justifyContent: "center",
  },
  reviewText: { ...type.button, color: colors.paper },
  body: { padding: 16, gap: 22 },
  group: { gap: 13 },
  groupTitle: { ...type.section, color: brown },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "stretch",
  },
  card: {
    flex: 1,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    gap: 10,
  },
  cardSelected: { borderColor: colors.green, borderWidth: 2, padding: 9 },
  photo: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.paper,
    position: "relative",
  },
  photoFill: { width: "100%", height: "100%" },
  illustration: {
    position: "absolute",
    bottom: 3,
    right: 3,
    fontSize: 11,
    color: colors.muted,
    backgroundColor: "#FFFFFFE8",
    paddingHorizontal: 3,
  },
  itemName: { ...type.card, color: brown, marginTop: 12, minHeight: 54 },
  status: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  conflict: { color: "#AD301D" },
  addButton: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: brown,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  addSelected: { backgroundColor: colors.green },
  addText: { ...type.button, color: brown },
  addSelectedText: { color: colors.paper },
  sourceTarget: { minHeight: 44, justifyContent: "center" },
  sourceLink: { color: red, fontSize: 20, textDecorationLine: "underline" },
  footer: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    paddingBottom: 12,
  },
  empty: { paddingVertical: 20, color: brown, fontSize: 14 },
  shade: { flex: 1, backgroundColor: "#0008", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.paper, maxHeight: "88%" },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  sheetBody: { padding: 18, gap: 17, paddingBottom: 40 },
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  close: { padding: 10, minWidth: 44, minHeight: 44 },
  closeText: { fontSize: 21, color: brown },
});
