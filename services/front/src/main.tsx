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

// avoid "Buffer is not defined" error
import { Buffer } from "buffer";
globalThis.Buffer = Buffer;

// navigator.serviceWorker
//     ?.register(import.meta.env.PROD ? "/feed/sw.js" : "/dev-sw.js?dev-sw")
//     .then((registration) => {
//         registration?.addEventListener("updatefound", () => {
//             // Listen for updates to the service worker
//             const newWorker = registration.installing;

//             newWorker?.addEventListener("statechange", () => {
//                 // Reload the page when the new service worker is installed
//                 if (newWorker.state === "installed") {
//                     if (navigator.serviceWorker.controller) {
//                         // A new version of the service worker is available
//                         alert("New update, please refresh the page");
//                         // Reload the page
//                         window.location.reload();
//                     } else {
//                         // The service worker is the initial one
//                         console.log(
//                             "Service worker installed for the first time."
//                         );
//                     }
//                 }
//             });
//         });
//     })
//     .catch((err) => {
//         console.log(err);
//     });
//
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register(
            import.meta.env.PROD ? "/feed/sw.js" : "/dev-sw.js?dev-sw"
        );
    });
}

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
