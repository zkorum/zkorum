import * as React from "react";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import HomeIcon from "@mui/icons-material/Home";
import NotificationsIcon from "@mui/icons-material/Notifications";
import BadgeIcon from "@mui/icons-material/Badge";
import GroupsIcon from "@mui/icons-material/Groups";
import SettingsIcon from "@mui/icons-material/Settings";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";

enum Nav {
  Home = "Home",
  Credentials = "Credentials",
  Communities = "Communities",
  Notifications = "Notifications",
  Settings = "Settings",
}

export function BottomNavbar() {
  const [value, setValue] = React.useState<Nav>(Nav.Home);
  const navigate = useNavigate();

  React.useEffect(() => {
    switch (value) {
      case Nav.Home:
        navigate("/");
        break;
      case Nav.Credentials:
        navigate("/credentials");
        break;
      case Nav.Communities:
        navigate("/communities");
        break;
      case Nav.Notifications:
        navigate("/notifications");
        break;
      case Nav.Settings:
        navigate("/settings");
        break;
    }
  }, [value, navigate]);

  const handleChange = (event: React.SyntheticEvent, newValue: Nav) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ pb: 7 }}>
      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation value={value} onChange={handleChange}>
          <BottomNavigationAction
            label={Nav.Home}
            value={Nav.Home}
            icon={<HomeIcon />}
            sx={{ minWidth: "60px" }}
          />
          <BottomNavigationAction
            label={Nav.Credentials}
            value={Nav.Credentials}
            icon={<BadgeIcon />}
            sx={{ minWidth: "60px" }}
          />
          <BottomNavigationAction
            label={Nav.Communities}
            value={Nav.Communities}
            icon={<GroupsIcon />}
            sx={{ minWidth: "60px" }}
          />
          <BottomNavigationAction
            label={Nav.Notifications}
            value={Nav.Notifications}
            icon={<NotificationsIcon />}
            sx={{ minWidth: "60px" }}
          />
          <BottomNavigationAction
            label={Nav.Settings}
            value={Nav.Settings}
            icon={<SettingsIcon />}
            sx={{ minWidth: "60px" }}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
