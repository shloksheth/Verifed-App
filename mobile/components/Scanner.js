import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { colors, s } from "../styles";
import { Button, ErrorText, Field, Icon, Notice, Title } from "./UI";

export function resolveRestaurantCode(value, restaurants) {
  let candidate = String(value || "").trim();
  try {
    const url = new URL(candidate);
    const path = `${url.hash || url.pathname}`;
    const match = path.match(/restaurant\/([^?/#]+)/);
    candidate = match
      ? decodeURIComponent(match[1])
      : url.searchParams.get("restaurant") || candidate;
  } catch {
    // Plain codes are useful when a camera is unavailable.
  }
  if (candidate.toLowerCase() === "citrus")
    return restaurants.find((item) => item.name === "Citrus & Table");
  return restaurants.find(
    (item) =>
      item.id === candidate ||
      item.slug?.toLowerCase() === candidate.toLowerCase() ||
      item.name.toLowerCase() === candidate.toLowerCase(),
  );
}

export default function Scanner({ state, navigate }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const decoding = useRef(false);

  function openCode(value) {
    setRunning(false);
    const restaurant = resolveRestaurantCode(value, state.restaurants);
    if (!restaurant) {
      setError(
        "That code does not match an available menu. Try CITRUS for the fictional sample restaurant.",
      );
      return;
    }
    navigate(`restaurant/${restaurant.id}`);
  }

  async function startCamera() {
    setBusy(true);
    setError("");
    decoding.current = false;
    try {
      const access = permission?.granted
        ? permission
        : await requestPermission();
      if (!access.granted)
        throw new Error(
          "Camera permission is off. Enable it in device settings, or enter a menu code below.",
        );
      setRunning(true);
    } catch (failure) {
      setError(
        failure.message ||
          "The camera could not start. Enter a menu code below.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Title eyebrow="At your table" title="Pull up the menu.">
        Scan a Verifed QR code or enter a restaurant code.
      </Title>
      {running ? (
        <View style={s.camera}>
          <CameraView
            style={s.flex}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onMountError={(event) => {
              setRunning(false);
              setError(
                event.message ||
                  "The camera could not start. Use the menu code below.",
              );
            }}
            onBarcodeScanned={(event) => {
              if (!decoding.current) {
                decoding.current = true;
                openCode(event.data);
              }
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 180,
              height: 180,
              borderWidth: 2,
              borderColor: colors.cream,
              borderRadius: 20,
              alignSelf: "center",
              top: 60,
            }}
          />
        </View>
      ) : (
        <View style={s.cameraPlaceholder}>
          <Icon name="scan-outline" size={90} color={colors.cream} />
          <Text style={[s.h3, { color: colors.cream, textAlign: "center" }]}>
            Point at a Verifed QR code
          </Text>
          <Text style={[s.small, { color: "#D9CABC", textAlign: "center" }]}>
            Your camera stays off until you choose to turn it on.
          </Text>
        </View>
      )}
      {running ? (
        <Button
          variant="secondary"
          icon="camera-outline"
          onPress={() => setRunning(false)}
        >
          Stop camera
        </Button>
      ) : (
        <Button icon="camera-outline" busy={busy} onPress={startCamera}>
          Open camera
        </Button>
      )}
      <Text style={s.small}>
        Camera frames are decoded on your device. They are not saved or
        uploaded.
      </Text>
      <ErrorText error={error} />
      <View style={s.card}>
        <Text style={s.h2}>Have a menu code?</Text>
        <Field
          label="Restaurant code or menu link"
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="For example, CITRUS"
          onSubmitEditing={() => openCode(code)}
        />
        <Button
          variant="secondary"
          icon="arrow-forward"
          onPress={() => openCode(code)}
        >
          Open menu
        </Button>
      </View>
      <Notice>
        Just exploring? CITRUS opens Citrus & Table, a fictional restaurant.
      </Notice>
      <Button variant="quiet" onPress={() => openCode("CITRUS")}>
        Open the sample table
      </Button>
    </>
  );
}
