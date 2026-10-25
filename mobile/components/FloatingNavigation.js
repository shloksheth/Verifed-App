import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { colors } from "../src/design-tokens";
import { contextualPages, navigationItems } from "../src/navigation-model";
import { Text } from "./Typography";
import { Icon } from "./UI";

const quickActions = [
  { label: "Scan a menu", icon: "scan-outline", action: "scan" },
  { label: "Log a meal", icon: "create-outline", action: "meal" },
  { label: "Dietary profile", icon: "person-outline", action: "profile" },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => { if (mounted) setReduced(enabled); })
      .catch(() => {});
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => { mounted = false; listener?.remove?.(); };
  }, []);
  return reduced;
}

export default function FloatingNavigation({ activeRoute, navigate, openSheet, onHomeAgain }) {
  const [railWidth, setRailWidth] = useState(0);
  const [quickOpen, setQuickOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const index = Math.max(0, navigationItems.findIndex((item) => item.route === activeRoute));
  const marker = useRef(new Animated.Value(index)).current;
  const expansion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(marker, {
      toValue: index,
      duration: reducedMotion ? 0 : 230,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [index, marker, reducedMotion]);

  useEffect(() => {
    const animation = Animated.spring(expansion, {
      toValue: quickOpen ? 1 : 0,
      speed: reducedMotion ? 100 : 22,
      bounciness: reducedMotion ? 0 : 4,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [expansion, quickOpen, reducedMotion]);

  const innerWidth = Math.max(0, railWidth - 12);
  const tabWidth = innerWidth / navigationItems.length;
  const slide = marker.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3],
  });
  const menuRise = expansion.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const plusRotation = expansion.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] });

  function activate(target) {
    setQuickOpen(false);
    if (target === "home" && target === activeRoute) onHomeAgain?.();
    navigate(target);
  }

  function activateQuick(action) {
    setQuickOpen(false);
    if (action === "meal") {
      openSheet({ type: "meal" });
    } else {
      navigate(action);
    }
  }

  return (
    <>
      {quickOpen && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close quick actions"
          onPress={() => setQuickOpen(false)}
          style={styles.scrim}
        />
      )}
      <View style={styles.dock}>
        <View
          onLayout={({ nativeEvent }) => {
            const width = nativeEvent.layout.width;
            if (Math.abs(width - railWidth) > 1) setRailWidth(width);
          }}
          style={styles.rail}
          accessibilityLabel="Main navigation"
        >
          {railWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[styles.selection, {
                width: tabWidth,
                transform: [{ translateX: slide }],
              }]}
            />
          )}
          {navigationItems.map((item) => {
            const selected = item.route === activeRoute;
            return (
              <Pressable
                key={item.route}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={item.label}
                onPress={() => activate(item.route)}
                style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              >
                <Icon name={selected ? item.active : item.icon} size={23} color={selected ? colors.paper : colors.muted} />
                <Text style={[styles.tabLabel, selected && styles.tabLabelActive]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={quickOpen ? "Close quick actions" : "Open quick actions"}
          accessibilityState={{ expanded: quickOpen }}
          onPress={() => setQuickOpen((open) => !open)}
          style={({ pressed }) => [styles.plus, pressed && styles.pressed]}
        >
          <Animated.View style={{ transform: [{ rotate: plusRotation }] }}>
            <Icon name="add" size={35} color={colors.paper} />
          </Animated.View>
        </Pressable>
        <Animated.View
          pointerEvents={quickOpen ? "auto" : "none"}
          accessibilityElementsHidden={!quickOpen}
          importantForAccessibility={quickOpen ? "auto" : "no-hide-descendants"}
          style={[styles.quickMenu, { opacity: expansion, transform: [{ translateY: menuRise }] }]}
        >
          {quickActions.map((item) => (
            <Pressable
              key={item.action}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => activateQuick(item.action)}
              style={({ pressed }) => [styles.quickAction, pressed && styles.quickPressed]}
            >
              <Icon name={item.icon} size={21} color={colors.green} />
              <Text style={styles.quickLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      </View>
    </>
  );
}

export function ContextualNavigation({ page, goBack, navigate, accentColor = colors.green }) {
  const item = contextualPages[page] || {
    title: "Details", icon: "document-text-outline",
    action: "Home", actionIcon: "home-outline", target: "home",
  };
  function back() {
    if (!goBack()) navigate("home");
  }
  return (
    <View style={styles.contextDock}>
      <View style={styles.contextRail}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={back}
          style={({ pressed }) => [styles.contextBack, { backgroundColor: accentColor }, pressed && styles.pressed]}
        >
          <Icon name="arrow-back" size={23} color={colors.paper} />
        </Pressable>
        <View style={styles.contextTitle}>
          <Icon name={item.icon} color={accentColor} size={20} />
          <Text style={styles.contextText} numberOfLines={1}>{item.title}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.action}
          onPress={() => navigate(item.target)}
          style={({ pressed }) => [styles.contextAction, pressed && styles.pressed]}
        >
          <Icon name={item.actionIcon} size={20} color={accentColor} />
          <Text style={[styles.contextActionText, { color: accentColor }]} numberOfLines={1}>{item.action}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const shadow = {
  shadowColor: "#463C32",
  shadowOpacity: 0.13,
  shadowRadius: 13,
  shadowOffset: { width: 0, height: 5 },
  elevation: 7,
};

const styles = StyleSheet.create({
  dock: {
    height: 88,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 20,
  },
  rail: {
    ...shadow,
    flex: 1,
    height: 70,
    flexDirection: "row",
    position: "relative",
    alignItems: "stretch",
    padding: 6,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  selection: {
    position: "absolute",
    top: 5,
    bottom: 5,
    left: 6,
    borderRadius: 32,
    backgroundColor: colors.green,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 31,
    minHeight: 54,
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  tabLabelActive: { color: colors.paper, fontWeight: "700" },
  plus: {
    ...shadow,
    width: 69,
    height: 69,
    borderRadius: 35,
    backgroundColor: colors.green,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { transform: [{ scale: 0.94 }], opacity: 0.88 },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: "rgba(31, 42, 35, 0.13)",
  },
  quickMenu: {
    ...shadow,
    position: "absolute",
    bottom: 96,
    right: 14,
    minWidth: 210,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    zIndex: 22,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 17,
  },
  quickPressed: { backgroundColor: colors.paleGreen },
  quickLabel: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  contextDock: {
    height: 85,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 10,
  },
  contextRail: {
    ...shadow,
    flexDirection: "row",
    alignItems: "center",
    height: 66,
    padding: 6,
    gap: 8,
    borderRadius: 36,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.paper,
  },
  contextBack: {
    width: 53,
    height: 53,
    borderRadius: 28,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  contextTitle: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contextText: { flexShrink: 1, color: colors.ink, fontSize: 14, fontWeight: "700" },
  contextAction: {
    minWidth: 59,
    minHeight: 48,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    borderRadius: 25,
  },
  contextActionText: { fontSize: 10, fontWeight: "600", color: colors.green },
});
