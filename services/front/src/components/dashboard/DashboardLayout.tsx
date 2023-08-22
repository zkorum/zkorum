import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { Topbar } from "../Topbar";
import { Outlet } from "react-router-dom";
import { BottomNavbar } from "../BottomNavbar";
import Snackbar from "@mui/material/Snackbar";
import { Alert } from "../shared/Alert";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { closeSnackbar } from "../../reducers/snackbar";

export function DashboardLayout() {
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
      <Topbar />
      <Container>
        <Outlet />
      </Container>
      <BottomNavbar />
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarState.isOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        sx={{ bottom: { xs: 90, sm: 90, xl: 90 } }} // important to be above the bottom navbar
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarState.severity}>
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
