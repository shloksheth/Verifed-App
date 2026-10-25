import React, { useEffect, useRef, useState } from "react";
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
  Icon,
  Notice,
  Sheet,
  Tabs,
  Title,
  useTask,
} from "./UI";
import { colors, s } from "../styles";
import {
  scannedItems,
  spanishSample,
  updateScannedItem,
} from "../src/menu-scan";
import { scanLibrary as library } from "../src/device-scans";

function SamplePaper() {
  return (
    <View style={look.paper}>
      <Text style={look.paperName}>MESA VERDE</Text>
      <Text style={look.paperSub}>MENÚ DE EJEMPLO · ESPAÑOL</Text>
      <View style={look.paperRule} />
      {scannedItems(spanishSample(), { language: "es" }).map((item) => (
        <View key={item.id} style={s.stack}>
          <Text style={s.h3}>
            {item.name} · {item.price}
          </Text>
          <Text style={s.small}>{item.description}</Text>
        </View>
      ))}
      <Text style={look.paperSub}>Prepared sample — not a restaurant menu</Text>
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
  const mounted = useRef(true);
  const [saved, setSaved] = useState([]);
  const [libraryReady, setLibraryReady] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [language, setLanguage] = useState("en");
  const [view, setView] = useState("full");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [remove, setRemove] = useState(null);
  const menu = draft?.menu;
  const photo = draft?.photo;
  const items = scannedItems(menu, {
    language,
    query,
    forDiet: view === "diet",
    profile: state.profile,
  });
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
      if (mounted.current) setDraft({ photo: prepared, menu: null });
    });
  }

  function openMenu(value) {
    setQuery("");
    setLanguage("en");
    setView("full");
    setSelected(null);
    setDraft({ menu: JSON.parse(JSON.stringify(value)), photo: null });
  }

  function saveMenu() {
    task.run(async () => {
      const records = await library.save(owner, menu);
      if (mounted.current) setSaved(records);
    });
  }

  return (
    <>
      <Title
        eyebrow="At your table"
        title={menu ? menu.title : "Every menu, a little clearer."}
      >
        {menu
          ? menu.sourceLabel
          : "Photograph a menu, review the page, and explore a Spanish-to-English example."}
      </Title>

      {!menu && !photo && (
        <>
          <View style={look.capture}>
            <View style={look.viewfinder}>
              <Icon name="scan-outline" size={80} color={colors.green} />
              <Icon name="restaurant-outline" size={28} color={colors.green} />
            </View>
            <Text style={s.h2}>Start with one clear page</Text>
            <Text style={[s.body, look.center]}>
              Keep the whole menu in the frame.{"\n"}Good lighting makes small
              print easier to read.
            </Text>
          </View>
          <Button
            icon="camera-outline"
            busy={task.busy}
            onPress={() => choosePhoto(true)}
          >
            Take a photo
          </Button>
          <Button
            variant="secondary"
            icon="images-outline"
            disabled={task.busy}
            onPress={() => choosePhoto(false)}
          >
            Choose a photo
          </Button>
          <Pressable
            onPress={() => openMenu(spanishSample())}
            disabled={task.busy}
            accessibilityRole="button"
            accessibilityLabel="Open prepared Spanish menu example"
            style={look.sampleRow}
          >
            <View style={look.sampleIcon}>
              <Icon name="language-outline" size={28} color={colors.green} />
            </View>
            <View style={s.flex}>
              <Text style={s.h3}>Try a Spanish menu</Text>
              <Text style={s.small}>Prepared example · Español → English</Text>
            </View>
            <Icon name="arrow-forward" color={colors.green} />
          </Pressable>
          <Text style={s.small}>
            Photos stay on this device in this version. Live AI reading needs a
            secure provider connection.
          </Text>
        </>
      )}

      {!!photo && !menu && (
        <>
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
                  if (mounted.current) setDraft({ photo: rotated, menu: null });
                })
              }
            >
              Rotate
            </Button>
            <Button
              variant="secondary"
              disabled={task.busy}
              style={s.flex}
              onPress={() => setDraft(null)}
            >
              Replace photo
            </Button>
          </View>
          <Notice>
            Photo ready. Live AI reading is not connected yet; this photo has
            not been translated or analyzed.
          </Notice>
          <Button disabled icon="sparkles-outline">
            AI connection required
          </Button>
          <Button variant="secondary" onPress={() => openMenu(spanishSample())}>
            Open the prepared Spanish example
          </Button>
        </>
      )}

      {!!menu && (
        <>
          <View style={s.between}>
            <Text style={s.small}>
              {menu.items.length} dishes ·{" "}
              {menu.edited ? "Edited by you" : "Prepared example"}
            </Text>
            <Pressable
              onPress={() => setDraft(null)}
              accessibilityRole="button"
              style={look.smallAction}
            >
              <Text style={s.link}>New menu</Text>
            </Pressable>
          </View>
          <Tabs
            options={[
              { value: "en", label: "English" },
              { value: "es", label: "Original · Español" },
            ]}
            value={language}
            onChange={setLanguage}
          />
          <Tabs
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
            <Icon name="leaf-outline" color={colors.green} />
            <View style={s.flex}>
              <Text style={s.h3}>Your dietary needs</Text>
              <Text style={s.small}>
                {needs.length
                  ? needs.join(" · ")
                  : "Choose allergies or dietary restrictions"}
              </Text>
            </View>
            <Text style={s.link}>Edit</Text>
          </Pressable>
          <Field
            label="Search this menu"
            value={query}
            onChangeText={setQuery}
            placeholder="Dish or ingredient…"
            clearButtonMode="while-editing"
          />
          <Text style={s.small}>
            Diet view removes conflicts found in the written text. Hidden
            ingredients and cross-contact still need a restaurant answer.
          </Text>
          {view === "diet" && !needs.length ? (
            <Empty
              title="Choose your dietary needs"
              action="Set my needs"
              onPress={() => navigate("edit-profile?returnTo=scan")}
            >
              Add your preferences to compare the menu text.
            </Empty>
          ) : items.length ? (
            items.map((item, index) => (
              <View key={item.id}>
                {(index === 0 ||
                  item.category !== items[index - 1].category) && (
                  <Text
                    accessibilityRole="header"
                    style={[s.h2, look.category]}
                  >
                    {item.category}
                  </Text>
                )}
                <Pressable
                  onPress={() => setSelected(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Read ${item.name} ingredients and dietary notes`}
                  style={look.dish}
                >
                  <View style={s.between}>
                    <Text style={[s.h3, s.flex]}>{item.name}</Text>
                    <Text style={s.body}>{item.price}</Text>
                  </View>
                  <Text style={s.body}>{item.description}</Text>
                  {item.needsTranslationReview ? (
                    <Text style={look.conflict}>Translation needs review</Text>
                  ) : item.assessment.conflicts.length ? (
                    <Text style={look.conflict}>
                      Check: {item.assessment.conflicts.join(" · ")}
                    </Text>
                  ) : (
                    <Text style={look.flag}>
                      {needs.length ? "No listed conflict" : "View menu text"}
                    </Text>
                  )}
                </Pressable>
              </View>
            ))
          ) : (
            <Empty title="No dishes in this view">
              Try the full menu or another search.
            </Empty>
          )}
          <Button icon="bookmark-outline" busy={task.busy} onPress={saveMenu}>
            {saved.some((record) => record.id === menu.id)
              ? "Update saved menu"
              : "Save this menu"}
          </Button>
          {menu.sample && <SamplePaper />}
        </>
      )}

      <ErrorText error={task.error || libraryError} />
      <View style={s.section}>
        <Text accessibilityRole="header" style={s.h2}>
          My menus
        </Text>
        {!libraryReady ? (
          <Text style={s.small}>Opening saved menus…</Text>
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
                <Icon name="document-text-outline" color={colors.green} />
                <View style={s.flex}>
                  <Text style={s.h3}>{record.title}</Text>
                  <Text style={s.small}>
                    {record.items.length} dishes ·{" "}
                    {record.sample ? "Prepared example" : "Personal menu"}
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
          <Text style={s.small}>
            Menus you save will appear here. Saved dishes are still in the heart
            button above.
          </Text>
        )}
      </View>

      {!!selected && !editing && (
        <Sheet title={selected.name} onClose={() => setSelected(null)}>
          <Text style={s.eyebrow}>ORIGINAL SPANISH</Text>
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
            onPress={() => setEditing({ ...selected })}
          >
            Correct this item
          </Button>
        </Sheet>
      )}
      {!!editing && (
        <Sheet title="Correct menu text" onClose={() => setEditing(null)}>
          {[
            ["nameEs", "Spanish dish name"],
            ["nameEn", "English dish name"],
            ["descriptionEs", "Spanish description"],
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
  capture: {
    backgroundColor: colors.paleGreen,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 14,
  },
  viewfinder: {
    minHeight: 116,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center", color: colors.muted },
  sampleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
    minHeight: 86,
  },
  sampleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.paleGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  photoFrame: {
    width: "100%",
    height: 350,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.line,
  },
  photo: { width: "100%", height: "100%" },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.paleGreen,
    borderRadius: 14,
    padding: 14,
  },
  category: { marginTop: 6, marginBottom: 12 },
  dish: {
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
  },
  conflict: { color: colors.red, fontSize: 13, lineHeight: 20 },
  flag: { color: colors.green, fontSize: 13, lineHeight: 20 },
  smallAction: { minHeight: 44, justifyContent: "center" },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  savedOpen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    minHeight: 64,
  },
  paper: {
    backgroundColor: "#FFFEFA",
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 22,
    gap: 10,
    marginTop: 10,
  },
  paperName: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: colors.green,
  },
  paperSub: {
    fontSize: 10,
    lineHeight: 16,
    color: colors.muted,
    textAlign: "center",
    letterSpacing: 1,
  },
  paperRule: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
});
