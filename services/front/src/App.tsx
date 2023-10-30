// https://mui.com/material-ui/getting-started/installation/#roboto-font
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { ErrorPage } from "./components/error/ErrorPage";
import { Feed } from "./components/feed/Feed";
import { Box, CssBaseline, Snackbar } from "@mui/material";
import { AppLayout } from "./components/AppLayout";
import { Alert } from "./components/shared/Alert";
import { useAppDispatch, useAppSelector } from "./hooks";
import { closeSnackbar } from "./store/reducers/snackbar";
import { MainLoading } from "./MainLoading";
import { COMMUNITIES } from "./common/navigation";
import { CommunitiesLayout } from "./components/communities/CommunitiesLayout";
import { RootDialog } from "./RootDialog";

export const routes = [
    {
        element: <RootDialog />,
        errorElement: <ErrorPage />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    {
                        path: "/",
                        element: <Feed />,
                    },
                    {
                        path: COMMUNITIES,
                        element: <CommunitiesLayout />,
                    },
                ],
            },
        ],
    },
];

const router = createBrowserRouter(routes);

export function App() {
    const isMainLoadingOpen = useAppSelector((state) => {
        return state.loading.isMainLoadingOpen;
    });
    const snackbarState = useAppSelector((state) => {
        return state.snackbar;
    });
    const dispatch = useAppDispatch();

    function handleCloseSnackbar(
        _event?: React.SyntheticEvent | Event,
        reason?: string
    ) {
        if (reason === "clickaway") {
            return;
        }
        dispatch(closeSnackbar());
    }

    return (
        <Box>
            {/* https://mui.com/material-ui/react-css-baseline/ */}
            <CssBaseline />
            <RouterProvider router={router} />
            <Snackbar
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                open={snackbarState.isOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                sx={{ bottom: { xs: 90, sm: 90, xl: 90 } }} // important to be above the bottom navbar
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbarState.severity}
                >
                    {snackbarState.message}
                </Alert>
            </Snackbar>
            <MainLoading open={isMainLoadingOpen} />
        </Box>
    );
}
