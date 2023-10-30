import { useAppDispatch, useAppSelector } from "@/hooks";
import {
    selectActiveEmailCredential,
    selectActiveSessionEmail,
    selectActiveSessionUserId,
} from "@/store/selector";
import { Typography } from "@mui/material";
import { Container } from "@mui/material";
import Box from "@mui/material/Box";
import React from "react";
import { CommunityPage } from "./CommunityPage";
import { redirectToLogin } from "@/auth/auth";
import { fetchAndUpdateCredentials } from "@/credential/credential";
import { closeMainLoading, openMainLoading } from "@/store/reducers/loading";
import { showError } from "@/store/reducers/snackbar";
import { genericError } from "../error/message";

// for now we just assume there's one community from one unique email
export function CommunitiesLayout() {
    const dispatch = useAppDispatch();
    const activeEmailCredential = useAppSelector(selectActiveEmailCredential);
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const activeSessionUserId = useAppSelector(selectActiveSessionUserId);
    const [communityName, setCommunityName] = React.useState<string>("");
    React.useEffect(() => {
        if (activeSessionEmail === undefined || activeSessionEmail === "") {
            setCommunityName("");
            redirectToLogin();
            return;
        }

        const nameAndDomain = activeSessionEmail.split("@");
        if (nameAndDomain.length === 2) {
            const [_username, domain] = [nameAndDomain[0], nameAndDomain[1]];
            const domainNameAndDomainExtension = domain.split(".");
            if (domainNameAndDomainExtension.length === 2) {
                const [domainName, _domainExtension] =
                    domainNameAndDomainExtension;
                setCommunityName(domainName.toUpperCase());
                // setUsername(username);
            }
        }

        // this will set the values in redux store and eventually update this page
        const fetchData = async function () {
            try {
                dispatch(openMainLoading());
                await fetchAndUpdateCredentials();
            } catch (e) {
                dispatch(showError(genericError));
            } finally {
                dispatch(closeMainLoading());
            }
        };
        fetchData();
        return () => {
            dispatch(closeMainLoading());
        };
    }, [activeSessionEmail]);

    return (
        <Container maxWidth="md" sx={{ backgroundColor: "#ffff" }}>
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
                {activeSessionEmail !== undefined &&
                activeSessionEmail !== "" &&
                activeSessionUserId !== undefined ? (
                    <Box sx={{ my: 2 }}>
                        <CommunityPage
                            email={activeSessionEmail}
                            communityCredential={activeEmailCredential}
                            userId={activeSessionUserId}
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
        </Container>
    );
}
