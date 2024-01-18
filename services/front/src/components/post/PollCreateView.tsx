import { MAX_LENGTH_OPTION, MAX_LENGTH_QUESTION } from "@/shared/shared";
import {
    EssecCampus,
    EssecProgram,
    essecCampusStrToEnum,
    essecCampusToString,
    essecProgramStrToEnum,
    essecProgramToString,
} from "@/shared/types/university";
import {
    currentStudentsAdmissionYears,
    type UniversityType,
} from "@/shared/types/zod";
import { BBSPlusCredential as Credential } from "@docknetwork/crypto-wasm-ts";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { TCountryCode } from "countries-list";
import { fieldRequired } from "../error/message";

interface PollCreateViewProps {
    activeFormCredential: Credential | undefined;
    postAsStudentChecked: boolean;
    setPostAsStudentChecked: (value: boolean) => void;
    postAsAlumChecked: boolean;
    setPostAsAlumChecked: (value: boolean) => void;
    postAsFacultyChecked: boolean;
    setPostAsFacultyChecked: (value: boolean) => void;
    postAsCampusChecked: boolean;
    setPostAsCampusChecked: (value: boolean) => void;
    postAsProgramChecked: boolean;
    setPostAsProgramChecked: (value: boolean) => void;
    postAsAdmissionYearChecked: boolean;
    setPostAsAdmissionYearChecked: (value: boolean) => void;
    postAsFrench: boolean;
    setPostAsFrench: (value: boolean) => void;
    postAsInternational: boolean;
    setPostAsInternational: (value: boolean) => void;
    eligibilityCountries: [] | ["FR"] | ["INT"] | ["FR", "INT"];
    setEligibilityCountries: (
        value: [] | ["FR"] | ["INT"] | ["FR", "INT"]
    ) => void;
    eligibilityAlum: boolean;
    setEligibilityAlum: (value: boolean) => void;
    eligibilityStudent: boolean;
    setEligibilityStudent: (value: boolean) => void;
    eligibilityFaculty: boolean;
    setEligibilityFaculty: (value: boolean) => void;
    eligibilityCampus: EssecCampus[];
    setEligibilityCampus: (value: EssecCampus[]) => void;
    eligibilityProgram: EssecProgram[];
    setEligibilityProgram: (value: EssecProgram[]) => void;
    eligibilityAdmissionYear: number[];
    setEligibilityAdmissionYear: (value: number[]) => void;
    questionInputRef: React.MutableRefObject<HTMLInputElement | undefined>;
    option1InputRef: React.MutableRefObject<HTMLInputElement | undefined>;
    option2InputRef: React.MutableRefObject<HTMLInputElement | undefined>;
    option3InputRef: React.MutableRefObject<HTMLInputElement | undefined>;
    option4InputRef: React.MutableRefObject<HTMLInputElement | undefined>;
    option5InputRef: React.MutableRefObject<HTMLInputElement | undefined>;
    option6InputRef: React.MutableRefObject<HTMLInputElement | undefined>;
    option3Shown: boolean;
    setOption3Shown: (value: boolean) => void;
    option4Shown: boolean;
    setOption4Shown: (value: boolean) => void;
    option5Shown: boolean;
    setOption5Shown: (value: boolean) => void;
    option6Shown: boolean;
    setOption6Shown: (value: boolean) => void;
    hasModifiedQuestion: boolean;
    setHasModifiedQuestion: (value: boolean) => void;
    hasModifiedOption1: boolean;
    setHasModifiedOption1: (value: boolean) => void;
    hasModifiedOption2: boolean;
    setHasModifiedOption2: (value: boolean) => void;
    questionHelper: string | undefined;
    setQuestionHelper: (value: string | undefined) => void;
    isQuestionValid: boolean;
    setIsQuestionValid: (value: boolean) => void;
    option1Helper: string | undefined;
    setOption1Helper: (value: string | undefined) => void;
    isOption1Valid: boolean;
    setIsOption1Valid: (value: boolean) => void;
    option2Helper: string | undefined;
    setOption2Helper: (value: string | undefined) => void;
    isOption2Valid: boolean;
    setIsOption2Valid: (value: boolean) => void;
}

