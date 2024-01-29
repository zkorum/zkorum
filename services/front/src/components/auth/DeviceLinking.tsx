import { useAppDispatch } from "@/hooks";
import { recoverAccount } from "@/request/auth";
import type { Devices } from "@/shared/types/zod";
import { showSuccess } from "@/store/reducers/snackbar";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import React from "react";
import { accountRecoverySuccess } from "../error/message";

interface DeviceLinkingProps {
    devices?: Devices;
}

export function DeviceLinking({ devices }: DeviceLinkingProps) {
    const [isRecoveringAccount, setIsRecoveringAccount] =
        React.useState<boolean>(false);
    const dispatch = useAppDispatch();
    return (
        <Box>
            <Grid
                container
                direction="column"
                alignItems="center"
                justifyContent="center"
                mb={1}
            >
                <Grid>
                    <Typography>
                        Existing device(s) linked to this account:
                    </Typography>
                </Grid>
                <Grid>
                    <List>
                        {devices?.map((device) => {
                            return (
                                <ListItem key={device.didWrite}>
                                    <ListItemText
                                        primary={device.userAgent}
                                        secondary={`${device.didWrite.substring(
                                            0,
                                            30
                                        )}[...]`}
                                    ></ListItemText>
                                </ListItem>
                            );
                        })}
                    </List>
                </Grid>
                <Grid>
                    <Button disabled>Link device (not implemented yet)</Button>
                </Grid>
            </Grid>
            <Divider>OR</Divider>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Box sx={{ mt: 1 }}>
                    <Typography>Lost all your devices?</Typography>
                </Box>
                <Box sx={{ mt: 1 }}>
                    <LoadingButton
                        loading={isRecoveringAccount}
                        onClick={async () => {
                            try {
                                setIsRecoveringAccount(true);
                                await recoverAccount();
                                dispatch(showSuccess(accountRecoverySuccess));
                            } catch (e) {
                                throw e;
                            } finally {
                                setIsRecoveringAccount(false);
                            }
                        }} // we're explicit with email, just in case we use the wrong DID
                        color={"error"}
                    >
                        Recover your account
                    </LoadingButton>
                </Box>
            </Box>
        </Box>
    );
}
