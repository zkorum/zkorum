import type { UpdatePostHiddenStatusProps } from "@/RootDialog";
import {
    getTimeFromNow,
    getTrimmedPseudonym,
    zeroIfUndefined,
} from "@/common/common";
import { VITE_BACK_PUBLIC_KEY } from "@/common/conf";
import { maybeInitWasm } from "@/crypto/vc/credential";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { hidePost, unhidePost } from "@/request/moderation";
import { doRespondToPoll } from "@/request/post";
import { stringToBytes } from "@/shared/common/arrbufs";
import {
    BASE_SCOPE,
    buildContext,
    buildResponseToPollFromPayload,
} from "@/shared/shared";
import type {
    ExtendedPostData,
    PollMetadata,
    ResponseToPoll,
    ResponseToPollPayload,
} from "@/shared/types/zod";
import { showError } from "@/store/reducers/snackbar";
import {
    selectActiveEmailCredential,
    selectActiveSessionEmail,
    selectActiveTimeboundSecretCredential,
    selectPollResponsePerPostUid,
} from "@/store/selector";
import {
    PresentationBuilder,
    PseudonymBases,
    BBSPlusPublicKeyG2 as PublicKey,
    randomFieldElement,
} from "@docknetwork/crypto-wasm-ts";
import PublicIcon from "@mui/icons-material/Public";
import VerifiedIcon from "@mui/icons-material/Verified";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import React from "react";
import { creatingProof, genericError, sendingPost } from "../error/message";
import { CommentsViewsLikesView } from "./CommentsViewsLikesView";
import { PollCanRespondView } from "./PollCanRespondView";
import { PollResultView } from "./PollResultView";
import SchoolIcon from "@mui/icons-material/School";

export type UserResponse =
    | "option1"
    | "option2"
    | "option3"
    | "option4"
    | "option5"
    | "option6";

interface PostViewProps {
    post: ExtendedPostData;
    updatePost: (responseToPoll: ResponseToPollPayload) => void;
    updatePostHiddenStatus: (props: UpdatePostHiddenStatusProps) => void;
    onComment: (event: React.MouseEvent<HTMLElement>) => void;
    viewMode: "feed" | "post";
}

export interface RespondToPollProps {
    optionNumberResponded: number;
    setButtonIsLoading: (isLoading: boolean) => void;
    setButtonLoadingText: (loadingText: string) => void;
    poll: ExtendedPostData;
}

