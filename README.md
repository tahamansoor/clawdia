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
import { Clawdia } from "clawdia";
import { UserRouter } from "./routers/User.router";

const app = new Clawdia({
  port: 3003,
  db: { connectionURI: process.env.DB_URI! },
  routers: [UserRouter],
});

app.listen();
```

Look at the [example](/src/examples)

## Contributing

We welcome contributions from everyone! Please read our [contribution guidelines](CONTRIBUTION.md) before getting started.
