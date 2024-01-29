import { WelcomePage } from "./WelcomePage";
import React from "react";
import { useAppDispatch } from "@/hooks";
import { closeAuthModal, resetPendingSession } from "@/store/reducers/session";
import { LoggedInUserMustPerformActionPage } from "./LoggedInUserMustPerformActionPage";

// Only for the pendingSessionEmail, users can't have multiple email associated to the same account for now
export interface LoggedInPageProps {
    isRegistration: boolean;
    isTheOnlyDevice: boolean;
}

export function LoggedInPage({
    isRegistration,
    isTheOnlyDevice,
}: LoggedInPageProps) {
    const [nextButtonWasClicked, setNextButtonWasClicked] =
        React.useState<boolean>(false);
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        if (!isRegistration && !isTheOnlyDevice) {
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
    } else if (isTheOnlyDevice) {
        return <LoggedInUserMustPerformActionPage />;
    } else {
        return <>This should not happen</>;
    }
}
