import React, { useMemo, useState } from "react";
import {
  Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text,
  TextInput, View,
} from "react-native";
import { Image } from "expo-image";
import { api } from "../src/api";
import { dietaryMenuStatus, groupMenu } from "../src/menu-filter";
import { menuPhotoFor } from "../src/menu-photos";
import { localFoodAssets } from "../src/local-food-assets";
import { localFoodPhotoMetadata } from "../src/local-food-photo-metadata";
import { localPhotoKeyFor } from "../src/local-photo-key";
import AllergenIcons from "./AllergenIcons";

const purple = "#6821B7";
const vivid = "#8B20DB";
const ink = "#241936";
const muted = "#696076";
const pale = "#F6F0FD";
const border = "#E5DDED";
const good = "#31745C";

const isTacoBell = (restaurant) =>
  (restaurant?.slug || restaurant?.id || "").startsWith("taco-bell-");

export { isTacoBell };

// No photo should be displayed as though it depicts this item unless the
// URL has been positively matched to its own menu name and source.
function FoodPhoto({ dish, restaurant, wide = false }) {
  const [failed, setFailed] = useState(false);
  const photoKey = localPhotoKeyFor(dish);
  const localAsset = localFoodAssets[photoKey];
  const localMetadata = localFoodPhotoMetadata[photoKey];
  const photo = localMetadata
    ? { ...localMetadata, exact: !localMetadata.generated }
    : menuPhotoFor(dish, restaurant);
  const valid = Boolean(localAsset || photo?.exact === true) && !failed;
  return (
    <View style={[look.photo, wide && look.photoWide]}>
      {valid ? (
        <Image
          source={localAsset || { uri: photo.url }}
          style={look.photoFill}
          contentFit="contain"
          accessibilityLabel={localMetadata?.alt || photo.alt || dish.name}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={look.photoMissing}>
          <Text style={look.missingSymbol}>✦</Text>
          <Text style={look.missingLabel}>PHOTO NOT AVAILABLE</Text>
        </View>
      )}
      {valid && localMetadata?.generated && (
        <Text style={look.illustrationLabel}>Menu illustration</Text>
      )}
    </View>
  );
}

