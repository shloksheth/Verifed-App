import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { api } from "../src/api";
import { TASTE_TAGS } from "../src/data";
import { colors, s } from "../styles";
import {
  Button,
  Chips,
  date,
  Empty,
  ErrorText,
  Field,
  Icon,
  Sheet,
  Tabs,
  Tags,
  Title,
  useTask,
} from "./UI";
import { FoodArt, RequestRow } from "./Dining";

function Stars({ rating, onChange }) {
  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map((value) =>
        onChange ? (
          <Pressable
            key={value}
            style={s.star}
            accessibilityRole="radio"
            accessibilityLabel={`Rate ${value} out of 5`}
            accessibilityState={{ checked: rating === value }}
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
            size={19}
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
    <Sheet
      title={entry ? "Edit meal" : "Remember a good meal"}
      onClose={onClose}
    >
      <Text style={s.body}>
        Save the flavors. Next time, you'll know what you loved.
      </Text>
      <Field
        label="What did you eat?"
        maxLength={120}
        value={name}
        onChangeText={setName}
        placeholder="Your dish name"
      />
      <Field
        label="Where was it?"
        maxLength={120}
        value={place}
        onChangeText={setPlace}
        placeholder="A restaurant, home, or somewhere special"
      />
      <View>
        <Text style={s.label}>How was the taste?</Text>
        <Stars rating={rating} onChange={setRating} />
        <Text style={s.small}>
          {
            [
              "Tap a star",
              "Not for me",
              "It was okay",
              "Pretty good",
              "Loved it",
              "A new favorite",
            ][rating]
          }
        </Text>
      </View>
      <Chips
        label="What stood out?"
        options={TASTE_TAGS}
        value={tags}
        onChange={setTags}
      />
      <Field
        label="A note for next time"
        multiline
        maxLength={1500}
        value={notes}
        onChangeText={setNotes}
        placeholder="The citrus dressing was the best part…"
      />
      <Text style={s.small}>
        Ratings describe taste. They do not verify allergy suitability.
      </Text>
      <ErrorText error={task.error} />
      <Button busy={task.busy} icon="journal-outline" onPress={submit}>
        {entry ? "Save changes" : "Save meal"}
      </Button>
    </Sheet>
  );
}

export function History({ state, navigate, openSheet, initialTab }) {
  const [tab, setTab] = useState(
    initialTab === "requests" ? "requests" : "meals",
  );
  const [query, setQuery] = useState("");
  const meals = state.meals
    .filter((meal) =>
      `${meal.dishName} ${meal.restaurantName}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const requests = state.requests
    .filter(
      (item) =>
        item.userId === state.user?.id &&
        item.dishName.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <>
      <Title eyebrow="Your dining journal" title="One for the memories.">
        The flavors, favorites, and conversations worth keeping.
      </Title>
      <Button
        variant="secondary"
        icon="add-outline"
        onPress={() =>
          state.mode === "guest"
            ? navigate("auth")
            : openSheet({ type: "meal" })
        }
      >
        Log a meal
      </Button>
      <Tabs
        options={[
          { value: "meals", label: `Meals · ${state.meals.length}` },
          { value: "requests", label: "Kitchen requests" },
        ]}
        value={tab}
        onChange={setTab}
      />
      <Field
        label="Search your journal"
        value={query}
        onChangeText={setQuery}
        placeholder="A dish or a restaurant…"
        clearButtonMode="while-editing"
      />
      {tab === "meals" ? (
        meals.length ? (
          meals.map((meal) => (
            <Pressable
              accessibilityRole="button"
              key={meal.id}
              onPress={() => navigate(`meal/${meal.id}`)}
              style={s.card}
            >
              <View style={s.between}>
                <Stars rating={meal.rating} />
                <Text style={s.small}>{date(meal.createdAt)}</Text>
              </View>
              <Text style={s.h3}>{meal.dishName}</Text>
              <Text style={s.small}>{meal.restaurantName}</Text>
              {!!meal.notes && (
                <Text numberOfLines={2} style={s.body}>
                  {meal.notes}
                </Text>
              )}
              <Tags values={meal.tags} fallback="" />
            </Pressable>
          ))
        ) : (
          <Empty
            title={
              query ? "No matching memories" : "Your next favorite starts here"
            }
            icon="journal-outline"
            action="Log a meal"
            onPress={() =>
              state.mode === "guest"
                ? navigate("auth")
                : openSheet({ type: "meal" })
            }
          >
            Even meals outside the sample menus belong here.
          </Empty>
        )
      ) : requests.length ? (
        requests.map((request) => (
          <RequestRow key={request.id} request={request} navigate={navigate} />
        ))
      ) : (
        <Empty
          title="Your conversations live here"
          icon="chatbubbles-outline"
          action="Explore a menu"
          onPress={() => navigate("explore")}
        >
          Open a dish to share your requirements with a connected sample
          kitchen.
        </Empty>
      )}
    </>
  );
}

export function MealDetail({ id, state, navigate, openSheet }) {
  const entry = state.meals.find((item) => item.id === id);
  if (!entry)
    return (
      <Empty
        title="Meal not found"
        action="Back to history"
        onPress={() => navigate("history")}
      />
    );
  const dish = state.dishes.find((item) => item.id === entry.dishId);
  return (
    <>
      <Title eyebrow="A page from your journal" title={entry.dishName}>
        {entry.restaurantName} · {date(entry.createdAt)}
      </Title>
      <FoodArt dish={dish || { name: entry.dishName }} large />
      <View style={s.card}>
        <Stars rating={entry.rating} />
        <Text style={s.h2}>
          {entry.rating >= 4 ? "One to remember." : "A note for next time."}
        </Text>
        <Text style={s.body}>
          {entry.notes || "No notes added for this meal."}
        </Text>
        <Tags values={entry.tags} />
        <Text style={s.small}>
          A personal taste memory, not a record of allergy safety.
        </Text>
      </View>
      <Button
        variant="secondary"
        icon="create-outline"
        onPress={() => openSheet({ type: "meal", dish, entry })}
      >
        Edit meal
      </Button>
      {dish && (
        <Button onPress={() => navigate(`dish/${dish.id}`)}>
          Find this dish again
        </Button>
      )}
    </>
  );
}
