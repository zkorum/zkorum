"""Parse Python sources without importing or executing application code."""

from __future__ import annotations

import ast
import json
import re
import sys
from typing import TYPE_CHECKING, Literal, TypedDict, TypeGuard

if TYPE_CHECKING:
    from collections.abc import Mapping

DYNAMIC_SQL_EXPRESSION = "__dynamic_sql_expression__"


class PolicySource(TypedDict):
    path: str
    source: str


class DeleteFinding(TypedDict):
    line: int
    operation: Literal["SQLAlchemy delete", "Python .delete"]


class SqlLiteral(TypedDict):
    line: int
    source: str


class SourceResult(TypedDict):
    path: str
    deletes: list[DeleteFinding]
    literals: list[SqlLiteral]


def is_object_list(value: object) -> TypeGuard[list[object]]:
    return isinstance(value, list)


def is_object_record(value: object) -> TypeGuard[Mapping[object, object]]:
    return isinstance(value, dict)


def parse_sources(raw: object) -> list[PolicySource]:
    if not is_object_list(raw):
        raise ValueError("Policy input must be an array of source records")
    sources: list[PolicySource] = []
    for value in raw:
        if not is_object_record(value):
            raise ValueError("Policy source must be an object")
        path = value.get("path")
        source = value.get("source")
        if not isinstance(path, str) or not isinstance(source, str):
            raise ValueError("Policy source path and content must be strings")
        sources.append({"path": path, "source": source})
    return sources


def symbol_origin(*, node: ast.expr, symbols: dict[str, str]) -> str | None:
    if isinstance(node, ast.Name):
        return symbols.get(node.id)
    if isinstance(node, ast.Attribute):
        parent = symbol_origin(node=node.value, symbols=symbols)
        return None if parent is None else f"{parent}.{node.attr}"
    if isinstance(node, ast.Call):
        return symbol_origin(node=node.func, symbols=symbols)
    return None


def string_value(node: ast.expr) -> str | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.JoinedStr):
        parts: list[str] = []
        for part in node.values:
            value = (
                string_value(part.value)
                if isinstance(part, ast.FormattedValue)
                else string_value(part)
            )
            parts.append(value if value is not None else DYNAMIC_SQL_EXPRESSION)
        return "".join(parts)
    if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
        left, right = string_value(node.left), string_value(node.right)
        return (
            None
            if left is None and right is None
            else (
                (left if left is not None else DYNAMIC_SQL_EXPRESSION)
                + (right if right is not None else DYNAMIC_SQL_EXPRESSION)
            )
        )
    return None


def compound_string(node: ast.AST | None) -> bool:
    return isinstance(node, (ast.JoinedStr, ast.FormattedValue)) or (
        isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add)
    )


def inspect_python(source: PolicySource) -> SourceResult:
    tree = ast.parse(source["source"], filename=source["path"])
    nodes = list(ast.walk(tree))
    parents = {child: node for node in nodes for child in ast.iter_child_nodes(node)}
    symbols: dict[str, str] = {}
    for node in nodes:
        if isinstance(node, ast.ImportFrom) and node.module is not None:
            for alias in node.names:
                symbols[alias.asname or alias.name] = f"{node.module}.{alias.name}"
        elif isinstance(node, ast.Import):
            for alias in node.names:
                symbols[alias.asname or alias.name.split(".")[0]] = (
                    alias.name if alias.asname else alias.name.split(".")[0]
                )
    for node in nodes:
        if isinstance(node, ast.Assign):
            origin = symbol_origin(node=node.value, symbols=symbols)
            if origin is not None:
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        symbols[target.id] = origin
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            origin = (
                symbol_origin(node=node.value, symbols=symbols) if node.value is not None else None
            )
            if origin is None:
                origin = symbol_origin(node=node.annotation, symbols=symbols)
            if origin is not None:
                symbols[node.target.id] = origin
        elif isinstance(node, ast.arg) and node.annotation is not None:
            origin = symbol_origin(node=node.annotation, symbols=symbols)
            if origin is not None:
                symbols[node.arg] = origin

    deletes: list[DeleteFinding] = []
    literals: list[SqlLiteral] = []
    for node in nodes:
        if isinstance(node, ast.Call):
            origin = symbol_origin(node=node.func, symbols=symbols)
            if (
                origin is not None
                and origin.startswith("sqlalchemy.")
                and origin.rsplit(".", 1)[-1] in {"delete", "Delete"}
            ):
                deletes.append({"line": node.lineno, "operation": "SQLAlchemy delete"})
            elif isinstance(node.func, ast.Attribute) and node.func.attr == "delete":
                receiver = symbol_origin(node=node.func.value, symbols=symbols)
                # Valkey/Redis deletion acknowledges ephemeral queue/cache state, not SQL rows.
                if receiver is None or not receiver.startswith(("valkey.", "redis.")):
                    deletes.append({"line": node.lineno, "operation": "Python .delete"})
        if not isinstance(node, ast.expr) or compound_string(parents.get(node)):
            continue
        if isinstance(parents.get(node), ast.Expr) and isinstance(node, ast.Constant):
            continue
        value = string_value(node)
        if value is not None and re.search(
            r"\b(?:delete|truncate|drop|execute|create|do)\b", value, re.IGNORECASE
        ):
            literals.append({"line": node.lineno, "source": value})
    return {"path": source["path"], "deletes": deletes, "literals": literals}


if __name__ == "__main__":
    raw: object = json.load(sys.stdin)
    json.dump([inspect_python(source) for source in parse_sources(raw)], sys.stdout)
