import React from "react";
import ReactDOM from "react-dom/client";
// https://mui.com/material-ui/getting-started/installation/#roboto-font
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import { App } from "./App";
import { persistor, store } from "./store/store";
import { PersistGate } from "redux-persist/integration/react";
import { Provider } from "react-redux";
import { MainLoading } from "./MainLoading";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <PersistGate
          loading={<MainLoading open={true} />}
          persistor={persistor}
        >
          <App />
        </PersistGate>
      </Provider>
    </ThemeProvider>
  </React.StrictMode>
);
