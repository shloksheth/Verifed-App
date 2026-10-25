import { type } from "../src/design-tokens";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Image } from "./MenuImage";
import { Text } from "./Typography";
import {
  Button,
  Empty,
  ErrorText,
  Field,
  FormScrollContext,
  Icon,
  Sheet,
  useTask,
} from "./UI";
import { colors, s } from "../styles";
import { scannedItems, updateScannedItem } from "../src/menu-scan";
import { scanLibrary as library } from "../src/device-scans";
import { menuAfterPhoto } from "../src/fixed-spanish-menu";
import {
  hasOriginalPage,
  menuCategories,
  visibleScanItems,
} from "../src/scan-view";
import {
  CaptureMenu,
  IllustratedDishes,
  ScannedDish,
  ScanTabs,
} from "./ScanDesign";

function OriginalMenuPage({ menu }) {
  const sayola = menu.id === "sayola-dinner-fixed";
  return (
    <View
      style={[
        look.originalPage,
        { aspectRatio: sayola ? 640 / 1042 : 1190 / 1685 },
      ]}
    >
      <Image
        source={
          sayola
            ? require("../assets/scan/sayola-menu.webp")
            : require("../assets/scan/2cero7-spanish-menu.webp")
        }
        contentFit="contain"
        style={[StyleSheet.absoluteFillObject, look.photo]}
        accessibilityLabel={
          sayola
            ? "Original Sayola dinner menu, 23 hot and cold tapas"
            : "Original 2cero7 Spanish menu"
        }
      />
    </View>
  );
}

