import { WelcomePage } from "./WelcomePage";
import React from "react";
import { useAppDispatch } from "@/hooks";
import { closeAuthModal, resetPendingSession } from "@/store/reducers/session";
import { LoggedInUserMustPerformActionPage } from "./LoggedInUserMustPerformActionPage";

// Only for the pendingSessionEmail, users can't have multiple email associated to the same account for now
// This will need to be edited later
export interface FormsStatus {
    hasFilledForms: boolean;
    hasActiveCredential: boolean;
}

export interface LoggedInPageProps {
    isRegistration: boolean;
    isTheOnlyDevice: boolean;
    formsStatus: FormsStatus;
}

export function LoggedInPage({
    isRegistration,
    isTheOnlyDevice,
    formsStatus,
}: LoggedInPageProps) {
    const [nextButtonWasClicked, setNextButtonWasClicked] =
        React.useState<boolean>(false);
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        if (
            formsStatus.hasFilledForms &&
            formsStatus.hasActiveCredential &&
            !isRegistration &&
            !isTheOnlyDevice
        ) {
            // this component should not have been called on first place! close the form
            dispatch(closeAuthModal());
            dispatch(resetPendingSession());
        }
    }, []);

    if (isRegistration && !nextButtonWasClicked) {
        return (
            <WelcomePage
                onNextButtonClicked={() => setNextButtonWasClicked(true)}
            />
        );
    } else if (
        isTheOnlyDevice ||
        formsStatus.hasActiveCredential ||
        formsStatus.hasFilledForms
    ) {
        return (
            <LoggedInUserMustPerformActionPage
                isTheOnlyDevice={isTheOnlyDevice}
                formsStatus={formsStatus}
            />
        );
    } else {
        return <>This should not happen</>;
    }
}
