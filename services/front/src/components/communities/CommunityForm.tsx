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
import { StudentForm } from "./StudentForm";
import { AlumForm } from "./AlumForm";
import { FacultyForm } from "./FacultyForm";
import { countries as allCountries, type TCountryCode } from "countries-list";
import {
    EssecCampus,
    EssecProgram,
    UniversityType,
    currentStudentsAdmissionYears,
    universityTypeToString,
} from "@/shared/types/university";
import Button from "@mui/material/Button";
import { requestAnonymousCredentials } from "@/request/credential";
import { useNavigate } from "react-router-dom";
import { FEED } from "@/common/navigation";
import { useAppDispatch } from "@/hooks";
import { closeMainLoading, openMainLoading } from "@/store/reducers/loading";
import { credentialsIssued, genericError } from "../error/message";
import { showError, showSuccess } from "@/store/reducers/snackbar";

interface GetFormProps {
    typeSpecificForm: JSX.Element;
}

interface CommunityFormProps {
    email: string;
}

// TODO: To support abitrary communities, move the form schema to a standardized JSON schema or something that's fetched from the backend
// and dynamically create the form from that.
export function CommunityForm({ email }: CommunityFormProps) {
    const [type, setType] = React.useState<UniversityType>(
        UniversityType.STUDENT
    );
    const [studentCampus, setStudentCampus] = React.useState<EssecCampus>(
        EssecCampus.CERGY
    );
    const [studentProgram, setStudentProgram] = React.useState<EssecProgram>(
        EssecProgram.BBA
    );
    const [studentCountries, setStudentCountries] = React.useState<string[]>(
        []
    );
    const [studentAdmissionYear, setStudentAdmissionYear] = React.useState<
        number | null
    >(null);
    const [studentHasTriedSubmitting, setStudentHasTriedSubmitting] =
        React.useState<boolean>(false);
    const [isInvalid, setIsInvalid] = React.useState<boolean>(true);
    const dispatch = useAppDispatch();

    const navigate = useNavigate();

    React.useEffect(() => {
        switch (type) {
            case UniversityType.STUDENT:
                if (
                    studentCountries.length === 0 ||
                    studentAdmissionYear === null
                ) {
                    setIsInvalid(true);
                } else {
                    setIsInvalid(false);
                }
                break;
            case UniversityType.ALUM:
                //TODO
                break;
            case UniversityType.FACULTY:
                //TODO
                break;
        }
    }, [type, studentCountries, studentAdmissionYear]);

    // For performance purpose, see https://mui.com/material-ui/react-autocomplete/#controlled-states
    const memoizedStudentCountries = React.useMemo(() => {
        return Object.keys(allCountries).filter((countryCode) =>
            studentCountries.includes(countryCode)
        );
    }, [allCountries, studentCountries]);

    const handleChangeType = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedType = parseInt(event.target.value);
        if (isNaN(selectedType)) {
            console.warn(
                "Enum Type is not a number, this is not supposed to happen"
            );
            return;
        }
        setType(selectedType);
    };

    async function onSubmitForm(): Promise<void> {
        if (isInvalid) {
            return;
        }
        setStudentHasTriedSubmitting(true);
        switch (type) {
            case UniversityType.STUDENT:
                const studentCountriesAsObj: Partial<
                    Record<TCountryCode, boolean>
                > = {};
                for (const countryCode of studentCountries) {
                    studentCountriesAsObj[countryCode as TCountryCode] = true;
                }
                const emailCredentialRequest = {
                    type: UniversityType.STUDENT,
                    campus: studentCampus,
                    program: studentProgram,
                    countries: studentCountriesAsObj,
                    admissionYear: studentAdmissionYear as number,
                };
                dispatch(openMainLoading());
                try {
                    // this will eventually update redux emailCredential and hence the parent to show CommunityFormFilled instead
                    await requestAnonymousCredentials(
                        email,
                        emailCredentialRequest
                    );
                    //... if it gets through, we redirect to the feed
                    navigate(FEED);
                    dispatch(showSuccess(credentialsIssued));
                } catch (e) {
                    console.warn(
                        "Error while attempting to request credentials",
                        e
                    );
                    dispatch(showError(genericError));
                } finally {
                    dispatch(closeMainLoading());
                }
                break;
            case UniversityType.ALUM:
                //TODO
                break;
            case UniversityType.FACULTY:
                //TODO
                break;
        }
        // TODO actually send the request to backend to create credentials
    }

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
                    <FormControl required>
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
                                value={UniversityType.STUDENT}
                                control={<Radio />}
                                label={universityTypeToString(
                                    UniversityType.STUDENT
                                )}
                            />
                            <FormControlLabel
                                value={UniversityType.ALUM}
                                control={<Radio />}
                                label={universityTypeToString(
                                    UniversityType.ALUM
                                )}
                            />
                            <FormControlLabel
                                value={UniversityType.FACULTY}
                                control={<Radio />}
                                label={universityTypeToString(
                                    UniversityType.FACULTY
                                )}
                            />
                        </RadioGroup>
                    </FormControl>
                </Box>
                {typeSpecificForm}
                <Box sx={{ my: 2 }}>
                    <Button
                        variant="contained"
                        onClick={() => onSubmitForm()}
                        disabled={isInvalid}
                    >
                        Request anonymous credentials
                    </Button>
                </Box>
            </Box>
        );
    }

    switch (type) {
        case UniversityType.STUDENT:
            return getForm({
                typeSpecificForm: (
                    <StudentForm
                        campus={studentCampus}
                        setCampus={setStudentCampus}
                        program={studentProgram}
                        setProgram={setStudentProgram}
                        memoizedCountries={memoizedStudentCountries}
                        setCountries={setStudentCountries}
                        allCountries={allCountries}
                        admissionYear={studentAdmissionYear}
                        setAdmissionYear={setStudentAdmissionYear}
                        allAdmissionYears={currentStudentsAdmissionYears}
                        hasTriedSubmitting={studentHasTriedSubmitting}
                    />
                ),
            });
        case UniversityType.ALUM:
            // TODO
            return getForm({ typeSpecificForm: <AlumForm /> });
        case UniversityType.FACULTY:
            // TODO
            return getForm({ typeSpecificForm: <FacultyForm /> });
    }
}