export function PostView({
    viewMode,
    post,
    onComment,
    updatePost,
    updatePostHiddenStatus,
}: PostViewProps) {
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const isLoggedIn =
        activeSessionEmail !== "" && activeSessionEmail !== undefined;
    const activeEmailCredential = useAppSelector(selectActiveEmailCredential);
    const activeTimeboundSecretCredential = useAppSelector(
        selectActiveTimeboundSecretCredential
    );
    const dispatch = useAppDispatch();
    const pollResponse = useAppSelector((state) =>
        selectPollResponsePerPostUid(state, post.metadata.uid)
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
                PublicKey.fromHex(VITE_BACK_PUBLIC_KEY).bytes
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
                new Set<string>(["credentialSubject.domain"])
            ); // second credential added was email credential

            //////// PSEUDONYMS /////
            const scope = stringToBytes(BASE_SCOPE); // the scope and thus the pseudonym will be different for each combination of attributes revealed. @see doc/anonymous_pseudonym.md
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
            builder.markAttributesEqual(
                [0, "credentialSubject.uid"],
                [1, "credentialSubject.uid"]
            );
            const payloadResponseToPoll: ResponseToPollPayload = {
                postUid: poll.metadata.uid,
                optionChosen: optionNumberResponded,
            };
            const responseToPoll: ResponseToPoll =
                buildResponseToPollFromPayload(payloadResponseToPoll);
            const context = await buildContext(JSON.stringify(responseToPoll));
            builder.context = context;
            builder.nonce = randomFieldElement();
            builder.version = import.meta.env.VITE_PRESENTATION_VERSION;
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

    async function handleHide(event: React.MouseEvent<HTMLElement>) {
        setIsHideLoading(true);
        event.stopPropagation();
        try {
            await hidePost({ pollUid: post.metadata.uid });
            updatePostHiddenStatus({ uid: post.metadata.uid, isHidden: true });
        } catch (e) {
            dispatch(showError(genericError));
        } finally {
            setIsHideLoading(false);
        }
    }

    async function handleUnhide(event: React.MouseEvent<HTMLElement>) {
        setIsUnhideLoading(true);
        event.stopPropagation();
        try {
            await unhidePost({ pollUid: post.metadata.uid });
            updatePostHiddenStatus({ uid: post.metadata.uid, isHidden: false });
        } catch (e) {
            dispatch(showError(genericError));
        } finally {
            setIsUnhideLoading(false);
        }
    }

    function showDate(postMetadata: PollMetadata): string {
        switch (viewMode) {
            case "post":
                return getTimeFromNow(postMetadata.updatedAt);
            case "feed":
                return getTimeFromNow(postMetadata.lastReactedAt);
        }
    }

    function getPollView() {
        if (post.payload.poll !== undefined) {
            const numberOfResponses =
                post.payload.poll.result.option1Response +
                post.payload.poll.result.option2Response +
                zeroIfUndefined(post.payload.poll.result.option3Response) +
                zeroIfUndefined(post.payload.poll.result.option4Response) +
                zeroIfUndefined(post.payload.poll.result.option5Response) +
                zeroIfUndefined(post.payload.poll.result.option6Response);
            if (pollResponse !== undefined || !isLoggedIn) {
                return (
                    <Grid
                        sx={
                            viewMode === "post"
                                ? {
                                      py: 1,
                                      borderRadius: "8px",
                                      border: "1px solid #e6e9ec",
                                  }
                                : { py: 1 }
                        }
                    >
                        <PollResultView
                            result={post.payload.poll.result}
                            options={post.payload.poll.options}
                            pollResponse={pollResponse}
                        />
                        <Grid sx={{ px: 1, pb: 1 }}>
                            <Typography variant="body2">
                                {numberOfResponses}{" "}
                                {numberOfResponses <= 1 ? "vote" : "votes"}
                            </Typography>
                        </Grid>
                    </Grid>
                );
            } else {
                return (
                    <Grid
                        sx={{
                            my: 0.5,
                        }}
                    >
                        <PollCanRespondView
                            options={post.payload.poll.options}
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
                    </Grid>
                );
            }
        }
    }

    return (
        // lines
        <Paper
            elevation={0}
            sx={{ opacity: `${post.metadata.isHidden === true ? 0.5 : 1}` }}
        >
            <Box sx={{ pt: 2, pb: 1, px: 2 }}>
                <Grid container spacing={1} direction="column">
                    <Grid
                        container
                        spacing={2}
                        alignItems="flex-start"
                        justifyContent="flex-start"
                    >
                        <Grid>
                            <SchoolIcon sx={{ fontSize: "42px" }} />
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
                            <Grid height={20}>
                                <Grid
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
                                            essec.edu
                                        </Typography>
                                    </Grid>
                                    <Grid>
                                        <VerifiedIcon
                                            sx={{ fontSize: 12 }}
                                            color="primary"
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid height={13}>
                                <Typography
                                    sx={{
                                        color: "rgba(0, 0, 0, 0.6)",
                                        fontSize: 12,
                                    }}
                                    variant="body2"
                                >
                                    {`${getTrimmedPseudonym(
                                        post.author.pseudonym
                                    )}`}
                                </Typography>
                            </Grid>
                            <Grid
                                height={13}
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
                                        {showDate(post.metadata)}
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
                </Grid>
                <Grid
                    sx={
                        viewMode === "feed"
                            ? {
                                  borderRadius: "8px",
                                  border: "1px solid #e6e9ec",
                              }
                            : undefined
                    }
                    p={viewMode === "feed" ? 1 : 0}
                    mt={2}
                >
                    <Grid px={viewMode === "feed" ? 1 : 0} py={1}>
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: "bold",
                                fontSize: "1.125rem",
                                lineHeight: "1.5rem",
                            }}
                        >
                            {post.payload.title}
                        </Typography>
                    </Grid>
                    {post.payload.body !== undefined ? (
                        <Grid px={viewMode === "feed" ? 1 : 0} py={1}>
                            <Typography
                                sx={{
                                    color:
                                        viewMode === "feed"
                                            ? "rgba(0, 0, 0, 0.6)"
                                            : "inherit",
                                }}
                                variant={
                                    viewMode === "feed" ? "body2" : "body1"
                                }
                            >
                                {post.payload.body.length <= 200
                                    ? post.payload.body
                                    : viewMode === "feed"
                                    ? `${post.payload.body.slice(0, 200)}...`
                                    : post.payload.body}
                            </Typography>
                        </Grid>
                    ) : null}
                    <Grid mt={1}>{getPollView()}</Grid>
                </Grid>
                <Grid mt={1}>
                    <CommentsViewsLikesView
                        onComment={onComment}
                        commentCount={post.metadata.commentCount}
                    />
                </Grid>
            </Box>
        </Paper>
    );
}
