import { StaticRouter } from "react-router-dom/server";
import { MemoryRouter, useLocation } from "react-router-dom";
import {
    Link as RouterLink,
    type LinkProps as RouterLinkProps,
} from "react-router-dom";
import React from "react";

export function Router(props: { children?: React.ReactNode }) {
    const { children } = props;
    if (typeof window === "undefined") {
        return <StaticRouter location="/">{children}</StaticRouter>;
    }

    return <MemoryRouter>{children}</MemoryRouter>;
}

// https://mui.com/material-ui/guides/routing/#link
export const LinkBehavior = React.forwardRef<
    HTMLAnchorElement,
    Omit<RouterLinkProps, "to"> & { href: RouterLinkProps["to"] }
>((props, ref) => {
    const location = useLocation();
    const { href, ...other } = props;
    // Map href (Material UI) -> to (react-router)
    return (
        <RouterLink
            ref={ref}
            replace={href === `${location.pathname}${location.hash}`}
            to={href}
            {...other}
        />
    );
});
