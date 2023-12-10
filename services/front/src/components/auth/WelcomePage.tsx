import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

interface WelcomePageProps {
    onNextButtonClicked: () => void;
}

// TODO add nextButton and trigger the function passed as props
export function WelcomePage({ onNextButtonClicked }: WelcomePageProps) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "left",
            }}
        >
            <Box sx={{ my: 2 }}>
                <Typography variant={"h4"}>Welcome!</Typography>
            </Box>
            <Box sx={{ my: 2 }}>
                <Typography>
                    {" "}
                    🔒Here you are completely anonymous and free to express your
                    honest opinions.
                </Typography>
            </Box>
            <Box sx={{ my: 2 }}>
                <Typography>
                    🧐Hateful speech or naming individuals is NOT allowed.
                </Typography>
            </Box>
            <Box sx={{ my: 2 }}>
                <Typography>
                    🌈Let’s create a safe and inclusive space for open
                    conversations!
                </Typography>
            </Box>
            <Box sx={{ my: 2 }}>
                <Typography>Cheers,</Typography>
                <Typography>Yuting, CEO of ZKorum</Typography>
            </Box>
            <Box sx={{ alignSelf: "center", my: 3 }}>
                <Button variant="contained" onClick={onNextButtonClicked}>
                    OK, let the fun begin! 🎉
                </Button>
            </Box>
        </Box>
    );
}
