import { Text, TextInput } from "./Typography";
import React, { useMemo, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { Image } from "./MenuImage";
import { api } from "../src/api";
import { dietaryMenuStatus, groupMenu } from "../src/menu-filter";
import { menuPhotoFor } from "../src/menu-photos";
import { localFoodAssets } from "../src/local-food-assets";
import { localFoodPhotoMetadata } from "../src/local-food-photo-metadata";
import { localPhotoKeyFor } from "../src/local-photo-key";
import AllergenIcons from "./AllergenIcons";
import { Icon } from "./UI";
import { BrandHeading, BrandLogo, BrandProvider } from "./BrandIdentity";

const purple = "#501098";
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
          <Icon name="image-outline" size={28} color={muted} />
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
      aria-selected={active}
      onPress={onPress}
      style={[look.tab, active && look.tabActive]}
    >
      <BrandHeading style={[look.tabText, active && look.tabTextActive]}>{label}</BrandHeading>
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
            <Pressable accessibilityRole="button" accessibilityLabel="Close customization" onPress={onClose} style={look.close}>
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
                      aria-pressed={(changes[ingredient] || "Keep") === choice}
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
            <Pressable accessibilityRole="button" onPress={shareRequest} style={look.primary}>
              <Text style={look.primaryText}>Share request for staff</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => { onClose(); navigate(`dish/${dish.id}`); }} style={look.secondary}>
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
  async function save() {
    if (busy) return;
    setBusy(true);
    try { await api.toggleFavorite(dish.id); }
    catch { /* Existing device/cloud data rules can prevent writes; browsing remains usable. */ }
    finally { setBusy(false); }
  }
  return (
    <View style={look.itemCard}>
      <Pressable onPress={() => navigate(`dish/${dish.id}`)} accessibilityRole="button" accessibilityLabel={`View ${dish.name}`}>
        <FoodPhoto dish={dish} restaurant={restaurant} />
        <BrandHeading style={look.itemTitle} numberOfLines={3}>{dish.name}</BrandHeading>
      </Pressable>
      <View style={look.fitRow}>
        <Text style={[look.fit, status.level === "conflict" && look.fitConflict, status.level === "match" && look.fitMatch]}>
          {statusLabel}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? "Unsave item" : "Save item"} style={look.saveTarget} disabled={busy} onPress={save}>
          <Icon name={saved ? "heart" : "heart-outline"} size={23} color={saved ? "#AD2F69" : purple} />
        </Pressable>
      </View>
      <AllergenIcons dish={dish} showEmpty showUnknown />
      <Pressable onPress={() => navigate(`dish/${dish.id}`)} accessibilityRole="button"
        accessibilityLabel={`View ingredients for ${dish.name}`} style={look.viewItem}>
        <Text style={look.viewItemText}>VIEW INGREDIENTS</Text>
      </Pressable>
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
  const [bodyWidth, setBodyWidth] = useState(0);
  const columns = bodyWidth >= 620 ? 3 : bodyWidth > 0 && bodyWidth < 320 ? 1 : 2;
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
    <BrandProvider brand="taco-bell">
    <View style={look.page}>
      <View style={look.brandHead}>
        <View style={look.brandBar}>
          <View style={look.logoLockup}>
            <BrandLogo brand="taco-bell" size={53} />
            <Text style={look.brandTitle}>TACO{"\n"}BELL</Text>
          </View>
          <View style={look.verifedBadge}><Text style={look.verifedBadgeText}>VERIFED MENU</Text></View>
        </View>
        <Text style={look.location}>⌖  {restaurant.name} · {restaurant.location}</Text>
      </View>

      <View style={look.mainBody} onLayout={(event) => setBodyWidth(event.nativeEvent.layout.width)}>
        <View style={look.modeRow}>
          <Tab label="FULL MENU" active={mode === "full"} onPress={() => setMode("full")} />
          <Tab label="FOR MY DIET" active={mode === "diet"} onPress={() => setMode("diet")} />
        </View>
        <Pressable accessibilityRole="button" onPress={() => navigate(`edit-profile?returnTo=${encodeURIComponent(`restaurant/${restaurant.id}`)}`)} style={look.profile}>
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
        <ScrollView horizontal accessibilityLabel="EXPLORE CATEGORIES" showsHorizontalScrollIndicator={false} style={look.categoryScroll} contentContainerStyle={look.categoryTrack}>
          {categories.map((value) => (
            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === category }} aria-pressed={value === category}
              onPress={() => setCategory(value)} style={[look.categoryPill, value === category && look.categoryPillActive]}>
              <BrandHeading style={[look.categoryText, value === category && look.categoryTextActive]}>{value.replace(/ And /g," & ").toUpperCase()}</BrandHeading>
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
              <BrandHeading accessibilityRole="header" style={look.groupTitle}>{group.category.toUpperCase()}</BrandHeading>
              <Text style={look.groupCount}>{group.dishes.length}</Text>
            </View>
            <View style={look.grid}>
              {group.dishes.map((dish) => (
                <View key={dish.id} style={[look.cell, { width: `${100 / columns - 2}%` }]}>
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
        <Text style={look.disclaimer}>Independent Verifed menu. Taco Bell owns its trademarks. Customizations are drafts for discussion with staff; no order is placed.</Text>
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
    </BrandProvider>
  );
}

const look = StyleSheet.create({
  page: { marginHorizontal: -18, backgroundColor: "#F2F2F2", paddingBottom: 16 },
  brandHead: { backgroundColor: "#FFFFFF", paddingHorizontal: 18, paddingTop: 16, paddingBottom: 15, gap: 15, borderBottomWidth: 1, borderBottomColor: "#DDDDDD" },
  brandBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoLockup: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandTitle: { color: "#161616", fontSize: 26, lineHeight: 24, fontWeight: "900", letterSpacing: -1 },
  verifedBadge: { borderColor: purple, borderWidth: 1, padding: 8 },
  verifedBadgeText: { color: purple, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  location: { color: "#444444", fontSize: 11, fontWeight: "600" },
  mainBody: { paddingHorizontal: 12, gap: 10, paddingTop: 10 },
  modeRow: { flexDirection: "row", backgroundColor: "#FFFFFF" },
  tab: { flex: 1, paddingVertical: 10, paddingHorizontal: 7, alignItems: "center", borderBottomWidth: 4, borderColor: "transparent" },
  tabActive: { borderColor: purple },
  tabText: { color: "#242424", fontSize: 17, letterSpacing: 0.3 },
  tabTextActive: { color: purple },
  profile: { backgroundColor: "#FFFFFF", padding: 9, flexDirection: "row", alignItems: "center", gap: 8 },
  profileText: { color: ink, fontSize: 11, flex: 1 },
  profileEdit: { color: purple, fontSize: 11, fontWeight: "900" },
  searchWrap: { height: 47, borderColor: "#B9B9B9", borderWidth: 1, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 7 },
  searchIcon: { color: purple, fontSize: 26, lineHeight: 31 },
  search: { flex: 1, fontSize: 14, color: ink, paddingVertical: 0 },
  categoryScroll: { marginHorizontal: -12 },
  categoryTrack: { paddingHorizontal: 12, backgroundColor: "#FFFFFF", gap: 8 },
  categoryPill: { minHeight: 50, justifyContent: "center", paddingHorizontal: 12, borderBottomWidth: 4, borderColor: "transparent" },
  categoryPillActive: { borderColor: purple },
  categoryText: { fontSize: 17, color: "#111111" },
  categoryTextActive: { color: purple },
  count: { color: muted, fontSize: 11 },
  group: { gap: 13 },
  groupTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4, paddingBottom: 2 },
  groupTitle: { fontSize: 25, color: "#111111", flex: 1 },
  groupCount: { color: purple, fontWeight: "800", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "stretch" },
  cell: { alignItems: "stretch" },
  itemCard: { flex: 1, backgroundColor: "#FFFFFF", padding: 10, gap: 9, justifyContent: "space-between" },
  // Preserve the complete official item photo even for tall or wide products.
  photo: { aspectRatio: 1, width: "100%", backgroundColor: "#F7F7F7", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 2 },
  photoWide: { height: 250, width: "100%", padding: 10 },
  photoFill: { width: "100%", height: "100%" },
  illustrationLabel: { position: "absolute", bottom: 3, right: 6, color: muted, fontSize: 11, backgroundColor: "#FFFFFFE8", paddingHorizontal: 4, borderRadius: 3 },
  photoMissing: { alignItems: "center", justifyContent: "center", padding: 9, gap: 3 },
  missingLabel: { color: muted, fontSize: 11, fontWeight: "700", textAlign: "center" },
  itemTitle: { fontSize: 18, lineHeight: 24, color: "#111111", marginTop: 9, minHeight: 48 },
  fitRow: { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "space-between" },
  fit: { fontSize: 11, fontWeight: "800", color: muted, flex: 1 },
  fitMatch: { color: good },
  fitConflict: { color: "#B94339" },
  saveTarget: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  viewItem: { backgroundColor: purple, minHeight: 44, paddingHorizontal: 3, alignItems: "center", justifyContent: "center" },
  viewItemText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", textAlign: "center" },
  customize: { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: purple, minHeight: 44, alignItems: "center", justifyContent: "center" },
  customizeText: { color: purple, fontSize: 12, letterSpacing: 0.5, fontWeight: "900" },
  warning: { backgroundColor: "#FFF2E7", borderRadius: 10, padding: 13, gap: 4 },
  warningTitle: { fontWeight: "800", color: ink, fontSize: 12 },
  note: { fontSize: 12, lineHeight: 18, color: muted },
  disclaimer: { color: muted, fontSize: 11, lineHeight: 18 },
  sourceButton: { borderRadius: 7, borderWidth: 1, borderColor: purple, minHeight: 44, alignItems: "center", justifyContent: "center" },
  sourceText: { color: purple, fontWeight: "800", letterSpacing: 0.5, fontSize: 11 },
  modalShade: { flex: 1, backgroundColor: "#0009", justifyContent: "flex-end" },
  modal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 23, borderTopRightRadius: 23, maxHeight: "92%", paddingTop: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderColor: border },
  modalHeading: { fontSize: 17, color: ink, fontWeight: "900" },
  close: { padding: 7, minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" },
  closeText: { fontSize: 19, color: ink },
  modalScroll: { padding: 19, gap: 14, paddingBottom: 45 },
  modalName: { color: ink, fontSize: 21, fontWeight: "900" },
  customHeading: { color: purple, fontSize: 11, letterSpacing: 1, fontWeight: "900" },
  ingredient: { borderTopColor: border, borderTopWidth: 1, paddingTop: 11, gap: 8 },
  ingredientText: { fontSize: 13, fontWeight: "700", color: ink },
  choices: { flexDirection: "row", gap: 8 },
  choice: { flex: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: border, minHeight: 44, paddingVertical: 8 },
  choiceSelected: { backgroundColor: pale, borderColor: purple },
  choiceText: { color: ink, fontWeight: "700", fontSize: 11 },
  choiceTextSelected: { color: purple },
  primary: { backgroundColor: vivid, minHeight: 46, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "white", fontWeight: "900", fontSize: 13 },
  secondary: { borderColor: purple, borderWidth: 1, minHeight: 46, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: purple, fontWeight: "800", fontSize: 13 },
});
