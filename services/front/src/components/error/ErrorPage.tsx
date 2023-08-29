import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export function ErrorPage() {
    const error = useRouteError();
    const errorMessage = getErrorMessage(error);

    function getErrorMessage(error: unknown): string {
        if (isRouteErrorResponse(error)) {
            return error.error?.message || error.statusText;
        } else if (error instanceof Error) {
            return error.message;
        } else if (typeof error === "string") {
            return error;
        } else {
            console.error(error);
            return "unknown error";
        }
    }

    return (
        <div id="error-page">
            <h1>Oops!</h1>
            <p>Sorry, an unexpected error has occurred.</p>
            <p>
                <i>{errorMessage}</i>
            </p>
        </div>
    );
}
