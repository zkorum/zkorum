import Menu from "@mui/material/Menu";
import Avatar from "@mui/material/Avatar";
import React from "react";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import { useAppDispatch, useAppSelector } from "../../hooks";
import Button from "@mui/material/Button";
import { openAuthModal } from "../../reducers/session";
import AddIcon from "@mui/icons-material/Add";

export function LoginMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleOnClose = () => {
    setAnchorEl(null);
  };

  const dispatch = useAppDispatch();

  const sessions = useAppSelector((state) => {
    return state.sessions;
  });

  return (
    <div>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? "account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <Avatar sx={{ width: 32, height: 32 }}>M</Avatar>
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleOnClose}>
        {Object.entries(sessions.sessions).map(([email, session]) => (
          <>
            <MenuItem onClick={handleOnClose} disableRipple>
              {email} - {session.status}
            </MenuItem>
          </>
        ))}
        <Button
          startIcon={<AddIcon />}
          size="small"
          variant="text"
          onClick={() => {
            handleOnClose();
            dispatch(openAuthModal());
          }}
        >
          Add account
        </Button>
      </Menu>
    </div>
  );
}
