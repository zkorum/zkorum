import { useAppDispatch, useAppSelector } from "@/hooks";
import { selectActiveSessionEmail } from "@/store/selector";
import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import React from "react";
import { CommunityPage } from "./CommunityPage";
import { redirectToLogin } from "@/auth/auth";
import { getCredentials } from "@/credential/credential";
import { closeMainLoading, openMainLoading } from "@/store/reducers/loading";
import { showError } from "@/store/reducers/snackbar";
import { genericError } from "../error/message";

// for now we just assume there's one community from one unique email
export function CommunitiesLayout() {
    const dispatch = useAppDispatch();
    const emailCredential = useAppSelector((state) => {
        const activeSessionEmail = state.sessions.activeSessionEmail;
        if (activeSessionEmail === undefined) {
            return undefined;
        }
        const emailCredentialsPerEmail =
            state.sessions.sessions[activeSessionEmail]
                .emailCredentialsPerEmail;
        if (
            emailCredentialsPerEmail !== undefined &&
            activeSessionEmail in emailCredentialsPerEmail
        ) {
            return emailCredentialsPerEmail[activeSessionEmail].active;
        } else {
            return undefined;
        }
    });
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const [communityName, setCommunityName] = React.useState<string>("");
    React.useEffect(() => {
        if (activeSessionEmail === undefined || activeSessionEmail === "") {
            redirectToLogin();
        } else {
            const nameAndDomain = activeSessionEmail.split("@");
            if (nameAndDomain.length === 2) {
                const [_username, domain] = [
                    nameAndDomain[0],
                    nameAndDomain[1],
                ];
                const domainNameAndDomainExtension = domain.split(".");
                if (domainNameAndDomainExtension.length === 2) {
                    const [domainName, _domainExtension] =
                        domainNameAndDomainExtension;
                    setCommunityName(domainName.toUpperCase());
                    // setUsername(username);
                }
            }
        }
    }, [activeSessionEmail]);

    // browser-value could be out of date
    React.useEffect(() => {
        // this will set the values in redux store and eventually update this page
        const fetchData = async function () {
            dispatch(openMainLoading());
            await getCredentials();
        };
        fetchData()
            .catch(() => dispatch(showError(genericError)))
            .finally(() => dispatch(closeMainLoading()));
        return () => {
            dispatch(closeMainLoading());
        };
    }, []);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "left",
            }}
        >
            <Box sx={{ my: 2 }}>
                <Typography variant={"h4"}>
                    Your {communityName} community
                </Typography>
            </Box>
            {activeSessionEmail !== "" ? (
                <Box sx={{ my: 2 }}>
                    <CommunityPage
                        communityCredential={emailCredential}
                    ></CommunityPage>
                </Box>
            ) : (
                <Box>
                    <Typography>
                        Log in to connect with your community.
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
