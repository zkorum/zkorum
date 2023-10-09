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

export function CommunityForm() {
    const [type, setType] = React.useState("student");

    const handleChangeType = (event: React.ChangeEvent<HTMLInputElement>) => {
        setType((event.target as HTMLInputElement).value);
    };

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
                    Fill the forms below to start using ZKorum! The forms result
                    will only be visible to the other members of your community.{" "}
                    <Box fontWeight="fontWeightMedium" display="inline">
                        For now, you can't change the forms once it's done! Your
                        better interest is to be genuine
                    </Box>
                    , because otherwise you will not be able to connect with
                    your real community. Thanks to Zero-Knowledge proofs, the
                    posts you will create{" "}
                    <Box fontWeight="fontWeightMedium" display="inline">
                        cannot trace back to your account or to the forms
                    </Box>
                    , yet we can verify they originated from some anonymous
                    invididual in your community.
                </Typography>
            </Box>
            <Box sx={{ my: 2 }}>
                <FormControl>
                    <FormLabel id="demo-controlled-radio-buttons-group">
                        Are you a ...
                    </FormLabel>
                    <RadioGroup
                        aria-labelledby="demo-controlled-radio-buttons-group"
                        name="controlled-radio-buttons-group"
                        value={type}
                        onChange={handleChangeType}
                    >
                        <FormControlLabel
                            value="student"
                            control={<Radio />}
                            label="Student"
                        />
                        <FormControlLabel
                            value="alum"
                            control={<Radio />}
                            label="Alum"
                        />
                        <FormControlLabel
                            value="faculty"
                            control={<Radio />}
                            label="Faculty/Staff member"
                        />
                    </RadioGroup>
                </FormControl>
            </Box>
        </Box>
    );
}
