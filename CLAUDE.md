# Typing Speed App - Development Guidelines

## Tech Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict mode)

## Development Principles


## Bun Best Practices

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

### Bun APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile

### Frontend with Bun

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

```ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically.

## Project Structure


## Features

## UX Guidelines

## Commands

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests (quiet on success)
bun test

# Format code
bunx oxfmt --write .

# Type check
bun run typecheck
```