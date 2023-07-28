import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Snackbar from "@mui/material/Snackbar";
import React from "react";
import { DefaultApiFactory } from "../../api";
import customAxios from "../../interceptors";
import { ZodType } from "../../shared/types/zod";
import { Alert } from "../shared/Alert";

interface RegisterProps {
  handleLogin: React.MouseEventHandler<HTMLAnchorElement> &
    React.MouseEventHandler<HTMLSpanElement>;
}

export function Register(props: RegisterProps) {
  const { handleLogin } = props;

  const [username, setUsername] = React.useState<string>("");
  const [isUsernameValid, setIsUsernameValid] = React.useState<boolean>(true);
  const [usernameHelper, setUsernameHelper] = React.useState<
    string | undefined
  >(undefined);
  const [email, setEmail] = React.useState<string>("");
  const [isEmailValid, setIsEmailValid] = React.useState<boolean>(false);
  const [emailHelper, setEmailHelper] = React.useState<string | undefined>(
    undefined
  );
  const [openSnackbar, setOpenSnackbar] = React.useState(false);

  function handleCloseSnackbar(
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  }

  function validateUsername(usernameToValidate: string) {
    if (usernameToValidate === "") {
      setIsUsernameValid(true);
      setUsernameHelper(undefined);
      return;
    }
    const result = ZodType.username.safeParse(usernameToValidate);
    if (!result.success) {
      const formatted = result.error.format();
      setIsUsernameValid(false);
      setUsernameHelper(formatted._errors[0]);
    } else {
      // TODO: check if username is already taken
      DefaultApiFactory(undefined, undefined, customAxios)
        .authIsUsernameAvailablePost(usernameToValidate)
        .then((response) => {
          if (response.data) {
            setIsUsernameValid(true);
            setEmailHelper(undefined);
          } else {
            setIsUsernameValid(false);
            setUsernameHelper(
              "This username is already associated with an account, did you mean to login instead?"
            );
          }
        })
        .catch((e) => {
          setIsEmailValid(false);
          setEmailHelper("There was an error. Please try again later.");
        });
    }
  }

  function validateEmail(emailToValidate: string) {
    if (emailToValidate === "") {
      setIsEmailValid(false);
      setEmailHelper(undefined);
      return;
    }
    const result = ZodType.email.safeParse(emailToValidate);
    if (!result.success) {
      const formatted = result.error.format();
      setIsEmailValid(false);
      setEmailHelper(formatted._errors[0]);
    } else {
      DefaultApiFactory(undefined, undefined, customAxios)
        .authIsEmailAvailablePost(emailToValidate)
        .then((response) => {
          if (response.data) {
            setIsEmailValid(true);
            setEmailHelper(undefined);
          } else {
            setIsEmailValid(false);
            setEmailHelper(
              "This email is already associated with an account, did you mean to login instead?"
            );
          }
        })
        .catch((e) => {
          setIsEmailValid(false);
          setEmailHelper("There was an error. Please try again later.");
        });
    }
  }

  function handleOnRegister() {
    if (isEmailValid && isUsernameValid) {
      // generate keys

      // call register backend
      DefaultApiFactory(undefined, undefined, customAxios)
        .authRegisterPost({ email: email, username: username, did: "test" })
        .then((response) => {})
        .catch((e) => {
          setOpenSnackbar(true);
        });

      // go to next step => validate email address
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          error={email !== "" && !isEmailValid}
          helperText={email !== "" && !isEmailValid ? emailHelper : null}
          onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
            if (event.target.value !== email) {
              setEmail(event.target.value);
              validateEmail(event.target.value);
            }
          }}
          autoFocus
        />
        <TextField
          margin="normal"
          fullWidth
          name="username"
          label="Username"
          type="text"
          id="username"
          error={username !== "" && !isUsernameValid}
          helperText={
            username !== "" && !isUsernameValid ? usernameHelper : null
          }
          onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
            if (event.target.value !== username) {
              setUsername(event.target.value);
              validateUsername(event.target.value);
            }
          }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          onClick={handleOnRegister}
          disabled={!isUsernameValid || !isEmailValid}
        >
          Register
        </Button>
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity="error"
            sx={{ width: "100%" }}
          >
            There was an error. Please try again later.
          </Alert>
        </Snackbar>
        <Grid container>
          <Grid>
            <Link component="button" onClick={handleLogin}>
              {"Already have an account? Log In"}
            </Link>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
