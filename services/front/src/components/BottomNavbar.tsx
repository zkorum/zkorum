import * as React from 'react'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import HomeIcon from '@mui/icons-material/Home'
import SettingsIcon from '@mui/icons-material/Settings'
import BadgeIcon from '@mui/icons-material/Badge'
import GroupsIcon from '@mui/icons-material/Groups'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import { useNavigate } from 'react-router-dom'
import useScrollTrigger from '@mui/material/useScrollTrigger'
import { type SxProps } from '@mui/material/styles'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

enum Nav {
    Home = 'Home',
    Credentials = 'Credentials',
    Communities = 'Communities',
    Settings = 'Settings',
    Post = 'Post',
}

export function BottomNavbar() {
    const trigger = useScrollTrigger()
    const [value, setValue] = React.useState<Nav>(Nav.Home)
    const [isHidden, setIsHidden] = React.useState<boolean>(false)
    const navigate = useNavigate()

    // To place the add icon
    // https://github.com/mui/material-ui/issues/15662#issuecomment-492771975

    React.useEffect(() => {
        if (trigger) {
            setIsHidden(true)
        } else {
            setIsHidden(false)
        }
    }, [trigger])

    React.useEffect(() => {
        switch (value) {
            case Nav.Home:
                navigate('/')
                break
            case Nav.Credentials:
                navigate('/credentials')
                break
            case Nav.Communities:
                navigate('/communities')
                break
            case Nav.Settings:
                navigate('/settings')
                break
            case Nav.Post:
                // TODO => make a dialog
                break
        }
    }, [value, navigate])

    const handleChange = (_event: React.SyntheticEvent, newValue: Nav) => {
        setValue(newValue)
    }

    const showBottomNavbar: SxProps = {
        pb: 7,
    }

    const hideBottomNavbar: SxProps = {
        pb: 7,
        visibility: 'hidden',
    }

    return (
        <Box sx={isHidden ? hideBottomNavbar : showBottomNavbar}>
            <Paper
                sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
                elevation={3}
            >
                <BottomNavigation value={value} onChange={handleChange}>
                    <BottomNavigationAction
                        label={Nav.Home}
                        value={Nav.Home}
                        icon={<HomeIcon />}
                        sx={{ minWidth: '60px' }}
                    />
                    <BottomNavigationAction
                        label={Nav.Credentials}
                        value={Nav.Credentials}
                        icon={<BadgeIcon />}
                        sx={{ minWidth: '60px' }}
                    />
                    <BottomNavigationAction
                        label={Nav.Post}
                        value={Nav.Post}
                        icon={<AddCircleOutlineIcon />}
                        sx={{ minWidth: '60px' }}
                    />
                    <BottomNavigationAction
                        label={Nav.Communities}
                        value={Nav.Communities}
                        icon={<GroupsIcon />}
                        sx={{ minWidth: '60px' }}
                    />
                    <BottomNavigationAction
                        label={Nav.Settings}
                        value={Nav.Settings}
                        icon={<SettingsIcon />}
                        sx={{ minWidth: '60px' }}
                    />
                </BottomNavigation>
            </Paper>
        </Box>
    )
}
