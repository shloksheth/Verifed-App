import { Text } from "./Typography";
import React, { useState } from "react";
import { Image, Pressable, Share, StyleSheet, View } from "react-native";
import { api } from "../src/api";
import { validateLogin, validateSignup } from "../src/account-auth";
import {
  ALLERGENS,
  RESTRICTIONS,
  TASTE_TAGS,
  defaultProfile,
} from "../src/data";
import { colors, s } from "../styles";
import { forest } from "../src/warm-forest";
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
    signin: "Make your dietary needs clear before you order",
    signup: "Create an account",
    reset: "Reset your password",
    recover: "Choose a new password",
  };
  return (
    <View style={authStyles.page}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to Verifed"
        onPress={() => navigate("home")}
        style={authStyles.back}
      >
        <Icon name="arrow-back" size={19} color="#CCD9CF" />
        <Text style={authStyles.backText}>Back</Text>
      </Pressable>
      <View style={authStyles.wordmarkRow}>
        <Image source={require("../assets/verifed-mark.png")} style={authStyles.brandMark} />
        <Text style={authStyles.brandText}>verifed</Text>
      </View>
      <Text style={authStyles.eyebrow}>YOUR ACCOUNT</Text>
      <Text accessibilityRole="header" style={[authStyles.headline, mode === "signin" && authStyles.signinHeadline]}>{labels[mode]}</Text>
      <Text style={authStyles.intro}>
        {{
          signin: "Sign in to save your allergies and dietary preferences, explore restaurant menus, and communicate your needs more clearly with restaurant staff.",
          signup: "Save your dietary profile, menu items, and meal notes to an account.",
          reset: "Enter your account email to request a reset link.",
          recover: "Use at least 8 characters.",
        }[mode]}
      </Text>
      {["signin", "signup"].includes(mode) && (
        <View style={authStyles.switcher}>
          {[
            { value: "signin", label: "Sign in" },
            { value: "signup", label: "Create account" },
          ].map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === item.value }}
              onPress={() => changeMode(item.value)}
              style={[authStyles.switchButton, mode === item.value && authStyles.switchActive]}
            >
              <Text style={[authStyles.switchText, mode === item.value && authStyles.switchTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={authStyles.form}>
        {mode === "signup" && (
          <>
            <Text style={s.small}>
              Choose a username. Use an email address you can access for password recovery.
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
        <Button busy={task.busy} onPress={submit} style={authStyles.submit}>
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
      {mode !== "recover" && (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigate("guest-preferences")}
          style={authStyles.skip}
        >
          <Text style={authStyles.skipText}>Continue without an account</Text>
        </Pressable>
      )}
    </View>
  );
}

export function ProfileEditor({ state, navigate, returnTo, onboarding = false }) {
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
    <View style={onboarding ? guestPrefs.page : undefined}>
      {onboarding ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close dietary preferences and explore as a guest"
            onPress={() => navigate("explore")}
            style={({ pressed }) => [guestPrefs.close, pressed && guestPrefs.pressed]}
          >
            <Icon name="close" size={26} color={forest.ink} />
          </Pressable>
          <Text style={guestPrefs.eyebrow}>GUEST DIETARY PREFERENCES</Text>
          <Text accessibilityRole="header" style={guestPrefs.heading}>
            Set your dietary preferences
          </Text>
          <Text style={guestPrefs.description}>
            Choose any allergies or dietary restrictions that apply to you, then explore restaurant menus with those needs in mind.
          </Text>
        </>
      ) : (
        <>
          <Title
            eyebrow={state.mode === "guest" ? "On this device" : "Preferences"}
            title="Edit profile"
          >
            {state.mode === "guest"
              ? "Use these preferences to compare menus. Saved on this device only."
              : "Choose dietary needs and flavor preferences for menu comparisons."}
          </Title>
          <Field
            label="Your name"
            value={draft.name}
            onChangeText={(value) => update("name", value)}
            maxLength={80}
          />
        </>
      )}
      <View style={[s.card, onboarding && guestPrefs.card]}>
        <Chips
          label="Allergies"
          options={ALLERGENS}
          value={draft.allergies}
          onChange={(value) => update("allergies", value)}
        />
        <Text style={s.small}>Includes the 9 major allergens and honey.</Text>
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
      <View style={[s.card, onboarding && guestPrefs.card]}>
        <Chips
          label="Flavors you like"
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
          ? "Preferences stay on this device and are not sent to restaurants. Always confirm ingredients and cross-contact directly with staff."
          : "Confirm current ingredients and preparation with the restaurant before ordering."}
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
                onboarding
                  ? "explore"
                  : ["home", "scan"].includes(returnTo) ||
                      /^restaurant\/[a-zA-Z0-9-]+$/.test(returnTo || "")
                    ? returnTo
                    : "profile",
                { unwind: true },
              ),
          )
        }
      >
        {onboarding
          ? "Save preferences and explore"
          : state.mode === "guest" ? "Save on this device" : "Save profile"}
      </Button>
      {onboarding && (
        <Text style={guestPrefs.help}>
          You can update these preferences at any time from your profile.
        </Text>
      )}
    </View>
  );
}

