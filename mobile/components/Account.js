import React, { useState } from "react";
import { Linking, Pressable, Share, Text, View } from "react-native";
import { api } from "../src/api";
import {
  ALLERGENS,
  RESTRICTIONS,
  TASTE_TAGS,
  defaultProfile,
} from "../src/data";
import { googleAuthEnabled, websiteUrl } from "../src/config";
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
  useTask,
} from "./UI";
import { DemoButton } from "./Dining";

export function Auth({ state, navigate, recovery = false }) {
  const [mode, setMode] = useState(recovery ? "recover" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const task = useTask();
  function changeMode(next) {
    setMode(next);
    setNotice("");
    task.setError("");
  }
  async function submit() {
    if (mode !== "recover" && !email.trim())
      return task.setError("Enter your email address.");
    if (!["reset", "signin"].includes(mode) && password.length < 8)
      return task.setError("Use at least eight characters for your password.");
    if (mode === "signin" && !password)
      return task.setError("Enter your password.");
    task.run(async () => {
      if (mode === "reset") {
        await api.resetPassword(email.trim());
        setNotice(
          "If this address has an account, a reset link will arrive by email.",
        );
      } else if (mode === "recover") {
        await api.updatePassword(password);
        navigate("home");
      } else {
        await api.signIn(email.trim(), password);
        navigate("home");
      }
    });
  }
  const labels = {
    signin: "Welcome to your table.",
    reset: "A fresh start.",
    recover: "Choose a new password.",
  };
  return (
    <>
      <Title eyebrow="Your dining companion" title={labels[mode]}>
        Save the good meals. Keep the conversation clear.
      </Title>
      {mode === "signin" && (
        <>
          <Button
            icon="logo-google"
            variant="secondary"
            busy={task.busy}
            disabled={!googleAuthEnabled}
            onPress={() =>
              task.run(
                () => api.signInWithGoogle(),
                () => navigate("home"),
              )
            }
          >
            Continue with Google
          </Button>
          <Text style={s.small}>
            {googleAuthEnabled
              ? "Google sign-in requires a Verifed development build. In Snack or Expo Go, try the local demo or use the companion website."
              : "Google sign-in setup is pending. Try the local demo while the provider is being configured."}
          </Text>
          {googleAuthEnabled && (
            <Button
              variant="quiet"
              icon="open-outline"
              busy={task.busy}
              onPress={() =>
                task.run(() => Linking.openURL(`${websiteUrl}/#/auth`))
              }
            >
              Open companion sign-in
            </Button>
          )}
          <View style={s.divider} />
        </>
      )}
      <View style={s.card}>
        <Text style={s.small}>
          For an existing email account. New accounts use Google on the
          companion website or a Verifed development build.
        </Text>
        {mode !== "recover" && (
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
          />
        )}
        {mode !== "reset" && (
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            placeholder="At least 8 characters"
          />
        )}
        {mode === "signin" && (
          <Pressable
            accessibilityRole="button"
            onPress={() => changeMode("reset")}
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
        <>
          <Text style={[s.small, { textAlign: "center" }]}>
            Or take a look around with fictional sample data.
          </Text>
          <DemoButton navigate={navigate} />
          <Button variant="quiet" onPress={() => navigate("home")}>
            Continue browsing
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
        <Chips
          label="Dietary restrictions"
          options={RESTRICTIONS}
          value={draft.restrictions}
          onChange={(value) => update("restrictions", value)}
        />
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
            () => navigate(/^restaurant\/[a-zA-Z0-9-]+$/.test(returnTo || "") ? returnTo : "profile", { unwind: true }),
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
          page: "workspace",
          icon: "restaurant-outline",
          title: "Restaurant space",
          subtitle: "Review requests and manage a sample menu",
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
            Export your profile, saved dishes, meals, and visible requests.
          </Text>
          <Button
            variant="secondary"
            icon="share-outline"
            busy={task.busy}
            onPress={() => task.run(exportData)}
          >
            Export my data
          </Button>
          {state.mode !== "guest" && (
            <Button
              variant="danger"
              icon="trash-outline"
              onPress={() => setConfirm(true)}
            >
              {state.mode === "demo"
                ? "Reset local demo"
                : "Delete my personal app data"}
            </Button>
          )}
          <Text style={s.small}>
            {state.mode === "demo"
              ? "Reset restores the original demo activity and current public menu catalog."
              : "Deleting app data removes your profile, meals, favorites, and requests. Your login and restaurant business records remain."}
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
            state.mode === "demo"
              ? "Reset your demo?"
              : "Delete personal app data?"
          }
          onClose={() => setConfirm(false)}
        >
          <Text style={s.body}>
            {state.mode === "demo"
              ? "Your local changes will be replaced with the original sample data."
              : "Your personal app data will be removed. Export it first if you want to keep a copy. Your login and business records remain."}
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
            Confirm {state.mode === "demo" ? "reset" : "deletion"}
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
      <Title eyebrow="About Verifed" title="Using local menus">
        Compare public menu information with your dietary needs. Open the
        original sources and confirm questions with the restaurant.
      </Title>
      {[
        {
          step: "01",
          title: "Choose your dietary needs",
          text: "Select allergies and preferences in your profile. A guest browsing profile is saved only on this device, not to an account.",
          icon: "person-outline",
        },
        {
          step: "02",
          title: "Read the source",
          text: "Each local menu has source links and a review date. Chainwide information may differ from preparation at a specific location.",
          icon: "chatbubble-ellipses-outline",
        },
        {
          step: "03",
          title: "Confirm with the restaurant",
          text: "Use the call button for current ingredients, modifications and cross-contact questions. Save menu items or log meals when signed in or using the local demo.",
          icon: "checkmark-done-outline",
        },
      ].map((item) => (
        <View key={item.step} style={s.card}>
          <View style={s.between}>
            <Text style={s.eyebrow}>{item.step}</Text>
            <Icon name={item.icon} color={colors.orangeDark} />
          </View>
          <Text style={s.h2}>{item.title}</Text>
          <Text style={s.body}>{item.text}</Text>
        </View>
      ))}
      <Section title="A few useful answers">
        {[
          {
            title: "What does a kitchen response mean?",
            text: "It records communication, not a food safety certification. Verifed cannot inspect food, detect undeclared changes, or guarantee absence of allergens or cross-contact.",
          },
          {
            title: "Are these real restaurants?",
            text: "Local menus list real Orlando restaurants from public official sources. They are not connected or partnered kitchens. Sample kitchens are fictional and are listed separately for practice requests. Missing prices say Check menu.",
          },
          {
            title: "How are dishes ranked?",
            text: "Tags use your likes, dislikes, and meal ratings. Known allergen conflicts rank after other items. Missing or incomplete allergen coverage remains unknown; a match never means an item is safe.",
          },
          {
            title: "Where is information stored?",
            text: "The local demo stays on this device. Signed-in accounts use the connected Supabase backend. Staff see the requirements shared in requests for their restaurant. Export and deletion are in settings.",
          },
          {
            title: "Is this an order?",
            text: "A request is a conversation, not a placed or paid order. Discuss ordering directly with the restaurant.",
          },
        ].map((item) => (
          <View key={item.title} style={s.card}>
            <Text style={s.h3}>{item.title}</Text>
            <Text style={s.body}>{item.text}</Text>
          </View>
        ))}
      </Section>
      <Button onPress={() => navigate("explore")}>Find your next dish</Button>
    </>
  );
}
