// @ts-check
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./update-agora.sh", import.meta.url));
const driver = `
docker() {
  [[ "$PWD" == "$EXPECTED_DIRECTORY" ]] || return 90
  [[ "$1" == compose && "$2" == -f && "$3" == docker-compose-production.yml ]] || return 91
  shift 3
  case "$*" in
    "up -d")
      [[ "$FAIL_STEP" != compose ]] || return 42
      stage=started
      ;;
    "exec -T nginx nginx -t")
      [[ "$stage" == started ]] || return 92
      [[ "$FAIL_STEP" != config ]] || return 43
      stage=tested
      ;;
    "exec -T nginx nginx -s reload")
      [[ "$stage" == tested ]] || return 93
      [[ "$FAIL_STEP" != reload ]] || return 44
      stage=reloaded
      ;;
    *) return 94 ;;
  esac
}
source "$1"
[[ "$stage" == reloaded ]]
`;

for (const { failure, status, description } of [
  {
    failure: "none",
    status: 0,
    description: "starts, checks and reloads in the deployment directory",
  },
  {
    failure: "compose",
    status: 42,
    description: "does not reload after startup fails",
  },
  {
    failure: "config",
    status: 43,
    description: "does not reload invalid nginx configuration",
  },
  {
    failure: "reload",
    status: 44,
    description: "reports nginx reload failure",
  },
]) {
  test(`update helper ${description}`, () => {
    const result = spawnSync(
      "bash",
      ["-c", driver, "update-helper-test", script],
      {
        cwd: tmpdir(),
        encoding: "utf8",
        timeout: 5000,
        env: {
          ...process.env,
          EXPECTED_DIRECTORY: dirname(script),
          FAIL_STEP: failure,
        },
      }
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, status, result.stderr);
  });
}
