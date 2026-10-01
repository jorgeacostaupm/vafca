import type { ThemeConfig } from "antd";

import { APP_NAV_RAIL_WIDTH, GROUPING_LEGEND_HEIGHT, GROUPING_LEGEND_INACTIVE_OPACITY, GROUPING_LEGEND_Z_INDEX, NETWORK_CONTROL_FIELD_WIDTH, UI_CONTROL_HEIGHT, UI_CONTROL_HEIGHT_COMPACT } from "@/config/ui";

export const appColors = {
  annotationOverlap: '#ff0000',
  primary: "#2b5d9b",
  primaryHover: "#26548c",
  primaryActive: "#1f4575",
  bg: "#f3f5f9",
  surface: "#ffffff",
  surface2: "#f7f8fb",
  border: "#d5dde7",
  borderSecondary: "#e3e9f2",
  text: "#0f1a24",
  textSecondary: "#5c6c7c",
  success: "#1f8f6f",
  warning: "#b97a1c",
  visualHighlight: "#f97316",
  visualSelection: "#facc15",
  networkLink: "#377eb8",
  spatialNode: "#4daf4a",
  spatialDivergingNode: "#4daf4a",
  spatialLight: "#ffffff",
  spatialIncident: "#4daf4a",
  spatialNeutral: "#808080",
  spatialLink: "#000000",
  networkLinkPositive: "#377eb8",
  networkLinkNegative: "#e41a1c",
  error: "#c53a3a",
  disabledBg: "#eef1f5",
  placeholder: "#667587",
  successSoft: "#edf6f2",
  warningSoft: "#fbf5e9",
  selectionSoft: "#fef9c3",
  primarySoft: "#eef2f8",
  primarySubtle: "#f3f6fb",
  primaryRgb: "43, 93, 155",
} as const;

export const VISUAL_HIGHLIGHT_COLOR = appColors.visualHighlight;
export const VISUAL_SELECTION_COLOR = appColors.visualSelection;
export const NETWORK_LINK_COLOR = appColors.networkLink;
export const NETWORK_LINK_POSITIVE_COLOR = appColors.networkLinkPositive;
export const NETWORK_LINK_NEGATIVE_COLOR = appColors.networkLinkNegative;

export const appShadows = {
  toggleActive: "inset 0 0 0 1px var(--color-success)",
  sm: "0 1px 2px rgba(15, 24, 36, 0.06)",
  md: "0 8px 18px rgba(15, 24, 36, 0.08)",
  lg: "0 16px 36px rgba(15, 24, 36, 0.12)",
} as const;

export const appRadii = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  pill: "999px",
} as const;

export const appSpacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  7: "32px",
  8: "40px",
} as const;

export const appFonts = {
  body: '"Plus Jakarta Sans", "IBM Plex Sans", sans-serif',
  display: '"Space Grotesk", "Plus Jakarta Sans", sans-serif',
} as const;

export const appCssVariables = {
  "--network-control-field-width": `${NETWORK_CONTROL_FIELD_WIDTH}px`,
  "--control-height": `${UI_CONTROL_HEIGHT}px`,
  "--control-height-compact": `${UI_CONTROL_HEIGHT_COMPACT}px`,
  "--color-disabled-bg": appColors.disabledBg,
  "--color-placeholder": appColors.placeholder,
  "--color-success-soft": appColors.successSoft,
  "--color-warning-soft": appColors.warningSoft,
  "--color-selection-soft": appColors.selectionSoft,
  "--color-primary": appColors.primary,
  "--color-primary-rgb": appColors.primaryRgb,
  "--color-primary-hover": appColors.primaryHover,
  "--color-primary-active": appColors.primaryActive,
  "--color-primary-subtle": appColors.primarySubtle,
  "--color-bg": appColors.bg,
  "--app-nav-rail-width": `${APP_NAV_RAIL_WIDTH}px`,
  "--grouping-legend-inactive-opacity": String(GROUPING_LEGEND_INACTIVE_OPACITY),
  "--grouping-legend-height": `${GROUPING_LEGEND_HEIGHT}px`,
  "--grouping-legend-z-index": String(GROUPING_LEGEND_Z_INDEX),
  "--color-surface": appColors.surface,
  "--color-surface-2": appColors.surface2,
  "--color-border": appColors.border,
  "--color-border-secondary": appColors.borderSecondary,
  "--color-border-strong": "#c3cedb",
  "--color-text": appColors.text,
  "--color-text-muted": appColors.textSecondary,
  "--color-success": appColors.success,
  "--color-warning": appColors.warning,
  "--color-visual-highlight": VISUAL_HIGHLIGHT_COLOR,
  "--color-visual-selection": VISUAL_SELECTION_COLOR,
  "--color-network-link": NETWORK_LINK_COLOR,
  "--color-spatial-link": appColors.spatialLink,
  "--color-network-link-positive": NETWORK_LINK_POSITIVE_COLOR,
  "--color-network-link-negative": NETWORK_LINK_NEGATIVE_COLOR,
  "--color-error": appColors.error,
  "--shadow-sm": appShadows.sm,
  "--shadow-toggle-active": appShadows.toggleActive,
  "--shadow-md": appShadows.md,
  "--shadow-lg": appShadows.lg,
  "--radius-sm": appRadii.sm,
  "--radius-md": appRadii.md,
  "--radius-lg": appRadii.lg,
  "--radius-pill": appRadii.pill,
  "--space-1": appSpacing[1],
  "--space-2": appSpacing[2],
  "--space-3": appSpacing[3],
  "--space-4": appSpacing[4],
  "--space-5": appSpacing[5],
  "--space-6": appSpacing[6],
  "--space-7": appSpacing[7],
  "--space-8": appSpacing[8],
  "--font-body": appFonts.body,
  "--font-display": appFonts.display,
  "--focus-ring": `0 0 0 3px rgba(${appColors.primaryRgb}, 0.25)`,
} as const;

