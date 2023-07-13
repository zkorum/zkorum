import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import React from "react";
import { z } from "zod";

interface RegisterProps {
  handleLogin: React.MouseEventHandler<HTMLAnchorElement> &
    React.MouseEventHandler<HTMLSpanElement>;
}

export function Register(props: RegisterProps) {
  const { handleLogin } = props;

  // function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  //   event.preventDefault();
  //   const data = new FormData(event.currentTarget);
  //   console.log({
  //     email: data.get("email"),
  //     password: data.get("password"),
  //   });
  // }
  //
  const [username, setUsername] = React.useState<string>("");
  const [isUsernameValid, setIsUsernameValid] = React.useState<boolean>(false);
  const usernameSchema = z
    .string()
    .max(32)
    .refine(
      (val) => {
        // @ts-ignore (validator is loaded using validator.min.js)
        return validator.isAlphanumeric(val) && !validator.isInt(val);
      },
      {
        message: "Username must only use alphanumerics characters",
      }
    );
  const [usernameHelper, setUsernameHelper] = React.useState<
    string | undefined
  >(undefined);
  const [email, setEmail] = React.useState<string>("");
  const [isEmailValid, setIsEmailValid] = React.useState<boolean>(false);
  const [emailHelper, setEmailHelper] = React.useState<string | undefined>(
    undefined
  );
  const emailSchema = z.string().email().max(254);

  function validateUsername() {
    if (username === "") {
      setIsUsernameValid(false);
      setUsernameHelper(undefined);
      return;
    }
    const result = usernameSchema.safeParse(username);
    if (!result.success) {
      const formatted = result.error.format();
      setIsUsernameValid(false);
      setUsernameHelper(formatted._errors[0]);
    } else {
      // TODO: check if username is already taken
      setIsUsernameValid(true);
      setUsernameHelper(undefined);
    }
  }

  function validateEmail() {
    if (email === "") {
      setIsEmailValid(false);
      setEmailHelper(undefined);
      return;
    }
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      const formatted = result.error.format();
      setIsEmailValid(false);
      setEmailHelper(formatted._errors[0]);
    } else {
      // TODO: check if email is already taken
      setIsEmailValid(true);
      setEmailHelper(undefined);
    }
  }

  function handleOnRegister() {
    // go to next step => validate email address
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
          value={email}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setEmail(event.target.value);
          }}
          onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
            validateEmail();
          }}
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
          error={username !== "" && !isUsernameValid}
          helperText={
            username !== "" && !isUsernameValid ? usernameHelper : null
          }
          value={username}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setUsername(event.target.value);
          }}
          onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
            validateUsername();
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
