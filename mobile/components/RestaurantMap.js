import { Text } from "./Typography";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from "react-native";
import { colors } from "../styles";
import { websiteUrl } from "../src/config";
import { buildMapHtml, validMapCoordinates } from "../src/map-html";
import { Button } from "./UI";

// Web uses a normal iframe. Only native platforms load the native WebView module.
const NativeWebView =
  Platform.OS === "web" ? null : require("react-native-webview").WebView;
const count = (value) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export default function RestaurantMap({ results = [], center, onSelect }) {
  const instanceId = useId();
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState("loading");
  const frame = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const markers = results
    .filter(
      ({ restaurant }) =>
        typeof restaurant?.id === "string" &&
        validMapCoordinates(restaurant.coordinates),
    )
    .map(({ restaurant, supportedCount, possibleCount }) => ({
      id: restaurant.id,
      name: String(restaurant.name || "Restaurant").slice(0, 160),
      ...restaurant.coordinates,
      supportedCount: count(supportedCount),
      possibleCount: count(possibleCount),
    }));
  const area = validMapCoordinates(center)
    ? {
        latitude: center.latitude,
        longitude: center.longitude,
        label: String(center.label || "Search area").slice(0, 160),
      }
    : null;
  const signature = JSON.stringify({ markers, center: area });
  const fingerprint = useMemo(() => {
    // A changed dataset gets a new channel, so a previous frame's late load
    // message cannot mark the replacement map ready. This is not a credential.
    let hash = 2166136261;
    for (let index = 0; index < signature.length; index++)
      hash = Math.imul(hash ^ signature.charCodeAt(index), 16777619);
    return (hash >>> 0).toString(36);
  }, [signature]);
  const channel = `verifed-map-${instanceId}-${revision}-${fingerprint}`;
  const html = useMemo(
    () => buildMapHtml({ ...JSON.parse(signature), channel }),
    [signature, channel],
  );
  const current = useRef({ ids: new Set(), channel });
  current.current = {
    ids: new Set(markers.map((marker) => marker.id)),
    channel,
  };

  const handleMessage = useRef(null);
  handleMessage.current = (raw) => {
    try {
      if (typeof raw !== "string" || raw.length > 2000) return;
      const message = JSON.parse(raw);
      if (message.channel !== current.current.channel) return;
      if (message.type === "ready") setStatus("ready");
      else if (message.type === "error") setStatus("error");
      else if (message.type === "select" && current.current.ids.has(message.id))
        onSelectRef.current?.(message.id);
    } catch {
      /* Ignore malformed frame messages; they cannot become app routes. */
    }
  };

  useEffect(() => {
    setStatus("loading");
    const timeout = setTimeout(
      () => setStatus((value) => (value === "ready" ? value : "error")),
      16000,
    );
    return () => clearTimeout(timeout);
  }, [html]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    function receive(event) {
      // A matching string alone is insufficient: the event must come from this map frame.
      if (event.source === frame.current?.contentWindow)
        handleMessage.current(event.data);
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  function allowNavigation(request) {
    if (
      request.url === "about:blank" ||
      request.url === websiteUrl ||
      request.url === websiteUrl + "/"
    )
      return true;
    // Attribution stays usable without allowing a third-party page to replace the map bridge.
    if (request.url.startsWith("https://www.openstreetmap.org/"))
      Linking.openURL(request.url).catch(() => {});
    return false;
  }

  return (
    <View style={styles.section}>
      <View style={styles.topline}>
        <Text style={styles.title}>Restaurant locations</Text>
        <Text style={styles.small}>
          {markers.length} {markers.length === 1 ? "place" : "places"}
        </Text>
      </View>
      <Text style={styles.small}>
        Tap a numbered pin to open its menu. Drag to move; use + and − to zoom.
      </Text>
      <View style={styles.frame}>
        {status !== "error" &&
          (Platform.OS === "web" ? (
            React.createElement("iframe", {
              key: revision,
              ref: frame,
              title: "Interactive restaurant map",
              srcDoc: html,
              // This is trusted app-generated HTML, never arbitrary user HTML.
              // Its real origin is needed for the tile provider's Referer policy.
              sandbox:
                "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox",
              referrerPolicy: "strict-origin-when-cross-origin",
              style: {
                width: "100%",
                height: "100%",
                border: 0,
                display: "block",
              },
            })
          ) : (
            <NativeWebView
              key={revision}
              source={{ html, baseUrl: websiteUrl + "/" }}
              style={styles.native}
              originWhitelist={["*"]}
              userAgent={`VerifedCAC/1.0 (+${websiteUrl})`}
              onMessage={(event) =>
                handleMessage.current(event.nativeEvent.data)
              }
              onError={() => setStatus("error")}
              onHttpError={() => setStatus("error")}
              onShouldStartLoadWithRequest={allowNavigation}
              geolocationEnabled={false}
              javaScriptCanOpenWindowsAutomatically={false}
              javaScriptEnabled
              cacheEnabled
              cacheMode="LOAD_DEFAULT"
              scrollEnabled={false}
              bounces={false}
              nestedScrollEnabled
            />
          ))}
        {status === "loading" && (
          <View style={styles.loading} pointerEvents="none">
            <ActivityIndicator color={colors.green} />
            <Text style={styles.small}>Loading map…</Text>
          </View>
        )}
        {status === "error" && (
          <View style={styles.unavailable}>
            <Text style={styles.title}>The map could not load</Text>
            <Text style={styles.body}>
              Keep exploring the restaurant list below. Map tiles need an
              internet connection.
            </Text>
            <Button
              variant="secondary"
              onPress={() => {
                setStatus("loading");
                setRevision((value) => value + 1);
              }}
            >
              Try map again
            </Button>
          </View>
        )}
      </View>
      <View style={styles.legend}>
        <Text style={[styles.key, { color: colors.green }]}>
          ● Reported matches
        </Text>
        <Text style={[styles.key, { color: colors.orangeDark }]}>
          ● Possible options
        </Text>
        <Text style={[styles.key, { color: colors.muted }]}>● Menu</Text>
      </View>
      <Text style={styles.small}>
        Pin colors reflect menu evidence. Locations without coordinates stay in
        the list.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  topline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { fontWeight: "800", fontSize: 16, color: colors.ink },
  small: { fontSize: 12, lineHeight: 17, color: colors.muted },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    textAlign: "center",
  },
  frame: {
    height: 300,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
    backgroundColor: colors.paleGreen,
  },
  native: { flex: 1, backgroundColor: colors.paleGreen },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F7F5EFD9",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  unavailable: {
    flex: 1,
    padding: 20,
    gap: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  legend: { flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 4 },
  key: { fontSize: 11, lineHeight: 16, fontWeight: "700" },
});
