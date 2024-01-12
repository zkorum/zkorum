import { useAppSelector } from "@/hooks";
import {
    selectActiveFormCredential,
    selectActiveSessionEmail,
    selectActiveSessionUserId,
} from "@/store/selector";
import { Typography } from "@mui/material";
import { Container } from "@mui/material";
import Box from "@mui/material/Box";
import React from "react";
import { CommunityPage } from "./CommunityPage";
import { redirectToLogin } from "@/request/auth";
import { domainNameAndExtensionFromEmail } from "@/shared/shared";

// for now we just assume there's one community from one unique email
export function CommunitiesLayout() {
    const activeFormCredential = useAppSelector(selectActiveFormCredential);
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const activeSessionUserId = useAppSelector(selectActiveSessionUserId);
    const [communityName, setCommunityName] = React.useState<string>("");
    React.useEffect(() => {
        if (activeSessionEmail === undefined || activeSessionEmail === "") {
            setCommunityName("");
            redirectToLogin();
            return;
        }

        const { domainName } =
            domainNameAndExtensionFromEmail(activeSessionEmail);
        if (domainName !== undefined) {
            setCommunityName(domainName.toUpperCase());
        }
    }, [activeSessionEmail]);

    return (
        <Container
            maxWidth="md"
            sx={{ height: "100%", backgroundColor: "#ffff" }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "left",
                }}
            >
                <Box sx={{ my: 2 }}>
                    <Typography variant={"h5"}>
                        {activeFormCredential !== undefined
                            ? `Your ${communityName} community`
                            : `Complete Your ${communityName} Profile`}
                    </Typography>
                </Box>
                {activeSessionEmail !== undefined &&
                activeSessionEmail !== "" &&
                activeSessionUserId !== undefined ? (
                    <Box sx={{ my: 2 }}>
                        <CommunityPage
                            email={activeSessionEmail}
                            communityCredential={activeFormCredential}
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
