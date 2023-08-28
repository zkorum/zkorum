import Menu from '@mui/material/Menu'
import React from 'react'
import IconButton from '@mui/material/IconButton'
import { useAppDispatch, useAppSelector } from '../../hooks'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import { SessionList } from './SessionList'
import {
    selectActiveSessionEmail,
    selectSortedSessionsData,
} from '../../store/selector'
import MenuItem from '@mui/material/MenuItem'
import { logout, onChooseAccount } from '../../auth/auth'
import { CustomAvatar } from './CustomAvatar'
import { openAuthModal } from '../../store/reducers/session'
import Divider from '@mui/material/Divider'
import { showError, showSuccess } from '../../store/reducers/snackbar'
import { genericError, logoutMessage } from '../error/message'
import LogoutIcon from '@mui/icons-material/Logout'

export function LoginMenu() {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }
    const handleOnClose = () => {
        setAnchorEl(null)
    }

    const dispatch = useAppDispatch()

    const sessionsData = useAppSelector(selectSortedSessionsData)
    const activeSessionEmail = useAppSelector(selectActiveSessionEmail)

    async function onLogout(): Promise<void> {
        try {
            await logout()
            dispatch(showSuccess(logoutMessage))
        } catch (e) {
            dispatch(showError(genericError))
        }
    }

    return (
        <React.Fragment>
            <Box>
                <IconButton
                    onClick={handleClick}
                    size="small"
                    aria-controls={open ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                >
                    <CustomAvatar email={activeSessionEmail} />
                </IconButton>
            </Box>
            <Menu anchorEl={anchorEl} open={open} onClose={handleOnClose}>
                <SessionList
                    onClick={async (session) => {
                        await onChooseAccount(session)
                        handleOnClose()
                    }}
                    activeSessionEmail={activeSessionEmail}
                    sessions={sessionsData}
                    component="menu"
                />
                <MenuItem>
                    <Button
                        startIcon={<AddIcon />}
                        size="small"
                        variant="text"
                        onClick={() => {
                            handleOnClose()
                            dispatch(openAuthModal())
                        }}
                    >
                        Add account
                    </Button>
                </MenuItem>
                <Divider />
                <MenuItem>
                    <Button
                        startIcon={<LogoutIcon />}
                        size="small"
                        variant="text"
                        color="error"
                        onClick={async () => {
                            await onLogout()
                        }}
                    >
                        Log out
                    </Button>
                </MenuItem>
            </Menu>
        </React.Fragment>
    )
}
