import Avatar from "@mui/material/Avatar";
import { ReactComponent as CustomIcon } from "./assets/logo.svg";

interface ZKorumIconProps {
    iconBackgroundColor?: "dark";
    logoHeight?: string;
}

// TODO: improve source icon
export function ZKorumIcon(props: ZKorumIconProps) {
    const { iconBackgroundColor, logoHeight } = props;
    const defaultLogoHeight = "36px";
    let actualLogoHeight = logoHeight;
    if (logoHeight === undefined) {
        actualLogoHeight = defaultLogoHeight;
    }
    return (
        <Avatar
            variant="rounded"
            sx={{
                px: "2px",
                backgroundColor: (theme) =>
                    iconBackgroundColor === "dark"
                        ? theme.palette.primary.main
                        : "inherit",
            }}
        >
            <CustomIcon
                style={{
                    height: actualLogoHeight,
                }}
            />
        </Avatar>
    );
}
