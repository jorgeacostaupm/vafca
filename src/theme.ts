import type { ThemeConfig } from "antd";

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: "#2b5d9b",
    colorInfo: "#2b5d9b",
    colorSuccess: "#1f8f6f",
    colorWarning: "#b97a1c",
    colorError: "#c53a3a",
    colorText: "#0f1a24",
    colorTextSecondary: "#5c6c7c",
    colorBgBase: "#f3f5f9",
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f3f5f9",
    colorBorder: "#d5dde7",
    colorBorderSecondary: "#e3e9f2",
    fontFamily: '"Plus Jakarta Sans", "IBM Plex Sans", sans-serif',
    fontSize: 14,
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    boxShadow: "0 1px 2px rgba(15, 24, 36, 0.06)",
    boxShadowSecondary: "0 8px 18px rgba(15, 24, 36, 0.08)",
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
      activeShadow: "0 0 0 3px rgba(43, 93, 155, 0.25)",
      hoverBorderColor: "#2b5d9b",
    },
    Select: {
      controlHeight: 38,
      borderRadius: 10,
      optionSelectedBg: "#eef2f8",
      optionActiveBg: "#f3f6fb",
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 20,
      boxShadow: "0 1px 2px rgba(15, 24, 36, 0.06)",
    },
    Tabs: {
      titleFontSize: 14,
      itemSelectedColor: "#2b5d9b",
      itemHoverColor: "#2b5d9b",
      inkBarColor: "#2b5d9b",
    },
    Table: {
      headerBg: "#eef2f8",
      headerColor: "#0f1a24",
      borderColor: "#d5dde7",
    },
    Modal: {
      borderRadiusLG: 16,
      contentBg: "#ffffff",
      headerBg: "#ffffff",
    },
    Tag: {
      borderRadiusSM: 999,
    },
    Alert: {
      borderRadiusLG: 12,
    },
    Layout: {
      bodyBg: "#f3f5f9",
      headerBg: "#ffffff",
      siderBg: "#ffffff",
    },
  },
};
