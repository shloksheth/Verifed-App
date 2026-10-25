import { type } from "../src/design-tokens";
import { Text } from "./Typography";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { api } from "../src/api";
import { TASTE_TAGS } from "../src/data";
import { colors } from "../styles";
import {
  Button,
  Chips,
  date,
  Empty,
  ErrorText,
  Field,
  Icon,
  Sheet,
  Tags,
  useTask,
} from "./UI";
import { FoodArt } from "./Dining";

const tasteLabels = [
  "Choose a rating",
  "Not for me",
  "It was okay",
  "Pretty good",
  "Loved it",
  "A new favorite",
];

function Stars({ rating, onChange }) {
  return (
    <View
      style={j.stars}
      accessibilityRole={onChange ? "radiogroup" : "text"}
      accessibilityLabel={
        onChange ? "Taste rating" : `${rating} out of 5 stars`
      }
    >
      {[1, 2, 3, 4, 5].map((value) =>
        onChange ? (
          <Pressable
            key={value}
            style={j.starButton}
            accessibilityRole="radio"
            accessibilityLabel={`${value} out of 5: ${tasteLabels[value]}`}
            accessibilityState={{ checked: rating === value }}
            aria-checked={rating === value}
            onPress={() => onChange(value)}
          >
            <Icon
              name={value <= rating ? "star" : "star-outline"}
              color={colors.orange}
              size={30}
            />
          </Pressable>
        ) : (
          <Icon
            key={value}
            name={value <= rating ? "star" : "star-outline"}
            color={colors.orange}
            size={22}
          />
        ),
      )}
    </View>
  );
}

export function MealComposer({ dish, entry, state, onClose, navigate }) {
  const restaurant = state.restaurants.find(
    (item) => item.id === dish?.restaurantId,
  );
  const [name, setName] = useState(entry?.dishName || dish?.name || "");
  const [place, setPlace] = useState(
    entry?.restaurantName || restaurant?.name || "",
  );
  const [rating, setRating] = useState(entry?.rating || 0);
  const [notes, setNotes] = useState(entry?.notes || "");
  const [tags, setTags] = useState(entry?.tags || []);
  const task = useTask();

  // Editing keeps the original menu links. A custom meal needs no catalog dish.
  function submit() {
    if (!name.trim() || !place.trim())
      return task.setError("Add a dish name and a place.");
    if (!rating)
      return task.setError("Choose a taste rating from one to five.");
    task.run(
      () =>
        api.saveMeal({
          id: entry?.id,
          dishId: entry?.dishId || dish?.id,
          restaurantId: entry?.restaurantId || restaurant?.id,
          dishName: name.trim(),
          restaurantName: place.trim(),
          rating,
          notes,
          tags,
        }),
      () => {
        onClose();
        navigate("history");
      },
    );
  }
  return (
    <Sheet title={entry ? "Edit meal" : "Log a meal"} onClose={onClose}>
      <Text style={j.composerIntro}>
        Add a rating and any notes you want to keep.
      </Text>
      <View style={j.formSection}>
        <Field
          label="Dish name"
          maxLength={120}
          value={name}
          onChangeText={setName}
          placeholder="What did you eat?"
        />
        <Field
          label="Restaurant or place"
          maxLength={120}
          value={place}
          onChangeText={setPlace}
          placeholder="A restaurant, home, or somewhere else"
        />
      </View>
      <View style={j.ratingEditor}>
        <Text style={j.sectionLabel}>Your taste rating</Text>
        <Stars rating={rating} onChange={setRating} />
        <Text accessibilityLiveRegion="polite" style={j.ratingLabel}>
          {tasteLabels[rating]}
        </Text>
      </View>
      <Chips
        label="Flavors you noticed"
        options={TASTE_TAGS}
        value={tags}
        onChange={setTags}
      />
      <Field
        label="Notes for next time (optional)"
        multiline
        maxLength={1500}
        value={notes}
        onChangeText={setNotes}
        placeholder="What would you order again or change?"
      />
      <Text style={j.footnote}>
        Taste notes personalize discovery. They do not record allergy safety.
      </Text>
      <ErrorText error={task.error} />
      <Button busy={task.busy} icon="checkmark-outline" onPress={submit}>
        {entry ? "Save changes" : "Save meal"}
      </Button>
    </Sheet>
  );
}