export default function MenuScanner({
  state,
  navigate,
  owner,
  draft,
  setDraft,
}) {
  const task = useTask();
  const scroll = useContext(FormScrollContext);
  const mounted = useRef(true);
  const [saved, setSaved] = useState([]);
  const [libraryReady, setLibraryReady] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [language, setLanguage] = useState("en");
  const [view, setView] = useState("full");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [remove, setRemove] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const menu = draft?.menu;
  const photo = draft?.photo;
  const assessed = scannedItems(menu, {
    language,
    query,
    forDiet: view === "diet",
    profile: state.profile,
  });
  const items = visibleScanItems(assessed, category);
  const categories = menuCategories(menu, language);
  const needs = [...state.profile.allergies, ...state.profile.restrictions];

  useEffect(() => {
    mounted.current = true;
    library
      .read(owner)
      .then((records) => {
        if (mounted.current) {
          setSaved(records);
          setLibraryReady(true);
        }
      })
      .catch((error) => {
        if (mounted.current) {
          setLibraryReady(true);
          setLibraryError(error.message || "Saved menus could not be opened.");
        }
      });
    return () => {
      mounted.current = false;
    };
  }, [owner]);

  function choosePhoto(camera) {
    // On web, keep the picker launch in the original tap, before any await.
    task.run(async () => {
      if (camera && Platform.OS !== "web") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted)
          throw new Error(
            "Camera permission is off. Choose a photo instead, or enable camera access in device settings.",
          );
      }
      const result = await (
        camera
          ? ImagePicker.launchCameraAsync
          : ImagePicker.launchImageLibraryAsync
      )({ mediaTypes: ["images"], allowsEditing: false, quality: 1 });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.width || !asset.height)
        throw new Error(
          "This image could not be read. Choose a clear photo of one menu page.",
        );
      const scale = Math.min(1, 2000 / Math.max(asset.width, asset.height));
      const prepared = await manipulateAsync(
        asset.uri,
        [{ resize: { width: Math.round(asset.width * scale) } }],
        { compress: 0.85, format: SaveFormat.JPEG },
      );
      if (mounted.current) {
        setQuery("");
        setCategory("all");
        setLanguage("en");
        setView("full");
        setSelected(null);
        setEditing(null);
        setShowPhoto(false);
        setShowOriginal(false);
        setDraft(menuAfterPhoto(prepared));
        scroll?.current?.scrollTo({ y: 0, animated: false });
      }
    });
  }

  function resetMenu() {
    setDraft(null);
    setQuery("");
    setCategory("all");
    setSelected(null);
    setEditing(null);
    setShowPhoto(false);
    setShowOriginal(false);
    scroll?.current?.scrollTo({ y: 0, animated: false });
  }

  function openMenu(value) {
    setQuery("");
    setCategory("all");
    setLanguage("en");
    setView("full");
    setSelected(null);
    setEditing(null);
    setShowPhoto(false);
    setShowOriginal(false);
    setDraft({ menu: JSON.parse(JSON.stringify(value)), photo: null });
    scroll?.current?.scrollTo({ y: 0, animated: false });
  }

  function saveMenu() {
    task.run(async () => {
      const records = await library.save(owner, menu);
      if (mounted.current) setSaved(records);
    });
  }

  return (
    <>
      {!menu && (
        <>
          <Text accessibilityRole="header" style={look.pageTitle}>
            Scan a menu
          </Text>
          <CaptureMenu
            busy={task.busy}
            onCamera={() => choosePhoto(true)}
            onLibrary={() => choosePhoto(false)}
          />
          <View style={look.howItWorks}>
            <Icon name="language-outline" color={colors.orangeDark} size={25} />
            <View style={s.flex}>
              <Text style={look.subheading}>Read and save menus</Text>
              <Text style={look.body}>
                Switch languages, check ingredients, then save the menu for
                later.
              </Text>
            </View>
          </View>
        </>
      )}
      {!!photo && showPhoto && (
        <Sheet title="Your menu photo" onClose={() => setShowPhoto(false)}>
          <View style={look.photoFrame}>
            <Image
              source={{ uri: photo.uri }}
              contentFit="contain"
              style={look.photo}
              accessibilityLabel="Your selected menu page"
            />
          </View>
          <View style={s.row}>
            <Button
              variant="secondary"
              icon="refresh-outline"
              disabled={task.busy}
              style={s.flex}
              onPress={() =>
                task.run(async () => {
                  const rotated = await manipulateAsync(
                    photo.uri,
                    [{ rotate: 90 }],
                    { compress: 0.9, format: SaveFormat.JPEG },
                  );
                  if (mounted.current) setDraft({ ...draft, photo: rotated });
                })
              }
            >
              Rotate
            </Button>
            <Button
              variant="secondary"
              disabled={task.busy}
              style={s.flex}
              onPress={() => choosePhoto(false)}
            >
              Replace photo
            </Button>
          </View>
          <ErrorText error={task.error} />
        </Sheet>
      )}

      {!!menu && (
        <>
          <View style={look.menuPaper}>
            <View style={s.between}>
              <Text accessibilityRole="header" style={look.restaurant}>
                {menu.title}
              </Text>
              <Pressable
                onPress={resetMenu}
                accessibilityRole="button"
                style={look.smallAction}
              >
                <Icon name="scan-outline" size={18} color={colors.ink} />
                <Text style={look.actionText}>New menu</Text>
              </Pressable>
            </View>
            <Text style={look.menuSubtitle}>{menu.sourceLabel}</Text>
            <View style={look.menuRule} />
            <View style={s.between}>
              <Text style={look.body}>
                {menu.items.length} dishes · {categories.length} sections
              </Text>
              <Text style={look.body}>
                {menu.edited
                  ? "Edited by you"
                  : menu.currency === "USD"
                    ? "Prices in USD"
                    : ""}
              </Text>
            </View>
            <View style={look.sourceActions}>
              {hasOriginalPage(menu) && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowOriginal(true)}
                  style={look.smallAction}
                >
                  <Icon
                    name="document-text-outline"
                    size={17}
                    color={colors.orangeDark}
                  />
                  <Text style={look.sourceLink}>Original page</Text>
                </Pressable>
              )}
              {!!photo && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowPhoto(true)}
                  style={look.smallAction}
                >
                  <Icon
                    name="image-outline"
                    size={17}
                    color={colors.orangeDark}
                  />
                  <Text style={look.sourceLink}>Your photo</Text>
                </Pressable>
              )}
            </View>
          </View>
          <ScanTabs
            label="Menu language"
            options={[
              { value: "en", label: "English" },
              {
                value: "es",
                label: menu.originalLanguageLabel || "Original · Español",
              },
            ]}
            value={language}
            onChange={setLanguage}
          />
          {!!menu.priceSummaryEn && (
            <View style={look.priceSummary}>
              <Text style={s.eyebrow}>
                {language === "es" ? menu.headingEs : menu.headingEn}
              </Text>
              {menu.offer ? (
                <>
                  <View style={s.row}>
                    <Text style={look.oldPrice}>{menu.offer.previous}</Text>
                    <Text style={look.offerPrice}>{menu.offer.current}</Text>
                    <Text style={[s.small, s.flex]}>
                      {language === "es"
                        ? "Con la promoción"
                        : "With the promotion"}
                    </Text>
                  </View>
                  <Text style={s.small}>
                    {menu.offer.single}{" "}
                    {language === "es"
                      ? "escogiendo plato único · IVA incluido"
                      : "for a single dish · VAT included"}
                  </Text>
                </>
              ) : (
                <Text style={s.h3}>
                  {language === "es"
                    ? menu.priceSummaryEs
                    : menu.priceSummaryEn}
                </Text>
              )}
            </View>
          )}

          <View style={look.controls}>
            <ScanTabs
              label="Dietary view"
              options={[
                { value: "full", label: "Full menu" },
                { value: "diet", label: "For my diet" },
              ]}
              value={view}
              onChange={setView}
            />
            <Pressable
              onPress={() => navigate("edit-profile?returnTo=scan")}
              accessibilityRole="button"
              style={look.profile}
            >
              <Icon name="leaf-outline" color={colors.green} size={21} />
              <View style={s.flex}>
                <Text style={look.profileHeading}>Your dietary needs</Text>
                <Text style={look.profileText}>
                  {needs.length
                    ? needs.join(" · ")
                    : "Add allergies or dietary restrictions"}
                </Text>
              </View>
              <Text style={look.profileEdit}>Edit</Text>
            </Pressable>
            <Field
              label="Search this menu"
              value={query}
              onChangeText={setQuery}
              placeholder="Dish or ingredient…"
              clearButtonMode="while-editing"
            />
          </View>
          <ScanTabs
            label="Menu categories"
            options={[{ value: "all", label: "All dishes" }, ...categories]}
            value={category}
            onChange={setCategory}
          />
          {view === "diet" && !needs.length ? (
            <Empty
              title="Choose your dietary needs"
              action="Set my needs"
              onPress={() => navigate("edit-profile?returnTo=scan")}
            >
              Add your preferences to compare the menu text.
            </Empty>
          ) : (
            <>
              <IllustratedDishes
                items={items}
                menu={menu}
                onSelect={setSelected}
              />
              <Text style={look.resultCount}>
                {items.length} {items.length === 1 ? "dish" : "dishes"}
                {query ? ` matching “${query}”` : " in this view"}
              </Text>
              {items.length ? (
                items.map((item, index) => (
                  <View key={item.id}>
                    {(index === 0 ||
                      item.category !== items[index - 1].category) && (
                      <Text accessibilityRole="header" style={look.category}>
                        {item.category}
                      </Text>
                    )}
                    <ScannedDish
                      item={item}
                      needs={needs}
                      onPress={() => setSelected(item)}
                    />
                  </View>
                ))
              ) : (
                <Empty title="No dishes in this view">
                  Try the full menu, another category or another search.
                </Empty>
              )}
            </>
          )}
          <Button
            icon="bookmark-outline"
            busy={task.busy}
            onPress={saveMenu}
            style={{ backgroundColor: colors.orange }}
          >
            {saved.some((record) => record.id === menu.id)
              ? "Update saved menu"
              : "Save this menu"}
          </Button>
          <View style={look.paper}>
            <Text style={look.subheading}>From the printed menu</Text>
            {(language === "es" ? menu.notesEs : menu.notesEn)?.map((note) => (
              <Text key={note} style={look.body}>
                {note}
              </Text>
            ))}
            {!!menu.contact && <Text style={look.body}>{menu.contact}</Text>}
            {!!menu.venue && <Text style={look.body}>{menu.venue}</Text>}
            <Text style={look.body}>
              {language === "es" ? menu.legendEs : menu.legendEn}
            </Text>
            <Text style={look.body}>
              Filters compare written ingredients. Ask the restaurant about
              unlisted ingredients and cross-contact.
            </Text>
          </View>
        </>
      )}
      <ErrorText error={task.error || libraryError} />
      <View style={look.library}>
        <View style={s.between}>
          <Text accessibilityRole="header" style={look.category}>
            My menus
          </Text>
          <Icon name="bookmark-outline" color={colors.ink} />
        </View>
        {!libraryReady ? (
          <Text style={look.body}>Opening saved menus…</Text>
        ) : saved.length ? (
          saved.map((record) => (
            <View key={record.id} style={look.savedRow}>
              <Pressable
                onPress={() => openMenu(record)}
                disabled={task.busy}
                accessibilityRole="button"
                accessibilityLabel={`Open saved menu ${record.title}`}
                style={[s.flex, look.savedOpen]}
              >
                <Icon name="document-text-outline" color={colors.orangeDark} />
                <View style={s.flex}>
                  <Text style={look.subheading}>{record.title}</Text>
                  <Text style={look.body}>
                    {record.items.length} dishes · Saved on this device
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setRemove(record)}
                accessibilityRole="button"
                accessibilityLabel={`Delete saved menu ${record.title}`}
                style={s.iconButton}
              >
                <Icon name="trash-outline" color={colors.muted} />
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={look.body}>
            Your saved menus live here. Start with a photo of the page.
          </Text>
        )}
      </View>
      {showOriginal && hasOriginalPage(menu) && (
        <Sheet
          title="Original menu page"
          onClose={() => setShowOriginal(false)}
        >
          <OriginalMenuPage menu={menu} />
        </Sheet>
      )}
      {!!selected && !editing && (
        <Sheet title={selected.name} onClose={() => setSelected(null)}>
          <Text style={s.eyebrow}>ORIGINAL MENU</Text>
          <Text style={s.h3}>{selected.nameEs}</Text>
          <Text style={s.body}>{selected.descriptionEs}</Text>
          <Text style={s.eyebrow}>ENGLISH</Text>
          <Text style={s.h3}>{selected.nameEn}</Text>
          <Text style={s.body}>{selected.descriptionEn}</Text>
          <Text style={s.body}>{selected.price}</Text>
          <Text style={s.h3}>From the written menu</Text>
          <Text style={s.body}>
            {selected.assessment.clues.join("\n") ||
              "No ingredient flags found in this text. Other ingredients and preparation are not established."}
          </Text>
          <Button
            variant="secondary"
            onPress={() =>
              setEditing({
                ...selected,
                price: menu.items.find((item) => item.id === selected.id).price,
              })
            }
          >
            Correct this item
          </Button>
        </Sheet>
      )}
      {!!editing && (
        <Sheet title="Correct menu text" onClose={() => setEditing(null)}>
          {[
            ["nameEs", "Original dish name"],
            ["nameEn", "English dish name"],
            ["descriptionEs", "Original description"],
            ["descriptionEn", "English description"],
            ["price", "Printed price"],
          ].map(([field, label]) => (
            <Field
              key={field}
              label={label}
              value={editing[field]}
              onChangeText={(value) =>
                setEditing((current) => ({ ...current, [field]: value }))
              }
              multiline={field.startsWith("description")}
            />
          ))}
          <Button
            onPress={() =>
              task.run(() => {
                const corrected = updateScannedItem(menu, editing.id, editing);
                setDraft({ ...draft, menu: corrected });
                setEditing(null);
                setSelected(null);
              })
            }
          >
            Apply corrections
          </Button>
          <ErrorText error={task.error} />
        </Sheet>
      )}
      {!!remove && (
        <Sheet title="Delete saved menu?" onClose={() => setRemove(null)}>
          <Text style={s.body}>Remove {remove.title} from this device?</Text>
          <Button
            variant="danger"
            busy={task.busy}
            onPress={() =>
              task.run(async () => {
                const records = await library.remove(owner, remove.id);
                if (mounted.current) {
                  setSaved(records);
                  setRemove(null);
                }
              })
            }
          >
            Delete menu
          </Button>
        </Sheet>
      )}
    </>
  );
}