export const applyThemeCssVariables = (target: HTMLElement = document.documentElement) => {
  Object.entries(appCssVariables).forEach(([name, value]) => {
    target.style.setProperty(name, value);
  });
};

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: appColors.primary,
    colorInfo: appColors.primary,
    colorSuccess: appColors.success,
    colorWarning: appColors.warning,
    colorError: appColors.error,
    colorText: appColors.text,
    colorTextSecondary: appColors.textSecondary,
    colorBgBase: appColors.bg,
    colorBgContainer: appColors.surface,
    colorBgLayout: appColors.bg,
    colorBorder: appColors.border,
    colorBorderSecondary: appColors.borderSecondary,
    fontFamily: appFonts.body,
    fontSize: 14,
    controlHeight: UI_CONTROL_HEIGHT,
    controlHeightSM: UI_CONTROL_HEIGHT_COMPACT,
    controlHeightLG: UI_CONTROL_HEIGHT,
    colorBgContainerDisabled: appColors.disabledBg,
    colorTextPlaceholder: appColors.placeholder,
    borderRadius: Number.parseInt(appRadii.sm, 10),
    borderRadiusLG: Number.parseInt(appRadii.lg, 10),
    borderRadiusSM: Number.parseInt(appRadii.sm, 10),
    boxShadow: appShadows.sm,
    boxShadowSecondary: appShadows.md,
  },
  components: {
    Button: {
      fontWeight: 600,
      controlHeight: UI_CONTROL_HEIGHT,
      controlHeightLG: UI_CONTROL_HEIGHT,
      controlHeightSM: UI_CONTROL_HEIGHT_COMPACT,
      borderRadius: Number.parseInt(appRadii.sm, 10),
      borderRadiusSM: Number.parseInt(appRadii.sm, 10),
      borderRadiusLG: Number.parseInt(appRadii.sm, 10),
      defaultShadow: "none",
      primaryShadow: "none",
    },
    Input: {
      controlHeight: UI_CONTROL_HEIGHT,
      borderRadius: Number.parseInt(appRadii.sm, 10),
      activeShadow: appCssVariables["--focus-ring"],
      hoverBorderColor: appColors.primary,
    },
    Select: {
      controlHeight: UI_CONTROL_HEIGHT,
      borderRadius: Number.parseInt(appRadii.sm, 10),
      optionSelectedBg: appColors.primarySoft,
      optionActiveBg: appColors.primarySubtle,
    },
    Card: {
      borderRadiusLG: Number.parseInt(appRadii.sm, 10),
      paddingLG: Number.parseInt(appSpacing[5], 10),
      boxShadow: appShadows.sm,
    },
    Tabs: {
      titleFontSize: 14,
      itemSelectedColor: appColors.primary,
      itemHoverColor: appColors.primary,
      inkBarColor: appColors.primary,
    },
    Table: {
      headerBg: appColors.surface2,
      headerColor: appColors.text,
      borderColor: appColors.borderSecondary,
      rowSelectedBg: appColors.selectionSoft,
      rowSelectedHoverBg: appColors.selectionSoft,
    },
    Modal: {
      borderRadiusLG: Number.parseInt(appRadii.lg, 10),
      contentBg: appColors.surface,
      headerBg: appColors.surface,
    },
    Tag: {
      borderRadiusSM: 999,
    },
    Alert: {
      borderRadiusLG: Number.parseInt(appRadii.md, 10),
    },
    Layout: {
      bodyBg: appColors.bg,
      headerBg: appColors.surface,
      siderBg: appColors.surface,
    },
    Radio: {
      buttonSolidCheckedBg: appColors.primary,
      buttonSolidCheckedHoverBg: appColors.primaryHover,
      buttonSolidCheckedActiveBg: appColors.primaryActive,
      buttonSolidCheckedColor: appColors.surface,
    },
    Segmented: {
      itemSelectedBg: appColors.primary,
      itemSelectedColor: appColors.surface,
    },
  },
};
