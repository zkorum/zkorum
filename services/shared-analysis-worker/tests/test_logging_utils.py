from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from sqlalchemy.exc import DBAPIError

from agora_analysis_worker_shared.logging_utils import database_error_summary, log_worker_error

if TYPE_CHECKING:
    import pytest


class DriverError(Exception):
    sqlstate = "08006"


def test_database_error_summary_omits_messages_and_parameters() -> None:
    secret = "database-password"
    error = DBAPIError(
        "select :password",
        {"password": secret},
        DriverError(secret),
        connection_invalidated=True,
    )

    summary = database_error_summary(error)

    assert summary == (
        "type=DBAPIError dbapi_type=DriverError connection_invalidated=true sqlstate=08006"
    )
    assert secret not in summary


def test_database_error_summary_includes_safe_constraint_location() -> None:
    class Diagnostic:
        schema_name = "public"
        table_name = "survey_aggregate_result"
        column_name = "full_count"
        constraint_name = "unsafe value with spaces"
        message_detail = "private failing row"

    class NotNullError(Exception):
        sqlstate = "23502"
        diag = Diagnostic()

    error = DBAPIError(
        "insert into survey_aggregate_result values (:secret)",
        {"secret": "private"},
        NotNullError("private"),
    )

    assert database_error_summary(error) == (
        "type=DBAPIError dbapi_type=NotNullError connection_invalidated=false "
        "sqlstate=23502 schema_name=public table_name=survey_aggregate_result "
        "column_name=full_count"
    )


def test_database_error_summary_rejects_log_injection_in_identifiers() -> None:
    class Diagnostic:
        schema_name = "public\nforged log"
        table_name = "x" * 64
        column_name = 'column"withquotes'
        constraint_name = None

    class DriverDiagnosticError(Exception):
        sqlstate = "23502"
        diag = Diagnostic()

    error = DBAPIError("secret SQL", {"private": "row"}, DriverDiagnosticError("secret"))
    assert database_error_summary(error) == (
        "type=DBAPIError dbapi_type=DriverDiagnosticError "
        "connection_invalidated=false sqlstate=23502"
    )


def test_worker_error_omits_sql_and_parameters(caplog: pytest.LogCaptureFixture) -> None:
    error = DBAPIError(
        "private SQL", {"password": "private password"}, DriverError("private error")
    )
    log_worker_error(
        logger=logging.getLogger("test-worker"),
        message="Work failed",
        error=error,
        context={"conversation_id": 10},
    )

    assert "Work failed (conversation_id=10)" in caplog.text
    assert "sqlstate=08006" in caplog.text
    assert "private" not in caplog.text
    assert caplog.records[0].exc_info is None


def test_worker_error_preserves_unexpected_exception_diagnostics(
    caplog: pytest.LogCaptureFixture,
) -> None:
    error = RuntimeError("unexpected failure")
    log_worker_error(
        logger=logging.getLogger("test-worker"),
        message="Work failed",
        error=error,
        context={"conversation_id": 10},
    )

    assert "Work failed (conversation_id=10)" in caplog.text
    assert "RuntimeError: unexpected failure" in caplog.text
    assert caplog.records[0].exc_info is not None
