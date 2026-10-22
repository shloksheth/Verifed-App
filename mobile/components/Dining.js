import React, { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { api } from "../src/api";
import { assessDish, rankDishes } from "../src/domain";
import { colors, s } from "../styles";
import {
  Button,
  Empty,
  ErrorText,
  Field,
  Icon,
  money,
  Notice,
  Section,
  Status,
  Tabs,
  Tags,
  Title,
  useTask,
  closedRequest,
} from "./UI";

const isLocal = (restaurant) => restaurant?.fictional === false;
const districtKey = (restaurant) =>
  restaurant.district
    ? `${restaurant.district.state}-${restaurant.district.number}`
    : "";
const scopeLabel = (scope) =>
  scope === "location"
    ? "Location-specific source"
    : scope === "chain"
      ? "Chainwide source"
      : "Source scope not supplied";

function SourceLink({
  url,
  children,
  icon = "open-outline",
  style,
  compact = false,
}) {
  const task = useTask();
  if (!url) return null;
  return (
    <View style={style}>
      <Button
        variant="secondary"
        icon={icon}
        busy={task.busy}
        style={compact && { paddingHorizontal: 10 }}
        onPress={() => task.run(() => Linking.openURL(url))}
      >
        {children}
      </Button>
      <ErrorText error={task.error} />
    </View>
  );
}

function RestaurantSources({ restaurant }) {
  const [expanded, setExpanded] = useState(false);
  if (!isLocal(restaurant))
    return (
      <Notice>Fictional sample kitchen. Requests here are for practice.</Notice>
    );
  return (
    <View style={s.card}>
      <Text selectable style={s.body}>
        {restaurant.address || restaurant.location}
      </Text>
      <Text style={s.small}>
        {scopeLabel(restaurant.source?.scope)} · Reviewed{" "}
        {restaurant.source?.reviewedAt || "date not supplied"}
      </Text>
      <View style={s.row}>
        <SourceLink url={restaurant.menuUrl} style={s.flex} compact>
          Official menu
        </SourceLink>
        <SourceLink
          url={
            restaurant.phone
              ? `tel:${restaurant.phone.replace(/[^+\d]/g, "")}`
              : null
          }
          icon="call-outline"
          style={s.flex}
          compact
        >
          Call
        </SourceLink>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={[s.between, { minHeight: 44 }]}
      >
        <Text style={s.link}>Sources and location</Text>
        <Icon name={expanded ? "chevron-up" : "chevron-down"} size={18} />
      </Pressable>
      {expanded && (
        <View style={s.stack}>
          {!!restaurant.source?.note && (
            <Text style={s.small}>{restaurant.source.note}</Text>
          )}
          <SourceLink url={restaurant.allergenUrl}>
            Allergen information
          </SourceLink>
          <SourceLink url={restaurant.websiteUrl}>
            Restaurant website
          </SourceLink>
          {!!restaurant.phone && (
            <Text selectable style={s.body}>
              {restaurant.phone}
            </Text>
          )}
          {!!restaurant.district && (
            <>
              <Text style={s.small}>
                Congressional district {restaurant.district.state}-
                {restaurant.district.number}
                {restaurant.district.congress
                  ? ` · Congress ${restaurant.district.congress}`
                  : ""}
                {" · "}Location checked {restaurant.district.verifiedAt}
              </Text>
              <SourceLink url={restaurant.district.sourceUrl}>
                District source
              </SourceLink>
            </>
          )}
        </View>
      )}
    </View>
  );
}

export function Assessment({ dish, state, detailed = false }) {
  const result = assessDish(dish, state.profile, state.meals);
  const message =
    result.level === "conflict"
      ? `Known profile conflict${detailed ? ": " + result.conflicts.join(", ") : ""}`
      : result.level === "unknown"
        ? "Unknown — information needs confirmation"
        : "Review ingredients and preparation";
  return (
    <View style={s.stack}>
      <Notice conflict={result.level === "conflict"}>{message}</Notice>
      {detailed && !!result.reasons?.length && (
        <View style={s.card}>
          <Text style={s.h3}>Why this result</Text>
          {result.reasons.map((reason) => (
            <Text key={reason} style={s.body}>
              {reason}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// Real menu entries use text and source records; sample artwork stays in the demo.
export function FoodArt({ dish, large }) {
  if (dish.provenance)
    return (
      <View style={[s.foodArt, s.row]}>
        <Icon name="restaurant-outline" size={24} color={colors.orangeDark} />
        <Text style={s.body}>{dish.category || "Menu item"}</Text>
      </View>
    );
  return (
    <View style={[s.foodArt, large && { height: 100 }]}>
      <Text accessibilityLabel={dish.name} style={s.foodEmoji}>
        {dish.emoji || "🍽️"}
      </Text>
    </View>
  );
}

export function DishCard({ dish, state, navigate }) {
  const task = useTask();
  const restaurant = state.restaurants.find(
    (item) => item.id === dish.restaurantId,
  );
  const saved = state.favorites.includes(dish.id);
  const saveUnavailable =
    state.mode === "cloud" && !!dish.provenance && !dish.cloudBacked;
  return (
    <View style={s.menuCard}>
      <View style={s.between}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${dish.name}`}
          onPress={() => navigate(`dish/${dish.id}`)}
          style={s.flex}
        >
          <Text style={s.small}>
            {restaurant?.name} · {dish.category}
          </Text>
          <Text style={s.dishName}>{dish.name}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${saved ? "Unsave" : "Save"} ${dish.name}`}
          accessibilityState={{
            selected: saved,
            disabled: task.busy || saveUnavailable,
          }}
          disabled={task.busy || saveUnavailable}
          style={s.iconButton}
          onPress={() =>
            state.mode === "guest"
              ? navigate("auth")
              : task.run(() => api.toggleFavorite(dish.id))
          }
        >
          <Icon
            name={saved ? "heart" : "heart-outline"}
            color={saved ? colors.orange : colors.muted}
          />
        </Pressable>
      </View>
      <View style={s.between}>
        <Text style={[s.small, s.flex]}>
          {dish.provenance?.kind === "component"
            ? "Menu component · not a complete meal"
            : dish.description}
        </Text>
        <Text style={s.menuPrice}>{money(dish.price)}</Text>
      </View>
      <Assessment dish={dish} state={state} />
      {saveUnavailable && (
        <Text style={s.small}>Refresh the catalog to save this item.</Text>
      )}
      {isLocal(restaurant) && (
        <Text style={s.sourceText}>
          {scopeLabel(dish.provenance?.scope)} · Reviewed{" "}
          {dish.provenance?.reviewedAt || "date not supplied"}
        </Text>
      )}
      <ErrorText error={task.error} />
    </View>
  );
}

function RestaurantRow({ restaurant, state, navigate }) {
  const count = state.dishes.filter(
    (dish) => dish.restaurantId === restaurant.id,
  ).length;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => navigate(`restaurant/${restaurant.id}`)}
      style={s.restaurantRow}
    >
      <View style={s.restaurantMark}>
        <Icon name="restaurant-outline" color={colors.orangeDark} />
      </View>
      <View style={s.flex}>
        <Text style={s.h3}>{restaurant.name}</Text>
        <Text style={s.small}>{restaurant.address || restaurant.location}</Text>
        <Text style={s.sourceText}>
          {count} menu entries
          {isLocal(restaurant)
            ? ` · ${districtKey(restaurant) || "District unlisted"}`
            : " · Fictional sample"}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} />
    </Pressable>
  );
}

export function RequestRow({ request, navigate, staff = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        navigate(`${staff ? "kitchen-request" : "request"}/${request.id}`)
      }
      style={s.card}
    >
      <View style={s.between}>
        <Status status={request.status} />
        <Icon name="arrow-forward" size={18} />
      </View>
      <Text style={s.h3}>{request.dishName}</Text>
      <Text style={s.small}>
        Meal version {request.revision} ·{" "}
        {request.status === "review_required"
          ? "The meal changed. A fresh response is needed."
          : "View the conversation"}
      </Text>
    </Pressable>
  );
}

export function Home({ state, navigate }) {
  const local = state.restaurants.filter(isLocal);
  const active = state.requests.filter(
    (item) => item.userId === state.user?.id && !closedRequest(item),
  );
  return (
    <>
      <Title eyebrow="Orlando, Florida" title="Find a local menu">
        Browse official menus and compare their reported information with your
        profile.
      </Title>
      <Button icon="restaurant-outline" onPress={() => navigate("explore")}>
        Explore Orlando menus
      </Button>
      <View style={s.card}>
        <View style={s.between}>
          <Text style={s.h3}>Your dietary needs</Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => navigate("edit-profile")}
          >
            <Text style={s.link}>
              {state.profile.allergies.length ? "Edit" : "Choose allergies"}
            </Text>
          </Pressable>
        </View>
        <Tags
          values={state.profile.allergies.map((item) => `Avoid ${item}`)}
          fallback="No allergies selected"
        />
        <Text style={s.small}>
          {state.mode === "guest"
            ? "Browse without signing in. Your profile is saved only on this device, not to an account."
            : "Your profile helps identify known conflicts and missing information."}
        </Text>
      </View>
      <Section
        title="Local restaurants"
        action="See all"
        onPress={() => navigate("explore")}
      >
        {local.length ? (
          local
            .slice(0, 4)
            .map((restaurant) => (
              <RestaurantRow
                key={restaurant.id}
                {...{ restaurant, state, navigate }}
              />
            ))
        ) : (
          <Empty title="No local menus available">
            Refresh data in settings to try again.
          </Empty>
        )}
      </Section>
      <Notice>
        Menu sources can be incomplete. Call the restaurant to confirm
        ingredients and cross-contact before ordering.
      </Notice>
      <Button
        variant="secondary"
        icon="scan-outline"
        onPress={() => navigate("scan")}
      >
        Open a menu code
      </Button>
      {!!active.length && (
        <Section title="Sample kitchen conversations">
          {active.slice(0, 2).map((request) => (
            <RequestRow key={request.id} {...{ request, navigate }} />
          ))}
        </Section>
      )}
    </>
  );
}

export function DemoButton({ navigate }) {
  const task = useTask();
  return (
    <>
      <Button
        busy={task.busy}
        variant="secondary"
        icon="flask-outline"
        onPress={() =>
          task.run(
            () => api.enterDemo(),
            () => navigate("home"),
          )
        }
      >
        Try the local demo
      </Button>
      <ErrorText error={task.error} />
    </>
  );
}

export function Explore({ state, navigate }) {
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState("local");
  const [tab, setTab] = useState("restaurants");
  const [district, setDistrict] = useState("all");
  const [category, setCategory] = useState("All");
  const [hideConflicts, setHideConflicts] = useState(false);
  const restaurants = state.restaurants.filter((restaurant) =>
    catalog === "local" ? isLocal(restaurant) : !isLocal(restaurant),
  );
  // These are restaurant locations, not an assumption about the diner's district.
  const districts = [
    ...new Set(restaurants.map(districtKey).filter(Boolean)),
  ].sort();
  const located = restaurants.filter(
    (restaurant) => district === "all" || districtKey(restaurant) === district,
  );
  const restaurantIds = new Set(located.map((restaurant) => restaurant.id));
  const catalogDishes = state.dishes.filter((dish) =>
    restaurantIds.has(dish.restaurantId),
  );
  const categories = [
    "All",
    ...new Set(catalogDishes.map((dish) => dish.category)),
  ];
  const matchesSearch = (dish) => {
    const restaurant = located.find((item) => item.id === dish.restaurantId);
    return [
      dish.name,
      dish.description,
      restaurant?.name,
      restaurant?.address,
      ...(dish.tags || []),
    ]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  };
  const dishes = rankDishes(
    catalogDishes.filter(
      (dish) =>
        matchesSearch(dish) &&
        (category === "All" || category === dish.category) &&
        (!hideConflicts ||
          assessDish(dish, state.profile, state.meals).level !== "conflict"),
    ),
    state.profile,
    state.meals,
  );
  const visibleRestaurants = located.filter(
    (restaurant) =>
      [restaurant.name, restaurant.address, restaurant.location]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()) ||
      catalogDishes.some(
        (dish) => dish.restaurantId === restaurant.id && matchesSearch(dish),
      ),
  );
  function changeCatalog(value) {
    setCatalog(value);
    setDistrict("all");
    setCategory("All");
  }
  return (
    <>
      <Title eyebrow="Menu directory" title="Explore Orlando" />
      <Tabs
        options={[
          { value: "local", label: "Local menus" },
          { value: "sample", label: "Sample kitchens" },
        ]}
        value={catalog}
        onChange={changeCatalog}
      />
      <Field
        label="Search menus"
        value={query}
        onChangeText={setQuery}
        placeholder="Restaurant, menu item, or ingredient"
        clearButtonMode="while-editing"
      />
      {catalog === "local" ? (
        <View style={s.stack}>
          {districts.length > 1 ? (
            <>
              <Text style={s.label}>Area</Text>
              <Tabs
                options={[
                  { value: "all", label: "All Orlando" },
                  ...districts.map((value) => ({ value, label: value })),
                ]}
                value={district}
                onChange={(value) => {
                  setDistrict(value);
                  setCategory("All");
                }}
              />
              <Text style={s.small}>Filter restaurant locations.</Text>
            </>
          ) : (
            <Text style={s.small}>
              {restaurants.length} locations in Orlando
              {districts.length === 1 ? ` · ${districts[0]}` : ""}
            </Text>
          )}
        </View>
      ) : (
        <Notice>
          Fictional menus for trying kitchen requests. No real restaurant staff
          receive these requests.
        </Notice>
      )}
      <Tabs
        options={[
          { value: "restaurants", label: "Restaurants" },
          { value: "items", label: "Menu items" },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "restaurants" ? (
        <Section title={`${visibleRestaurants.length} restaurants`}>
          {visibleRestaurants.map((restaurant) => (
            <RestaurantRow
              key={restaurant.id}
              {...{ restaurant, state, navigate }}
            />
          ))}
          {!visibleRestaurants.length && (
            <Empty title="No restaurants match">
              Try another search or area.
            </Empty>
          )}
        </Section>
      ) : (
        <>
          <Tabs options={categories} value={category} onChange={setCategory} />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: hideConflicts }}
            style={s.row}
            onPress={() => setHideConflicts(!hideConflicts)}
          >
            <Icon
              name={hideConflicts ? "checkbox" : "square-outline"}
              color={colors.orangeDark}
            />
            <Text style={s.body}>Hide known profile conflicts</Text>
          </Pressable>
          <Text style={s.small}>
            Unknown information stays visible. Select allergies in your profile
            to compare.
          </Text>
          <Section title={`${dishes.length} menu entries`}>
            {dishes.map((dish) => (
              <DishCard key={dish.id} {...{ dish, state, navigate }} />
            ))}
            {!dishes.length && (
              <Empty
                title="No menu items match"
                action="Clear filters"
                onPress={() => {
                  setQuery("");
                  setCategory("All");
                  setHideConflicts(false);
                  setDistrict("all");
                }}
              >
                Try another item or category.
              </Empty>
            )}
          </Section>
        </>
      )}
    </>
  );
}

