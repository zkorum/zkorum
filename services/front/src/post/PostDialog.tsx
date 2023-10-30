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
import { selectActiveEmailCredential } from "@/store/selector";
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

export function PostDialog() {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
    const dispatch = useAppDispatch();
    const isModalOpen = useAppSelector((state) => state.post.isPostModalOpen);
    function onClose() {
        dispatch(closePostModal());
    }
    const activeEmailCredential = useAppSelector(selectActiveEmailCredential);

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

    const MAX_LENGTH_OPTION = 30;
    const MAX_LENGTH_QUESTION = 140;

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

    function getPostAsAlum() {
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

    function getPostAsFaculty() {
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

    function onCreate() {
        console.log("TODO");
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
                        <Grid mt={"1em"}>
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
                                        {(activeEmailCredential?.subject as any)
                                            ?.typeSpecific.countries !==
                                        undefined
                                            ? getPostAsCountries(
                                                  (
                                                      activeEmailCredential?.subject as any
                                                  )?.typeSpecific.countries
                                              )
                                            : null}
                                        {(activeEmailCredential?.subject as any)
                                            ?.typeSpecific.type === "Student"
                                            ? getPostAsStudent(
                                                  (
                                                      activeEmailCredential?.subject as any
                                                  ).typeSpecific
                                              )
                                            : (
                                                  activeEmailCredential?.subject as any
                                              )?.typeSpecific.type === "Alum"
                                            ? getPostAsAlum()
                                            : getPostAsFaculty()}
                                    </FormGroup>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                        <Grid>
                            <Accordion>
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
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={
                                                            eligibilityAlum
                                                        }
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
                                        </Grid>
                                        <Grid width="100%">
                                            <FormControl
                                                fullWidth
                                                variant="standard"
                                                sx={{
                                                    m: 1,
                                                }}
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
                                        <Grid width="100%">
                                            <FormControl
                                                fullWidth
                                                variant="standard"
                                                sx={{
                                                    m: 1,
                                                }}
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
                                        <Grid width="100%">
                                            <FormControl
                                                fullWidth
                                                variant="standard"
                                                sx={{
                                                    m: 1,
                                                }}
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
                                                        option3Shown
                                                            ? option4Shown
                                                                ? `Option 5`
                                                                : `Option 4`
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
                                                        option5Shown
                                                            ? option4Shown
                                                                ? option3Shown
                                                                    ? `Option 6`
                                                                    : `Option 5`
                                                                : `Option 4`
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
                                onClick={() => onCreate()}
                                variant="contained"
                            >
                                Create poll 📊
                            </Button>
                        </Grid>
                    </Grid>
                </Container>
            </DialogContent>
        </Dialog>
    );
}
