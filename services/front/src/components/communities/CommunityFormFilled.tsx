import React from "react";
import { BBSPlusCredential as Credential } from "@docknetwork/crypto-wasm-ts";

interface CommunityFormFilledProps {
    communityCredential: Credential;
}

export function CommunityFormFilled({
    communityCredential,
}: CommunityFormFilledProps) {
    React.useEffect(() => {
        console.log(communityCredential);
    }, []);
    return <>{JSON.stringify(communityCredential)}</>;
}
