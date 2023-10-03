import { useAppDispatch } from "@/hooks";
import type { FormsStatus } from "./LoggedInPage";
import React from "react";
import { closeAuthModal, resetPendingSession } from "@/store/reducers/session";

export interface LoggedInUserMustPerformActionPageProps {
    isTheOnlyDevice: boolean;
    formsStatus: FormsStatus;
}

export function LoggedInUserMustPerformActionPage({
    isTheOnlyDevice,
    formsStatus,
}: LoggedInUserMustPerformActionPageProps) {
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        if (
            formsStatus.hasFilledForms &&
            formsStatus.hasActiveCredential &&
            !isTheOnlyDevice
        ) {
            // this component should not have been called on first place! close the form
            dispatch(closeAuthModal());
            dispatch(resetPendingSession());
        }
    }, []);

    return <>TODO</>;
}
