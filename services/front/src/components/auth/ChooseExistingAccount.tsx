import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { type SessionData } from "../../store/reducers/session";
import { SessionList } from "./SessionList";

interface ChooseExistingAccountProps {
    sessions: SessionData[];
    activeSessionEmail: string;
}

export function ChooseExistingAccount({
    activeSessionEmail,
    sessions,
}: ChooseExistingAccountProps) {
    return (
        <Grid
            container
            direction="column"
            alignItems="center"
            justifyContent="center"
        >
            <Grid>
                <Typography>Authenticate from existing accounts:</Typography>
            </Grid>
            <Grid>
                <SessionList
                    component={"list"}
                    sessions={sessions}
                    activeSessionEmail={activeSessionEmail}
                />
            </Grid>
        </Grid>
    );
}