export function Restaurant({ id, state, navigate }) {
  const [category, setCategory] = useState("All");
  const restaurant = state.restaurants.find((item) => item.id === id);
  if (!restaurant)
    return (
      <Empty
        title="Menu not found"
        action="Explore menus"
        onPress={() => navigate("explore")}
      />
    );
  const dishes = state.dishes.filter((item) => item.restaurantId === id);
  const categories = ["All", ...new Set(dishes.map((item) => item.category))];
  const filtered = rankDishes(
    dishes.filter((dish) => category === "All" || category === dish.category),
    state.profile,
    state.meals,
  );
  return (
    <>
      <Title
        eyebrow={
          isLocal(restaurant)
            ? "Orlando restaurant · public menu"
            : "Fictional sample kitchen"
        }
        title={restaurant.name}
      >
        {restaurant.description}
      </Title>
      <RestaurantSources restaurant={restaurant} />
      {isLocal(restaurant) && (
        <Notice>
          This restaurant has no connected kitchen workspace. Confirm dietary
          questions directly by phone.
        </Notice>
      )}
      <Tabs options={categories} value={category} onChange={setCategory} />
      <Section title={`${filtered.length} menu entries`}>
        {filtered.map((dish) => (
          <DishCard key={dish.id} {...{ dish, state, navigate }} />
        ))}
      </Section>
    </>
  );
}

