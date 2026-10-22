import { Component, useEffect, useState, useSyncExternalStore } from "react";
import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import { api } from "./api";
import Shell from "./components/Shell";
import { DishDetail, Explore, Home, Restaurant } from "./components/Dining";
import { RequestComposer, RequestDetail } from "./components/Requests";
import {
  Favorites,
  HistoryPage,
  MealComposer,
  MealDetail,
} from "./components/Journal";
import {
  Auth,
  Help,
  Profile,
  ProfileEditor,
  SettingsPage,
} from "./components/Account";
import Scanner from "./components/Scanner";
import Workspace from "./components/Workspace";
import { Button, Empty } from "./components/UI";

function readRoute() {
  const [path, search = ""] = window.location.hash
    .replace(/^#\/?/, "")
    .split("?");
  const [page = "home", id] = path.split("/");
  return { page: page || "home", id, params: new URLSearchParams(search) };
}

// Data remains in the API store. React only owns navigation and temporary form state.
export default function App() {
  const state = useSyncExternalStore(api.subscribe, api.getState);
  const [route, setRoute] = useState(readRoute);
  const [composer, setComposer] = useState(null);
  const [meal, setMeal] = useState(null);
  useEffect(() => {
    api.init().catch(() => {}); // The store exposes connection errors to the banner.
    const onHashChange = () => {
      setRoute(readRoute());
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  useEffect(() => {
    document.title = `${route.page.charAt(0).toUpperCase() + route.page.slice(1)} · Verifed`;
  }, [route.page]);
  function navigate(path) {
    setComposer(null);
    setMeal(null);
    if (window.location.hash === `#/${path}`) {
      setRoute(readRoute());
      window.scrollTo({ top: 0, behavior: "instant" });
    } else window.location.hash = `/${path}`;
  }
  const shared = { state, navigate };
  if (!state.ready)
    return (
      <div className="app-loading">
        <LoaderCircle size={32} className="spin" />
        <h1>Setting your table…</h1>
        <p>Getting your profile and menus ready.</p>
      </div>
    );
  if (
    route.page === "auth" ||
    route.page === "reset-password" ||
    state.passwordRecovery
  )
    return (
      <Auth
        {...shared}
        recovery={route.page === "reset-password" || state.passwordRecovery}
      />
    );
  let screen;
  switch (route.page) {
    case "home":
      screen = <Home {...shared} />;
      break;
    case "explore":
      screen = <Explore {...shared} />;
      break;
    case "restaurant":
      screen = <Restaurant {...shared} id={route.id} />;
      break;
    case "dish":
      screen = (
        <DishDetail
          {...shared}
          id={route.id}
          onRequest={(dish) => setComposer({ dish })}
          onMeal={(dish) => setMeal({ dish })}
        />
      );
      break;
    case "request":
      screen = (
        <RequestDetail
          {...shared}
          id={route.id}
          onEdit={(dish, existing) => setComposer({ dish, existing })}
          onMeal={(dish) => setMeal({ dish })}
        />
      );
      break;
    case "history":
      screen = (
        <HistoryPage
          {...shared}
          initialTab={route.params.get("tab")}
          onMeal={(dish) => setMeal({ dish })}
        />
      );
      break;
    case "meal":
      screen = (
        <MealDetail
          {...shared}
          id={route.id}
          onEdit={(entry) =>
            setMeal({
              entry,
              dish: state.dishes.find((item) => item.id === entry.dishId),
            })
          }
        />
      );
      break;
    case "favorites":
      screen = <Favorites {...shared} />;
      break;
    case "scan":
      screen = <Scanner {...shared} />;
      break;
    case "profile":
      screen = <Profile {...shared} />;
      break;
    case "onboarding":
      screen = <ProfileEditor {...shared} />;
      break;
    case "settings":
      screen = <SettingsPage {...shared} />;
      break;
    case "workspace":
      screen = (
        <Workspace {...shared} initialRequest={route.params.get("request")} />
      );
      break;
    case "help":
      screen = <Help {...shared} />;
      break;
    default:
      screen = (
        <Empty
          icon={AlertCircle}
          title="This table isn't set yet"
          action={<Button onClick={() => navigate("home")}>Back home</Button>}
        >
          That page doesn't exist. Let's find your way back.
        </Empty>
      );
  }
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <Shell {...shared} page={route.page}>
        {state.connection === "error" && (
          <div className="connection-banner" role="alert">
            <AlertCircle size={18} />
            <p>
              {state.error ||
                "Unable to connect. Your changes have not been saved to the server."}
            </p>
            <Button
              variant="small"
              onClick={() => api.refresh().catch(() => {})}
            >
              <RefreshCw size={14} />
              Retry
            </Button>
          </div>
        )}
        <ScreenBoundary key={`${route.page}/${route.id || ""}`}>
          {screen}
        </ScreenBoundary>
      </Shell>
      {composer && (
        <RequestComposer
          {...shared}
          {...composer}
          onClose={() => setComposer(null)}
        />
      )}{" "}
      {meal && (
        <MealComposer {...shared} {...meal} onClose={() => setMeal(null)} />
      )}
    </>
  );
}

class ScreenBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("Verifed screen error", error);
  }
  render() {
    return this.state.failed ? (
      <Empty
        icon={AlertCircle}
        title="We couldn't open this page"
        action={
          <Button onClick={() => window.location.reload()}>Reload app</Button>
        }
      >
        Your saved data hasn't been changed. Reload to try again.
      </Empty>
    ) : (
      this.props.children
    );
  }
}