export function PollCreateView({
    activeFormCredential,
    postAsStudentChecked,
    setPostAsStudentChecked,
    postAsAlumChecked,
    setPostAsAlumChecked,
    postAsFacultyChecked,
    setPostAsFacultyChecked,
    postAsCampusChecked,
    setPostAsCampusChecked,
    postAsProgramChecked,
    setPostAsProgramChecked,
    postAsAdmissionYearChecked,
    setPostAsAdmissionYearChecked,
    postAsFrench,
    setPostAsFrench,
    postAsInternational,
    setPostAsInternational,
    eligibilityCountries,
    setEligibilityCountries,
    eligibilityAlum,
    setEligibilityAlum,
    eligibilityStudent,
    setEligibilityStudent,
    eligibilityFaculty,
    setEligibilityFaculty,
    eligibilityCampus,
    setEligibilityCampus,
    eligibilityProgram,
    setEligibilityProgram,
    eligibilityAdmissionYear,
    setEligibilityAdmissionYear,
    questionInputRef,
    option1InputRef,
    option2InputRef,
    option3InputRef,
    option4InputRef,
    option5InputRef,
    option6InputRef,
    option3Shown,
    setOption3Shown,
    option4Shown,
    setOption4Shown,
    option5Shown,
    setOption5Shown,
    option6Shown,
    setOption6Shown,
    hasModifiedQuestion,
    setHasModifiedQuestion,
    hasModifiedOption1,
    setHasModifiedOption1,
    hasModifiedOption2,
    setHasModifiedOption2,
    questionHelper,
    setQuestionHelper,
    isQuestionValid,
    setIsQuestionValid,
    option1Helper,
    setOption1Helper,
    isOption1Valid,
    setIsOption1Valid,
    option2Helper,
    setOption2Helper,
    isOption2Valid,
    setIsOption2Valid,
}: PollCreateViewProps) {
    const frenchOrInternational = ["FR", "INT"];

    function eligibilityCountryToStr(value: "FR" | "INT"): string {
        switch (value) {
            case "FR":
                return "France";
            case "INT":
                return "International";
        }
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
                {getPostAsCountries(studentAttributes.countries)}
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
                        sx={{ ml: 1 }}
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
            <FormControlLabel
                checked={postAsAlumChecked}
                control={
                    <Checkbox
                        value={postAsAlumChecked}
                        onChange={() =>
                            setPostAsAlumChecked(!postAsAlumChecked)
                        }
                    />
                }
                label="an alum..."
            />
        );
    }

    function getPostAsFaculty(_facultyAttributes: any) {
        return (
            <FormControlLabel
                checked={postAsFacultyChecked}
                control={
                    <Checkbox
                        value={postAsFacultyChecked}
                        onChange={() =>
                            setPostAsFacultyChecked(!postAsFacultyChecked)
                        }
                    />
                }
                label="a faculty/staff member..."
            />
        );
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

        // TODO add countries and other general info
        // if (
        //     (activeFormCredential?.subject as any)?.typeSpecific.countries !==
        //     undefined
        // ) {
        //     postAsCountries = getPostAsCountries(
        //         (activeFormCredential?.subject as any)?.typeSpecific.countries
        //     );
        // }
        if (
            (activeFormCredential?.subject as any)?.typeSpecific?.type !==
            undefined
        ) {
            const typeSpecific = (activeFormCredential?.subject as any)
                ?.typeSpecific;
            const univType = typeSpecific.type as UniversityType;
            switch (univType) {
                case "student":
                    postAsStudent = getPostAsStudent(typeSpecific);
                    break;
                case "alum":
                    postAsAlum = getPostAsAlum(typeSpecific);
                    break;
                case "faculty":
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
        <>
            <Grid mt={"1em"} width={"100%"}>
                <Accordion defaultExpanded={false}>
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
                <Accordion defaultExpanded={false}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                    >
                        <Typography>Respondents eligibility... 🕵</Typography>
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
                                                typeof value === "string"
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
                                                    flexWrap: "wrap",
                                                    gap: 0.5,
                                                }}
                                            >
                                                {selected.map((value) => (
                                                    <Chip
                                                        key={value}
                                                        label={eligibilityCountryToStr(
                                                            value
                                                        )}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {frenchOrInternational.map((name) => (
                                            <MenuItem key={name} value={name}>
                                                <Checkbox
                                                    checked={(
                                                        eligibilityCountries as Array<string>
                                                    ).includes(name)}
                                                />
                                                <ListItemText
                                                    primary={eligibilityCountryToStr(
                                                        name as any
                                                    )}
                                                />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid width="100%">
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={eligibilityAlum}
                                                value={eligibilityAlum}
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
                                                checked={eligibilityFaculty}
                                                value={eligibilityFaculty}
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
                                                checked={eligibilityStudent}
                                                value={eligibilityStudent}
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
                                <FormControl fullWidth variant="standard">
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
                                                typeof value === "string"
                                                    ? (value
                                                          .split(",")
                                                          .map((v) =>
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
                                                    flexWrap: "wrap",
                                                    gap: 0.5,
                                                }}
                                            >
                                                {selected.map((value) => (
                                                    <Chip
                                                        key={value}
                                                        label={essecCampusToString(
                                                            value
                                                        )}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {Object.keys(EssecCampus)
                                            .filter(
                                                (key) => !isNaN(parseInt(key))
                                            )
                                            .map((campusKey) => (
                                                <MenuItem
                                                    key={`menu-campus-${campusKey}`}
                                                    value={parseInt(campusKey)}
                                                >
                                                    <Checkbox
                                                        checked={eligibilityCampus.includes(
                                                            parseInt(campusKey)
                                                        )}
                                                    />
                                                    <ListItemText
                                                        primary={essecCampusToString(
                                                            parseInt(campusKey)
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
                                <FormControl fullWidth variant="standard">
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
                                                typeof value === "string"
                                                    ? (value
                                                          .split(",")
                                                          .map((v) =>
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
                                                    flexWrap: "wrap",
                                                    gap: 0.5,
                                                }}
                                            >
                                                {selected.map((value) => (
                                                    <Chip
                                                        key={value}
                                                        label={essecProgramToString(
                                                            value
                                                        )}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {Object.keys(EssecProgram)
                                            .filter(
                                                (key) => !isNaN(parseInt(key))
                                            )
                                            .map((programKey) => (
                                                <MenuItem
                                                    key={`menu-program-${programKey}`}
                                                    value={parseInt(programKey)}
                                                >
                                                    <Checkbox
                                                        checked={eligibilityProgram.includes(
                                                            parseInt(programKey)
                                                        )}
                                                    />
                                                    <ListItemText
                                                        primary={essecProgramToString(
                                                            parseInt(programKey)
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
                                <FormControl fullWidth variant="standard">
                                    <InputLabel id="eligibility-admission-year-input-label">
                                        Admitted in...
                                    </InputLabel>
                                    <Select
                                        labelId="eligibility-admission-year-input-label"
                                        label="Admitted in..."
                                        multiple
                                        value={eligibilityAdmissionYear}
                                        onChange={(
                                            event: SelectChangeEvent<
                                                typeof eligibilityAdmissionYear
                                            >
                                        ) => {
                                            const {
                                                target: { value },
                                            } = event;
                                            setEligibilityAdmissionYear(
                                                typeof value === "string"
                                                    ? value
                                                          .split(",")
                                                          .map((v) =>
                                                              parseInt(v)
                                                          )
                                                    : value
                                            );
                                        }}
                                        renderValue={(selected) => (
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: 0.5,
                                                }}
                                            >
                                                {selected.map((value) => (
                                                    <Chip
                                                        key={value}
                                                        label={value}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {currentStudentsAdmissionYears.map(
                                            (admissionYear) => (
                                                <MenuItem
                                                    key={`menu-admission-year-${admissionYear}`}
                                                    value={admissionYear}
                                                >
                                                    <Checkbox
                                                        checked={eligibilityAdmissionYear.includes(
                                                            admissionYear
                                                        )}
                                                    />
                                                    <ListItemText
                                                        primary={admissionYear}
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
                                    minRows={1} //  https://stackoverflow.com/a/72789474/11046178c
                                    maxRows={4} //  https://stackoverflow.com/a/72789474/11046178c
                                    id="question-poll"
                                    label="Your question...❓"
                                    placeholder="E.g., How often do you hang out with people from other cultures?"
                                    inputProps={{
                                        maxLength: MAX_LENGTH_QUESTION,
                                    }}
                                    inputRef={questionInputRef}
                                    error={
                                        !isQuestionValid && hasModifiedQuestion
                                    }
                                    onBlur={() => {
                                        if (
                                            questionInputRef?.current?.value !==
                                                undefined &&
                                            questionInputRef?.current?.value !==
                                                ""
                                        ) {
                                            setIsQuestionValid(true);
                                            setQuestionHelper(undefined);
                                        } else {
                                            setIsQuestionValid(false);
                                            setQuestionHelper(fieldRequired);
                                        }
                                        setHasModifiedQuestion(true);
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
                                    minRows={1} //  https://stackoverflow.com/a/72789474/11046178c
                                    maxRows={2} //  https://stackoverflow.com/a/72789474/11046178c
                                    required
                                    id={`option-1-poll`}
                                    label={`Option 1`}
                                    placeholder="E.g., Often"
                                    inputProps={{
                                        maxLength: MAX_LENGTH_OPTION,
                                    }}
                                    inputRef={option1InputRef}
                                    error={
                                        !isOption1Valid && hasModifiedOption1
                                    }
                                    onBlur={() => {
                                        if (
                                            option1InputRef?.current?.value !==
                                                undefined &&
                                            option1InputRef?.current?.value !==
                                                ""
                                        ) {
                                            setIsOption1Valid(true);
                                            setOption1Helper(undefined);
                                        } else {
                                            setIsOption1Valid(false);
                                            setOption1Helper(fieldRequired);
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
                                    minRows={1} //  https://stackoverflow.com/a/72789474/11046178c
                                    maxRows={2} //  https://stackoverflow.com/a/72789474/11046178c
                                    required
                                    id={`option-2-poll`}
                                    label={`Option 2`}
                                    placeholder="E.g., Rarely"
                                    inputProps={{
                                        maxLength: MAX_LENGTH_OPTION,
                                    }}
                                    inputRef={option2InputRef}
                                    error={
                                        !isOption2Valid && hasModifiedOption2
                                    }
                                    onBlur={() => {
                                        if (
                                            option2InputRef?.current?.value !==
                                                undefined &&
                                            option2InputRef?.current?.value !==
                                                ""
                                        ) {
                                            setIsOption2Valid(true);
                                            setOption2Helper(undefined);
                                        } else {
                                            setIsOption2Valid(false);
                                            setOption2Helper(fieldRequired);
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
                                    display: option3Shown ? "inherit" : "none",
                                }}
                                ml={1}
                                mt={1}
                            >
                                <Grid flexGrow={1} mr={1}>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        multiline
                                        minRows={1} //  https://stackoverflow.com/a/72789474/11046178c
                                        maxRows={2} //  https://stackoverflow.com/a/72789474/11046178c
                                        id={`option-3-poll`}
                                        label={`Option 3`}
                                        placeholder="E.g., Sometimes"
                                        inputProps={{
                                            maxLength: MAX_LENGTH_OPTION,
                                        }}
                                        inputRef={option3InputRef}
                                    />
                                </Grid>
                                <Grid>
                                    <IconButton
                                        size="small"
                                        onClick={() => deleteItem(3)}
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
                                    display: option4Shown ? "inherit" : "none",
                                }}
                                ml={1}
                                mt={1}
                            >
                                <Grid flexGrow={1} mr={1}>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        multiline
                                        minRows={1} //  https://stackoverflow.com/a/72789474/11046178c
                                        maxRows={2} //  https://stackoverflow.com/a/72789474/11046178c
                                        id={`option-4-poll`}
                                        label={
                                            option3Shown
                                                ? `Option 4`
                                                : `Option 3`
                                        }
                                        placeholder="E.g., Never"
                                        inputProps={{
                                            maxLength: MAX_LENGTH_OPTION,
                                        }}
                                        inputRef={option4InputRef}
                                    />
                                </Grid>
                                <Grid>
                                    <IconButton
                                        size="small"
                                        onClick={() => deleteItem(4)}
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
                                    display: option5Shown ? "inherit" : "none",
                                }}
                                ml={1}
                                mt={1}
                            >
                                <Grid flexGrow={1} mr={1}>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        multiline
                                        minRows={1} //  https://stackoverflow.com/a/72789474/11046178c
                                        maxRows={2} //  https://stackoverflow.com/a/72789474/11046178c
                                        id={`option-5-poll`}
                                        label={
                                            option4Shown && option3Shown
                                                ? `Option 5`
                                                : option4Shown || option3Shown
                                                ? `Option 4`
                                                : `Option 3`
                                        }
                                        placeholder="E.g., All the time"
                                        inputProps={{
                                            maxLength: MAX_LENGTH_OPTION,
                                        }}
                                        inputRef={option5InputRef}
                                    />
                                </Grid>
                                <Grid>
                                    <IconButton
                                        size="small"
                                        onClick={() => deleteItem(5)}
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
                                    display: option6Shown ? "inherit" : "none",
                                }}
                                ml={1}
                                mt={1}
                            >
                                <Grid flexGrow={1} mr={1}>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        multiline
                                        minRows={1} //  https://stackoverflow.com/a/72789474/11046178c
                                        maxRows={2} //  https://stackoverflow.com/a/72789474/11046178c
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
                                                  (option4Shown && option3Shown)
                                                ? `Option 5`
                                                : option5Shown ||
                                                  option4Shown ||
                                                  option3Shown
                                                ? `Option 4`
                                                : `Option 3`
                                        }
                                        placeholder="E.g., Eating baozi"
                                        inputProps={{
                                            maxLength: MAX_LENGTH_OPTION,
                                        }}
                                        inputRef={option6InputRef}
                                    />
                                </Grid>
                                <Grid>
                                    <IconButton
                                        size="small"
                                        onClick={() => deleteItem(6)}
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
                                    startIcon={<AddCircleOutlineIcon />}
                                >
                                    Add option
                                </Button>
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Grid>
        </>
    );
}