export function DishDetail({ id, state, navigate, openSheet }) {
  const task = useTask();
  const dish = state.dishes.find((item) => item.id === id);
  if (!dish)
    return (
      <Empty
        title="Dish not found"
        action="Explore menus"
        onPress={() => navigate("explore")}
      />
    );
  const restaurant = state.restaurants.find(
    (item) => item.id === dish.restaurantId,
  );
  const local = isLocal(restaurant);
  const assessment = assessDish(dish, state.profile, state.meals);
  const saved = state.favorites.includes(id);
  const saveUnavailable =
    state.mode === "cloud" && !!dish.provenance && !dish.cloudBacked;
  const signedAction = (work) =>
    state.mode === "guest" ? navigate("auth") : work();
  return (
    <>
      <Title eyebrow={restaurant?.name} title={dish.name}>
        {dish.description}
      </Title>
      <View style={s.between}>
        <Text style={s.body}>{dish.category}</Text>
        <Text style={s.h3}>{money(dish.price)}</Text>
      </View>
      {dish.provenance?.kind === "component" && (
        <Notice>
          One menu component, not a complete order. Assess every base, protein,
          topping, sauce and wrap you choose.
        </Notice>
      )}
      <Assessment dish={dish} state={state} detailed />
      <Section title="Ingredients and preparation">
        <View style={s.card}>
          <Text style={s.h3}>Reported ingredients</Text>
          <Tags
            values={dish.ingredients}
            fallback="Full ingredients not supplied"
          />
          <Text style={s.h3}>Declared allergens</Text>
          <Tags
            values={dish.allergens}
            fallback="None declared in this record; absence is unconfirmed."
          />
          <Text style={s.h3}>Preparation and cross-contact</Text>
          <Text style={s.body}>
            {dish.preparation ||
              "Preparation information is missing. Ask the restaurant."}
          </Text>
          {!!dish.modifications?.length && (
            <>
              <Text style={s.h3}>Modifications to ask about</Text>
              <Tags values={dish.modifications} />
            </>
          )}
        </View>
      </Section>
      {local && (
        <Section title="Source record">
          <View style={s.card}>
            <Text style={s.body}>{scopeLabel(dish.provenance?.scope)}</Text>
            <Text style={s.small}>
              Reviewed {dish.provenance?.reviewedAt || "date not supplied"}.
              Review date is when the source was checked, not a restaurant
              confirmation.
            </Text>
            {!!dish.provenance?.evidenceNote && (
              <Text style={s.body}>{dish.provenance.evidenceNote}</Text>
            )}
            <Text style={s.h3}>Allergens covered by this source</Text>
            <Tags
              values={dish.provenance?.coverage || []}
              fallback="Coverage not established"
            />
            <Text style={s.h3}>Source's free-from claims</Text>
            <Tags
              values={dish.provenance?.freeFromClaims || []}
              fallback="No free-from claims recorded"
            />
            <Text style={s.small}>
              Claims describe the source. They do not establish preparation or
              cross-contact conditions at this location.
            </Text>
            <SourceLink url={dish.provenance?.menuUrl || restaurant.menuUrl}>
              Open menu source
            </SourceLink>
            <SourceLink
              url={dish.provenance?.allergenUrl || restaurant.allergenUrl}
            >
              Open allergen source
            </SourceLink>
          </View>
        </Section>
      )}
      {!!dish.tags?.length && (
        <Section title="Flavor notes">
          <Tags values={dish.tags} />
          {!!assessment.tasteReasons?.length && (
            <Text style={s.small}>
              Matches your preferences: {assessment.tasteReasons.join(", ")}
            </Text>
          )}
          {!!assessment.learnedReasons?.length && (
            <Text style={s.small}>{assessment.learnedReasons.join(". ")}</Text>
          )}
        </Section>
      )}
      {local ? (
        <>
          <Notice>
            Confirm current ingredients and cross-contact with this restaurant
            before ordering.
          </Notice>
          <SourceLink
            url={
              restaurant.phone
                ? `tel:${restaurant.phone.replace(/[^+\d]/g, "")}`
                : null
            }
            icon="call-outline"
          >
            Call {restaurant.name}
          </SourceLink>
        </>
      ) : (
        <>
          <Notice>
            Fictional sample kitchen. Responses record a practice conversation.
          </Notice>
          <Button
            icon="chatbubble-ellipses-outline"
            disabled={!restaurant?.confirmed}
            onPress={() =>
              signedAction(() => openSheet({ type: "request", dish }))
            }
          >
            {restaurant?.confirmed
              ? "Practice a kitchen request"
              : "Sample kitchen unavailable"}
          </Button>
        </>
      )}
      <View style={s.wrap}>
        <Button
          style={s.flex}
          variant="secondary"
          icon={saved ? "heart" : "heart-outline"}
          busy={task.busy}
          disabled={saveUnavailable}
          onPress={() =>
            signedAction(() => task.run(() => api.toggleFavorite(id)))
          }
        >
          {saved ? "Saved" : "Save item"}
        </Button>
        <Button
          style={s.flex}
          variant="secondary"
          icon="journal-outline"
          onPress={() => signedAction(() => openSheet({ type: "meal", dish }))}
        >
          Log a meal
        </Button>
      </View>
      {saveUnavailable && (
        <>
          <Text style={s.small}>
            Refresh the catalog before saving this item to your account.
          </Text>
          <Button
            variant="secondary"
            busy={task.busy}
            icon="refresh-outline"
            onPress={() => task.run(() => api.refresh())}
          >
            Refresh to save
          </Button>
        </>
      )}
      <ErrorText error={task.error} />
      {!!restaurant && (
        <Button
          variant="quiet"
          onPress={() => navigate(`restaurant/${restaurant.id}`)}
        >
          View restaurant and full source links
        </Button>
      )}
    </>
  );
}

export function Favorites({ state, navigate }) {
  const dishes = state.dishes.filter((item) =>
    state.favorites.includes(item.id),
  );
  return (
    <>
      <Title eyebrow="Your collection" title="Saved menu items" />
      {dishes.length ? (
        dishes.map((dish) => (
          <DishCard key={dish.id} {...{ dish, state, navigate }} />
        ))
      ) : (
        <Empty
          title="No saved items"
          icon="heart-outline"
          action="Explore menus"
          onPress={() => navigate("explore")}
        >
          Tap a menu item's heart to keep it here.
        </Empty>
      )}
    </>
  );
}
