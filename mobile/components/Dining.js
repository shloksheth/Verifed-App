import React, { useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { api } from "../src/api";
import { assessDish } from "../src/domain";
import { chainBrand } from "../src/chain-brand";
import TacoBellMenu, { isTacoBell } from "./TacoBellMenu";
import { menuPhotoFor, restaurantFoodPhoto } from "../src/menu-photos";
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
} from "./UI";

const isLocal = (restaurant) => restaurant?.fictional === false;
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
  const hints = dish.ingredientHints || {};
  const inferredFlag =
    (state.profile.allergies || []).some((allergen) =>
      [...(hints.allergens || []), ...(hints.possibleAllergens || [])].includes(
        allergen,
      ),
    ) ||
    (state.profile.restrictions || []).some((restriction) =>
      (hints.restrictionConflicts || []).includes(restriction),
    );
  const message =
    result.level === "conflict"
      ? `${inferredFlag ? "Check your dietary flags" : "Known profile conflict"}${detailed ? ": " + result.conflicts.join(", ") : ""}`
      : result.level === "unknown"
        ? "Ingredient details"
        : "Menu information";
  return (
    <View style={s.stack}>
      <Notice conflict={result.level === "conflict"}>{message}</Notice>
      {detailed && result.level === "conflict" && !!result.reasons?.length && (
        <View style={s.card}>
          <Text style={s.h3}>Why this result</Text>
          {result.reasons
            .filter((reason) =>
              /^(Listed allergen:|Ingredient clue to check:|Named ingredients may conflict)/.test(
                reason,
              ),
            )
            .map((reason) => (
              <Text key={reason} style={s.body}>
                {reason}
              </Text>
            ))}
        </View>
      )}
      {detailed &&
        result.level === "unknown" &&
        !!dietaryMenuStatus(dish, state.profile).missing.length && (
          <Text style={s.small}>
            Not listed:{" "}
            {dietaryMenuStatus(dish, state.profile).missing.join(", ")}
          </Text>
        )}
    </View>
  );
}

// A menu entry can have an exact official product photo or a clearly labeled
// representative image from that restaurant. Imagery never influences allergies.
function DishPhoto({ dish, restaurant, large = false }) {
  const [failed, setFailed] = useState(false);
  const photo = menuPhotoFor(dish, restaurant);
  const dimensions = large ? s.menuDishPhotoLarge : s.menuDishPhoto;
  if (!photo || failed) return null;
  return (
    <View style={large ? s.menuDishPhotoLargeFrame : s.menuDishPhotoFrame}>
      <Image
        source={{ uri: photo.url }}
        accessibilityLabel={photo.exact ? photo.alt : `${photo.alt}. Restaurant photography, not this specific menu item.`}
        resizeMode="contain"
        style={dimensions}
        onError={() => setFailed(true)}
      />
      <Text style={s.menuPhotoType} numberOfLines={1}>
        {photo.exact ? "Menu item" : "Restaurant photo"}
      </Text>
    </View>
  );
}

