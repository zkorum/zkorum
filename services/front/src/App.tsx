// https://mui.com/material-ui/getting-started/installation/#roboto-font
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { ErrorPage } from "./components/error/ErrorPage";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Box, CssBaseline } from "@mui/material";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";

const routes = [
  {
    path: "/",
    element: <DashboardLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export function App() {
  return (
    <Box>
      {/* https://mui.com/material-ui/react-css-baseline/ */}
      <CssBaseline />
      <RouterProvider router={router} />
    </Box>
  );
}
