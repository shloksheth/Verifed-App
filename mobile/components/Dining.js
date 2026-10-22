import React, { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { api } from "../src/api";
import { assessDish, rankDishes } from "../src/domain";
import { dietaryMenuStatus, groupMenu } from "../src/menu-filter";
import { colors, s } from "../styles";
import AllergenIcons, {
  AllergenLegend,
  hasUnknownAllergenCoverage,
} from "./AllergenIcons";
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
  inline = false,
  accent = colors.orangeDark,
}) {
  const task = useTask();
  if (!url) return null;
  return (
    <View style={style}>
      {inline ? (
        <Pressable
          accessibilityRole="button"
          disabled={task.busy}
          onPress={() => task.run(() => Linking.openURL(url))}
          style={s.menuInlineLink}
        >
          <Icon name={icon} size={15} color={accent} />
          <Text style={[s.menuInlineLinkText, { color: accent }]}>
            {children}
          </Text>
        </Pressable>
      ) : (
        <Button
          variant="secondary"
          icon={icon}
          busy={task.busy}
          style={compact && { paddingHorizontal: 10 }}
          onPress={() => task.run(() => Linking.openURL(url))}
        >
          {children}
        </Button>
      )}
      <ErrorText error={task.error} />
    </View>
  );
}

function RestaurantSources({
  restaurant,
  editorial = false,
  accent = colors.orangeDark,
}) {
  const [expanded, setExpanded] = useState(false);
  if (!isLocal(restaurant))
    return (
      <Notice>Fictional sample kitchen. Requests here are for practice.</Notice>
    );
  return (
    <View style={editorial ? s.menuSource : s.card}>
      <Text selectable style={editorial ? s.menuCaption : s.body}>
        {restaurant.address || restaurant.location}
      </Text>
      <Text style={editorial ? s.menuCaption : s.small}>
        {scopeLabel(restaurant.source?.scope)} · Reviewed{" "}
        {restaurant.source?.reviewedAt || "date not supplied"}
      </Text>
      <View style={s.row}>
        <SourceLink
          url={restaurant.menuUrl}
          style={!editorial && s.flex}
          compact
          inline={editorial}
          accent={accent}
        >
          Official menu
        </SourceLink>
        <SourceLink
          url={
            restaurant.phone
              ? `tel:${restaurant.phone.replace(/[^+\d]/g, "")}`
              : null
          }
          icon="call-outline"
          style={!editorial && s.flex}
          compact
          inline={editorial}
          accent={accent}
        >
          Call
        </SourceLink>
        {editorial && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sources and location"
            accessibilityState={{ expanded }}
            aria-expanded={expanded}
            onPress={() => setExpanded(!expanded)}
            style={s.menuInlineLink}
          >
            <Text style={[s.menuInlineLinkText, { color: accent }]}>
              Sources
            </Text>
            <Icon
              name={expanded ? "chevron-up" : "chevron-down"}
              size={15}
              color={accent}
            />
          </Pressable>
        )}
      </View>
      {!editorial && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          aria-expanded={expanded}
          onPress={() => setExpanded(!expanded)}
          style={[s.between, { minHeight: 44 }]}
        >
          <Text style={s.link}>Sources and location</Text>
          <Icon name={expanded ? "chevron-up" : "chevron-down"} size={18} />
        </Pressable>
      )}
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
      <AllergenIcons dish={dish} />
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

function restaurantTheme(restaurant) {
  const slug = restaurant.slug || restaurant.id;
  if (slug.startsWith("hawkers"))
    return {
      accent: "#8C352C",
      tint: "#F2E5DA",
      wordmark: "Hawkers",
      edition: "01",
    };
  if (slug.startsWith("fresh-kitchen"))
    return {
      accent: "#285D47",
      tint: "#E8EEE3",
      wordmark: "Fresh Kitchen",
      edition: "02",
    };
  if (slug.startsWith("chipotle"))
    return {
      accent: "#722C35",
      tint: "#F1E6E0",
      wordmark: "Chipotle",
      edition: "03",
    };
  return {
    accent: colors.orangeDark,
    tint: colors.peach,
    wordmark: restaurant.name,
    edition: "MENU",
  };
}

