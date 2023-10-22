import { uint8ArrayToJSON } from "@/shared/common/arrbufs";
import { decode } from "@/shared/common/base64";
// import { BBSPlusCredential as Credential } from "@docknetwork/crypto-wasm-ts";
// import React from "react";

interface CommunityFormFilledProps {
    communityCredential: string;
}

export function CommunityFormFilled({
    communityCredential,
}: CommunityFormFilledProps) {
    // React.useEffect(() => {
    //     console.log(
    //         Credential.fromJSON(uint8ArrayToJSON(decode(communityCredential)))
    //     );
    // }, []);
    return <>{uint8ArrayToJSON(decode(communityCredential)).toString()}</>;
}
