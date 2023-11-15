import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMask } from "@fortawesome/free-solid-svg-icons";
import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import useTheme from "@mui/material/styles/useTheme";
import useMediaQuery from "@mui/material/useMediaQuery";
import { closePostModal } from "@/store/reducers/post";
import { useAppDispatch, useAppSelector } from "@/hooks";
import React from "react";
import {
    selectActiveEmailCredential,
    selectActiveFormCredential,
    selectActiveUnboundSecretCredential,
} from "@/store/selector";
import type { TCountryCode } from "countries-list";
import Container from "@mui/material/Container";
import FormGroup from "@mui/material/FormGroup";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import {
    EssecCampus,
    EssecProgram,
    currentStudentsAdmissionYears,
    essecCampusStrToEnum,
    essecCampusToString,
    essecProgramStrToEnum,
    essecProgramToString,
} from "@/shared/types/university";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    creatingProof,
    fieldRequired,
    genericError,
    pollCreated,
    sendingPost,
} from "@/components/error/message";
import {
    PresentationBuilder,
    PseudonymBases,
    BBSPlusPublicKeyG2 as PublicKey,
    randomFieldElement,
    BBSPlusCredential as Credential,
} from "@docknetwork/crypto-wasm-ts";
import { stringToBytes } from "@/shared/common/arrbufs";
import { showError, showInfo, showSuccess } from "@/store/reducers/snackbar";
import { toEncodedCID } from "@/shared/common/cid";
import { MAX_LENGTH_OPTION, MAX_LENGTH_QUESTION } from "@/shared/shared";
import { maybeInitWasm } from "@/crypto/vc/credential";
import { createPoll } from "@/request/credential";
import type { PollCreatePostRequestPoll } from "@/api";
import { scopeWith } from "@/shared/common/util";
import { closeMainLoading, openMainLoading } from "@/store/reducers/loading";

