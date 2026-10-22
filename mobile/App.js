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
  Text,
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
import {
  DishDetail,
  Explore,
  Favorites,
  Home,
  Restaurant,
} from "./components/Dining";
import { History, MealComposer, MealDetail } from "./components/Journal";
import { RequestComposer, RequestDetail } from "./components/Requests";
import Scanner from "./components/Scanner";
import Workspace, { KitchenRequest } from "./components/Workspace";
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
  { route: "home", label: "Home", icon: "home-outline", active: "home" },
  {
    route: "explore",
    label: "Explore",
    icon: "compass-outline",
    active: "compass",
  },
  { route: "scan", label: "Scan", icon: "scan-outline", active: "scan" },
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
  if (["dish", "restaurant", "favorites"].includes(page)) return "explore";
  if (["meal", "request"].includes(page)) return "history";
  if (
    [
      "settings",
      "help",
      "edit-profile",
      "workspace",
      "kitchen-request",
      "auth",
    ].includes(page)
  )
    return "profile";
  return page;
}

function AppContent() {
  const state = useSyncExternalStore(api.subscribe, api.getState, api.getState);
  const [stack, setStack] = useState(["home"]);
  const [sheet, setSheet] = useState(null);
  const [initError, setInitError] = useState("");
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
            "This menu link could not be read. Enter its code on the Scan tab.",
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

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [path]);

  const shared = { state, navigate, openSheet: setSheet };
  let screen;
  if (route.page === "auth" || state.passwordRecovery)
    screen = (
      <Auth
        {...shared}
        recovery={!!state.passwordRecovery}
        key={state.passwordRecovery ? "recovery" : "auth"}
      />
    );
  else
    switch (route.page) {
      case "home":
        screen = <Home {...shared} />;
        break;
      case "explore":
        screen = <Explore {...shared} />;
        break;
      case "scan":
        screen = <Scanner {...shared} />;
        break;
      case "restaurant":
        screen = <Restaurant {...shared} id={route.id} />;
        break;
      case "dish":
        screen = <DishDetail {...shared} id={route.id} />;
        break;
      case "request":
        screen = <RequestDetail {...shared} id={route.id} />;
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
        screen = <ProfileEditor {...shared} returnTo={route.params.get("returnTo")} />;
        break;
      case "settings":
        screen = <Settings {...shared} />;
        break;
      case "help":
        screen = <Help {...shared} />;
        break;
      case "workspace":
        screen = <Workspace {...shared} />;
        break;
      case "kitchen-request":
        screen = <KitchenRequest {...shared} id={route.id} />;
        break;
      default:
        screen = (
          <Empty
            title="This table isn't set yet"
            action="Back home"
            onPress={() => navigate("home")}
          />
        );
    }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />
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
        >
          <Text style={s.brand}>
            verifed<Text style={s.brandDot}>.</Text>
          </Text>
        </Pressable>
        <View style={s.headerRight}>
          <Text style={s.mode}>
            {state.mode === "demo"
              ? "LOCAL DEMO"
              : state.mode === "cloud"
                ? "CONNECTED"
                : "WELCOME"}
          </Text>
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
      {!state.ready ? (
        <View
          style={[s.flex, s.empty, { justifyContent: "center", padding: 22 }]}
        >
          <ActivityIndicator color={colors.orange} size="large" />
          <Text style={s.h2}>Setting your table…</Text>
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
              contentContainerStyle={s.scroll}
            >
              <View
                key={`${state.mode}:${state.user?.id || "guest"}:${path}`}
                style={s.section}
              >
                {!!state.error && <Notice conflict>{state.error}</Notice>}
                {!!initError && <ErrorText error={initError} />}
                {screen}
              </View>
            </ScrollView>
          </FormScrollContext.Provider>
        </KeyboardAvoidingView>
      )}
      <View style={s.nav}>
        {navigation.map((item) => {
          const selected = activeTab(route.page) === item.route;
          return (
            <Pressable
              key={item.route}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={item.label}
              onPress={() => navigate(item.route)}
              style={s.navItem}
            >
              {item.route === "scan" ? (
                <View style={s.scanNav}>
                  <Icon name="scan-outline" color={colors.paper} size={25} />
                </View>
              ) : (
                <Icon
                  name={selected ? item.active : item.icon}
                  color={selected ? colors.orangeDark : colors.muted}
                  size={23}
                />
              )}
              <Text style={[s.navText, selected && s.navTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {sheet?.type === "request" && (
        <RequestComposer
          {...shared}
          {...sheet}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.type === "meal" && (
        <MealComposer {...shared} {...sheet} onClose={() => setSheet(null)} />
      )}
    </SafeAreaView>
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
          <Text style={s.h2}>Let's set the table again.</Text>
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
