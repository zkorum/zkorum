import type { ApiV1PollCreatePostRequestPoll } from "@/api";
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
import { createPoll } from "@/request/post";
import { stringToBytes } from "@/shared/common/arrbufs";
import {
    attributesFormRevealedFromPostAs,
    buildContext,
    scopeFromPostAs,
} from "@/shared/shared";
import { EssecCampus, EssecProgram } from "@/shared/types/university";
import { closeMainLoading, openMainLoading } from "@/store/reducers/loading";
import { closePostModal } from "@/store/reducers/post";
import { showError, showInfo, showSuccess } from "@/store/reducers/snackbar";
import {
    selectActiveEmailCredential,
    selectActiveFormCredential,
    selectActiveSessionEmail,
    selectActiveUnboundSecretCredential,
} from "@/store/selector";
import {
    PresentationBuilder,
    PseudonymBases,
    BBSPlusPublicKeyG2 as PublicKey,
    randomFieldElement,
} from "@docknetwork/crypto-wasm-ts";
import { faMask } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CloseIcon from "@mui/icons-material/Close";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import useTheme from "@mui/material/styles/useTheme";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";
import { PollCreateView } from "./PollCreateView";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

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
        setHasModifiedQuestion(false);
        dispatch(closePostModal());
    }
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
    const isAdmin = activeSessionEmail.endsWith("zkorum.com");
    const activeEmailCredential = useAppSelector(selectActiveEmailCredential);
    const activeFormCredential = useAppSelector(selectActiveFormCredential);
    const activeUnboundSecretCredential = useAppSelector(
        selectActiveUnboundSecretCredential
    );

    const [postAsStudentChecked, setPostAsStudentChecked] =
        React.useState<boolean>(false);
    const [postAsAlumChecked, setPostAsAlumChecked] =
        React.useState<boolean>(false);
    const [postAsFacultyChecked, setPostAsFacultyChecked] =
        React.useState<boolean>(false);
    const [postAsCampusChecked, setPostAsCampusChecked] =
        React.useState<boolean>(false);
    const [postAsProgramChecked, setPostAsProgramChecked] =
        React.useState<boolean>(false);
    const [postAsAdmissionYearChecked, setPostAsAdmissionYearChecked] =
        React.useState<boolean>(false);
    const [postAsFrench, setPostAsFrench] = React.useState<boolean>(false);
    const [postAsInternational, setPostAsInternational] =
        React.useState<boolean>(false);
    const [eligibilityCountries, setEligibilityCountries] = React.useState<
        [] | ["FR"] | ["INT"] | ["FR", "INT"]
    >([]);
    const [eligibilityAlum, setEligibilityAlum] =
        React.useState<boolean>(false);
    const [eligibilityStudent, setEligibilityStudent] =
        React.useState<boolean>(false);
    const [eligibilityFaculty, setEligibilityFaculty] =
        React.useState<boolean>(false);
    const [eligibilityCampus, setEligibilityCampus] = React.useState<
        EssecCampus[]
    >([]);
    const [eligibilityProgram, setEligibilityProgram] = React.useState<
        EssecProgram[]
    >([]);
    const [eligibilityAdmissionYear, setEligibilityAdmissionYear] =
        React.useState<number[]>([]);
    const questionInputRef = React.useRef<HTMLInputElement>();
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
    const [hasModifiedQuestion, setHasModifiedQuestion] =
        React.useState<boolean>(false);
    const [hasModifiedOption1, setHasModifiedOption1] =
        React.useState<boolean>(false);
    const [hasModifiedOption2, setHasModifiedOption2] =
        React.useState<boolean>(false);
    const [questionHelper, setQuestionHelper] = React.useState<
        string | undefined
    >(undefined);
    const [isQuestionValid, setIsQuestionValid] =
        React.useState<boolean>(false);
    const [option1Helper, setOption1Helper] = React.useState<
        string | undefined
    >(undefined);
    const [isOption1Valid, setIsOption1Valid] = React.useState<boolean>(false);
    const [option2Helper, setOption2Helper] = React.useState<
        string | undefined
    >(undefined);
    const [isOption2Valid, setIsOption2Valid] = React.useState<boolean>(false);

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

    React.useEffect(() => {
        if (
            postAsCampusChecked ||
            postAsProgramChecked ||
            postAsAdmissionYearChecked ||
            postAsFrench || // TODO: countries should not be here!
            postAsInternational
        ) {
            setPostAsStudentChecked(true);
        }
    }, [
        postAsCampusChecked,
        postAsProgramChecked,
        postAsAdmissionYearChecked,
        postAsFrench,
        postAsInternational,
    ]);

    React.useEffect(() => {
        if (!postAsStudentChecked) {
            setPostAsCampusChecked(false);
            setPostAsProgramChecked(false);
            setPostAsAdmissionYearChecked(false);
        }
    }, [postAsStudentChecked]);

    React.useEffect(() => {
        if (
            eligibilityCampus.length > 0 ||
            eligibilityProgram.length > 0 ||
            eligibilityAdmissionYear.length > 0
        ) {
            setEligibilityStudent(true);
        }
    }, [eligibilityCampus, eligibilityProgram, eligibilityAdmissionYear]);

    React.useEffect(() => {
        if (!eligibilityStudent) {
            setEligibilityCampus([]);
            setEligibilityProgram([]);
            setEligibilityAdmissionYear([]);
        }
    }, [eligibilityStudent]);

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

    async function onCreatePoll() {
        setHasModifiedQuestion(true);
        setHasModifiedOption1(true);
        setHasModifiedOption2(true);
        if (
            questionInputRef.current?.value === undefined ||
            questionInputRef.current?.value === ""
        ) {
            setIsQuestionValid(false);
            setQuestionHelper(fieldRequired);
            return;
        } else {
            setIsQuestionValid(true);
            setQuestionHelper(undefined);
        }
        if (
            option1InputRef.current?.value === undefined ||
            option1InputRef.current?.value === ""
        ) {
            setIsOption1Valid(false);
            setOption1Helper(fieldRequired);
            return;
        } else {
            setIsOption1Valid(true);
            setOption1Helper(undefined);
        }
        if (
            option2InputRef.current?.value === undefined ||
            option2InputRef.current?.value === ""
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
                new Set<string>([
                    "credentialSubject.domain",
                    "credentialSubject.type",
                ])
            ); // second credential added was email credential
            let formCredentialIsUsed = false;
            if (activeFormCredential !== undefined) {
                const attributesRevealed = attributesFormRevealedFromPostAs({
                    postAs: {
                        postAsStudent: postAsStudentChecked,
                        postAsAlum: postAsAlumChecked,
                        postAsFaculty: postAsFacultyChecked,
                        postAsCampus: postAsCampusChecked,
                        postAsProgram: postAsProgramChecked,
                        postAsAdmissionYear: postAsAdmissionYearChecked,
                        postAsCountries: postAsFrench || postAsInternational,
                    },
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
            }

            //////// PSEUDONYMS /////
            const scope = stringToBytes(
                scopeFromPostAs({
                    postAsStudent: postAsStudentChecked,
                    postAsAlum: postAsAlumChecked,
                    postAsFaculty: postAsFacultyChecked,
                    postAsCampus: postAsCampusChecked,
                    postAsProgram: postAsProgramChecked,
                    postAsAdmissionYear: postAsAdmissionYearChecked,
                    postAsCountries: postAsFrench || postAsInternational,
                })
            ); // the scope and thus the pseudonym will be different for each combination of attributes revealed. @see doc/anonymous_pseudonym.md
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

            if (
                questionInputRef.current?.value !== undefined &&
                option1InputRef.current?.value !== undefined &&
                option2InputRef.current?.value !== undefined
            ) {
                const noEligibility =
                    !eligibilityStudent &&
                    !eligibilityAlum &&
                    !eligibilityFaculty &&
                    eligibilityCountries.length === 0 &&
                    eligibilityCampus.length === 0 &&
                    eligibilityProgram.length === 0 &&
                    eligibilityAdmissionYear.length === 0;
                const newPoll: ApiV1PollCreatePostRequestPoll = {
                    data: {
                        question: questionInputRef.current?.value,
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
                    eligibility: noEligibility
                        ? undefined
                        : {
                              student:
                                  eligibilityStudent === false
                                      ? undefined
                                      : true,
                              alum:
                                  eligibilityAlum === false ? undefined : true,
                              faculty:
                                  eligibilityFaculty === false
                                      ? undefined
                                      : true,
                              countries:
                                  eligibilityCountries.length === 0
                                      ? undefined
                                      : eligibilityCountries,
                              campuses:
                                  eligibilityCampus.length === 0
                                      ? undefined
                                      : eligibilityCampus,
                              programs:
                                  eligibilityProgram.length === 0
                                      ? undefined
                                      : eligibilityProgram,
                              admissionYears:
                                  eligibilityAdmissionYear.length === 0
                                      ? undefined
                                      : eligibilityAdmissionYear,
                          },
                };
                const context = await buildContext(JSON.stringify(newPoll));
                builder.context = context;
                builder.nonce = randomFieldElement();
                builder.version = "0.1.0";
                const presentation = builder.finalize();
                dispatch(showInfo(sendingPost));
                await createPoll(presentation, newPoll);
                if (posts.length > 0) {
                    // only act when feed is not empty! because loadMore will already fetch first data
                    asyncLoadRecent(); // refresh feed to show newly created post
                }
                dispatch(showSuccess(pollCreated));
            } else {
                console.warn(
                    "[Should not happen] Poll form invalid while creating context, cannot create poll"
                );
                dispatch(showError(genericError));
                return;
            }
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
                    <Grid
                        container
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                        spacing={1}
                    >
                        <Grid>
                            <FontAwesomeIcon
                                color="rgba(0, 0, 0, 0.6)"
                                size="lg"
                                icon={faMask}
                            />
                        </Grid>
                    </Grid>
                    <Grid justifySelf="flex-start">
                        <Typography variant="h6">
                            Create an anonymous poll
                        </Typography>
                    </Grid>
                    <Grid alignSelf="flex-start">
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
                </Grid>
            </DialogTitle>
            <DialogContent>
                <Container>
                    <Grid
                        container
                        justifyContent="center"
                        alignItems="flex-start"
                        direction="column"
                        spacing={2}
                        flexWrap={"wrap"}
                    >
                        <PollCreateView
                            activeFormCredential={activeFormCredential}
                            postAsStudentChecked={postAsStudentChecked}
                            setPostAsStudentChecked={setPostAsStudentChecked}
                            postAsAlumChecked={postAsAlumChecked}
                            setPostAsAlumChecked={setPostAsAlumChecked}
                            postAsFacultyChecked={postAsFacultyChecked}
                            setPostAsFacultyChecked={setPostAsFacultyChecked}
                            postAsCampusChecked={postAsCampusChecked}
                            setPostAsCampusChecked={setPostAsCampusChecked}
                            postAsProgramChecked={postAsProgramChecked}
                            setPostAsProgramChecked={setPostAsProgramChecked}
                            postAsAdmissionYearChecked={
                                postAsAdmissionYearChecked
                            }
                            setPostAsAdmissionYearChecked={
                                setPostAsAdmissionYearChecked
                            }
                            postAsFrench={postAsFrench}
                            setPostAsFrench={setPostAsFrench}
                            postAsInternational={postAsInternational}
                            setPostAsInternational={setPostAsInternational}
                            eligibilityCountries={eligibilityCountries}
                            setEligibilityCountries={setEligibilityCountries}
                            eligibilityAlum={eligibilityAlum}
                            setEligibilityAlum={setEligibilityAlum}
                            eligibilityStudent={eligibilityStudent}
                            setEligibilityStudent={setEligibilityStudent}
                            eligibilityFaculty={eligibilityFaculty}
                            setEligibilityFaculty={setEligibilityFaculty}
                            eligibilityCampus={eligibilityCampus}
                            setEligibilityCampus={setEligibilityCampus}
                            eligibilityProgram={eligibilityProgram}
                            setEligibilityProgram={setEligibilityProgram}
                            eligibilityAdmissionYear={eligibilityAdmissionYear}
                            setEligibilityAdmissionYear={
                                setEligibilityAdmissionYear
                            }
                            questionInputRef={questionInputRef}
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
                            hasModifiedQuestion={hasModifiedQuestion}
                            setHasModifiedQuestion={setHasModifiedQuestion}
                            hasModifiedOption1={hasModifiedOption1}
                            setHasModifiedOption1={setHasModifiedOption1}
                            hasModifiedOption2={hasModifiedOption2}
                            setHasModifiedOption2={setHasModifiedOption2}
                            questionHelper={questionHelper}
                            setQuestionHelper={setQuestionHelper}
                            isQuestionValid={isQuestionValid}
                            setIsQuestionValid={setIsQuestionValid}
                            option1Helper={option1Helper}
                            setOption1Helper={setOption1Helper}
                            isOption1Valid={isOption1Valid}
                            setIsOption1Valid={setIsOption1Valid}
                            option2Helper={option2Helper}
                            setOption2Helper={setOption2Helper}
                            isOption2Valid={isOption2Valid}
                            setIsOption2Valid={setIsOption2Valid}
                        />
                        <Grid my={1} alignSelf="flex-end">
                            <Button
                                onClick={async () => await onCreatePoll()}
                                variant="contained"
                                startIcon={<Box>📊</Box>}
                            >
                                Create poll
                            </Button>
                        </Grid>
                    </Grid>
                </Container>
            </DialogContent>
        </Dialog>
    );
}
