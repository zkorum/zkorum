import Box from "@mui/material/Box";
import CircularProgress, {
    type CircularProgressProps,
} from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

export function CircularProgressCountdown(
    props: CircularProgressProps & { value: number; unit: string }
) {
    return (
        <Box sx={{ position: "relative", display: "inline-flex" }}>
            <CircularProgress variant="determinate" {...props} />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography
                    variant="caption"
                    component="div"
                    color="text.secondary"
                >{`${Math.round(props.value)}${props.unit}`}</Typography>
            </Box>
        </Box>
    );
}
