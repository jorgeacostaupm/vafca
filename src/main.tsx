import "antd/dist/reset.css";
import "react-resizable/css/styles.css";
import "react-grid-layout/css/styles.css";
import "@/index.css";

import { ConfigProvider } from "antd";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import App from "@/App";
import { store } from "@/store/store";
import { applyThemeCssVariables,appTheme } from "@/theme";

applyThemeCssVariables();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={appTheme}>
        <App />
      </ConfigProvider>
    </Provider>
  </StrictMode>,
);
