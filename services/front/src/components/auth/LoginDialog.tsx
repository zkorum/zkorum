import CloseIcon from "@mui/icons-material/Close";
import { useAppSelector } from "../../hooks";
import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import { DialogContent, IconButton, TextField } from "@mui/material";
import { closeModal } from "../../reducers/session";
import { useAppDispatch } from "../../hooks";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import { ZKorumIcon } from "../../ZKorumIcon";

export function LoginDialog() {
  const isModalOpen = useAppSelector((state) => state.sessions.isModalOpen);
  const dispatch = useAppDispatch();

  function handleClose() {
    dispatch(closeModal());
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get("email"),
      password: data.get("password"),
    });
  }

  return (
    <Box>
      <Dialog fullScreen open={isModalOpen} onClose={handleClose}>
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box>
              <ZKorumIcon iconBackgroundColor={"dark"} />
            </Box>
          </Box>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              left: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* <DialogContentText>Log in to ZKorum</DialogContentText> */}
          {/* <Grid container> */}
          {/*   <Grid> */}
          {/*     <TextField */}
          {/*       autoFocus */}
          {/*       margin="dense" */}
          {/*       id="email" */}
          {/*       label="Email Address" */}
          {/*       type="email" */}
          {/*       fullWidth */}
          {/*       variant="standard" */}
          {/*     /> */}
          {/*   </Grid> */}
          {/*   <Grid> */}
          {/*     <TextField */}
          {/*       autoFocus */}
          {/*       margin="dense" */}
          {/*       id="username" */}
          {/*       label="Username" */}
          {/*       type="text" */}
          {/*       fullWidth */}
          {/*       variant="standard" */}
          {/*     /> */}
          {/*   </Grid> */}
          {/* </Grid> */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="username"
                label="Username"
                type="text"
                id="username"
                autoComplete="username"
              />
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Grid container>
                <Grid xs>
                  <Link href="#" variant="body2">
                    Forgot password?
                  </Link>
                </Grid>
                <Grid>
                  <Link href="#" variant="body2">
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      <Outlet />
    </Box>
  );
}
