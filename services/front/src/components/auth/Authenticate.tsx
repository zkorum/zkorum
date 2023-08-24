import Box from "@mui/material/Box";
import { useAppSelector } from "../../hooks";
import { AuthForm } from "./AuthForm";
import { ChooseExistingAccount } from "./ChooseExistingAccount";
import Divider from "@mui/material/Divider";
import {
  selectActiveSessionEmail,
  selectSortedSessionsData,
} from "../../store/selector";

export function Authenticate() {
  const sessionsData = useAppSelector(selectSortedSessionsData);
  const activeSessionEmail = useAppSelector(selectActiveSessionEmail);
  if (sessionsData.length === 0) {
    return <AuthForm autoFocus={true} />;
  } else {
    return (
      <Box>
        <ChooseExistingAccount
          sessions={sessionsData}
          activeSessionEmail={activeSessionEmail}
        />
        <Divider>OR</Divider>
        <AuthForm autoFocus={false} />
      </Box>
    );
  }
}
