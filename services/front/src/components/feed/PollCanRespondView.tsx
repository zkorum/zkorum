import type { PollOptions } from "@/shared/types/zod";
import Grid from "@mui/material/Unstable_Grid2";
import React from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

interface PollCanRespondViewProps {
    options: PollOptions;
    onRespond: (
        optionNumberResponded: number,
        setButtonIsLoading: (isLoading: boolean) => void,
        setButtonLoadingText: (loadingText: string) => void
    ) => void;
}

export function PollCanRespondView({
    options,
    onRespond,
}: PollCanRespondViewProps) {
    const [button1IsLoading, setButton1IsLoading] =
        React.useState<boolean>(false);
    const [button1LoadingText, setButton1LoadingText] =
        React.useState<string>("");
    const [button2IsLoading, setButton2IsLoading] =
        React.useState<boolean>(false);
    const [button2LoadingText, setButton2LoadingText] =
        React.useState<string>("");
    const [button3IsLoading, setButton3IsLoading] =
        React.useState<boolean>(false);
    const [button3LoadingText, setButton3LoadingText] =
        React.useState<string>("");
    const [button4IsLoading, setButton4IsLoading] =
        React.useState<boolean>(false);
    const [button4LoadingText, setButton4LoadingText] =
        React.useState<string>("");
    const [button5IsLoading, setButton5IsLoading] =
        React.useState<boolean>(false);
    const [button5LoadingText, setButton5LoadingText] =
        React.useState<string>("");
    const [button6IsLoading, setButton6IsLoading] =
        React.useState<boolean>(false);
    const [button6LoadingText, setButton6LoadingText] =
        React.useState<string>("");
    function getOptionView(
        option: string,
        optionNumber: number,
        buttonIsLoading: boolean,
        setButtonIsLoading: (val: boolean) => void,
        buttonLoadingText: string,
        setButtonLoadingText: (val: string) => void
    ) {
        return (
            <LoadingButton
                sx={{
                    textTransform: "none",
                    my: 0.5,
                    px: 1,
                    py: 0.5,
                }}
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault();
                    onRespond(
                        optionNumber,
                        setButtonIsLoading,
                        setButtonLoadingText
                    );
                }}
                loading={buttonIsLoading}
                loadingIndicator={
                    <Box
                        sx={{
                            display: "flex",
                            direction: "row",
                            gap: "0.5em",
                            width: "100vw",
                            justifyContent: "center",
                            aligmItems: "center",
                            /* textOverflow: "hidden", */ // DOES NOT WORK
                            fontSize: 12,
                        }}
                    >
                        <Box>
                            <CircularProgress color="inherit" size={16} />
                        </Box>
                        <Box>{buttonLoadingText}</Box>
                    </Box>
                }
                variant="outlined"
            >
                {option}
            </LoadingButton>
        );
    }
    return (
        <Grid
            sx={{ px: 2, py: 1 }}
            width="100%"
            container
            justifyContent="center"
            direction="column"
        >
            {getOptionView(
                options.option1,
                1,
                button1IsLoading,
                setButton1IsLoading,
                button1LoadingText,
                setButton1LoadingText
            )}
            {getOptionView(
                options.option2,
                2,
                button2IsLoading,
                setButton2IsLoading,
                button2LoadingText,
                setButton2LoadingText
            )}
            {options.option3 !== undefined
                ? getOptionView(
                      options.option3,
                      3,
                      button3IsLoading,
                      setButton3IsLoading,
                      button3LoadingText,
                      setButton3LoadingText
                  )
                : null}
            {options.option4 !== undefined
                ? getOptionView(
                      options.option4,
                      4,
                      button4IsLoading,
                      setButton4IsLoading,
                      button4LoadingText,
                      setButton4LoadingText
                  )
                : null}
            {options.option5 !== undefined
                ? getOptionView(
                      options.option5,
                      5,
                      button5IsLoading,
                      setButton5IsLoading,
                      button5LoadingText,
                      setButton5LoadingText
                  )
                : null}
            {options.option6 !== undefined
                ? getOptionView(
                      options.option6,
                      6,
                      button6IsLoading,
                      setButton6IsLoading,
                      button6LoadingText,
                      setButton6LoadingText
                  )
                : null}
        </Grid>
    );
}
