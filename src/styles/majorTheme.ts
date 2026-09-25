/** Premium navy/gold palette for Major tournament screens — colors taken
 *  from the approved PixelCoursePreviewMajor/PixelResultsMajor mockups, not
 *  invented fresh, so the real screens match what was signed off. Applied
 *  conditionally (`tournament.type === "major"`) on top of the normal
 *  cream/ink theme rather than replacing the shared CSS tokens, since the
 *  regular theme reuses one token (e.g. ink) for roles that need to diverge
 *  here (screen border vs header background vs CTA background are all
 *  different colors in the major palette). */
export const majorTheme = {
  screenBg: "#15203a",
  screenBorder: "#f0b429",
  headerBg: "#0b1226",
  gold: "#f0b429",
  ink: "#14251a",
  cream: "#f0e9c8",
  muted: "#b9c2dc",
  mutedDark: "#8a93ad",
  panelBg: "#223257",
  panelBorder: "#3a4a72",
  rowBg: "#1a2645",
  playerRowBg: "#2c1f3f",
  ctaShadow: "#8a6a1f",
  underPar: "#6fa8ff",
  overPar: "#e6a840",
  safeGreen: "#5fa06a",
  riskyPink: "#d97a86",
};
