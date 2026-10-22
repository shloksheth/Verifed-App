import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChefHat,
  ChevronRight,
  Download,
  Heart,
  HelpCircle,
  Info,
  Leaf,
  LockKeyhole,
  LogOut,
  Mail,
  Settings,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { api } from "../api";
import { googleAuthEnabled } from "../config";
import { ALLERGENS, RESTRICTIONS, TASTE_TAGS } from "../data";
import { Logo } from "./Shell";
import {
  Button,
  Dialog,
  Empty,
  ErrorMessage,
  Field,
  PageTitle,
  ToggleChips,
  useTask,
} from "./UI";

export function Auth({ state, navigate, recovery = false, authError = "" }) {
  const [mode, setMode] = useState(recovery ? "recover" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  const task = useTask();
  function changeMode(next) {
    setMode(next);
    setNotice("");
    task.setError("");
  }
  function submit(event) {
    event.preventDefault();
    task.run(async () => {
      if (mode === "reset") {
        await api.resetPassword(email);
        setNotice(
          "If this address has an account, a reset link will arrive by email.",
        );
      } else if (mode === "recover") {
        await api.updatePassword(password);
        navigate("home");
      } else if (mode === "signup") {
        const result = await api.signUp(email, password, name);
        if (result.verificationRequired)
          setNotice("Check your email to confirm your account, then sign in.");
        else navigate("onboarding");
      } else {
        await api.signIn(email, password);
        navigate("home");
      }
    });
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Logo />
        <div>
          <span className="eyebrow">YOUR DINING COMPANION</span>
          <h1>
            A clearer conversation
            <br />
            about your food.
          </h1>
          <p>
            Browse menus, share your requirements, and keep track of what the
            kitchen tells you.
          </p>
          <img src="/assets/verifed-mark.png" alt="Verifed carrot checkmark" />
        </div>
        <span className="auth-story-foot">
          <Leaf size={18} />
          Ingredients. Requirements. A conversation.
        </span>
      </section>
      <section className="auth-form-area">
        <button
          className="text-button auth-back"
          onClick={() => navigate("home")}
        >
          Explore the app <ArrowUpRight size={16} />
        </button>
        <div className="auth-form">
          <span className="eyebrow">Welcome to Verifed</span>
          <h2>
            {mode === "signup"
              ? "Make yourself at home."
              : mode === "reset"
                ? "A fresh start."
                : mode === "recover"
                  ? "Choose a new password."
                  : "Sign in to Verifed"}
          </h2>
          <p>
            {mode === "signup"
              ? "Create your dining profile and keep the good meals coming."
              : mode === "reset"
                ? "We’ll email you a link to reset your password."
                : mode === "recover"
                  ? "Use at least eight characters."
                  : "Save your profile, meals, and kitchen conversations."}
          </p>
          <ErrorMessage error={authError} />
          {["signin", "signup"].includes(mode) && (
            <>
              <Button
                className="google-signin"
                variant="secondary"
                busy={task.busy}
                disabled={!googleAuthEnabled}
                onClick={() => task.run(() => api.signInWithGoogle())}
              >
                <span aria-hidden="true" className="google-letter">
                  G
                </span>
                Continue with Google
              </Button>
              <p className="fine-print">
                {googleAuthEnabled
                  ? "Your Google account creates or opens your Verifed profile."
                  : "Google sign-in setup is pending. Use the local demo to try the full app."}
              </p>
            </>
          )}
          <details className="email-access" open={recovery || undefined}>
            <summary>
              {recovery ? "Password recovery" : "Use an existing email account"}
            </summary>
            <form onSubmit={submit}>
              {mode === "signup" && (
                <Field label="Your name">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                    maxLength={80}
                    placeholder="What should we call you?"
                  />
                </Field>
              )}
              {mode !== "recover" && (
                <Field label="Email address">
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>
              )}
              {mode !== "reset" && (
                <Field label="Password">
                  <input
                    type="password"
                    autoComplete={
                      mode === "signin" ? "current-password" : "new-password"
                    }
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                  />
                </Field>
              )}
              {mode === "signin" && (
                <button
                  className="text-button forgot-link"
                  type="button"
                  onClick={() => changeMode("reset")}
                >
                  Forgot password?
                </button>
              )}
              <ErrorMessage error={task.error} />
              {notice && (
                <p className="inline-success" role="status">
                  <Mail size={18} />
                  {notice}
                </p>
              )}
              <Button type="submit" busy={task.busy} className="full-width">
                {mode === "signup"
                  ? "Create my account"
                  : mode === "reset"
                    ? "Send reset link"
                    : mode === "recover"
                      ? "Update password"
                      : "Sign in"}
                <ArrowRight size={17} />
              </Button>
            </form>
          </details>
          {mode !== "recover" && (
            <>
              {mode === "reset" && (
                <button
                  className="text-button"
                  onClick={() => changeMode("signin")}
                >
                  Back to sign in
                </button>
              )}
              <div className="auth-divider">
                <span>or take a look around</span>
              </div>
              <Button
                variant="secondary"
                busy={task.busy}
                className="full-width"
                onClick={() =>
                  task.run(
                    () => api.enterDemo(),
                    () => navigate("home"),
                  )
                }
              >
                Try the local demo <Sparkles size={17} />
              </Button>
              <p className="fine-print">
                Demo data stays in this browser. All restaurants and dishes
                shown are fictional.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export function ProfileEditor({ state, navigate }) {
  const [profile, setProfile] = useState(structuredClone(state.profile));
  const task = useTask();
  function update(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
  }
  function submit(event) {
    event.preventDefault();
    task.run(
      () => api.saveProfile(profile),
      () => navigate("profile"),
    );
  }
  if (state.mode === "guest")
    return (
      <Empty
        icon={UserRound}
        title="Let's make it personal"
        action={
          <Button onClick={() => navigate("auth")}>
            Sign in or try the demo
          </Button>
        }
      >
        Your profile helps you review menus and share the requirements you
        choose.
      </Empty>
    );
  return (
    <>
      <PageTitle
        eyebrow="DINING PREFERENCES"
        title="Edit your profile"
        description="Keep dietary needs separate from flavors you love. You choose what to share for each meal."
        back={() => navigate("profile")}
      />
      <form className="profile-editor" onSubmit={submit}>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <UserRound size={20} />
              The basics
            </h2>
            <span className="step-label">01</span>
          </div>
          <Field label="What should we call you?">
            <input
              required
              maxLength={80}
              value={profile.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Your name"
            />
          </Field>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <ShieldAlert size={20} />
              Your dietary requirements
            </h2>
            <span className="step-label">02</span>
          </div>
          <p className="section-caption">
            These help flag reported ingredient conflicts. They are never
            treated as taste preferences.
          </p>
          <fieldset>
            <legend>Allergies</legend>
            <ToggleChips
              options={ALLERGENS}
              value={profile.allergies}
              onChange={(value) => update("allergies", value)}
              label="Your allergies"
            />
          </fieldset>
          <fieldset>
            <legend>Dietary restrictions</legend>
            <ToggleChips
              options={RESTRICTIONS}
              value={profile.restrictions}
              onChange={(value) => update("restrictions", value)}
              label="Your dietary restrictions"
            />
          </fieldset>
          <div className="inline-notice">
            <Info size={17} />
            <p>
              Not an exhaustive medical list. Include any additional
              requirements in your request to staff.
            </p>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <Sparkles size={20} />
              The fun part: your flavor
            </h2>
            <span className="step-label">03</span>
          </div>
          <fieldset>
            <legend>More of this, please</legend>
            <ToggleChips
              options={TASTE_TAGS}
              value={profile.likes}
              onChange={(value) => {
                update("likes", value);
                update(
                  "dislikes",
                  profile.dislikes.filter((item) => !value.includes(item)),
                );
              }}
              label="Flavors you like"
            />
          </fieldset>
          <fieldset>
            <legend>Usually not my thing</legend>
            <ToggleChips
              options={TASTE_TAGS}
              value={profile.dislikes}
              onChange={(value) => {
                update("dislikes", value);
                update(
                  "likes",
                  profile.likes.filter((item) => !value.includes(item)),
                );
              }}
              label="Flavors you dislike"
            />
          </fieldset>
        </section>
        <ErrorMessage error={task.error} />
        <div className="profile-save">
          <p>
            <LockKeyhole size={16} />
            You control what's included in each request.
          </p>
          <Button type="submit" busy={task.busy}>
            Save my profile <Check size={17} />
          </Button>
        </div>
      </form>
    </>
  );
}

export function Profile({ state, navigate }) {
  if (state.mode === "guest")
    return (
      <Empty
        icon={UserRound}
        title="A profile that's all you"
        action={
          <Button onClick={() => navigate("auth")}>
            Get started <ArrowRight size={16} />
          </Button>
        }
      >
        Save your dietary requirements, collect favorite dishes, and discover
        your flavors.
      </Empty>
    );
  return (
    <>
      <PageTitle
        eyebrow="YOUR ACCOUNT"
        title="Your profile"
        description="Manage dietary requirements and the flavors you like."
        action={
          <Button variant="secondary" onClick={() => navigate("onboarding")}>
            Edit profile
          </Button>
        }
      />
      <section className="profile-banner">
        <span className="profile-avatar">
          {state.profile.name?.slice(0, 1).toUpperCase() || "V"}
        </span>
        <div>
          <h2>{state.profile.name || "Your dining profile"}</h2>
          <p>
            {state.mode === "demo"
              ? "Local demo · saved on this browser"
              : state.user?.email}
          </p>
        </div>
      </section>
      <div className="profile-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <ShieldAlert size={20} />
              Dietary requirements
            </h2>
          </div>
          <h3>Allergies</h3>
          <div className="ingredient-tags">
            {state.profile.allergies.length ? (
              state.profile.allergies.map((item) => (
                <span key={item}>{item}</span>
              ))
            ) : (
              <p>None added</p>
            )}
          </div>
          <h3>Dietary restrictions</h3>
          <div className="ingredient-tags">
            {state.profile.restrictions.length ? (
              state.profile.restrictions.map((item) => (
                <span key={item}>{item}</span>
              ))
            ) : (
              <p>None added</p>
            )}
          </div>
          <p className="fine-print">
            Review these before each request. A saved profile is not
            automatically shared with a restaurant.
          </p>
        </section>
        <section className="panel flavor-profile">
          <div className="panel-heading">
            <h2>
              <Sparkles size={20} />
              Your flavor notes
            </h2>
          </div>
          <p className="flavor-title">
            {state.profile.likes.length
              ? state.profile.likes.join(" + ")
              : "Your next flavor chapter awaits."}
          </p>
          <p>
            {state.profile.dislikes.length
              ? `Usually skip: ${state.profile.dislikes.join(", ")}`
              : "Add the flavors you love to personalize discovery."}
          </p>
          <Button variant="secondary" onClick={() => navigate("onboarding")}>
            Fine-tune your taste
          </Button>
        </section>
      </div>
      <div className="settings-list">
        {[
          {
            label: "Saved dishes",
            description: "A little collection for next time",
            icon: Heart,
            page: "favorites",
          },
          {
            label: "Account & settings",
            description: "Your data, your account, your choices",
            icon: Settings,
            page: "settings",
          },
          {
            label: "Restaurant space",
            description: "Review requests and manage a sample menu",
            icon: ChefHat,
            page: "workspace",
          },
          {
            label: "How Verifed works",
            description: "About the app, privacy, and important limitations",
            icon: HelpCircle,
            page: "help",
          },
        ].map((item) => (
          <button key={item.page} onClick={() => navigate(item.page)}>
            <span className="settings-icon">
              <item.icon size={21} />
            </span>
            <div>
              <strong>{item.label}</strong>
              <p>{item.description}</p>
            </div>
            <ChevronRight size={19} />
          </button>
        ))}
      </div>
    </>
  );
}

export function SettingsPage({ state, navigate }) {
  const task = useTask();
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  function exportData() {
    task.run(async () => {
      const data = await api.exportData();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "verifed-my-data.json";
      link.click();
      URL.revokeObjectURL(url);
      setNotice("Your data export is ready.");
    });
  }
  return (
    <>
      <PageTitle
        back={() => navigate("profile")}
        eyebrow="YOUR ACCOUNT"
        title="Settings"
      />
      <div className="narrow-content">
        <section className="panel">
          <h2>Your account</h2>
          <p>
            {state.mode === "demo"
              ? "Local demo on this browser"
              : state.user?.email || "Browsing as a guest"}
          </p>
          <p className="fine-print">
            {state.mode === "demo"
              ? "Demo data is stored in this browser and shared across its tabs. Sign in for a separate cloud account."
              : "Your personal profile and meal history belong to your signed-in account."}
          </p>
          <div className="button-row">
            {state.mode !== "cloud" && (
              <Button onClick={() => navigate("auth")}>
                Sign in or create an account
              </Button>
            )}
            {state.mode !== "guest" && (
              <Button
                variant="secondary"
                busy={task.busy}
                onClick={() =>
                  task.run(
                    () => api.signOut(),
                    () => navigate("home"),
                  )
                }
              >
                <LogOut size={17} />
                Sign out
              </Button>
            )}
          </div>
        </section>
        <section className="panel">
          <h2>Your data</h2>
          <p>
            Download your profile, saved dishes, meal history, and visible
            requests.
          </p>
          <div className="button-stack">
            <Button variant="secondary" onClick={exportData} busy={task.busy}>
              <Download size={18} />
              Export my data
            </Button>
            {state.mode !== "guest" && (
              <Button variant="danger" onClick={() => setConfirm(true)}>
                <Trash2 size={17} />
                {state.mode === "demo"
                  ? "Reset the local demo"
                  : "Delete my personal app data"}
              </Button>
            )}
          </div>
          <p className="fine-print">
            {state.mode === "demo"
              ? "Reset restores the original fictional sample profile and meals."
              : "Deleting personal app data removes your profile, meals, favorites, and requests. It does not delete your authentication account or restaurant business records."}
          </p>
        </section>
        {notice && (
          <p className="inline-success" role="status">
            {notice}
          </p>
        )}
        <ErrorMessage error={task.error} />
      </div>
      {confirm && (
        <Dialog
          title={
            state.mode === "demo"
              ? "Reset your demo?"
              : "Delete personal app data?"
          }
          onClose={() => setConfirm(false)}
        >
          <p>
            {state.mode === "demo"
              ? "Your local changes will be replaced with the original sample data."
              : "Your personal app data will be removed. Export a copy first if you want to keep it. Your login and business records remain."}
          </p>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Keep my data
            </Button>
            <Button
              variant="danger"
              busy={task.busy}
              onClick={() =>
                task.run(
                  () =>
                    state.mode === "demo"
                      ? api.resetDemo()
                      : api.deleteMyData(),
                  () => {
                    setConfirm(false);
                    setNotice("Done. Your personal data has been reset.");
                  },
                )
              }
            >
              Confirm {state.mode === "demo" ? "reset" : "deletion"}
            </Button>
          </div>
          <ErrorMessage error={task.error} />
        </Dialog>
      )}
    </>
  );
}

export function Help({ navigate }) {
  return (
    <>
      <PageTitle
        eyebrow="ABOUT VERIFED"
        title="How Verifed works"
        description="Verifed helps people explore menus, share requirements, and keep kitchen responses connected to the meal they describe."
      />
      <div className="help-steps">
        {[
          {
            number: "01",
            title: "Make it personal",
            text: "Save dietary needs and taste preferences. Keep allergies separate from the flavors you enjoy.",
            icon: UserRound,
          },
          {
            number: "02",
            title: "Ask the kitchen",
            text: "Choose a dish, share relevant requirements, and ask specific ingredient or preparation questions.",
            icon: ChefHat,
          },
          {
            number: "03",
            title: "Stay on the same page",
            text: "Read the kitchen response. If reported ingredients or preparation change, a new review is required.",
            icon: Check,
          },
        ].map((item) => (
          <section className="panel" key={item.number}>
            <span className="step-label">{item.number}</span>
            <item.icon size={25} />
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </section>
        ))}
      </div>
      <div className="help-faq">
        <details open>
          <summary>What does “verified” mean here?</summary>
          <p>
            The app records requirements, reported information, kitchen
            responses, and acknowledgment. It cannot inspect food, detect
            undeclared changes, or guarantee that a meal is free of allergens or
            cross-contact. “Kitchen response recorded” refers to communication,
            not a medical safety certification.
          </p>
        </details>
        <details>
          <summary>Are these real restaurants?</summary>
          <p>
            No. All supplied restaurants, dishes, prices, and reviews are
            fictional demonstration data. Unconfirmed menus support browsing and
            meal logging. A connected sample workspace lets its owner practice
            kitchen requests.
          </p>
        </details>
        <details>
          <summary>How do taste recommendations work?</summary>
          <p>
            Simple, explainable tags match the flavors you like and avoid. Known
            allergen conflicts rank after other dishes. Taste recommendations
            never override dietary information. This version does not use an AI
            taste model.
          </p>
        </details>
        <details>
          <summary>Where is my information stored?</summary>
          <p>
            Local demo information stays in browser storage. Signed-in accounts
            use the connected Supabase backend. Staff can see the information
            shared in requests for their own restaurant. You can export or
            delete personal app data in settings.
          </p>
        </details>
        <details>
          <summary>Is this an ordering or payment app?</summary>
          <p>
            This version supports browsing, communication, saved dishes, and
            meal history. A request is not a placed or paid order. Discuss
            actual ordering with the restaurant.
          </p>
        </details>
      </div>
      <Button onClick={() => navigate("explore")}>
        Find your next dish <ArrowRight size={17} />
      </Button>
    </>
  );
}
