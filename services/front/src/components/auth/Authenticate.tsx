import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import React from "react";
import { ZodType } from "../../shared/types/zod";
import { Alert } from "../shared/Alert";
import { authenticate } from "../../auth/auth";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";

export function Authenticate() {
  const [isTrusted, setIsTrusted] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");

  const [isEmailValid, setIsEmailValid] = React.useState<boolean>(false);
  const [emailHelper, setEmailHelper] = React.useState<string>(" "); // we must have a helper set to not change form height: https://stackoverflow.com/questions/72510035/error-message-affects-the-height-of-the-text-field-helpertext-material-ui
  const [openSnackbar, setOpenSnackbar] = React.useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] =
    React.useState<boolean>(false);

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
      setEmailHelper(" ");
      return;
    }
    const result = ZodType.email.safeParse(emailToValidate);
    if (!result.success) {
      const formatted = result.error.format();
      setIsEmailValid(false);
      setEmailHelper(formatted._errors[0]);
    } else {
      setIsEmailValid(true);
      setEmailHelper(" ");
    }
  }

  function handleOnAuthenticate() {
    setIsAuthenticating(true);
    // do register the user
    authenticate(email, false)
      .then((_response) => {
        // go to next step => validate email address => automatic on store update
      })
      .catch((e) => {
        console.error(e);
        setOpenSnackbar(true);
      })
      .finally(() => {
        setIsAuthenticating(false);
      });
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <FormControl error={!isTrusted} component="fieldset" variant="standard">
        <Box sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            error={email !== "" && !isEmailValid}
            helperText={emailHelper} // must always be set to keep same height (see link at variable definition)
            onChange={(event: React.FocusEvent<HTMLInputElement>) => {
              if (event.target.value !== email) {
                setEmail(event.target.value);
                validateEmail(event.target.value);
              }
            }}
            autoFocus
          />
          <FormControlLabel
            control={
              <Checkbox
                required
                checked={isTrusted}
                onChange={() => setIsTrusted(!isTrusted)}
              />
            }
            label={
              <Typography>Trust this device and stay logged in</Typography>
            }
          />
          <LoadingButton
            fullWidth
            loading={isAuthenticating}
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={handleOnAuthenticate}
            disabled={!isEmailValid || !isTrusted}
          >
            Register / Log in
          </LoadingButton>
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
              There was an error. Please try again later or contact ZKorum.
            </Alert>
          </Snackbar>
        </Box>
      </FormControl>
    </Box>
  );
}
