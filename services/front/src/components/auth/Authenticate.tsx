import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import React from "react";
import { ZodType } from "../../shared/types/zod";
import { authenticate } from "../../auth/auth";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";
import { showError } from "../../reducers/snackbar";
import { useAppDispatch } from "../../hooks";

export function Authenticate() {
  const [isTrusted, setIsTrusted] = React.useState<boolean>(false);
  const [hasGivenConsent, setHasGivenConsent] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");

  const [isEmailValid, setIsEmailValid] = React.useState<boolean>(false);
  const [emailHelper, setEmailHelper] = React.useState<string>(" "); // we must have a helper set to not change form height: https://stackoverflow.com/questions/72510035/error-message-affects-the-height-of-the-text-field-helpertext-material-ui
  const [isAuthenticating, setIsAuthenticating] =
    React.useState<boolean>(false);

  const dispatch = useAppDispatch();

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
      .catch((_e) => {
        // TODO take into account 409 already logged in and handle it appropriately
        dispatch(
          showError(
            "There was an error. Please try again later or contact ZKorum."
          )
        );
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
        <Box>
          <FormControl
            error={!hasGivenConsent}
            component="fieldset"
            variant="standard"
          >
            <FormControlLabel
              control={
                <Checkbox
                  required
                  checked={hasGivenConsent}
                  onChange={() => setHasGivenConsent(!hasGivenConsent)}
                />
              }
              label={
                <Typography variant={"body2"}>
                  I understand that as an alpha version, this product may
                  contain accidental security flaws compromising privacy
                  guarantees
                </Typography>
              }
            />
          </FormControl>
        </Box>
        <Box>
          <FormControl
            error={!isTrusted}
            component="fieldset"
            variant="standard"
          >
            <FormControlLabel
              control={
                <Checkbox
                  required
                  checked={isTrusted}
                  onChange={() => setIsTrusted(!isTrusted)}
                />
              }
              label={
                <Typography variant={"body2"}>
                  This is not a public nor a shared device - stay logged-in
                </Typography>
              }
            />
          </FormControl>
          <LoadingButton
            fullWidth
            loading={isAuthenticating}
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={handleOnAuthenticate}
            disabled={!isEmailValid || !isTrusted || !hasGivenConsent}
          >
            Register / Log in
          </LoadingButton>
        </Box>
      </Box>
    </Box>
  );
}
