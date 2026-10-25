import React, {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { api } from "./src/api";
import { colors, s } from "./styles";
import {
  Auth,
  Help,
  Profile,
  ProfileEditor,
  Settings,
} from "./components/Account";
import { DishDetail, Favorites, Restaurant } from "./components/Dining";
import Home, { HomeHeader, HomeTab, useHomeFonts } from "./components/Home";
import { Text, TypographyProvider } from "./components/Typography";
import MenuScanner from "./components/MenuScanner";
import { scanOwner } from "./src/menu-scan";
import Explore from "./components/Explore";
import Welcome, { HomeInfo } from "./components/Welcome";
import { History, MealComposer, MealDetail } from "./components/Journal";
import {
  Button,
  Empty,
  ErrorText,
  FormScrollContext,
  Icon,
  Notice,
} from "./components/UI";

const primaryRoutes = ["home", "explore", "scan", "history", "profile"];
const navigation = [
  {
    route: "explore",
    label: "Explore",
    icon: "compass-outline",
    active: "compass",
  },
  {
    route: "scan",
    label: "Scan",
    icon: "scan-outline",
    active: "scan",
  },
  { route: "home", label: "Home", icon: "home-outline", active: "home" },
  {
    route: "history",
    label: "Journal",
    icon: "journal-outline",
    active: "journal",
  },
  { route: "profile", label: "You", icon: "person-outline", active: "person" },
];

function parseRoute(path) {
  const [pathname, query = ""] = path.split("?");
  const [page, id] = pathname.replace(/^\//, "").split("/");
  return { page: page || "home", id, params: new URLSearchParams(query) };
}

function activeTab(page) {
  if (["dish", "restaurant"].includes(page)) return "explore";
  if (page === "meal") return "history";
  if (["settings", "help", "edit-profile", "auth"].includes(page))
    return "profile";
  return page;
}

function AppContent() {
  const homeFontsReady = useHomeFonts();
  const state = useSyncExternalStore(api.subscribe, api.getState, api.getState);
  const [stack, setStack] = useState(["home"]);
  const [sheet, setSheet] = useState(null);
  const [initError, setInitError] = useState("");
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [searchArea, setSearchArea] = useState(null);
  const [scanDraft, setScanDraft] = useState(null);
  const owner = scanOwner(state);
  useEffect(() => setScanDraft(null), [state.scanResetVersion]);
  const scroll = useRef(null);
  const path = stack[stack.length - 1];
  const route = parseRoute(path);

  const navigate = useCallback((next, { unwind = false } = {}) => {
    setSheet(null);
    setStack((current) => {
      if (current[current.length - 1] === next) return current;
      // Finishing an editor should return to its menu, not leave a saved form
      // in the back stack or duplicate that restaurant screen.
      const previous = unwind ? current.lastIndexOf(next) : -1;
      if (previous >= 0) return current.slice(0, previous + 1);
      return primaryRoutes.includes(next) ? [next] : [...current, next];
    });
  }, []);

  const goBack = useCallback(() => {
    if (sheet) {
      setSheet(null);
      return true;
    }
    if (stack.length <= 1) return false;
    setStack((current) => current.slice(0, -1));
    return true;
  }, [sheet, stack.length]);
  const clearExploreIntent = useCallback(() => navigate("explore"), [navigate]);

  useEffect(() => {
    api
      .init()
      .catch((error) =>
        setInitError(error.message || "The app could not finish starting."),
      );
    function openIncoming(url) {
      if (!url) return;
      const match = url.match(/restaurant\/([^?/#]+)/);
      if (match) {
        try {
          navigate(`restaurant/${decodeURIComponent(match[1])}`);
        } catch {
          setInitError(
            "This menu link could not be read. Find the restaurant in Explore.",
          );
        }
      }
    }
    Linking.getInitialURL()
      .then(openIncoming)
      .catch(() => {});
    const listener = Linking.addEventListener("url", (event) =>
      openIncoming(event.url),
    );
    return () => listener.remove();
  }, [navigate]);

  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", goBack);
    return () => handler.remove();
  }, [goBack]);

  const shared = { state, navigate, openSheet: setSheet };
  const showWelcome =
    state.ready && !state.user && !welcomeDone && !state.passwordRecovery;
  useEffect(() => {
    // Welcome and Home share the same route. Reset after leaving onboarding,
    // including when its account buttons were below the fold on a small phone.
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [path, showWelcome]);
  let screen;
  if (showWelcome)
    screen = (
      <Welcome
        onContinue={() => setWelcomeDone(true)}
        onSignIn={() => {
          setWelcomeDone(true);
          navigate("auth");
        }}
        onCreateAccount={() => {
          setWelcomeDone(true);
          navigate("auth?mode=signup");
        }}
      />
    );
  else if (route.page === "auth" || state.passwordRecovery)
    screen = (
      <Auth
        {...shared}
        recovery={!!state.passwordRecovery}
        initialMode={
          route.params.get("mode") === "signup" ? "signup" : "signin"
        }
        key={state.passwordRecovery ? "recovery" : path}
      />
    );
  else
    switch (route.page) {
      case "home":
        screen = (
          <Home
            {...shared}
            searchArea={searchArea}
            fontsReady={homeFontsReady}
          />
        );
        break;
      case "scan":
        screen = (
          <MenuScanner
            key={owner}
            {...shared}
            owner={owner}
            draft={scanDraft?.owner === owner ? scanDraft : null}
            setDraft={(next) => setScanDraft(next ? { ...next, owner } : null)}
          />
        );
        break;
      case "explore":
        screen = (
          <Explore
            {...shared}
            openLocation={route.params.get("location") === "1"}
            onLocationChange={setSearchArea}
            initialCuisine={route.params.get("cuisine")}
            initialQuery={route.params.get("q")}
            onInitialFiltersApplied={clearExploreIntent}
          />
        );
        break;
      case "restaurant":
        screen = <Restaurant {...shared} id={route.id} />;
        break;
      case "dish":
        screen = <DishDetail {...shared} id={route.id} />;
        break;
      case "history":
        screen = <History {...shared} initialTab={route.params.get("tab")} />;
        break;
      case "meal":
        screen = <MealDetail {...shared} id={route.id} />;
        break;
      case "favorites":
        screen = <Favorites {...shared} />;
        break;
      case "profile":
        screen = <Profile {...shared} />;
        break;
      case "edit-profile":
        screen = (
          <ProfileEditor {...shared} returnTo={route.params.get("returnTo")} />
        );
        break;
      case "settings":
        screen = <Settings {...shared} />;
        break;
      case "help":
        screen = <Help {...shared} />;
        break;
      default:
        screen = (
          <Empty
            title="Page not found"
            action="Back home"
            onPress={() => navigate("home")}
          />
        );
    }

  return (
    <TypographyProvider fontsReady={homeFontsReady}>
      <SafeAreaView
        edges={["top", "bottom"]}
        style={[s.root, showWelcome && { backgroundColor: "#17281F" }]}
      >
        <StatusBar
          barStyle={showWelcome ? "light-content" : "dark-content"}
          backgroundColor={showWelcome ? "#17281F" : colors.cream}
        />
        {route.page === "home" && !showWelcome ? (
          <HomeHeader
            fontsReady={homeFontsReady}
            navigate={navigate}
            onInfo={() => setSheet({ type: "info" })}
          />
        ) : (
          !showWelcome && (
            <View style={s.header}>
              {stack.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  onPress={goBack}
                  style={s.iconButton}
                >
                  <Icon name="arrow-back" />
                </Pressable>
              ) : (
                <Image
                  source={require("./assets/verifed-mark.png")}
                  style={s.mark}
                  accessibilityLabel="Verifed carrot checkmark"
                />
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Verifed home"
                onPress={() => navigate("home")}
                style={{ flexShrink: 1, minWidth: 0 }}
              >
                <Text style={s.brand} numberOfLines={1}>
                  verifed<Text style={s.brandDot}>.</Text>
                </Text>
              </Pressable>
              <View style={s.headerRight}>
                {!showWelcome && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Change location"
                    onPress={() => navigate("explore?location=1")}
                    style={{
                      flexShrink: 1,
                      minWidth: 0,
                      minHeight: 44,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={[s.mode, { maxWidth: 80 }]} numberOfLines={1}>
                      {searchArea?.label || "ORLANDO"}
                    </Text>
                  </Pressable>
                )}
                {route.page === "home" && !showWelcome && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="About Verifed"
                    onPress={() => setSheet({ type: "info" })}
                    style={s.iconButton}
                  >
                    <Icon name="information-circle-outline" />
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open saved dishes"
                  onPress={() => navigate("favorites")}
                  style={s.iconButton}
                >
                  <Icon name="heart-outline" />
                </Pressable>
              </View>
            </View>
          )
        )}
        {!state.ready ? (
          <View
            style={[s.flex, s.empty, { justifyContent: "center", padding: 22 }]}
          >
            <ActivityIndicator color={colors.orange} size="large" />
            <Text style={s.h2}>Loading menus…</Text>
            <ErrorText error={initError} />
            {!!initError && (
              <Button
                onPress={() => {
                  setInitError("");
                  api.init().catch((error) => setInitError(error.message));
                }}
              >
                Try again
              </Button>
            )}
          </View>
        ) : (
          <KeyboardAvoidingView
            style={s.flex}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <FormScrollContext.Provider value={scroll}>
              <ScrollView
                ref={scroll}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[
                  s.scroll,
                  showWelcome && {
                    flexGrow: 1,
                    padding: 0,
                    paddingBottom: 0,
                    maxWidth: 480,
                  },
                ]}
              >
                <View
                  key={`${state.mode}:${state.user?.id || "guest"}:${path}`}
                  style={[s.section, showWelcome && { flex: 1, gap: 0 }]}
                >
                  {!!state.error && <Notice conflict>{state.error}</Notice>}
                  {!!initError && <ErrorText error={initError} />}
                  {screen}
                </View>
              </ScrollView>
            </FormScrollContext.Provider>
          </KeyboardAvoidingView>
        )}
        {!showWelcome && (
          <View style={s.nav}>
            {navigation.map((item) => {
              const selected = activeTab(route.page) === item.route;
              return (
                <Pressable
                  key={item.route}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  aria-selected={selected}
                  accessibilityLabel={item.label}
                  onPress={() => {
                    if (item.route === "home" && selected)
                      scroll.current?.scrollTo({ y: 0, animated: true });
                    navigate(item.route);
                  }}
                  style={s.navItem}
                >
                  {item.route === "home" ? (
                    <HomeTab selected={selected} fontsReady={homeFontsReady} />
                  ) : (
                    <Icon
                      name={selected ? item.active : item.icon}
                      color={selected ? colors.green : colors.muted}
                      size={23}
                    />
                  )}
                  {item.route !== "home" && (
                    <Text style={[s.navText, selected && s.navTextActive]}>
                      {item.label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
        {sheet?.type === "info" && <HomeInfo onClose={() => setSheet(null)} />}
        {sheet?.type === "meal" && (
          <MealComposer {...shared} {...sheet} onClose={() => setSheet(null)} />
        )}
      </SafeAreaView>
    </TypographyProvider>
  );
}

class AppBoundary extends Component {
  state = { error: null, version: 0 };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <SafeAreaView
          style={[s.root, s.empty, { justifyContent: "center", padding: 24 }]}
        >
          <Icon name="leaf-outline" color={colors.green} size={40} />
          <Text style={s.h2}>Verifed needs to restart.</Text>
          <ErrorText
            error={this.state.error.message || "This screen could not open."}
          />
          <Button
            onPress={() =>
              this.setState((current) => ({
                error: null,
                version: current.version + 1,
              }))
            }
          >
            Reopen app
          </Button>
        </SafeAreaView>
      );
    return <AppContent key={this.state.version} />;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppBoundary />
    </SafeAreaProvider>
  );
}