export function PostDialog() {
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
    const activeEmailCredential = useAppSelector(selectActiveEmailCredential);
    const activeFormCredential = useAppSelector(selectActiveFormCredential);
    const activeUnboundSecretCredential = useAppSelector(
        selectActiveUnboundSecretCredential
    );

    const [postAsStudentChecked, setPostAsStudentChecked] =
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
    const frenchOrInternational = ["FR", "INT"];
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

    React.useEffect(() => {
        console.log(
            "credentials",
            activeEmailCredential,
            activeUnboundSecretCredential
        );
    }, []);

    React.useEffect(() => {
        if (
            postAsCampusChecked ||
            postAsProgramChecked ||
            postAsAdmissionYearChecked
        ) {
            setPostAsStudentChecked(true);
        }
    }, [postAsCampusChecked, postAsProgramChecked, postAsAdmissionYearChecked]);

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

    function eligibilityCountryToStr(value: "FR" | "INT"): string {
        switch (value) {
            case "FR":
                return "France";
            case "INT":
                return "International";
        }
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

    function getPostAsStudent(studentAttributes: any) {
        return (
            <>
                <FormControlLabel
                    checked={postAsStudentChecked}
                    control={
                        <Checkbox
                            value={postAsStudentChecked}
                            onChange={() =>
                                setPostAsStudentChecked(!postAsStudentChecked)
                            }
                        />
                    }
                    label="a student..."
                />
                <FormControlLabel
                    sx={{ ml: 1 }}
                    checked={postAsCampusChecked}
                    control={
                        <Checkbox
                            value={postAsCampusChecked}
                            onChange={() =>
                                setPostAsCampusChecked(!postAsCampusChecked)
                            }
                        />
                    }
                    label={`of ${studentAttributes.campus} campus`}
                />
                <FormControlLabel
                    sx={{ ml: 1 }}
                    checked={postAsProgramChecked}
                    control={
                        <Checkbox
                            value={postAsProgramChecked}
                            onChange={() =>
                                setPostAsProgramChecked(!postAsProgramChecked)
                            }
                        />
                    }
                    label={`from the ${studentAttributes.program} program`}
                />
                <FormControlLabel
                    sx={{ ml: 1 }}
                    checked={postAsAdmissionYearChecked}
                    control={
                        <Checkbox
                            value={postAsAdmissionYearChecked}
                            onChange={() =>
                                setPostAsAdmissionYearChecked(
                                    !postAsAdmissionYearChecked
                                )
                            }
                        />
                    }
                    label={`admitted in ${studentAttributes.admissionYear}`}
                />
            </>
        );
    }

    function getPostAsCountries(countries: Record<TCountryCode, boolean>) {
        const presentCountries = Object.entries(countries)
            .filter(([_countryCode, isPresent]) => isPresent)
            .map(([countryCode, _isPresent]) => countryCode);
        return (
            <>
                {"FR" in presentCountries ? (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={postAsFrench}
                                value={postAsFrench}
                                onChange={() => setPostAsFrench(!postAsFrench)}
                            />
                        }
                        label="from France"
                    />
                ) : null}
                {presentCountries.length >= 2 ||
                (presentCountries.length <= 1 &&
                    !presentCountries.includes("FR")) ? (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={postAsInternational}
                                value={postAsInternational}
                                onChange={() =>
                                    setPostAsInternational(!postAsInternational)
                                }
                            />
                        }
                        label="from a country other than France"
                    />
                ) : null}
            </>
        );
    }

    function getPostAsAlum(_alumAttributes: any) {
        return (
            <>
                <FormControlLabel
                    control={<Checkbox />}
                    disabled
                    checked
                    label="an anonymous ESSEC member"
                    required
                />
                <FormControlLabel
                    required
                    control={<Checkbox />}
                    label="an alum"
                />
            </>
        );
    }

    function getPostAsFaculty(_facultyAttributes: any) {
        return (
            <>
                <FormControlLabel
                    control={<Checkbox />}
                    disabled
                    checked
                    label="an anonymous  ESSEC member"
                    required
                />
                <FormControlLabel
                    required
                    control={<Checkbox />}
                    label="a faculty/staff member"
                />
            </>
        );
    }

    function deleteItem(item: number) {
        if (item === 3) {
            setOption3Shown(false);
            if (option3InputRef.current?.value !== undefined) {
                option3InputRef.current.value = "";
            }
        } else if (item === 4) {
            setOption4Shown(false);
            if (option4InputRef.current?.value !== undefined) {
                option4InputRef.current.value = "";
            }
        } else if (item === 5) {
            setOption5Shown(false);
            if (option5InputRef.current?.value !== undefined) {
                option5InputRef.current.value = "";
            }
        } else if (item === 6) {
            setOption6Shown(false);
            if (option6InputRef.current?.value !== undefined) {
                option6InputRef.current.value = "";
            }
        } else {
            console.warn("Unexpected attempt to delete item");
        }
    }

    interface PostAsProps {
        postAsStudent: boolean;
        postAsCampus: boolean;
        postAsProgram: boolean;
        postAsAdmissionYear: boolean;
        postAsCountries: boolean;
    }

    interface AttributesFormRevealedFromPostAsProps {
        postAs: PostAsProps;
        credential: Credential;
    }

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

    function scopeFromPostAs({
        postAsStudent,
        postAsCampus,
        postAsProgram,
        postAsAdmissionYear,
        postAsCountries,
    }: PostAsProps): string {
        let scope = "base";
        if (postAsStudent) {
            scope = scopeWith(scope, "student");
        }
        if (postAsCampus) {
            scope = scopeWith(scope, "campus");
        }
        if (postAsProgram) {
            scope = scopeWith(scope, "program");
        }
        if (postAsAdmissionYear) {
            scope = scopeWith(scope, "admissionYear");
        }
        if (postAsCountries) {
            scope = scopeWith(scope, "countries");
        }
        return scope;
    }

    interface AddIfExistsProps {
        credential: Credential;
        attribute: string;
        set: Set<string>;
    }

    function addIfExists({ credential, attribute, set }: AddIfExistsProps) {
        const flattenedSchemaAttributes = credential.schema.flatten()[0];
        if (flattenedSchemaAttributes.includes(attribute)) {
            set.add(attribute);
        } else {
            console.warn(
                `Cannot reveal attribute '${attribute}' that is not in schema`,
                flattenedSchemaAttributes
            );
        }
    }

    function attributesFormRevealedFromPostAs({
        postAs,
        credential,
    }: AttributesFormRevealedFromPostAsProps): Set<string> {
        const {
            postAsStudent,
            postAsCampus,
            postAsProgram,
            postAsAdmissionYear,
            postAsCountries,
        } = postAs;
        const attributesRevealed = new Set<string>();
        if (postAsStudent) {
            addIfExists({
                attribute: "credentialSubject.typeSpecific.type",
                credential: credential,
                set: attributesRevealed,
            });
        }
        if (postAsCampus) {
            addIfExists({
                attribute: "credentialSubject.typeSpecific.campus",
                credential: credential,
                set: attributesRevealed,
            });
        }
        if (postAsProgram) {
            addIfExists({
                attribute: "credentialSubject.typeSpecific.program",
                credential: credential,
                set: attributesRevealed,
            });
        }
        if (postAsAdmissionYear) {
            addIfExists({
                attribute: "credentialSubject.typeSpecific.admissionYear",
                credential: credential,
                set: attributesRevealed,
            });
        }
        if (postAsCountries) {
            addIfExists({
                attribute: "credentialSubject.typeSpecific.countries",
                credential: credential,
                set: attributesRevealed,
            });
        }
        return attributesRevealed;
    }

    async function buildContext(content: string): Promise<string> {
        return await toEncodedCID(content);
    }

    async function onCreate() {
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
                PublicKey.fromHex(import.meta.env.VITE_BACK_PUBLIC_KEY).bytes
            ); // no DID resolution for now
            const builder = new PresentationBuilder();
            builder.addCredential(
                activeUnboundSecretCredential,
                backendPublicKey
            );
            builder.addCredential(activeEmailCredential, backendPublicKey); // for externally issued credential, the pub key here will not be ZKorum's but the community authority's (e.g,: ESSEC's)
            if (activeFormCredential !== undefined) {
            }
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
            if (activeFormCredential !== undefined) {
                builder.addCredential(activeFormCredential, backendPublicKey);
                const attributesRevealed = attributesFormRevealedFromPostAs({
                    postAs: {
                        postAsStudent: postAsStudentChecked,
                        postAsCampus: postAsCampusChecked,
                        postAsProgram: postAsProgramChecked,
                        postAsAdmissionYear: postAsAdmissionYearChecked,
                        postAsCountries: postAsFrench || postAsInternational,
                    },
                    credential: activeEmailCredential,
                });
                builder.markAttributesRevealed(2, attributesRevealed); // third credential added was form credential
            }

            //////// PSEUDONYMS /////
            const scope = stringToBytes(
                scopeFromPostAs({
                    postAsStudent: postAsStudentChecked,
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
            if (activeFormCredential !== undefined) {
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
                const newPoll: PollCreatePostRequestPoll = {
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

    function getOtherPostAs(
        activeFormCredential: Credential | undefined
    ): JSX.Element | null {
        if (activeFormCredential === undefined) {
            return null;
        }
        let postAsCountries: null | JSX.Element = null;
        let postAsStudent: null | JSX.Element = null;
        let postAsAlum: null | JSX.Element = null;
        let postAsFaculty: null | JSX.Element = null;

        if (
            (activeFormCredential?.subject as any)?.typeSpecific.countries !==
            undefined
        ) {
            postAsCountries = getPostAsCountries(
                (activeFormCredential?.subject as any)?.typeSpecific.countries
            );
        }
        if (
            (activeFormCredential?.subject as any)?.typeSpecific?.type !==
            undefined
        ) {
            const typeSpecific = (activeFormCredential?.subject as any)
                ?.typeSpecific;
            const univType = typeSpecific.type as string;
            switch (univType) {
                case "Student":
                    postAsStudent = getPostAsStudent(typeSpecific);
                    break;
                case "Alum":
                    postAsAlum = getPostAsAlum(typeSpecific);
                    break;
                case "Faculty/Staff member":
                    postAsFaculty = getPostAsFaculty(typeSpecific);
                    break;
            }
        }
        return (
            <>
                <>{postAsCountries}</>
                <>{postAsStudent}</>
                <>{postAsAlum}</>
                <>{postAsFaculty}</>
            </>
        );
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
                        <Grid mt={"1em"} width={"100%"}>
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1a-content"
                                    id="panel1a-header"
                                >
                                    <Typography>Post as... 🎭</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <FormGroup>
                                        <FormControlLabel
                                            control={<Checkbox />}
                                            disabled
                                            checked
                                            label="an anonymous ESSEC member"
                                            required
                                        />
                                        {getOtherPostAs(activeFormCredential)}
                                    </FormGroup>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                        <Grid width={"100%"}>
                            <Accordion defaultExpanded={true}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1a-content"
                                    id="panel1a-header"
                                >
                                    <Typography>
                                        Respondents eligibility... 🕵
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid
                                        container
                                        direction="column"
                                        justifyContent="center"
                                        alignItems="flex-start"
                                    >
                                        <Grid>
                                            <FormControlLabel
                                                control={<Checkbox />}
                                                disabled
                                                checked
                                                label="an anonymous ESSEC member"
                                                required
                                            />
                                        </Grid>
                                        <Grid width="100%">
                                            <FormControl
                                                fullWidth
                                                variant="standard"
                                                sx={{ m: 1 }}
                                            >
                                                <InputLabel id="eligibility-countries-input-label">
                                                    From...
                                                </InputLabel>
                                                <Select
                                                    labelId="eligibility-countries-input-label"
                                                    label="From..."
                                                    multiple
                                                    value={eligibilityCountries}
                                                    onChange={(
                                                        event: SelectChangeEvent<
                                                            typeof eligibilityCountries
                                                        >
                                                    ) => {
                                                        const {
                                                            target: { value },
                                                        } = event;
                                                        setEligibilityCountries(
                                                            typeof value ===
                                                                "string"
                                                                ? (value.split(
                                                                      ","
                                                                  ) as typeof eligibilityCountries)
                                                                : value
                                                        );
                                                    }}
                                                    renderValue={(selected) => (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                flexWrap:
                                                                    "wrap",
                                                                gap: 0.5,
                                                            }}
                                                        >
                                                            {selected.map(
                                                                (value) => (
                                                                    <Chip
                                                                        key={
                                                                            value
                                                                        }
                                                                        label={eligibilityCountryToStr(
                                                                            value
                                                                        )}
                                                                    />
                                                                )
                                                            )}
                                                        </Box>
                                                    )}
                                                >
                                                    {frenchOrInternational.map(
                                                        (name) => (
                                                            <MenuItem
                                                                key={name}
                                                                value={name}
                                                            >
                                                                <Checkbox
                                                                    checked={(
                                                                        eligibilityCountries as Array<string>
                                                                    ).includes(
                                                                        name
                                                                    )}
                                                                />
                                                                <ListItemText
                                                                    primary={eligibilityCountryToStr(
                                                                        name as any
                                                                    )}
                                                                />
                                                            </MenuItem>
                                                        )
                                                    )}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid width="100%">
                                            <FormGroup>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={
                                                                eligibilityAlum
                                                            }
                                                            value={
                                                                eligibilityAlum
                                                            }
                                                            onChange={() =>
                                                                setEligibilityAlum(
                                                                    !eligibilityAlum
                                                                )
                                                            }
                                                        />
                                                    }
                                                    label="an alum"
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={
                                                                eligibilityFaculty
                                                            }
                                                            value={
                                                                eligibilityFaculty
                                                            }
                                                            onChange={() =>
                                                                setEligibilityFaculty(
                                                                    !eligibilityFaculty
                                                                )
                                                            }
                                                        />
                                                    }
                                                    label="a faculty/staff member"
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={
                                                                eligibilityStudent
                                                            }
                                                            value={
                                                                eligibilityStudent
                                                            }
                                                            onChange={() =>
                                                                setEligibilityStudent(
                                                                    !eligibilityStudent
                                                                )
                                                            }
                                                        />
                                                    }
                                                    label="a student"
                                                />
                                            </FormGroup>
                                        </Grid>
                                        <Grid
                                            width="100%"
                                            sx={{
                                                my: 0.5,
                                                mx: 2,
                                                display: eligibilityStudent
                                                    ? "inherit"
                                                    : "none",
                                            }}
                                        >
                                            <FormControl
                                                fullWidth
                                                variant="standard"
                                            >
                                                <InputLabel id="eligibility-campus-input-label">
                                                    At campus...
                                                </InputLabel>
                                                <Select
                                                    labelId="eligibility-campus-input-label"
                                                    label="At campus..."
                                                    multiple
                                                    value={eligibilityCampus}
                                                    onChange={(
                                                        event: SelectChangeEvent<
                                                            typeof eligibilityCampus
                                                        >
                                                    ) => {
                                                        const {
                                                            target: { value },
                                                        } = event;
                                                        setEligibilityCampus(
                                                            typeof value ===
                                                                "string"
                                                                ? (value
                                                                      .split(
                                                                          ","
                                                                      )
                                                                      .map(
                                                                          (v) =>
                                                                              essecCampusStrToEnum(
                                                                                  v
                                                                              )
                                                                      ) as typeof eligibilityCampus)
                                                                : value
                                                        );
                                                    }}
                                                    renderValue={(selected) => (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                flexWrap:
                                                                    "wrap",
                                                                gap: 0.5,
                                                            }}
                                                        >
                                                            {selected.map(
                                                                (value) => (
                                                                    <Chip
                                                                        key={
                                                                            value
                                                                        }
                                                                        label={essecCampusToString(
                                                                            value
                                                                        )}
                                                                    />
                                                                )
                                                            )}
                                                        </Box>
                                                    )}
                                                >
                                                    {Object.keys(EssecCampus)
                                                        .filter(
                                                            (key) =>
                                                                !isNaN(
                                                                    parseInt(
                                                                        key
                                                                    )
                                                                )
                                                        )
                                                        .map((campusKey) => (
                                                            <MenuItem
                                                                key={`menu-campus-${campusKey}`}
                                                                value={parseInt(
                                                                    campusKey
                                                                )}
                                                            >
                                                                <Checkbox
                                                                    checked={eligibilityCampus.includes(
                                                                        parseInt(
                                                                            campusKey
                                                                        )
                                                                    )}
                                                                />
                                                                <ListItemText
                                                                    primary={essecCampusToString(
                                                                        parseInt(
                                                                            campusKey
                                                                        )
                                                                    )}
                                                                />
                                                            </MenuItem>
                                                        ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid
                                            width="100%"
                                            sx={{
                                                my: 0.5,
                                                mx: 2,
                                                display: eligibilityStudent
                                                    ? "inherit"
                                                    : "none",
                                            }}
                                        >
                                            <FormControl
                                                fullWidth
                                                variant="standard"
                                            >
                                                <InputLabel id="eligibility-program-input-label">
                                                    In program...
                                                </InputLabel>
                                                <Select
                                                    labelId="eligibility-program-input-label"
                                                    label="In program..."
                                                    multiple
                                                    value={eligibilityProgram}
                                                    onChange={(
                                                        event: SelectChangeEvent<
                                                            typeof eligibilityProgram
                                                        >
                                                    ) => {
                                                        const {
                                                            target: { value },
                                                        } = event;
                                                        setEligibilityProgram(
                                                            typeof value ===
                                                                "string"
                                                                ? (value
                                                                      .split(
                                                                          ","
                                                                      )
                                                                      .map(
                                                                          (v) =>
                                                                              essecProgramStrToEnum(
                                                                                  v
                                                                              )
                                                                      ) as typeof eligibilityProgram)
                                                                : value
                                                        );
                                                    }}
                                                    renderValue={(selected) => (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                flexWrap:
                                                                    "wrap",
                                                                gap: 0.5,
                                                            }}
                                                        >
                                                            {selected.map(
                                                                (value) => (
                                                                    <Chip
                                                                        key={
                                                                            value
                                                                        }
                                                                        label={essecProgramToString(
                                                                            value
                                                                        )}
                                                                    />
                                                                )
                                                            )}
                                                        </Box>
                                                    )}
                                                >
                                                    {Object.keys(EssecProgram)
                                                        .filter(
                                                            (key) =>
                                                                !isNaN(
                                                                    parseInt(
                                                                        key
                                                                    )
                                                                )
                                                        )
                                                        .map((programKey) => (
                                                            <MenuItem
                                                                key={`menu-program-${programKey}`}
                                                                value={parseInt(
                                                                    programKey
                                                                )}
                                                            >
                                                                <Checkbox
                                                                    checked={eligibilityProgram.includes(
                                                                        parseInt(
                                                                            programKey
                                                                        )
                                                                    )}
                                                                />
                                                                <ListItemText
                                                                    primary={essecProgramToString(
                                                                        parseInt(
                                                                            programKey
                                                                        )
                                                                    )}
                                                                />
                                                            </MenuItem>
                                                        ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid
                                            width="100%"
                                            sx={{
                                                my: 0.5,
                                                mx: 2,
                                                display: eligibilityStudent
                                                    ? "inherit"
                                                    : "none",
                                            }}
                                        >
                                            <FormControl
                                                fullWidth
                                                variant="standard"
                                            >
                                                <InputLabel id="eligibility-admission-year-input-label">
                                                    Admitted in...
                                                </InputLabel>
                                                <Select
                                                    labelId="eligibility-admission-year-input-label"
                                                    label="Admitted in..."
                                                    multiple
                                                    value={
                                                        eligibilityAdmissionYear
                                                    }
                                                    onChange={(
                                                        event: SelectChangeEvent<
                                                            typeof eligibilityAdmissionYear
                                                        >
                                                    ) => {
                                                        const {
                                                            target: { value },
                                                        } = event;
                                                        setEligibilityAdmissionYear(
                                                            typeof value ===
                                                                "string"
                                                                ? value
                                                                      .split(
                                                                          ","
                                                                      )
                                                                      .map(
                                                                          (v) =>
                                                                              parseInt(
                                                                                  v
                                                                              )
                                                                      )
                                                                : value
                                                        );
                                                    }}
                                                    renderValue={(selected) => (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                flexWrap:
                                                                    "wrap",
                                                                gap: 0.5,
                                                            }}
                                                        >
                                                            {selected.map(
                                                                (value) => (
                                                                    <Chip
                                                                        key={
                                                                            value
                                                                        }
                                                                        label={
                                                                            value
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                        </Box>
                                                    )}
                                                >
                                                    {currentStudentsAdmissionYears.map(
                                                        (admissionYear) => (
                                                            <MenuItem
                                                                key={`menu-admission-year-${admissionYear}`}
                                                                value={
                                                                    admissionYear
                                                                }
                                                            >
                                                                <Checkbox
                                                                    checked={eligibilityAdmissionYear.includes(
                                                                        admissionYear
                                                                    )}
                                                                />
                                                                <ListItemText
                                                                    primary={
                                                                        admissionYear
                                                                    }
                                                                />
                                                            </MenuItem>
                                                        )
                                                    )}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                        <Grid width="100%">
                            <Accordion expanded={true}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1a-content"
                                    id="panel1a-header"
                                >
                                    <Typography>Your poll... 📊</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid
                                        container
                                        direction="column"
                                        justifyContent="center"
                                        alignItems="flex-start"
                                    >
                                        <Grid width="100%">
                                            <TextField
                                                variant="standard"
                                                fullWidth
                                                required
                                                multiline
                                                id="question-poll"
                                                label="Your question...❓"
                                                placeholder="E.g., How often do you hang out with people from other cultures?"
                                                inputProps={{
                                                    maxLength:
                                                        MAX_LENGTH_QUESTION,
                                                }}
                                                inputRef={questionInputRef}
                                                error={
                                                    !isQuestionValid &&
                                                    hasModifiedQuestion
                                                }
                                                onBlur={() => {
                                                    if (
                                                        questionInputRef
                                                            ?.current?.value !==
                                                            undefined &&
                                                        questionInputRef
                                                            ?.current?.value !==
                                                            ""
                                                    ) {
                                                        setIsQuestionValid(
                                                            true
                                                        );
                                                        setQuestionHelper(
                                                            undefined
                                                        );
                                                    } else {
                                                        setIsQuestionValid(
                                                            false
                                                        );
                                                        setQuestionHelper(
                                                            fieldRequired
                                                        );
                                                    }
                                                    setHasModifiedQuestion(
                                                        true
                                                    );
                                                }}
                                                helperText={
                                                    hasModifiedQuestion
                                                        ? questionHelper
                                                        : undefined
                                                } // must always be set to keep same height (see link at variable definition)
                                            />
                                        </Grid>
                                        <Grid width="100%" ml={1} mt={2}>
                                            <TextField
                                                variant="standard"
                                                fullWidth
                                                multiline
                                                required
                                                id={`option-1-poll`}
                                                label={`Option 1`}
                                                placeholder="E.g., Often"
                                                inputProps={{
                                                    maxLength:
                                                        MAX_LENGTH_OPTION,
                                                }}
                                                inputRef={option1InputRef}
                                                error={
                                                    !isOption1Valid &&
                                                    hasModifiedOption1
                                                }
                                                onBlur={() => {
                                                    if (
                                                        option1InputRef?.current
                                                            ?.value !==
                                                            undefined &&
                                                        option1InputRef?.current
                                                            ?.value !== ""
                                                    ) {
                                                        setIsOption1Valid(true);
                                                        setOption1Helper(
                                                            undefined
                                                        );
                                                    } else {
                                                        setIsOption1Valid(
                                                            false
                                                        );
                                                        setOption1Helper(
                                                            fieldRequired
                                                        );
                                                    }
                                                    setHasModifiedOption1(true);
                                                }}
                                                helperText={
                                                    hasModifiedOption1
                                                        ? option1Helper
                                                        : undefined
                                                } // must always be set to keep same height (see link at variable definition)
                                            />
                                        </Grid>
                                        <Grid width="100%" ml={1} mt={1}>
                                            <TextField
                                                variant="standard"
                                                fullWidth
                                                multiline
                                                required
                                                id={`option-2-poll`}
                                                label={`Option 2`}
                                                placeholder="E.g., Rarely"
                                                inputProps={{
                                                    maxLength:
                                                        MAX_LENGTH_OPTION,
                                                }}
                                                inputRef={option2InputRef}
                                                error={
                                                    !isOption2Valid &&
                                                    hasModifiedOption2
                                                }
                                                onBlur={() => {
                                                    if (
                                                        option2InputRef?.current
                                                            ?.value !==
                                                            undefined &&
                                                        option2InputRef?.current
                                                            ?.value !== ""
                                                    ) {
                                                        setIsOption2Valid(true);
                                                        setOption2Helper(
                                                            undefined
                                                        );
                                                    } else {
                                                        setIsOption2Valid(
                                                            false
                                                        );
                                                        setOption2Helper(
                                                            fieldRequired
                                                        );
                                                    }
                                                    setHasModifiedOption2(true);
                                                }}
                                                helperText={
                                                    hasModifiedOption2
                                                        ? option2Helper
                                                        : undefined
                                                } // must always be set to keep same height (see link at variable definition)
                                            />
                                        </Grid>
                                        <Grid
                                            container
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            width="100%"
                                            sx={{
                                                display: option3Shown
                                                    ? "inherit"
                                                    : "none",
                                            }}
                                            ml={1}
                                            mt={1}
                                        >
                                            <Grid flexGrow={1} mr={1}>
                                                <TextField
                                                    variant="standard"
                                                    fullWidth
                                                    multiline
                                                    id={`option-3-poll`}
                                                    label={`Option 3`}
                                                    placeholder="E.g., Sometimes"
                                                    inputProps={{
                                                        maxLength:
                                                            MAX_LENGTH_OPTION,
                                                    }}
                                                    inputRef={option3InputRef}
                                                />
                                            </Grid>
                                            <Grid>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        deleteItem(3)
                                                    }
                                                    aria-label="delete"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                        <Grid
                                            container
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            width="100%"
                                            sx={{
                                                display: option4Shown
                                                    ? "inherit"
                                                    : "none",
                                            }}
                                            ml={1}
                                            mt={1}
                                        >
                                            <Grid flexGrow={1} mr={1}>
                                                <TextField
                                                    variant="standard"
                                                    fullWidth
                                                    multiline
                                                    id={`option-4-poll`}
                                                    label={
                                                        option3Shown
                                                            ? `Option 4`
                                                            : `Option 3`
                                                    }
                                                    placeholder="E.g., Never"
                                                    inputProps={{
                                                        maxLength:
                                                            MAX_LENGTH_OPTION,
                                                    }}
                                                    inputRef={option4InputRef}
                                                />
                                            </Grid>
                                            <Grid>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        deleteItem(4)
                                                    }
                                                    aria-label="delete"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                        <Grid
                                            container
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            width="100%"
                                            sx={{
                                                display: option5Shown
                                                    ? "inherit"
                                                    : "none",
                                            }}
                                            ml={1}
                                            mt={1}
                                        >
                                            <Grid flexGrow={1} mr={1}>
                                                <TextField
                                                    variant="standard"
                                                    fullWidth
                                                    multiline
                                                    id={`option-5-poll`}
                                                    label={
                                                        option4Shown &&
                                                        option3Shown
                                                            ? `Option 5`
                                                            : option4Shown ||
                                                              option3Shown
                                                            ? `Option 4`
                                                            : `Option 3`
                                                    }
                                                    placeholder="E.g., All the time"
                                                    inputProps={{
                                                        maxLength:
                                                            MAX_LENGTH_OPTION,
                                                    }}
                                                    inputRef={option5InputRef}
                                                />
                                            </Grid>
                                            <Grid>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        deleteItem(5)
                                                    }
                                                    aria-label="delete"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                        <Grid
                                            container
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            width="100%"
                                            sx={{
                                                display: option6Shown
                                                    ? "inherit"
                                                    : "none",
                                            }}
                                            ml={1}
                                            mt={1}
                                        >
                                            <Grid flexGrow={1} mr={1}>
                                                <TextField
                                                    variant="standard"
                                                    fullWidth
                                                    multiline
                                                    id={`option-6-poll`}
                                                    label={
                                                        option5Shown &&
                                                        option4Shown &&
                                                        option3Shown
                                                            ? `Option 6`
                                                            : (option5Shown &&
                                                                  option3Shown) ||
                                                              (option5Shown &&
                                                                  option4Shown) ||
                                                              (option4Shown &&
                                                                  option3Shown)
                                                            ? `Option 5`
                                                            : option5Shown ||
                                                              option4Shown ||
                                                              option3Shown
                                                            ? `Option 4`
                                                            : `Option 3`
                                                    }
                                                    placeholder="E.g., Eating baozi"
                                                    inputProps={{
                                                        maxLength:
                                                            MAX_LENGTH_OPTION,
                                                    }}
                                                    inputRef={option6InputRef}
                                                />
                                            </Grid>
                                            <Grid>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        deleteItem(6)
                                                    }
                                                    aria-label="delete"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                        <Grid
                                            ml={1}
                                            mt={3}
                                            width="100%"
                                            sx={{
                                                display:
                                                    option3Shown &&
                                                    option4Shown &&
                                                    option5Shown &&
                                                    option6Shown
                                                        ? "none"
                                                        : "inherit",
                                            }}
                                        >
                                            <Button
                                                onClick={() => {
                                                    if (!option3Shown) {
                                                        setOption3Shown(true);
                                                        return;
                                                    }
                                                    if (!option4Shown) {
                                                        setOption4Shown(true);
                                                        return;
                                                    }
                                                    if (!option5Shown) {
                                                        setOption5Shown(true);
                                                        return;
                                                    }
                                                    if (!option6Shown) {
                                                        setOption6Shown(true);
                                                        return;
                                                    }
                                                }}
                                                component="label"
                                                variant="outlined"
                                                size={"small"}
                                                startIcon={
                                                    <AddCircleOutlineIcon />
                                                }
                                            >
                                                Add option
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                        <Grid my={1} alignSelf="flex-end">
                            <Button
                                onClick={async () => await onCreate()}
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
