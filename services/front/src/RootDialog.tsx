import Box from "@mui/material/Box";
import { AuthDialog } from "./components/auth/AuthDialog";
import { PostDialog } from "./components/post/PostDialog";
import { Outlet } from "react-router-dom";

export function RootDialog() {
    return (
        <Box sx={{ backgroundColor: "red" }}>
            <AuthDialog />
            <PostDialog />
            <Outlet />
        </Box>
    );
}
