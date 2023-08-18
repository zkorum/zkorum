import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import LoadingButton from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";
import { MuiOtpInput } from "mui-one-time-password-input";
import React from "react";
import { useCountdown } from "usehooks-ts";
import { AuthVerifyOtpPost200ResponseReasonEnum } from "../../api";
import { authenticate, validateOtp } from "../../auth/auth";
import { useAppSelector } from "../../hooks";
import { ZodType } from "../../shared/types/zod";
import { CircularProgressCountdown } from "../shared/CircularProgressCountdown";

export function OtpVerify() {
  const [otp, setOtp] = React.useState<string>("");
  const [isVerifyingCode, setIsVerifyingCode] = React.useState<boolean>(false);
  const [isCurrentCodeActive, setIsCurrentCodeActive] =
    React.useState<boolean>(true);
  const [canRequestNewCode, setCanRequestNewCode] =
    React.useState<boolean>(false);
  const [requestingNewCode, setRequestingNewCode] =
    React.useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = React.useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState<string>("");

  const pendingEmail = useAppSelector((state) => {
    const pendingSessionUserId = state.sessions.pendingSessionUserId;
    return state.sessions.sessions[pendingSessionUserId].email;
  });
  // TODO: send DIDs via email, show them on this page and ask user to verify it's the right ones to counter MITM
  // TODO: send codeID and ask to verify it's the right one (avoiding loop of not using the code from the right email)
  const currentCodeExpiry = useAppSelector((state) => {
    const pendingSessionUserId = state.sessions.pendingSessionUserId;
    const currentCodeExpiryStr = state.sessions.sessions[pendingSessionUserId]
      .codeExpiry as string; // at this point it SHALL not be possible for it to be undefined
    const now = new Date().getTime(); // ms
    const currentCodeDateExpiry = Date.parse(currentCodeExpiryStr); // ms
    const secondsUntilCodeExpiry = Math.round(
      (currentCodeDateExpiry - now) / 1000
    );
    if (secondsUntilCodeExpiry < 0) {
      return 0;
    }
    return secondsUntilCodeExpiry;
  });
  const nextCodeSoonestTime = useAppSelector((state) => {
    const pendingSessionUserId = state.sessions.pendingSessionUserId;
    const nextCodeStr = state.sessions.sessions[pendingSessionUserId]
      .nextCodeSoonestTime as string; // at this point it SHALL not be possible for it to be undefined
    const now = new Date().getTime(); // ms
    const nextCodeDate = Date.parse(nextCodeStr); // ms
    const secondsUntilNextCodeSoonestTime = Math.round(
      (nextCodeDate - now) / 1000
    );
    if (secondsUntilNextCodeSoonestTime < 0) {
      return 0;
    }
    return secondsUntilNextCodeSoonestTime;
  });

  const [
    secondsUntilAllowingNewCode,
    {
      startCountdown: startNewCodeCoundown,
      resetCountdown: resetNewCodeCoundown,
    },
  ] = useCountdown({
    countStart: nextCodeSoonestTime,
    intervalMs: 1000,
  });

  const [
    secondsUntilCodeExpiry,
    {
      startCountdown: startCodeExpiryCoundown,
      resetCountdown: resetCodeExpiryCountdown,
    },
  ] = useCountdown({
    countStart: currentCodeExpiry,
    intervalMs: 1000,
  });

  React.useEffect(() => {
    startNewCodeCoundown();
    startCodeExpiryCoundown();
  }, []);

  React.useEffect(() => {
    if (secondsUntilCodeExpiry === 0) {
      setIsCurrentCodeActive(false);
      console.log(isCurrentCodeActive);
    }
  }, [secondsUntilCodeExpiry]);

  React.useEffect(() => {
    if (secondsUntilAllowingNewCode === 0) {
      setCanRequestNewCode(true);
    } else {
      setCanRequestNewCode(false);
    }
  }, [secondsUntilAllowingNewCode]);

  function handleCloseSnackbar(
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  }

  async function handleOnComplete(value: string) {
    const result = ZodType.code.safeParse(value);
    if (!result.success) {
      // should not happen
      console.error("Error while parsing code", result.error);
      setSnackbarMessage(
        "There was an error. Please try again later or contact ZKorum."
      );
      setOpenSnackbar(true);
    } else {
      setIsVerifyingCode(true);
      try {
        const validateOtpResult = await validateOtp(result.data);
        if (validateOtpResult.success) {
          // update store and close modal
        } else {
          switch (validateOtpResult.reason) {
            case AuthVerifyOtpPost200ResponseReasonEnum.ExpiredCode:
              setIsCurrentCodeActive(false);
              setSnackbarMessage("Code expired - request a new one");
              setOpenSnackbar(true);
              break;
            case AuthVerifyOtpPost200ResponseReasonEnum.WrongGuess:
              setSnackbarMessage("Wrong guess");
              setOpenSnackbar(true);
              break;
            case AuthVerifyOtpPost200ResponseReasonEnum.TooManyWrongGuess:
              setIsCurrentCodeActive(false);
              setSnackbarMessage("Too many wrong guess - request a new code");
              setOpenSnackbar(true);
              break;
          }
        }
      } catch (e) {
        setSnackbarMessage(
          "There was an error. Please try again later or contact ZKorum."
        );
        setOpenSnackbar(true);
      }
      setIsVerifyingCode(false);
    }
  }

  function handleRequestNewCode() {
    setRequestingNewCode(true);
    authenticate(pendingEmail, true)
      .then((_response) => {
        setSnackbarMessage(
          "New code sent to your email - previous code invalidated"
        );
        setOpenSnackbar(true);
        setCanRequestNewCode(false);
        resetNewCodeCoundown();
        startNewCodeCoundown();
        resetCodeExpiryCountdown();
        startCodeExpiryCoundown();
        setIsCurrentCodeActive(true);
      })
      .catch((_e) => {
        // TODO: show better error if rate-limited
        setSnackbarMessage(
          "There was an error. Please try again later - or contact ZKorum."
        );
        setOpenSnackbar(true);
      })
      .finally(() => {
        setRequestingNewCode(false);
      });
  }

  function handleChange(value: string) {
    setOtp(value);
  }

  function validateChar(char: string) {
    const result = ZodType.digit.safeParse(char);
    return result.success;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ my: 3 }}>
        <Typography component={"span"}>
          {/* why span? see https://stackoverflow.com/a/53494821/11046178 */}
          We've sent a 6-digits code to{" "}
          <Box fontWeight="medium" display="inline">
            {pendingEmail}
          </Box>
          . Enter this code shortly to log in. You must use the same
          device/browser. You have 3 attempts.
        </Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <CircularProgressCountdown value={secondsUntilCodeExpiry} unit={"s"} />
      </Box>
      <Box>
        <MuiOtpInput
          TextFieldsProps={{ disabled: !isCurrentCodeActive }}
          length={6}
          autoFocus
          value={otp}
          onChange={handleChange}
          validateChar={validateChar}
          onComplete={handleOnComplete}
        />
      </Box>
      <Box hidden={!isVerifyingCode}>
        Verifying code <CircularProgress />
      </Box>
      <Box sx={{ mt: 12, mb: 2 }}>
        <Typography variant="body2">
          Can't find your code? Verify that you entered the right email address,
          and check your spam folder! Only the last code sent is valid.
        </Typography>
      </Box>
      <Box>
        <CircularProgressCountdown
          value={secondsUntilAllowingNewCode}
          unit={"s"}
        />
      </Box>
      <Box>
        <LoadingButton
          size="small"
          disabled={!canRequestNewCode}
          loading={requestingNewCode}
          onClick={handleRequestNewCode}
        >
          Request New Code
        </LoadingButton>
      </Box>
      {/* TODO:  put snackbar in core layout, and create redux action to trigger them. Handle "severity" too*/}
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
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
