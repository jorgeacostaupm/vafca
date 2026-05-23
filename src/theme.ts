import type { ThemeConfig } from "antd";

export const appColors = {
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
  error: "#c53a3a",
  primarySoft: "#eef2f8",
  primarySubtle: "#f3f6fb",
  primaryRgb: "43, 93, 155",
} as const;

export const appShadows = {
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
  "--color-primary": appColors.primary,
  "--color-primary-rgb": appColors.primaryRgb,
  "--color-primary-hover": appColors.primaryHover,
  "--color-primary-active": appColors.primaryActive,
  "--color-bg": appColors.bg,
  "--color-surface": appColors.surface,
  "--color-surface-2": appColors.surface2,
  "--color-border": appColors.border,
  "--color-border-strong": "#c3cedb",
  "--color-text": appColors.text,
  "--color-text-muted": appColors.textSecondary,
  "--color-success": appColors.success,
  "--color-warning": appColors.warning,
  "--color-error": appColors.error,
  "--shadow-sm": appShadows.sm,
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
    borderRadius: Number.parseInt(appRadii.md, 10),
    borderRadiusLG: Number.parseInt(appRadii.lg, 10),
    borderRadiusSM: Number.parseInt(appRadii.sm, 10),
    boxShadow: appShadows.sm,
    boxShadowSecondary: appShadows.md,
  },
  components: {
    Button: {
      fontWeight: 600,
      controlHeight: 38,
      controlHeightLG: 44,
      controlHeightSM: 30,
      borderRadius: 10,
      borderRadiusSM: 8,
      borderRadiusLG: 12,
      defaultShadow: "none",
      primaryShadow: "none",
    },
    Input: {
      controlHeight: 38,
      borderRadius: 10,
      activeShadow: appCssVariables["--focus-ring"],
      hoverBorderColor: appColors.primary,
    },
    Select: {
      controlHeight: 38,
      borderRadius: 10,
      optionSelectedBg: appColors.primarySoft,
      optionActiveBg: appColors.primarySubtle,
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 20,
      boxShadow: "0 1px 2px rgba(15, 24, 36, 0.06)",
    },
    Tabs: {
      titleFontSize: 14,
      itemSelectedColor: appColors.primary,
      itemHoverColor: appColors.primary,
      inkBarColor: appColors.primary,
    },
    Table: {
      headerBg: appColors.primarySoft,
      headerColor: appColors.text,
      borderColor: appColors.border,
    },
    Modal: {
      borderRadiusLG: 16,
      contentBg: appColors.surface,
      headerBg: appColors.surface,
    },
    Tag: {
      borderRadiusSM: 999,
    },
    Alert: {
      borderRadiusLG: 12,
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
