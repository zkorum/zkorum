import Box from "@mui/material/Box";
import { Outlet } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { closeSnackbar } from "@/store/reducers/snackbar";
import { Topbar } from "./Topbar";
import { BottomNavbar } from "./BottomNavbar";
import Alert from "@mui/material/Alert";

export function AppLayout() {
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

    /* <Container maxWidth={false} disableGutters> */
    return (
        <Box sx={{ backgroundColor: "#e6e9ec" }}>
            <Topbar />
            <Outlet />
            <BottomNavbar />
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
        </Box>
    );
}
