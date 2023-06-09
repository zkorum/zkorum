import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import React from "react";
import { z } from "zod";
import { Configuration, DefaultApiFactory, DefaultApiFp } from "../../api";
import { useFormControl } from "@mui/material/FormControl";

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
  const [isUsernameValid, setIsUsernameValid] = React.useState<boolean>(true);
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

  React.useEffect(() => {
    validateEmail();
  }, [email]);

  React.useEffect(() => {
    validateUsername();
  }, [username]);

  function validateUsername() {
    if (username === "") {
      setIsUsernameValid(true);
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
      DefaultApiFactory(
        new Configuration({
          basePath: "http://localhost:3000",
        })
      )
        .authControllerIsEmailAvailable({ email: email })
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
      setIsEmailValid(true);
      setEmailHelper(undefined);
    }
  }

  function handleOnRegister() {
    if (!isEmailValid && !isUsernameValid) {
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
            setEmail(event.target.value);
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
            setUsername(event.target.value);
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
