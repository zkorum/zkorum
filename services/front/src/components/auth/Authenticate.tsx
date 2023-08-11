import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import React from "react";
import { ZodType } from "../../shared/types/zod";
import { Alert } from "../shared/Alert";
import { authenticate } from "../../auth/auth";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from "@mui/material/FormControl";

export function Authenticate() {
  const [isTrusted, setIsTrusted] = React.useState<boolean>(true);
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
      setIsEmailValid(true);
      setEmailHelper(undefined);
    }
  }

  function handleOnAuthenticate() {
    if (isEmailValid) {
      // do register the user
      authenticate(email)
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
            helperText={email !== "" && !isEmailValid ? emailHelper : null}
            onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
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
                checked={isTrusted}
                onChange={() => setIsTrusted(!isTrusted)}
                color="primary"
              />
            }
            label="Trust this device"
          />
          <FormHelperText>
            ZKorum does not support untrusted device yet
          </FormHelperText>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={handleOnAuthenticate}
            disabled={!isEmailValid || !isTrusted}
          >
            Register / Log in
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
        </Box>
      </FormControl>
    </Box>
  );
}
