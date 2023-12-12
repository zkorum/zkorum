import {
    getFromAuthor,
    getTimeFromNow,
    getToEligibility,
} from "@/common/common";
import { maybeInitWasm } from "@/crypto/vc/credential";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { doRespondToPoll } from "@/request/credential";
import { hideContent, unhideContent } from "@/request/moderation";
import { stringToBytes } from "@/shared/common/arrbufs";
import {
    attributesFormRevealedFromPostAs,
    buildContext,
    buildResponseToPollFromPayload,
    isEligibleForCountries,
    isEligibleForList,
    mustPostAsForCountries,
    mustPostAsForList,
    postAsFromEligibility,
    scopeFromPostAs,
    type PostAsProps,
} from "@/shared/shared";
import type {
    ExtendedPollData,
    ResponseToPoll,
    ResponseToPollPayload,
    UniversityType,
} from "@/shared/types/zod";
import { showError } from "@/store/reducers/snackbar";
import {
    selectActiveEmailCredential,
    selectActiveFormCredential,
    selectActiveSessionEmail,
    selectActiveTimeboundSecretCredential,
    selectPollResponsePerPollUid,
} from "@/store/selector";
import {
    PresentationBuilder,
    PseudonymBases,
    BBSPlusPublicKeyG2 as PublicKey,
    randomFieldElement,
} from "@docknetwork/crypto-wasm-ts";
import { faMask } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PublicIcon from "@mui/icons-material/Public";
import VerifiedIcon from "@mui/icons-material/Verified";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import React from "react";
import { creatingProof, genericError, sendingPost } from "../error/message";
import type { UpdatePostHiddenStatusProps } from "./Feed";
import { PollCanRespondView } from "./PollCanRespondView";
import { PollResultView } from "./PollResultView";
import Logo from "/logo-essec_72x107.af462b8d2b4c.png";

export type UserResponse =
    | "option1"
    | "option2"
    | "option3"
    | "option4"
    | "option5"
    | "option6";

interface PostViewProps {
    post: ExtendedPollData;
    updatePost: (responseToPoll: ResponseToPollPayload) => void;
    updatePostHiddenStatus: (props: UpdatePostHiddenStatusProps) => void;
}

export interface RespondToPollProps {
    optionNumberResponded: number;
    setButtonIsLoading: (isLoading: boolean) => void;
    setButtonLoadingText: (loadingText: string) => void;
    poll: ExtendedPollData;
}

