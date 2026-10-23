from __future__ import annotations

from botocore.exceptions import ConnectTimeoutError, ReadTimeoutError
from google.api_core.exceptions import DeadlineExceeded
from google.api_core.exceptions import RetryError as GoogleRetryError


class ProviderOutputError(RuntimeError):
    """The provider responded, but its output could not be used."""


def is_provider_output_error(error: BaseException) -> bool:
    # Follow explicit causes so a fallback outage cannot inherit a formatting
    # failure from an unrelated implicit exception context.
    seen: set[int] = set()
    current: BaseException | None = error
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        if isinstance(current, ProviderOutputError):
            return True
        current = current.__cause__
    return False


def is_provider_timeout_error(error: BaseException) -> bool:
    seen: set[int] = set()
    stack: list[BaseException] = [error]
    while stack:
        current = stack.pop()
        current_id = id(current)
        if current_id in seen:
            continue
        seen.add(current_id)

        if isinstance(
            current,
            TimeoutError | ConnectTimeoutError | DeadlineExceeded | ReadTimeoutError,
        ):
            return True

        if isinstance(current, GoogleRetryError):
            cause = current.cause
            if isinstance(cause, BaseException):
                stack.append(cause)

        if current.__cause__ is not None:
            stack.append(current.__cause__)
        if current.__context__ is not None:
            stack.append(current.__context__)

    return False
