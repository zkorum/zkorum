import { VITE_BACK_PUBLIC_KEY } from "@/common/conf";
import { maybeInitWasm } from "@/crypto/vc/credential";
import { usePostsAndMeta, type PostsType } from "@/feed";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { createComment, fetchMoreComments, fetchPost } from "@/request/post";
import { stringToBytes } from "@/shared/common/arrbufs";
import {
    BASE_SCOPE,
    MAX_LENGTH_COMMENT,
    buildContext,
    buildCreateCommentContextFromPayload,
} from "@/shared/shared";
import type {
    CreateCommentPayload,
    ExtendedPostData,
    PostComment,
} from "@/shared/types/zod";
import { showError, showInfo, showSuccess } from "@/store/reducers/snackbar";
import {
    selectActiveEmailCredential,
    selectActiveSessionEmail,
    selectActiveSessionStatus,
    selectActiveSessionUserId,
    selectActiveUnboundSecretCredential,
} from "@/store/selector";
import {
    PresentationBuilder,
    PseudonymBases,
    BBSPlusPublicKeyG2 as PublicKey,
    randomFieldElement,
} from "@docknetwork/crypto-wasm-ts";
import Box from "@mui/material/Box";
import React from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import {
    commentCreated,
    creatingProof,
    genericError,
    sendingPost,
} from "../error/message";
import { BottomAddCommentBar } from "./BottomAddCommentBar";
import { PostPageTopbar } from "./PostPageTopbar";
import { openAuthModal } from "@/store/reducers/session";
import { HASH_IS_COMMENTING, POST } from "@/common/navigation";
import PullToRefresh from "pulltorefreshjs";
import { refreshCredentials } from "../AppLayout";

