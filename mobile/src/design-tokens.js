// One palette for the app. Restaurant logos keep their own brand colors.
// Coral marks actions; green marks selection; red is reserved for conflicts.
export const colors = {
  cream: "#FFF0E2",
  paper: "#FFF9F2",
  ink: "#292E25",
  muted: "#5E6759",
  orange: "#BD4220",
  orangeDark: "#AD371B",
  coral: "#F26B4F",
  peach: "#F6D9C4",
  line: "#E3CAB5",
  green: "#216642",
  paleGreen: "#DCEBD8",
  red: "#AD302B",
  paleRed: "#FCECEA",
  surface: "#FAE6D5",
  onGreen: "#FFF9F2",
};

export const spacing = { small: 8, medium: 16, page: 20, section: 28 };
export const radius = { control: 12, card: 18, pill: 28 };

// The same roles apply on every screen; only the welcome artwork is display-sized.
export const type = {
  page: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  section: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  card: { fontSize: 17, lineHeight: 24, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 23, fontWeight: "400" },
  meta: { fontSize: 13, lineHeight: 20, fontWeight: "400" },
  caption: { fontSize: 11, lineHeight: 16, fontWeight: "500" },
  button: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
};
