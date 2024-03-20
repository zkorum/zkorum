// https://mui.com/material-ui/getting-started/installation/#roboto-font
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { Box, CssBaseline } from "@mui/material";
import { createRef } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { MainLoading } from "./MainLoading";
import { RootDialog } from "./RootDialog";
import { POST } from "./common/navigation";
import { AppLayout } from "./components/AppLayout";
import { ErrorPage } from "./components/error/ErrorPage";
import { Feed } from "./components/feed/Feed";
import { PostPage } from "./components/post/PostPage";
import { PostPageLayout } from "./components/post/PostPageLayout";
import { useAppSelector } from "./hooks";

const postRoute = {
    path: `${POST}/:postSlugId`,
    element: <PostPage />,
    nodeRef: createRef(),
};

const feedRoute = {
    path: "/",
    nodeRef: createRef(),
    element: <Feed />,
};

export const innerRoutes = [postRoute, feedRoute];

export const routes = [
    {
        element: <RootDialog />,
        errorElement: <ErrorPage />,
        children: [
            {
                element: <PostPageLayout />,
                children: [postRoute],
            },
            {
                element: <AppLayout />,
                children: [feedRoute],
            },
        ],
    },
];

const router = createBrowserRouter(routes, { basename: "/feed/" });

export function App() {
    const isMainLoadingOpen = useAppSelector((state) => {
        return state.loading.isMainLoadingOpen;
    });

    return (
        <Box>
            {/* https://mui.com/material-ui/react-css-baseline/ */}
            <CssBaseline />
            <RouterProvider router={router} />
            <MainLoading open={isMainLoadingOpen} />
        </Box>
    );
}
