import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";

export interface Answer {
    response: string;
    percentage: number;
}

interface PollResultView {
    participants: number;
    answers: Answer[];
    expireAt?: string;
}

// linkedin poll color: #2596be
// https://stackoverflow.com/a/35270047/11046178 for marginLeft usage

export function PollResultView({ answers }: PollResultView) {
    return (
        <Grid
            sx={{ px: 2, py: 1 }}
            width="100%"
            container
            justifyContent="center"
            direction="column"
        >
            {answers.map(({ response, percentage }, index) => (
                <Grid
                    key={index}
                    container
                    alignItems="center"
                    justifyContent="flex-start"
                    direction="row"
                    sx={{
                        my: 0.5,
                        borderRadius: "8px",
                        px: 1,
                        py: 0.5,
                        background:
                            percentage <= 50
                                ? `linear-gradient(90deg, #e6e9ec ${percentage}%, #FFFFFF 0)`
                                : `linear-gradient(to right, #e6e9ec ${percentage}%, #FFFFFF ${
                                      100 - percentage
                                  }%)`,
                    }}
                >
                    <Grid>
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: "bold",
                                fontSize: 14,
                            }}
                        >
                            {response}
                        </Typography>
                    </Grid>
                    <Grid marginLeft="auto">
                        <Typography
                            variant="body1"
                            sx={{ fontWeight: "bold", fontSize: 14 }}
                        >
                            {percentage}%
                        </Typography>
                    </Grid>
                </Grid>
            ))}
        </Grid>
    );
}
