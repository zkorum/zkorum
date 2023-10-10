// for now we assume the same form for every commmunity
// TODO: we need the backend to send a specific form for each community later

import Radio from "@mui/material/Radio";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import React from "react";
import { Campus, Program, StudentForm } from "./StudentForm";
import { AlumForm } from "./AlumForm";
import { FacultyForm } from "./FacultyForm";
import { countries as allCountries } from "countries-list";

enum CommunityType {
    STUDENT = "Student",
    ALUM = "Alum",
    FACULTY = "Faculty/Staff member",
}

interface GetFormProps {
    typeSpecificForm: JSX.Element;
}

// TODO: To support abitrary communities, move the form schema to a standardized JSON schema or something that's fetched from the backend
// and dynamically create the form from that.
export function CommunityForm() {
    const [type, setType] = React.useState<CommunityType>(
        CommunityType.STUDENT
    );
    const [campus, setCampus] = React.useState<Campus>(Campus.CERGY);
    const [program, setProgram] = React.useState<Program>(Program.BBA);
    const [countries, setCountries] = React.useState<string[]>([]);

    // For performace purpose, see https://mui.com/material-ui/react-autocomplete/#controlled-states
    const memoizedCountries = React.useMemo(() => {
        return Object.keys(allCountries).filter((countryCode) =>
            countries.includes(countryCode)
        );
    }, [allCountries, countries]);

    const handleChangeType = (event: React.ChangeEvent<HTMLInputElement>) => {
        setType(event.target.value as CommunityType);
    };

    function getForm({ typeSpecificForm }: GetFormProps): JSX.Element {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "left",
                }}
            >
                <Box sx={{ my: 2 }}>
                    <Typography component="div">
                        Fill the forms below to start using ZKorum! The forms
                        result will only be visible to ZKorum and to the other
                        members of your community. For now,{" "}
                        <Box fontWeight="fontWeightMedium" display="inline">
                            you can't change the forms once it's done! Your best
                            interest is to be genuine
                        </Box>
                        , so you can connect with your real community. Thanks to
                        Zero-Knowledge proofs,{" "}
                        <Box fontWeight="fontWeightMedium" display="inline">
                            the posts you will create cannot trace back to your
                            account or to the forms, even for ZKorum
                        </Box>
                        , yet we can verify they originated from some anonymous
                        invididual in your community.
                    </Typography>
                </Box>
                <Box sx={{ my: 2 }}>
                    <FormControl>
                        <FormLabel id="form-label-which-type-form">
                            Are you a ...
                        </FormLabel>
                        <RadioGroup
                            aria-labelledby="radio-group-which-type-form"
                            name="radio-group-which-type-form"
                            value={type}
                            onChange={handleChangeType}
                        >
                            <FormControlLabel
                                value={CommunityType.STUDENT}
                                control={<Radio />}
                                label={CommunityType.STUDENT.toString()}
                            />
                            <FormControlLabel
                                value={CommunityType.ALUM}
                                control={<Radio />}
                                label={CommunityType.ALUM.toString()}
                            />
                            <FormControlLabel
                                value={CommunityType.FACULTY}
                                control={<Radio />}
                                label={CommunityType.FACULTY.toString()}
                            />
                        </RadioGroup>
                    </FormControl>
                </Box>
                {typeSpecificForm}
            </Box>
        );
    }

    switch (type) {
        case CommunityType.STUDENT:
            return getForm({
                typeSpecificForm: (
                    <StudentForm
                        campus={campus}
                        setCampus={setCampus}
                        program={program}
                        setProgram={setProgram}
                        memoizedCountries={memoizedCountries}
                        setCountries={setCountries}
                        allCountries={allCountries}
                    />
                ),
            });
        case CommunityType.ALUM:
            return getForm({ typeSpecificForm: <AlumForm /> });
        case CommunityType.FACULTY:
            return getForm({ typeSpecificForm: <FacultyForm /> });
    }
}
