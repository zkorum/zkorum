import Box from "@mui/material/Box";
import LoadingButton from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";
import { MuiOtpInput } from "mui-one-time-password-input";
import React from "react";
import { useCountdown } from "usehooks-ts";
import {
    ApiV1AuthVerifyOtpPost200ResponseReasonEnum,
    type ApiV1AuthAuthenticatePost409Response,
    type ApiV1AuthAuthenticatePost409ResponseAnyOf,
} from "../../api";
import {
    authenticate,
    onLoggedIn,
    onAwaitingSyncing,
    verifyOtp,
} from "@/request/auth";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { CircularProgressCountdown } from "../shared/CircularProgressCountdown";
import {
    showError,
    showInfo,
    showSuccess,
    showWarning,
} from "../../store/reducers/snackbar";
import { setPendingSessionCodeExpiry } from "../../store/reducers/session";
import {
    authAlreadyLoggedIn,
    authEmailAlreadyVerified,
    genericError,
    throttled,
} from "../error/message";
import axios from "axios";
import Alert from "@mui/material/Alert";
import { closeMainLoading, openMainLoading } from "@/store/reducers/loading";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { zodcode, zoddigit } from "@/shared/types/zod";
import { nowZeroMs } from "@/shared/common/util";

export function OtpVerify() {
    const theme = useTheme();
    const smallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const [otp, setOtp] = React.useState<string>("");
    const [isCurrentCodeActive, setIsCurrentCodeActive] =
        React.useState<boolean>(true);
    const [canRequestNewCode, setCanRequestNewCode] =
        React.useState<boolean>(false);
    const [requestingNewCode, setRequestingNewCode] =
        React.useState<boolean>(false);

    const dispatch = useAppDispatch();

    const pendingEmail = useAppSelector((state) => {
        return state.sessions.pendingSessionEmail;
    });
    const userId = useAppSelector((state) => {
        const pendingSessionEmail = state.sessions.pendingSessionEmail;
        return state.sessions.sessions[pendingSessionEmail]?.userId;
    });
    // TODO: send DIDs via email, show them on this page and ask user to verify it's the right ones to counter MITM
    // TODO: send codeID and ask to verify it's the right one (avoiding loop of not using the code from the right email)
    const currentCodeExpiry = useAppSelector((state) => {
        const pendingSessionEmail = state.sessions.pendingSessionEmail;
        const currentCodeExpiryStr = state.sessions.sessions[
            pendingSessionEmail
        ].codeExpiry as string; // at this point it SHALL not be possible for it to be undefined
        const now = nowZeroMs().getTime(); // ms
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
        const pendingSessionUserId = state.sessions.pendingSessionEmail;
        const nextCodeStr = state.sessions.sessions[pendingSessionUserId]
            .nextCodeSoonestTime as string; // at this point it SHALL not be possible for it to be undefined
        const now = nowZeroMs().getTime(); // ms
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
        resetNewCodeCoundown();
        startNewCodeCoundown();
    }, [currentCodeExpiry, resetNewCodeCoundown, startNewCodeCoundown]);

    React.useEffect(() => {
        resetCodeExpiryCountdown();
        startCodeExpiryCoundown();
    }, [
        nextCodeSoonestTime,
        resetCodeExpiryCountdown,
        startCodeExpiryCoundown,
    ]);

    React.useEffect(() => {
        if (secondsUntilCodeExpiry === 0) {
            setIsCurrentCodeActive(false);
        } else {
            setIsCurrentCodeActive(true);
        }
    }, [secondsUntilCodeExpiry]);

    React.useEffect(() => {
        if (secondsUntilAllowingNewCode === 0) {
            setCanRequestNewCode(true);
        } else {
            setCanRequestNewCode(false);
        }
    }, [secondsUntilAllowingNewCode]);

    async function handleOnComplete(value: string) {
        const result = zodcode.safeParse(value);
        if (!result.success) {
            // should not happen - so we log this one
            console.error("Error while parsing code", result.error);
            dispatch(showError(genericError));
        } else {
            dispatch(openMainLoading());
            try {
                const { verifyOtpData, tempEncryptedSymmKey } = await verifyOtp(
                    result.data,
                    pendingEmail,
                    userId
                );
                if (verifyOtpData.success) {
                    if (verifyOtpData.encryptedSymmKey === undefined) {
                        await onAwaitingSyncing({
                            email: pendingEmail,
                            userId: verifyOtpData.userId,
                            sessionExpiry: verifyOtpData.sessionExpiry,
                            syncingDevices: verifyOtpData.syncingDevices,
                        });
                    } else {
                        // this is a first time registration or a login from a known device that's been synced already
                        await onLoggedIn({
                            email: pendingEmail,
                            userId: verifyOtpData.userId,
                            sessionExpiry: verifyOtpData.sessionExpiry,
                            encryptedSymmKey: verifyOtpData.encryptedSymmKey,
                            isRegistration:
                                verifyOtpData.encryptedSymmKey ===
                                tempEncryptedSymmKey,
                            syncingDevices: verifyOtpData.syncingDevices,
                            emailCredentialsPerEmail:
                                verifyOtpData.emailCredentialsPerEmail,
                            formCredentialsPerEmail:
                                verifyOtpData.formCredentialsPerEmail,
                            secretCredentialsPerType:
                                verifyOtpData.secretCredentialsPerType,
                        });
                    }
                } else {
                    switch (verifyOtpData.reason) {
                        case ApiV1AuthVerifyOtpPost200ResponseReasonEnum.ExpiredCode:
                            setIsCurrentCodeActive(false);
                            dispatch(
                                showWarning("Code expired - request a new one")
                            );
                            break;
                        case ApiV1AuthVerifyOtpPost200ResponseReasonEnum.WrongGuess:
                            dispatch(showWarning("Wrong guess"));
                            break;
                        case ApiV1AuthVerifyOtpPost200ResponseReasonEnum.TooManyWrongGuess:
                            setIsCurrentCodeActive(false);
                            setOtp("");
                            dispatch(
                                setPendingSessionCodeExpiry(
                                    new Date().toISOString()
                                )
                            );
                            dispatch(
                                showWarning(
                                    "Too many wrong guess - request a new code"
                                )
                            );
                            break;
                    }
                }
            } catch (e) {
                console.error(e);
                if (axios.isAxiosError(e)) {
                    if (e.response?.status === 409) {
                        const auth409:
                            | ApiV1AuthAuthenticatePost409Response
                            | ApiV1AuthAuthenticatePost409ResponseAnyOf = e
                            .response.data as
                            | ApiV1AuthAuthenticatePost409Response
                            | ApiV1AuthAuthenticatePost409ResponseAnyOf; // TODO: this is not future proof - openapi type generation isn't right
                        switch (auth409.reason) {
                            case "already_logged_in":
                                await onLoggedIn({
                                    email: pendingEmail,
                                    userId: auth409.userId,
                                    sessionExpiry: auth409.sessionExpiry,
                                    isRegistration: false,
                                    encryptedSymmKey: auth409.encryptedSymmKey,
                                    syncingDevices: auth409.syncingDevices,
                                    emailCredentialsPerEmail:
                                        auth409.emailCredentialsPerEmail,
                                    formCredentialsPerEmail:
                                        auth409.formCredentialsPerEmail,
                                    secretCredentialsPerType:
                                        auth409.secretCredentialsPerType,
                                });
                                break;
                            case "awaiting_syncing":
                                await onAwaitingSyncing({
                                    email: pendingEmail,
                                    userId: auth409.userId,
                                    sessionExpiry: auth409.sessionExpiry,
                                    syncingDevices: auth409.syncingDevices,
                                });
                                break;
                        }
                    } else if (e.response?.status === 429) {
                        dispatch(showError(throttled));
                    } else {
                        console.error("unexpected axios error", e);
                        dispatch(showError(genericError));
                    }
                } else {
                    console.error("unexpected error", e);
                    dispatch(showError(genericError));
                }
            } finally {
                dispatch(closeMainLoading());
            }
        }
    }

    function handleRequestNewCode() {
        setRequestingNewCode(true);
        dispatch(openMainLoading());
        authenticate(pendingEmail, true, userId)
            .then((response) => {
                if (response === "logged-in") {
                    dispatch(showSuccess(authAlreadyLoggedIn));
                    return;
                } else if (response === "awaiting-syncing") {
                    dispatch(showSuccess(authEmailAlreadyVerified));
                    return;
                } else if (response === "throttled") {
                    dispatch(showError(throttled));
                    return;
                } else {
                    setIsCurrentCodeActive(true);
                    setOtp("");
                    dispatch(
                        showInfo(
                            "New code sent to your email - previous code invalidated"
                        )
                    );
                    return;
                }
            })
            .catch((e) => {
                // TODO: show better error if rate-limited
                console.error(e);
                dispatch(showError(genericError));
            })
            .finally(() => {
                setRequestingNewCode(false);
                dispatch(closeMainLoading());
            });
    }

    function handleChange(value: string) {
        setOtp(value);
    }

    function validateChar(char: string) {
        const result = zoddigit.safeParse(char);
        return result.success;
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "left",
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
            <Box alignSelf="center" sx={{ mb: 2 }}>
                {secondsUntilCodeExpiry === 0 ? (
                    <Alert severity="warning">
                        Code expired - request a new one
                    </Alert>
                ) : (
                    <CircularProgressCountdown
                        value={secondsUntilCodeExpiry}
                        unit={"s"}
                    />
                )}
            </Box>
            <Box alignSelf="center">
                {smallScreen ? (
                    <MuiOtpInput
                        sx={{
                            "& .MuiInputBase-input": {
                                p: 0, // TODO: this is ugly - improve this
                            },
                        }}
                        TextFieldsProps={{
                            disabled: !isCurrentCodeActive,
                            type: "number",
                            inputProps: {
                                inputMode: "numeric",
                                pattern: "[0-9]*",
                            },
                            size: "medium",
                        }}
                        length={6}
                        autoFocus
                        value={otp}
                        onChange={handleChange}
                        validateChar={validateChar}
                        onComplete={handleOnComplete}
                    />
                ) : (
                    <MuiOtpInput
                        TextFieldsProps={{
                            disabled: !isCurrentCodeActive,
                            type: "number",
                            inputProps: {
                                inputMode: "numeric",
                                pattern: "[0-9]*",
                            },
                            size: "medium",
                        }}
                        length={6}
                        autoFocus
                        value={otp}
                        onChange={handleChange}
                        validateChar={validateChar}
                        onComplete={handleOnComplete}
                    />
                )}
            </Box>
            <Box sx={{ mt: 12, mb: 2 }}>
                <Typography variant="body2">
                    Can't find your code? Verify that you entered the right
                    email address, and check your spam folder! Only the last
                    code sent is valid.
                </Typography>
            </Box>
            <Box alignSelf="center">
                <LoadingButton
                    size="small"
                    disabled={!canRequestNewCode}
                    loading={requestingNewCode}
                    onClick={handleRequestNewCode}
                >
                    Request New Code
                </LoadingButton>
            </Box>
        </Box>
    );
}
