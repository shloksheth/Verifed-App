import React, { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { colors, s } from "../styles";
import { discoverRestaurants } from "../src/discovery";
import { ORLANDO_CENTER, searchPlaces } from "../src/location-search";
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
  { value: "all-nine", label: "All 9 source-free" },
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
  const results = useMemo(
    () =>
      discoverRestaurants({
        restaurants: state.restaurants,
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
      <Title eyebrow="Around your table" title="Good food. Your way.">
        Find local menus that fit your appetite, your area, and your needs.
      </Title>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change search area"
        onPress={() => setShowLocation(!showLocation)}
        style={s.discoveryArea}
      >
        <Icon name="location" color={colors.green} />
        <View style={{ flex: 1 }}>
          <Text style={s.discoveryAreaLabel}>LOOKING AROUND</Text>
          <Text style={s.h3}>
            {filters.center?.label || "All Orlando-area locations"}
          </Text>
        </View>
        <Icon name={showLocation ? "chevron-up" : "chevron-down"} size={18} />
      </Pressable>
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
            City search: GeoNames / Open-Meteo. Catalog ZIPs and neighborhoods
            use the approximate center of our address points. No GPS access.
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
        label="Search restaurants & menus"
        value={filters.query}
        onChangeText={(query) => update({ query })}
        placeholder="Woodlands, tacos, or a favorite dish…"
        clearButtonMode="while-editing"
      />
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
      <View style={s.discoverySummary}>
        <Text style={s.h2}>
          {groups.size} places · {results.length} locations
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
            ? "Dietary fit comes first. Your rated meals and preferences help order the results."
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
          title="No matching tables yet"
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
      {cards.map(({ group, result }) => (
        <View
          key={result.restaurant.chainId || result.restaurant.id}
          style={s.discoveryResult}
        >
          <RestaurantRow
            restaurant={result.restaurant}
            state={state}
            navigate={navigate}
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
        <Sheet
          title="Make it your kind of meal"
          onClose={() => setShowFilters(false)}
        >
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
        <Sheet
          title="Choose a Taco Bell location"
          onClose={() => setBranches(null)}
        >
          <Text style={s.small}>
          Choose a branch to open its menu.
          </Text>
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