const look = StyleSheet.create({
  pageTitle: { ...type.page, color: colors.ink },
  howItWorks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 8,
  },
  subheading: { ...type.card, color: colors.ink },
  body: { ...type.meta, color: colors.muted },
  menuPaper: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    padding: 20,
    gap: 10,
  },
  restaurant: { ...type.page, color: colors.orangeDark, flex: 1 },
  menuSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: colors.muted,
  },
  menuRule: { height: 1, backgroundColor: colors.line, marginVertical: 3 },
  sourceActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 22,
    flexWrap: "wrap",
  },
  smallAction: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: { fontSize: 13, color: colors.ink, fontWeight: "500" },
  sourceLink: {
    fontSize: 13,
    color: colors.orangeDark,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  controls: { gap: 13 },
  profile: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: colors.paleGreen,
    borderRadius: 12,
    padding: 13,
  },
  profileHeading: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.green,
    lineHeight: 20,
  },
  profileText: { fontSize: 12, color: colors.green, lineHeight: 18 },
  profileEdit: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.green,
    paddingVertical: 10,
  },
  resultCount: { fontSize: 12, lineHeight: 18, color: colors.muted },
  category: { ...type.section, color: colors.ink, marginBottom: 12 },
  paper: {
    padding: 18,
    backgroundColor: colors.peach,
    borderRadius: 12,
    gap: 10,
  },
  library: {
    padding: 18,
    backgroundColor: colors.peach,
    borderRadius: 12,
    gap: 4,
    marginTop: 8,
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  savedOpen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    minHeight: 64,
  },
  photoFrame: {
    width: "100%",
    height: 350,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.peach,
  },
  photo: { width: "100%", height: "100%" },
  originalPage: { width: "100%", backgroundColor: "white" },
  priceSummary: {
    padding: 18,
    gap: 6,
    borderRadius: 12,
    backgroundColor: colors.paper,
  },
  oldPrice: {
    color: colors.muted,
    fontSize: 17,
    textDecorationLine: "line-through",
  },
  offerPrice: {
    color: colors.ink,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
  },
});
