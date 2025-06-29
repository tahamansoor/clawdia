/**
 * you'll be import Clawdia
 * like ```import { Clawdia } from "@tahamansoor/clawdia";```
 * after installing it using npm install @tahamansoor/clawdia
 * don't forget to use .npmrc for now. it'll be later put on npm registry so you won't need .npmrc in future
 */

import { Clawdia } from "../clawdia";
import { Logger } from "../logger";
import { env } from "../utlis";
import { UserRouter } from "./user.router";

env.configure({
  autoReload: true, // Automatically reload environment variables if not found
  autoReloadRetryCount: 2, // Number of retries for auto-reloading
  filePath: ".env.local", // Path to the environment file
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
    connectionURI: env.get("DATABASE_URL", "postgres://postgres:password@localhost:5432/clawdia"),
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
