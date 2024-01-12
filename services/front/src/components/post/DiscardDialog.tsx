import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

interface DiscardDialogProps {
    onDiscard?: () => void;
    onCancel?: () => void;
}

export function DiscardDialog({ onDiscard, onCancel }: DiscardDialogProps) {
    const [open, setOpen] = React.useState<boolean>(true);

    const handleClose = () => {
        if (onCancel !== undefined) {
            onCancel();
        }
        setOpen(false);
    };

    return (
        <React.Fragment>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="discard-dialog-title"
                aria-describedby="discard-dialog-description"
            >
                <DialogTitle id="discard-dialog-title">
                    {"Discard comment?"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to discard your comment?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        size="small"
                        sx={{ mx: 1 }}
                        variant="contained"
                        onClick={() => {
                            if (onCancel !== undefined) {
                                onCancel();
                            }
                            handleClose();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="small"
                        sx={{ mx: 1 }}
                        onClick={() => {
                            if (onDiscard !== undefined) {
                                onDiscard();
                            }
                            handleClose();
                        }}
                        autoFocus
                    >
                        Discard
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
