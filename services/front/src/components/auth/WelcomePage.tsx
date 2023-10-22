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
                <Typography variant={"h4"}>Welcome to ZKorum!</Typography>{" "}
            </Box>
            <Box sx={{ my: 2 }}>
                <Typography>
                    You're in the closed alpha version of our app. While we have
                    limited features, your privacy is a top priority. Your
                    actions here are completely separate from your identity.
                    This means that neither ZKorum nor anyone else can tell what
                    you contribute to the forum. For tech details, check out our
                    Github - it's fully open-source for transparency!
                </Typography>
            </Box>
            <Box sx={{ my: 2 }}>
                <Typography>
                    We believe in anonymity for freedom of expression, but we
                    don't tolerate hateful speech or personal info sharing.
                    Content violating these rules will be hidden. Let's create a
                    safe space together.
                </Typography>
            </Box>
            <Box sx={{ my: 2 }}>
                <Typography>
                    Thanks for joining us on this adventure. Enjoy connecting
                    with your community!
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
