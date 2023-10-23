import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

const background = {
    paper: "#fff",
    default: "#fff",
};

const text = {
    // https://mui.com/material-ui/customization/default-theme/?expand-path=$.palette#explore
    primary: "rgba(0,0,0,0.87)",
};

// Create a theme instance.
const theme = createTheme({
    typography: {
        fontFamily: [
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(","),
    },
    palette: {
        primary: {
            main: "#00275b",
        },
        secondary: {
            main: "#19857b",
        },
        error: {
            main: red.A400,
        },
        text: {
            primary: text.primary,
        },
        background: {
            paper: background.paper,
            default: background.default,
        },
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                colorPrimary: {
                    backgroundColor: background.default,
                    color: text.primary,
                },
            },
        },
    },
});

export default theme;
