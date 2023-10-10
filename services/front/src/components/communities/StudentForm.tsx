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

interface StudentFormProps {
    campus: Campus;
    setCampus: (value: Campus) => void;
    program: Program;
    setProgram: (value: Program) => void;
    memoizedCountries: string[];
    setCountries: (newCountries: string[]) => void;
    allCountries: TCountries;
}

export enum Campus {
    CERGY = "Cergy",
    SINGAPORE = "Singapore",
    RABAT = "Rabat",
}

export enum Program {
    BBA = "BBA",
    MIM = "MIM / GE",
    OM = "Other Masters",
    PHD = "PhD",
    EXCHANGE = "Exchange",
}

export function StudentForm({
    campus,
    setCampus,
    program,
    setProgram,
    setCountries,
    memoizedCountries,
    allCountries,
}: StudentFormProps) {
    const handleChangeCampus = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCampus(event.target.value as Campus);
    };

    const handleChangeProgram = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setProgram(event.target.value as Program);
    };

    const handleChangeCountries = (
        _event: SyntheticEvent,
        newCountries: string[]
    ) => {
        setCountries(newCountries);
    };

    return (
        <>
            <Box sx={{ my: 2 }}>
                <FormControl>
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
                            value={Campus.CERGY}
                            control={<Radio />}
                            label={Campus.CERGY.toString()}
                        />
                        <FormControlLabel
                            value={Campus.SINGAPORE}
                            control={<Radio />}
                            label={Campus.SINGAPORE.toString()}
                        />
                        <FormControlLabel
                            value={Campus.RABAT}
                            control={<Radio />}
                            label={Campus.RABAT.toString()}
                        />
                    </RadioGroup>
                </FormControl>
            </Box>
            <Box sx={{ my: 2 }}>
                <FormControl>
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
                            value={Program.BBA}
                            control={<Radio />}
                            label={Program.BBA.toString()}
                        />
                        <FormControlLabel
                            value={Program.MIM}
                            control={<Radio />}
                            label={Program.MIM.toString()}
                        />
                        <FormControlLabel
                            value={Program.OM}
                            control={<Radio />}
                            label={Program.OM.toString()}
                        />
                        <FormControlLabel
                            value={Program.PHD}
                            control={<Radio />}
                            label={Program.PHD.toString()}
                        />
                        <FormControlLabel
                            value={Program.EXCHANGE}
                            control={<Radio />}
                            label={Program.EXCHANGE.toString()}
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
        </>
    );
}
