import { VITE_BACK_PUBLIC_KEY } from "@/common/conf";
import {
    creatingProof,
    fieldRequired,
    genericError,
    pollCreated,
    sendingPost,
} from "@/components/error/message";
import { maybeInitWasm } from "@/crypto/vc/credential";
import { doLoadMore, doLoadRecent, type PostsType } from "@/feed";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { createPost } from "@/request/post";
import { stringToBytes } from "@/shared/common/arrbufs";
import {
    BASE_SCOPE,
    MAX_LENGTH_BODY,
    MAX_LENGTH_TITLE,
    buildContext,
    buildCreatePostContextFromPayload,
} from "@/shared/shared";
import type { Post } from "@/shared/types/zod";
import { closeMainLoading, openMainLoading } from "@/store/reducers/loading";
import { closePostModal } from "@/store/reducers/post";
import { showError, showInfo, showSuccess } from "@/store/reducers/snackbar";
import {
    selectActiveEmailCredential,
    selectActiveSessionEmail,
    selectActiveUnboundSecretCredential,
} from "@/store/selector";
import {
    PresentationBuilder,
    PseudonymBases,
    BBSPlusPublicKeyG2 as PublicKey,
    randomFieldElement,
} from "@docknetwork/crypto-wasm-ts";
import CloseIcon from "@mui/icons-material/Close";
import PollIcon from "@mui/icons-material/Poll";
import PollOutlinedIcon from "@mui/icons-material/PollOutlined";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import useTheme from "@mui/material/styles/useTheme";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";
import { PollCreateView } from "./PollCreateView";

interface PostDialogProps {
    posts: PostsType;
    setPosts: React.Dispatch<React.SetStateAction<PostsType>>;
    setLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
    setLoadingRecent: React.Dispatch<React.SetStateAction<boolean>>;
}

