import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  CameraOff,
  ScanLine,
  Utensils,
} from "lucide-react";
import { Button, ErrorMessage, Field, PageTitle } from "./UI";

export default function Scanner({ state, navigate }) {
  const scanner = useRef(null);
  const mounted = useRef(true);
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const active = scanner.current;
      if (active?.isScanning)
        active
          .stop()
          .catch(() => {})
          .finally(() => active.clear());
    };
  }, []);
  function resolveCode(value) {
    let candidate = value.trim();
    try {
      const url = new URL(candidate);
      const match = url.hash.match(/^#\/?restaurant\/([^?]+)/);
      candidate = match
        ? decodeURIComponent(match[1])
        : url.searchParams.get("restaurant") || candidate;
    } catch {
      /* Plain restaurant codes are also supported. */
    }
    if (candidate.toLowerCase() === "citrus")
      candidate =
        state.restaurants.find((item) => item.name === "Citrus & Table")?.id ||
        candidate;
    return state.restaurants.find(
      (item) =>
        item.id === candidate ||
        item.name.toLowerCase() === candidate.toLowerCase(),
    );
  }
  async function stop() {
    if (scanner.current?.isScanning) await scanner.current.stop();
    scanner.current?.clear();
    if (mounted.current) setRunning(false);
  }
  async function openCode(value) {
    const restaurant = resolveCode(value);
    if (!restaurant) {
      setError(
        "That code does not match an available restaurant. Try CITRUS for the sample menu.",
      );
      return;
    }
    await stop();
    navigate(`restaurant/${restaurant.id}`);
  }
  async function start() {
    setError("");
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Camera access requires a supported browser on HTTPS or localhost. Enter a restaurant code below.",
        );
      const { Html5Qrcode } = await import("html5-qrcode");
      const instance = new Html5Qrcode("verifed-qr-reader");
      scanner.current = instance;
      await instance.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        (value) => {
          if (mounted.current)
            openCode(value).catch((failure) => setError(failure.message));
        },
        () => {},
      );
      if (!mounted.current) {
        await instance.stop();
        instance.clear();
        return;
      }
      setRunning(true);
    } catch (failure) {
      if (mounted.current)
        setError(
          typeof failure === "string"
            ? failure
            : failure.message ||
                "The camera could not start. Check camera permission or use a restaurant code.",
        );
    } finally {
      if (mounted.current) setStarting(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="AT YOUR TABLE"
        title="Scan a menu"
        description="Scan a restaurant's Verifed QR code, or enter its code below."
      />
      <div className="scanner-layout">
        <section className="scanner-card">
          <div className={`scanner-viewport ${running ? "running" : ""}`}>
            <div id="verifed-qr-reader" />
            {!running && !starting && (
              <div className="scanner-placeholder">
                <div className="scan-frame">
                  <ScanLine size={64} />
                </div>
                <h2>Point at a Verifed QR code</h2>
                <p>Your camera is off until you choose to turn it on.</p>
              </div>
            )}
            {starting && (
              <div className="scanner-loading">Opening your camera…</div>
            )}
          </div>
          <div className="scanner-controls">
            {running ? (
              <Button
                variant="secondary"
                onClick={() =>
                  stop().catch((failure) => setError(failure.message))
                }
              >
                <CameraOff size={18} />
                Stop camera
              </Button>
            ) : (
              <Button busy={starting} onClick={start}>
                <Camera size={18} />
                Open camera
              </Button>
            )}
            <p>
              Camera frames are decoded on this device.
              <br />
              They are not saved or uploaded.
            </p>
          </div>
          <ErrorMessage error={error} />
        </section>
        <section className="scanner-manual panel">
          <span className="scanner-manual-icon">
            <Utensils size={24} />
          </span>
          <h2>Enter a menu code</h2>
          <p>Enter the restaurant's code or paste its Verifed menu link.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              openCode(code).catch((failure) => setError(failure.message));
            }}
          >
            <Field label="Restaurant code or menu link">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="For example, CITRUS"
                required
                autoCapitalize="none"
              />
            </Field>
            <Button type="submit" variant="secondary" className="full-width">
              Open menu <ArrowRight size={17} />
            </Button>
          </form>
          <div className="demo-code">
            <span className="eyebrow">Just exploring?</span>
            <h3>Try our sample table.</h3>
            <p>CITRUS opens Citrus & Table, a fictional restaurant.</p>
            <button className="text-button" onClick={() => openCode("CITRUS")}>
              Open sample menu <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
