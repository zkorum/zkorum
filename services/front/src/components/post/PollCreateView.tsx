import { MAX_LENGTH_OPTION } from "@/shared/shared";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { fieldRequired } from "../error/message";

interface PollCreateViewProps {
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
    hasModifiedOption1: boolean;
    hasModifiedOption2: boolean;
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
    hasModifiedOption1,
    hasModifiedOption2,
    option1Helper,
    setOption1Helper,
    isOption1Valid,
    setIsOption1Valid,
    option2Helper,
    setOption2Helper,
    isOption2Valid,
    setIsOption2Valid,
}: PollCreateViewProps) {
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

    return (
        <Grid mt={3} width="100%">
            <Accordion expanded={true}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <Typography>📊</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid
                        container
                        direction="column"
                        justifyContent="center"
                        alignItems="flex-start"
                    >
                        <Grid width="100%" ml={1} mt={1}>
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
                                error={!isOption1Valid && hasModifiedOption1}
                                onBlur={() => {
                                    if (
                                        option1InputRef?.current?.value !==
                                            undefined &&
                                        option1InputRef?.current?.value !== ""
                                    ) {
                                        setIsOption1Valid(true);
                                        setOption1Helper(undefined);
                                    } else {
                                        setIsOption1Valid(false);
                                        setOption1Helper(fieldRequired);
                                    }
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
                                error={!isOption2Valid && hasModifiedOption2}
                                onBlur={() => {
                                    if (
                                        option2InputRef?.current?.value !==
                                            undefined &&
                                        option2InputRef?.current?.value !== ""
                                    ) {
                                        setIsOption2Valid(true);
                                        setOption2Helper(undefined);
                                    } else {
                                        setIsOption2Valid(false);
                                        setOption2Helper(fieldRequired);
                                    }
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
                                        option3Shown ? `Option 4` : `Option 3`
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
                                            : (option5Shown && option3Shown) ||
                                              (option5Shown && option4Shown) ||
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
    );
}
