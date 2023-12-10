import "@mui/material/styles";

declare module "@mui/material/styles" {
    interface Palette {
        dsiscord: Palette["primary"];
    }

    interface PaletteOptions {
        discord?: PaletteOptions["primary"];
    }
}
