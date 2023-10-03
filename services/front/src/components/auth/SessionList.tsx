import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Grid from "@mui/material/Unstable_Grid2";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import { CustomAvatar } from "./CustomAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import Chip from "@mui/material/Chip";
import { removeSession, type SessionData } from "../../store/reducers/session";
import { logout, onChooseAccount } from "../../auth/auth";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAppDispatch } from "../../hooks";
import { showError, showSuccess } from "../../store/reducers/snackbar";
import { genericError, logoutMessage } from "../error/message";
import React from "react";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

interface SessionListProps {
    sessions: SessionData[];
    activeSessionEmail: string;
    component: "list" | "menu";
    onClick?: (session: SessionData) => Promise<void> | void;
}

export function SessionList({
    sessions,
    activeSessionEmail,
    component,
    onClick,
}: SessionListProps) {
    const dispatch = useAppDispatch();

    async function onLogout(): Promise<void> {
        try {
            await logout();
            dispatch(showSuccess(logoutMessage));
        } catch (e) {
            console.error(e);
            dispatch(showError(genericError));
        }
    }

    interface ListItemProps {
        session: SessionData;
        activeSessionEmail: string;
    }

    function getSecondaryAction(session: SessionData, isActive: boolean) {
        switch (session.status) {
            case "authenticating":
                return (
                    <IconButton
                        onClick={() => onRemove(session)}
                        edge="start"
                        aria-label="remove"
                    >
                        <DeleteIcon color="error" />
                    </IconButton>
                );
            case "verifying":
                if (session.userId === undefined || session.userId === "") {
                    // user has never been logged-in on this device
                    return (
                        <IconButton
                            onClick={() => onRemove(session)}
                            edge="start"
                            aria-label="delete"
                        >
                            <DeleteIcon color="error" />
                        </IconButton>
                    );
                } else {
                    return null;
                }
            case "logged-in":
                if (isActive) {
                    return (
                        <IconButton
                            onClick={async () => await onLogout()}
                            edge="start"
                            aria-label="logout"
                        >
                            <LogoutIcon color="error" />
                        </IconButton>
                    );
                } else {
                    return null;
                }
            case "logged-out":
                return null;
        }
    }

    function onRemove(session: SessionData): void {
        dispatch(removeSession({ email: session.email }));
    }

    function getListItemButton({
        session,
        activeSessionEmail,
    }: ListItemProps): JSX.Element | null {
        return (
            <ListItemButton
                disabled={session.email === activeSessionEmail}
                role={undefined}
                onClick={
                    onClick !== undefined
                        ? () => onClick(session)
                        : async () => {
                              await onChooseAccount(session);
                          }
                }
            >
                <ListItemAvatar>
                    <CustomAvatar email={session.email} />
                </ListItemAvatar>
                {/* disableTypography necessary to avoid warning: <div> cannot appear as a descendant of <p> */}
                <ListItemText
                    primary={session.email}
                    disableTypography
                    secondary={
                        <Grid
                            container
                            direction="row"
                            alignItems="center"
                            justifyContent="flex-start"
                            spacing={1}
                        >
                            <Grid>
                                <Typography
                                    color="text.secondary"
                                    variant={"body2"}
                                >
                                    {session.status}
                                </Typography>
                            </Grid>
                            <Grid>
                                {session.email === activeSessionEmail ? (
                                    <Chip
                                        size="small"
                                        label="active"
                                        color="success"
                                        variant="outlined"
                                    />
                                ) : session.status === "logged-in" ? (
                                    <Chip
                                        size="small"
                                        label="inactive"
                                        color="warning"
                                        variant="outlined"
                                    />
                                ) : null}
                            </Grid>
                        </Grid>
                    }
                ></ListItemText>
            </ListItemButton>
        );
    }

    if (component === "list") {
        return (
            <List>
                <React.Fragment>
                    {sessions.map((session) => {
                        return (
                            <ListItem
                                key={session.email}
                                sx={{ maxHeight: "60%" }}
                                secondaryAction={getSecondaryAction(
                                    session,
                                    session.email === activeSessionEmail
                                )}
                            >
                                {getListItemButton({
                                    session: session,
                                    activeSessionEmail: activeSessionEmail,
                                })}
                            </ListItem>
                        );
                    })}
                </React.Fragment>
            </List>
        );
    } else {
        return (
            <MenuList sx={{ maxHeight: "30vh", overflow: "auto" }}>
                {sessions.map((session) => {
                    return (
                        <MenuItem key={session.email} sx={{ maxHeight: "60%" }}>
                            {getListItemButton({
                                session: session,
                                activeSessionEmail: activeSessionEmail,
                            })}
                        </MenuItem>
                    );
                })}
            </MenuList>
        );
    }
}
