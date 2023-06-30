import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import Slide from "@mui/material/Slide";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { ReactComponent as ZKorumIcon } from "../assets/logo.svg";
import SvgIcon from "@mui/material/SvgIcon";
import Box from "@mui/material/Box";

interface Props {
  children: React.ReactElement;
}

function HideOnScroll(props: Props) {
  // Note that you normally won't need to set the window ref as useScrollTrigger
  // will default to window.
  // This is only being set here because the demo is in an iframe.
  const trigger = useScrollTrigger();
  const { children } = props;

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

function CustomIcon() {
  return <ZKorumIcon style={{ height: "36px" }} />;
}

export function Topbar() {
  return (
    <>
      <HideOnScroll>
        <AppBar>
          <Container maxWidth="xl">
            <Toolbar disableGutters>
              <Grid container width="100%">
                <Grid
                  xs
                  display="flex"
                  justifyContent="flex-start"
                  alignItems="center"
                >
                  Help
                </Grid>
                <Grid
                  xs
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <SvgIcon component={CustomIcon} />
                </Grid>
                <Grid
                  xs
                  display="flex"
                  justifyContent="flex-end"
                  alignItems="center"
                >
                  Persona
                </Grid>
              </Grid>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>
      <Toolbar />
    </>
  );
}
