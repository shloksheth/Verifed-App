// Fixed presentation transcript of the supplied Sayola menu, not live OCR.
import { sayolaItems } from "./sayola-menu-data.js";
export const fixedMenuSource = {
  page: 1,
  mode: "fixed-menu-demo",
  kind: "user-provided-image",
  image: "assets/scan/sayola-menu.webp",
};
export function fixedSpanishMenu() {
  return {
    id: "sayola-dinner-fixed",
    title: "Sayola",
    sourceLabel: "Dinner menu · Spanish names → English",
    originalLanguageLabel: "Original menu",
    demoMode: true,
    source: { ...fixedMenuSource },
    headingEn: "Dinner menu",
    headingEs: "Dinner menu",
    currency: "USD",
    notesEn: [
      "A 3% processing fee will be added to all credit card transactions. There is no fee for debit cards.",
      "Please inform staff of any food allergies before ordering.",
    ],
    notesEs: [
      "A 3% PROCESSING FEE WILL BE ADDED TO ALL CREDIT CARD TRANSACTIONS. THERE IS NO FEE FOR DEBIT CARDS.",
      "PLEASE INFORM STAFF OF ANY FOOD ALLERGIES BEFORE ORDERING",
    ],
    legendEn:
      "GF · V · VG: symbols copied from the printed menu. They do not list every ingredient.",
    legendEs:
      "GF · V · VG: símbolos copiados del menú impreso. No enumeran todos los ingredientes.",
    items: sayolaItems.map((item) => ({
      ...item,
      sourceLabels: [...item.sourceLabels],
      tags: [...item.tags],
    })),
  };
}
export function menuAfterPhoto(photo) {
  return { photo, menu: fixedSpanishMenu() };
}