function MealRow({ meal, dish, navigate }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meal.dishName}, ${meal.restaurantName}, ${meal.rating} out of 5, ${date(meal.createdAt)}`}
      onPress={() => navigate(`meal/${meal.id}`)}
      style={({ pressed }) => [j.mealRow, pressed && j.pressed]}
    >
      {!!dish && <FoodArt dish={dish} />}
      <View style={j.mealCopy}>
        <Text style={j.mealName} numberOfLines={2}>
          {meal.dishName}
        </Text>
        <Text style={j.place} numberOfLines={1}>
          {meal.restaurantName}
        </Text>
        <View style={j.rowMeta}>
          <View style={j.ratingSummary}>
            <Icon name="star" size={13} color={colors.orange} />
            <Text style={j.ratingNumber}>{meal.rating}/5</Text>
          </View>
          <Text style={j.date}>{date(meal.createdAt)}</Text>
        </View>
        {!!meal.notes && (
          <Text numberOfLines={2} style={j.rowNote}>
            {meal.notes}
          </Text>
        )}
      </View>
      <Icon name="chevron-forward" size={17} color={colors.muted} />
    </Pressable>
  );
}

export function History({ state, navigate, openSheet }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const search = query.trim().toLowerCase();
  const lovedCount = state.meals.filter((meal) => meal.rating >= 4).length;
  const placeCount = new Set(
    state.meals
      .map((meal) =>
        String(meal.restaurantName || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean),
  ).size;
  const meals = state.meals
    .filter(
      (meal) =>
        (filter === "all" || meal.rating >= 4) &&
        `${meal.dishName} ${meal.restaurantName}`
          .toLowerCase()
          .includes(search),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const logMeal = () => openSheet({ type: "meal" });

  return (
    <>
      <View style={j.pageHeader}>
        <Text accessibilityRole="header" style={j.pageTitle}>
          Journal
        </Text>
        <Text style={j.intro}>Ratings and notes from your meals.</Text>
      </View>
      <View style={j.summary}>
        <View style={j.summaryCount}>
          <Text style={j.count}>{state.meals.length}</Text>
          <Text style={j.countLabel}>
            {state.meals.length === 1 ? "meal logged" : "meals logged"}
          </Text>
        </View>
        <View style={j.summaryDivider} />
        <View style={j.summaryCount}>
          <Text style={j.count}>{placeCount}</Text>
          <Text style={j.countLabel}>
            {placeCount === 1 ? "place tried" : "places tried"}
          </Text>
        </View>
      </View>
      <Button icon="add-outline" onPress={logMeal}>
        Log a meal
      </Button>
      <Field
        label="Search your journal"
        value={query}
        onChangeText={setQuery}
        placeholder="Dish or restaurant"
        clearButtonMode="while-editing"
      />
      <View style={j.filterBar} accessibilityRole="tablist">
        {[
          { value: "all", label: "All meals", count: state.meals.length },
          { value: "loved", label: "Loved", count: lovedCount },
        ].map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityLabel={`${item.label}, ${item.count}`}
            accessibilityState={{ selected: filter === item.value }}
            aria-selected={filter === item.value}
            onPress={() => setFilter(item.value)}
            style={[j.filter, filter === item.value && j.filterSelected]}
          >
            <Text
              style={[
                j.filterText,
                filter === item.value && j.filterTextSelected,
              ]}
            >
              {item.label}
            </Text>
            <Text
              style={[
                j.filterCount,
                filter === item.value && j.filterTextSelected,
              ]}
            >
              {item.count}
            </Text>
          </Pressable>
        ))}
      </View>
      {meals.length ? (
        <View style={j.list}>
          <View style={j.listHeading}>
            <Text style={j.sectionLabel}>
              {search
                ? `${meals.length} results`
                : filter === "loved"
                  ? "Your favorites"
                  : "Recent meals"}
            </Text>
            <Text style={j.date}>Newest first</Text>
          </View>
          {meals.map((meal) => (
            <MealRow
              key={meal.id}
              meal={meal}
              dish={state.dishes.find((dish) => dish.id === meal.dishId)}
              navigate={navigate}
            />
          ))}
        </View>
      ) : (
        <View style={j.empty}>
          <View style={j.emptyMark}>
            <Icon name="journal-outline" size={29} color={colors.orange} />
          </View>
          <Text style={j.emptyTitle}>
            {search
              ? "No meals found"
              : filter === "loved"
                ? "No highly rated meals yet"
                : "No meals logged yet"}
          </Text>
          <Text style={j.emptyCopy}>
            {search
              ? "Try another dish or restaurant name."
              : filter === "loved"
                ? "Meals you rate four or five stars appear in Loved."
                : "Add a dish, a rating and a note for next time."}
          </Text>
          {(search || filter !== "all") && (
            <Button
              variant="quiet"
              onPress={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Show all meals
            </Button>
          )}
        </View>
      )}
      <Text style={j.footnote}>
        {state.mode === "cloud"
          ? "Your journal belongs to your signed-in account."
          : "Your journal stays on this device."}{" "}
        Taste ratings describe your experience, not allergy safety.
      </Text>
    </>
  );
}

export function MealDetail({ id, state, navigate, openSheet }) {
  const entry = state.meals.find((item) => item.id === id);
  if (!entry)
    return (
      <Empty
        title="Meal not found"
        action="Back to journal"
        onPress={() => navigate("history")}
      />
    );
  const dish = state.dishes.find((item) => item.id === entry.dishId);
  return (
    <>
      <View style={j.pageHeader}>
        <Text style={j.kicker}>YOUR JOURNAL · {date(entry.createdAt)}</Text>
        <Text accessibilityRole="header" style={j.detailTitle}>
          {entry.dishName}
        </Text>
        <Text style={j.detailPlace}>{entry.restaurantName}</Text>
      </View>
      {!!dish && <FoodArt dish={dish} large />}
      <View style={j.detailSection}>
        <Text style={j.sectionLabel}>Your taste rating</Text>
        <View style={j.detailRating}>
          <Stars rating={entry.rating} />
          <Text style={j.ratingLabel}>{entry.rating}/5</Text>
        </View>
        <Text style={j.tasteTitle}>{tasteLabels[entry.rating]}</Text>
      </View>
      <View style={j.detailSection}>
        <Text style={j.sectionLabel}>Notes for next time</Text>
        <Text selectable style={j.notes}>
          {entry.notes || "You haven't added any notes for this meal."}
        </Text>
        {!!entry.tags?.length && (
          <View style={j.flavorNotes}>
            <Text style={j.sectionLabel}>Flavors you noticed</Text>
            <Tags values={entry.tags} />
          </View>
        )}
      </View>
      <Button
        icon="create-outline"
        onPress={() => openSheet({ type: "meal", dish, entry })}
      >
        Edit meal
      </Button>
      {dish && (
        <Button
          variant="secondary"
          icon="restaurant-outline"
          onPress={() => navigate(`dish/${dish.id}`)}
        >
          View menu item
        </Button>
      )}
      <Text style={j.footnote}>
        Taste ratings describe your experience, not allergy safety.
      </Text>
    </>
  );
}

// These styles stay beside the journal rather than adding screen-specific
// entries to the shared theme. Colors and typography follow the app aliases.
const j = StyleSheet.create({
  pageHeader: { gap: 6, paddingTop: 5, paddingBottom: 3 },
  pageTitle: { ...type.page, color: colors.ink },
  intro: { ...type.body, color: colors.muted },
  summary: {
    backgroundColor: colors.peach,
    paddingHorizontal: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    paddingVertical: 13,
    marginBottom: 1,
  },
  summaryCount: { gap: 2 },
  count: {
    fontFamily: "HomeStrong",
    fontWeight: "700",
    fontSize: 23,
    lineHeight: 30,
    color: colors.ink,
  },
  countLabel: { fontSize: 12, lineHeight: 18, color: colors.muted },
  summaryDivider: { width: 1, height: 37, backgroundColor: colors.line },
  filterBar: {
    flexDirection: "row",
    gap: 24,
    borderBottomWidth: 1,
    borderColor: colors.line,
    marginTop: 1,
  },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 45,
    borderBottomWidth: 2,
    borderColor: "transparent",
    paddingHorizontal: 2,
    paddingBottom: 5,
  },
  filterSelected: { borderBottomColor: colors.green },
  filterText: { fontSize: 14, fontWeight: "500", color: colors.muted },
  filterTextSelected: { color: colors.green, fontWeight: "700" },
  filterCount: { fontSize: 11, lineHeight: 16, color: colors.muted },
  list: { gap: 0 },
  listHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 7,
    paddingBottom: 2,
  },
  sectionLabel: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink,
    fontWeight: "700",
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: colors.line,
    minHeight: 100,
  },
  pressed: { opacity: 0.65 },
  mealCopy: { flex: 1, minWidth: 0, gap: 4 },
  mealName: { ...type.card, color: colors.ink },
  place: { ...type.meta, color: colors.muted },
  rowMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 9,
    rowGap: 3,
    marginTop: 2,
  },
  ratingSummary: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingNumber: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.ink,
    fontWeight: "600",
  },
  date: { fontSize: 11, lineHeight: 17, color: colors.muted },
  rowNote: { fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 2 },
  empty: {
    backgroundColor: colors.paleGreen,
    borderRadius: 18,
    alignItems: "center",
    gap: 10,
    paddingVertical: 33,
    paddingHorizontal: 15,
  },
  emptyMark: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.peach,
    marginBottom: 3,
  },
  emptyTitle: { ...type.section, color: colors.ink, textAlign: "center" },
  emptyCopy: {
    fontSize: 13,
    lineHeight: 21,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 310,
  },
  footnote: {
    fontSize: 11,
    lineHeight: 18,
    color: colors.muted,
    paddingVertical: 8,
  },
  stars: { flexDirection: "row", alignItems: "center", gap: 5 },
  starButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  composerIntro: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    marginTop: -4,
  },
  formSection: { gap: 15 },
  ratingEditor: {
    gap: 7,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingVertical: 17,
  },
  ratingLabel: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink,
    fontWeight: "600",
  },
  kicker: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.orangeDark,
    fontWeight: "700",
    letterSpacing: 1,
  },
  detailTitle: { ...type.page, color: colors.ink },
  detailPlace: { fontSize: 14, lineHeight: 22, color: colors.muted },
  detailSection: {
    gap: 10,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  detailRating: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 13,
  },
  tasteTitle: { ...type.section, color: colors.ink },
  notes: { ...type.body, color: colors.ink },
  flavorNotes: { marginTop: 6, gap: 9 },
});
