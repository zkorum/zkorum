import { StaticRouter } from 'react-router-dom/server'
import { MemoryRouter } from 'react-router-dom'

export function Router(props: { children?: React.ReactNode }) {
    const { children } = props
    if (typeof window === 'undefined') {
        return <StaticRouter location="/">{children}</StaticRouter>
    }

    return <MemoryRouter>{children}</MemoryRouter>
}
