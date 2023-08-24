import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import React from "react";
import { ZodType } from "../../shared/types/zod";
import { handleOnAuthenticate } from "../../auth/auth";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

interface AuthFormProps {
  autoFocus: boolean;
}

export function AuthForm({ autoFocus }: AuthFormProps) {
  const [isTrusted, setIsTrusted] = React.useState<boolean>(false);
  const [hasGivenConsent, setHasGivenConsent] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");

  const [isEmailValid, setIsEmailValid] = React.useState<boolean>(false);
  const [emailHelper, setEmailHelper] = React.useState<string>(" "); // we must have a helper set to not change form height: https://stackoverflow.com/questions/72510035/error-message-affects-the-height-of-the-text-field-helpertext-material-ui

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
          autoFocus={autoFocus}
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
                  This is a private & trusted device - stay logged-in
                </Typography>
              }
            />
          </FormControl>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={() => handleOnAuthenticate(email)}
            disabled={!isEmailValid || !isTrusted || !hasGivenConsent}
          >
            Register / Log in
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
