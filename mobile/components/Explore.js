import { Text } from "./Typography";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { colors, s } from "../styles";
import { discoverRestaurants } from "../src/discovery";
import { prioritizeFeaturedMenus, featuredMenuSlugs, featuredMenuCoverKeys } from "../src/featured-menus";
import { localFoodAssets } from "../src/local-food-assets";
import { forest } from "../src/warm-forest";
import { Image } from "./MenuImage";
import { chainBrand } from "../src/chain-brand";
import { ORLANDO_CENTER, searchPlaces } from "../src/location-search";
import { homeCuisine } from "../src/home-content";
import { RestaurantRow } from "./Dining";
import RestaurantMap from "./RestaurantMap";
import {
  Button,
  Empty,
  ErrorText,
  Field,
  Icon,
  Sheet,
  Tabs,
  Title,
} from "./UI";

const modes = [
  { value: "all", label: "All menus" },
  { value: "options", label: "Possible options" },
  { value: "reported", label: "Reported matches" },
  { value: "selected-free", label: "Selected allergens free" },
  { value: "all-nine", label: "Source excludes all 9" },
];
const notes = {
  all: "Compare published menus. Open a restaurant to see its full menu or your dietary options.",
  options:
    "No listed ingredient conflict. Additional ingredient details needed.",
  reported: "Source labels support every selected dietary need.",
  "selected-free":
    "Source labels exclude each selected allergen and support your dietary needs.",
  "all-nine":
    "Source labels exclude the nine major allergens plus other selected allergies, and support your dietary needs.",
};
// Keep choices while opening a menu and returning. No location leaves this screen
// unless the person explicitly submits a location search.
let remembered = {
  center: ORLANDO_CENTER,
  radius: 25,
  cuisine: "All",
  dietMode: "all",
  sort: "recommended",
  query: "",
  view: "list",
  collection: "all",
};

function distance(result) {
  return result.distanceMiles === null
    ? ""
    : `${result.distanceMiles < 0.1 ? "<0.1" : result.distanceMiles.toFixed(1)} mi`;
}

