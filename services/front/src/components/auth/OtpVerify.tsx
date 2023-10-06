import Box from "@mui/material/Box";
import LoadingButton from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";
import { MuiOtpInput } from "mui-one-time-password-input";
import React from "react";
import { useCountdown } from "usehooks-ts";
import {
    AuthVerifyOtpPost200ResponseReasonEnum,
    type AuthAuthenticatePost409Response,
} from "../../api";
import { authenticate, onLoggedIn, verifyOtp } from "../../auth/auth";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { ZodType } from "../../shared/types/zod";
import { CircularProgressCountdown } from "../shared/CircularProgressCountdown";
import {
    showError,
    showInfo,
    showSuccess,
    showWarning,
} from "../../store/reducers/snackbar";
import { setPendingSessionCodeExpiry } from "../../store/reducers/session";
import { authAlreadyLoggedIn, genericError } from "../error/message";
import { generateAndEncryptSymmKey } from "../../crypto/ucan/ucan";
import axios from "axios";
import Alert from "@mui/material/Alert";
import { closeMainLoading, openMainLoading } from "@/store/reducers/loading";

export function OtpVerify() {
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
        const pendingSessionUserId = state.sessions.pendingSessionEmail;
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
        const result = ZodType.code.safeParse(value);
        if (!result.success) {
            // should not happen - so we log this one
            console.error("Error while parsing code", result.error);
            dispatch(showError(genericError));
        } else {
            dispatch(openMainLoading());
            try {
                const tempEncryptedSymmKey =
                    await generateAndEncryptSymmKey(pendingEmail);
                // we systematically send an encrypted symmetric key, even though it is only taken into account on registration
                // that is because we don't know at this point if it is a registration or a log in
                // and we don't want the backend to tell us before, otherwise an attacker could do an enumeration attack on the authenticate endpoint.
                // we could send the symm key later, only if needed, but it would result in synchronization issues (what if the user is considered logged-in when registering, but has never synced any symmetric key?)
                // so for the sake of simplicity, we trade off a bit of performance
                const verifyOtpResult = await verifyOtp(
                    result.data,
                    tempEncryptedSymmKey
                );
                if (verifyOtpResult.success) {
                    if (verifyOtpResult.encryptedSymmKey === undefined) {
                        // this is login from a new device or a known unsynced device
                        // device is awaiting syncing: TODO show corresponding screen and update redux user status
                        // then when syncing is OK - steps as in "else"
                    } else {
                        // this is a first time registration or a login from a known device that's been synced already
                        await onLoggedIn({
                            email: pendingEmail,
                            userId: verifyOtpResult.userId,
                            encryptedSymmKey: verifyOtpResult.encryptedSymmKey,
                            isRegistration:
                                verifyOtpResult.encryptedSymmKey ===
                                tempEncryptedSymmKey,
                            syncingDevices: verifyOtpResult.syncingDevices,
                            emailCredentialsPerEmail:
                                verifyOtpResult.emailCredentialsPerEmail,
                            secretCredentialsPerType:
                                verifyOtpResult.secretCredentialsPerType,
                        });
                    }
                } else {
                    switch (verifyOtpResult.reason) {
                        case AuthVerifyOtpPost200ResponseReasonEnum.ExpiredCode:
                            setIsCurrentCodeActive(false);
                            dispatch(
                                showWarning("Code expired - request a new one")
                            );
                            break;
                        case AuthVerifyOtpPost200ResponseReasonEnum.WrongGuess:
                            dispatch(showWarning("Wrong guess"));
                            break;
                        case AuthVerifyOtpPost200ResponseReasonEnum.TooManyWrongGuess:
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
                        const auth409: AuthAuthenticatePost409Response = e
                            .response.data as AuthAuthenticatePost409Response;
                        if (auth409.reason === "already_logged_in") {
                            await onLoggedIn({
                                email: pendingEmail,
                                userId: auth409.userId,
                                isRegistration: false,
                                encryptedSymmKey: auth409.encryptedSymmKey,
                                syncingDevices: auth409.syncingDevices,
                                emailCredentialsPerEmail:
                                    auth409.emailCredentialsPerEmail,
                                secretCredentialsPerType:
                                    auth409.secretCredentialsPerType,
                            });
                        } else {
                            console.log("awaiting_syncing");
                            // TODO "awaiting_syncing";
                        }
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
                    // TODO
                    return;
                }
                setIsCurrentCodeActive(true);
                dispatch(
                    showInfo(
                        "New code sent to your email - previous code invalidated"
                    )
                );
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
        const result = ZodType.digit.safeParse(char);
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
            <Box sx={{ mt: 12, mb: 2 }}>
                <Typography variant="body2">
                    Can't find your code? Verify that you entered the right
                    email address, and check your spam folder! Only the last
                    code sent is valid.
                </Typography>
            </Box>
            <Box alignSelf="center">
                <CircularProgressCountdown
                    value={secondsUntilAllowingNewCode}
                    unit={"s"}
                />
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
