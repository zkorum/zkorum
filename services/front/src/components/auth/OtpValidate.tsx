import Box from "@mui/material/Box";
import { MuiOtpInput } from "mui-one-time-password-input";
import { ZodType } from "../../shared/types/zod";
import React from "react";
import { useAppSelector } from "../../hooks";
import Typography from "@mui/material/Typography";
import { validateOtp } from "../../auth/auth";
import { AuthValidateOtpPost200ResponseReasonEnum } from "../../api";

export function OtpValidate() {
  const [otp, setOtp] = React.useState<string>("");
  const pendingEmail = useAppSelector((state) => {
    const pendingSessionUserId = state.sessions.pendingSessionUserId;
    return state.sessions.sessions[pendingSessionUserId].email;
  });

  async function handleOnComplete(value: string) {
    const result = ZodType.code.safeParse(value);
    if (!result.success) {
      // should not happen
      // TODO: show snackbar
    } else {
      try {
        const validateOtpResult = await validateOtp(result.data);
        if (validateOtpResult.success) {
          // update store and close modal
        } else {
          switch (validateOtpResult.reason) {
            // TODO: finish that
            case AuthValidateOtpPost200ResponseReasonEnum.ExpiredCode:
            case AuthValidateOtpPost200ResponseReasonEnum.WrongGuess:
          }
        }
      } catch (e) {
        // TODO: show snackbar
      }
    }
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
      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography>
          We've sent a 6-digits code to{" "}
          <Box fontWeight="medium" display="inline">
            {pendingEmail}
          </Box>
          . Enter this code within the next hour to log in.
        </Typography>
      </Box>
      <Box>
        <MuiOtpInput
          length={6}
          autoFocus
          value={otp}
          onChange={handleChange}
          validateChar={validateChar}
          onComplete={handleOnComplete}
        />
      </Box>
      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography variant="body2">
          Can't find your code? Check your spam folder!
        </Typography>
      </Box>
    </Box>
  );
}