function Tab({ label, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[look.tab, active && look.tabActive]}
    >
      <Text style={[look.tabText, active && look.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const choices = ["Keep", "Remove", "Extra"];
function Customizer({ dish, restaurant, onClose, navigate }) {
  const [changes, setChanges] = useState({});
  const ingredients = useMemo(() => {
    const seen = new Set();
    return (dish?.ingredients || [])
      .filter((value) => typeof value === "string" && value.trim().length < 52)
      .map((value) => value.trim())
      .filter((value) => {
        const key = value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 18);
  }, [dish]);
  const changed = Object.entries(changes).filter(([, choice]) => choice !== "Keep");
  async function shareRequest() {
    const text = [
      `Question about ${dish.name} at ${restaurant.name}`,
      ...changed.map(([ingredient, choice]) =>
        `${choice === "Remove" ? "Without" : "Extra"} ${ingredient}`),
      "Please check the actual recipe, cross-contact risk and whether these changes are possible.",
      "Draft created in Verifed. No order was placed.",
    ].join("\n");
    await Share.share({ message: text });
  }
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View style={look.modalShade}>
        <View style={look.modal}>
          <View style={look.modalHeader}>
            <Text style={look.modalHeading}>Customize your item</Text>
            <Pressable accessibilityLabel="Close customization" onPress={onClose} style={look.close}>
              <Text style={look.closeText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={look.modalScroll}>
            <FoodPhoto dish={dish} restaurant={restaurant} wide />
            <Text style={look.modalName}>{dish.name}</Text>
            <Text style={look.note}>
              Build a request to discuss with staff. Changes are not applied to
              a restaurant order or confirmed to remove allergens.
            </Text>
            <Text style={look.customHeading}>INGREDIENT REQUESTS</Text>
            {ingredients.length ? ingredients.map((ingredient, i) => (
              <View style={look.ingredient} key={`${ingredient}-${i}`}>
                <Text style={look.ingredientText}>{ingredient}</Text>
                <View style={look.choices}>
                  {choices.map((choice) => (
                    <Pressable
                      key={choice}
                      onPress={() => setChanges((prev) => ({ ...prev, [ingredient]: choice }))}
                      accessibilityRole="button"
                      accessibilityState={{ selected: (changes[ingredient] || "Keep") === choice }}
                      style={[look.choice, (changes[ingredient] || "Keep") === choice && look.choiceSelected]}
                    >
                      <Text style={[look.choiceText, (changes[ingredient] || "Keep") === choice && look.choiceTextSelected]}>
                        {choice}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )) : (
              <Text style={look.note}>
                The restaurant has not published a complete ingredient breakdown for
                this item. Check the official menu and ask staff before requesting changes.
              </Text>
            )}
            <View style={look.warning}>
              <Text style={look.warningTitle}>Your dietary needs still need confirmation</Text>
              <Text style={look.note}>
                Removing a listed ingredient does not establish that a finished item
                is allergen-free. Recipes, shared equipment and availability may vary.
              </Text>
            </View>
            <Pressable onPress={shareRequest} style={look.primary}>
              <Text style={look.primaryText}>Share request for staff</Text>
            </Pressable>
            <Pressable onPress={() => { onClose(); navigate(`dish/${dish.id}`); }} style={look.secondary}>
              <Text style={look.secondaryText}>Review allergens and source</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ItemCard({ dish, restaurant, profile, navigate, onCustomize, favorites }) {
  const [busy, setBusy] = useState(false);
  const status = dietaryMenuStatus(dish, profile);
  const saved = (favorites || []).includes(dish.id);
  const statusLabel = status.level === "conflict"
    ? "DIETARY FLAG"
    : status.level === "match"
      ? "REPORTED MATCH"
      : status.level === "unknown" ? "CHECK DETAILS" : "REVIEW INGREDIENTS";
  const noLiveSave = false;
  async function save() {
    if (busy || noLiveSave) return;
    setBusy(true);
    try { await api.toggleFavorite(dish.id); }
    catch { /* Existing device/cloud data rules can prevent writes; browsing remains usable. */ }
    finally { setBusy(false); }
  }
  return (
    <View style={look.itemCard}>
      <Pressable onPress={() => navigate(`dish/${dish.id}`)} accessibilityRole="button" accessibilityLabel={`View ${dish.name}`}>
        <FoodPhoto dish={dish} restaurant={restaurant} />
        <Text style={look.itemTitle} numberOfLines={3}>{dish.name}</Text>
      </Pressable>
      <View style={look.fitRow}>
        <Text style={[look.fit, status.level === "conflict" && look.fitConflict, status.level === "match" && look.fitMatch]}>
          {statusLabel}
        </Text>
        <Pressable accessibilityLabel={saved ? "Unsave item" : "Save item"} disabled={busy} onPress={save}>
          <Text style={[look.heart, saved && look.heartSaved]}>{saved ? "♥" : "♡"}</Text>
        </Pressable>
      </View>
      <AllergenIcons dish={dish} showEmpty showUnknown />
      <Pressable onPress={() => onCustomize(dish)} accessibilityRole="button" style={look.customize}>
        <Text style={look.customizeText}>CUSTOMIZE</Text>
      </Pressable>
    </View>
  );
}

export default function TacoBellMenu({ restaurant, dishes, profile, favorites, navigate }) {
  const [mode, setMode] = useState("full");
  const [category, setCategory] = useState("All");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState(null);
  const requirements = [...(profile?.allergies || []), ...(profile?.restrictions || [])];
  const categories = useMemo(() => ["All", ...new Set(dishes.map((dish) => dish.category || "Menu"))], [dishes]);
  const query = term.trim().toLowerCase();
  const visible = dishes.filter((dish) => {
    if (category !== "All" && dish.category !== category) return false;
    if (query && ![dish.name, dish.description, dish.category].some((x) => String(x || "").toLowerCase().includes(query))) return false;
    if (mode === "diet" && requirements.length) return dietaryMenuStatus(dish, profile).level !== "conflict";
    return true;
  });
  const groups = groupMenu(visible);
  return (
    <View style={look.page}>
      <View style={look.brandHead}>
        <View style={look.brandBar}>
          <Text style={look.brandTitle}>TACO BELL</Text>
          <Text style={look.brandMark}>◈</Text>
        </View>
        <Text style={look.headSub}>MENU  /  VERIFED DIETARY VIEW</Text>
        <Text style={look.location}>⌖  {restaurant.name} · {restaurant.location}</Text>
      </View>

      <View style={look.mainBody}>
        <View style={look.promo}>
          <Text style={look.promoEyebrow}>MAKE YOUR MENU YOURS</Text>
          <Text style={look.promoHeadline}>Find your next favorite.</Text>
          <Text style={look.promoCopy}>
            Browse Taco Bell products with dietary flags, save what you like, and
            draft customization requests before asking restaurant staff.
          </Text>
          <Text style={look.notOfficial}>Verifed is independent of Taco Bell. Ordering is not connected.</Text>
        </View>
        <View style={look.modeRow}>
          <Tab label="FULL MENU" active={mode === "full"} onPress={() => setMode("full")} />
          <Tab label="FOR MY DIET" active={mode === "diet"} onPress={() => setMode("diet")} />
        </View>
        <Pressable onPress={() => navigate(`edit-profile?returnTo=${encodeURIComponent(`restaurant/${restaurant.id}`)}`)} style={look.profile}>
          <Text style={look.profileText} numberOfLines={2}>
            {requirements.length ? `Dietary preferences: ${requirements.join(" · ")}` : "Add dietary preferences to find relevant items"}
          </Text>
          <Text style={look.profileEdit}>EDIT ›</Text>
        </Pressable>
        <View style={look.searchWrap}>
          <Text style={look.searchIcon}>⌕</Text>
          <TextInput
            style={look.search}
            placeholder="Search the menu"
            placeholderTextColor="#857C8D"
            value={term}
            onChangeText={setTerm}
            autoCorrect={false}
            accessibilityLabel="Search Taco Bell menu"
          />
        </View>
        <Text style={look.categoryHeading}>EXPLORE CATEGORIES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={look.categoryScroll} contentContainerStyle={look.categoryTrack}>
          {categories.map((value) => (
            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === category }}
              onPress={() => setCategory(value)} style={[look.categoryPill, value === category && look.categoryPillActive]}>
              <Text style={[look.categoryText, value === category && look.categoryTextActive]}>{value.replace(/ And /g," & ")}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {mode === "diet" && !requirements.length && (
          <View style={look.warning}>
            <Text style={look.warningTitle}>Add dietary needs for personalized filtering.</Text>
            <Text style={look.note}>Until then, the full menu is shown. No item is certified allergen-free.</Text>
          </View>
        )}
        <Text style={look.count}>{visible.length} menu items · Selection and prices may vary by location.</Text>
        {groups.map((group) => (
          <View key={group.category} style={look.group}>
            <View style={look.groupTitleRow}>
              <Text style={look.groupTitle}>{group.category}</Text>
              <Text style={look.groupCount}>{group.dishes.length}</Text>
            </View>
            <View style={look.grid}>
              {group.dishes.map((dish) => (
                <View key={dish.id} style={look.cell}>
                  <ItemCard dish={dish} restaurant={restaurant} profile={profile} favorites={favorites}
                    navigate={navigate} onCustomize={setSelected} />
                </View>
              ))}
            </View>
          </View>
        ))}
        {!visible.length && (
          <View style={look.warning}>
            <Text style={look.warningTitle}>No products found for this selection.</Text>
            <Pressable onPress={() => { setTerm(""); setCategory("All"); setMode("full"); }}>
              <Text style={look.secondaryText}>Show the full menu</Text>
            </Pressable>
          </View>
        )}
        <Text style={look.disclaimer}>
          Product photos are used only when they match the named menu item.
          Missing photos are not replaced with an unrelated restaurant photo.
          Ingredient information is incomplete for some items. Always confirm
          ingredients, preparation and cross-contact with restaurant staff.
        </Text>
        <Pressable onPress={() => Linking.openURL(restaurant.menuUrl || "https://www.tacobell.com/food")} style={look.sourceButton}>
          <Text style={look.sourceText}>VIEW OFFICIAL TACO BELL MENU ↗</Text>
        </Pressable>
        <Pressable onPress={() => restaurant.allergenUrl && Linking.openURL(restaurant.allergenUrl)}
          style={look.sourceButton} disabled={!restaurant.allergenUrl}>
          <Text style={look.sourceText}>TACO BELL ALLERGEN INFORMATION ↗</Text>
        </Pressable>
      </View>
      {!!selected && (
        <Customizer key={selected.id} dish={selected} restaurant={restaurant}
          onClose={() => setSelected(null)} navigate={navigate} />
      )}
    </View>
  );
}

const look = StyleSheet.create({
  page: { marginHorizontal: -3, backgroundColor: "#FFFFFF", paddingBottom: 16 },
  brandHead: { backgroundColor: purple, paddingHorizontal: 16, paddingTop: 21, paddingBottom: 19, gap: 8 },
  brandBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandTitle: { color: "#FFFFFF", fontSize: 29, fontWeight: "900", letterSpacing: 0.2 },
  brandMark: { color: "#FFFFFF", fontSize: 29 },
  headSub: { color: "#EAD8FF", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  location: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  mainBody: { paddingHorizontal: 12, gap: 17, paddingTop: 17 },
  promo: { padding: 18, borderRadius: 18, backgroundColor: "#F3EAFB", gap: 7 },
  promoEyebrow: { color: purple, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  promoHeadline: { color: ink, fontWeight: "900", fontSize: 27, lineHeight: 32 },
  promoCopy: { color: ink, fontSize: 12, lineHeight: 19 },
  notOfficial: { color: muted, fontSize: 10, lineHeight: 15 },
  modeRow: { flexDirection: "row", gap: 9 },
  tab: { flex: 1, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 7, alignItems: "center", borderColor: purple, borderWidth: 1 },
  tabActive: { backgroundColor: purple },
  tabText: { color: purple, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  tabTextActive: { color: "#FFFFFF" },
  profile: { backgroundColor: pale, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  profileText: { color: ink, fontSize: 11, flex: 1 },
  profileEdit: { color: purple, fontSize: 11, fontWeight: "900" },
  searchWrap: { height: 47, borderColor: border, borderWidth: 1, borderRadius: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 7 },
  searchIcon: { color: purple, fontSize: 26, lineHeight: 31 },
  search: { flex: 1, fontSize: 14, color: ink, paddingVertical: 0 },
  categoryHeading: { color: ink, fontWeight: "900", fontSize: 13, letterSpacing: 1 },
  categoryScroll: { marginHorizontal: -12 },
  categoryTrack: { paddingHorizontal: 12, gap: 9 },
  categoryPill: { minHeight: 43, justifyContent: "center", borderRadius: 23, backgroundColor: "#F3F1F5", paddingHorizontal: 17, borderWidth: 1, borderColor: "#EDE7F1" },
  categoryPillActive: { backgroundColor: purple, borderColor: purple },
  categoryText: { fontSize: 12, fontWeight: "700", color: ink },
  categoryTextActive: { color: "#FFFFFF" },
  count: { color: muted, fontSize: 10 },
  group: { gap: 13 },
  groupTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 2, borderColor: purple, paddingBottom: 9 },
  groupTitle: { fontSize: 20, color: ink, fontWeight: "900", flex: 1 },
  groupCount: { color: purple, fontWeight: "800", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "stretch" },
  cell: { width: "48.2%" },
  itemCard: { backgroundColor: "#FFFFFF", borderRadius: 13, borderWidth: 1, borderColor: border, padding: 9, gap: 9, justifyContent: "space-between" },
  // Preserve the complete official item photo even for tall or wide products.
  photo: { height: 150, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderRadius: 11, overflow: "hidden", padding: 5 },
  photoWide: { height: 250, width: "100%", padding: 10 },
  photoFill: { width: "100%", height: "100%" },
  illustrationLabel: { position: "absolute", bottom: 3, right: 6, color: muted, fontSize: 8, backgroundColor: "#FFFFFFE8", paddingHorizontal: 4, borderRadius: 3 },
  photoMissing: { alignItems: "center", justifyContent: "center", padding: 9, gap: 3 },
  missingSymbol: { color: "#D2C3E2", fontSize: 28 },
  missingLabel: { color: "#9B91A6", fontSize: 8, fontWeight: "700", textAlign: "center" },
  itemTitle: { fontSize: 12, lineHeight: 17, color: ink, fontWeight: "800", marginTop: 10, minHeight: 34 },
  fitRow: { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "space-between" },
  fit: { fontSize: 8, fontWeight: "800", color: muted, flex: 1 },
  fitMatch: { color: good },
  fitConflict: { color: "#B94339" },
  heart: { color: purple, fontSize: 23 },
  heartSaved: { color: "#AD2F69" },
  customize: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: purple, borderRadius: 4, minHeight: 37, alignItems: "center", justifyContent: "center" },
  customizeText: { color: purple, fontSize: 10, letterSpacing: 0.5, fontWeight: "900" },
  warning: { backgroundColor: "#FFF2E7", borderRadius: 10, padding: 13, gap: 4 },
  warningTitle: { fontWeight: "800", color: ink, fontSize: 12 },
  note: { fontSize: 12, lineHeight: 18, color: muted },
  disclaimer: { color: muted, fontSize: 11, lineHeight: 18 },
  sourceButton: { borderRadius: 7, borderWidth: 1, borderColor: purple, minHeight: 43, alignItems: "center", justifyContent: "center" },
  sourceText: { color: purple, fontWeight: "800", letterSpacing: 0.5, fontSize: 10 },
  modalShade: { flex: 1, backgroundColor: "#0009", justifyContent: "flex-end" },
  modal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 23, borderTopRightRadius: 23, maxHeight: "92%", paddingTop: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderColor: border },
  modalHeading: { fontSize: 17, color: ink, fontWeight: "900" },
  close: { padding: 7, minWidth: 38, alignItems: "center" },
  closeText: { fontSize: 19, color: ink },
  modalScroll: { padding: 19, gap: 14, paddingBottom: 45 },
  modalName: { color: ink, fontSize: 21, fontWeight: "900" },
  customHeading: { color: purple, fontSize: 11, letterSpacing: 1, fontWeight: "900" },
  ingredient: { borderTopColor: border, borderTopWidth: 1, paddingTop: 11, gap: 8 },
  ingredientText: { fontSize: 13, fontWeight: "700", color: ink },
  choices: { flexDirection: "row", gap: 8 },
  choice: { flex: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: border, minHeight: 35 },
  choiceSelected: { backgroundColor: pale, borderColor: purple },
  choiceText: { color: ink, fontWeight: "700", fontSize: 11 },
  choiceTextSelected: { color: purple },
  primary: { backgroundColor: vivid, minHeight: 46, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "white", fontWeight: "900", fontSize: 13 },
  secondary: { borderColor: purple, borderWidth: 1, minHeight: 46, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: purple, fontWeight: "800", fontSize: 13 },
});