export default function Explore({
  state,
  navigate,
  openLocation = false,
  onLocationChange,
  initialCuisine,
  initialQuery,
  onInitialFiltersApplied,
}) {
  const [filters, setFilters] = useState(remembered);
  const [locationText, setLocationText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showLocation, setShowLocation] = useState(openLocation);
  const [locationMode, setLocationMode] = useState("area");
  const [choices, setChoices] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState(null);
  const request = useRef(null);
  useEffect(() => {
    remembered = filters;
  }, [filters]);
  useEffect(() => {
    // Home submits a real search; an empty submission clears earlier filters.
    if (initialQuery !== null && initialQuery !== undefined) {
      const next = {
        ...remembered,
        query: initialQuery,
        cuisine: "All",
        collection: "all",
      };
      // Clearing the route remounts this screen. Persist the intent first.
      remembered = next;
      setFilters(next);
      onInitialFiltersApplied?.();
    }
  }, [initialQuery, onInitialFiltersApplied]);
  useEffect(
    () => () => {
      // Clear ownership before aborting: the rejected request must not update
      // a screen that has already been left.
      const pending = request.current;
      request.current = null;
      pending?.abort();
    },
    [],
  );
  const update = (changes) => {
    setFilters((value) => ({ ...value, ...changes }));
    if (Object.prototype.hasOwnProperty.call(changes, "center"))
      onLocationChange?.(changes.center);
  };
  const restaurants = state.restaurants.filter(
    (place) => place.fictional === false,
  );
  const cuisines = [
    "All",
    ...new Set(restaurants.map((place) => place.cuisine).filter(Boolean)),
  ];
  useEffect(() => {
    const cuisine = homeCuisine(
      [
        ...new Set(
          state.restaurants.map((place) => place.cuisine).filter(Boolean),
        ),
      ],
      initialCuisine,
    );
    if (cuisine) {
      const next = {
        ...remembered,
        cuisine,
        query: "",
        collection: "all",
      };
      remembered = next;
      setFilters(next);
      onInitialFiltersApplied?.();
    }
  }, [initialCuisine, state.restaurants, onInitialFiltersApplied]);
  const results = useMemo(
    () =>
      discoverRestaurants({
        restaurants: state.restaurants.filter((restaurant) =>
          filters.collection === "chains"
            ? !!chainBrand(restaurant)
            : filters.collection === "restaurants"
              ? !chainBrand(restaurant)
              : true,
        ),
        dishes: state.dishes,
        profile: state.profile,
        meals: state.meals,
        ...filters,
        radiusMiles: filters.radius,
      }),
    [state.restaurants, state.dishes, state.profile, state.meals, filters],
  );
  const groups = new Map();
  results.forEach((result) => {
    const key = result.restaurant.chainId || result.restaurant.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(result);
  });
  // Keep the first ranked branch as the chain card's representative. When
  // sorting nearest, that is already the nearest branch. Pins stay individual.
  const cards = [...groups.values()].map((group) => ({
    group,
    result: group[0],
  }));
  const orderedCards =
    filters.sort === "recommended" ? prioritizeFeaturedMenus(cards) : cards;
  const featuredCards = orderedCards.filter(({ group }) =>
    group.some(({ restaurant }) => featuredMenuSlugs.includes(restaurant.slug))
  ).slice(0, 5);
  const showFeatured = filters.sort === "recommended" && !filters.query.trim() &&
    filters.cuisine === "All" && filters.collection === "all" &&
    filters.dietMode === "all" && filters.view === "list";
  const needs = [...state.profile.allergies, ...state.profile.restrictions];
  async function findLocation() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    setChoices([]);
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const found = await searchPlaces(locationText, restaurants, {
        signal: controller.signal,
        mode: locationMode,
      });
      if (request.current !== controller || controller.signal.aborted) return;
      if (found.length === 1) {
        update({ center: found[0] });
        setShowLocation(false);
      } else setChoices(found);
    } catch (failure) {
      if (request.current === controller)
        setError(
          controller.signal.aborted
            ? "Search timed out. Try again or choose an Orlando ZIP code."
            : failure.message,
        );
    } finally {
      clearTimeout(timer);
      if (request.current === controller) setBusy(false);
    }
  }
  return (
    <>
      <View style={f.header}>
        <Text accessibilityRole="header" style={f.heading}>Explore</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Change search area"
          onPress={() => setShowLocation(!showLocation)} style={f.locationPill}>
          <Icon name="location-outline" color={forest.green} size={16} />
          <Text numberOfLines={1} style={f.locationText}>
            {filters.center?.label || "All locations"}
          </Text>
          <Icon name={showLocation ? "chevron-up" : "chevron-down"} size={15}
            color={forest.green} />
        </Pressable>
      </View>
      <Text style={f.intro}>Compare restaurant menus and published dietary information.</Text>
      {showLocation && (
        <View style={s.card}>
          <Tabs
            options={[
              { value: "area", label: "City / ZIP" },
              { value: "address", label: "Street address" },
            ]}
            value={locationMode}
            onChange={(mode) => {
              const pending = request.current;
              request.current = null;
              pending?.abort();
              setBusy(false);
              setError("");
              setChoices([]);
              setLocationText("");
              setLocationMode(mode);
            }}
          />
          <Field
            label={
              locationMode === "address"
                ? "U.S. street address"
                : "City, ZIP, or neighborhood"
            }
            value={locationText}
            onChangeText={setLocationText}
            placeholder={
              locationMode === "address"
                ? "123 Main St, Orlando, FL"
                : "Orlando, 32803, or Mills 50"
            }
            autoCapitalize="words"
            onSubmitEditing={findLocation}
          />
          <Button icon="search" busy={busy} onPress={findLocation}>
            {locationMode === "address" ? "Find address" : "Find area"}
          </Button>
          {locationMode === "address" && (
            <Text style={s.small}>
              Find address sends this address to the U.S. Census geocoder. The
              result estimates a point along the street range. No GPS access;
              the address stays out of your account and journal.
            </Text>
          )}
          <ErrorText error={error} />
          {choices.map((place, index) => (
            <Button
              key={`${place.label}-${index}`}
              variant="secondary"
              onPress={() => {
                update({ center: place });
                setShowLocation(false);
                setChoices([]);
              }}
            >
              {place.label}
            </Button>
          ))}
          <Button
            variant="secondary"
            onPress={() => {
              request.current?.abort();
              request.current = null;
              setBusy(false);
              update({ center: null });
              setShowLocation(false);
            }}
          >
            Show entire catalog
          </Button>
          <Text style={s.small}>
            Search uses an approximate area. Your GPS location is not accessed.
          </Text>
          <Button
            variant="secondary"
            onPress={() =>
              Linking.openURL(
                locationMode === "address"
                  ? "https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html"
                  : "https://open-meteo.com/en/docs/geocoding-api",
              ).catch(() => setError("Could not open location credits."))
            }
          >
            Location credits
          </Button>
        </View>
      )}
      <Field
        label="Search menus"
        value={filters.query}
        onChangeText={(query) => update({ query })}
        placeholder="Restaurant, dish or ingredient"
        clearButtonMode="while-editing"
        style={f.searchInput}
      />
      <View style={f.collectionBar}>
        {[
          { value: "all", label: "All" },
          { value: "restaurants", label: "Local restaurants" },
          { value: "chains", label: "Food chains" },
        ].map((item) => (
          <Pressable key={item.value} accessibilityRole="tab"
            accessibilityState={{ selected: filters.collection === item.value }}
            onPress={() => update({ collection: item.value, cuisine: "All" })}
            style={[f.collectionPill, filters.collection === item.value && f.collectionSelected]}>
            <Text style={[f.collectionText, filters.collection === item.value && f.collectionTextSelected]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Tabs
        options={cuisines.map((value) => ({
          value,
          label: value === "All" ? "All cuisines" : value,
        }))}
        value={filters.cuisine}
        onChange={(cuisine) => update({ cuisine })}
      />
      <View style={s.between}>
        <Tabs
          options={[
            { value: "list", label: "List" },
            { value: "map", label: "Map" },
          ]}
          value={filters.view}
          onChange={(view) => update({ view })}
        />
        <Button
          variant="secondary"
          icon="options-outline"
          onPress={() => setShowFilters(true)}
        >
          Filters
        </Button>
      </View>
      {showFeatured && !!featuredCards.length && (
        <View style={f.featuredSection}>
          <View style={f.sectionHead}>
            <Text accessibilityRole="header" style={f.sectionTitle}>Featured menus</Text>
            <Text style={f.helpText}>Complete food photos</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={f.featuredRail}>
            {featuredCards.map(({ group, result }) => {
              const matching = group.find(({ restaurant }) =>
                featuredMenuSlugs.includes(restaurant.slug))?.restaurant || result.restaurant;
              const photo = localFoodAssets[featuredMenuCoverKeys[matching.slug]];
              return (
                <Pressable key={matching.slug} accessibilityRole="button"
                  accessibilityLabel={`View ${matching.name} featured menu`}
                  onPress={() => group.length > 1 ? setBranches(group) : navigate(`restaurant/${result.restaurant.id}`)}
                  style={({ pressed }) => [f.featuredCard, pressed && { opacity: 0.82 }]}>
                  <View style={f.featuredPhoto}>
                    {photo ? <Image source={photo} contentFit="contain"
                      style={f.image} accessibilityLabel={`Menu example from ${matching.name}`} /> :
                      <Icon name="restaurant-outline" size={26} color={forest.green} />}
                  </View>
                  <Text numberOfLines={2} style={f.featuredName}>{matching.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
      <View style={f.sectionHead}>
        <Text accessibilityRole="header" style={f.sectionTitle}>All restaurants</Text>
        <Pressable onPress={() => setShowFilters(true)} accessibilityRole="button"
          accessibilityLabel="Sort and filter restaurants" style={f.sortButton}>
          <Icon name="options-outline" color={forest.green} size={17} />
          <Text style={f.sortText}>Sort & filter</Text>
        </Pressable>
      </View>
      <View style={s.discoverySummary}>
        <Text style={f.resultsCount}>
          {groups.size} menus · {results.length} locations
        </Text>
        <Text style={s.small}>
          {modes.find((mode) => mode.value === filters.dietMode)?.label} ·{" "}
          {filters.center ? `Within ${filters.radius} miles` : "Entire catalog"}{" "}
          ·{" "}
          {filters.sort === "recommended"
            ? "Recommended"
            : filters.sort === "nearest"
              ? "Nearest first"
              : filters.sort === "dietary"
                ? "Dietary fit"
                : "A–Z"}
        </Text>
        <Text style={s.small}>
          {filters.sort === "recommended"
            ? "Featured menus first, then suggestions based on your needs and meal ratings."
            : "Distance is straight-line from your selected area, not a driving route."}
        </Text>
        {filters.dietMode !== "all" && (
          <Text style={s.small}>{notes[filters.dietMode]}</Text>
        )}
      </View>
      {filters.view === "map" && !!results.length && (
        <RestaurantMap
          results={results}
          center={filters.center}
          onSelect={(id) => navigate(`restaurant/${id}`)}
        />
      )}
      {!results.length && (
        <Empty
          title="No restaurants found"
          action="Reset filters"
          onPress={() =>
            setFilters({
              ...remembered,
              center: ORLANDO_CENTER,
              radius: 25,
              cuisine: "All",
              query: "",
              dietMode: "all",
              sort: "recommended",
            })
          }
        >
          {filters.dietMode === "all-nine"
            ? "Current sources do not explicitly establish all-nine-free items for these results. Try possible options to review ingredient information."
            : filters.dietMode !== "all" && !needs.length
              ? "Select your allergies and dietary needs in You, then try this filter."
              : "Try a wider radius, another cuisine, or fewer filters. Our current menus cover the Orlando area."}
        </Empty>
      )}
      {orderedCards.map(({ group, result }) => (
        <View
          key={result.restaurant.chainId || result.restaurant.id}
          style={[s.discoveryResult, f.resultCard]}
        >
          <RestaurantRow
            restaurant={result.restaurant}
            state={state}
            navigate={navigate}
            surfaceStyle={f.rowSurface}
            onPress={group.length > 1 ? () => setBranches(group) : undefined}
          />
          <View style={s.discoveryReason}>
            <View style={s.between}>
              <Text style={s.discoveryDistance}>{distance(result)}</Text>
              {group.length > 1 && (
                <Button variant="secondary" onPress={() => setBranches(group)}>
                  Choose location ({group.length})
                </Button>
              )}
            </View>
            {result.reasons.slice(0, 2).map((reason) => (
              <Text key={reason} style={s.small}>
                {reason}
              </Text>
            ))}
            {!!result.restaurant.chainId && (
              <Text style={s.small}>National chain menu</Text>
            )}
          </View>
        </View>
      ))}
      {showFilters && (
        <Sheet title="Filters" onClose={() => setShowFilters(false)}>
          <Text style={s.h3}>Distance from your search area</Text>
          <Tabs
            options={[5, 10, 25, 50].map((value) => ({
              value,
              label: `${value} mi`,
            }))}
            value={filters.radius}
            onChange={(radius) => update({ radius })}
          />
          {!filters.center && (
            <Text style={s.small}>Choose a search area to apply distance.</Text>
          )}
          <Text style={s.h3}>Dietary information</Text>
          <Text style={s.small}>
            {needs.length
              ? `Your needs: ${needs.join(", ")}`
              : "Select dietary needs in You to personalize these filters."}
          </Text>
          {modes.map((mode) => (
            <Pressable
              key={mode.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: filters.dietMode === mode.value }}
              onPress={() => update({ dietMode: mode.value })}
              style={[
                s.discoveryOption,
                filters.dietMode === mode.value && {
                  backgroundColor: colors.paleGreen,
                },
              ]}
            >
              <Icon
                name={
                  filters.dietMode === mode.value
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                color={colors.green}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.h3}>{mode.label}</Text>
                <Text style={s.small}>{notes[mode.value]}</Text>
              </View>
            </Pressable>
          ))}
          <Text style={s.h3}>Sort results</Text>
          <Tabs
            options={[
              { value: "recommended", label: "For you" },
              { value: "nearest", label: "Nearest" },
              { value: "dietary", label: "Dietary fit" },
              { value: "name", label: "A–Z" },
            ]}
            value={filters.sort}
            onChange={(sort) => update({ sort })}
          />
          <Button onPress={() => setShowFilters(false)}>
            Show {results.length} locations
          </Button>
        </Sheet>
      )}
      {!!branches && (
        <Sheet title="Choose a location" onClose={() => setBranches(null)}>
          <Text style={s.small}>Choose a branch to open its menu.</Text>
          {branches.map((result) => (
            <Pressable
              key={result.restaurant.id}
              accessibilityRole="button"
              style={s.discoveryOption}
              onPress={() => {
                setBranches(null);
                navigate(`restaurant/${result.restaurant.id}`);
              }}
            >
              <Icon name="location-outline" color={colors.green} />
              <View style={{ flex: 1 }}>
                <Text style={s.h3}>{result.restaurant.address}</Text>
                <Text style={s.small}>
                  {distance(result)} · {result.menuCount} published entries
                </Text>
              </View>
              <Icon name="chevron-forward" />
            </Pressable>
          ))}
        </Sheet>
      )}
    </>
  );
}


const f = StyleSheet.create({
  header: { flexDirection:"row", alignItems:"center", gap:10, justifyContent:"space-between" },
  heading: { color:forest.ink, fontSize:31, lineHeight:38, fontWeight:"700", letterSpacing:-0.6 },
  intro: { color:forest.muted, fontSize:13, lineHeight:19, marginTop:-11 },
  locationPill: { flexDirection:"row", alignItems:"center", maxWidth:"58%",
    gap:4, borderRadius:24, paddingHorizontal:10, minHeight:42,
    backgroundColor:forest.surface },
  locationText: { color:forest.green, fontSize:11, fontWeight:"600", flexShrink:1 },
  searchInput: { backgroundColor:forest.cardMuted, borderColor:forest.line,
    borderRadius:22, fontSize:15, color:forest.ink },
  collectionBar: { flexDirection:"row", gap:7, flexWrap:"wrap" },
  collectionPill: { borderRadius:23, paddingHorizontal:12, paddingVertical:10,
    minHeight:43, justifyContent:"center", backgroundColor:forest.surface },
  collectionSelected: { backgroundColor:forest.green },
  collectionText: { color:forest.ink, fontSize:12, fontWeight:"600" },
  collectionTextSelected: { color:forest.lightText },
  featuredSection: { gap:9 },
  sectionHead: { flexDirection:"row", justifyContent:"space-between",
    alignItems:"center", gap:10 },
  sectionTitle: { fontWeight:"700", color:forest.ink, fontSize:19, lineHeight:26 },
  helpText: { color:forest.muted, fontSize:11, flexShrink:1 },
  featuredRail: { gap:10, paddingRight:4 },
  featuredCard: { width:123, backgroundColor:forest.card,
    overflow:"hidden", borderRadius:15, paddingBottom:7 },
  featuredPhoto: { width:"100%", height:125,
    backgroundColor:forest.surface, alignItems:"center", justifyContent:"center" },
  image: { width:"100%", height:"100%" },
  featuredName: { color:forest.ink, fontSize:12, lineHeight:17,
    fontWeight:"700", paddingHorizontal:9, paddingTop:7 },
  sortButton: { flexDirection:"row", alignItems:"center", gap:6,
    borderRadius:23, backgroundColor:forest.surface, minHeight:44, paddingHorizontal:12 },
  sortText: { color:forest.green, fontSize:12, fontWeight:"600" },
  resultsCount: { color:forest.ink, fontSize:13, fontWeight:"700" },
  resultCard: { backgroundColor:forest.card, borderRadius:17, padding:9, gap:5,
    marginBottom:1, overflow:"hidden" },
  rowSurface: { backgroundColor:forest.card },
});
