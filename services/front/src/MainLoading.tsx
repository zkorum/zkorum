import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

interface MainLoadingProps {
    open: boolean;
}

// an overlay
export function MainLoading(props: MainLoadingProps) {
    return (
        <Backdrop
            sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 1 }}
            open={props.open}
        >
            <CircularProgress color="inherit" />
        </Backdrop>
    );
}
