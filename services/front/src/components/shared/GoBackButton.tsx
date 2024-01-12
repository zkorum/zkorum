import IconButton from "@mui/material/IconButton";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";

interface GoBackButtonProps {
    onClick: () => void;
}

export function GoBackButton({ onClick }: GoBackButtonProps) {
    return (
        <IconButton
            aria-label="close"
            onClick={onClick}
            sx={{
                position: "absolute",
                left: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
            }}
        >
            <KeyboardBackspaceIcon />
        </IconButton>
    );
}