export function PostView({
    post,
    updatePost,
    updatePostHiddenStatus,
}: PostViewProps) {
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const activeFormCredential = useAppSelector(selectActiveFormCredential);
    const activeEmailCredential = useAppSelector(selectActiveEmailCredential);
    const activeTimeboundSecretCredential = useAppSelector(
        selectActiveTimeboundSecretCredential
    );
    const dispatch = useAppDispatch();
    const pollResponse = useAppSelector((state) =>
        selectPollResponsePerPollUid(state, post.metadata.uid)
    );

    const [isHideLoading, setIsHideLoading] = React.useState<boolean>(false);
    const [isUnhideLoading, setIsUnhideLoading] =
        React.useState<boolean>(false);

    async function respondToPoll({
        optionNumberResponded,
        setButtonIsLoading,
        setButtonLoadingText,
        poll,
    }: RespondToPollProps) {
        if (
            activeEmailCredential === undefined ||
            activeTimeboundSecretCredential === undefined
        ) {
            return; // for typescript...
        }
        try {
            setButtonIsLoading(true);
            setButtonLoadingText(creatingProof);
            await maybeInitWasm();
            // create Verifiable Presentation containing Attribute-Bound Pseudonym from global secret and email credential ID (== email address)
            const backendPublicKey = new PublicKey(
                PublicKey.fromHex(import.meta.env.VITE_BACK_PUBLIC_KEY).bytes
            ); // no DID resolution for now
            const builder = new PresentationBuilder();
            builder.addCredential(
                activeTimeboundSecretCredential,
                backendPublicKey
            );
            builder.addCredential(activeEmailCredential, backendPublicKey); // for externally issued credential, the pub key here will not be ZKorum's but the community authority's (e.g,: ESSEC's)
            builder.markAttributesRevealed(
                0,
                new Set<string>(["credentialSubject.type"])
            ); // first credential added was secret credential, for posting must be an unbound one
            builder.markAttributesRevealed(
                1,
                new Set<string>([
                    "credentialSubject.domain",
                    "credentialSubject.type",
                ])
            ); // second credential added was email credential
            let formCredentialIsUsed = false;
            let postAs: PostAsProps;
            if (activeFormCredential !== undefined) {
                const mustPostAsForCampus = mustPostAsForList(
                    (activeFormCredential.subject as any)?.typeSpecific?.campus,
                    poll.eligibility?.university?.student?.campuses
                );
                const mustPostAsForProgram = mustPostAsForList(
                    (activeFormCredential.subject as any)?.typeSpecific
                        ?.program,
                    poll.eligibility?.university?.student?.programs
                );
                const mustPostAsForAdmissionYear = mustPostAsForList(
                    (activeFormCredential.subject as any)?.typeSpecific
                        ?.admissionYear,
                    poll.eligibility?.university?.student?.admissionYears
                );
                const mustPostAsForCountry = mustPostAsForCountries(
                    (activeFormCredential.subject as any)?.typeSpecific
                        ?.countries,
                    poll.eligibility?.university?.student?.countries
                );
                postAs = postAsFromEligibility({
                    eligibility: poll.eligibility,
                    type: (activeFormCredential.subject as any)?.typeSpecific
                        ?.type as UniversityType | undefined,
                    mustPostAsForCampus,
                    mustPostAsForProgram,
                    mustPostAsForAdmissionYear,
                    mustPostAsForCountries: mustPostAsForCountry,
                });
                const attributesRevealed = attributesFormRevealedFromPostAs({
                    postAs: postAs,
                    credential: activeFormCredential,
                });
                if (attributesRevealed.size > 0) {
                    // at least one specific postAs has been selected: even if the formCredential exist, it might not be used!
                    formCredentialIsUsed = true;
                    builder.addCredential(
                        activeFormCredential,
                        backendPublicKey
                    );
                    builder.markAttributesRevealed(2, attributesRevealed); // third credential added is form credential
                }
            } else {
                postAs = {
                    postAsAlum: false,
                    postAsFaculty: false,
                    postAsStudent: false,
                    postAsCampus: false,
                    postAsProgram: false,
                    postAsAdmissionYear: false,
                    postAsCountries: false,
                };
            }
            //////// PSEUDONYMS /////
            const scope = stringToBytes(scopeFromPostAs(postAs)); // the scope and thus the pseudonym will be different for each combination of attributes revealed. @see doc/anonymous_pseudonym.md
            const attributeNames = new Map();
            const secretSubject = "credentialSubject.secret";
            const attributesSecretCredential =
                activeTimeboundSecretCredential.schema.flatten()[0];
            if (!attributesSecretCredential.includes(secretSubject)) {
                console.warn(
                    `Secret credential does not contain subject '${secretSubject}'`
                );
                // TODO: instead of generic error, propose something for recovering
                dispatch(showError(genericError));
                return;
            }
            attributeNames.set(0, [secretSubject]); // index is 0 because secret credential is the first credential added
            const emailSubject = "credentialSubject.email";
            const attributesEmailCredential =
                activeEmailCredential.schema.flatten()[0];
            if (!attributesEmailCredential.includes(emailSubject)) {
                console.warn(
                    `Email credential does not contain subject '${emailSubject}'`
                );
                // TODO: instead of generic error, propose something for recovering
                dispatch(showError(genericError));
                return;
            }
            attributeNames.set(1, [emailSubject]); // email credential is index 1 because it's the second that was added
            const basesForAttributes =
                PseudonymBases.generateBasesForAttributes(
                    2, // communityId ( == email here) + secret value = 2 attributes
                    scope
                );
            builder.addBoundedPseudonym(basesForAttributes, attributeNames);
            // meta equalities
            if (formCredentialIsUsed) {
                builder.markAttributesEqual(
                    [0, "credentialSubject.uid"],
                    [1, "credentialSubject.uid"],
                    [2, "credentialSubject.uid"]
                );
                builder.markAttributesEqual(
                    // email in email and form credentials are equal
                    [1, "credentialSubject.email"],
                    [2, "credentialSubject.email"]
                );
            } else {
                builder.markAttributesEqual(
                    [0, "credentialSubject.uid"],
                    [1, "credentialSubject.uid"]
                );
            }
            const payloadResponseToPoll: ResponseToPollPayload = {
                pollUid: poll.metadata.uid,
                optionChosen: optionNumberResponded,
            };
            const responseToPoll: ResponseToPoll =
                buildResponseToPollFromPayload(payloadResponseToPoll);
            const context = await buildContext(JSON.stringify(responseToPoll));
            builder.context = context;
            builder.nonce = randomFieldElement();
            builder.version = "0.1.0";
            const presentation = builder.finalize();
            setButtonLoadingText(sendingPost);
            await doRespondToPoll(
                presentation,
                payloadResponseToPoll,
                updatePost
            );
        } catch (e) {
            console.warn("Error while responding to poll", e);
            dispatch(showError(genericError));
        } finally {
            setButtonIsLoading(false);
            setButtonLoadingText("");
        }
    }

    function getIsEligible(
        post: ExtendedPollData,
        formCredentialObj: object | undefined
    ): boolean {
        if (
            post.eligibility.university === undefined ||
            post.eligibility.university.types === undefined
        ) {
            return true;
        }
        if (
            formCredentialObj === undefined ||
            (formCredentialObj as any).typeSpecific === undefined
        ) {
            return false;
        }
        const typeSpecific = (formCredentialObj as any).typeSpecific;
        const univType = typeSpecific.type as UniversityType;
        switch (univType) {
            case "alum":
            case "faculty":
                if (post.eligibility.university.types.includes(univType)) {
                    return true;
                } else {
                    return false;
                }
            case "student":
                if (post.eligibility.university.types.includes(univType)) {
                    if (post.eligibility.university.student === undefined) {
                        return true;
                    } else if (
                        isEligibleForCountries(
                            typeSpecific.countries,
                            post.eligibility.university.student.countries
                        ) &&
                        isEligibleForList(
                            typeSpecific.campus,
                            post.eligibility.university.student.campuses
                        ) &&
                        isEligibleForList(
                            typeSpecific.program,
                            post.eligibility.university.student.programs
                        ) &&
                        isEligibleForList(
                            typeSpecific.admissionYear,
                            post.eligibility.university.student.admissionYears
                        )
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
        }
    }
    const isEligible =
        activeEmailCredential === undefined
            ? false
            : getIsEligible(post, activeFormCredential?.subject);

    async function handleHide() {
        setIsHideLoading(true);
        try {
            await hideContent({ pollUid: post.metadata.uid });
            updatePostHiddenStatus({ uid: post.metadata.uid, isHidden: true });
        } catch (e) {
            dispatch(showError(genericError));
        } finally {
            setIsHideLoading(false);
        }
    }

    async function handleUnhide() {
        setIsUnhideLoading(true);
        try {
            await unhideContent({ pollUid: post.metadata.uid });
            updatePostHiddenStatus({ uid: post.metadata.uid, isHidden: false });
        } catch (e) {
            dispatch(showError(genericError));
        } finally {
            setIsUnhideLoading(false);
        }
    }

    return (
        // lines
        <Paper
            elevation={0}
            sx={{ opacity: `${post.metadata.isHidden === true ? 0.5 : 1}` }}
        >
            <Box sx={{ pt: 2, pb: 1, px: 2, my: 1 }}>
                <Grid container spacing={1} direction="column">
                    <Grid
                        container
                        spacing={2}
                        alignItems="flex-start"
                        justifyContent="flex-start"
                    >
                        <Grid>
                            <Box
                                component="img"
                                sx={{
                                    height: 42,
                                }}
                                alt="ESSEC"
                                src={Logo}
                            />
                        </Grid>
                        <Grid
                            p="0"
                            container
                            alignItems="flex-start"
                            justifyContent="flex-start"
                            direction="column"
                            gap={0}
                            spacing={0}
                        >
                            <Grid>
                                <Grid
                                    sx={{ height: 20 }}
                                    container
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Grid>
                                        <Typography
                                            sx={{
                                                fontWeight: "bold",
                                                fontSize: 14,
                                            }}
                                            variant="body2"
                                        >
                                            ESSEC
                                        </Typography>
                                    </Grid>
                                    <Grid>
                                        <VerifiedIcon
                                            sx={{ fontSize: 12 }}
                                            color="primary"
                                        />
                                    </Grid>
                                    <Grid>
                                        <Typography
                                            sx={{
                                                color: "rgba(0, 0, 0, 0.6)",
                                                fontSize: 12,
                                            }}
                                            variant="body2"
                                        >
                                            •
                                        </Typography>
                                    </Grid>
                                    <Grid>
                                        <Typography
                                            sx={{
                                                color: "rgba(0, 0, 0, 0.6)",
                                                fontSize: 12,
                                            }}
                                            variant="body2"
                                        >
                                            {getTimeFromNow(
                                                post.metadata.updatedAt
                                            )}
                                        </Typography>
                                    </Grid>
                                    <Grid>
                                        <Typography
                                            sx={{
                                                color: "rgba(0, 0, 0, 0.6)",
                                                fontSize: 12,
                                            }}
                                            variant="body2"
                                        >
                                            •
                                        </Typography>
                                    </Grid>
                                    <Grid>
                                        <PublicIcon
                                            sx={{
                                                color: "rgba(0, 0, 0, 0.6)",
                                                fontSize: 12,
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid
                                sx={{ height: 20 }}
                                alignItems="center"
                                container
                                direction="row"
                                spacing={0.5}
                            >
                                <Grid
                                    container
                                    direction="row"
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    <Grid>
                                        <Typography
                                            sx={{
                                                color: "rgba(0, 0, 0, 0.6)",
                                                fontSize: 12,
                                            }}
                                            variant="body2"
                                        >
                                            {`From ${getFromAuthor(
                                                post.author
                                            )}`}
                                        </Typography>
                                    </Grid>
                                    <Grid>
                                        <FontAwesomeIcon
                                            color="rgba(0, 0, 0, 0.6)"
                                            size="xs"
                                            icon={faMask}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid
                                sx={{ height: 20 }}
                                alignItems="center"
                                justifyContent="center"
                                container
                                direction="row"
                                spacing={0.5}
                            >
                                <Grid>
                                    <Typography
                                        sx={{
                                            color: "rgba(0, 0, 0, 0.6)",
                                            fontSize: 12,
                                        }}
                                        variant="body2"
                                    >
                                        {`To ${getToEligibility(
                                            post.eligibility
                                        )}`}
                                    </Typography>
                                </Grid>
                            </Grid>
                            {isEligible ? (
                                <Grid
                                    sx={{ height: 15 }}
                                    alignItems="center"
                                    justifyContent="center"
                                    container
                                    direction="row"
                                    spacing={0.5}
                                >
                                    <Chip
                                        sx={{
                                            fontSize: 10,
                                            height: 12,
                                        }}
                                        icon={
                                            <AdminPanelSettingsIcon
                                                sx={{ fontSize: 10 }}
                                                color="success"
                                            />
                                        }
                                        label="You are eligible"
                                        color="success"
                                    />
                                </Grid>
                            ) : null}
                        </Grid>
                        {activeSessionEmail.endsWith("zkorum.com") ? (
                            <Grid
                                justifySelf="flex-end"
                                sx={{ marginLeft: "auto" }}
                            >
                                {post.metadata.isHidden === true ? (
                                    <LoadingButton
                                        loading={isUnhideLoading}
                                        onClick={handleUnhide}
                                        size="small"
                                        variant="outlined"
                                    >
                                        Unhide
                                    </LoadingButton>
                                ) : (
                                    <LoadingButton
                                        loading={isHideLoading}
                                        onClick={handleHide}
                                        size="small"
                                        variant="contained"
                                    >
                                        Hide
                                    </LoadingButton>
                                )}
                            </Grid>
                        ) : null}
                    </Grid>
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="center"
                        spacing={1}
                        sx={{
                            borderRadius: "8px",
                            my: 0.5,
                            border: "1px solid #e6e9ec",
                        }}
                    >
                        <Grid sx={{ p: 1 }}>
                            <Typography
                                variant="body1"
                                sx={{
                                    fontWeight: "bold",
                                    fontSize: "1.125rem",
                                    lineHeight: "1.5rem",
                                }}
                            >
                                {post.payload.data.question}
                            </Typography>
                        </Grid>
                        {!isEligible || pollResponse !== undefined ? (
                            <PollResultView
                                result={post.payload.result}
                                data={post.payload.data}
                                pollResponse={pollResponse}
                            />
                        ) : (
                            <PollCanRespondView
                                data={post.payload.data}
                                onRespond={async (
                                    optionNumberResponded,
                                    setButtonIsLoading,
                                    setButtonLoadingText
                                ) =>
                                    await respondToPoll({
                                        optionNumberResponded,
                                        setButtonIsLoading,
                                        setButtonLoadingText,
                                        poll: post,
                                    })
                                }
                            />
                        )}
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
}