export function PostPageLayout() {
    const postPageWrapperId = "postPageWrapper";
    let { postSlugId } = useParams();
    const { hash } = useLocation();

    const { updatePost, updatePostHiddenStatus, posts } = usePostsAndMeta();
    const [loadedPost, setLoadedPost] = React.useState<
        ExtendedPostData | undefined | null
    >(undefined);
    const [isSendingComment, setIsSendingComment] =
        React.useState<boolean>(false);
    const [comment, setComment] = React.useState<string>("");
    const [comments, setComments] = React.useState<PostComment[]>([]);
    const [wasCommentSent, setWasCommentSent] = React.useState<boolean>(false);
    const [commentFocused, setCommentFocused] = React.useState<boolean>(
        hash === HASH_IS_COMMENTING
    );
    const navigate = useNavigate();

    React.useEffect(() => {
        if (commentFocused && hash !== HASH_IS_COMMENTING) {
            navigate(`${POST}/${postSlugId}${HASH_IS_COMMENTING}`, {
                replace: true,
            });
        } else if (!commentFocused && hash === HASH_IS_COMMENTING) {
            navigate(`${POST}/${postSlugId}`, {
                replace: true,
            });
        }
    }, [commentFocused]);

    const dispatch = useAppDispatch();
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const activeSessionUserId = useAppSelector(selectActiveSessionUserId);
    const activeSessionStatus = useAppSelector(selectActiveSessionStatus);
    const activeEmailCredential = useAppSelector(selectActiveEmailCredential);
    const activeUnboundSecretCredential = useAppSelector(
        selectActiveUnboundSecretCredential
    );

    function getPost(
        posts: PostsType,
        postSlugId: string
    ): ExtendedPostData | undefined {
        return posts.find((post) => post.metadata.slugId === postSlugId);
    }

    const isContextNotLoaded =
        loadedPost === null ||
        loadedPost === undefined ||
        activeEmailCredential === undefined ||
        activeUnboundSecretCredential === undefined;

    const shouldSendingBeDisabled =
        comment.length === 0 ||
        comment.length > MAX_LENGTH_COMMENT ||
        isContextNotLoaded;

    const fetchPostAndComments = async function() {
        if (postSlugId !== undefined) {
            const cachedPost = getPost(posts, postSlugId);
            if (cachedPost !== undefined) {
                setLoadedPost(cachedPost);
                const loadedComments = await fetchMoreComments({
                    postSlugId,
                });
                setComments(loadedComments);
            } else {
                await reloadPostAndComments(postSlugId);
            }
        } else {
            setLoadedPost(null);
        }
    };

    async function reloadPostAndComments(postSlugId: string) {
        const { post, comments } = await fetchPost(postSlugId);
        setLoadedPost(post);
        setComments(comments);
    }

    React.useEffect(() => {
        fetchPostAndComments();
    }, [postSlugId]);

    React.useEffect(() => {
        PullToRefresh.init({
            mainElement: `#${postPageWrapperId}`,
            async onRefresh() {
                await refreshCredentials({
                    activeSessionStatus,
                    activeSessionUserId,
                    activeSessionEmail,
                });
                if (postSlugId !== undefined) {
                    reloadPostAndComments(postSlugId);
                } else {
                    setLoadedPost(null);
                }
            },
        });
        return () => {
            PullToRefresh.destroyAll();
        };
    }, [
        setLoadedPost,
        activeSessionUserId,
        activeSessionEmail,
        activeSessionStatus,
    ]);

    const isLoggedIn =
        activeSessionEmail !== undefined && activeSessionEmail !== "";

    async function handleOnSendComment() {
        if (!isLoggedIn) {
            dispatch(openAuthModal());
            return;
        }
        if (shouldSendingBeDisabled) {
            return; // this is already given because of how the child component called this function, but it is for typescript to pick up
        }
        try {
            setIsSendingComment(true);
            dispatch(showInfo(creatingProof));
            await maybeInitWasm();
            // create Verifiable Presentation containing Attribute-Bound Pseudonym from global secret and email credential ID (== email address)
            const backendPublicKey = new PublicKey(
                PublicKey.fromHex(VITE_BACK_PUBLIC_KEY).bytes
            ); // no DID resolution for now
            const builder = new PresentationBuilder();
            builder.addCredential(
                activeUnboundSecretCredential,
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
            );
            //////// PSEUDONYMS /////
            const scope = stringToBytes(BASE_SCOPE);
            const attributeNames = new Map();
            const secretSubject = "credentialSubject.secret";
            const attributesSecretCredential =
                activeUnboundSecretCredential.schema.flatten()[0];
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
            const createCommentPayload: CreateCommentPayload = {
                postUid: loadedPost.metadata.uid,
                content: comment,
            };
            const createCommentContext =
                buildCreateCommentContextFromPayload(createCommentPayload);

            const context = await buildContext(
                JSON.stringify(createCommentContext)
            );
            builder.context = context;
            builder.nonce = randomFieldElement();
            builder.version = import.meta.env.VITE_PRESENTATION_VERSION;
            const presentation = builder.finalize();
            dispatch(showInfo(sendingPost));
            await createComment(presentation, createCommentPayload);
            setComment("");
            setWasCommentSent(true);
            dispatch(showSuccess(commentCreated));
        } catch (e) {
            console.warn("Error while creating comment", e);
            dispatch(showError(genericError));
        } finally {
            setIsSendingComment(false);
        }
    }

    return (
        <Box sx={{ height: "100%", backgroundColor: "#e6e9ec" }}>
            <PostPageTopbar />
            <Box id={postPageWrapperId}>
                <Outlet
                    context={{
                        post: loadedPost,
                        comments,
                        setComments,
                        postSlugId,
                        updatePost,
                        updatePostHiddenStatus,
                        wasCommentSent,
                        commentFocused,
                        setCommentFocused,
                    }}
                />
            </Box>
            <Box sx={{ backgroundColor: "#ffff" }}>
                {/* https://stackoverflow.com/a/48510444/11046178 */}
                <Box mt={1} sx={(theme) => theme.mixins.toolbar} />
            </Box>
            <BottomAddCommentBar
                setComment={setComment}
                isSendingComment={isSendingComment}
                onSendComment={handleOnSendComment}
                isContextNotLoaded={isContextNotLoaded}
                isLoggedIn={isLoggedIn}
                onLoggingIn={() => dispatch(openAuthModal())}
                wasCommentSent={wasCommentSent}
                setWasCommentSent={setWasCommentSent}
                focused={commentFocused}
                setFocused={setCommentFocused}
            />
        </Box>
    );
}
