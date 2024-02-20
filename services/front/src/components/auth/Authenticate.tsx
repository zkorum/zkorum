import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import React from "react";
import { useAppSelector } from "../../hooks";
import {
    selectActiveSessionEmail,
    selectSortedSessionsData,
} from "../../store/selector";
import { AuthForm } from "./AuthForm";
import { ChooseExistingAccount } from "./ChooseExistingAccount";

export type EmailValidity =
    | "valid_authorized"
    | "valid_unauthorized"
    | "incorrect"; // syntaxically incorrect email

export function Authenticate() {
    const [email, setEmail] = React.useState<string>("");
    const [userId, setUserId] = React.useState<string | undefined>(undefined);
    const [isEmailValid, setIsEmailValid] =
        React.useState<EmailValidity>("incorrect");
    const [emailHelper, setEmailHelper] = React.useState<string>(" "); // we must have a helper set to not change form height: https://stackoverflow.com/questions/72510035/error-message-affects-the-height-of-the-text-field-helpertext-material-ui
    const sessionsData = useAppSelector(selectSortedSessionsData);
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);

    React.useEffect(() => {
        setUserId(
            sessionsData.find((sessionData) => sessionData.email === email)
                ?.userId
        );
    }, [email]);

    if (sessionsData.length === 0) {
        return (
            <AuthForm
                email={email}
                setEmail={setEmail}
                isEmailValid={isEmailValid}
                setIsEmailValid={setIsEmailValid}
                emailHelper={emailHelper}
                setEmailHelper={setEmailHelper}
                autoFocus={true}
            />
        );
    } else {
        return (
            <Box>
                <ChooseExistingAccount
                    sessions={sessionsData}
                    activeSessionEmail={activeSessionEmail}
                />
                <Divider>OR</Divider>
                <AuthForm
                    email={email}
                    userId={userId}
                    setEmail={setEmail}
                    isEmailValid={isEmailValid}
                    setIsEmailValid={setIsEmailValid}
                    emailHelper={emailHelper}
                    setEmailHelper={setEmailHelper}
                    autoFocus={true}
                />
            </Box>
        );
    }
}