export function PostDialog({
    posts,
    setPosts,
    setLoadingMore,
    setLoadingRecent,
}: PostDialogProps) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
    const dispatch = useAppDispatch();
    const isModalOpen = useAppSelector((state) => state.post.isPostModalOpen);
    function onClose() {
        setHasModifiedOption1(false);
        setHasModifiedOption2(false);
        setHasModifiedTitle(false);
        dispatch(closePostModal());
    }
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const isAdmin = activeSessionEmail.endsWith("zkorum.com");
    const activeEmailCredential = useAppSelector(selectActiveEmailCredential);
    const activeUnboundSecretCredential = useAppSelector(
        selectActiveUnboundSecretCredential
    );

    const titleInputRef = React.useRef<HTMLInputElement>();
    const bodyInputRef = React.useRef<HTMLInputElement>();
    const option1InputRef = React.useRef<HTMLInputElement>();
    const option2InputRef = React.useRef<HTMLInputElement>();
    const option3InputRef = React.useRef<HTMLInputElement>();
    const option4InputRef = React.useRef<HTMLInputElement>();
    const option5InputRef = React.useRef<HTMLInputElement>();
    const option6InputRef = React.useRef<HTMLInputElement>();
    const [option3Shown, setOption3Shown] = React.useState<boolean>(false);
    const [option4Shown, setOption4Shown] = React.useState<boolean>(false);
    const [option5Shown, setOption5Shown] = React.useState<boolean>(false);
    const [option6Shown, setOption6Shown] = React.useState<boolean>(false);
    const [hasModifiedTitle, setHasModifiedTitle] =
        React.useState<boolean>(false);
    const [hasModifiedOption1, setHasModifiedOption1] =
        React.useState<boolean>(false);
    const [hasModifiedOption2, setHasModifiedOption2] =
        React.useState<boolean>(false);
    const [titleHelper, setTitleHelper] = React.useState<string | undefined>(
        undefined
    );
    const [isTitleValid, setIsTitleValid] = React.useState<boolean>(false);
    const [option1Helper, setOption1Helper] = React.useState<
        string | undefined
    >(undefined);
    const [isOption1Valid, setIsOption1Valid] = React.useState<boolean>(false);
    const [option2Helper, setOption2Helper] = React.useState<
        string | undefined
    >(undefined);
    const [isOption2Valid, setIsOption2Valid] = React.useState<boolean>(false);
    const [hasPoll, setHasPoll] = React.useState<boolean>(false);

    const loadRecent = React.useCallback(
        (minLastReactedAt: Date) => {
            return setTimeout(async () => {
                return await doLoadRecent(
                    isAdmin,
                    posts,
                    setPosts,
                    setLoadingRecent,
                    minLastReactedAt
                );
            }, 200);
        },
        [setPosts, setLoadingRecent]
    );

    const loadMore = React.useCallback(
        (lastIndex?: number) => {
            return setTimeout(async () => {
                return await doLoadMore(
                    isAdmin,
                    posts,
                    setPosts,
                    setLoadingMore,
                    lastIndex
                );
            }, 200);
        },
        [setPosts, setLoadingMore, posts]
    );

    function asyncLoadRecent() {
        let timeout: NodeJS.Timeout;
        if (posts.length === 0) {
            timeout = loadMore();
        } else {
            timeout = loadRecent(posts[0].metadata.lastReactedAt);
        }
        return () => {
            clearTimeout(timeout);
            if (posts.length === 0) {
                setLoadingMore(false);
            } else {
                setLoadingRecent(false);
            }
        };
    }

    // function studentDataFromCredential(
    //     subjectStudent?: any
    // ): StudentData | null {
    //     if (subjectStudent === undefined) {
    //         return null;
    //     }
    //     const studentCountries: TCountryCode[] = [];
    //     for (const [countryCode, isPresent] of Object.entries(
    //         subjectStudent.countries as Record<TCountryCode, boolean>
    //     )) {
    //         if (isPresent) {
    //             studentCountries.push(countryCode as TCountryCode);
    //         }
    //     }
    //     return {
    //         campus: essecCampusStrToEnum(subjectStudent.campus),
    //         program: essecProgramStrToEnum(subjectStudent.program),
    //         countries: studentCountries,
    //         admissionYear: subjectStudent.admissionYear,
    //     };
    // }

    // const [postAsStudentChecked, setPostAsStudentChecked] =
    //     React.useState<boolean>(false);
    // const [postAsCampusChecked, setPostAsCampusChecked] =
    //     React.useState<boolean>(false);
    // const [postAsProgramChecked, setPostAsProgramChecked] =
    //     React.useState<boolean>(false);
    // const [postAsAdmissionYearChecked, setPostAsAdmissionYearChecked] =
    //     React.useState<boolean>(false);
    // const [postAsFrench, setPostAsFrench] = React.useState<boolean>(false);
    // const [postAsInternational, setPostAsInternational] =
    //     React.useState<boolean>(false);

    async function onCreatePost() {
        setHasModifiedTitle(true);
        if (hasPoll) {
            setHasModifiedOption1(true);
            setHasModifiedOption2(true);
        }
        if (
            titleInputRef.current?.value === undefined ||
            titleInputRef.current?.value === ""
        ) {
            setIsTitleValid(false);
            setTitleHelper(fieldRequired);
            return;
        } else {
            setIsTitleValid(true);
            setTitleHelper(undefined);
        }
        if (
            hasPoll &&
            (option1InputRef.current?.value === undefined ||
                option1InputRef.current?.value === "")
        ) {
            setIsOption1Valid(false);
            setOption1Helper(fieldRequired);
            return;
        } else {
            setIsOption1Valid(true);
            setOption1Helper(undefined);
        }
        if (
            hasPoll &&
            (option2InputRef.current?.value === undefined ||
                option2InputRef.current?.value === "")
        ) {
            setIsOption2Valid(false);
            setOption2Helper(fieldRequired);
            return;
        } else {
            setIsOption2Valid(true);
            setOption2Helper(undefined);
        }
        if (
            activeEmailCredential === undefined ||
            activeUnboundSecretCredential === undefined
        ) {
            return; // for typescript...
        }
        try {
            dispatch(openMainLoading());
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
            ); // second credential added was email credential
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

            builder.markAttributesEqual(
                [0, "credentialSubject.uid"],
                [1, "credentialSubject.uid"]
            );

            let newPost: Post;
            if (titleInputRef.current?.value === undefined) {
                console.warn(
                    "[Should not happen] Title is missing, cannot post"
                );
                dispatch(showError(genericError));
                return;
            } else if (hasPoll) {
                if (
                    option1InputRef.current?.value === undefined ||
                    option2InputRef.current?.value === undefined
                ) {
                    console.warn(
                        "[Should not happen] option1 or option2 is null, cannot create poll"
                    );
                    dispatch(showError(genericError));
                    return;
                }
                newPost = {
                    data: {
                        title: titleInputRef.current?.value,
                        body:
                            bodyInputRef.current?.value?.length === 0
                                ? undefined
                                : bodyInputRef.current?.value,
                        poll: {
                            option1: option1InputRef.current?.value,
                            option2: option2InputRef.current?.value,
                            option3:
                                option3InputRef.current?.value === ""
                                    ? undefined
                                    : option3InputRef.current?.value,
                            option4:
                                option4InputRef.current?.value === ""
                                    ? undefined
                                    : option4InputRef.current?.value,
                            option5:
                                option5InputRef.current?.value === ""
                                    ? undefined
                                    : option5InputRef.current?.value,
                            option6:
                                option6InputRef.current?.value === ""
                                    ? undefined
                                    : option6InputRef.current?.value,
                        },
                    },
                };
            } else {
                newPost = {
                    data: {
                        title: titleInputRef.current?.value,
                        body:
                            bodyInputRef.current?.value?.length === 0
                                ? undefined
                                : bodyInputRef.current?.value,
                    },
                };
            }
            const newPostForContext =
                buildCreatePostContextFromPayload(newPost);
            const context = await buildContext(
                JSON.stringify(newPostForContext)
            );
            builder.context = context;
            builder.nonce = randomFieldElement();
            builder.version = import.meta.env.VITE_PRESENTATION_VERSION;
            const presentation = builder.finalize();
            dispatch(showInfo(sendingPost));
            await createPost(presentation, newPost);
            if (posts.length > 0) {
                // only act when feed is not empty! because loadMore will already fetch first data
                asyncLoadRecent(); // refresh feed to show newly created post
            }
            dispatch(showSuccess(pollCreated));
        } catch (e) {
            console.warn("Error while creating post", e);
            dispatch(showError(genericError));
        } finally {
            dispatch(closeMainLoading());
            onClose();
        }
    }

    return (
        <Dialog
            maxWidth={fullScreen ? undefined : "sm"}
            fullWidth={!fullScreen}
            fullScreen={fullScreen}
            open={isModalOpen}
            scroll={"paper"}
            disableRestoreFocus // https://stackoverflow.com/a/76533962/11046178
            onClose={onClose}
            sx={{
                "& .MuiDialogTitle-root": {
                    px: 1,
                    pt: 1,
                    pb: 2,
                },
            }}
        >
            <DialogTitle p="0">
                <Grid
                    container
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Grid>
                        <IconButton
                            aria-label="close"
                            onClick={onClose}
                            sx={{
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Grid>
                    <Grid alignSelf="flex-start">
                        <Grid
                            container
                            justifyContent="center"
                            alignItems="center"
                            spacing={2}
                        >
                            <Grid>
                                <Button
                                    startIcon={
                                        hasPoll ? (
                                            <PollIcon fontSize="medium" />
                                        ) : (
                                            <PollOutlinedIcon fontSize="medium" />
                                        )
                                    }
                                    size="medium"
                                    variant="text"
                                    onClick={() => setHasPoll(!hasPoll)}
                                >
                                    {hasPoll ? "Remove the poll" : "Add a poll"}
                                </Button>
                            </Grid>
                            <Grid>
                                <Button
                                    onClick={async () => {
                                        await onCreatePost();
                                    }}
                                    variant="contained"
                                >
                                    Post
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </DialogTitle>
            <DialogContent>
                <Grid
                    container
                    justifyContent="center"
                    alignItems="space-between"
                    direction="column"
                    spacing={2}
                    flexWrap={"wrap"}
                >
                    <Grid>
                        <TextField
                            variant="standard"
                            fullWidth
                            required
                            autoFocus
                            multiline
                            minRows={1} //  https://stackoverflow.com/a/72789474/11046178c
                            maxRows={4} //  https://stackoverflow.com/a/72789474/11046178c
                            id="title-poll"
                            label="Title"
                            placeholder="E.g., How often do you hang out with people from other cultures?"
                            inputProps={{
                                maxLength: MAX_LENGTH_TITLE,
                            }}
                            InputProps={{
                                sx: { fontWeight: "bold", fontSize: "large" },
                            }}
                            InputLabelProps={{
                                sx: { fontWeight: "bold", fontSize: "large" },
                            }}
                            inputRef={titleInputRef}
                            error={!isTitleValid && hasModifiedTitle}
                            onBlur={() => {
                                if (
                                    titleInputRef?.current?.value !==
                                        undefined &&
                                    titleInputRef?.current?.value !== ""
                                ) {
                                    setIsTitleValid(true);
                                    setTitleHelper(undefined);
                                } else {
                                    setIsTitleValid(false);
                                    setTitleHelper(fieldRequired);
                                }
                            }}
                            helperText={
                                hasModifiedTitle ? titleHelper : undefined
                            } // must always be set to keep same height (see link at variable definition)
                        />
                    </Grid>
                    <Grid height={"100%"}>
                        <TextField
                            variant="standard"
                            fullWidth
                            multiline
                            sx={{ overflow: "hidden" }}
                            minRows={1} //  https://stackoverflow.com/a/72789474/11046178c
                            maxRows={1500} // long size is necessary to avoid the apparition of an unwanted scroll in the textarea html component
                            id="body-poll"
                            label="Body"
                            placeholder={`Speak Boldly, Listen Kindly\n\nGround rules:\n\t1. Be civil and respectful\n\t2. Do not share any personally identifiable information (names, etc)`}
                            inputProps={{
                                maxLength: MAX_LENGTH_BODY,
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            inputRef={bodyInputRef}
                        />
                    </Grid>
                    {hasPoll ? (
                        <PollCreateView
                            option1InputRef={option1InputRef}
                            option2InputRef={option2InputRef}
                            option3InputRef={option3InputRef}
                            option4InputRef={option4InputRef}
                            option5InputRef={option5InputRef}
                            option6InputRef={option6InputRef}
                            option3Shown={option3Shown}
                            setOption3Shown={setOption3Shown}
                            option4Shown={option4Shown}
                            setOption4Shown={setOption4Shown}
                            option5Shown={option5Shown}
                            setOption5Shown={setOption5Shown}
                            option6Shown={option6Shown}
                            setOption6Shown={setOption6Shown}
                            hasModifiedOption1={hasModifiedOption1}
                            hasModifiedOption2={hasModifiedOption2}
                            option1Helper={option1Helper}
                            setOption1Helper={setOption1Helper}
                            isOption1Valid={isOption1Valid}
                            setIsOption1Valid={setIsOption1Valid}
                            option2Helper={option2Helper}
                            setOption2Helper={setOption2Helper}
                            isOption2Valid={isOption2Valid}
                            setIsOption2Valid={setIsOption2Valid}
                        />
                    ) : null}
                </Grid>
            </DialogContent>
        </Dialog>
    );
}
