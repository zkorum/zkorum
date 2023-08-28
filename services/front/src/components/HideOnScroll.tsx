import useScrollTrigger from '@mui/material/useScrollTrigger'
import Slide from '@mui/material/Slide'

interface Props {
    children: React.ReactElement
    direction: 'left' | 'right' | 'up' | 'down'
}

export function HideOnScroll(props: Props) {
    // Note that you normally won't need to set the window ref as useScrollTrigger
    // will default to window.
    // This is only being set here because the demo is in an iframe.
    const trigger = useScrollTrigger()
    const { children, direction } = props

    return (
        <Slide appear={false} direction={direction} in={!trigger}>
            {children}
        </Slide>
    )
}
