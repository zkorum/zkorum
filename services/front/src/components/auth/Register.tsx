import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import React from "react";

export function Register() {
  const [username, setUsername] = React.useState<string | undefined>(undefined);
  const [email, setEmail] = React.useState<string | undefined>(undefined);
  const [isUsernameAvailable, setIsUsernameAvailable] =
    React.useState<boolean>(false);
  const [isEmailAvailable, setIsEmailAvailable] =
    React.useState<boolean>(false);

  React.useEffect(() => {
    // validate username
    // check if username is available
    setIsUsernameAvailable(true);
  }, [username]);

  React.useEffect(() => {
    // validate email
    // check if email is available
    setIsEmailAvailable(true);
  }, [email]);

  function handleOnRegister() {
    // go to next step => validate email address
  }

  return (
    <Box
      component="form"
      sx={{
        "& > :not(style)": { m: 1, width: "25ch" },
      }}
      noValidate
      autoComplete="off"
    >
      <TextField
        id="outlined-controlled"
        label="Username"
        error={username !== undefined && !isUsernameAvailable}
        value={username}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setUsername(event.target.value);
        }}
      />
      <TextField
        id="outlined-controlled"
        label="Email"
        error={email !== undefined && !isEmailAvailable}
        value={email}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setEmail(event.target.value);
        }}
      />
      <Button
        onClick={handleOnRegister}
        disabled={!isUsernameAvailable || !isEmailAvailable}
      >
        Register
      </Button>
    </Box>
  );
}
