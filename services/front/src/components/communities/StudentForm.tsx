import {
    type TCountryCode,
    getEmojiFlag,
    type TCountries,
} from "countries-list";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import React, { type SyntheticEvent } from "react";
import { EssecCampus, EssecProgram } from "@/shared/types/university";

interface StudentFormProps {
    campus: EssecCampus;
    setCampus: (value: EssecCampus) => void;
    program: EssecProgram;
    setProgram: (value: EssecProgram) => void;
    memoizedCountries: string[];
    setCountries: (selectedCountries: string[]) => void;
    allCountries: TCountries;
    admissionYear: number | null;
    setAdmissionYear: (selectedAdmissionYear: number | null) => void;
    allAdmissionYears: readonly number[];
    hasTriedSubmitting: boolean;
}

export function StudentForm({
    campus,
    setCampus,
    program,
    setProgram,
    setCountries,
    memoizedCountries,
    allCountries,
    admissionYear,
    setAdmissionYear,
    allAdmissionYears,
    hasTriedSubmitting,
}: StudentFormProps) {
    const handleChangeCampus = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedCampus = parseInt(event.target.value);
        if (isNaN(selectedCampus)) {
            console.warn(
                "Enum Campus is not a number, this is not supposed to happen"
            );
            return;
        }
        setCampus(selectedCampus);
    };

    const handleChangeProgram = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const selectedProgram = parseInt(event.target.value);
        if (isNaN(selectedProgram)) {
            console.warn(
                "Enum Program is not a number, this is not supposed to happen"
            );
            return;
        }
        setProgram(selectedProgram);
    };

    const handleChangeCountries = (
        _event: SyntheticEvent,
        selectedCountries: string[]
    ) => {
        setCountries(selectedCountries);
    };

    const handleChangeAdmissionYear = (
        _event: SyntheticEvent,
        selectedAdmissionYear: number | null
    ) => {
        setAdmissionYear(selectedAdmissionYear);
    };

    return (
        <>
            <Box sx={{ my: 2 }}>
                <FormControl required>
                    <FormLabel id="form-label-campus-student-form">
                        Which campus are you based in?
                    </FormLabel>
                    <RadioGroup
                        aria-labelledby="radio-group-campus-student-form"
                        name="radio-group-campus-student-form"
                        value={campus}
                        onChange={handleChangeCampus}
                    >
                        <FormControlLabel
                            value={EssecCampus.CERGY}
                            control={<Radio />}
                            label={EssecCampus.CERGY.toString()}
                        />
                        <FormControlLabel
                            value={EssecCampus.SINGAPORE}
                            control={<Radio />}
                            label={EssecCampus.SINGAPORE.toString()}
                        />
                        <FormControlLabel
                            value={EssecCampus.RABAT}
                            control={<Radio />}
                            label={EssecCampus.RABAT.toString()}
                        />
                    </RadioGroup>
                </FormControl>
            </Box>
            <Box sx={{ my: 2 }}>
                <FormControl required>
                    <FormLabel id="form-label-program-student-form">
                        What is your program?
                    </FormLabel>
                    <RadioGroup
                        aria-labelledby="radio-group-program-student-form"
                        name="radio-group-program-student-form"
                        value={program}
                        onChange={handleChangeProgram}
                    >
                        <FormControlLabel
                            value={EssecProgram.BBA}
                            control={<Radio />}
                            label={EssecProgram.BBA.toString()}
                        />
                        <FormControlLabel
                            value={EssecProgram.MIM}
                            control={<Radio />}
                            label={EssecProgram.MIM.toString()}
                        />
                        <FormControlLabel
                            value={EssecProgram.OM}
                            control={<Radio />}
                            label={EssecProgram.OM.toString()}
                        />
                        <FormControlLabel
                            value={EssecProgram.PHD}
                            control={<Radio />}
                            label={EssecProgram.PHD.toString()}
                        />
                        <FormControlLabel
                            value={EssecProgram.EXCHANGE}
                            control={<Radio />}
                            label={EssecProgram.EXCHANGE.toString()}
                        />
                    </RadioGroup>
                </FormControl>
            </Box>
            <Box sx={{ my: 2 }}>
                <Autocomplete
                    id="countries-autocomplete-student-form"
                    sx={{ width: 300 }}
                    multiple
                    freeSolo
                    value={memoizedCountries}
                    onChange={handleChangeCountries}
                    options={Object.keys(allCountries)}
                    autoHighlight
                    getOptionLabel={(option) =>
                        allCountries[option as TCountryCode].name
                    }
                    renderOption={(props, option) => (
                        <Box
                            component="li"
                            sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                            {...props}
                        >
                            {getEmojiFlag(option as TCountryCode)}{" "}
                            {allCountries[option as TCountryCode].name}
                        </Box>
                    )}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="What country/countries are you from?"
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: "new-password", // disable autocomplete and autofill
                            }}
                            required
                            error={
                                memoizedCountries.length === 0 &&
                                hasTriedSubmitting
                            }
                        />
                    )}
                    renderTags={(value: string[], getTagProps) =>
                        value.map((option: string, index: number) => (
                            <Chip
                                variant="outlined"
                                label={
                                    allCountries[option as TCountryCode].name
                                }
                                {...getTagProps({ index })}
                            />
                        ))
                    }
                />
            </Box>
            <Box sx={{ my: 2 }}>
                <Autocomplete
                    id="admission-year-autocomplete-student-form"
                    sx={{ width: 300 }}
                    value={admissionYear}
                    onChange={handleChangeAdmissionYear}
                    options={allAdmissionYears}
                    autoHighlight
                    getOptionLabel={(option) => option.toString()}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="What is your year of admission?"
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: "new-password", // disable autocomplete and autofill
                            }}
                            required
                            error={admissionYear === null && hasTriedSubmitting}
                        />
                    )}
                />
            </Box>
        </>
    );
}
