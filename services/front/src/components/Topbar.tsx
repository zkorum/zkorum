import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Unstable_Grid2/Grid2'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { HideOnScroll } from './HideOnScroll'
import Button from '@mui/material/Button'
import { openAuthModal } from '../store/reducers/session'
import { useAppDispatch, useAppSelector } from '../hooks'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import { useNavigate } from 'react-router-dom'
import { LoginMenu } from './auth/LoginMenu'
// import { ReactComponent as ZKorumIcon } from "../assets/logo.svg";
// import SvgIcon from "@mui/material/SvgIcon";

// function CustomIcon() {
//   return <ZKorumIcon style={{ height: "36px" }} />;
// }
//
export function Topbar() {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const activeSessionEmail = useAppSelector((state) => {
        return state.sessions.activeSessionEmail
    })

    return (
        <>
            <HideOnScroll direction={'down'}>
                <AppBar>
                    <Container maxWidth="xl">
                        <Toolbar disableGutters>
                            <Grid container width="100%">
                                <Grid
                                    xs
                                    display="flex"
                                    justifyContent="flex-start"
                                    alignItems="center"
                                >
                                    {activeSessionEmail === '' ? (
                                        <Button
                                            variant="contained"
                                            onClick={() =>
                                                dispatch(openAuthModal())
                                            }
                                        >
                                            Log in
                                        </Button>
                                    ) : (
                                        <LoginMenu />
                                    )}
                                </Grid>
                                <Grid
                                    xs
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    Search bar
                                </Grid>
                                <Grid
                                    xs
                                    display="flex"
                                    justifyContent="flex-end"
                                    alignItems="center"
                                >
                                    <IconButton
                                        aria-label="notifications"
                                        onClick={() =>
                                            navigate('/notifications')
                                        }
                                    >
                                        <Badge
                                            color="error"
                                            sx={{
                                                '& .MuiBadge-badge': {
                                                    right: 2,
                                                    top: 3,
                                                },
                                            }}
                                            // badgeContent={4}
                                        >
                                            <NotificationsIcon />
                                        </Badge>
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Toolbar>
                    </Container>
                </AppBar>
            </HideOnScroll>
            <Toolbar />
        </>
    )
}