export function Profile({ state, navigate }) {
  const profile = state.profile;
  const task = useTask();
  return (
    <>
      <Title eyebrow="Preferences" title="Your profile">
        {state.mode === "guest"
          ? "Saved on this device only. Your preferences are not sent to restaurants."
          : "These preferences help compare menus with your dietary needs."}
      </Title>
      <View style={[s.card, s.row]}>
        <View style={s.avatar}>
          <Text style={[s.h2, { color: colors.green }]}>
            {profile.name?.slice(0, 1).toUpperCase() || "V"}
          </Text>
        </View>
        <View style={s.flex}>
          <Text style={s.h3}>{profile.name || "Dietary profile"}</Text>
          <Text style={s.small}>
            {state.mode === "demo"
              ? "Demo · on this device"
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
            Edit allergies and preferences
          </Button>
          <Button
            variant="secondary"
            busy={task.busy}
            onPress={() => task.run(() => api.previewProfile(defaultProfile))}
          >
            Clear preferences
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
            ? "Edit your profile to update these preferences."
            : "Your saved profile is not automatically shared with a restaurant."}
        </Text>
      </View>
      <View style={[s.card, { backgroundColor: colors.paleGreen }]}>
        <View style={s.row}>
          <Icon name="restaurant-outline" color={colors.green} />
          <Text style={s.h3}>Flavor preferences</Text>
        </View>
        <Tags values={profile.likes} fallback="No favorite flavors selected" />
        <Text style={s.small}>
          {profile.dislikes.length
            ? `Usually skip: ${profile.dislikes.join(", ")}`
            : "No flavors to skip selected"}
        </Text>
      </View>
      {[
        {
          page: "favorites",
          icon: "heart-outline",
          title: "Saved items",
          subtitle: "View the menu items you saved",
        },
        {
          page: "settings",
          icon: "settings-outline",
          title: "Account & settings",
          subtitle: "Sign in, export data, or delete app data",
        },
        {
          page: "help",
          icon: "help-circle-outline",
          title: "How Verifed works",
          subtitle: "Menu sources, dietary matches, and privacy",
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
      <Title eyebrow="Account and data" title="Settings" />
      <View style={s.card}>
        <Text style={s.h3}>Your account</Text>
        <Text style={s.body}>
          {state.mode === "demo"
            ? "Demo on this device"
            : state.user?.email || "Browsing as a guest"}
        </Text>
        <Text style={s.small}>
          {state.mode === "demo"
            ? "Demo changes stay on this device, separate from account data."
            : state.mode === "guest"
              ? "Your profile, saved items, meal notes, and scanned menus stay on this device. An account is optional."
              : "Your profile and meal history are saved to your account. Scanned menus stay on this device."}
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
              ? "Export your profile, saved items, meal notes, and scanned menus from this device."
              : "Export your profile, activity, saved items, and scanned menus."}
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
                : "Delete personal app data"}
          </Button>
          <Text style={s.small}>
            {state.mode === "guest"
              ? "Clearing removes your profile, saved items, meal notes, and scanned menus from this device. Public menus remain available."
              : state.mode === "demo"
                ? "Reset restores the sample activity and public menus, and removes your scanned menus."
                : "Deletes your account profile, meals, saved items, and older activity, plus scanned menus saved on this device. Your login remains."}
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
            () => setNotice("Data refreshed."),
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
                ? "Reset demo data?"
                : "Delete personal app data?"
          }
          onClose={() => setConfirm(false)}
        >
          <Text style={s.body}>
            {state.mode === "guest"
              ? "This removes your profile, saved items, meal notes, and scanned menus from this device. Export first to keep a copy."
              : state.mode === "demo"
                ? "This replaces your demo changes with the original sample data and removes your scanned menus."
                : "This deletes your account profile, activity, and saved items, plus scanned menus saved on this device. Export first to keep a copy. Your login remains."}
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
                  setNotice(state.mode === "demo" ? "Demo data reset." : state.mode === "guest" ? "Device data cleared." : "Personal app data deleted.");
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
            Share this export, or select the text below to copy it.
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
        eyebrow="Help"
        title="How Verifed works"
      >
        Compare published menus with your dietary needs, then check details with the restaurant.
      </Title>
      <View style={s.howPanel}>
        <Text style={s.eyebrow}>ABOUT THE PROJECT</Text>
        <Text style={s.h2}>Built for menu comparisons</Text>
        <Text style={s.body}>
          Created for the Congressional App Challenge. Verifed uses public menus to help people with allergies and dietary restrictions ask informed questions. Restaurants do not need to join or pay to appear.
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
          "Compare the menu",
          "Full menu shows published items and declared allergens. For my diet highlights reported matches and items that need confirmation. A match is not a guarantee of safety.",
        ],
        [
          "03",
          "Check missing details",
          "Some sources have incomplete ingredients or allergen information. An empty allergen list does not mean allergen-free.",
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
      <Section title="Common questions">
        {[
          {
            title: "Are these real menus?",
            text: "Restaurant menus link to public sources and include a review date. Chain menu scope and exclusions are labeled. Verifed is independent of these restaurants. Local availability may differ. Demo menus are fictional and labeled.",
          },
          {
            title: "Does a match mean safe?",
            text: "No. A match means the source explicitly supports your selected dietary needs. It does not verify the kitchen, a specific meal, or cross-contact. Missing information stays unknown.",
          },
          {
            title: "Why do some menus have no matches?",
            text: "A reported match needs explicit source support for every selected dietary need. When that information is missing, ask the restaurant to confirm. Ingredient clues are not a complete allergen guide.",
          },
          {
            title: "Where does my information go?",
            text: "Guest profiles, saved items, meal notes, and scanned menus stay on this device. Signed-in profiles and activity are saved to your account; scanned menus stay on this device. Preferences are not sent to restaurants. Export or delete app data in Settings.",
          },
          {
            title: "Can I order here?",
            text: "No. Order through the restaurant's website or by phone. Verifed does not send orders.",
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


// The account flow has its own dark-green editorial surface rather than the
// universal peach/cream app shell.
const authStyles = StyleSheet.create({
  page: { backgroundColor: "#17281F", paddingBottom: 24, gap: 15 },
  back: { flexDirection: "row", alignItems: "center", minHeight: 44, gap: 7, alignSelf: "flex-start" },
  backText: { color: "#CCD9CF", fontSize: 14 },
  wordmarkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  brandMark: { width: 24, height: 29, resizeMode: "contain" },
  brandText: { color: "#FFFFFF", fontSize: 24, fontWeight: "400", letterSpacing: -0.7 },
  eyebrow: { color: "#C3E6AE", fontSize: 11, letterSpacing: 1.5, fontWeight: "600", marginTop: 12 },
  headline: { color: "#FFFFFF", fontFamily: "HomeHeadingStrong", fontSize: 37, lineHeight: 42, letterSpacing: -0.8 },
  signinHeadline: { fontSize: 32, lineHeight: 38, letterSpacing: -0.65 },
  intro: { color: "#CAD9CD", fontSize: 15, lineHeight: 23 },
  switcher: { flexDirection: "row", borderRadius: 25, padding: 4, backgroundColor: "#243D30", gap: 5 },
  switchButton: { flex: 1, minHeight: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", paddingHorizontal: 7 },
  switchActive: { backgroundColor: "#FFFFFF" },
  switchText: { fontSize: 14, fontWeight: "600", color: "#CAD9CD" },
  switchTextActive: { color: "#17281F" },
  form: { backgroundColor: "#FFFFFF", borderRadius: 23, padding: 18, gap: 13 },
  submit: { backgroundColor: "#17281F", borderColor: "#17281F" },
  skip: { minHeight: 48, justifyContent: "center", alignItems: "center", paddingHorizontal: 10 },
  skipText: { color: "#C3E6AE", fontSize: 15, fontWeight: "500", textAlign: "center" },
});

const guestPrefs = StyleSheet.create({
  page: { gap: 16, paddingBottom: 28 },
  // The exit control is intentionally bare: no fill, border, or outlined circle.
  close: { width: 48, height: 48, alignItems: "flex-start", justifyContent: "center",
    borderWidth: 0, backgroundColor: "transparent", alignSelf: "flex-start" },
  pressed: { opacity: 0.6 },
  eyebrow: { color: forest.greenRaised, fontSize: 11, fontWeight: "700",
    letterSpacing: 1.3 },
  heading: { color: forest.ink, fontFamily: "HomeHeadingStrong",
    fontSize: 34, lineHeight: 39, letterSpacing: -0.8 },
  description: { color: forest.muted, fontSize: 14, lineHeight: 22, marginBottom: 2 },
  card: { backgroundColor: forest.card, borderRadius: 21,
    borderWidth: 1, borderColor: forest.line, padding: 16 },
  help: { color: forest.muted, textAlign: "center", fontSize: 12, lineHeight: 18 },
});
