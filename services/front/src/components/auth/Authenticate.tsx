import Box from '@mui/material/Box'
import { useAppSelector } from '../../hooks'
import { AuthForm } from './AuthForm'
import { ChooseExistingAccount } from './ChooseExistingAccount'
import Divider from '@mui/material/Divider'
import {
    selectActiveSessionEmail,
    selectSortedSessionsData,
} from '../../store/selector'
import React from 'react'

export function Authenticate() {
    const [email, setEmail] = React.useState<string>('')
    const [isEmailValid, setIsEmailValid] = React.useState<boolean>(false)
    const [emailHelper, setEmailHelper] = React.useState<string>(' ') // we must have a helper set to not change form height: https://stackoverflow.com/questions/72510035/error-message-affects-the-height-of-the-text-field-helpertext-material-ui
    const sessionsData = useAppSelector(selectSortedSessionsData)
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail)
    if (sessionsData.length === 0) {
        return (
            <AuthForm
                email={email}
                setEmail={setEmail}
                isEmailValid={isEmailValid}
                setIsEmailValid={setIsEmailValid}
                emailHelper={emailHelper}
                setEmailHelper={setEmailHelper}
                autoFocus={true}
            />
        )
    } else {
        return (
            <Box>
                <ChooseExistingAccount
                    sessions={sessionsData}
                    activeSessionEmail={activeSessionEmail}
                />
                <Divider>OR</Divider>
                <AuthForm
                    email={email}
                    setEmail={setEmail}
                    isEmailValid={isEmailValid}
                    setIsEmailValid={setIsEmailValid}
                    emailHelper={emailHelper}
                    setEmailHelper={setEmailHelper}
                    autoFocus={true}
                />
            </Box>
        )
    }
}
