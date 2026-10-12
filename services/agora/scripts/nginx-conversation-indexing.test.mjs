import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { test } from "node:test";

function docker(args) {
  return execFileSync("docker", args, { encoding: "utf8" }).trim();
}

test(
  "nginx excludes unlisted conversation HTML before JavaScript runs",
  { timeout: 120_000 },
  async () => {
    const directory = mkdtempSync(join(tmpdir(), "agora-indexing-"));
    const network = `agora-indexing-${process.pid}`;
    const apiName = `${network}-api`;
    const nginxName = `${network}-nginx`;
    try {
      writeFileSync(join(directory, "index.html"), "conversation shell");
      writeFileSync(
        join(directory, "api.mjs"),
        `
      import { createServer } from "node:http";
      createServer(async (request, response) => {
        if (request.method !== "POST" || request.url !== "/api/v1/conversation/indexing" || request.headers["content-type"] !== "application/json") {
          response.writeHead(400).end();
          return;
        }
        let body = "";
        for await (const chunk of request) body += chunk;
        const { conversationSlugId } = JSON.parse(body);
        if (request.headers["x-conversation-indexing"] !== undefined || request.headers.authorization !== undefined || request.headers.cookie !== undefined) {
          response.writeHead(400).end();
          return;
        }
        if (conversationSlugId === "failed") {
          response.writeHead(503).end();
          return;
        }
        if (conversationSlugId === "badstatus") {
          response.setHeader("X-Conversation-Indexing", "index");
          response.writeHead(503).end();
          return;
        }
        if (conversationSlugId === "nocontent") {
          response.setHeader("X-Conversation-Indexing", "index");
          response.writeHead(204).end();
          return;
        }
        if (conversationSlugId !== "empty") {
          response.setHeader("X-Conversation-Indexing", conversationSlugId === "listed" ? "index" : "noindex");
        }
        response.writeHead(200).end("{}");
      }).listen(8080, "0.0.0.0");
    `
      );
      docker(["network", "create", network]);
      docker([
        "run",
        "--detach",
        "--rm",
        "--name",
        apiName,
        "--network",
        network,
        "--volume",
        `${directory}:/fixtures:ro`,
        "node:24-alpine",
        "node",
        "/fixtures/api.mjs",
      ]);
      const apiAddress = docker([
        "inspect",
        "--format",
        "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}",
        apiName,
      ]);
      // A fixed mock address makes the test portable to Podman as well as Docker;
      // the production location, subrequest body, and header handling are unchanged.
      const config = readFileSync(
        new URL("../nginx.conf", import.meta.url),
        "utf8"
      ).replace(
        'set $indexing_api "http://api:8080";',
        `set $indexing_api "http://${apiAddress}:8080";`
      );
      writeFileSync(join(directory, "nginx.conf"), config);
      docker([
        "run",
        "--detach",
        "--rm",
        "--name",
        nginxName,
        "--network",
        network,
        "--publish",
        "127.0.0.1::80",
        "--volume",
        `${directory}/nginx.conf:/etc/nginx/conf.d/default.conf:ro`,
        "--volume",
        `${directory}/index.html:/usr/share/nginx/html/index.html:ro`,
        "nginx:stable-alpine",
      ]);
      const binding = docker(["port", nginxName, "80/tcp"]);
      const baseUrl = `http://${binding}`;
      let ready = false;
      for (let attempt = 0; attempt < 50; attempt += 1) {
        try {
          const response = await fetch(`${baseUrl}/conversation/listed`);
          ready = response.ok;
        } catch {
          // Wait for the container listeners and port forwarding to become ready.
        }
        if (ready) break;
        await sleep(100);
      }
      assert.ok(ready, "nginx started");

      for (const slug of [
        "listed",
        "unlisted",
        "missing",
        "empty",
        "nocontent",
      ]) {
        for (const path of [
          `/conversation/${slug}`,
          `/conversation/${slug}/?opinion=statement`,
          `/conversation/${slug}/analysis`,
          `/conversation/${slug}/embed`,
          `/conversation/${slug}/embed/analysis`,
          `/conversation/${slug}/onboarding/verify/email`,
          `/conversation/${slug}/edit`,
          `/project/test/conversation/${slug}/analysis`,
          `/project/test/conversation/${slug}/onboarding/summary`,
          `/CONVERSATION/${slug}/ANALYSIS`,
          `/PROJECT/test/CONVERSATION/${slug}/ANALYSIS`,
        ]) {
          const response = await fetch(`${baseUrl}${path}`);
          assert.equal(response.status, 200, path);
          assert.equal(
            response.headers.get("x-robots-tag"),
            slug === "listed" ? null : "noindex, nofollow",
            path
          );
          assert.match(
            response.headers.get("cache-control") ?? "",
            /no-store/,
            path
          );
          assert.equal(await response.text(), "conversation shell", path);
        }
      }
      const failed = await fetch(`${baseUrl}/conversation/failed`);
      assert.equal(failed.status, 500);
      assert.equal(failed.headers.get("x-robots-tag"), "noindex, nofollow");
      const badStatus = await fetch(`${baseUrl}/conversation/badstatus`);
      assert.equal(badStatus.status, 500);
      assert.equal(badStatus.headers.get("x-robots-tag"), "noindex, nofollow");
      const head = await fetch(`${baseUrl}/conversation/unlisted`, {
        method: "HEAD",
      });
      assert.equal(head.status, 200);
      assert.equal(head.headers.get("x-robots-tag"), "noindex, nofollow");
      assert.equal(await head.text(), "");
      const spoofed = await fetch(`${baseUrl}/conversation/unlisted`, {
        headers: {
          "X-Conversation-Indexing": "index",
          Authorization: "Bearer user-session",
          Cookie: "session=user-session",
        },
      });
      assert.equal(spoofed.status, 200);
      assert.equal(spoofed.headers.get("x-robots-tag"), "noindex, nofollow");
      const encoded = await fetch(
        `${baseUrl}/conversation/%75nlisted/analysis`
      );
      assert.equal(encoded.status, 200);
      assert.equal(encoded.headers.get("x-robots-tag"), "noindex, nofollow");
      const mixedSlug = await fetch(`${baseUrl}/CONVERSATION/Listed`);
      assert.equal(mixedSlug.status, 200);
      assert.equal(mixedSlug.headers.get("x-robots-tag"), "noindex, nofollow");
      const internal = await fetch(`${baseUrl}/_conversation-indexing`);
      assert.equal(internal.status, 404);

      docker(["stop", apiName]);
      const unavailable = await fetch(`${baseUrl}/conversation/listed`);
      assert.equal(unavailable.status, 500);
      assert.equal(
        unavailable.headers.get("x-robots-tag"),
        "noindex, nofollow"
      );
    } finally {
      for (const name of [nginxName, apiName]) {
        try {
          docker(["rm", "--force", name]);
        } catch {
          /* May already be removed. */
        }
      }
      try {
        docker(["network", "rm", network]);
      } catch {
        /* May not have been created. */
      }
      rmSync(directory, { recursive: true, force: true });
    }
  }
);
