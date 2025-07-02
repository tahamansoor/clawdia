# Clawdia: lightweight and fast back-end framework

Clawdia is a lightweight, decorator-based Node.js web framework with built-in ORM support and middleware chaining—purring with PostgreSQL (Like NestJs and Express had a baby).

## Features
- TypeScript native
- Custom decorator-based routing
- Minimal ORM (Model) with CRUD
- Middleware support
- Full typings and IntelliSense

## Quick Start

```ts
import { Clawdia, env, Logger } from "clawdia";
import { UserRouter } from "./routers/User.router";

env.configure({
  autoReload: true, // Automatically reload environment variables if not found
  autoReloadRetryCount: 2, // Number of retries for auto-reloading
  filePath: ".env", // Path to the environment file
  errorOnNotFound: true, // Throw an error if a variable is not found after retries
})

/**
 * create an instance of Clawdia
 */
const server = new Clawdia({
  port: 3003, // default port will 3003 if not prvided
  routers: [UserRouter], // list of routers
  db: {
    // database configuration
    // use env.get to get environment variables, add default values if needed
    connectionURI: env.get(
      "DATABASE_URL", "postgres://postgres:password@localhost:5432/clawdia"
    ),
    options: {
      query_timeout: 100000,
    },
  },
});

// Start the server
server
  .listen()
  .then(() => Logger.info("Server started successfully"))
  .catch((err) => Logger.error("Failed to start server:", err));

```

Look at the [example](/src/examples)

## Contributing

We welcome contributions from everyone! Please read our [contribution guidelines](CONTRIBUTING.md) before getting started.
