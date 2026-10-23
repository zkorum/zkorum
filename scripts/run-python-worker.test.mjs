import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./run-python-worker.sh", import.meta.url));

const fakeUv = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] !== "run" || args[1] !== "python") process.exit(90);
if (args[2] === "-c") {
  if (process.env.FAIL_DISCOVERY === "1") process.exit(42);
  process.stdout.write(process.env.CERTIFI_PATH + "\\n");
} else if (args[2] === "-m") {
  process.stdout.write(JSON.stringify({
    roots: process.env.GRPC_DEFAULT_SSL_ROOTS_FILE_PATH,
    args: args.slice(3),
  }));
  process.exit(Number(process.env.WORKER_EXIT));
} else {
  process.exit(91);
}
`;

for (const scenario of [
  {
    name: "uses certifi before launching and preserves module arguments",
    roots: "",
    expectedRoots: "/patched certificates/cacert.pem",
    failDiscovery: "0",
    workerExit: "0",
    expectedStatus: 0,
  },
  {
    name: "preserves an explicitly configured trust bundle",
    roots: "/custom certificates/roots.pem",
    expectedRoots: "/custom certificates/roots.pem",
    failDiscovery: "1",
    workerExit: "0",
    expectedStatus: 0,
  },
  {
    name: "does not launch with bundled gRPC roots when certifi lookup fails",
    roots: "",
    failDiscovery: "1",
    workerExit: "0",
    expectedStatus: 42,
  },
  {
    name: "propagates the worker exit status",
    roots: "",
    expectedRoots: "/patched certificates/cacert.pem",
    failDiscovery: "0",
    workerExit: "43",
    expectedStatus: 43,
  },
]) {
  test(`Python worker launcher ${scenario.name}`, (context) => {
    const directory = mkdtempSync(join(tmpdir(), "agora-python-tls-"));
    context.after(() => rmSync(directory, { recursive: true, force: true }));
    writeFileSync(join(directory, "uv"), fakeUv, { mode: 0o755 });
    const result = spawnSync("sh", [script, "worker.module", "argument with spaces"], {
      encoding: "utf8",
      timeout: 5000,
      env: {
        ...process.env,
        PATH: `${directory}:${process.env.PATH ?? ""}`,
        GRPC_DEFAULT_SSL_ROOTS_FILE_PATH: scenario.roots,
        CERTIFI_PATH: "/patched certificates/cacert.pem",
        FAIL_DISCOVERY: scenario.failDiscovery,
        WORKER_EXIT: scenario.workerExit,
      },
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, scenario.expectedStatus, result.stderr);
    if (scenario.expectedRoots === undefined) {
      assert.equal(result.stdout, "");
    } else {
      assert.deepEqual(JSON.parse(result.stdout), {
        roots: scenario.expectedRoots,
        args: ["worker.module", "argument with spaces"],
      });
    }
  });
}

test("Python worker launcher requires a module", () => {
  const result = spawnSync("sh", [script], { encoding: "utf8", timeout: 5000 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage:/);
});
