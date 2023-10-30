// import List from "@mui/material/List";
// import ListItem from "@mui/material/ListItem";
// import ListItemButton from "@mui/material/ListItemButton";
// import ListItemText from "@mui/material/ListItemText";
// import ListSubheader from "@mui/material/ListSubheader";
import { BBSPlusCredential as Credential } from "@docknetwork/crypto-wasm-ts";

import { CommunityForm } from "./CommunityForm";
import { CommunityFormFilled } from "./CommunityFormFilled";

interface CommunityPageProps {
    communityCredential: Credential | undefined;
    email: string;
    userId: string;
}

export function CommunityPage({
    communityCredential,
    email,
    userId,
}: CommunityPageProps) {
    if (communityCredential !== undefined) {
        return (
            <CommunityFormFilled communityCredential={communityCredential} />
        );
    } else {
        return <CommunityForm userId={userId} email={email} />;
    }
}
