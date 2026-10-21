# API dependency patches

## `postgres@3.4.9`

Tracks [porsager/postgres#1246](https://github.com/porsager/postgres/issues/1246),
which is still open. Both the Node ESM and CommonJS entry points are patched.

A TCP reset emits `error` before `close`. The transaction error handler can send
`ROLLBACK` between those events. Version 3.4.9 leaves that query pending and can
reuse the connection with stale protocol state. A subsequent vote flush then
hangs on its conversation-lock query, while PostgreSQL reports
`active / ClientRead` and other pool connections remain healthy.

The patch clears the failed active query in `error()` and rejects remaining
queries in `closed()` even when the socket already emitted an error. Clearing
the query in `errored()` instead would also affect build errors on live
connections and can break pipelining; that function deliberately stays intact.

The failure was reproduced using the original vote buffer, a real TCP-reset
proxy, PostgreSQL, and Valkey, both with and without TLS. The same recovery test
failed unpatched and passed patched. This establishes a mechanism matching the
production symptoms; it does not prove the original production reset occurred.

`tests/opinionEditing.test.ts` exercises transaction rollback, reuse of the
affected connection in a ten-connection pool, vote persistence and cancellation,
counters, exact queue cleanup, healthy sibling connections, live-connection
parameter-error pipelining, and shutdown immediately after another reset. Run it
with:

```sh
pnpm test run tests/opinionEditing.test.ts
```

When upgrading `postgres`, check whether upstream has fixed both cleanup paths,
remove the patch only when appropriate, and rerun the regression. This patch
does not address every connection failure, such as a half-open socket that
never emits an error or close event.
