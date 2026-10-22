import React, { useState } from "react";
import { Platform, Pressable, Share, Text, View } from "react-native";
import Constants from "expo-constants";
import { api } from "../src/api";
import { validateLogin, validateSignup } from "../src/account-auth";
import {
  ALLERGENS,
  RESTRICTIONS,
  TASTE_TAGS,
  defaultProfile,
} from "../src/data";
import { googleAuthEnabled } from "../src/config";
import { colors, s } from "../styles";
import {
  Button,
  Chips,
  ErrorText,
  Field,
  Icon,
  Notice,
  Section,
  Sheet,
  Tags,
  Title,
  Tabs,
  useTask,
} from "./UI";

export function Auth({
  state,
  navigate,
  recovery = false,
  initialMode = "signin",
}) {
  const [mode, setMode] = useState(recovery ? "recover" : initialMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const task = useTask();
  const nativeGoogleAvailable =
    googleAuthEnabled &&
    Platform.OS !== "web" &&
    Constants.executionEnvironment !== "storeClient";
  function changeMode(next) {
    if (task.busy) return;
    if (next === "reset" && identifier.includes("@")) setEmail(identifier);
    setMode(next);
    setPassword("");
    setNotice("");
    task.setError("");
  }
  async function submit() {
    task.run(async () => {
      setNotice("");
      if (mode === "reset") {
        if (!email.trim()) throw new Error("Enter your email address.");
        await api.resetPassword(email.trim());
        setNotice(
          "If this address has an account, a reset link will arrive by email.",
        );
      } else if (mode === "recover") {
        if (password.length < 8)
          throw new Error("Use at least eight characters for your password.");
        await api.updatePassword(password);
        navigate("home");
      } else if (mode === "signup") {
        // Validate the complete form before creating an account or changing screens.
        const account = validateSignup({ username, email, password });
        await api.signUp(account.email, account.password, account.username);
        navigate("home");
      } else {
        const login = validateLogin(identifier, password);
        await api.signIn(login, password);
        navigate("home");
      }
    });
  }
  const labels = {
    signin: "Welcome to your table.",
    signup: "Your seat is waiting.",
    reset: "A fresh start.",
    recover: "Choose a new password.",
  };
  return (
    <>
      <Title eyebrow="Your dining companion" title={labels[mode]}>
        Keep your dietary needs, saved menu items, and meal notes together.
      </Title>
      {["signin", "signup"].includes(mode) && (
        <Tabs
          options={[
            { value: "signin", label: "Log in" },
            { value: "signup", label: "Create account" },
          ]}
          value={mode}
          onChange={changeMode}
        />
      )}
      <View style={s.card}>
        {mode === "signup" && (
          <>
            <Text style={s.small}>
              Choose a username and add your email for password recovery. You
              can start using your account right away.
            </Text>
            <Field
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              placeholder="Your username"
              hint="3–24 letters, numbers, or underscores. Not case-sensitive."
              maxLength={24}
              editable={!task.busy}
            />
          </>
        )}
        {mode === "signin" && (
          <Field
            label="Username or email"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            placeholder="Your username or email address"
            editable={!task.busy}
          />
        )}
        {["signup", "reset"].includes(mode) && (
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            placeholder="you@example.com"
            editable={!task.busy}
          />
        )}
        {mode !== "reset" && (
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            placeholder={
              mode === "signin" ? "Your password" : "At least 8 characters"
            }
            editable={!task.busy}
            onSubmitEditing={submit}
          />
        )}
        {mode === "signin" && (
          <Pressable
            accessibilityRole="button"
            onPress={() => changeMode("reset")}
            disabled={task.busy}
          >
            <Text style={s.link}>Forgot password?</Text>
          </Pressable>
        )}
        <ErrorText error={task.error} />
        {!!notice && <Notice>{notice}</Notice>}
        <Button busy={task.busy} onPress={submit}>
          {
            {
              signin: "Sign in",
              signup: "Create account",
              reset: "Send reset link",
              recover: "Update password",
            }[mode]
          }
        </Button>
        {mode === "reset" && (
          <Button variant="quiet" onPress={() => changeMode("signin")}>
            Back to sign in
          </Button>
        )}
      </View>
      {["signin", "signup"].includes(mode) && googleAuthEnabled && (
        <>
          {nativeGoogleAvailable ? (
            <Button
              icon="logo-google"
              variant="secondary"
              busy={task.busy}
              onPress={() =>
                task.run(
                  () => api.signInWithGoogle(),
                  () => navigate("home"),
                )
              }
            >
              Continue with Google
            </Button>
          ) : (
            <Notice>
              Google sign-in is available in an installed Verifed development
              build. Expo Snack and Expo Go cannot receive this app's Google
              callback. You can sign in with your username or email and
              password here, or continue without an account.
            </Notice>
          )}
        </>
      )}
      {mode !== "recover" && (
        <>
          <Button variant="quiet" onPress={() => navigate("home")}>
            Continue without an account
          </Button>
        </>
      )}
    </>
  );
}

export function ProfileEditor({ state, navigate, returnTo }) {
  const [draft, setDraft] = useState({ ...state.profile });
  const task = useTask();
  const update = (key, value) =>
    setDraft((current) => {
      const next = { ...current, [key]: value };
      // A flavor can be loved or skipped, but should not be saved as both.
      if (key === "likes")
        next.dislikes = current.dislikes.filter(
          (item) => !value.includes(item),
        );
      if (key === "dislikes")
        next.likes = current.likes.filter((item) => !value.includes(item));
      return next;
    });
  return (
    <>
      <Title
        eyebrow={
          state.mode === "guest" ? "Browsing preview" : "Your preferences"
        }
        title="Your dining profile"
      >
        {state.mode === "guest"
          ? "Use dietary needs to compare menus. Saved only on this device, not to an account."
          : "Keep dietary needs separate from flavor preferences."}
      </Title>
      <Field
        label="Your name"
        value={draft.name}
        onChangeText={(value) => update("name", value)}
        maxLength={80}
      />
      <View style={s.card}>
        <Chips
          label="Allergies"
          options={ALLERGENS}
          value={draft.allergies}
          onChange={(value) => update("allergies", value)}
        />
        <Text style={s.small}>Nine major allergens, plus Honey.</Text>
        <Chips
          label="Dietary restrictions"
          options={RESTRICTIONS}
          value={draft.restrictions}
          onChange={(value) => update("restrictions", value)}
        />
        <Text style={s.small}>
          Vegetarian (no eggs) allows dairy. Garlic/onion avoidance is separate
          from vegan and vegetarian labels.
        </Text>
      </View>
      <View style={s.card}>
        <Chips
          label="Flavors you love"
          options={TASTE_TAGS}
          value={draft.likes}
          onChange={(value) => update("likes", value)}
        />
        <Chips
          label="Usually skip"
          options={TASTE_TAGS}
          value={draft.dislikes}
          onChange={(value) => update("dislikes", value)}
        />
      </View>
      <Notice>
        {state.mode === "guest"
          ? "This preview changes menu comparisons only. It sends no information to a restaurant."
          : "Your profile helps organize menus. Confirm current ingredients and preparation directly with the restaurant."}
      </Notice>
      <ErrorText error={task.error} />
      <Button
        busy={task.busy}
        onPress={() =>
          task.run(
            () =>
              state.mode === "guest"
                ? api.previewProfile(draft)
                : api.saveProfile(draft),
            () =>
              navigate(
                /^restaurant\/[a-zA-Z0-9-]+$/.test(returnTo || "")
                  ? returnTo
                  : "profile",
                { unwind: true },
              ),
          )
        }
      >
        {state.mode === "guest" ? "Apply browsing preview" : "Save my profile"}
      </Button>
    </>
  );
}

export function Profile({ state, navigate }) {
  const profile = state.profile;
  const task = useTask();
  return (
    <>
      <Title eyebrow="Dietary needs and preferences" title="Your profile">
        {state.mode === "guest"
          ? "Your browsing profile is saved only on this device, not to an account."
          : "Manage the preferences used to compare menus."}
      </Title>
      <View style={[s.card, s.row]}>
        <View style={s.avatar}>
          <Text style={[s.h2, { color: colors.green }]}>
            {profile.name?.slice(0, 1).toUpperCase() || "V"}
          </Text>
        </View>
        <View style={s.flex}>
          <Text style={s.h3}>{profile.name || "Your dining profile"}</Text>
          <Text style={s.small}>
            {state.mode === "demo"
              ? "Local demo · on this device"
              : state.user?.email || "Browsing as a guest"}
          </Text>
        </View>
      </View>
      {state.mode === "guest" ? (
        <>
          <Button
            icon="create-outline"
            onPress={() => navigate("edit-profile")}
          >
            Choose allergies and preferences
          </Button>
          <Button
            variant="secondary"
            busy={task.busy}
            onPress={() => task.run(() => api.previewProfile(defaultProfile))}
          >
            Clear browsing profile
          </Button>
          <ErrorText error={task.error} />
        </>
      ) : (
        <Button
          variant="secondary"
          icon="create-outline"
          onPress={() => navigate("edit-profile")}
        >
          Edit profile
        </Button>
      )}
      <View style={s.card}>
        <Text style={s.h3}>Allergies</Text>
        <Tags values={profile.allergies} />
        <Text style={s.h3}>Dietary restrictions</Text>
        <Tags values={profile.restrictions} />
        <Text style={s.small}>
          {state.mode === "guest"
            ? "Saved only on this device. These preferences are not shared with a restaurant."
            : "Your saved profile is not automatically shared with a restaurant."}
        </Text>
      </View>
      <View style={[s.card, { backgroundColor: colors.paleGreen }]}>
        <View style={s.row}>
          <Icon name="sparkles-outline" color={colors.green} />
          <Text style={s.h3}>Your flavor notes</Text>
        </View>
        <Tags values={profile.likes} fallback="Add the flavors you love." />
        <Text style={s.small}>
          {profile.dislikes.length
            ? `Usually skip: ${profile.dislikes.join(", ")}`
            : "A few preferences help personalize discovery."}
        </Text>
      </View>
      {[
        {
          page: "favorites",
          icon: "heart-outline",
          title: "Saved dishes",
          subtitle: "A little collection for next time",
        },
        {
          page: "settings",
          icon: "settings-outline",
          title: "Account & settings",
          subtitle: "Your data, your account, your choices",
        },
        {
          page: "help",
          icon: "help-circle-outline",
          title: "How Verifed works",
          subtitle: "A little clarity about this app",
        },
      ].map((item) => (
        <Pressable
          key={item.page}
          accessibilityRole="button"
          onPress={() => navigate(item.page)}
          style={[s.card, s.row]}
        >
          <Icon name={item.icon} color={colors.orangeDark} />
          <View style={s.flex}>
            <Text style={s.h3}>{item.title}</Text>
            <Text style={s.small}>{item.subtitle}</Text>
          </View>
          <Icon name="chevron-forward" size={18} />
        </Pressable>
      ))}
    </>
  );
}

export function Settings({ state, navigate }) {
  const task = useTask();
  const [confirm, setConfirm] = useState(false);
  const [exported, setExported] = useState(null);
  const [notice, setNotice] = useState("");
  async function exportData() {
    const data = await api.exportData();
    setExported(JSON.stringify(data, null, 2));
  }
  return (
    <>
      <Title eyebrow="Your account" title="Settings" />
      <View style={s.card}>
        <Text style={s.h3}>Your account</Text>
        <Text style={s.body}>
          {state.mode === "demo"
            ? "Local demo on this device"
            : state.user?.email || "Browsing as a guest"}
        </Text>
        <Text style={s.small}>
          {state.mode === "demo"
            ? "Demo activity is saved locally, alongside public Orlando menu records. A signed-in account keeps separate cloud data."
            : state.mode === "guest"
              ? "Your dietary profile, saved menu items, and meal notes stay on this device. Sign-in is optional."
              : "Your profile and meal history belong to your account."}
        </Text>
        {state.mode !== "cloud" && (
          <Button onPress={() => navigate("auth")}>
            Sign in or create an account
          </Button>
        )}
        {state.mode !== "guest" && (
          <Button
            variant="secondary"
            icon="log-out-outline"
            busy={task.busy}
            onPress={() =>
              task.run(
                () => api.signOut(),
                () => navigate("home"),
              )
            }
          >
            Sign out
          </Button>
        )}
      </View>
      <Section title="Your data">
        <View style={s.card}>
          <Text style={s.body}>
            {state.mode === "guest"
              ? "Export your dietary profile, saved items, and meal notes from this device."
              : "Export the personal information Verifed stores for your account."}
          </Text>
          <Button
            variant="secondary"
            icon="share-outline"
            busy={task.busy}
            onPress={() => task.run(exportData)}
          >
            Export my data
          </Button>
          <Button
            variant="danger"
            icon="trash-outline"
            onPress={() => setConfirm(true)}
          >
            {state.mode === "guest"
              ? "Clear data on this device"
              : state.mode === "demo"
                ? "Reset local demo"
                : "Delete my personal app data"}
          </Button>
          <Text style={s.small}>
            {state.mode === "guest"
              ? "Clearing removes your dietary profile, saved items, and meal notes from this device. Public menus stay available."
              : state.mode === "demo"
                ? "Reset restores the original demo activity and current public menu catalog."
                : "Deleting personal app data removes your profile, meals, saved items, and any older activity. Your login remains."}
          </Text>
        </View>
      </Section>
      <Button
        variant="secondary"
        icon="refresh-outline"
        busy={task.busy}
        onPress={() =>
          task.run(
            () => api.refresh(),
            () => setNotice("Your data is up to date."),
          )
        }
      >
        Refresh data
      </Button>
      {!!notice && <Notice>{notice}</Notice>}
      <ErrorText error={task.error} />
      {confirm && (
        <Sheet
          title={
            state.mode === "guest"
              ? "Clear this device's data?"
              : state.mode === "demo"
                ? "Reset your demo?"
                : "Delete personal app data?"
          }
          onClose={() => setConfirm(false)}
        >
          <Text style={s.body}>
            {state.mode === "guest"
              ? "Your dietary profile, saved menu items, and meal notes on this device will be removed. Export them first to keep a copy."
              : state.mode === "demo"
                ? "Your local changes will be replaced with the original sample data."
                : "Your personal app data will be removed. Export it first if you want to keep a copy. Your login remains."}
          </Text>
          <ErrorText error={task.error} />
          <Button variant="secondary" onPress={() => setConfirm(false)}>
            Keep my data
          </Button>
          <Button
            variant="danger"
            busy={task.busy}
            onPress={() =>
              task.run(
                () =>
                  state.mode === "demo" ? api.resetDemo() : api.deleteMyData(),
                () => {
                  setConfirm(false);
                  setNotice("Your personal data has been reset.");
                },
              )
            }
          >
            Confirm{" "}
            {state.mode === "guest"
              ? "clear data"
              : state.mode === "demo"
                ? "reset"
                : "deletion"}
          </Button>
        </Sheet>
      )}
      {exported !== null && (
        <Sheet title="Your data export" onClose={() => setExported(null)}>
          <Text style={s.small}>
            Share this JSON export, or select the text to copy it.
          </Text>
          <Button
            variant="secondary"
            icon="share-outline"
            busy={task.busy}
            onPress={() =>
              task.run(() =>
                Share.share({
                  message: exported,
                  title: "Verifed data export",
                }),
              )
            }
          >
            Share export
          </Button>
          <ErrorText error={task.error} />
          <Text selectable style={[s.small, { fontFamily: "monospace" }]}>
            {exported}
          </Text>
        </Sheet>
      )}
    </>
  );
}

export function Help({ navigate }) {
  return (
    <>
      <Title
        eyebrow="A local idea with a real purpose"
        title="More clarity. More choice."
      >
        Eating out can mean searching several websites just to understand one
        menu. Verifed brings published Orlando menus and your dietary needs into
        one place.
      </Title>
      <View style={s.howPanel}>
        <Text style={s.eyebrow}>THE COMMUNITY CHALLENGE</Text>
        <Text style={s.h2}>Everyone deserves a place at the table.</Text>
        <Text style={s.body}>
          Built for the Congressional App Challenge, this app helps people with
          food allergies and dietary restrictions ask informed questions at
          local restaurants. Restaurants do not need to buy software or join
          Verifed to appear.
        </Text>
      </View>
      {[
        [
          "01",
          "Set your needs",
          "Choose allergies and dietary restrictions. Guest preferences stay on this device.",
        ],
        [
          "02",
          "Read both menus",
          "Full menu shows published food entries and declared allergens. For my diet separates restaurant-reported matches from possible options with no known conflict in the available ingredient information.",
        ],
        [
          "03",
          "Know what is missing",
          "Possible options may have incomplete information. Check the ingredient clues and ask the restaurant; a blank allergen field does not count as allergen-free.",
        ],
        [
          "04",
          "Ask the restaurant",
          "Check the original source and ask about current ingredients, preparation, and cross-contact before ordering.",
        ],
      ].map(([step, title, text]) => (
        <View key={step} style={s.howRow}>
          <Text style={s.howNumber}>{step}</Text>
          <View style={s.flex}>
            <Text style={s.h3}>{title}</Text>
            <Text style={s.body}>{text}</Text>
          </View>
        </View>
      ))}
      <Section title="A few useful answers">
        {[
          {
            title: "Are these real menus?",
            text: "Yes. Each restaurant includes links to official public menu sources and a review date. Chain sources and menu exclusions are labeled. Verifed is not partnered with these restaurants; current local availability can differ.",
          },
          {
            title: "Does a match mean safe?",
            text: "No. A match means the source explicitly supports your selected dietary needs. It does not verify the kitchen, a specific meal, or cross-contact. Missing information stays unknown.",
          },
          {
            title: "Why do some menus have no matches?",
            text: "Some restaurants publish food names and ingredients without a complete allergen guide. Verifed separates explicit source-supported matches from possible options that still need a conversation with the restaurant.",
          },
          {
            title: "Where does my information go?",
            text: "Guest dietary preferences, saved items, and meal notes stay on this device. Signed-in accounts use the connected backend with account-specific access. Preferences are not sent to restaurants. Export and deletion are in Settings.",
          },
          {
            title: "Can I order here?",
            text: "Verifed is a menu and dietary-information companion. Use the restaurant's own website or telephone for orders.",
          },
        ].map((item) => (
          <View key={item.title} style={s.card}>
            <Text style={s.h3}>{item.title}</Text>
            <Text style={s.body}>{item.text}</Text>
          </View>
        ))}
      </Section>
      <Button onPress={() => navigate("explore")}>Explore local menus</Button>
    </>
  );
}
