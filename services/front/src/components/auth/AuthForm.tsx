import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import React from "react";
import { handleOnAuthenticate } from "@/request/auth";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { zodauthorizedEmail, zodemail } from "@/shared/types/zod";
import type { EmailValidity } from "./Authenticate";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

interface AuthFormProps {
    autoFocus: boolean;
    email: string;
    userId?: string;
    setEmail: (email: string) => void;
    isEmailValid: EmailValidity;
    setIsEmailValid: (emailHelper: EmailValidity) => void;
    emailHelper: string;
    setEmailHelper: (emailHelper: string) => void;
}

export function AuthForm({
    autoFocus,
    email,
    userId,
    setEmail,
    isEmailValid,
    setIsEmailValid,
    emailHelper,
    setEmailHelper,
}: AuthFormProps) {
    const [isTrusted, setIsTrusted] = React.useState<boolean>(false);

    function validateEmail(emailToValidate: string) {
        if (emailToValidate === "") {
            setIsEmailValid("incorrect");
            setEmailHelper(" ");
            return;
        }
        const result = zodemail.safeParse(emailToValidate);
        if (!result.success) {
            const formatted = result.error.format();
            setIsEmailValid("incorrect");
            setEmailHelper(formatted._errors[0]);
        } else {
            const result = zodauthorizedEmail.safeParse(emailToValidate);
            if (!result.success) {
                if (emailToValidate.split("@")[1] === "essec.edu") {
                    setIsEmailValid("invalid_authorized");
                    setEmailHelper(
                        'Please use your ESSEC email address starting with "b", e.g: "b012345678@essec.edu"'
                    );
                } else {
                    setIsEmailValid("valid_unauthorized");
                    setEmailHelper(
                        "This version is invite-only. Stay tuned for future releases!"
                    );
                }
            } else {
                setIsEmailValid("valid_authorized");
                setEmailHelper(" ");
            }
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
                    error={
                        email !== "" &&
                        isEmailValid !== "valid_authorized" &&
                        isEmailValid !== "valid_unauthorized"
                    }
                    helperText={emailHelper} // must always be set to keep same height (see link at variable definition)
                    value={email}
                    onChange={(event: React.FocusEvent<HTMLInputElement>) => {
                        if (event.target.value !== email) {
                            const newEmail = event.target.value.toLowerCase();
                            setEmail(newEmail);
                            validateEmail(newEmail);
                        }
                    }}
                />
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
                                    This is not a shared device - stay logged-in
                                </Typography>
                            }
                        />
                    </FormControl>
                    {isEmailValid === "valid_unauthorized" ? (
                        <Button
                            fullWidth
                            variant="contained"
                            rel="noreferrer"
                            target="_blank"
                            href="https://discord.gg/QwXFDafX4U"
                            color="discord"
                            sx={{ mt: 3, mb: 2 }}
                            endIcon={
                                <FontAwesomeIcon
                                    size="2xs"
                                    icon={faArrowUpRightFromSquare}
                                />
                            }
                        >
                            Join our Discord
                        </Button>
                    ) : (
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            onClick={() => handleOnAuthenticate(email, userId)}
                            disabled={
                                isEmailValid !== "valid_authorized" ||
                                !isTrusted
                            }
                        >
                            Register / Log in
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
