import {
  ArrowUpRight,
  BookOpen,
  ChefHat,
  Clock3,
  Compass,
  Heart,
  Home,
  ScanLine,
  Sparkles,
  UserRound,
} from "lucide-react";
import { api } from "../api";
import { Button, ErrorMessage, useTask } from "./UI";

const navigation = [
  { id: "home", label: "Home", icon: Home },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "scan", label: "Scan", icon: ScanLine },
  { id: "history", label: "History", icon: Clock3 },
  { id: "profile", label: "Profile", icon: UserRound },
];
export function Logo({ small = false }) {
  return (
    <span className={`logo ${small ? "small" : ""}`}>
      <img className="brand-mark" src="/assets/verifed-mark.png" alt="" />
      <span>verifed</span>
    </span>
  );
}

export default function Shell({ children, page, state, navigate }) {
  const task = useTask();
  const active = ["restaurant", "dish", "favorites"].includes(page)
    ? "explore"
    : page === "request"
      ? "home"
      : page === "meal"
        ? "history"
        : ["settings", "help", "onboarding"].includes(page)
          ? "profile"
          : page;
  const workspace = page === "workspace";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand-button"
          onClick={() => navigate("home")}
          aria-label="Verifed home"
        >
          <Logo />
        </button>
        <div className="sidebar-caption">Your menu. Your requirements.</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${active === id && !workspace ? "active" : ""}`}
              onClick={() => navigate(id)}
              aria-current={active === id && !workspace ? "page" : undefined}
            >
              <Icon size={21} />
              {label}
              {id === "scan" && <span className="nav-pill">QR</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => navigate("favorites")}>
            <Heart size={20} />
            Saved dishes
          </button>
          <button
            className={`nav-item ${workspace ? "active" : ""}`}
            onClick={() => navigate("workspace")}
          >
            <ChefHat size={20} />
            Restaurant space
            <ArrowUpRight size={14} />
          </button>
          <button className="nav-item" onClick={() => navigate("help")}>
            <BookOpen size={20} />
            How Verifed works
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-brand brand-button"
            onClick={() => navigate("home")}
          >
            <Logo small />
          </button>
          <div className="breadcrumb">
            Verifed <span> / </span>
            <strong>
              {workspace
                ? "Restaurant space"
                : navigation.find((item) => item.id === active)?.label ||
                  "Verifed"}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="sample-label">
              <i />
              {state.mode === "cloud"
                ? "Connected · Orlando menus"
                : state.mode === "demo"
                  ? "Local demo · sample menus"
                  : "Orlando menus"}
            </span>
            <button
              className="avatar"
              aria-label="Your profile"
              onClick={() => navigate("profile")}
            >
              {state.profile?.name?.slice(0, 1)?.toUpperCase() || (
                <UserRound size={18} />
              )}
            </button>
          </div>
        </header>
        {state.mode === "guest" && (
          <div className="guest-banner">
            <p>Explore Orlando menus, or try the fictional diner and kitchen demo.</p>
            <Button
              variant="small"
              busy={task.busy}
              onClick={() => task.run(() => api.enterDemo())}
            >
              Try demo <ArrowUpRight size={14} />
            </Button>
            <ErrorMessage error={task.error} />
          </div>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="main-content"
          key={page}
        >
          {children}
        </main>
        <footer className="site-footer">
          <Logo small />
          <span>Ingredients, requirements, and kitchen conversations.</span>
          <button onClick={() => navigate("help")}>About & privacy</button>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={active === id && !workspace ? "active" : ""}
            onClick={() => navigate(id)}
            aria-current={active === id && !workspace ? "page" : undefined}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
