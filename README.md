# ZKorum

For some background, check the [organization page](https://github.com/zkorum) or visit [about.zkorum.com](https://about.zkorum.com).

## Development

### Prerequisites

Install:

- rsync
- make
- [jq](https://jqlang.github.io/jq/)
- sed
- bash
- [pnpm](https://pnpm.io/)
- [watchman](https://facebook.github.io/watchman/)
- [docker](https://www.docker.com/)

### Run in dev mode

All the components run in watch mode.

With `gnome-terminal`, you can use the following script to automatically open a terminal with one tab per service and a working tab:

```
./run_all_in_gnome_terminal_tabs.sh
```

Otherwise, open four terminals in the root directory, then run the following commands.

Shared tab - automatically rsync shared files to back and front:

```
make dev-sync
```

OpenAPI tab - automatically generate frontend stub from backends and subsequent openapi changes:

```
make dev-generate
```

Frontend tab:

```
make dev-front
```

Backend tab:

```
make dev-back
```

... and start coding!

## Services

### Front

A React PWA.

### Back

A Fastify application supported by a PostgreSQL database.

### OpenAPI

We generate an `openapi-zkorum.json` file from the backend, and then use [openapi-generator-cli](https://openapi-generator.tech/) to generate the corresponding front.

### Shared

Some typescript source files are shared directly without using npm packages - by copy-pasting using rsync.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

See [COPYING-README](COPYING-README.md)