function MenuSections({
  dishes,
  accent,
  navigate,
  profile,
  showMissing = false,
  showSupport = false,
}) {
  return groupMenu(dishes).map((group) => (
    <View key={group.category} style={s.editorialMenuSection}>
      <View style={[s.editorialCategoryHeading, { borderBottomColor: accent }]}>
        <Text
          accessibilityRole="header"
          style={[s.editorialCategoryTitle, { color: accent }]}
        >
          {group.category}
        </Text>
        <Text style={s.menuCategoryCount}>
          {String(group.dishes.length).padStart(2, "0")}
        </Text>
      </View>
      {group.dishes.map((dish) => {
        const missing = showMissing
          ? dietaryMenuStatus(dish, profile).missing
          : [];
        const supported =
          showSupport && dietaryMenuStatus(dish, profile).level === "match";
        const supportLine = supported
          ? "Reported: " +
            [
              ...(profile.allergies || []).map(
                (allergen) =>
                  `${allergen === "Tree nuts" ? "Tree nut" : allergen === "Peanuts" ? "Peanut" : allergen}-free`,
              ),
              ...(profile.restrictions || []),
            ].join(" · ")
          : "";
        const declarations = [
          ...(dish.allergens || []),
          ...(dish.otherDeclaredAllergens || []),
        ];
        const declarationLabel = declarations.length
          ? ` Declared allergens: ${declarations.join(", ")}.`
          : supported
            ? ""
            : " No allergens declared; check details.";
        return (
          <Pressable
            key={dish.id}
            accessibilityRole="button"
            accessibilityLabel={`View ${dish.name}.${supported ? ` ${supportLine}.` : ""}${declarationLabel}${!supported && hasUnknownAllergenCoverage(dish) ? " Allergen coverage is incomplete." : ""}`}
            onPress={() => navigate(`dish/${dish.id}`)}
            style={s.editorialMenuRow}
          >
            <View style={[s.between, { alignItems: "flex-start" }]}>
              <Text style={s.editorialItemName}>{dish.name}</Text>
              <Text style={s.editorialItemPrice}>{money(dish.price)}</Text>
            </View>
            {(!!dish.description || dish.provenance?.kind === "component") && (
              <Text style={s.editorialItemDescription} numberOfLines={2}>
                {dish.provenance?.kind === "component" ? "Component · " : ""}
                {dish.description || "Choose this as part of an order."}
              </Text>
            )}
            {supported && (
              <Text style={[s.menuCaption, { color: accent }]}>
                {supportLine}
              </Text>
            )}
            <AllergenIcons
              dish={dish}
              showUnknown={!supported}
              showEmpty={!supported}
            />
            {!!missing.length && (
              <Text style={s.menuConfirmationText}>
                Confirm: {missing.join(", ")}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  ));
}

export function Restaurant({ id, state, navigate }) {
  const needs = [
    ...(state.profile.allergies || []),
    ...(state.profile.restrictions || []),
  ];
  const [mode, setMode] = useState(() => (needs.length ? "diet" : "full"));
  const [showUnknown, setShowUnknown] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);
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
  const theme = restaurantTheme(restaurant);
  const assessed = dishes.map((dish) => ({
    dish,
    status: dietaryMenuStatus(dish, state.profile),
  }));
  const matches = assessed
    .filter(({ status }) => status.level === "match")
    .map(({ dish }) => dish);
  const unknown = assessed
    .filter(({ status }) => status.level === "unknown")
    .map(({ dish }) => dish);
  const conflicts = assessed.filter(
    ({ status }) => status.level === "conflict",
  );
  const editNeeds = () =>
    navigate(`edit-profile?returnTo=${encodeURIComponent(`restaurant/${id}`)}`);
  return (
    <View style={s.restaurantMenu}>
      <View style={[s.editorialMenuHeader, { borderTopColor: theme.accent }]}>
        <View style={s.between}>
          <Text style={[s.menuOverline, { color: theme.accent }]}>
            {isLocal(restaurant)
              ? "ORLANDO / RESTAURANT MENU"
              : "FICTIONAL SAMPLE MENU"}
          </Text>
          <Text style={[s.menuEdition, { color: theme.accent }]}>
            {theme.edition}
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          accessibilityLabel={restaurant.name}
          style={[s.menuWordmark, { color: theme.accent }]}
        >
          {theme.wordmark}
        </Text>
        <Text style={s.menuLocation}>{restaurant.location}</Text>
      </View>
      <RestaurantSources
        restaurant={restaurant}
        editorial
        accent={theme.accent}
      />
      <View style={[s.menuDietSummary, { backgroundColor: theme.tint }]}>
        <View style={s.flex}>
          <Text style={[s.menuOverline, { color: theme.accent }]}>
            YOUR DIETARY NEEDS
          </Text>
          <Text style={s.menuNeedsText}>
            {needs.length
              ? needs.join(" · ")
              : "Choose allergies or dietary restrictions"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={editNeeds}
          style={s.menuEditNeeds}
        >
          <Text style={[s.menuInlineLinkText, { color: theme.accent }]}>
            {needs.length ? "Edit" : "Choose"}
          </Text>
          <Icon name="chevron-forward" size={14} color={theme.accent} />
        </Pressable>
      </View>
      <View style={s.menuModeSwitch} accessibilityRole="tablist">
        {[
          { value: "diet", label: "For my diet" },
          { value: "full", label: "Full menu" },
        ].map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === item.value }}
            aria-selected={mode === item.value}
            onPress={() => setMode(item.value)}
            style={[
              s.menuMode,
              mode === item.value && { backgroundColor: theme.accent },
            ]}
          >
            <Text
              style={[
                s.menuModeText,
                mode === item.value && { color: "#FFFFFF" },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.menuCaption}>
        Restaurant-reported information, not certification. Confirm
        cross-contact and local availability with staff.
      </Text>
      <AllergenLegend accent={theme.accent} />
      {mode === "full" ? (
        <>
          <View style={s.menuListIntro}>
            <View style={s.between}>
              <Text style={[s.menuListTitle, { color: theme.accent }]}>
                The menu
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: showCoverage }}
                aria-expanded={showCoverage}
                onPress={() => setShowCoverage(!showCoverage)}
                style={s.menuInlineLink}
              >
                <Text style={[s.menuInlineLinkText, { color: theme.accent }]}>
                  What this menu covers
                </Text>
                <Icon
                  name={showCoverage ? "chevron-up" : "chevron-down"}
                  size={13}
                  color={theme.accent}
                />
              </Pressable>
            </View>
            <Text style={s.menuCaption}>
              {dishes.length} cataloged food items · branch availability may
              vary
            </Text>
            {showCoverage && (
              <Text style={s.menuCaption}>
                {restaurant.menuCoverage ||
                  "Food items currently cataloged from the linked public sources. This is not a verified inventory for this branch."}
              </Text>
            )}
          </View>
          <View style={s.menuPaper}>
            <MenuSections {...{ dishes, navigate }} accent={theme.accent} />
          </View>
        </>
      ) : !needs.length ? (
        <View style={s.menuEmptyState}>
          <Text style={s.menuListTitle}>Make this menu yours</Text>
          <Text style={s.body}>
            Choose your allergies and dietary restrictions to see items with
            explicit restaurant support for your needs.
          </Text>
          <Button variant="secondary" onPress={editNeeds}>
            Choose dietary needs
          </Button>
        </View>
      ) : (
        <>
          <View style={s.menuListIntro}>
            <Text style={[s.menuListTitle, { color: theme.accent }]}>
              Restaurant-reported matches
            </Text>
            <Text style={s.menuCaption}>
              {matches.length} {matches.length === 1 ? "item" : "items"}{" "}
              explicitly support every selected need.
            </Text>
            {!!matches.length && (
              <Text style={s.menuCaption}>
                Matches cover your selected needs; other allergens and
                preparation may need confirmation.
              </Text>
            )}
          </View>
          {matches.length ? (
            <View style={s.menuPaper}>
              <MenuSections
                dishes={matches}
                navigate={navigate}
                accent={theme.accent}
                profile={state.profile}
                showSupport
              />
            </View>
          ) : (
            <View style={s.menuEmptyState}>
              <Text style={s.h3}>No supported matches yet</Text>
              <Text style={s.body}>
                {unknown.length
                  ? "The available sources do not explicitly support all your selected needs. Open the items needing confirmation below."
                  : conflicts.length
                    ? "The cataloged items have known conflicts with your needs. Open the full menu to review their declarations."
                    : "No food items are available in this catalog yet."}
              </Text>
            </View>
          )}
          {!!unknown.length && (
            <View style={s.menuUnknownSection}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: showUnknown }}
                aria-expanded={showUnknown}
                onPress={() => setShowUnknown(!showUnknown)}
                style={s.menuUnknownToggle}
              >
                <View style={s.flex}>
                  <Text style={s.h3}>
                    Needs confirmation ({unknown.length})
                  </Text>
                  <Text style={s.menuCaption}>
                    Missing explicit support for one or more needs
                  </Text>
                </View>
                <Icon
                  name={showUnknown ? "remove" : "add"}
                  color={theme.accent}
                />
              </Pressable>
              {showUnknown && (
                <View style={s.menuPaper}>
                  <MenuSections
                    dishes={unknown}
                    navigate={navigate}
                    accent={theme.accent}
                    showMissing
                    profile={state.profile}
                  />
                </View>
              )}
            </View>
          )}
          {!!conflicts.length && (
            <Text style={s.menuCaption}>
              {conflicts.length} items with known conflicts are excluded from
              this view.
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => setMode("full")}
            style={s.menuInlineLink}
          >
            <Text style={[s.menuInlineLinkText, { color: theme.accent }]}>
              Browse the full menu
            </Text>
            <Icon name="arrow-forward" size={16} color={theme.accent} />
          </Pressable>
        </>
      )}
    </View>
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
          {!!dish.otherDeclaredAllergens?.length && (
            <>
              <Text style={s.h3}>Other declared allergens</Text>
              <Tags values={dish.otherDeclaredAllergens} />
            </>
          )}
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