export function FoodArt({ dish, large }) {
  if (dish.provenance || dish.imageUrl)
    return <DishPhoto dish={dish} large={large} />;
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
      <DishPhoto dish={dish} restaurant={restaurant} />
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
          onPress={() => task.run(() => api.toggleFavorite(dish.id))}
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

// Venue photos help identify a restaurant; they never stand in for a specific dish.
function RestaurantPhoto({ restaurant, style, credit = false }) {
  const [failed, setFailed] = useState(false);
  const [usingOriginal, setUsingOriginal] = useState(false);
  const task = useTask();
  const preferred = restaurantFoodPhoto(restaurant);
  const hasBackup = !!restaurant.imageUrl && restaurant.imageUrl !== preferred?.url;
  const displayed = !usingOriginal && preferred
    ? {
        ...restaurant,
        imageUrl: preferred.url,
        imageAlt: preferred.alt,
        imageKind: "brand-food",
        imageCredit: { label: preferred.credit, url: preferred.sourceUrl },
      }
    : restaurant;
  const creditLabel =
    typeof displayed.imageCredit === "string"
      ? displayed.imageCredit
      : displayed.imageCredit?.label;
  const creditUrl = displayed.imageCredit?.url;
  return (
    <View style={[s.restaurantPhoto, style]}>
      {displayed.imageUrl && !failed ? (
        <Image
          source={{ uri: displayed.imageUrl }}
          resizeMode={
            displayed.imageKind === "brand-art" ? "contain" : "cover"
          }
          style={[
            s.photoFill,
            restaurant.imageKind === "brand-art" && {
              backgroundColor: "#FFFDF8",
            },
          ]}
          accessibilityLabel={
            displayed.imageAlt || `${restaurant.name} restaurant photography`
          }
          onError={() => {
            if (!usingOriginal && preferred && hasBackup) setUsingOriginal(true);
            else setFailed(true);
          }}
        />
      ) : (
        <View style={s.photoFallback}>
          <Icon name="restaurant-outline" size={34} color={colors.green} />
          <Text style={s.photoFallbackText}>
            {restaurant.cuisine || "Local dining"}
          </Text>
        </View>
      )}
      {credit && !!creditLabel && (
        <Pressable
          accessibilityRole={creditUrl ? "link" : "text"}
          accessibilityLabel={`Photo source: ${creditLabel}`}
          disabled={!creditUrl || task.busy}
          onPress={() => task.run(() => Linking.openURL(creditUrl))}
          style={s.photoCredit}
        >
          <Text style={s.photoCreditText}>
            {creditLabel}
            {creditUrl ? " ↗" : ""}
          </Text>
        </Pressable>
      )}
      {!!task.error && <ErrorText error={task.error} />}
    </View>
  );
}

export function RestaurantRow({
  restaurant,
  state,
  navigate,
  featured = false,
  onPress,
}) {
  const items = state.dishes.filter(
    (dish) => dish.restaurantId === restaurant.id,
  );
  const needs = [...state.profile.allergies, ...state.profile.restrictions];
  const supported = needs.length
    ? items.filter(
        (dish) => dietaryMenuStatus(dish, state.profile).level === "match",
      ).length
    : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name}, ${restaurant.location}, ${items.length} menu entries`}
      onPress={onPress || (() => navigate(`restaurant/${restaurant.id}`))}
      style={({ pressed }) => [
        featured ? s.featuredRestaurant : s.restaurantRow,
        pressed && { opacity: 0.8 },
      ]}
    >
      <RestaurantPhoto
        restaurant={restaurant}
        style={featured ? s.featuredPhoto : s.restaurantThumbnail}
      />
      <View style={[s.restaurantCopy, featured && { padding: 14 }]}>
        <Text style={s.restaurantCuisine}>
          {restaurant.cuisine || "Orlando dining"}
        </Text>
        <Text style={s.restaurantName} numberOfLines={2}>
          {restaurant.name}
        </Text>
        <Text style={s.small} numberOfLines={1}>
          {restaurant.location}
        </Text>
        <View style={[s.row, { gap: 5, marginTop: 5 }]}>
          <Icon name="reader-outline" size={13} color={colors.green} />
          <Text style={s.sourceText}>{items.length} menu entries</Text>
        </View>
        {!!supported && (
          <Text style={s.restaurantMatch}>
            {supported} reported matches for you
          </Text>
        )}
      </View>
      {!featured && (
        <Icon name="chevron-forward" size={17} color={colors.green} />
      )}
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
  const restaurants = state.restaurants.filter(isLocal);
  const cover =
    restaurants.find(
      (restaurant) => restaurant.slug === "black-rooster-mills",
    ) || restaurants[0];
  const needs = [...state.profile.allergies, ...state.profile.restrictions];
  const totalItems = state.dishes.filter((dish) =>
    restaurants.some((restaurant) => restaurant.id === dish.restaurantId),
  ).length;
  return (
    <>
      <View style={s.homeIntro}>
        <View style={s.locationPill}>
          <Icon name="location-outline" size={14} color={colors.green} />
          <Text style={s.locationText}>YOUR ORLANDO TABLE</Text>
        </View>
        <Text accessibilityRole="header" style={s.homeHeadline}>
          A seat for every appetite.
        </Text>
        <Text style={s.homeSubtitle}>
          Local menus. Your dietary needs. A little more clarity before you
          order.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Explore Orlando restaurant menus"
        onPress={() => navigate("explore")}
        style={s.homePhotoCard}
      >
        <RestaurantPhoto restaurant={cover || {}} style={s.homePhoto} />
        <View style={s.homePhotoCaption}>
          <View style={s.flex}>
            <Text style={s.homePhotoEyebrow}>
              {restaurants.length} LOCATIONS · {totalItems} MENU ENTRIES
            </Text>
            <Text style={s.homePhotoTitle}>Good food starts here.</Text>
          </View>
          <View style={s.roundArrow}>
            <Icon name="arrow-forward" size={22} color={colors.paper} />
          </View>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit your dietary needs"
        onPress={() => navigate("edit-profile")}
        style={s.needsCard}
      >
        <View style={s.needsIcon}>
          <Icon name="leaf-outline" color={colors.green} size={22} />
        </View>
        <View style={s.flex}>
          <Text style={s.h3}>
            {needs.length ? "Made around your needs" : "Make the menu yours"}
          </Text>
          <Text style={s.small} numberOfLines={2}>
            {needs.length
              ? needs.join(" · ")
              : "Choose allergies and dietary restrictions"}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.green} />
      </Pressable>
      <Section
        title="Around your table"
        action="See all"
        onPress={() => navigate("explore")}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.featuredRail}
        >
          {restaurants.slice(0, 5).map((restaurant) => (
            <RestaurantRow
              key={restaurant.id}
              {...{ restaurant, state, navigate }}
              featured
            />
          ))}
        </ScrollView>
      </Section>
      <View style={s.howPanel}>
        <Text style={s.eyebrow}>KNOW BEFORE YOU GO</Text>
        <Text style={s.h2}>Less guesswork at the table.</Text>
        {[
          [
            "01",
            "Choose your needs",
            "Set the allergies and restrictions that matter to you.",
          ],
          [
            "02",
            "Read your menu",
            "See the full menu, ingredient clues, and options for your needs.",
          ],
          [
            "03",
            "Ask one better question",
            "Open the source or call about ingredients and preparation.",
          ],
        ].map(([number, title, text]) => (
          <View key={number} style={s.howRow}>
            <Text style={s.howNumber}>{number}</Text>
            <View style={s.flex}>
              <Text style={s.h3}>{title}</Text>
              <Text style={s.small}>{text}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={s.sourceFootnote}>
        Explore Orlando-area menus. Save favorites and track meals you enjoy.
      </Text>
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

function restaurantTheme(restaurant) {
  const brand = chainBrand(restaurant);
  if (brand) return brand;
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
  restaurant,
  accent,
  navigate,
  profile,
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
          ...new Set([
            ...(dish.allergens || []),
            ...(dish.ingredientHints?.allergens || []),
            ...(dish.otherDeclaredAllergens || []),
          ]),
        ];
        const possibleFlags = dish.ingredientHints?.possibleAllergens || [];
        const declarationLabel = declarations.length
          ? ` Allergen flags: ${declarations.join(", ")}.`
          : supported
            ? ""
            : " No allergens declared; check details.";
        return (
          <Pressable
            key={dish.id}
            accessibilityRole="button"
            accessibilityLabel={`View ${dish.name}.${supported ? ` ${supportLine}.` : ""}${declarationLabel}${possibleFlags.length ? ` Check ingredients: ${possibleFlags.join(", ")}.` : ""}${!supported && hasUnknownAllergenCoverage(dish) ? " Allergen coverage is incomplete." : ""}`}
            onPress={() => navigate(`dish/${dish.id}`)}
            style={s.editorialMenuRow}
          >
            <View style={s.menuDishLayout}>
              <DishPhoto dish={dish} restaurant={restaurant} />
              <View style={s.menuDishBody}>
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
              </View>
            </View>
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
  const [showUnknown, setShowUnknown] = useState(true);
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
  if (isTacoBell(restaurant)) {
    return (
      <TacoBellMenu
        restaurant={restaurant}
        dishes={dishes}
        profile={state.profile}
        favorites={state.favorites}
        navigate={navigate}
      />
    );
  }
  const theme = restaurantTheme(restaurant);
  // RestaurantPhoto selects a food cover with a fallback to venue imagery.
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
      <RestaurantPhoto restaurant={restaurant} style={s.menuHeroPhoto} credit />
      <View style={[s.editorialMenuHeader, { borderTopColor: theme.accent, backgroundColor: theme.background || "transparent", padding: theme.background ? 18 : undefined, borderRadius: theme.background ? 18 : 0 }]}>
        <View style={s.between}>
          <Text style={[s.menuOverline, { color: theme.accent }]}>
            {chainBrand(restaurant) ? "FOOD CHAINS / U.S. MENU" : isLocal(restaurant)
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
      <AllergenLegend accent={theme.accent} />
      <Text style={s.menuCaption}>
        Only verified item photographs appear beside dishes; some dishes have
        no photo yet. Menu banners may use general restaurant photography.
        Images do not establish ingredient or allergen safety.
      </Text>
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
            <Text style={s.menuCaption}>{dishes.length} food items</Text>
            {showCoverage && (
              <Text style={s.menuCaption}>
                {restaurant.menuCoverage ||
                  "Food items currently cataloged from the linked public sources. This is not a verified inventory for this branch."}
              </Text>
            )}
          </View>
          <View style={s.menuPaper}>
            <MenuSections {...{ dishes, navigate, restaurant }} accent={theme.accent} />
          </View>
        </>
      ) : !needs.length ? (
        <View style={s.menuEmptyState}>
          <Text style={s.menuListTitle}>Make this menu yours</Text>
          <Text style={s.body}>
            Choose your allergies and dietary restrictions to compare this menu
            and explore options for your needs.
          </Text>
          <Button variant="secondary" onPress={editNeeds}>
            Choose dietary needs
          </Button>
        </View>
      ) : (
        <>
          {!!matches.length && (
            <View style={s.menuListIntro}>
              <Text style={[s.menuListTitle, { color: theme.accent }]}>
                Restaurant-reported matches
              </Text>
              <Text style={s.menuCaption}>
                {matches.length} {matches.length === 1 ? "item" : "items"}{" "}
                explicitly support every selected need.
              </Text>
            </View>
          )}
          {matches.length ? (
            <View style={s.menuPaper}>
              <MenuSections
                dishes={matches}
                restaurant={restaurant}
                navigate={navigate}
                accent={theme.accent}
                profile={state.profile}
                showSupport
              />
            </View>
          ) : !unknown.length ? (
            <View style={s.menuEmptyState}>
              <Text style={s.h3}>No matching options found</Text>
              <Text style={s.body}>
                {conflicts.length
                  ? "The cataloged items have reported or ingredient-based flags for your needs. Open the full menu to review them."
                  : "No food items are available in this catalog yet."}
              </Text>
            </View>
          ) : null}
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
                  <Text style={s.h3}>Possible options ({unknown.length})</Text>
                  <Text style={s.menuCaption}>
                    No known conflict in the available information
                  </Text>
                </View>
                <Icon
                  name={showUnknown ? "remove" : "add"}
                  color={theme.accent}
                />
              </Pressable>
              {showUnknown && (
                <View style={s.stack}>
                  <View style={s.menuPaper}>
                    <MenuSections
                      dishes={unknown}
                      restaurant={restaurant}
                      navigate={navigate}
                      accent={theme.accent}
                      profile={state.profile}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
          {!!conflicts.length && (
            <Text style={s.menuCaption}>
              {conflicts.length} items with dietary flags are excluded from this
              view.
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
  const [showSource, setShowSource] = useState(false);
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
  return (
    <>
      <Title eyebrow={restaurant?.name} title={dish.name}>
        {dish.description}
      </Title>
      <View style={s.between}>
        <Text style={s.body}>{dish.category}</Text>
        <Text style={s.h3}>{money(dish.price)}</Text>
      </View>
      <DishPhoto dish={dish} restaurant={restaurant} large />
      {dish.provenance?.kind === "component" && <Notice>Menu component</Notice>}
      <Assessment dish={dish} state={state} detailed />
      {!!dish.ingredientHints?.clues?.length && (
        <Section title="Clues in the published menu">
          <View style={s.card}>
            {dish.ingredientHints.clues.map((clue) => (
              <Text key={clue} style={s.body}>
                {clue}
              </Text>
            ))}
            <Text style={s.small}>Ingredient clues use menu wording.</Text>
          </View>
        </Section>
      )}
      <Section title="Ingredients">
        <View style={s.card}>
          <Text style={s.h3}>Reported ingredients</Text>
          <Tags
            values={dish.ingredients}
            fallback="Full ingredients not supplied"
          />
          <Text style={s.h3}>Declared allergens</Text>
          <Tags values={dish.allergens} fallback="Not listed" />
          {!!dish.otherDeclaredAllergens?.length && (
            <>
              <Text style={s.h3}>Other declared allergens</Text>
              <Tags values={dish.otherDeclaredAllergens} />
            </>
          )}
          {!!dish.modifications?.length && (
            <>
              <Text style={s.h3}>Modifications to ask about</Text>
              <Tags values={dish.modifications} />
            </>
          )}
        </View>
      </Section>
      {local && (
        <Section
          title="Source details"
          action={showSource ? "Hide" : "Show"}
          onPress={() => setShowSource(!showSource)}
        >
          {showSource && (
            <View style={s.card}>
              <Text style={s.body}>{scopeLabel(dish.provenance?.scope)}</Text>
              <Text style={s.small}>
                Reviewed {dish.provenance?.reviewedAt || "date not supplied"}.
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
              {!!dish.preparation && (
                <Text style={s.small}>{dish.preparation}</Text>
              )}
              <SourceLink url={dish.provenance?.menuUrl || restaurant.menuUrl}>
                Open menu source
              </SourceLink>
              <SourceLink
                url={dish.provenance?.allergenUrl || restaurant.allergenUrl}
              >
                Open allergen source
              </SourceLink>
            </View>
          )}
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
      {local && (
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
      )}
      <View style={s.wrap}>
        <Button
          style={s.flex}
          variant="secondary"
          icon={saved ? "heart" : "heart-outline"}
          busy={task.busy}
          disabled={saveUnavailable}
          onPress={() => task.run(() => api.toggleFavorite(id))}
        >
          {saved ? "Saved" : "Save item"}
        </Button>
        <Button
          style={s.flex}
          variant="secondary"
          icon="journal-outline"
          onPress={() => openSheet({ type: "meal", dish })}
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
  const realIds = new Set(
    state.restaurants.filter(isLocal).map((restaurant) => restaurant.id),
  );
  const dishes = state.dishes.filter(
    (item) =>
      state.favorites.includes(item.id) && realIds.has(item.restaurantId),
  );
  return (
    <>
      <Title eyebrow="Your collection" title="Your next good meal.">
        {state.mode === "guest"
          ? "Saved on this device. No account needed."
          : "Your saved menu items, ready for next time."}
      </Title>
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
          Save the menu items you want to ask about or try next.
        </Empty>
      )}
    </>
  );
}
