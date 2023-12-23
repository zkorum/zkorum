import { zeroIfUndefined } from "@/common/common";
import type {
    PollResult,
    PollData,
    PollOptionAndPseudonym,
} from "@/shared/types/zod";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";

interface PollResultView {
    result: PollResult;
    pollResponse: PollOptionAndPseudonym | undefined;
    data: PollData;
}

// linkedin poll color: #2596be
// https://stackoverflow.com/a/35270047/11046178 for marginLeft usage

export function PollResultView({ result, data, pollResponse }: PollResultView) {
    function getOptionView(
        option: string,
        optionPercentage: number,
        optionResponded: boolean
    ) {
        return (
            <Grid
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
                        optionPercentage <= 50
                            ? `linear-gradient(90deg, #e6e9ec ${optionPercentage}%, #FFFFFF 0)`
                            : `linear-gradient(to right, #e6e9ec ${optionPercentage}%, #FFFFFF ${
                                  100 - optionPercentage
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
                        {optionResponded ? `${option} ✔️` : option}
                    </Typography>
                </Grid>
                <Grid marginLeft="auto">
                    <Typography
                        variant="body1"
                        sx={{ fontWeight: "bold", fontSize: 14 }}
                    >
                        {optionPercentage}%
                    </Typography>
                </Grid>
            </Grid>
        );
    }
    const totalCount =
        result.option1Response +
        result.option2Response +
        zeroIfUndefined(result.option3Response) +
        zeroIfUndefined(result.option4Response) +
        zeroIfUndefined(result.option5Response) +
        zeroIfUndefined(result.option6Response);
    return (
        <Grid
            sx={{ px: 2, py: 1 }}
            width="100%"
            container
            justifyContent="center"
            direction="column"
        >
            {getOptionView(
                data.option1,
                totalCount === 0
                    ? 0
                    : Math.round((result.option1Response * 100) / totalCount),
                pollResponse !== undefined && pollResponse.optionChosen === 1
            )}
            {getOptionView(
                data.option2,
                totalCount === 0
                    ? 0
                    : Math.round((result.option2Response * 100) / totalCount),
                pollResponse !== undefined && pollResponse.optionChosen === 2
            )}
            {data.option3 !== undefined
                ? getOptionView(
                      data.option3,
                      totalCount === 0 || result.option3Response === undefined
                          ? 0
                          : Math.round(
                                (result.option3Response * 100) / totalCount
                            ),
                      pollResponse !== undefined &&
                          pollResponse.optionChosen === 3
                  )
                : null}
            {data.option4 !== undefined
                ? getOptionView(
                      data.option4,
                      totalCount === 0 || result.option4Response === undefined
                          ? 0
                          : Math.round(
                                (result.option4Response * 100) / totalCount
                            ),

                      pollResponse !== undefined &&
                          pollResponse.optionChosen === 4
                  )
                : null}
            {data.option5 !== undefined
                ? getOptionView(
                      data.option5,
                      totalCount === 0 || result.option5Response === undefined
                          ? 0
                          : Math.round(
                                (result.option5Response * 100) / totalCount
                            ),
                      pollResponse !== undefined &&
                          pollResponse.optionChosen === 5
                  )
                : null}
            {data.option6 !== undefined
                ? getOptionView(
                      data.option6,
                      totalCount === 0 || result.option6Response === undefined
                          ? 0
                          : Math.round(
                                (result.option6Response * 100) / totalCount
                            ),

                      pollResponse !== undefined &&
                          pollResponse.optionChosen === 6
                  )
                : null}
        </Grid>
    );
}
