import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import React from "react";
import { DefaultApiFactory } from "../../api";
import { ucanAxios } from "../../interceptors";
import { ZodType } from "../../shared/types/zod";
import { Alert } from "../shared/Alert";
import { register } from "../../auth/auth";

interface RegisterProps {
  handleLogin: React.MouseEventHandler<HTMLAnchorElement> &
    React.MouseEventHandler<HTMLSpanElement>;
}

export function Register(props: RegisterProps) {
  const { handleLogin } = props;

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
      DefaultApiFactory(undefined, undefined, ucanAxios)
        .authIsEmailAvailablePut(emailToValidate)
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
        .catch(() => {
          setIsEmailValid(false);
          setEmailHelper("There was an error. Please try again later.");
        });
    }
  }

  function handleOnRegister() {
    if (isEmailValid) {
      // do register the user
      register(email)
        .then((_response) => {
          // go to next step => validate email address
        })
        .catch((e) => {
          console.error(e);
          setOpenSnackbar(true);
        });
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
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          onClick={handleOnRegister}
          disabled={!isEmailValid}
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
