import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { Topbar } from "../Topbar";
import { Outlet } from "react-router-dom";
import { BottomNavbar } from "../BottomNavbar";
import React from "react";

export function DashboardLayout() {
  return (
    <Box>
      <Topbar />
      <Container>
        <Outlet />
      </Container>
      <BottomNavbar />
    </Box>
  );
}
