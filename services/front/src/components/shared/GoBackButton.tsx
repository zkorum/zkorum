import IconButton from "@mui/material/IconButton";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";

interface GoBackButtonProps {
    onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export function GoBackButton({ onClick }: GoBackButtonProps) {
    return (
        <IconButton
            aria-label="close"
            onClick={(e) => onClick(e)}
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
