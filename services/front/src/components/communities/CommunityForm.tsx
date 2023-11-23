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
    universityTypeToString,
} from "@/shared/types/university";
import Button from "@mui/material/Button";
import { requestAnonymousCredentials } from "@/request/credential";
import { useAppDispatch } from "@/hooks";
import { closeMainLoading, openMainLoading } from "@/store/reducers/loading";
import { credentialsIssued, genericError } from "../error/message";
import { showError, showSuccess } from "@/store/reducers/snackbar";
import {
    currentStudentsAdmissionYears,
    type UniversityType,
    zoduniversityType,
} from "@/shared/types/zod";

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
        zoduniversityType.enum.student
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

    React.useEffect(() => {
        switch (type) {
            case zoduniversityType.enum.student:
                if (
                    studentCountries.length === 0 ||
                    studentAdmissionYear === null
                ) {
                    setIsInvalid(true);
                } else {
                    setIsInvalid(false);
                }
                break;
            case zoduniversityType.enum.alum:
                //TODO
                break;
            case zoduniversityType.enum.faculty:
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
        setType(event.target.value as UniversityType);
    };

    async function onSubmitForm(): Promise<void> {
        if (isInvalid) {
            return;
        }
        setStudentHasTriedSubmitting(true);
        switch (type) {
            case zoduniversityType.enum.student:
                const studentCountriesAsObj: Partial<
                    Record<TCountryCode, boolean>
                > = {};
                for (const countryCode of studentCountries) {
                    studentCountriesAsObj[countryCode as TCountryCode] = true;
                }
                const emailCredentialRequest = {
                    type: zoduniversityType.enum.student,
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
            case zoduniversityType.enum.alum:
                //TODO
                break;
            case zoduniversityType.enum.faculty:
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
                <Box sx={{ mt: 2 }}>
                    <Typography component="div" sx={{ mb: 1 }}>
                        Self-attest attributes to connect with your community
                        with more granularity than just belonging to ESSEC.
                    </Typography>
                    <Typography component="div" sx={{ mb: 1 }}>
                        For example, If you are a student, you'll be able to
                        post "as a student" and respond to posts only for
                        students!
                    </Typography>
                    <Typography component="div" sx={{ mb: 1 }}>
                        The forms result will only be visible to ZKorum and to
                        the other members of your community.
                    </Typography>
                    <Typography component="div" sx={{ mb: 1 }}>
                        For now,{" "}
                        <Box fontWeight="fontWeightMedium" display="inline">
                            you can't change the forms once it's done! Your best
                            interest is to be genuine
                        </Box>
                        , so you can connect with your real community.
                    </Typography>
                    <Typography component="div" sx={{ mb: 1 }}>
                        Thanks to Zero-Knowledge proofs,{" "}
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
                                value={zoduniversityType.enum.student}
                                control={<Radio />}
                                label={universityTypeToString(
                                    zoduniversityType.enum.student
                                )}
                            />
                            <FormControlLabel
                                value={zoduniversityType.enum.alum}
                                control={<Radio />}
                                label={universityTypeToString(
                                    zoduniversityType.enum.alum
                                )}
                            />
                            <FormControlLabel
                                value={zoduniversityType.enum.faculty}
                                control={<Radio />}
                                label={universityTypeToString(
                                    zoduniversityType.enum.faculty
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
                        Request anonymous credential
                    </Button>
                </Box>
            </Box>
        );
    }

    switch (type) {
        case zoduniversityType.enum.student:
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
        case zoduniversityType.enum.alum:
            // TODO
            return getForm({ typeSpecificForm: <AlumForm /> });
        case zoduniversityType.enum.faculty:
            // TODO
            return getForm({ typeSpecificForm: <FacultyForm /> });
    }
}
