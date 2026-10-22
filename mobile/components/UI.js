import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, s } from "../styles";

export function Icon({ name, size = 20, color = colors.ink }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function Button({
  children,
  onPress,
  icon,
  variant = "primary",
  busy,
  disabled,
  style,
}) {
  const secondary = variant !== "primary";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s[`button${variant[0].toUpperCase()}${variant.slice(1)}`],
        (busy || disabled || pressed) && s.disabled,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? colors.ink : colors.paper} />
      ) : icon ? (
        <Icon
          name={icon}
          size={18}
          color={secondary ? colors.ink : colors.paper}
        />
      ) : null}
      <Text style={[s.buttonText, secondary && s.buttonSecondaryText]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Title({ eyebrow, title, children }) {
  return (
    <View>
      {!!eyebrow && <Text style={s.eyebrow}>{eyebrow.toUpperCase()}</Text>}
      <Text accessibilityRole="header" style={s.title}>
        {title}
      </Text>
      {!!children && <Text style={s.subtitle}>{children}</Text>}
    </View>
  );
}

export function Section({ title, action, onPress, children }) {
  return (
    <View style={s.section}>
      <View style={s.between}>
        <Text accessibilityRole="header" style={s.h2}>
          {title}
        </Text>
        {!!action && (
          <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}>
            <Text style={s.link}>{action}</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

export const FormScrollContext = createContext(null);

export function Field({ label, hint, multiline, onFocus, ...props }) {
  const input = useRef(null);
  const scroll = useContext(FormScrollContext);
  const revealInput = useCallback(() => {
    if (Platform.OS !== "web" && input.current?.isFocused())
      scroll?.current?.scrollResponderScrollNativeHandleToKeyboard(
        input.current,
        24,
        true,
      );
  }, [scroll]);
  useEffect(() => {
    const listener = Keyboard.addListener("keyboardDidShow", () =>
      requestAnimationFrame(revealInput),
    );
    return () => listener.remove();
  }, [revealInput]);
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        ref={input}
        onFocus={(event) => {
          onFocus?.(event);
          revealInput();
        }}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[s.input, multiline && s.multiline]}
        multiline={multiline}
        {...props}
      />
      {!!hint && <Text style={[s.small, { marginTop: 6 }]}>{hint}</Text>}
    </View>
  );
}

export function Chips({ options, value = [], onChange, label }) {
  return (
    <View style={s.section}>
      {!!label && <Text style={s.label}>{label}</Text>}
      <View style={s.wrap}>
        {[...new Set(options)].map((item) => {
          const selected = value.includes(item);
          return (
            <Pressable
              key={item}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              aria-checked={selected}
              accessibilityLabel={item}
              onPress={() =>
                onChange(
                  selected ? value.filter((v) => v !== item) : [...value, item],
                )
              }
              style={[s.chip, selected && s.chipActive]}
            >
              <Text style={[s.chipText, selected && s.chipActiveText]}>
                {selected ? "✓ " : ""}
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Tabs({ options, value, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {options.map((item) => {
        const key = typeof item === "string" ? item : item.value;
        const text = typeof item === "string" ? item : item.label;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: value === key }}
            key={key}
            onPress={() => onChange(key)}
            style={[s.chip, value === key && s.chipActive]}
          >
            <Text style={[s.chipText, value === key && s.chipActiveText]}>
              {text}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Tags({ values = [], fallback = "None added" }) {
  return values.length ? (
    <View style={s.wrap}>
      {values.map((item, index) => (
        <View style={s.chip} key={`${item}-${index}`}>
          <Text style={s.chipText}>{item}</Text>
        </View>
      ))}
    </View>
  ) : (
    <Text style={s.small}>{fallback}</Text>
  );
}

export function Notice({ children, conflict = false }) {
  return (
    <View style={[s.notice, conflict && { backgroundColor: colors.paleRed }]}>
      <Icon
        name={conflict ? "alert-circle-outline" : "information-circle-outline"}
        size={18}
        color={conflict ? colors.red : colors.orangeDark}
      />
      <Text style={s.noticeText}>{children}</Text>
    </View>
  );
}

export function ErrorText({ error }) {
  return error ? (
    <View accessibilityRole="alert" style={s.error}>
      <Text style={s.errorText}>{error}</Text>
    </View>
  ) : null;
}

export function Empty({
  title,
  children,
  icon = "leaf-outline",
  action,
  onPress,
}) {
  return (
    <View style={[s.card, s.empty]}>
      <Icon name={icon} size={35} color={colors.green} />
      <Text style={[s.h3, { textAlign: "center" }]}>{title}</Text>
      {!!children && (
        <Text style={[s.small, { textAlign: "center" }]}>{children}</Text>
      )}
      {!!action && (
        <Button variant="secondary" onPress={onPress}>
          {action}
        </Button>
      )}
    </View>
  );
}

export function Sheet({ title, onClose, children }) {
  const scroll = useRef(null);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.modalBackdrop}
      >
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            <Text accessibilityRole="header" style={[s.h2, { flex: 1 }]}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
              style={s.iconButton}
            >
              <Icon name="close" />
            </Pressable>
          </View>
          <FormScrollContext.Provider value={scroll}>
            <ScrollView
              ref={scroll}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.modalContent}
            >
              {children}
            </ScrollView>
          </FormScrollContext.Provider>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function useTask() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  async function run(work, then) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await work();
      if (then) await then(result);
      return result;
    } catch (failure) {
      setError(failure?.message || "That did not finish. Please try again.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { busy, error, run, setError };
}

const statusLabels = {
  submitted: "At the kitchen",
  responded: "Response ready",
  clarification: "Question from kitchen",
  declined: "Unable to accommodate",
  review_required: "New review needed",
  acknowledged: "Response read",
  completed: "Completed",
  cancelled: "Cancelled",
};
export function Status({ status }) {
  return (
    <View
      style={[
        s.badge,
        ["review_required", "declined"].includes(status) && {
          backgroundColor: colors.paleRed,
        },
      ]}
    >
      <Text
        style={[
          s.badgeText,
          ["review_required", "declined"].includes(status) && {
            color: colors.red,
          },
        ]}
      >
        {statusLabels[status] || status}
      </Text>
    </View>
  );
}

export const money = (price) =>
  price === null ||
  price === undefined ||
  price === "" ||
  !Number.isFinite(Number(price))
    ? "Check menu"
    : `$${Number(price).toFixed(2)}`;
export const date = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
export const splitList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
export const closedRequest = (request) =>
  ["completed", "cancelled", "declined"].includes(request.status);
