import React, { useState } from "react";
import { Pressable, Share, Switch, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { api } from "../src/api";
import { ALLERGENS, RESTRICTIONS, TASTE_TAGS } from "../src/data";
import { colors, s } from "../styles";
import {
  Button,
  Chips,
  closedRequest,
  date,
  Empty,
  ErrorText,
  Field,
  Icon,
  money,
  Notice,
  Section,
  Sheet,
  splitList,
  Status,
  Tabs,
  Title,
  useTask,
} from "./UI";
import { DemoButton, RequestRow } from "./Dining";
import { RequestSnapshot, RequestTimeline } from "./Requests";

function RestaurantSetup({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("Orlando");
  const [description, setDescription] = useState("");
  const task = useTask();
  function submit() {
    if (!name.trim() || !location.trim() || !description.trim())
      return task.setError("Add a restaurant name, location, and description.");
    task.run(
      () =>
        api.createRestaurant({
          name: name.trim(),
          location: location.trim(),
          description: description.trim(),
        }),
      onCreated,
    );
  }
  return (
    <Sheet title="Your sample restaurant space" onClose={onClose}>
      <Text style={s.body}>
        Create a fictional workspace you own. It includes a starter menu so you
        can test requests with another account.
      </Text>
      <Field
        label="Sample restaurant name"
        value={name}
        onChangeText={setName}
        maxLength={100}
        placeholder="Your sample kitchen"
      />
      <Field
        label="Location"
        value={location}
        onChangeText={setLocation}
        maxLength={150}
      />
      <Field
        label="A little about your menu"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={500}
        placeholder="Bright bowls and fresh seasonal flavors…"
      />
      <ErrorText error={task.error} />
      <Button busy={task.busy} icon="add-outline" onPress={submit}>
        Create sample workspace
      </Button>
    </Sheet>
  );
}

export function DishEditor({ dish, restaurantId, onClose }) {
  const [draft, setDraft] = useState(
    dish
      ? { ...dish }
      : {
          restaurantId,
          name: "",
          description: "",
          price: 0,
          emoji: "🍽️",
          category: "Plates",
          ingredients: [],
          allergens: [],
          tags: [],
          modifications: [],
          preparation: "",
          informationComplete: false,
        },
  );
  const [ingredients, setIngredients] = useState(draft.ingredients.join(", "));
  const [modifications, setModifications] = useState(
    draft.modifications.join(", "),
  );
  const task = useTask();
  const update = (key, value) =>
    setDraft((current) => ({ ...current, [key]: value }));
  function submit() {
    if (
      !draft.name.trim() ||
      !draft.description.trim() ||
      !ingredients.trim() ||
      !draft.preparation.trim()
    )
      return task.setError(
        "Add a name, description, ingredients, and preparation details.",
      );
    if (
      !Number.isFinite(Number(draft.price)) ||
      Number(draft.price) < 0 ||
      Number(draft.price) > 1000
    )
      return task.setError("Enter a price from $0 to $1,000.");
    const value = {
      ...draft,
      price: Number(draft.price),
      ingredients: splitList(ingredients),
      modifications: splitList(modifications),
    };
    task.run(() => (dish ? api.saveDish(value) : api.addDish(value)), onClose);
  }
  return (
    <Sheet
      title={dish ? "Edit the menu item" : "Add something delicious"}
      onClose={onClose}
    >
      <Field
        label="Dish name"
        value={draft.name}
        onChangeText={(value) => update("name", value)}
        maxLength={120}
      />
      <View style={s.row}>
        <View style={s.flex}>
          <Field
            label="Category"
            value={draft.category}
            onChangeText={(value) => update("category", value)}
            maxLength={50}
          />
        </View>
        <View style={s.flex}>
          <Field
            label="Price (USD)"
            value={String(draft.price)}
            onChangeText={(value) => update("price", value)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      <Field
        label="Dish emoji"
        value={draft.emoji}
        onChangeText={(value) => update("emoji", value)}
        maxLength={12}
      />
      <Field
        label="Description"
        multiline
        value={draft.description}
        onChangeText={(value) => update("description", value)}
        maxLength={500}
      />
      <Field
        label="Reported ingredients"
        hint="Separate ingredients with commas."
        multiline
        value={ingredients}
        onChangeText={setIngredients}
      />
      <Chips
        label="Declared allergens"
        options={ALLERGENS}
        value={draft.allergens}
        onChange={(value) => update("allergens", value)}
      />
      <Chips
        label="Flavor and dietary tags"
        options={[...TASTE_TAGS, ...RESTRICTIONS]}
        value={draft.tags}
        onChange={(value) => update("tags", value)}
      />
      <Field
        label="Offered modifications"
        hint="Separate modifications with commas."
        value={modifications}
        onChangeText={setModifications}
        multiline
      />
      <Field
        label="Preparation & cross-contact"
        value={draft.preparation}
        onChangeText={(value) => update("preparation", value)}
        multiline
        maxLength={1500}
      />
      <View style={s.row}>
        <Switch
          accessibilityLabel="Ingredient information has been entered"
          value={draft.informationComplete}
          onValueChange={(value) => update("informationComplete", value)}
          trackColor={{ true: colors.green, false: colors.line }}
        />
        <Text style={[s.small, s.flex]}>
          Ingredient information has been entered for this sample dish.
        </Text>
      </View>
      {dish && (
        <Notice>
          Saving creates a new menu revision. Every active request for this dish
          will require a fresh review.
        </Notice>
      )}
      <ErrorText error={task.error} />
      <Button busy={task.busy} onPress={submit}>
        {dish ? "Save new menu revision" : "Add to menu"}
      </Button>
    </Sheet>
  );
}

function ChangeForm({ request, onClose }) {
  const [expectedRevision] = useState(request.revision);
  const [ingredients, setIngredients] = useState(
    request.snapshot.ingredients.join(", "),
  );
  const [allergens, setAllergens] = useState(request.snapshot.allergens);
  const [preparation, setPreparation] = useState(request.snapshot.preparation);
  const [reason, setReason] = useState("");
  const task = useTask();
  function submit() {
    if (!ingredients.trim() || !preparation.trim() || !reason.trim())
      return task.setError(
        "Enter ingredients, preparation details, and an explanation of the change.",
      );
    task.run(
      () =>
        api.actOnRequest(
          request.id,
          "change",
          {
            ingredients: splitList(ingredients),
            allergens,
            preparation,
            reason,
          },
          expectedRevision,
        ),
      onClose,
    );
  }
  return (
    <Sheet title="Record a meal change" onClose={onClose}>
      <Notice>
        The earlier response and acknowledgment will no longer apply. The diner
        needs a fresh kitchen review.
      </Notice>
      <Field
        label="Reported ingredients"
        hint="Separate ingredients with commas."
        multiline
        value={ingredients}
        onChangeText={setIngredients}
      />
      <Chips
        label="Declared allergens"
        options={ALLERGENS}
        value={allergens}
        onChange={setAllergens}
      />
      <Field
        label="Preparation details"
        multiline
        value={preparation}
        onChangeText={setPreparation}
        maxLength={1500}
      />
      <Field
        label="Explain what changed"
        multiline
        value={reason}
        onChangeText={setReason}
        maxLength={1500}
        placeholder="The dressing was replaced with a yogurt dressing containing milk."
      />
      <ErrorText error={task.error} />
      <Button busy={task.busy} onPress={submit}>
        Record change & require review
      </Button>
    </Sheet>
  );
}

export function KitchenRequest({ id, state, navigate }) {
  const request = state.requests.find((item) => item.id === id);
  const [expectedRevision, setExpectedRevision] = useState(request?.revision);
  const [decision, setDecision] = useState("accommodate");
  const [message, setMessage] = useState("");
  const [changing, setChanging] = useState(false);
  const task = useTask();
  const canManage =
    request &&
    state.memberships.some(
      (item) => item.restaurantId === request.restaurantId,
    );
  if (!canManage)
    return (
      <Empty
        title="Kitchen access required"
        icon="lock-closed-outline"
        action="Open restaurant space"
        onPress={() => navigate("workspace")}
      >
        Only this restaurant's workspace owner can review its requests.
      </Empty>
    );
  const stale = expectedRevision !== request.revision;
  function sendResponse() {
    if (!message.trim())
      return task.setError(
        "Explain the ingredients, preparation, and any limitations.",
      );
    task.run(
      () =>
        api.actOnRequest(
          id,
          "respond",
          { decision, message: message.trim() },
          expectedRevision,
        ),
      () => {
        setMessage("");
        setExpectedRevision(request.revision);
      },
    );
  }
  return (
    <>
      <Title eyebrow="Kitchen request" title={request.dishName}>
        Meal version {request.revision} · {date(request.updatedAt)}
      </Title>
      <Status status={request.status} />
      <RequestSnapshot request={request} />
      {!closedRequest(request) && (
        <View style={s.card}>
          <Text style={s.h2}>Write a kitchen response</Text>
          {request.status === "acknowledged" ? (
            <Notice>
              The diner read the current response. Record any change before
              issuing a new response. The diner completes the request.
            </Notice>
          ) : (
            <>
              {stale && (
                <>
                  <Notice conflict>
                    This meal changed while you were writing. Review the latest
                    snapshot before starting a new response.
                  </Notice>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      setMessage("");
                      setExpectedRevision(request.revision);
                    }}
                  >
                    Review version {request.revision} and start again
                  </Button>
                </>
              )}
              <Tabs
                options={[
                  { value: "accommodate", label: "Can accommodate" },
                  { value: "clarify", label: "Need information" },
                  { value: "decline", label: "Cannot accommodate" },
                ]}
                value={decision}
                onChange={setDecision}
              />
              <Field
                label="Ingredients, preparation, and limitations"
                multiline
                maxLength={1500}
                value={message}
                onChangeText={setMessage}
                placeholder="Explain what was reviewed, what can change, and any uncertainty or cross-contact limitations."
              />
              <Button
                busy={task.busy}
                disabled={stale}
                icon="send-outline"
                onPress={sendResponse}
              >
                Send kitchen response
              </Button>
            </>
          )}
          <View style={s.divider} />
          <Text style={s.small}>Ingredients or preparation changed?</Text>
          <Button
            variant="secondary"
            icon="refresh-outline"
            onPress={() => setChanging(true)}
          >
            Record a meal change
          </Button>
          <ErrorText error={task.error} />
        </View>
      )}
      {request.response && (
        <View style={s.card}>
          <Text style={s.h3}>Latest kitchen response</Text>
          <Text style={s.body}>{request.response.message}</Text>
          <Text style={s.small}>
            Applies to meal version {request.response.revision} ·{" "}
            {date(request.response.createdAt)}
          </Text>
        </View>
      )}
      <RequestTimeline request={request} />
      <Button variant="secondary" onPress={() => navigate(`request/${id}`)}>
        Open conversation detail
      </Button>
      {changing && (
        <ChangeForm request={request} onClose={() => setChanging(false)} />
      )}
    </>
  );
}

function ShareMenu({ restaurant }) {
  const task = useTask();
  return (
    <View style={s.card}>
      <Text style={s.h2}>Share your menu</Text>
      <Text style={s.body}>
        Ask a test diner to open Verifed and scan this code from the Scan tab.
      </Text>
      <View
        style={{
          padding: 16,
          backgroundColor: "#FFFFFF",
          alignSelf: "center",
          borderRadius: 16,
        }}
      >
        <QRCode
          value={restaurant.id}
          size={220}
          color={colors.ink}
          backgroundColor="#FFFFFF"
        />
      </View>
      <Text
        selectable
        accessibilityLabel="Restaurant menu code"
        style={[s.body, { textAlign: "center" }]}
      >
        {restaurant.id}
      </Text>
      <Text style={s.small}>
        This QR contains a restaurant code. It opens inside Verifed's scanner.
        Cloud workspaces require the same connected backend.
      </Text>
      <Button
        variant="secondary"
        icon="share-outline"
        busy={task.busy}
        onPress={() =>
          task.run(() =>
            Share.share({
              title: `${restaurant.name} menu`,
              message: `Open Verifed, choose Scan, and enter this menu code: ${restaurant.id} (${restaurant.name}).`,
            }),
          )
        }
      >
        Share menu code
      </Button>
      <ErrorText error={task.error} />
    </View>
  );
}

export default function Workspace({ state, navigate }) {
  const owned = state.restaurants.filter((restaurant) =>
    state.memberships.some((item) => item.restaurantId === restaurant.id),
  );
  const [restaurantId, setRestaurantId] = useState(owned[0]?.id || "");
  const [tab, setTab] = useState("queue");
  const [filter, setFilter] = useState("active");
  const [setup, setSetup] = useState(false);
  const [editor, setEditor] = useState(null);
  const restaurant = owned.find((item) => item.id === restaurantId) || owned[0];
  const task = useTask();
  const allRequests = state.requests.filter(
    (item) => item.restaurantId === restaurant?.id,
  );
  const active = allRequests.filter((item) => !closedRequest(item));
  const shown = (
    filter === "all"
      ? allRequests
      : filter === "review"
        ? active.filter((item) => item.status === "review_required")
        : active
  ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (state.mode === "guest")
    return (
      <>
        <Title
          eyebrow="The other side of the table"
          title="A little clarity for your kitchen."
        >
          A focused place for requests, meal changes, and your sample menu.
        </Title>
        <Button onPress={() => navigate("auth")}>Sign in</Button>
        <DemoButton navigate={navigate} />
      </>
    );
  return (
    <>
      <Title
        eyebrow="Restaurant space · fictional demonstration"
        title={restaurant?.name || "Your kitchen, your conversation."}
      >
        Every request, requirement, and reported change together.
      </Title>
      <Button
        variant="secondary"
        icon="add-outline"
        onPress={() => setSetup(true)}
      >
        New sample workspace
      </Button>
      {owned.length > 1 && (
        <Tabs
          options={owned.map((item) => ({ value: item.id, label: item.name }))}
          value={restaurant.id}
          onChange={setRestaurantId}
        />
      )}
      {restaurant ? (
        <>
          <View style={s.row}>
            <View style={[s.card, s.flex]}>
              <Text style={s.eyebrow}>AT YOUR KITCHEN</Text>
              <Text style={s.h2}>{active.length} open</Text>
            </View>
            <View style={[s.card, s.flex]}>
              <Text style={s.eyebrow}>NEED A NEW LOOK</Text>
              <Text style={s.h2}>
                {
                  active.filter((item) => item.status === "review_required")
                    .length
                }{" "}
                changed
              </Text>
            </View>
          </View>
          <Tabs
            options={[
              { value: "queue", label: "Requests" },
              { value: "menu", label: "Menu manager" },
              { value: "share", label: "Share menu" },
            ]}
            value={tab}
            onChange={setTab}
          />
          {tab === "queue" ? (
            <>
              <Tabs
                options={[
                  { value: "active", label: "Active" },
                  { value: "review", label: "Needs review" },
                  { value: "all", label: "All requests" },
                ]}
                value={filter}
                onChange={setFilter}
              />
              <Button
                variant="quiet"
                icon="refresh-outline"
                busy={task.busy}
                onPress={() => task.run(() => api.refresh())}
              >
                Refresh requests
              </Button>
              <ErrorText error={task.error} />
              {shown.length ? (
                shown.map((request) => (
                  <RequestRow
                    staff
                    key={request.id}
                    request={request}
                    navigate={navigate}
                  />
                ))
              ) : (
                <Empty
                  title="A quiet moment in the kitchen"
                  icon="chatbubbles-outline"
                >
                  No requests match this view. Share your menu with a test diner
                  to start a conversation.
                </Empty>
              )}
            </>
          ) : tab === "menu" ? (
            <Section
              title="Your menu"
              action="Add dish"
              onPress={() => setEditor({})}
            >
              {state.dishes
                .filter((item) => item.restaurantId === restaurant.id)
                .map((dish) => (
                  <Pressable
                    accessibilityRole="button"
                    key={dish.id}
                    onPress={() => setEditor({ dish })}
                    style={[s.card, s.row]}
                  >
                    <Text style={{ fontSize: 40 }}>{dish.emoji}</Text>
                    <View style={s.flex}>
                      <Text style={s.h3}>{dish.name}</Text>
                      <Text style={s.small}>
                        {dish.category} · {money(dish.price)} · v{dish.revision}
                      </Text>
                    </View>
                    <Icon name="create-outline" />
                  </Pressable>
                ))}
            </Section>
          ) : (
            <ShareMenu restaurant={restaurant} />
          )}
        </>
      ) : (
        <Empty
          title="Make a space for your kitchen"
          icon="restaurant-outline"
          action="Create sample workspace"
          onPress={() => setSetup(true)}
        >
          Create a fictional restaurant you own to practice authorized staff
          actions. Supplied sample restaurants do not belong to cloud accounts.
        </Empty>
      )}
      {setup && (
        <RestaurantSetup
          onClose={() => setSetup(false)}
          onCreated={(created) => {
            setRestaurantId(created.id);
            setSetup(false);
          }}
        />
      )}
      {editor && restaurant && (
        <DishEditor
          dish={editor.dish}
          restaurantId={restaurant.id}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
