// https://mui.com/material-ui/getting-started/installation/#roboto-font
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { Box, CssBaseline } from "@mui/material";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { MainLoading } from "./MainLoading";
import { RootDialog } from "./RootDialog";
import { COMMUNITIES, POST } from "./common/navigation";
import { AppLayout } from "./components/AppLayout";
import { CommunitiesLayout } from "./components/communities/CommunitiesLayout";
import { ErrorPage } from "./components/error/ErrorPage";
import { Feed } from "./components/feed/Feed";
import { PostPage } from "./components/post/PostPage";
import { PostPageLayout } from "./components/post/PostPageLayout";
import { useAppSelector } from "./hooks";

export const routes = [
    {
        element: <RootDialog />,
        errorElement: <ErrorPage />,
        children: [
            {
                element: <PostPageLayout />,
                children: [
                    {
                        path: `${POST}/:postSlugId`,
                        element: <PostPage />,
                    },
                ],
            },
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

    return (
        <Box>
            {/* https://mui.com/material-ui/react-css-baseline/ */}
            <CssBaseline />
            <RouterProvider router={router} />
            <MainLoading open={isMainLoadingOpen} />
        </Box>
    );
}
