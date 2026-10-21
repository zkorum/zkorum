# October 2026 eMudhra CA remediation

The [incident advisory](https://emudhra.we-have-a-problem.com/) describes
compromised intermediate CAs that allow HTTPS impersonation. Outbound clients
need patched trust stores even when Agora's own server certificates use another CA.

## Required versions

| Component | Minimum patched version |
| --- | --- |
| Node.js 24 | 24.22.1 |
| Python certifi | 2026.10.19 |
| uv | 0.13.4 |
| pip | 26.2.2 |
| Debian Bookworm ca-certificates | 20250419~deb12u2 |
| Debian Trixie ca-certificates | 20250419+deb13u1 |
| Alpine ca-certificates | 20261020-r0 |

Worker manifests require patched certifi, including the shared analysis package
used by math and description workers. Each worker's uv configuration temporarily
allows certifi artifacts uploaded before `2026-10-20T03:00:00Z`, which includes
the security release's wheel and source archive. This bounded exception admits
the emergency fix without exempting future certifi releases from review.
Remove the `exclude-newer-package` setting on or after 2026-10-26 UTC, once the
fix has passed the normal five-day release delay; leaving the cutoff in place would
block future certifi updates. Other dependencies keep their normal uv policy.
The existing pip-based image builds do not consume uv lockfiles or uv's
release-age settings; their manifest dependency floors still require patched
certifi.

Docker builds check the Debian CA package version or request the patched Alpine
minimum. Import and content-translation images explicitly select Trixie so their
CA package floor matches the distribution. Both build and runtime stages need
current trust stores; updating a host does not patch existing containers.

Google Translation uses gRPC, which can load roots independently of certifi and
Python's default SSL context. The five worker images containing that client set
`GRPC_DEFAULT_SSL_ROOTS_FILE_PATH=/etc/ssl/certs/ca-certificates.crt` so gRPC uses
the patched OS bundle. Both the global pip and pip in copied virtual environments
(where present) must be patched; checking only the active virtual environment
can miss the global installer.

## Local environments

Update uv using the installation method that manages it, then run
`uv sync --locked` in each Python project you use. Add `--extra dev` when development
dependencies are needed. Restart running workers after updating their environments.

For workers using Google Translation, point gRPC at the patched certifi bundle
before launching the local worker. From that worker's directory:

```bash
export GRPC_DEFAULT_SSL_ROOTS_FILE_PATH="$(.venv/bin/python -c 'import certifi; print(certifi.where())')"
```

Set this before starting the process; gRPC can cache its root store. Docker images
already configure the equivalent OS-bundle path.

Check `node --version` and `uv --version`. Restart existing Node processes after
switching runtimes; installing a new runtime does not change running processes.

Apply browser and operating-system updates separately. On macOS, the system's
revocation blocking may not cover command-line tools using `/etc/ssl/cert.pem`;
consult the advisory's macOS section for the current platform-specific remedy.

## Deployment

Rebuild and redeploy the API, conversation-email-update worker, and all six Python
workers with fresh image tags. For this remediation, pass `--pull --no-cache` to
the image build command so package-install layers are refreshed. Publish those
images and update deployment image references before recreating containers.
Rebuild frontend/build-tool images as well if their tools use older trust stores.

The source changes alone do not patch already-running production services.

## Verify in the deployed runtime

Check actual runtime and package versions inside the new containers. In Python
containers, inspect both `certifi.__version__` and the OS CA package; requests/httpx
and Python's default SSL context can use different trust stores.
Check the global installer with `/usr/local/bin/python -m pip --version` in
addition to `python -m pip --version` when the active virtual environment has pip.
Confirm the gRPC roots environment variable in images using Google Translation.

The advisory's twelve test hosts cover six TLS intermediates, each with direct
and AAA cross-signed chains. Test with the application's actual HTTP client.
These two URLs are useful spot checks:

```text
https://dv-g3b-emudhra.we-have-a-problem.com/
https://dv-g3b-aaa-emudhra.we-have-a-problem.com/
```

A certificate-validation error is the expected result. A successful HTTPS
connection means that tested chain remains trusted. A timeout or DNS failure is
inconclusive, so also check a known-good HTTPS endpoint as a positive control.
The advisory provides the full host set and downloadable chains for offline
OpenSSL verification.

The advisory's HTTPS hosts are not gRPC endpoints. A gRPC connection failure
alone is not evidence of certificate rejection: a protocol/ALPN failure can
occur before certificate validation. Verify the configured CA bundle separately
and check a known-good gRPC endpoint for transport compatibility.
