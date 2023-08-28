import Avatar from '@mui/material/Avatar'
import { ReactComponent as CustomIcon } from './assets/logo.svg'

interface ZKorumIconProps {
    iconBackgroundColor?: 'dark'
}

// TODO: improve source icon
export function ZKorumIcon(props: ZKorumIconProps) {
    const { iconBackgroundColor } = props
    return (
        <Avatar
            variant="rounded"
            sx={{
                px: '2px',
                backgroundColor: (theme) =>
                    iconBackgroundColor === 'dark'
                        ? theme.palette.primary.main
                        : 'inherit',
            }}
        >
            <CustomIcon
                style={{
                    height: '36px',
                }}
            />
        </Avatar>
    )
}
